import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { Mascot, ALL_STATES, type GrokState } from './Mascot'
import { MainWindow } from './MainWindow'
import { Settings } from './Settings'
import { PromptWorkspace } from './PromptsPanel'
import type { PromptItem } from '../store'
import { t, useLang } from '../i18n'

// 悬浮条图标（简洁 SVG）
const icons = {
  links: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  prompts: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  shortcuts: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="4" />
      <line x1="6" y1="10" x2="6" y2="14" />
      <line x1="10" y1="10" x2="10" y2="14" />
      <line x1="14" y1="10" x2="14" y2="14" />
      <line x1="18" y1="10" x2="18" y2="14" />
    </svg>
  ),
  polish: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  ),
  models: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.27 6.96 12 12.01l8.73-5.05" />
      <path d="M12 22.08V12" />
    </svg>
  )
}

const items = [
  { key: 'links', labelKey: 'nav.links', icon: icons.links },
  { key: 'prompts', labelKey: 'nav.prompts', icon: icons.prompts },
  { key: 'shortcuts', labelKey: 'nav.shortcuts', icon: icons.shortcuts },
  { key: 'polish', labelKey: 'nav.polish', icon: icons.polish },
  { key: 'models', labelKey: 'nav.models', icon: icons.models }
]
/**
 * 悬浮条：三级形态。
 * - L1 最小化：只显示黑色球形吉祥物（眼睛），功能栏全部隐藏
 * - L2 功能菜单：点击吉祥物后向右展开胶囊 + 功能图标
 * - L3 完整面板：点击功能图标后继续向右加宽（出现标题栏 + 最大/最小化按钮），
 *   功能界面再向下展开；最小化按钮收回面板回到 L2，最大化按钮重新展开面板
 * 整体支持手动拖拽。
 */
export function FloatBar(): JSX.Element {
  // 订阅语言变化，切换语言时自动重渲染界面文案
  useLang()
  // 展开状态：L1=false, L2=true
  const [expanded, setExpanded] = useState(false)
  // L3 完整面板（向下展开的功能界面）
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelMounted, setPanelMounted] = useState(false)
  // 退场动画状态：胶囊收起 / 面板收起分别标记，过渡结束后再真正卸载
  const [capsuleExiting, setCapsuleExiting] = useState(false)
  const [panelExiting, setPanelExiting] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  // 统一设置面板
  const [showSettings, setShowSettings] = useState(false)
  // 最小化悬浮球时的随机情绪（在 39 种状态间轮换）
  const [mood, setMood] = useState<GrokState>('idle')
  // L4 提示词工作区：当前打开的提示词（母或子）；null 表示未打开
  const [promptItem, setPromptItem] = useState<PromptItem | null>(null)

  const level = promptItem ? 4 : panelOpen ? 3 : expanded ? 2 : 1

  // 最小化时：定时随机切换情绪；展开时固定为 idle
  useEffect(() => {
    if (level >= 2) {
      setMood('idle')
      return
    }
    const pickRandom = (): void => {
      const next = ALL_STATES[Math.floor(Math.random() * ALL_STATES.length)]
      setMood(next)
    }
    // 首次立即随机一个，之后每隔 2~4 秒切换一次
    pickRandom()
    const timer = setInterval(pickRandom, 2000 + Math.random() * 2000)
    return () => clearInterval(timer)
  }, [level])

  // 拖拽状态
  const dragRef = useRef<{ startScreenX: number; startScreenY: number } | null>(null)
  // L4 打开时冻结的 L3 内容区高度（避免窗口加高导致内容重排跳动）
  const [frozenMainH, setFrozenMainH] = useState<number | null>(null)
  const mainAreaRef = useRef<HTMLDivElement | null>(null)
  // 本次拖拽是否发生过移动（mouseup 后仍保留，供 click 判断是否误触）
  const movedRef = useRef(false)

  // L2 → L3：向右加宽出标题栏（标题栏常驻），功能面板向下展开
  const openPanel = (key: string): void => {
    setActive(key)
    setPanelMounted(true)
    setPanelOpen(true)
    if (promptItem) setPromptItem(null) // 切换功能时关闭提示词工作区
    if (!expanded) setExpanded(true)
    window.api.setFloatBarLevel(3)
  }

  // L3 → L4：打开提示词工作区（窗口向下加高）
  // 冻结 L3 内容区当前高度：窗口加高后 L3 区域尺寸保持不变，内容不发生重排跳动
  const openPromptWorkspace = (item: PromptItem): void => {
    const h = mainAreaRef.current?.offsetHeight
    if (h) setFrozenMainH(h)
    setActive('prompts')
    setExpanded(true)
    setPanelMounted(true)
    setPanelOpen(true)
    setPromptItem(item)
    window.api.setFloatBarLevel(4)
  }

  // L4 → L3：关闭提示词工作区
  const closePromptWorkspace = (): void => {
    setPromptItem(null)
    window.api.setFloatBarLevel(3)
  }

  // L3 → L2：面板向下收起，窗口宽度收回胶囊（标题栏随之退场）
  const collapsePanel = (): void => {
    setPanelOpen(false)
    setPanelExiting(true)
    setPromptItem(null)
    window.api.setFloatBarLevel(2)
    window.setTimeout(() => {
      setPanelMounted(false)
      setPanelExiting(false)
      setActive(null) // 退出面板后清除功能图标高亮
    }, 240)
  }

  // 最大化按钮：面板收起后重新向下展开（有工作区则保持 L4）
  const expandPanel = (): void => {
    setPanelMounted(true)
    setPanelExiting(false)
    // 等一帧再置位，保证从 @starting-style 播放入场动画
    window.requestAnimationFrame(() => setPanelOpen(true))
    window.api.setFloatBarLevel(promptItem ? 4 : 3)
  }

  // L2 → L1：整个胶囊退场，收回到最小球
  const collapseToBall = (): void => {
    setCapsuleExiting(true)
    setPanelExiting(true)
    setPromptItem(null)
    window.api.setFloatBarLevel(1)
    window.setTimeout(() => {
      setExpanded(false)
      setPanelOpen(false)
      setPanelMounted(false)
      setCapsuleExiting(false)
      setPanelExiting(false)
      setActive(null) // 收回最小球时清除功能图标高亮
    }, 240)
  }

  // 切换形态：L1 ↔ L2
  const toggleExpanded = (): void => {
    if (expanded) {
      collapseToBall()
    } else {
      setExpanded(true)
      window.api.setFloatBarLevel(2)
    }
  }

  const onDragStart = (e: ReactMouseEvent): void => {
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest('[data-no-drag]')) return
    movedRef.current = false
    dragRef.current = {
      startScreenX: e.screenX,
      startScreenY: e.screenY
    }
    setDragging(true)

    // 拖拽期间用全局监听，避免鼠标快速移出小窗口导致中断
    const onGlobalMove = (ev: MouseEvent): void => {
      const drag = dragRef.current
      if (!drag) return
      const dx = ev.screenX - drag.startScreenX
      const dy = ev.screenY - drag.startScreenY
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        movedRef.current = true
        window.api.moveFloatBar(dx, dy)
        drag.startScreenX = ev.screenX
        drag.startScreenY = ev.screenY
      }
    }
    const onGlobalUp = (): void => {
      dragRef.current = null
      setDragging(false)
      window.removeEventListener('mousemove', onGlobalMove)
      window.removeEventListener('mouseup', onGlobalUp)
    }

    window.addEventListener('mousemove', onGlobalMove)
    window.addEventListener('mouseup', onGlobalUp)
  }

  // 点击展开/收起：拖拽发生过移动时不触发，避免拖动误触
  const handleBallClick = (): void => {
    if (movedRef.current) return
    toggleExpanded()
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'transparent',
        position: 'relative'
      }}
    >
      {/* === 顶栏行：球体 + 功能胶囊 + L3 标题栏 === */}
      <div
        onMouseDown={onDragStart}
        style={{
          height: 64,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          background: 'transparent',
          position: 'relative',
          paddingRight: level >= 3 ? 8 : 0, // 与下方面板右边缘对齐
          cursor: dragging ? 'grabbing' : 'grab'
        }}
      >
        {/* === 整体玻璃背景层：整个顶栏共用一块磨砂玻璃，杜绝拼接缝 === */}
        {expanded && (
          <div
            className={`glass-bar${capsuleExiting ? ' exiting' : ''}`}
            style={{
              position: 'absolute',
              top: 5,
              bottom: 5,
              left: 0,
              right: level >= 3 ? 8 : 0, // L3 时右端与面板对齐
              borderRadius: 27,
              background: 'rgba(30, 30, 34, 0.62)',
              backdropFilter: 'blur(24px) saturate(150%)',
              WebkitBackdropFilter: 'blur(24px) saturate(150%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
              zIndex: 0,
              boxShadow: dragging ? '0 0 20px rgba(255,255,255,0.3)' : 'none'
            }}
          />
        )}

        {/* 球体吉祥物：常驻节点，展开/收起都不重建，位置恒定不跳 */}
        <div
          onClick={handleBallClick}
          title={expanded ? t('float.clickCollapse') : t('float.clickExpand')}
          className="mascot-ball"
          style={{
            width: 54,
            height: 54,
            // 展开时贴最左，黑色球体正好盖住玻璃条左圆头（消除左侧灰边）；L1 时居中
            marginLeft: expanded ? 0 : 5,
            transition: 'margin-left var(--dur-normal) var(--ease-out)',
            flexShrink: 0,
            cursor: dragging ? 'grabbing' : 'pointer',
            position: 'relative',
            zIndex: 2
          }}
        >
          {/* 内层：真正的球体（圆形裁剪 + 渐变背景 + 眼睛） */}
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background:
                expanded
                  ? '#000000'
                  : 'radial-gradient(circle, #000000 0%, #000000 62%, rgba(0,0,0,0.85) 74%, rgba(0,0,0,0.55) 86%, rgba(0,0,0,0.22) 95%, transparent 100%)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              paddingTop: 4,
              overflow: 'hidden',
              boxShadow: dragging ? '0 0 20px rgba(255,255,255,0.3)' : 'none'
            }}
          >
            <Mascot size={50} mood={mood} />
          </div>
        </div>

        {/* L2/L3 功能胶囊：只做布局，玻璃背景由整体层提供 */}
        {expanded && (
          <div
            className={`capsule-panel${capsuleExiting ? ' exiting' : ''}`}
            style={{
              flex: level >= 3 ? '0 0 auto' : 1,
              height: 54,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 6,
              marginLeft: -54, // 左移覆盖到球体下方，使胶囊包裹球体
              paddingLeft: 66, // 给球体让出空间（多留 12px 呼吸感，功能图标不过分贴近小球）
              paddingRight: level >= 3 ? 16 : 10,
              zIndex: 1
            }}
          >
            {items.map((item, idx) => (
              <button
                key={item.key}
                onClick={() => {
                  if (movedRef.current) return
                  if (panelOpen && active === item.key) return
                  openPanel(item.key)
                }}
                title={t(item.labelKey)}
                className="icon-item pressable"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  flexShrink: 0,
                  animationDelay: `${idx * 30}ms`,
                  background:
                    active === item.key ? 'var(--accent-tint-soft)' : 'transparent',
                  color:
                    active === item.key ? 'var(--accent-tint)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition:
                    'background-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)',
                  boxShadow:
                    active === item.key ? '0 0 12px rgba(229,102,90,0.28)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (active !== item.key) e.currentTarget.style.background = 'var(--bg-hover)'
                }}
                onMouseLeave={(e) => {
                  if (active !== item.key) e.currentTarget.style.background = 'transparent'
                }}
              >
                {item.icon}
              </button>
            ))}
          </div>
        )}

        {/* L3 标题栏：只做布局与按钮，玻璃背景由整体层提供 */}
        {panelMounted && (
          <div
            className={`titlebar-panel${panelExiting ? ' exiting' : ''}`}
            style={{
              flex: 1,
              height: 54,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 4,
              paddingLeft: 8,
              paddingRight: 8,
              zIndex: 1,
              WebkitAppRegion: 'drag'
            } as React.CSSProperties}
          >
            {/* 设置：统一入口（模型配置 / 数据路径 / 语言） */}
            <button
              onClick={() => setShowSettings(true)}
              title={t('nav.settings')}
              className="pressable"
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                WebkitAppRegion: 'no-drag',
                transition: 'background-color var(--dur-fast) var(--ease-out)'
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            {/* 最大化/还原：面板收起时为「向下展开」，展开时为「收起面板」 */}
            <button
              onClick={panelOpen ? collapsePanel : expandPanel}
              title={panelOpen ? t('float.collapsePanel') : t('float.expandPanel')}
              className="pressable"
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                WebkitAppRegion: 'no-drag',
                transition: 'background-color var(--dur-fast) var(--ease-out)'
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {panelOpen ? (
                  <polyline points="4 14 10 14 10 20" />
                ) : (
                  <polyline points="20 10 14 10 14 4" />
                )}
              </svg>
            </button>
            {/* 最小化到任务栏：隐藏面板，点击任务栏图标可恢复 */}
            <button
              onClick={() => window.api.minimizeFloatBar()}
              title={t('float.minimize')}
              className="pressable"
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                WebkitAppRegion: 'no-drag',
                transition: 'background-color var(--dur-fast) var(--ease-out)'
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            {/* 退出：悬浮条没有系统托盘，必须有显式退出入口，否则进程会常驻后台关不掉 */}
            <button
              onClick={() => window.api.quitApp()}
              title={t('float.quit')}
              className="pressable"
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                WebkitAppRegion: 'no-drag',
                transition: 'background-color var(--dur-fast) var(--ease-out)'
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)'
                e.currentTarget.style.color = '#ff6b6b'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 12.73" />
                <line x1="12" y1="2" x2="12" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* === L3 功能面板 / L4 提示词工作区：向下展开 === */}
      {panelMounted && (
        <div
          className={`float-panel${panelExiting ? ' exiting' : ''}`}
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            // 左缘与玻璃条对齐（0），右缘与玻璃条 L3 缩进对齐（8）
            // 顶部不留 margin：玻璃条自带 bottom:5，与面板自然脱开 5px（恢复之前的分离感）
            margin: '0 8px 8px 0',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'var(--bg-panel)',
            position: 'relative'
          }}
        >
          {/* L3 主内容区：L4 时冻结为打开前的高度，内容不重排不跳动 */}
          <div
            ref={mainAreaRef}
            style={
              promptItem && frozenMainH
                ? { height: frozenMainH, flexShrink: 0, overflow: 'hidden' }
                : { flex: 1, minHeight: 0 }
            }
          >
            <MainWindow
              active={(active ?? 'links') as 'links' | 'prompts' | 'shortcuts' | 'polish' | 'models'}
              onOpenPrompt={openPromptWorkspace}
            />
          </div>

          {/* L4 提示词工作区：母/子提示词 + 图片 + AI 改写 */}
          {promptItem && (
            <div className="animate-fade-in" style={{ flex: 1, minHeight: 0, display: 'flex' }}>
              <PromptWorkspace
                item={promptItem}
                onClose={closePromptWorkspace}
                onOpenItem={setPromptItem}
              />
            </div>
          )}

          {/* 统一设置面板：模型配置 / 数据路径 / 语言 */}
          {showSettings && <Settings onClose={() => setShowSettings(false)} />}
        </div>
      )}
    </div>
  )
}
