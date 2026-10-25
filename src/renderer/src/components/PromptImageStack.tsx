import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import type { PromptItem } from '../store'
import { stepStackIndex, stackSwipe } from '../promptStack'
import { decodePromptImage } from '../promptImageCache'
import { tx, useLang } from '../i18n'
import { InteractiveButton } from './HoverFeedback'
import './prompt-stack.css'

function Preview({ item }: { item: PromptItem }): JSX.Element {
  const [failed, setFailed] = useState(false)
  useEffect(() => { setFailed(false) }, [item.image])
  return item.image && !failed ? <img src={item.image} alt="" draggable={false} onError={() => setFailed(true)} /> : <div className="prompt-stack-empty"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1.5" /><path d="m4 18 6-6 4 4 3-3 4 4" /></svg><span>{tx('无预览图')}</span></div>
}
function transformOf(node: HTMLElement | null | undefined, fallback = 'none'): string {
  return node ? typeof getComputedStyle === 'function' ? getComputedStyle(node).transform : node.style.transform || fallback : fallback
}
interface Departure { id: string; direction: number; serial: number; from: string; incoming: string }

export function PromptImageStack({ items, activeId, onChange }: { items: PromptItem[]; activeId: string; onChange: (id: string) => void }): JSX.Element {
  useLang()
  const index = Math.max(0, items.findIndex(item => item.id === activeId))
  const active = items[index]
  const front = useRef<HTMLDivElement | null>(null)
  const nodes = useRef(new Map<string, HTMLDivElement>())
  const animation = useRef<Animation[]>([])
  const sequence = useRef(0)
  const [leaving, setLeaving] = useState<Departure | null>(null)
  const drag = useRef<{ pointer: number; x: number; y: number; dx: number; dy: number } | null>(null)
  const moved = useRef(false)
  const navigation = useRef(0)
  const current = useRef(active.id)
  current.current = active.id
  const turn = (direction: number): void => {
    if (items.length < 2) return
    const token = ++navigation.current
    const next = items[stepStackIndex(index, direction, items.length)]
    const commit = (): void => {
      if (token !== navigation.current || current.current !== active.id) return
      setLeaving({ id: active.id, direction, serial: ++sequence.current, from: transformOf(front.current), incoming: transformOf(nodes.current.get(next.id), 'translateY(-5px) scale(.95)') })
      onChange(next.id)
    }
    if (next.image) void decodePromptImage(next.image).then(commit)
    else commit()
  }
  useEffect(() => {
    for (const offset of [-1, 0, 1, 2]) void decodePromptImage(items[stepStackIndex(index, offset, items.length)]?.image)
  }, [items, index])
  useEffect(() => () => { navigation.current++ }, [])
  useLayoutEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const local: Animation[] = []
    const localNodes = [...nodes.current.values()]
    const cancel = (): void => { local.forEach(value => value.cancel()); for (const node of localNodes) if (!drag.current || node !== front.current) node.style.transform = '' }
    const preference = (): void => { cancel(); setLeaving(null) }
    media.addEventListener('change', preference)
    const outgoing = leaving ? nodes.current.get(leaving.id) : undefined
    if (leaving && outgoing && front.current && outgoing !== front.current) {
      // Continue from the actual dragged/interrupted pose, never from the center.
      const out = outgoing.animate(media.matches ? [{ opacity: 1 }, { opacity: 0 }] : [
        { transform: leaving.from, opacity: 1 },
        { transform: `translateX(${-leaving.direction * 110}%) rotate(${-leaving.direction * 13}deg)`, opacity: 0 }
      ], { duration: media.matches ? 90 : 240, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' })
      const incoming = front.current.animate(media.matches ? [{ opacity: 1 }, { opacity: 1 }] : [
        { transform: leaving.incoming, opacity: 1 }, { transform: 'none', opacity: 1 }
      ], { duration: media.matches ? 90 : 240, easing: 'cubic-bezier(.22,1,.36,1)' })
      local.push(out, incoming)
      void out.finished.then(() => setLeaving(value => value?.serial === leaving.serial ? null : value), () => undefined)
    }
    animation.current = local
    return () => { cancel(); media.removeEventListener('change', preference) }
  }, [leaving?.serial, active.id])
  const down = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.button !== 0 || !event.isPrimary) return
    navigation.current++; moved.current = false
    const from = transformOf(front.current)
    animation.current.forEach(value => value.cancel())
    if (front.current) front.current.style.transform = from
    drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, dx: 0, dy: 0 }
    setLeaving(null)
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const move = (event: PointerEvent<HTMLDivElement>): void => {
    const value = drag.current
    if (!value || value.pointer !== event.pointerId || !front.current) return
    value.dx = event.clientX - value.x; value.dy = event.clientY - value.y
    if (Math.abs(value.dx) > 6 || Math.abs(value.dy) > 6) moved.current = true
    if (Math.abs(value.dx) <= Math.abs(value.dy)) return
    if (event.cancelable) event.preventDefault()
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const width = event.currentTarget.clientWidth
    const shift = Math.max(-width * .8, Math.min(width * .8, value.dx))
    front.current.style.transform = `translateX(${shift}px) rotate(${shift / Math.max(1, width) * 12}deg)`
  }
  const up = (event: PointerEvent<HTMLDivElement>): void => {
    const value = drag.current
    if (!value || value.pointer !== event.pointerId) return
    drag.current = null
    value.dx = event.clientX - value.x; value.dy = event.clientY - value.y
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    const direction = stackSwipe(value.dx, value.dy, event.currentTarget.clientWidth)
    if (direction) { moved.current = true; turn(direction) }
    else if (front.current) {
      const from = transformOf(front.current)
      front.current.style.transform = ''
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) animation.current.push(front.current.animate([{ transform: from }, { transform: 'none' }], { duration: 160, easing: 'cubic-bezier(.22,1,.36,1)' }))
    }
  }
  // Keys follow identities, not front/back slots: decoded image DOM survives flips.
  const nearby = new Set([-1, 0, 1, 2].map(offset => items[stepStackIndex(index, offset, items.length)].id))
  if (leaving) nearby.add(leaving.id)
  return <>
    <div className="prompt-stack-stage" onPointerDown={down} onPointerMove={move} onPointerUp={up}
      onPointerCancel={() => { navigation.current++; drag.current = null; moved.current = true; if (front.current) front.current.style.transform = '' }}
      onClickCapture={event => { if (moved.current) { event.preventDefault(); event.stopPropagation() } }}>
      {items.filter(item => nearby.has(item.id)).map(item => {
        const isFront = item.id === active.id
        const depth = item.id === items[stepStackIndex(index, 1, items.length)].id ? 1 : item.id === items[stepStackIndex(index, 2, items.length)].id ? 2 : 0
        const position = isFront ? 'is-front' : item.id === leaving?.id ? 'is-leaving' : depth ? `depth-${depth}` : 'is-preloaded'
        return <div key={item.id} ref={node => { if (node) nodes.current.set(item.id, node); else nodes.current.delete(item.id); if (isFront) front.current = node }} className={`prompt-stack-sheet ${position}`} aria-hidden={!isFront}><Preview item={item} /></div>
      })}
    </div>
    <div className="prompt-stack-controls" onClick={event => event.stopPropagation()}>
      <InteractiveButton type="button" data-stack-step="-1" aria-label={tx('上一张预览')} title={tx('上一张预览')} onClick={() => turn(-1)}>‹</InteractiveButton>
      <span className="prompt-stack-counter" role="status" aria-live="polite">{tx(index === 0 ? '母提示词' : '子提示词')} · {index + 1}/{items.length}</span>
      <InteractiveButton type="button" data-stack-step="1" aria-label={tx('下一张预览')} title={tx('下一张预览')} onClick={() => turn(1)}>›</InteractiveButton>
    </div>
  </>
}
