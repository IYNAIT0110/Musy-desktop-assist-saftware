import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, type ButtonHTMLAttributes } from 'react'
import { hoverDirection, directionOffset } from '../hoverMotion'
import './hover-feedback.css'

/** Interactive Hover Button treatment, adapted to existing sizes and theme tokens. */
export const InteractiveButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(function InteractiveButton({ children, className = '', onPointerEnter, onFocus, ...props }, forwarded) {
  const root = useRef<HTMLButtonElement>(null)
  useImperativeHandle(forwarded, () => root.current!)
  const measure = (): void => {
    const node = root.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    const style = getComputedStyle(node)
    node.style.setProperty('--hover-justify', style.justifyContent === 'normal' ? 'center' : style.justifyContent)
    node.dataset.hoverCompact = String(rect.width < 68 || !node.querySelector('.musy-hover-rest')?.textContent?.trim())
    node.style.setProperty('--hover-scale', String(Math.max(1, Math.hypot(rect.width, rect.height) / 4)))
  }
  useLayoutEffect(measure)
  return <button {...props} ref={root} className={`musy-interactive-button ${className}`}
    onPointerEnter={event => { measure(); onPointerEnter?.(event) }} onFocus={event => { measure(); onFocus?.(event) }}>
    <span aria-hidden="true" className="musy-hover-fill" />
    <span className="musy-hover-rest">{children}</span>
    <span aria-hidden="true" className="musy-hover-active"><span className="musy-hover-copy">{children}</span><svg className="musy-hover-arrow" width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12m-5-5 5 5-5 5" /></svg></span>
  </button>
})

/** Direction-aware layer on the existing card, leaving its contents and gestures intact. */
export function DirectionalHover({ as: Tag = 'div', children, className = '', onPointerEnter, onPointerLeave, onPointerCancel, onDragStart, ...props }: ButtonHTMLAttributes<HTMLElement> & { as?: 'div' | 'button' }): JSX.Element {
  const root = useRef<HTMLElement | null>(null)
  const wash = useRef<HTMLSpanElement>(null)
  const animation = useRef<Animation | null>(null)
  const reset = (): void => {
    animation.current?.cancel(); animation.current = null
    if (wash.current) { wash.current.style.opacity = '0'; wash.current.style.transform = 'none' }
  }
  useLayoutEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const cancel = (): void => { animation.current?.cancel(); animation.current = null }
    media.addEventListener('change', cancel)
    return () => { cancel(); media.removeEventListener('change', cancel) }
  }, [])
  const move = (x: number, y: number, entering: boolean, pointerType: string): void => {
    const node = root.current; const layer = wash.current
    if (!node || !layer || props.disabled || props['aria-disabled'] === true || props['aria-disabled'] === 'true' || pointerType !== 'mouse' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches || node.closest('[inert]')) return
    const direction = hoverDirection(node.getBoundingClientRect(), x, y)
    node.dataset.hoverDirection = direction
    const current = getComputedStyle(layer)
    const previous = { transform: current.transform, opacity: current.opacity }
    const interrupted = animation.current?.playState === 'running'
    animation.current?.cancel()
    const offset = directionOffset(direction)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    layer.style.opacity = entering ? '1' : '0'
    layer.style.transform = entering || reduced ? 'none' : offset
    const from = interrupted ? previous : { transform: entering && !reduced ? offset : 'none', opacity: entering ? 0 : 1 }
    const to = { transform: entering || reduced ? 'none' : offset, opacity: entering ? 1 : 0 }
    animation.current = layer.animate(reduced ? [{ opacity: from.opacity }, { opacity: to.opacity }] : [from, to], { duration: reduced ? 90 : entering ? 180 : 120, easing: 'cubic-bezier(.22,1,.36,1)' })
  }
  return <Tag {...props} ref={node => { root.current = node }} className={`musy-direction-card ${className}`}
    onPointerEnter={event => { move(event.clientX, event.clientY, true, event.pointerType); onPointerEnter?.(event) }}
    onPointerLeave={event => { move(event.clientX, event.clientY, false, event.pointerType); onPointerLeave?.(event) }}
    onPointerCancel={event => { reset(); onPointerCancel?.(event) }} onDragStart={event => { reset(); onDragStart?.(event) }}>
    {children}<span ref={wash} className="musy-direction-wash" aria-hidden="true" />
  </Tag>
}
