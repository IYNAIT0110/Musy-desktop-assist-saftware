import { InteractiveButton } from './HoverFeedback'
import { useEffect, useRef, type PointerEvent } from 'react'

type Props = {
  disabled: boolean
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function LinkPromptActions({ disabled, confirmLabel, cancelLabel, onConfirm, onCancel }: Props): JSX.Element {
  const actionsRef = useRef<HTMLDivElement>(null)
  const boundaryRef = useRef<SVGPathElement>(null)
  const shapeRef = useRef<SVGSVGElement>(null)
  const frameRef = useRef<number | null>(null)
  const motionRef = useRef({ bend: 0, velocity: 0, target: 0, y: 28, targetY: 28 })

  const draw = (): void => {
    const actions = actionsRef.current
    const shape = shapeRef.current
    const boundary = boundaryRef.current
    if (!actions || !shape || !boundary) return

    const width = actions.clientWidth
    const height = actions.clientHeight
    const split = width * 2 / 3
    const { bend, y } = motionRef.current
    const edge = split + bend
    const spread = 17
    shape.setAttribute('viewBox', `0 0 ${width} ${height}`)
    boundary.setAttribute('d', `M 0 0 H ${split} C ${split} ${y - spread} ${edge} ${y - spread * .7} ${edge} ${y} C ${edge} ${y + spread * .7} ${split} ${y + spread} ${split} ${height} H 0 Z`)
  }

  const animate = (): void => {
    const motion = motionRef.current
    motion.velocity = (motion.velocity + (motion.target - motion.bend) * .28) * .62
    motion.bend += motion.velocity
    motion.y += (motion.targetY - motion.y) * .25
    draw()

    if (Math.abs(motion.target - motion.bend) > .08 || Math.abs(motion.velocity) > .08 || Math.abs(motion.targetY - motion.y) > .2) {
      frameRef.current = window.requestAnimationFrame(animate)
    } else {
      motion.bend = motion.target
      motion.y = motion.targetY
      draw()
      frameRef.current = null
    }
  }

  const schedule = (): void => {
    if (frameRef.current === null) frameRef.current = window.requestAnimationFrame(animate)
  }

  const onMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (disabled || event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const split = bounds.width * 2 / 3
    const x = event.clientX - bounds.left
    const distance = Math.abs(x - split)
    const proximity = Math.max(0, 1 - distance / 105)
    motionRef.current.target = 10 * Math.tanh((split - x) / 25) * proximity
    motionRef.current.targetY = Math.min(bounds.height - 12, Math.max(12, event.clientY - bounds.top))
    schedule()
  }

  const onLeave = (): void => {
    motionRef.current.target = 0
    motionRef.current.targetY = 28
    schedule()
  }

  useEffect(() => {
    draw()
    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current)
    }
  }, [])

  return (
    <div ref={actionsRef} className="link-prompt-actions" aria-hidden={disabled} onPointerMove={onMove} onPointerLeave={onLeave}>
      <svg ref={shapeRef} className="link-prompt-jelly" viewBox="0 0 300 56" preserveAspectRatio="none" aria-hidden="true">
        <path ref={boundaryRef} d="M 0 0 H 200 V 56 H 0 Z" />
      </svg>
      <InteractiveButton className="link-prompt-confirm" onClick={onConfirm} disabled={disabled} tabIndex={disabled ? -1 : 0}>{confirmLabel}</InteractiveButton>
      <InteractiveButton className="link-prompt-cancel" onClick={onCancel} tabIndex={disabled ? -1 : 0}>{cancelLabel}</InteractiveButton>
    </div>
  )
}
