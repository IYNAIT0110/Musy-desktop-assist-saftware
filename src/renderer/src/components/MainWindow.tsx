import { useEffect, useState } from 'react'
import {
  getLinks,
  getGroups,
  addGroup,
  renameGroup,
  removeGroup,
  addLink,
  removeLink,
  updateLinkGroup,
  moveLink,
  summarizeLink,
  type LinkItem
} from '../store'
import { loadAIConfig } from './ModelSettings'
import { PromptsPanel } from './PromptsPanel'
import { SHORTCUT_BOOKS, shortcutCount, type SoftwareShortcuts } from '../data/shortcuts'
import { LINK_ICON_OVERRIDES } from '../data/linkIcons'
import logoSketchup from '../assets/logos/sketchup.svg?raw'
import logoRhinoceros from '../assets/logos/rhinoceros.svg?raw'
import logoAutocad from '../assets/logos/autocad.svg?raw'

/** 各软件官方品牌矢量 logo（simple-icons 官方收录，单色路径，CSS 控制填充色） */
const SW_LOGOS: Record<string, string> = {
  su: logoSketchup,
  rhino: logoRhinoceros,
  cad: logoAutocad
}
import { t, useLang } from '../i18n'

type ModuleKey = 'links' | 'prompts' | 'shortcuts' | 'polish' | 'models'

/** 从本地 favicon 缓存图片提取主色（file:// 无跨域污染，可直接 canvas 取色） */
function useDominantColor(src: string | null): string | null {
  const [color, setColor] = useState<string | null>(null)
  useEffect(() => {
    if (!src) {
      setColor(null)
      return
    }
    let dead = false
    const img = new Image()
    img.onload = (): void => {
      if (dead) return
      try {
        const c = document.createElement('canvas')
        c.width = 16
        c.height = 16
        const ctx = c.getContext('2d')
        if (!ctx) return
        ctx.drawImage(img, 0, 0, 16, 16)
        const { data } = ctx.getImageData(0, 0, 16, 16)
        let r = 0
        let g = 0
        let b = 0
        let n = 0
        for (let i = 0; i < data.length; i += 4) {
          const [pr, pg, pb, pa] = [data[i], data[i + 1], data[i + 2], data[i + 3]]
          if (pa < 128) continue
          const mx = Math.max(pr, pg, pb)
          const mn = Math.min(pr, pg, pb)
          if (mx - mn < 24 && mx < 60) continue // 跳过近黑/灰像素
          r += pr
          g += pg
          b += pb
          n++
        }
        if (n === 0) return
        let rr = Math.round(r / n)
        let gg = Math.round(g / n)
        let bb = Math.round(b / n)
        // 主色过暗时渐变不可见：混入白色提亮到可用亮度（保留色相倾向）
        const lum = 0.299 * rr + 0.587 * gg + 0.114 * bb
        if (lum < 70) {
          const t = lum < 35 ? 0.65 : 0.45 // 越暗提得越多
          rr = Math.round(rr + (235 - rr) * t)
          gg = Math.round(gg + (235 - gg) * t)
          bb = Math.round(bb + (240 - bb) * t)
        }
        setColor(`rgb(${rr}, ${gg}, ${bb})`)
      } catch {
        /* ignore */
      }
    }
    img.src = src
    return () => {
      dead = true
    }
  }, [src])
  return color
}

/** 单张链接卡片：logo 区背景用 logo 主色的相近色填满；支持拖拽调整顺序 */
function LinkTile({
  link,
  dragging,
  dropTarget,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDrop,
  onHover,
  onHoverLeave,
  onDeleted
}: {
  link: LinkItem
  dragging: boolean
  dropTarget: boolean
  onDragStart: (id: string) => void
  onDragEnter: (id: string) => void
  onDragEnd: () => void
  onDrop: (id: string) => void
  onHover: (el: HTMLElement, desc: string) => void
  onHoverLeave: () => void
  onDeleted: () => void
}): JSX.Element {
  const { src, letter } = useFavicon(link.url)
  const dominant = useDominantColor(src)
  // 图片加载失败（缓存内容损坏/图标源返回非图片）→ 回落到首字母，避免出现裂图
  const [imgBroken, setImgBroken] = useState(false)
  useEffect(() => setImgBroken(false), [src])
  const bg = dominant
    ? `linear-gradient(to bottom, ${dominant.replace('rgb', 'rgba').replace(')', ', 0.30)')}, ${dominant.replace('rgb', 'rgba').replace(')', ', 0.14)')})`
    : 'linear-gradient(to bottom, rgba(255,255,255,0.10), rgba(255,255,255,0.03))'
  return (
    <div
      className="link-tile animate-fade-in"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', link.id)
        onDragStart(link.id)
      }}
      onDragEnter={() => onDragEnter(link.id)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        onDrop(link.id)
      }}
      onDragEnd={onDragEnd}
      onClick={() => void window.api.openExternal(link.url)}
      onMouseEnter={(e) => {
        if (link.desc) onHover(e.currentTarget, link.desc)
      }}
      onMouseLeave={onHoverLeave}
      onContextMenu={(e) => {
        e.preventDefault()
        // 分组菜单由父级 ctxMenu 处理，这里透传
        window.dispatchEvent(new CustomEvent('musy:link-ctx', { detail: { x: e.clientX, y: e.clientY, link } }))
      }}
      title={link.title}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        background: 'var(--bg-input)',
        border: `1px solid ${dropTarget ? 'var(--accent-tint)' : 'var(--border)'}`,
        opacity: dragging ? 0.4 : 1,
        transform: dragging ? 'scale(0.96)' : 'scale(1)',
        cursor: 'grab',
        transition:
          'border-color var(--dur-fast) var(--ease-out), opacity var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out)'
      }}
    >
      {/* logo 区：主色相近色填充 */}
      <div
        style={{
          width: '100%',
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: bg,
          transition: 'background var(--dur-normal) var(--ease-out)'
        }}
      >
        {src && !imgBroken ? (
          <img
            src={src}
            alt=""
            width={32}
            height={32}
            onError={() => setImgBroken(true)}
            style={{
              borderRadius: Math.max(5, 32 * 0.28),
              objectFit: 'cover',
              background: 'transparent'
            }}
          />
        ) : (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: Math.max(5, 32 * 0.28),
              background: 'rgba(255,255,255,0.08)',
              color: 'var(--text-secondary)',
              fontSize: 17,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 500
            }}
          >
            {letter}
          </div>
        )}
      </div>
      <div
        style={{
          maxWidth: '100%',
          padding: '5px 6px',
          fontSize: 11,
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {link.title}
      </div>
      {/* 删除按钮：hover 卡片时右上角浮现 */}
      <button
        className="link-del"
        onClick={(e) => {
          e.stopPropagation()
          removeLink(link.id)
          onDeleted() // 通知父级刷新列表，否则卡片要等切换分组才消失
        }}
        title={t('links.delete')}
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          width: 18,
          height: 18,
          borderRadius: '50%',
          border: 'none',
          background: 'rgba(0,0,0,0.5)',
          color: '#ffffff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0,
          transition: 'opacity var(--dur-fast) var(--ease-out)'
        }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}

// favicon 本地缓存路径的内存缓存：同一 host 只 IPC 一次
const faviconMemCache = new Map<string, string | null>()

/** 获取网站 favicon 的本地缓存路径（主进程下载 + 磁盘缓存，返回 file:// 或 null） */
function useFavicon(url: string): { src: string | null; letter: string } {
  const [src, setSrc] = useState<string | null>(null)
  let host = ''
  try {
    host = new URL(url).hostname
  } catch {
    /* ignore */
  }
  const letter = (host.replace(/^www\./, '')[0] ?? '?').toUpperCase()

  useEffect(() => {
    let dead = false
    if (!host) return
    // 覆盖表优先：这些站点的官方 favicon 与品牌标识不一致（见 linkIcons.ts）
    const override = LINK_ICON_OVERRIDES[host.replace(/^www\./, '')]
    if (override) {
      setSrc(override)
      return
    }
    const cached = faviconMemCache.get(host)
    if (cached !== undefined) {
      setSrc(cached)
      return
    }
    window.api
      .getFavicon(url)
      .then((p) => {
        faviconMemCache.set(host, p)
        if (!dead) setSrc(p)
      })
      .catch(() => {
        // 下载/读取失败不抛未捕获异常：回落首字母头像即可
        faviconMemCache.set(host, null)
      })
    return () => {
      dead = true
    }
  }, [url, host])

  return { src, letter }
}

// 各模块的空状态设计：可爱文案 + 单行布局，不放重复的吉祥物
// 用 i18n key，渲染时再取文案，保证切换语言即时生效
const emptyStateKeys: Record<ModuleKey, { title: string; desc: string; hint: string }> = {
  links: { title: 'empty.links.title', desc: 'empty.links.desc', hint: 'empty.links.hint' },
  prompts: { title: 'empty.prompts.title', desc: 'empty.prompts.desc', hint: 'empty.prompts.hint' },
  shortcuts: { title: 'empty.shortcuts.title', desc: 'empty.shortcuts.desc', hint: 'empty.shortcuts.hint' },
  polish: { title: 'empty.polish.title', desc: 'empty.polish.desc', hint: 'empty.polish.hint' },
  models: { title: 'empty.models.title', desc: 'empty.models.desc', hint: 'empty.models.hint' }
}

/**
 * L3 功能面板内容：顶部胶囊图标即菜单（无左侧导航），
 * 搜索框 + 当前模块内容区。只保留顶部悬浮球一只吉祥物。
 */
/** 国外著名建筑师经典短句（只留单行能显示完的），衬线字体更有建筑人文感 */
const ARCHITECT_QUOTES: { text: string; author: string }[] = [
  { text: 'Less is more.', author: 'Mies van der Rohe' },
  { text: 'Less is a bore.', author: 'Robert Venturi' },
  { text: 'Form ever follows function.', author: 'Louis Sullivan' },
  { text: 'God is in the details.', author: 'Mies van der Rohe' },
  { text: 'A house is a machine for living in.', author: 'Le Corbusier' },
  { text: 'Even a brick wants to be something.', author: 'Louis Kahn' },
  { text: 'Space and light and order.', author: 'Le Corbusier' },
  { text: 'Buildings, too, are children of Earth and Sun.', author: 'Frank Lloyd Wright' },
  { text: 'Architecture starts when you put two bricks together.', author: 'Mies van der Rohe' },
  { text: 'We shape our buildings; thereafter they shape us.', author: 'Winston Churchill' },
  { text: 'Stay close to nature. It will never fail you.', author: 'Frank Lloyd Wright' },
  { text: 'Light becomes light only when it collides with matter.', author: 'Tadao Ando' },
  { text: 'Architecture is the will of an epoch translated into space.', author: 'Mies van der Rohe' },
  { text: 'Atmosphere speaks to our emotional perception.', author: 'Peter Zumthor' },
  { text: 'Beauty arises when materials tell their own story.', author: 'Peter Zumthor' },
  { text: 'There are 360 degrees, so why stick to one?', author: 'Zaha Hadid' },
  { text: 'Architecture is really about well-being.', author: 'Zaha Hadid' },
  { text: 'People like me want to connect spaces and people.', author: 'Kazuyo Sejima' },
  { text: 'Architecture is a meeting of air and light.', author: 'Kazuyo Sejima' },
  { text: 'Architecture grows from the ground of its own place.', author: 'Liu Jiakun' }
]

export function MainWindow({
  active = 'links',
  onOpenPrompt
}: {
  active?: ModuleKey
  onOpenPrompt?: (p: { id: string; text: string; tags: string[]; image?: string; note?: string; parentId?: string; ts: number }) => void
}): JSX.Element {
  useLang()
  const [query, setQuery] = useState('')
  // 每次面板挂载随机选一句建筑师名言
  const [quote] = useState(
    () => ARCHITECT_QUOTES[Math.floor(Math.random() * ARCHITECT_QUOTES.length)]
  )
  const empty = emptyStateKeys[active]

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-panel)',
        position: 'relative'
      }}
    >
      {/* 品牌 logo：右下角缪斯水印（四芒星光斑 + Musy 衬线字标） */}
      <div
        style={{
          position: 'absolute',
          right: 28,
          bottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          pointerEvents: 'none',
          opacity: 0.6,
          userSelect: 'none'
        }}
      >
        {/* 缪斯桂冠：左右对称月桂花环，中心小星点缀 */}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ transform: 'translateY(-1px)' }}>
          {/* 左侧桂冠枝 */}
          <path
            d="M12 20c-3.2-0.8-5.6-2.6-7.4-5.4-0.4-0.6 0.1-1.4 0.8-1.4 1.2 0 2.2 0.6 3 1.5"
            stroke="#ffffff"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M4.5 13c1.2-1.4 2.4-2 3.9-2.3" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          {/* 左侧叶片 */}
          <path d="M6.4 14.6 4.8 12.6M7.4 13.4 6.2 11.1M8.6 12.4 7.8 10" stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round" />
          {/* 右侧桂冠枝（镜像） */}
          <path
            d="M12 20c3.2-0.8 5.6-2.6 7.4-5.4 0.4-0.6-0.1-1.4-0.8-1.4-1.2 0-2.2 0.6-3 1.5"
            stroke="#ffffff"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M19.5 13c-1.2-1.4-2.4-2-3.9-2.3" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <path d="M17.6 14.6l1.6-2M16.6 13.4l1.2-2.3M15.4 12.4l0.8-2.4" stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round" />
          {/* 桂冠顶星：灵光 */}
          <path d="M12 4c0.4 1.6 1.2 2.4 2.8 2.8-1.6 0.4-2.4 1.2-2.8 2.8-0.4-1.6-1.2-2.4-2.8-2.8 1.6-0.4 2.4-1.2 2.8-2.8Z" fill="#ffffff" />
        </svg>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 1,
            fontFamily: 'Georgia, "Palatino Linotype", serif',
            fontStyle: 'italic',
            color: '#ffffff',
            whiteSpace: 'nowrap'
          }}
        >
          Musy
        </span>
      </div>
      {/* 顶部：问候语（单行）+ 搜索框 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '16px 20px 12px'
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 400,
            fontStyle: 'italic',
            fontFamily: 'Georgia, "Palatino Linotype", "Times New Roman", serif',
            letterSpacing: 0.3,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          “{quote.text}”
        </div>
        <div
          style={{
            flexShrink: 0,
            marginLeft: 10,
            fontSize: 12,
            fontFamily: 'Georgia, "Palatino Linotype", "Times New Roman", serif',
            fontStyle: 'italic',
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap'
          }}
        >
          — {quote.author}
        </div>
      </div>

      <div style={{ padding: '0 20px 14px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 16px',
            height: 42,
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            transition: 'border-color var(--dur-fast) var(--ease-out)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('links.searchPlaceholder')}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontFamily: 'var(--font-sans)'
            }}
          />
          <kbd
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-kbd)',
              background: 'var(--bg-hover)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-hover)'
            }}
          >
            ⌘K
          </kbd>
        </div>
      </div>

      {/* 内容区：链接收藏（左侧整理栏 + 列表）或各模块空状态（随模块切换淡入） */}
      <main
        style={{
          flex: 1,
          minHeight: 0,
          margin: '0 12px 12px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          display: 'flex'
        }}
      >
        {active === 'links' ? (
          <LinksPanel query={query} />
        ) : active === 'shortcuts' ? (
          <ShortcutsPanel query={query} />
        ) : active === 'prompts' ? (
          <PromptsPanel query={query} onOpenPrompt={(p) => onOpenPrompt?.(p)} />
        ) : (
          <div
            key={active + query}
            className="animate-fade-in"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              textAlign: 'center'
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: 'var(--text-primary)'
              }}
            >
              {query ? t('links.searching') : t(empty.title)}
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                lineHeight: 1.5
              }}
            >
              {query ? t('links.searchingDesc') : t(empty.desc)}
            </div>
            {!query && (
              <div
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  background: 'var(--bg-hover)',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border)'
                }}
              >
                {t(empty.hint)}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

// === 快捷键白皮书面板：三软件卡片 → 分类详情（单行布局，kbd 键位标签） ===

function Kbd({ children }: { children: string }): JSX.Element {
  return (
    <kbd
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--text-kbd)',
        background: 'var(--bg-hover)',
        padding: '2px 7px',
        borderRadius: 5,
        border: '1px solid var(--border-hover)',
        boxShadow: '0 1px 0 rgba(0,0,0,0.4)',
        whiteSpace: 'nowrap'
      }}
    >
      {children}
    </kbd>
  )
}

function ShortcutsPanel({ query }: { query: string }): JSX.Element {
  useLang()
  // 当前选中的软件（null = 卡片选择页）
  const [sel, setSel] = useState<SoftwareShortcuts | null>(null)
  const q = query.trim().toLowerCase()

  const matchItem = (desc: string, keys: string[]): boolean =>
    !q || desc.toLowerCase().includes(q) || keys.join(' ').toLowerCase().includes(q)

  // —— 详情页 ——
  if (sel) {
    const cats = sel.categories
      .map((c) => ({ ...c, items: c.items.filter((it) => matchItem(it.desc, it.keys)) }))
      .filter((c) => c.items.length > 0)
    return (
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* 详情头部：返回 + 软件名 + 条数 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0
          }}
        >
          <button
            onClick={() => setSel(null)}
            className="pressable"
            title={t('kb.back')}
            style={{
              width: 26,
              height: 26,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--bg-input)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'border-color var(--dur-fast) var(--ease-out)'
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--text-secondary)'
            }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap'
            }}
          >
            {sel.name}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {shortcutCount(sel)} {t('kb.count')}
          </span>
          {q && (
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 11,
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap'
              }}
            >
              {cats.reduce((n, c) => n + c.items.length, 0)} {t('kb.matched')}
            </span>
          )}
        </div>

        {/* 分类列表 */}
        <div
          className="animate-fade-in"
          style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 14px 14px' }}
        >
          {cats.length === 0 && (
            <div
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                color: 'var(--text-muted)'
              }}
            >
              {t('kb.noMatchPrefix')}{query}{t('kb.noMatchSuffix')}
            </div>
          )}
          {cats.map((c) => (
            <div key={c.name} style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: 1,
                  color: 'var(--text-muted)',
                  padding: '4px 2px 6px'
                }}
              >
                {c.name}
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden'
                }}
              >
                {c.items.map((it, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      height: 32,
                      padding: '0 12px',
                      background: i % 2 === 0 ? 'transparent' : 'var(--bg-hover)',
                      borderTop: i === 0 ? 'none' : '1px solid var(--border)'
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12.5,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {it.desc}
                    </span>
                    <span style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      {it.keys.map((k, j) => (
                        <Kbd key={j}>{k}</Kbd>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // —— 卡片选择页：三张卡片占满内容区 ——
  return (
    <div
      className="animate-fade-in"
      style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 14,
        // 底部多留白，给右下角 Musy logo 让位
        padding: '14px 14px 48px'
      }}
    >
      {SHORTCUT_BOOKS.map((s) => (
        <ShortcutBookCard key={s.key} s={s} onOpen={() => setSel(s)} />
      ))}
    </div>
  )
}

/** 单张软件卡片：官方品牌 logo（黑白）+ 名称 + 条数，占满格子高度 */
function ShortcutBookCard({ s, onOpen }: { s: SoftwareShortcuts; onOpen: () => void }): JSX.Element {
  const logo = SW_LOGOS[s.key]
  return (
    <button
      onClick={onOpen}
      className="pressable"
      style={{
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        background: 'var(--bg-input)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        padding: 20,
        transition: 'border-color var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out), background-color var(--dur-fast) var(--ease-out)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.backgroundColor = 'var(--bg-input)'
      }}
    >
      {/* 官方品牌 logo：黑白填充，中性底座 */}
      <span
        className="sw-logo"
        style={{
          width: 120,
          height: 120,
          borderRadius: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-hover)',
          padding: 26,
          flexShrink: 0
        }}
      >
        <span
          style={{ width: '100%', height: '100%', display: 'block' }}
          dangerouslySetInnerHTML={{ __html: logo }}
        />
      </span>
      <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
        {s.name}
      </span>
      <span
        style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%'
        }}
      >
        {s.full}
      </span>
      <span
        style={{
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary)',
          background: 'var(--bg-hover)',
          padding: '2px 10px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border)'
        }}
      >
        {shortcutCount(s)} {t('kb.itemCount')}
      </span>
    </button>
  )
}

// === 链接收藏面板：左侧整理栏（+ 收藏剪贴板 / 分组）+ 右侧链接列表 ===

function LinksPanel({ query }: { query: string }): JSX.Element {
  useLang()
  const [links, setLinksState] = useState<LinkItem[]>(getLinks)
  const [groups, setGroupsState] = useState<string[]>(getGroups)
  const [currentGroup, setCurrentGroup] = useState<string>('全部')
  const [newGroup, setNewGroup] = useState('')
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null)
  // 右键菜单：当前操作的链接 + 菜单位置
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; link: LinkItem } | null>(null)
  // 拖拽排序状态：正在拖的 id + 悬停目标 id
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  // 悬浮简介气泡：位置 + 文案
  const [tip, setTip] = useState<{ x: number; y: number; desc: string } | null>(null)
  // 分组编辑：正在重命名的分组名 + 输入值
  const [editingGroup, setEditingGroup] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  // 待确认删除的分组名（null 表示无）
  const [confirmDel, setConfirmDel] = useState<string | null>(null)

  const handleDrop = (targetId: string): void => {
    if (dragId && dragId !== targetId) {
      moveLink(dragId, targetId)
      setLinksState(getLinks())
    }
    setDragId(null)
    setOverId(null)
  }

  // 点击任意处关闭右键菜单
  useEffect(() => {
    if (!ctxMenu) return
    const close = (): void => setCtxMenu(null)
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [ctxMenu])

  // 卡片右键 → 打开分组菜单（LinkTile 通过事件透传）
  useEffect(() => {
    const onCtx = (e: Event): void => {
      const d = (e as CustomEvent<{ x: number; y: number; link: LinkItem }>).detail
      setCtxMenu(d)
    }
    window.addEventListener('musy:link-ctx', onCtx)
    return () => window.removeEventListener('musy:link-ctx', onCtx)
  }, [])

  const showToast = (ok: boolean, msg: string): void => {
    setToast({ ok, msg })
    window.setTimeout(() => setToast(null), 1800)
  }

  // 收藏剪贴板链接（+ 按钮），收藏后自动用大模型总结简介
  const collectClipboard = async (): Promise<void> => {
    let text = ''
    try {
      text = await window.api.readClipboardText()
    } catch {
      showToast(false, t('links.clipboardFail'))
      return
    }
    const res = addLink(text)
    if (res.ok) {
      setLinksState(getLinks())
      // 后台异步总结简介，完成后刷新列表显示
      if (res.id) {
        const cfg = loadAIConfig()
        void summarizeLink(res.id, text, cfg)
          .then(() => setLinksState(getLinks()))
          .catch(() => {
            /* 总结失败不影响收藏本身 */
          })
      }
    }
    showToast(res.ok, res.msg)
  }

  // 新建分组
  const createGroup = (): void => {
    const name = newGroup.trim()
    if (!name) return
    addGroup(name)
    setGroupsState(getGroups())
    setNewGroup('')
  }

  // 确认重命名分组
  const confirmRename = (oldName: string): void => {
    const ok = renameGroup(oldName, editingName)
    if (ok) {
      setGroupsState(getGroups())
      setLinksState(getLinks())
      if (currentGroup === oldName) setCurrentGroup(editingName.trim())
      showToast(true, `${t('links.renamedTo')}${editingName.trim()}」`)
    } else if (editingName.trim()) {
      showToast(false, t('links.renameInvalid'))
    }
    setEditingGroup(null)
    setEditingName('')
  }

  // 删除分组
  const doRemoveGroup = (name: string): void => {
    removeGroup(name)
    setGroupsState(getGroups())
    setLinksState(getLinks())
    if (currentGroup === name) setCurrentGroup('全部')
    showToast(true, t('links.deletedTo'))
  }

  // 可见分组：全部 + 默认 + 自定义
  const allGroups = ['全部', '默认', ...groups.filter((g) => g !== '默认')]
  // 分组显示名映射（内部标识符 → 界面文案）
  const groupLabel = (g: string): string =>
    g === '全部' ? t('links.all') : g === '默认' ? t('links.default') : g
  const visible = links.filter(
    (l) =>
      (currentGroup === '全部' || l.group === currentGroup) &&
      (!query ||
        l.title.toLowerCase().includes(query.toLowerCase()) ||
        l.url.toLowerCase().includes(query.toLowerCase()))
  )

  const groupCount = (g: string): number =>
    g === '全部' ? links.length : links.filter((l) => l.group === g).length

  return (
    <div
      className="animate-fade-in"
      style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}
    >
      {/* 左侧整理栏 */}
      <div
        style={{
          width: 168,
          flexShrink: 0,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          borderRight: '1px solid var(--border)',
          background: 'var(--bg-panel)',
          overflowY: 'auto'
        }}
      >
        {/* 主操作按钮：白色胶囊（高级软件主 CTA 皆为白/浅色，非鲜艳色铺满） */}
        <button
          onClick={() => void collectClipboard()}
          title={t('links.collectHint')}
          className="pressable"
          style={{
            height: 40,
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: '#f5f5f7',
            color: '#0d0d0f',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            transition: 'background-color var(--dur-instant) var(--ease-out)'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" style={{ flexShrink: 0 }}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t('links.collect')}
        </button>

        {/* 整理收藏：分组列表 */}
        <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px 4px 0', letterSpacing: 1 }}>
          {t('links.organize')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {allGroups.map((g) => {
            // 「全部」「默认」为系统分组，不可重命名/删除
            const isSystem = g === '全部' || g === '默认'
            if (editingGroup === g) {
              return (
                <div
                  key={g}
                  style={{ display: 'flex', gap: 4, alignItems: 'center' }}
                >
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmRename(g)
                      if (e.key === 'Escape') {
                        setEditingGroup(null)
                        setEditingName('')
                      }
                    }}
                    onBlur={() => confirmRename(g)}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      height: 28,
                      padding: '0 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--accent-tint)',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      outline: 'none'
                    }}
                  />
                </div>
              )
            }
            return (
              <div
                key={g}
                className="group-row"
                onMouseLeave={() => {
                  if (confirmDel === g) setConfirmDel(null)
                }}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 'var(--radius-sm)',
                  background: currentGroup === g ? 'var(--accent-tint-soft)' : 'transparent',
                  transition: 'background-color var(--dur-fast) var(--ease-out)'
                }}
              >
                <button
                  onClick={() => setCurrentGroup(g)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: 30,
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: 'transparent',
                    color: currentGroup === g ? 'var(--accent-tint)' : 'var(--text-secondary)',
                    fontSize: 12,
                    textAlign: 'left',
                    padding: '0 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {groupLabel(g)}
                  </span>
                  {/* 数字固定右侧；非系统分组悬停时隐藏，编辑/删除按钮覆盖此处 */}
                  <span
                    className="group-count"
                    style={{ fontSize: 11, color: 'var(--text-muted)' }}
                  >
                    {groupCount(g)}
                  </span>
                </button>
                {!isSystem && (
                  <div
                    className="group-actions"
                    style={{
                      position: 'absolute',
                      right: 8,
                      display: 'flex',
                      gap: 2,
                      opacity: 0,
                      pointerEvents: 'none',
                      transition: 'opacity var(--dur-fast) var(--ease-out)'
                    }}
                  >
                    <button
                      onClick={() => {
                        setEditingGroup(g)
                        setEditingName(g)
                      }}
                      title={t('links.rename')}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 5,
                        border: 'none',
                        background: 'var(--bg-card)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setConfirmDel(g)}
                      title={t('links.deleteHint')}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 5,
                        border: 'none',
                        background: 'var(--bg-card)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                )}
                {/* 删除二次确认：点击删除后弹出确认条 */}
                {confirmDel === g && (
                  <div
                    className="animate-fade-in"
                    style={{
                      position: 'absolute',
                      right: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '0 4px 0 8px',
                      height: 24,
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(90, 30, 32, 0.95)',
                      border: '1px solid #c0392b',
                      zIndex: 5
                    }}
                  >
                    <span style={{ fontSize: 11, color: '#ffb3b3', whiteSpace: 'nowrap' }}>
                      {t('links.confirmDelete')}
                    </span>
                    <button
                      onClick={() => {
                        doRemoveGroup(g)
                        setConfirmDel(null)
                      }}
                      style={{
                        height: 18,
                        padding: '0 7px',
                        borderRadius: 4,
                        border: 'none',
                        background: '#e74c3c',
                        color: '#fff',
                        fontSize: 11,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {t('links.confirm')}
                    </button>
                    <button
                      onClick={() => setConfirmDel(null)}
                      title={t('links.cancel')}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 新建分组 */}
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <input
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') createGroup()
            }}
            placeholder={t('links.newGroup')}
            style={{
              flex: 1,
              minWidth: 0,
              height: 28,
              padding: '0 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontSize: 12,
              outline: 'none'
            }}
          />
          <button
            onClick={createGroup}
            title={t('links.addGroup')}
            style={{
              width: 28,
              height: 28,
              flexShrink: 0,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--bg-input)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 右侧链接列表 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        {visible.length === 0 ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: 'var(--text-secondary)',
              fontSize: 13,
              textAlign: 'center'
            }}
          >
            {query ? (
              <span>{t('links.noResultPrefix')}「{query}」{t('links.noResultSuffix')}</span>
            ) : (
              <>
                <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>
                  {t('links.noLinks')}
                </span>
                <span>{t('links.noLinksHint')}</span>
              </>
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))',
              gap: 10
            }}
          >
            {visible.map((l) => (
              <LinkTile
                key={l.id}
                link={l}
                dragging={dragId === l.id}
                dropTarget={overId === l.id && dragId !== l.id}
                onDragStart={setDragId}
                onDragEnter={setOverId}
                onDragEnd={() => {
                  setDragId(null)
                  setOverId(null)
                }}
                onDrop={handleDrop}
                onHover={(el, desc) => {
                  const r = el.getBoundingClientRect()
                  setTip({ x: r.left + r.width / 2, y: r.top, desc })
                }}
                onHoverLeave={() => setTip(null)}
                onDeleted={() => setLinksState(getLinks())}
              />
            ))}
          </div>
        )}
      </div>

      {/* 右键菜单：调整链接分组 */}
      {ctxMenu && (
        <div
          className="animate-fade-in"
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: Math.min(ctxMenu.x, window.innerWidth - 150),
            top: Math.min(ctxMenu.y, window.innerHeight - 40 * (allGroups.length + 1)),
            width: 140,
            padding: 5,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-hover)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            zIndex: 30,
            boxShadow: 'none'
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: 'var(--text-muted)',
              padding: '4px 8px 5px',
              letterSpacing: 1
            }}
          >
            {t('links.moveTo')}
          </div>
          {allGroups.map((g) => (
            <button
              key={g}
              onClick={() => {
                updateLinkGroup(ctxMenu.link.id, g === '全部' ? '默认' : g)
                setLinksState(getLinks())
                setCtxMenu(null)
                showToast(true, `${t('links.movedTo')}${groupLabel(g === '全部' ? '默认' : g)}」`)
              }}
              style={{
                height: 28,
                borderRadius: 7,
                border: 'none',
                background: ctxMenu.link.group === g ? 'var(--accent-tint-soft)' : 'transparent',
                color:
                  ctxMenu.link.group === g ? 'var(--accent-tint)' : 'var(--text-secondary)',
                fontSize: 12,
                textAlign: 'left',
                padding: '0 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {groupLabel(g)}
              </span>
              {ctxMenu.link.group === g && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {/* 悬浮简介气泡：fixed 定位，不受卡片 overflow 裁剪 */}
      {tip && (
        <div
          className="animate-fade-in"
          style={{
            position: 'fixed',
            left: tip.x,
            top: tip.y,
            transform: 'translate(-50%, calc(-100% - 8px))',
            maxWidth: 220,
            width: 'max-content',
            padding: '6px 11px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-hover)',
            boxShadow: '0 6px 24px rgba(0,0,0,0.4)',
            color: 'var(--text-primary)',
            fontSize: 12,
            lineHeight: 1.45,
            whiteSpace: 'nowrap',
            zIndex: 40,
            pointerEvents: 'none'
          }}
        >
          {tip.desc}
        </div>
      )}

      {/* 轻提示 toast */}
      {toast && (
        <div
          className="animate-fade-in"
          style={{
            position: 'absolute',
            bottom: 18,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 18px',
            borderRadius: 'var(--radius-full)',
            background: toast.ok ? 'rgba(40, 42, 48, 0.95)' : 'rgba(90, 30, 32, 0.95)',
            border: '1px solid var(--border-hover)',
            color: 'var(--text-primary)',
            fontSize: 12,
            whiteSpace: 'nowrap',
            zIndex: 10
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}
