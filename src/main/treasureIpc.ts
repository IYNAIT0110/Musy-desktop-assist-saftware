import { translateMessage, validLocale } from '../shared/uiMessages'
import { app, ipcMain, dialog, shell, clipboard, nativeImage, BrowserWindow } from 'electron'
import { readFile, writeFile, mkdir, stat } from 'fs/promises'
import { join, resolve, basename, isAbsolute } from 'path'
import { randomUUID, createHash } from 'crypto'
import { TreasureStore, atomicJson, validateCatalog } from './treasureStore'
import { importTreasureClipboard, windowsClipboardFiles, persistCollectedImage } from './treasureClipboard'
import { readEmbeddedPreview } from './embeddedPreviews'
import { grasshopperPreview } from './grasshopperPreview'
import { createSystemThumbnailReader } from './systemThumbnail'
import { createTreasurePreviewWindows } from './treasurePreviewWindows'
import { resolveDragFiles } from './treasureReuse'
import type { TreasureDrop } from '../shared/treasure'
import type { AssetPatch, AssetQuery, TreasureStatus } from '../shared/treasure'

export function registerTreasureIpc(): void {
  const settings = join(app.getPath('userData'), 'treasure-settings.json')
  let current: TreasureStore | null = null
  let loadPromise: Promise<TreasureStore | null> | null = null
  let switching = false
  let thumbnailQueue: Promise<unknown> = Promise.resolve()
  const thumbnails = new Map<string, Promise<string | null>>()
  const missingThumbnails = new Map<string, number>()
  const previewExtensions = new Set('jpg jpeg png webp bmp gif tif tiff psd psb 3dm 3dmbak dwg dxf bak skp skb gh ghx ppt pptx potx ppsx doc docx xls xlsx pdf ai eps mp4 mov webm avi mkv'.split(' '))
  const systemThumbnail = createSystemThumbnailReader()
  const previewWindows = createTreasurePreviewWindows()
  const fit = (image: Electron.NativeImage, maximum: number): Electron.NativeImage => {
    const { width, height } = image.getSize()
    const ratio = Math.min(1, maximum / width, maximum / height)
    return ratio < 1 ? image.resize({ width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) }) : image
  }
  let quitting = false
  app.on('before-quit', event => {
    if (!current?.busy || quitting) return
    event.preventDefault()
    quitting = true
    current.cancel()
    void current.waitForImport().finally(() => app.quit())
  })
  const empty: TreasureStatus = { path: null, count: 0, trashCount: 0, groups: [], roots: [] }

  const get = async (): Promise<TreasureStore | null> => {
    if (current) return current
    if (!loadPromise) loadPromise = (async () => {
      let path: string
      try { path = JSON.parse(await readFile(settings, 'utf8')).path }
      catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null; throw new Error('百宝匣位置配置损坏，请重新选择资料库') }
      if (typeof path !== 'string') throw new Error('资料库位置无效，请重新选择')
      const store = new TreasureStore(path)
      try { await store.load() } catch (e) { throw new Error('资料库无法打开：' + path + '；' + (e as Error).message) }
      current = store
      return store
    })().catch(e => { loadPromise = null; throw e })
    return loadPromise
  }
  const requireStore = async (): Promise<TreasureStore> => {
    const store = await get()
    if (!store) throw new Error('请先选择百宝匣资料库')
    return store
  }
  const chooseDirectory = async (title: string, owner: BrowserWindow | null): Promise<string | null> => {
    const options: Electron.OpenDialogOptions = { title, properties: ['openDirectory', 'createDirectory'] }
    const result = await (owner ? dialog.showOpenDialog(owner, options) : dialog.showOpenDialog(options))
    return result.canceled ? null : result.filePaths[0] ?? null
  }
  const ids = (value: unknown): string[] => {
    if (!Array.isArray(value) || value.length > 10000 || !value.every(x => typeof x === 'string')) throw new Error('素材选择无效')
    return value
  }

  const handleRequest = async (_event: Electron.IpcMainInvokeEvent, action: string, payload: Record<string, unknown> = {}): Promise<unknown> => {
    const lt = (message: string): string => translateMessage(message, validLocale(payload.locale))
    const localizeOptions = <T extends Electron.OpenDialogOptions | Electron.SaveDialogOptions | Electron.MessageBoxOptions>(options: T): T => {
      const result = { ...options }
      if (result.title) result.title = lt(result.title)
      if ('message' in result) {
        const box = result as Electron.MessageBoxOptions
        box.message = lt(box.message)
        if (box.detail) box.detail = lt(box.detail)
        if (box.buttons) box.buttons = box.buttons.map(lt)
      }
      if ('filters' in result && result.filters) result.filters = result.filters.map(filter => ({ ...filter, name: lt(filter.name) }))
      return result
    }
    const owner = BrowserWindow.fromWebContents(_event.sender)
    const openDialog = (options: Electron.OpenDialogOptions): Promise<Electron.OpenDialogReturnValue> => owner ? dialog.showOpenDialog(owner, localizeOptions(options)) : dialog.showOpenDialog(localizeOptions(options))
    const saveDialog = (options: Electron.SaveDialogOptions): Promise<Electron.SaveDialogReturnValue> => owner ? dialog.showSaveDialog(owner, localizeOptions(options)) : dialog.showSaveDialog(localizeOptions(options))
    const messageDialog = (options: Electron.MessageBoxOptions): Promise<Electron.MessageBoxReturnValue> => owner ? dialog.showMessageBox(owner, localizeOptions(options)) : dialog.showMessageBox(localizeOptions(options))
    if (action === 'chooseLibrary') {
      if (switching || current?.busy) throw new Error('请先完成或取消正在进行的任务')
      switching = true
      try {
        const selected = await chooseDirectory(lt('选择资料库目录（首次会创建 Musy百宝匣 子目录）'), owner)
        if (!selected) return false
        let path = selected
        const hasIndex = await stat(join(path, 'catalog.json')).then(() => true).catch(() => false)
        const hasSnapshot = await stat(join(path, 'catalog.json.previous')).then(() => true).catch(() => false)
        if (!hasIndex && !hasSnapshot && basename(selected) !== 'Musy百宝匣') path = join(selected, 'Musy百宝匣')
        const store = new TreasureStore(resolve(path))
        await store.load(true)
        await atomicJson(settings, { path: store.directory })
        current = store; loadPromise = null
        return true
      } finally { switching = false }
    }
    if (action === 'previewSession') return previewWindows.session(_event.sender.id)
    if (action === 'previewControl') return previewWindows.control(_event.sender.id, String(payload.action))
    const previewStore = previewWindows.store(_event.sender.id)
    if (switching && !previewStore) throw new Error('正在切换资料库，请稍后')
    if (action === 'status') return (previewStore ?? await get())?.status() ?? empty
    const store = previewStore ?? await requireStore()
    switch (action) {
      case 'query': return store.query((payload.query ?? {}) as AssetQuery)
      case 'get': {
        const item = store.item(String(payload.id))
        const absolutePath = store.path(item)
        return { ...item, absolutePath, available: await stat(absolutePath).then(s => s.isFile()).catch(() => false) }
      }
      case 'importFiles': {
        let paths: string[]
        if (payload.mode === 'retry') paths = store.status().job?.inputs ?? []
        else {
          const result = await openDialog({ title: '导入本地素材（引用原件，不复制或移动文件）', properties: payload.mode === 'folder' ? ['openDirectory'] : ['openFile', 'multiSelections'] })
          if (result.canceled) return false
          paths = result.filePaths
        }
        await store.startImport(paths)
        return true
      }
      case 'importPaths': await store.startImport(ids(payload.paths)); return true
      case 'importClipboard': {
        if (store.busy) throw new Error('已有导入任务，请等待或取消')
        return importTreasureClipboard(store, clipboard, await windowsClipboardFiles())
      }
      case 'importDrop': {
        if (store.busy) throw new Error('已有导入任务，请等待或取消')
        const drop = payload.drop as TreasureDrop | undefined
        if (!drop || !Array.isArray(drop.images) || drop.images.length > 32) throw new Error('拖入的内容无效或图片超过 32 张')
        const paths = ids(drop.paths)
        if (paths.length + drop.images.length > 10000 || paths.some(path => !isAbsolute(path) || path.includes('\0'))) throw new Error('导入路径无效或数量过多')
        const pngs: Buffer[] = []
        let total = 0; let savedTotal = 0
        for (const image of drop.images) {
          if (!(image.bytes instanceof Uint8Array)) throw new Error('图片数据无效')
          total += image.bytes.byteLength
          if (total > 128 * 1024 * 1024) throw new Error('拖入图片总量超过 128 MB，请分批导入')
          const decoded = nativeImage.createFromBuffer(Buffer.from(image.bytes))
          if (decoded.isEmpty()) throw new Error('无法解码拖入的图片，请先保存为图片文件再导入')
          const { width, height } = decoded.getSize()
          if (width * height > 64 * 1024 * 1024) throw new Error('图片像素过大，请先保存为文件再导入')
          const png = decoded.toPNG()
          savedTotal += png.length
          if (savedTotal > 128 * 1024 * 1024) throw new Error('图片总量过大，请先保存为文件再分批导入')
          pngs.push(png)
        }
        if (!paths.length && !pngs.length) throw new Error('请拖入本地文件或图片，网页链接请用传送门收藏')
        for (const png of pngs) paths.push(await persistCollectedImage(store.directory, png))
        await store.startImport(paths)
        return true
      }
      case 'previewOpen': await previewWindows.open(store, ids(payload.ids), String(payload.mode), Number(payload.index), owner); return
      case 'dragOut': {
        const files = await resolveDragFiles(store, ids(payload.ids))
        const pixels = Buffer.alloc(32 * 36 * 4)
        for (let y = 2; y < 34; y++) for (let x = 5; x < 27; x++) {
          const at = (y * 32 + x) * 4
          const border = x < 7 || x > 24 || y < 4 || y > 31
          pixels[at] = border ? 190 : 235; pixels[at + 1] = border ? 150 : 235; pixels[at + 2] = border ? 110 : 235; pixels[at + 3] = 255
        }
        const notifyDrag = (active: boolean): void => {
          for (const window of BrowserWindow.getAllWindows()) if (!window.isDestroyed() && !window.webContents.isDestroyed()) window.webContents.send('treasure:drag-state', active)
        }
        notifyDrag(true)
        try { _event.sender.startDrag({ file: files[0], files, icon: nativeImage.createFromBitmap(pixels, { width: 32, height: 36 }) }) }
        finally { notifyDrag(false) }
        return
      }
      case 'cancelImport': store.cancel(); return
      case 'update': await store.update(ids(payload.ids), payload.patch as AssetPatch); return
      case 'group': await store.group(String(payload.action), String(payload.name ?? ''), payload.id as string | undefined, payload.direction as number | undefined); return
      case 'remove': await store.remove(ids(payload.ids), payload.restore === true); return
      case 'open': {
        const item = store.item(String(payload.id))
        const path = store.path(item)
        if (payload.action === 'copy') { clipboard.writeText(path); return }
        if (!(await stat(path).then(s => s.isFile()).catch(() => false))) throw new Error('文件不存在或磁盘未连接，请重新定位')
        if (payload.action === 'folder') { shell.showItemInFolder(path); return }
        if (payload.action !== 'open') throw new Error('打开操作无效')
        if (['exe', 'com', 'cmd', 'bat', 'ps1', 'vbs', 'js', 'scr', 'msi', 'lnk', 'url'].includes(item.ext)) throw new Error('此类型请通过“所在位置”在系统中打开')
        const error = await shell.openPath(path)
        if (error) throw new Error('无法打开，请检查默认应用：' + error)
        await store.change(c => { const a = c.items.find(a => a.id === item.id); if (a) a.lastOpenedAt = Date.now() })
        return
      }
      case 'relink': {
        const path = await chooseDirectory(lt('选择原资料根目录的新位置（保留其下的相对目录结构）'), owner)
        if (!path) return false
        await store.relink(String(payload.rootId), path); return true
      }
      case 'locate': {
        const item = store.item(String(payload.id))
        const result = await openDialog({ title: '重新定位：' + item.originalName, properties: ['openFile'] })
        if (result.canceled) return false
        await store.locate(item.id, result.filePaths[0]); return true
      }
      case 'setCover': {
        const id = String(payload.id)
        store.item(id)
        const result = await openDialog({ title: '选择素材封面', properties: ['openFile'], filters: [{ name: '图片', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp'] }] })
        if (result.canceled) return false
        const img = await nativeImage.createThumbnailFromPath(result.filePaths[0], { width: 512, height: 512 })
        if (img.isEmpty()) throw new Error('无法读取这张图片，请换一张')
        const name = randomUUID() + '.png'
        await writeFile(join(store.directory, 'covers', name), fit(img, 512).toPNG(), { flag: 'wx' })
        await store.cover(id, name)
        return true
      }
      case 'thumbnail': {
        const item = store.item(String(payload.id))
        const large = payload.large === true
        const force = payload.refresh === true
        const cacheKey = store.directory + '/' + item.id + '/' + item.cover + '/' + large + '/' + force
        if (thumbnails.has(cacheKey)) return thumbnails.get(cacheKey)
        const task = thumbnailQueue.then(async (): Promise<string | null> => {
          if (item.cover) {
            try {
              const cover = await readFile(join(store.directory, 'covers', item.cover))
              if (!nativeImage.createFromBuffer(cover).isEmpty()) return 'data:image/png;base64,' + cover.toString('base64')
            }
            catch { /* Missing custom cover can fall back to the source preview. */ }
          }
          if (!previewExtensions.has(item.ext)) return null
          const path = store.path(item)
          const info = await stat(path)
          const version = createHash('sha256').update(path + '/' + info.mtimeMs + '/' + info.size).digest('hex').slice(0, 24)
          const cache = join(store.directory, 'cache', 'preview-v2-' + item.id + '-' + version + '-' + (large ? 'large' : 'small') + '.png')
          if (!force) {
            try {
              const cached = await readFile(cache)
              if (!nativeImage.createFromBuffer(cached).isEmpty()) return 'data:image/png;base64,' + cached.toString('base64')
            } catch { /* 生成可重建的缩略图 */ }
            if ((missingThumbnails.get(cache) ?? 0) > Date.now()) return null
          }
          const size = large ? 1600 : 320
          let image = nativeImage.createEmpty()
          const embedded = await readEmbeddedPreview(path, item.ext).catch(() => null)
          if (embedded) image = nativeImage.createFromBuffer(embedded)
          if (image.isEmpty() && (info.size <= 128 * 1024 * 1024 || !['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'tif', 'tiff'].includes(item.ext))) {
            const result = await systemThumbnail(path, size)
            if (result) image = nativeImage.createFromBuffer(result)
          }
          if (image.isEmpty() && ['gh', 'ghx'].includes(item.ext) && info.size <= 32 * 1024 * 1024) {
            const bitmap = await grasshopperPreview(path)
            if (bitmap) image = nativeImage.createFromBuffer(bitmap)
          }
          if (image.isEmpty()) {
            missingThumbnails.set(cache, Date.now() + 5 * 60 * 1000)
            if (missingThumbnails.size > 500) missingThumbnails.delete(missingThumbnails.keys().next().value!)
            return null
          }
          missingThumbnails.delete(cache)
          const bytes = fit(image, size).toPNG()
          await mkdir(join(store.directory, 'cache'), { recursive: true })
          await writeFile(cache, bytes).catch(() => undefined)
          return 'data:image/png;base64,' + bytes.toString('base64')
        }).catch(() => null).finally(() => thumbnails.delete(cacheKey))
        thumbnails.set(cacheKey, task); thumbnailQueue = task
        return task
      }
      case 'backup': {
        const result = await saveDialog({ title: '备份索引与自有封面（外部引用原件不包含）', defaultPath: '百宝匣-' + new Date().toISOString().slice(0, 10) + '.musybox', filters: [{ name: '百宝匣备份', extensions: ['musybox'] }] })
        if (result.canceled || !result.filePath) return false
        const backup = await store.exportBackup()
        if (Buffer.byteLength(JSON.stringify(backup)) > 256 * 1024 * 1024) throw new Error('备份超过当前 256 MB 上限，请减少封面或分库管理')
        await atomicJson(result.filePath, backup, false)
        await store.change(c => { c.lastBackup = Date.now() })
        return true
      }
      case 'restore': {
        if (store.busy) throw new Error('请先完成或取消导入')
        const result = await openDialog({ title: '选择百宝匣备份或恢复点', properties: ['openFile'], filters: [{ name: '百宝匣备份', extensions: ['musybox'] }] })
        if (result.canceled) return false
        if ((await stat(result.filePaths[0])).size > 256 * 1024 * 1024) throw new Error('备份文件超过 256 MB 上限')
        const data = JSON.parse(await readFile(result.filePaths[0], 'utf8'))
        if (data.format !== 'musy-treasure' || data.version !== 1) throw new Error('备份格式不支持')
        const c = validateCatalog(data.catalog)
        const confirm = await messageDialog({ type: 'question', buttons: ['取消', '恢复备份'], defaultId: 0, cancelId: 0,
          message: '恢复将替换当前百宝匣索引', detail: `${basename(result.filePaths[0])}\n${c.items.filter(a => !a.deletedAt).length} 条素材，${c.groups.length} 个分组，${Object.keys(data.covers ?? {}).length} 张封面。\n外部引用原件不在备份中，恢复后可能需要重新关联根目录。\n当前资料将先保存在资料库 recovery 目录，原文件不会被移动或删除。` })
        if (confirm.response !== 1) return false
        await store.restoreBackup(data); return true
      }
      default: throw new Error('不支持的百宝匣操作')
    }
  }
  ipcMain.handle('treasure:request', async (event, action: string, payload: Record<string, unknown> = {}) => {
    try { return await handleRequest(event, action, payload) }
    catch (error) { throw new Error(translateMessage(String((error as Error).message ?? error), validLocale(payload.locale))) }
  })
}
