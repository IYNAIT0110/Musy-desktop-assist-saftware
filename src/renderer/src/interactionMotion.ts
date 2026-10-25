import { useLayoutEffect, useRef, type RefObject } from 'react'

type Rect = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>
type Origin = { element: HTMLElement; rect: Rect; time: number }
const origins = new Map<string, Origin>()
export function prefersReducedMotion(): boolean { return window.matchMedia('(prefers-reduced-motion: reduce)').matches }
export function magneticOffset(rect: Rect, x: number, y: number): { x: number; y: number } {
  const limit = (value: number): number => Math.max(-4, Math.min(4, value * .2))
  return { x: limit(x - rect.left - rect.width / 2), y: limit(y - rect.top - rect.height / 2) }
}
export function rememberCard(key: string, element: HTMLElement): void {
  if (origins.size >= 32 && !origins.has(key)) origins.delete(origins.keys().next().value!)
  origins.set(key, { element, rect: element.getBoundingClientRect(), time: Date.now() })
}
export function expansionTransform(source: Rect, target: Rect): string {
  const scale = Math.max(.12, Math.min(1, source.width / Math.max(1, target.width), source.height / Math.max(1, target.height)))
  const x = source.left + source.width / 2 - target.left - target.width / 2
  const y = source.top + source.height / 2 - target.top - target.height / 2
  return `translate3d(${x}px,${y}px,0) scale(${scale})`
}
/** Shared card-to-detail movement; no clones or delayed focus/interaction. */
export function useCardExpansion(key: string | undefined, root: RefObject<HTMLElement>): (done: () => void) => Promise<void> {
  const animation = useRef<Animation | null>(null)
  const closing = useRef(false)
  const mounted = useRef(true)
  const generation = useRef(0)
  useLayoutEffect(() => {
    generation.current++
    mounted.current = true; closing.current = false
    const node = root.current
    if (node) node.inert = false
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const cancel = (): void => { animation.current?.cancel(); animation.current = null }
    media.addEventListener('change', cancel)
    const origin = key ? origins.get(key) : undefined
    let frame = requestAnimationFrame(() => {
      // Native window resizing settles before measuring the destination.
      frame = requestAnimationFrame(() => {
        if (!node || !mounted.current || closing.current || prefersReducedMotion() || !node.animate) return
        const from = origin && Date.now() - origin.time < 1500 ? expansionTransform(origin.rect, node.getBoundingClientRect()) : 'translate3d(0,6px,0) scale(.98)'
        animation.current = node.animate([{ transform: from, opacity: .35 }, { transform: 'none', opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.22,1,.36,1)' })
      })
    })
    return () => { generation.current++; mounted.current = false; cancelAnimationFrame(frame); cancel(); media.removeEventListener('change', cancel) }
  }, [key, root])
  return async done => {
    if (closing.current) return
    closing.current = true
    const token = generation.current
    const node = root.current
    const current = node && typeof getComputedStyle === 'function' ? getComputedStyle(node) : undefined
    const from = { transform: current?.transform ?? 'none', opacity: Number(current?.opacity ?? 1) }
    if (node) node.inert = true
    animation.current?.cancel()
    if (node && !prefersReducedMotion() && node.animate) {
      const origin = key ? origins.get(key) : undefined
      const source = origin?.element.isConnected ? origin.element.getBoundingClientRect() : undefined
      const visible = source && source.width > 0 && source.height > 0 && source.top < window.innerHeight && source.top + source.height > 0
      const to = visible ? expansionTransform(source, node.getBoundingClientRect()) : 'translate3d(0,4px,0) scale(.98)'
      animation.current = node.animate([from, { transform: to, opacity: 0 }], { duration: 160, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' })
      await animation.current.finished.catch(() => undefined)
    }
    if (mounted.current && token === generation.current) done()
  }
}
