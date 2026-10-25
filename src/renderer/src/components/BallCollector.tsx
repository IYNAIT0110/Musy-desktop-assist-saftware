import { InteractiveButton } from './HoverFeedback'
import { tx, useLang } from '../i18n'
import { useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react'
import type { TreasureDrop } from '../../../shared/treasure'
import { canCollectTransfer, readTreasureDrop } from '../treasureTransfer'
import './ball-collector.css'

type Phase = 'idle' | 'hover' | 'working' | 'result' | 'error'
interface View { phase: Phase; side: 'left' | 'right' | null; text: string; needsLibrary?: boolean }
interface BallState {
  side: 'left' | 'right' | null
  active: boolean
  mood: 'ambient' | 'receiving' | 'working' | 'celebrate' | 'confused'
  onDragEnter: (event: DragEvent) => void
  onDragOver: (event: DragEvent) => void
  onDrop: (event: DragEvent) => void
}
export function BallCollector({ level, onActivity, onDismissLink, onOpenLibrary, children }: {
  level: number; onActivity: (active: boolean) => void; onDismissLink: () => void; onOpenLibrary: () => void
  children: (state: BallState) => ReactNode
}): JSX.Element {
  useLang()
  const [view, setView] = useState<View>({ phase: 'idle', side: null, text: '' })
  const current = useRef(view)
  const generation = useRef(0)
  const ownedBubble = useRef(false)
  const pending = useRef<TreasureDrop | null>(null)
  const hoverTimer = useRef<number>()
  const feedbackTimer = useRef<number>()
  const alive = useRef(true)
  const change = (next: View): void => { current.current = next; if (alive.current) setView(next) }
  const dismiss = (): void => {
    generation.current++
    clearTimeout(hoverTimer.current); clearTimeout(feedbackTimer.current)
    change({ phase: 'idle', side: null, text: '' }); pending.current = null; onActivity(false)
    if (ownedBubble.current) { ownedBubble.current = false; void window.api.hideLinkBubble() }
  }
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false; generation.current++
      clearTimeout(hoverTimer.current); clearTimeout(feedbackTimer.current)
      if (ownedBubble.current) void window.api.hideLinkBubble()
    }
  }, [])
  const ensureBubble = (): void => {
    onActivity(true); onDismissLink()
    if (level !== 1 || ownedBubble.current) return
    ownedBubble.current = true
    const token = generation.current
    void window.api.showLinkBubble().then(side => {
      if (!alive.current || token !== generation.current) return
      change({ ...current.current, side })
    }).catch(() => { /* The ball ring remains a valid drop target. */ })
  }
  const over = (event: DragEvent): void => {
    if (!canCollectTransfer(event.dataTransfer) || current.current.phase === 'working') return
    event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = 'copy'
    clearTimeout(hoverTimer.current); clearTimeout(feedbackTimer.current)
    if (current.current.phase !== 'hover') { generation.current++; pending.current = null; change({ phase: 'hover', side: current.current.side, text: '文件、文件夹或图片' }); ensureBubble() }
    hoverTimer.current = window.setTimeout(() => { if (current.current.phase === 'hover') dismiss() }, 1000)
  }
  const collect = async (drop: TreasureDrop): Promise<void> => {
    const token = generation.current
    pending.current = drop
    clearTimeout(hoverTimer.current); clearTimeout(feedbackTimer.current)
    change({ ...current.current, phase: 'working', text: '一批素材，只提醒你一次' })
    try {
      const status = await window.api.treasure.status()
      if (token !== generation.current || !alive.current) return
      if (!status.path) { change({ ...current.current, phase: 'error', text: '先设置百宝匣资料库，再继续收藏', needsLibrary: true }); return }
      await window.api.treasure.importDrop(drop)
      window.dispatchEvent(new Event('musy:treasure-changed'))
      let job = (await window.api.treasure.status()).job
      const id = job?.id
      while (job?.state === 'running' && job.id === id && token === generation.current && alive.current) {
        await new Promise(resolve => window.setTimeout(resolve, 400))
        if (token !== generation.current || !alive.current) return
        job = (await window.api.treasure.status()).job
      }
      if (token !== generation.current || !alive.current) return
      if (!job || job.id !== id) throw new Error('任务已变化，请打开百宝匣查看导入结果')
      window.dispatchEvent(new Event('musy:treasure-changed'))
      const failed = job.state === 'failed' || job.failed > 0
      const text = job.state === 'failed' ? `导入未完成：${job.errors[job.errors.length - 1] ?? '请打开百宝匣查看'}` : `新增 ${job.imported} · 已有 ${job.duplicates} · 失败 ${job.failed}${job.state === 'canceled' ? ' · 已取消' : ''}`
      change({ ...current.current, phase: failed ? 'error' : 'result', text, needsLibrary: false })
      if (!failed) { pending.current = null; feedbackTimer.current = window.setTimeout(dismiss, 3500) }
    } catch (e) {
      if (token === generation.current && alive.current) change({ ...current.current, phase: 'error', text: String((e as Error).message ?? e).replace(/^Error invoking remote method '[^']+': Error: /, ''), needsLibrary: false })
    }
  }
  const drop = (event: DragEvent): void => {
    if (!canCollectTransfer(event.dataTransfer) || current.current.phase === 'working') return
    event.preventDefault(); event.stopPropagation()
    clearTimeout(hoverTimer.current)
    pending.current = null
    ensureBubble()
    const token = generation.current
    const data = readTreasureDrop(event.dataTransfer)
    change({ ...current.current, phase: 'working', text: '正在读取拖入的内容…' })
    void data.then(value => token === generation.current && alive.current ? collect(value) : undefined).catch(e => { if (token === generation.current && alive.current) change({ ...current.current, phase: 'error', text: String(e.message ?? e) }) })
  }
  const retry = async (): Promise<void> => {
    if (!pending.current) { dismiss(); onOpenLibrary(); return }
    const value = pending.current
    const token = generation.current
    if (current.current.needsLibrary) {
      change({ ...current.current, phase: 'working', text: '选择资料库后继续收藏' })
      try {
        const chosen = await window.api.treasure.chooseLibrary()
        if (token !== generation.current || !alive.current) return
        if (!chosen) { change({ ...current.current, phase: 'error', text: '已取消选择，素材尚未收藏', needsLibrary: true }); return }
      } catch (e) { if (token === generation.current) change({ ...current.current, phase: 'error', text: String((e as Error).message ?? e) }); return }
    }
    if (token === generation.current && alive.current) await collect(value)
  }
  const active = view.phase !== 'idle'
  return <>
    {children({ side: view.side, active, mood: view.phase === 'hover' ? 'receiving' : view.phase === 'working' ? 'working' : view.phase === 'result' ? 'celebrate' : view.phase === 'error' ? 'confused' : 'ambient', onDragEnter: over, onDragOver: over, onDrop: drop })}
    {active && (level !== 1 || view.side) && <div data-no-drag className={`ball-collector-bubble phase-${view.phase}`} role={view.phase === 'error' ? 'alert' : 'status'}
      style={{ left: view.side === 'left' && level === 1 ? undefined : 64, right: view.side === 'left' && level === 1 ? 70 : undefined }}
      onDragEnter={over} onDragOver={over} onDrop={drop} onMouseDown={event => event.stopPropagation()}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h16v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3ZM3 8l2-4h14l2 4M9 13h6m-3-3v6" /></svg>
      <div className="ball-collector-copy"><strong>{view.phase === 'hover' ? tx("松手，交给我收好") : view.phase === 'working' ? tx("正在收进百宝匣…") : view.phase === 'result' ? tx("这批整理好啦") : tx("这次还没收好")}</strong><span title={tx(view.text)}>{tx(view.text)}</span></div>
      {view.phase === 'error' ? <InteractiveButton onClick={() => void retry()}>{view.needsLibrary ? tx("设置资料库") : pending.current ? tx("重试") : tx("查看")}</InteractiveButton> : view.phase === 'result' ? <InteractiveButton onClick={() => { dismiss(); onOpenLibrary() }}>{tx("查看")}</InteractiveButton> : null}
      {view.phase !== 'hover' && <InteractiveButton className="ball-collector-close" aria-label={tx("关闭收集提示")} onClick={dismiss}>×</InteractiveButton>}
    </div>}
  </>
}
