import { app, shell, BrowserWindow, ipcMain, screen, clipboard, dialog } from 'electron'
import { createMainWindow } from './windows/mainWindow'
import { createFloatBarWindow, getFloatBarWindow } from './windows/floatBar'
import { writeFile, readFile, mkdir, rm, rename } from 'fs/promises'
import { createHash } from 'crypto'
import { existsSync } from 'fs'
import { join } from 'path'

// 悬浮条形态切换动画的定时器（全局唯一，避免连续切换时多个动画并存互相打架）
let levelAnimTimer: NodeJS.Timeout | null = null

// 固定用户数据目录名。
// 默认情况下 userData 取 productName（打包后是「Musy桌面助手」），与开发态的
// package.json name（musy-desktop-assist）不一致，会导致开发时攒的数据在安装版里「消失」，
// 也会让单实例锁失效（两个不同的 userData 目录可以同时跑两份）。这里统一钉死。
// （MUSY_USER_DATA 仅供开发/截图时指定独立数据目录，普通使用不会设置）
app.setPath(
  'userData',
  process.env.MUSY_USER_DATA || join(app.getPath('appData'), 'musy-desktop-assist')
)

// 应用单实例锁
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
}

function bootstrap(): void {
  app.setAppUserModelId('com.musy.desktop-assist')

  // 创建迷你悬浮条
  createFloatBarWindow()

  // 展开主窗口按需创建（首次点击悬浮条时创建）
  // 注意：必须返回可序列化的值。直接 `() => createMainWindow()` 会把 BrowserWindow
  // 对象作为 IPC 返回值，Electron 无法结构化克隆，渲染进程 invoke 会直接 reject。
  ipcMain.handle('window:open-main', () => {
    createMainWindow()
    return true
  })

  // 退出应用（悬浮窗没有系统托盘，标题栏需要有显式退出入口，否则进程会常驻后台无法关闭）
  ipcMain.handle('app:quit', () => {
    app.quit()
  })

  ipcMain.handle('window:open-external', (_e, url: string) => {
    if (url && /^https?:\/\//.test(url)) {
      shell.openExternal(url)
    }
  })

  // 读取系统剪贴板文本（一键收藏剪贴板链接用）
  ipcMain.handle('clipboard:read-text', () => clipboard.readText())

  // 选择本地数据保存文件夹
  // 起始目录用系统「文档」目录：不能硬编码 D:\\，否则没有 D 盘的机器上对话框起始路径失效
  ipcMain.handle('data:choose-folder', async () => {
    try {
      // 不挂父窗口：悬浮球是 alwaysOnTop 无边框小窗，挂上面系统对话框可能弹不出/被遮挡
      const res = await dialog.showOpenDialog({
        title: '选择数据保存文件夹',
        defaultPath: app.getPath('documents'),
        properties: ['openDirectory', 'createDirectory']
      })
      if (res.canceled || res.filePaths.length === 0) return null
      return res.filePaths[0]
    } catch (err) {
      console.error('[data:choose-folder] failed:', err)
      return null
    }
  })

  // 选择本地语言包 JSON 文件并读取内容（自定义语言包）
  ipcMain.handle('language:pick-file', async () => {
    try {
      const res = await dialog.showOpenDialog({
        title: '选择语言包文件（JSON）',
        defaultPath: app.getPath('documents'),
        properties: ['openFile'],
        filters: [{ name: 'JSON 语言包', extensions: ['json'] }]
      })
      if (res.canceled || res.filePaths.length === 0) return null
      try {
        return await readFile(res.filePaths[0], 'utf-8')
      } catch (err) {
        console.error('[language:pick-file] failed:', err)
        return null
      }
    } catch (err) {
      console.error('[language:pick-file] dialog failed:', err)
      return null
    }
  })

  ipcMain.handle('data:pick-backup', async () => {
    const res = await dialog.showOpenDialog({
      title: '导入 Musy 数据备份',
      defaultPath: app.getPath('documents'),
      properties: ['openFile'],
      filters: [{ name: 'Musy JSON 备份', extensions: ['json'] }]
    })
    if (res.canceled || !res.filePaths[0]) return null
    return readFile(res.filePaths[0], 'utf-8')
  })

  // 把全部数据（JSON）写入指定文件夹
  let saveQueue: Promise<unknown> = Promise.resolve()
  ipcMain.handle('data:save', async (_e, folder: string, json: string) => {
    if (!folder || typeof folder !== 'string' || typeof json !== 'string') return false
    const job = saveQueue.then(async () => {
      const target = join(folder, 'musy-data.json')
      const temp = `${target}.${process.pid}.tmp`
      try {
        await writeFile(temp, json, 'utf-8')
        await rename(temp, target)
        return true
      } catch (err) {
        console.error('[data:save] failed:', err)
        await rm(temp, { force: true }).catch(() => undefined)
        return false
      }
    })
    saveQueue = job
    return job
  })

  // === 从网站自身获取 favicon，并使用独立缓存版本 ===
  const faviconDir = join(app.getPath('userData'), 'favicons-v2')
  const legacyFaviconDir = join(app.getPath('userData'), 'favicons')
  const genericFaviconHash = 'f594faa8f108ab9610dac7541200eadcaf558bd8944dc57e28f411a9a060ea9e'
  const faviconInFlight = new Map<string, Promise<string | null>>()

  const isGenericFavicon = (buf: Buffer): boolean => {
    if (createHash('sha256').update(buf).digest('hex') === genericFaviconHash) return true
    const svg = buf.subarray(0, 1024).toString('utf8')
    return /<svg\b/i.test(svg) &&
      /<circle\b[^>]*fill=["']#808080["']/i.test(svg) &&
      /<text\b[^>]*>\s*f\s*<\/text>/i.test(svg)
  }

  /**
   * 按魔数判断字节流是否真的是图片。
   * 关键：不少网站（如 neriandhu.com）对任意路径都返回首页 HTML（SPA 回退，200 + text/html），
   * 若把 HTML 当图标缓存下来，渲染层 <img> 就会裂开。这类内容必须丢弃。
   */
  const sniffImage = (b: Buffer): string | null => {
    if (b.length < 16) return null
    if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
    if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
    if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return 'image/gif'
    if (b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP')
      return 'image/webp'
    if (b[0] === 0x42 && b[1] === 0x4d) return 'image/bmp'
    if (b[0] === 0x00 && b[1] === 0x00 && (b[2] === 0x01 || b[2] === 0x02) && b[3] === 0x00)
      return 'image/x-icon' // ICO / CUR
    // SVG：可能有 BOM / XML 声明 / 注释，只要前 400 字节里出现 <svg 根标签即认
    const head = b.subarray(0, 400).toString('utf8').replace(/^\uFEFF/, '').trimStart()
    if (head.startsWith('<')) {
      const lower = head.toLowerCase()
      if (lower.includes('<svg')) return 'image/svg+xml'
      return null // 其它 HTML/XML → 不是图片
    }
    return null
  }

  // 读缓存并转 data URI（dev 下渲染页面是 http://localhost，加载 file:// 图片会被 Chromium 拦截，必须用 data URI）
  const toDataUri = async (file: string): Promise<string | null> => {
    try {
      const buf = await readFile(file)
      const mime = sniffImage(buf)
      if (!mime) return null // 损坏/非图片（旧版本可能缓存了 HTML）
      return `data:${mime};base64,${buf.toString('base64')}`
    } catch {
      return null
    }
  }

  // Resolve icon links declared in the page, including relative URLs and unquoted attributes.
  const iconUrlsFromHtml = (html: string, pageUrl: string): string[] => {
    const urls: string[] = []
    for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
      const attrs = new Map<string, string>()
      for (const match of tag.matchAll(/([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
        attrs.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4])
      }
      if (!/(?:^|\s)(?:icon|apple-touch-icon|apple-touch-icon-precomposed)(?:\s|$)/i.test(attrs.get('rel') ?? '')) continue
      const href = attrs.get('href')
      if (!href) continue
      try {
        const resolved = new URL(href.replace(/&amp;/g, '&'), pageUrl)
        if (resolved.protocol === 'http:' || resolved.protocol === 'https:') urls.push(resolved.href)
      } catch { /* Ignore invalid icon URLs. */ }
    }
    return urls
  }

  ipcMain.handle('favicon:get', async (_e, url: string) => {
    if (!url) return null
    let host = ''
    let origin = ''
    try {
      const u = new URL(url)
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
      host = u.hostname.toLowerCase()
      origin = u.origin
    } catch {
      return null
    }
    // 缓存文件：host 的 md5 作为文件名，避免非法字符
    const file = join(faviconDir, `${createHash('md5').update(host).digest('hex')}.ico`)
    const legacyFile = join(legacyFaviconDir, `${createHash('md5').update(host).digest('hex')}.ico`)

    if (existsSync(file)) {
      const uri = await toDataUri(file)
      if (uri) return uri
      // 缓存损坏（空/HTML/读失败）→ 删掉重新下载
      try {
        await rm(file)
      } catch {
        /* ignore */
      }
    }
    // Keep genuine icons already downloaded by older versions, but discard the
    // generic "f" SVG that prompted this cache migration.
    if (existsSync(legacyFile)) {
      try {
        const old = await readFile(legacyFile)
        const mime = sniffImage(old)
        if (mime && !isGenericFavicon(old)) {
          await mkdir(faviconDir, { recursive: true })
          await writeFile(file, old)
          return `data:${mime};base64,${old.toString('base64')}`
        }
      } catch { /* Retry from the website. */ }
    }
    // 去重：同一 host 并发请求只下载一次
    if (faviconInFlight.has(host)) {
      return faviconInFlight.get(host)
    }
    const p = (async (): Promise<string | null> => {
      try {
        // 用系统 fetch（Electron 31 内置，Node 18+），走主进程网络栈，避免渲染进程 CSP/代理差异
        // Prefer the page's own icon declaration, then the site's standard path.
        // The aggregator is a fallback for sites that block direct requests.
        const sources: string[] = []
        try {
          const page = await fetch(origin, { signal: AbortSignal.timeout(4000) })
          if (page.ok && Number(page.headers.get('content-length') ?? 0) < 512_000) {
            sources.push(...iconUrlsFromHtml((await page.text()).slice(0, 512_000), page.url))
          }
        } catch { /* Try conventional paths when the homepage is unavailable. */ }
        sources.push(
          `${origin}/favicon.ico`,
          `https://favicon.im/${host}?larger=true`,
          `${origin}/favicon.png`,
          `${origin}/apple-touch-icon.png`,
          `${origin}/apple-touch-icon-precomposed.png`
        )
        // The aggregator recovers icons when a site blocks Electron requests;
        // reject its known generic "f" placeholder before caching.
        for (const src of new Set(sources)) {
          try {
            const res = await fetch(src, { signal: AbortSignal.timeout(4000) })
            if (!res.ok) continue
            if (Number(res.headers.get('content-length') ?? 0) > 1_000_000) continue
            const buf = Buffer.from(await res.arrayBuffer())
            if (buf.length > 1_000_000) continue
            const mime = sniffImage(buf)
            if (!mime) continue // 非图片（如 SPA 回退返回的 HTML）→ 换下一个源
            if (src.startsWith('https://favicon.im/') && isGenericFavicon(buf)) continue
            await mkdir(faviconDir, { recursive: true })
            await writeFile(file, buf)
            return `data:${mime};base64,${buf.toString('base64')}`
          } catch {
            /* 尝试下一个源 */
          }
        }
        return null
      } finally {
        faviconInFlight.delete(host)
      }
    })()
    faviconInFlight.set(host, p)
    return p
  })

  // === 网站简介 AI 总结（OpenAI 兼容接口，主进程网络栈调用，仅主进程持有 Key） ===
  ipcMain.handle(
    'ai:summarize',
    async (
      _e,
      opts: { baseUrl: string; apiKey: string; model: string; url: string }
    ): Promise<string | null> => {
      if (!opts?.url || !opts?.apiKey || !opts?.baseUrl || !opts?.model) return null
      try {
        const base = opts.baseUrl.replace(/\/+$/, '')
        const res = await fetch(`${base}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${opts.apiKey}`
          },
          body: JSON.stringify({
            model: opts.model,
            messages: [
              {
                role: 'system',
                content:
                  '你是一个网站简介助手。根据网站地址和名称，用一句简短的中文（不超过 18 个字）概括这个网站是干什么的、面向谁。只输出这一句话，不要任何前缀、标点解释或换行。'
              },
              {
                role: 'user',
                content: `请概括这个网站：${opts.url}`
              }
            ],
            temperature: 0.3,
            max_tokens: 60
          }),
          signal: AbortSignal.timeout(15000)
        })
        if (!res.ok) {
          console.error('[ai:summarize] http', res.status)
          return null
        }
        const data = (await res.json()) as {
          choices?: { message?: { content?: string } }[]
        }
        const text = data.choices?.[0]?.message?.content?.trim() ?? ''
        // 只保留第一行、去首尾空白，兜底截断
        const line = text.split('\n')[0].replace(/^["“「]+|["”」]+$/g, '').trim()
        return line.slice(0, 40) || null
      } catch (err) {
        console.error('[ai:summarize] failed:', err)
        return null
      }
    }
  )

  // === 提示词改写（OpenAI 兼容接口，模式：改写/扩写/精简/翻译） ===
  ipcMain.handle(
    'ai:rewrite-prompt',
    async (
      _e,
      opts: { baseUrl: string; apiKey: string; model: string; prompt: string; mode: string }
    ): Promise<string | null> => {
      if (!opts?.prompt || !opts?.apiKey || !opts?.baseUrl || !opts?.model) return null
      const modeMap: Record<string, string> = {
        rewrite: '保持原意，用更专业、更具描述性的英文重写这段文生图提示词，增强画面细节与风格表达',
        expand: '扩写这段文生图提示词，补充光线、材质、构图、镜头、氛围等细节，使其更丰富完整',
        concise: '精简这段文生图提示词，去掉冗余，保留核心主体与关键风格词',
        translate: '把这段文生图提示词翻译成英文（如果是英文则翻译成中文）'
      }
      const instruction = modeMap[opts.mode] ?? modeMap.rewrite
      try {
        const base = opts.baseUrl.replace(/\/+$/, '')
        const res = await fetch(`${base}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${opts.apiKey}`
          },
          body: JSON.stringify({
            model: opts.model,
            messages: [
              {
                role: 'system',
                content: `你是一个文生图提示词专家。${instruction}。只输出改写后的提示词正文，不要任何解释、前缀、引号或换行。`
              },
              { role: 'user', content: opts.prompt }
            ],
            temperature: 0.7,
            max_tokens: 500
          }),
          signal: AbortSignal.timeout(30000)
        })
        if (!res.ok) {
          console.error('[ai:rewrite-prompt] http', res.status)
          let detail = ''
          try {
            const body = (await res.json()) as { error?: { message?: string } }
            detail = body?.error?.message ?? ''
          } catch {
            detail = ''
          }
          return `ERROR:HTTP ${res.status}${detail ? ` - ${detail}` : ''}`
        }
        const data = (await res.json()) as {
          choices?: { message?: { content?: string } }[]
        }
        const text = data.choices?.[0]?.message?.content?.trim() ?? ''
        if (!text) return 'ERROR:EMPTY_RESPONSE'
        return text.replace(/^["“「]+|["”」]+$/g, '').trim()
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[ai:rewrite-prompt] failed:', err)
        return `ERROR:${msg}`
      }
    }
  )

  // 悬浮条拖拽移动
  ipcMain.handle('floatbar:move', (_e, deltaX: number, deltaY: number) => {
    const bar = getFloatBarWindow()
    if (!bar || bar.isDestroyed()) return
    const [x, y] = bar.getPosition()
    bar.setPosition(x + deltaX, y + deltaY, false)
  })

  // 悬浮条三级形态：
  // L1 最小球 64×64 → L2 功能胶囊 320×64 → L3 完整面板 760×560
  // 左边缘 + 顶部锚定：向右加宽（出现标题栏）、向下加高展开面板，球体位置不动
  // L3 展开顺序：先向右加宽，再向下展开功能面板；收起反之
  ipcMain.handle('floatbar:set-level', (_e, level: number) => {
    const bar = getFloatBarWindow()
    if (!bar || bar.isDestroyed()) return
    const sizes: Record<number, { w: number; h: number }> = {
      1: { w: 64, h: 64 },
      2: { w: 296, h: 64 }, // 球59 + 胶囊内容234，完整容纳 5 图标
      3: { w: 760, h: 560 },
      4: { w: 760, h: 980 } // L4：提示词工作区（L3 面板 + 下方母子提示词区）
    }
    // 小屏钳制：L4 高度不超过工作区可用高度（留 12px 余量）
    if (level === 4) {
      const { workArea } = screen.getPrimaryDisplay()
      const maxH = workArea.height - 12
      if (maxH < sizes[4].h) sizes[4] = { w: 760, h: Math.max(560, maxH) }
    }
    const target = sizes[level] ?? sizes[1]
    const bounds = bar.getBounds()
    let x = bounds.x
    let y = bounds.y
    const startW = bounds.width
    const startH = bounds.height
    if (Math.abs(startW - target.w) < 1 && Math.abs(startH - target.h) < 1) return

    // 展开越界钳制：向右/向下扩展时若超出工作区，则向左/向上回退，保证面板完整可见
    if (target.w > startW || target.h > startH) {
      const { workArea } = screen.getPrimaryDisplay()
      if (x + target.w > workArea.x + workArea.width) {
        x = workArea.x + workArea.width - target.w
      }
      if (y + target.h > workArea.y + workArea.height) {
        y = workArea.y + workArea.height - target.h
      }
    }

    // 分步序列：展开时先宽后高；收起时先高后宽
    const seq: { w: number; h: number; dur: number }[] = []
    const needW = Math.abs(startW - target.w) >= 1
    const needH = Math.abs(startH - target.h) >= 1
    const expanding = target.w > startW
    if (expanding) {
      if (needW) seq.push({ w: target.w, h: startH, dur: 280 })
      if (needH) seq.push({ w: target.w, h: target.h, dur: 260 })
    } else {
      if (needH) seq.push({ w: startW, h: target.h, dur: 240 })
      if (needW) seq.push({ w: target.w, h: target.h, dur: 280 })
    }

    const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4)
    let step = 0
    let from = { w: startW, h: startH }
    let stepStart = performance.now()

    // 注意：主进程是 Node 环境，没有 requestAnimationFrame，用 setInterval 驱动
    // 开始新动画前先停掉上一个，避免多次快速切换时多个定时器同时 setBounds 造成抖动
    if (levelAnimTimer) {
      clearInterval(levelAnimTimer)
      levelAnimTimer = null
    }
    const timer = setInterval(() => {
      if (!bar || bar.isDestroyed()) {
        clearInterval(timer)
        if (levelAnimTimer === timer) levelAnimTimer = null
        return
      }
      const cur = seq[step]
      const t = Math.min((performance.now() - stepStart) / cur.dur, 1)
      const e = easeOutQuart(t)
      const w = Math.round(from.w + (cur.w - from.w) * e)
      const h = Math.round(from.h + (cur.h - from.h) * e)
      // 左边缘 + 顶部固定，向右/向下扩展
      bar.setBounds({ x, y, width: w, height: h })
      if (t >= 1) {
        step++
        if (step >= seq.length) {
          clearInterval(timer)
          if (levelAnimTimer === timer) levelAnimTimer = null
          return
        }
        from = { w: cur.w, h: cur.h }
        stepStart = performance.now()
      }
    }, 16)
    levelAnimTimer = timer
  })

  // 最小化到任务栏：临时显示任务栏图标再最小化，点击任务栏图标即可恢复
  ipcMain.handle('floatbar:minimize-to-taskbar', () => {
    const bar = getFloatBarWindow()
    if (!bar || bar.isDestroyed()) return
    bar.setSkipTaskbar(false)
    bar.setAlwaysOnTop(false)
    bar.minimize()
  })

  // 从任务栏恢复后：重新回到「置顶 + 不占任务栏」的悬浮状态
  ipcMain.handle('floatbar:restore-from-taskbar', () => {
    const bar = getFloatBarWindow()
    if (!bar || bar.isDestroyed()) return
    bar.setAlwaysOnTop(true, 'screen-saver')
    bar.setSkipTaskbar(true)
  })

  // 全局鼠标位置推送：整个桌面范围内鼠标在哪，悬浮条眼睛就看哪
  // 用 16ms（≈60fps）轮询 screen.getCursorScreenPoint 推给悬浮条渲染进程
  const cursorTimer = setInterval(() => {
    const bar = getFloatBarWindow()
    if (!bar || bar.isDestroyed()) return
    const point = screen.getCursorScreenPoint()
    bar.webContents.send('cursor:global', { x: point.x, y: point.y })
  }, 16)
  cursorTimer.unref?.()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createFloatBarWindow()
    }
  })
}

// 再次启动已运行的实例：把已存在的悬浮条唤到前台（最小化时需先 restore，否则 focus 无效）
app.on('second-instance', () => {
  const bar = getFloatBarWindow()
  if (!bar || bar.isDestroyed()) {
    createFloatBarWindow()
    return
  }
  if (bar.isMinimized()) bar.restore()
  if (!bar.isVisible()) bar.show()
  bar.focus()
})

app.whenReady().then(() => {
  app.setAppUserModelId('com.musy.desktop-assist')
  bootstrap()
})

app.on('window-all-closed', () => {
  // 本项目没有系统托盘：所有窗口关闭后必须真正退出，
  // 否则会留下无窗口、无图标的幽灵进程，用户只能去任务管理器杀进程。
  // 注意：悬浮条最小化到任务栏不算 closed，不会被这里误杀。
  app.quit()
})

// 获取主显示器工作区尺寸，供悬浮条定位
ipcMain.handle('screen:work-area', () => {
  const { workArea } = screen.getPrimaryDisplay()
  return workArea
})
