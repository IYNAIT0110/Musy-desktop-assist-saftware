import { floatInsets } from '../../../shared/floatLayout'
import { InteractiveButton } from './HoverFeedback'
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { Mascot } from './Mascot'
import { MainWindow } from './MainWindow'
import { Settings } from './Settings'
import { PromptWorkspace } from './PromptsPanel'
import { NavigationIcon } from './NavigationIcon'
import GooeyNav from './GooeyNav'
import { GOOEY_NAV_SETTINGS } from '../gooeyNavSettings'
import './musy-gooey-nav.css'
import { WindowControlIcon } from './WindowControlIcon'
import { LinkPromptActions } from './LinkPromptActions'
import { BallCollector } from './BallCollector'
import { addLink, getLinks, type PromptItem } from '../store'
import { isClipboardPromptEnabled } from '../clipboardPrompt'
import { t, tx, useLang } from '../i18n'

const items = [
  { key: 'links', labelKey: 'nav.links', icon: <NavigationIcon name="links" /> },
  { key: 'prompts', labelKey: 'nav.prompts', icon: <NavigationIcon name="prompts" /> },
  { key: 'shortcuts', labelKey: 'nav.shortcuts', icon: <NavigationIcon name="shortcuts" /> },
  { key: 'polish', labelKey: 'nav.polish', icon: <NavigationIcon name="polish" /> },
  { key: 'models', labelKey: 'nav.models', icon: <NavigationIcon name="models" /> }
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
  const [animationInsets, setAnimationInsets] = useState(() => floatInsets(1))
  useEffect(() => {
    const down = (): void => window.api.setFloatPointerHeld(true)
    const up = (): void => window.api.setFloatPointerHeld(false)
    window.addEventListener('pointerdown', down, true)
    window.addEventListener('pointerup', up, true)
    window.addEventListener('pointercancel', up, true)
    window.addEventListener('blur', up)
    return () => { window.removeEventListener('pointerdown', down, true); window.removeEventListener('pointerup', up, true); window.removeEventListener('pointercancel', up, true); window.removeEventListener('blur', up); up() }
  }, [])
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
  // L4 提示词工作区：当前打开的提示词（母或子）；null 表示未打开
  const [promptItem, setPromptItem] = useState<PromptItem | null>(null)
  const [linkPrompt, setLinkPrompt] = useState<{ url: string; side: 'left' | 'right'; message?: string } | null>(null)

  const level = promptItem ? 4 : panelOpen ? 3 : expanded ? 2 : 1
  const levelRef = useRef(level)
  const promptRef = useRef(linkPrompt)
  const lastPromptAtRef = useRef(0)
  const pendingUrlRef = useRef<string | null>(null)
  const offerInFlightRef = useRef(false)
  const collectingRef = useRef(false)
  levelRef.current = level
  promptRef.current = linkPrompt

  const dismissLinkPrompt = (): void => {
    promptRef.current = null
    setLinkPrompt(null)
    void window.api.hideLinkBubble()
  }

  const offerLink = (url: string): void => {
    if (!isClipboardPromptEnabled()) return
    if (levelRef.current !== 1 || promptRef.current || offerInFlightRef.current || collectingRef.current) {
      pendingUrlRef.current = url
      return
    }
    if (Date.now() - lastPromptAtRef.current < 30000) return
    if (getLinks().some((link) => link.url === url)) return
    offerInFlightRef.current = true
    void window.api.showLinkBubble().then((side) => {
      if (!side) return
      if (levelRef.current !== 1 || !isClipboardPromptEnabled()) {
        void window.api.hideLinkBubble()
        pendingUrlRef.current = url
        return
      }
      lastPromptAtRef.current = Date.now()
      promptRef.current = { url, side }
      setLinkPrompt({ url, side })
    }).finally(() => { offerInFlightRef.current = false })
  }

  useEffect(() => {
    let mounted = true
    const unsubscribe = window.api.onClipboardUrl(offerLink)
    void window.api.setClipboardLinkWatch(isClipboardPromptEnabled()).then((url) => {
      if (mounted && url) offerLink(url)
    })
    const onSettingChange = (): void => {
      const enabled = isClipboardPromptEnabled()
      void window.api.setClipboardLinkWatch(enabled).then((url) => {
        if (enabled && url) offerLink(url)
      })
      if (!enabled) {
        pendingUrlRef.current = null
        dismissLinkPrompt()
      }
    }
    window.addEventListener('musy:clipboard-prompt-setting', onSettingChange)
    return () => {
      mounted = false
      unsubscribe()
      window.removeEventListener('musy:clipboard-prompt-setting', onSettingChange)
      void window.api.setClipboardLinkWatch(false)
      void window.api.hideLinkBubble()
    }
  }, [])

  useEffect(() => {
    if (level !== 1 || !pendingUrlRef.current) return
    const url = pendingUrlRef.current
    pendingUrlRef.current = null
    // 收起动画结束后窗口才回到 64px，稍后再请求气泡空间。
    const timer = window.setTimeout(() => offerLink(url), 350)
    return () => window.clearTimeout(timer)
  }, [level])

  useEffect(() => {
    if (!linkPrompt) return
    const timer = window.setTimeout(dismissLinkPrompt, 18000)
    return () => window.clearTimeout(timer)
  }, [linkPrompt?.url])

  const savePromptedLink = (): void => {
    if (!linkPrompt || linkPrompt.message) return
    const result = addLink(linkPrompt.url)
    setLinkPrompt({ ...linkPrompt, message: result.ok ? t('float.linkSaved') : result.msg })
    if (result.ok) window.setTimeout(dismissLinkPrompt, 1100)
  }

  // 拖拽状态
  const dragRef = useRef<{ startScreenX: number; startScreenY: number } | null>(null)
  // L4 打开时保留的 L3 高度；小屏时为下方详情预留空间。
  const [frozenMainH, setFrozenMainH] = useState<number | null>(null)
  const mainAreaRef = useRef<HTMLDivElement | null>(null)
  // 本次拖拽是否发生过移动（mouseup 后仍保留，供 click 判断是否误触）
  const movedRef = useRef(false)

  // L2 → L3：向右加宽出标题栏（标题栏常驻），功能面板向下展开
  const openPanel = (key: string): void => {
    setAnimationInsets(floatInsets(3))
    setActive(key)
    setPanelMounted(true)
    setPanelOpen(true)
    if (promptItem) setPromptItem(null) // 切换功能时关闭提示词工作区
    if (!expanded) setExpanded(true)
    window.api.setFloatBarLevel(3)
  }

  // L3 → L4：打开提示词工作区（窗口向下加高）
  // 优先保留 L3 当前高度；布局在小屏时限制上方高度，为详情留出空间。
  const openPromptWorkspace = (item: PromptItem): void => {
    setAnimationInsets(floatInsets(4))
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
    setAnimationInsets(floatInsets(3))
    setPromptItem(null)
    window.api.setFloatBarLevel(3)
  }

  // L3 → L2：面板向下收起，窗口宽度收回胶囊（标题栏随之退场）
  const collapsePanel = (): void => {
    setAnimationInsets(floatInsets(2))
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
    setAnimationInsets(floatInsets(promptItem ? 4 : 3))
    setPanelMounted(true)
    setPanelExiting(false)
    // 等一帧再置位，保证从 @starting-style 播放入场动画
    window.requestAnimationFrame(() => setPanelOpen(true))
    window.api.setFloatBarLevel(promptItem ? 4 : 3)
  }

  // L2 → L1：整个胶囊退场，收回到最小球
  const collapseToBall = (): void => {
    setAnimationInsets(floatInsets(1))
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
    if (linkPrompt) dismissLinkPrompt()
    if (expanded) {
      collapseToBall()
    } else {
      setAnimationInsets(floatInsets(2))
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
        boxSizing: 'border-box',
        paddingTop: animationInsets.top,
        paddingBottom: animationInsets.bottom,
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
               background: 'var(--glass-bar)',
              backdropFilter: 'var(--capsule-filter)',
              WebkitBackdropFilter: 'var(--capsule-filter)',
              border: 'none',
              overflow: 'hidden',
              zIndex: 0
            }}
          />
        )}

        {/* 球体吉祥物：常驻节点，展开/收起都不重建，位置恒定不跳 */}
        <BallCollector level={level} onActivity={value => { collectingRef.current = value }} onDismissLink={() => { if (promptRef.current) dismissLinkPrompt() }} onOpenLibrary={() => openPanel('models')}>
        {collector => <div
          onClick={handleBallClick}
          onDragEnter={collector.onDragEnter} onDragOver={collector.onDragOver} onDrop={collector.onDrop}
          title={expanded ? t('float.clickCollapse') : t('float.clickExpand')}
          className={`mascot-ball${collector.active ? ' collecting' : ''}`}
          style={{
            width: 54,
            height: 54,
            // 展开前后保持同一个球体位置，仅左侧气泡需要让球靠右。
            marginLeft: !expanded && (linkPrompt?.side === 'left' || collector.side === 'left') ? 'auto' : 0,
            marginRight: !expanded && (linkPrompt?.side === 'left' || collector.side === 'left') ? 5 : 0,
            transition: 'margin-left var(--dur-normal) var(--ease-out)',
            flexShrink: 0,
            cursor: dragging ? 'grabbing' : 'pointer',
            position: 'relative',
            zIndex: 2
          }}
        >
          {/* 内层：真正的球体（圆形裁剪 + 渐变背景 + 眼睛） */}
          <div
            className="mascot-material"
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'var(--mascot-color)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              paddingTop: 4,
              overflow: 'hidden'
            }}
          >
            <Mascot size={50} mood={collector.mood} />
          </div>
        </div>}
        </BallCollector>

        {linkPrompt && !expanded && (
          <div
            data-no-drag
            className="animate-fade-in link-prompt-bubble"
            onMouseDown={(e) => e.stopPropagation()}
            tabIndex={0}
            style={{
              position: 'absolute',
              top: 4,
              left: linkPrompt.side === 'right' ? 70 : 8,
              right: linkPrompt.side === 'left' ? 70 : 8,
              height: 56,
              borderRadius: 14,
              border: '1px solid var(--border-hover)',
              background: 'var(--bubble-bg)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              boxSizing: 'border-box',
              zIndex: 3
            }}
          >
            <span style={{ position: 'absolute', top: 22, [linkPrompt.side === 'right' ? 'left' : 'right']: -5, width: 9, height: 9, transform: 'rotate(45deg)', background: 'var(--bubble-bg)', borderLeft: linkPrompt.side === 'right' ? '1px solid var(--border-hover)' : 'none', borderBottom: linkPrompt.side === 'left' ? '1px solid var(--border-hover)' : 'none' }} />
            <div className="link-prompt-preview">
              <div className="link-prompt-question">{linkPrompt.message ?? t('float.linkQuestion')}</div>
              <div className="link-prompt-url" title={linkPrompt.url}>{linkPrompt.url}</div>
            </div>
            <LinkPromptActions
              disabled={Boolean(linkPrompt.message)}
              confirmLabel={t('float.linkSave')}
              cancelLabel={t('float.linkSkip')}
              onConfirm={savePromptedLink}
              onCancel={dismissLinkPrompt}
            />
          </div>
        )}

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
            <GooeyNav
              {...GOOEY_NAV_SETTINGS}
              className="musy-gooey-nav"
              ariaLabel={tx('功能导航')}
              activeIndex={Math.max(0, items.findIndex(item => item.key === active))}
              inactive={!panelOpen || active === null}
              items={items.map(item => ({ icon: item.icon, ariaLabel: t(item.labelKey), title: t(item.labelKey + 'Hint') }))}
              onChange={index => { openPanel(items[index].key) }}
            />
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
              gap: 6,
              paddingLeft: 8,
              paddingRight: 0,
              zIndex: 1,
              WebkitAppRegion: 'drag'
            } as React.CSSProperties}
          >
            <div className="toolbar-controls-frame" data-no-drag>
            {/* 设置：统一入口（模型配置 / 数据路径 / 语言） */}
            <InteractiveButton
              onClick={() => setShowSettings(true)}
              title={t('nav.settings')}
              aria-label={t('nav.settings')}
              className="pressable"
              style={{
                width: 34,
                height: 34,
                flexShrink: 0,
                borderRadius: '50%',
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
              <WindowControlIcon name="settings" />
            </InteractiveButton>
            {/* 最大化/还原：面板收起时为「向下展开」，展开时为「收起面板」 */}
            <InteractiveButton
              onClick={panelOpen ? collapsePanel : expandPanel}
              title={panelOpen ? t('float.collapsePanel') : t('float.expandPanel')}
              aria-label={panelOpen ? t('float.collapsePanel') : t('float.expandPanel')}
              className="pressable"
              style={{
                width: 34,
                height: 34,
                flexShrink: 0,
                borderRadius: '50%',
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
              <WindowControlIcon name={panelOpen ? 'collapse' : 'expand'} />
            </InteractiveButton>
            {/* 最小化到任务栏：隐藏面板，点击任务栏图标可恢复 */}
            <InteractiveButton
              onClick={() => window.api.minimizeFloatBar()}
              title={t('float.minimize')}
              aria-label={t('float.minimize')}
              className="pressable"
              style={{
                width: 34,
                height: 34,
                flexShrink: 0,
                borderRadius: '50%',
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
              <WindowControlIcon name="minimize" />
            </InteractiveButton>
            {/* 退出：悬浮条没有系统托盘，必须有显式退出入口，否则进程会常驻后台关不掉 */}
            <InteractiveButton
              onClick={() => window.api.quitApp()}
              title={t('float.quit')}
              aria-label={t('float.quit')}
              className="pressable"
              style={{
                width: 34,
                height: 34,
                flexShrink: 0,
                borderRadius: '50%',
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
              <WindowControlIcon name="power" />
            </InteractiveButton>
            </div>
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
             border: '1px solid var(--border)',
            background: 'transparent',
            position: 'relative'
          }}
        >
          {/* L3 主内容区：保留原高度，小屏时让出下方详情所需空间。 */}
          <div
            ref={mainAreaRef}
            style={
              promptItem && frozenMainH
                ? { height: frozenMainH, maxHeight: 'max(0px, calc(100% - 420px))', flexShrink: 0, overflow: 'hidden' }
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
            <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
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
