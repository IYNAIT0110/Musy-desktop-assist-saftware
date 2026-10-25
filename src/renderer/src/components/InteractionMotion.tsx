import { InteractiveButton } from './HoverFeedback'
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from 'react'
import { tx, useLang } from '../i18n'
import { magneticOffset, prefersReducedMotion } from '../interactionMotion'
import './interaction-motion.css'

/** The button stays still; only its visual content follows the pointer. */
export function MagneticButton({ children, onPointerMove, onPointerLeave, onPointerCancel, onBlur, ...props }: ButtonHTMLAttributes<HTMLButtonElement>): JSX.Element {
  const visual = useRef<HTMLSpanElement>(null)
  const reset = (): void => { if (visual.current) visual.current.style.transform = 'translate3d(0,0,0)' }
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    media.addEventListener('change', reset)
    return () => media.removeEventListener('change', reset)
  }, [])
  return <InteractiveButton {...props} data-no-drag
    onPointerMove={event => {
      onPointerMove?.(event)
      if (props.disabled || event.pointerType !== 'mouse' || event.buttons || prefersReducedMotion() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) { reset(); return }
      const offset = magneticOffset(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY)
      if (visual.current) visual.current.style.transform = `translate3d(${offset.x}px,${offset.y}px,0)`
    }}
    onPointerLeave={event => { reset(); onPointerLeave?.(event) }} onPointerCancel={event => { reset(); onPointerCancel?.(event) }} onBlur={event => { reset(); onBlur?.(event) }}>
    <span ref={visual} className="musy-magnet-visual">{children}</span>
  </InteractiveButton>
}

type StateButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & {
  onAction?: (event: MouseEvent<HTMLButtonElement>) => unknown | Promise<unknown>
  pending?: boolean
  successLabel?: string
  children: ReactNode
}
/** False means canceled/handled failure. Only a successful action earns a check. */
export function StateButton({ onAction, pending = false, successLabel, children, disabled, type = 'button', className = '', ...props }: StateButtonProps): JSX.Element {
  useLang()
  const [state, setState] = useState<'idle' | 'busy' | 'success' | 'error'>('idle')
  const locked = useRef(false)
  const alive = useRef(true)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => { alive.current = true; return () => { alive.current = false; clearTimeout(timer.current) } }, [])
  const phase = pending ? 'busy' : state
  const label = phase === 'busy' ? tx('处理中…') : phase === 'success' ? (successLabel ?? tx('已完成')) : tx('未完成')
  const act = async (event: MouseEvent<HTMLButtonElement>): Promise<void> => {
    if (type === 'submit') event.preventDefault()
    if (!onAction || locked.current || pending || disabled) return
    locked.current = true; clearTimeout(timer.current); setState('busy')
    try {
      const result = await onAction(event)
      if (alive.current) setState(result === false ? 'idle' : 'success')
    } catch { if (alive.current) setState('error') }
    finally {
      locked.current = false
      if (alive.current) timer.current = setTimeout(() => setState('idle'), 1400)
    }
  }
  return <InteractiveButton {...props} type={type} disabled={disabled || phase === 'busy'} aria-busy={phase === 'busy'}
    className={`musy-state-button ${className}`} data-phase={phase} data-hover-paused={phase !== 'idle'} onClick={onAction ? act : undefined}>
    <span className="musy-state-label" aria-hidden={phase !== 'idle'}>{children}</span>
    {phase !== 'idle' && <span className="musy-state-feedback" role="status">
      {phase === 'busy' ? <span className="musy-state-spinner" aria-hidden="true" /> : <svg className="musy-state-mark" aria-hidden="true" width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={phase === 'success' ? 'm4 10 4 4 8-8' : 'm6 6 8 8m0-8-8 8'} /></svg>}
      <span>{label}</span>
    </span>}
  </InteractiveButton>
}
