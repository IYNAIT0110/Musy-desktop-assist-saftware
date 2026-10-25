type Rect = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>
export function rippleGeometry(rect: Rect, point?: { x: number; y: number }): { x: number; y: number; diameter: number } {
  const x = point ? Math.max(0, Math.min(rect.width, point.x - rect.left)) : rect.width / 2
  const y = point ? Math.max(0, Math.min(rect.height, point.y - rect.top)) : rect.height / 2
  return { x, y, diameter: 2 * Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y)) }
}

let dispose: (() => void) | undefined
interface RippleWave { button: HTMLButtonElement; layer: HTMLDivElement; animation: Animation }
/** Decorate native buttons without changing their DOM, layout or click handlers.
 * A separate, pointer-transparent layer follows its source while it animates. */
export function initButtonRipples(): () => void {
  if (dispose) return dispose
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  const waves = new Set<RippleWave>()
  let frame = 0
  const remove = (wave: RippleWave): void => {
    if (!waves.delete(wave)) return
    wave.animation.cancel(); wave.layer.remove()
    if (!waves.size && frame) { cancelAnimationFrame(frame); frame = 0 }
  }
  const clear = (): void => { for (const wave of [...waves]) remove(wave) }
  const place = (layer: HTMLDivElement, button: HTMLButtonElement): boolean => {
    if (!button.isConnected || button.closest('[inert]')) return false
    const rect = button.getBoundingClientRect()
    if (!rect.width || !rect.height || rect.bottom <= 0 || rect.top >= window.innerHeight || rect.right <= 0 || rect.left >= window.innerWidth) return false
    const transform = `translate3d(${rect.left}px,${rect.top}px,0)`
    const width = `${rect.width}px`; const height = `${rect.height}px`
    if (layer.style.transform !== transform) layer.style.transform = transform
    if (layer.style.width !== width) layer.style.width = width
    if (layer.style.height !== height) layer.style.height = height
    return true
  }
  const follow = (): void => {
    frame = 0
    for (const wave of [...waves]) if (!place(wave.layer, wave.button)) remove(wave)
    if (waves.size) frame = requestAnimationFrame(follow)
  }
  const show = (button: HTMLButtonElement, point?: { x: number; y: number }): void => {
    if (button.disabled || button.getAttribute('aria-disabled') === 'true' || button.getAttribute('aria-busy') === 'true' || button.closest('[data-ripple="off"]') || document.hidden) return
    const rect = button.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    // Keep repeated clicks responsive, with bounded transient DOM and animation work.
    const own = [...waves].filter(wave => wave.button === button)
    while (own.length >= 3) remove(own.shift()!)
    if (waves.size >= 24) remove(waves.values().next().value!)
    const style = getComputedStyle(button)
    const geometry = rippleGeometry(rect, point)
    const layer = document.createElement('div')
    layer.className = 'musy-button-ripple'
    layer.setAttribute('aria-hidden', 'true')
    layer.style.borderRadius = style.borderRadius
    layer.style.color = style.color
    const circle = document.createElement('span')
    circle.style.width = circle.style.height = `${geometry.diameter}px`
    circle.style.left = `${geometry.x - geometry.diameter / 2}px`
    circle.style.top = `${geometry.y - geometry.diameter / 2}px`
    layer.append(circle)
    if (!place(layer, button)) return
    document.body.append(layer)
    const animation = circle.animate(reduced.matches
      ? [{ opacity: .12 }, { opacity: 0 }]
      : [{ transform: 'scale(0)', opacity: .24 }, { transform: 'scale(.7)', opacity: .16, offset: .45 }, { transform: 'scale(1)', opacity: 0 }],
    { duration: reduced.matches ? 120 : 600, easing: 'cubic-bezier(0,0,.2,1)', fill: 'forwards' })
    const wave = { button, layer, animation }
    waves.add(wave)
    void animation.finished.then(() => remove(wave), () => remove(wave))
    if (!frame) frame = requestAnimationFrame(follow)
  }
  const buttonAt = (event: Event): HTMLButtonElement | null => event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button') : null
  const pointer = (event: PointerEvent): void => {
    if (event.button !== 0 || !event.isPrimary) return
    const button = buttonAt(event)
    if (button) show(button, { x: event.clientX, y: event.clientY })
  }
  const key = (event: KeyboardEvent): void => {
    if (event.repeat || event.isComposing || !['Enter', ' '].includes(event.key)) return
    const button = buttonAt(event)
    if (button) show(button)
  }
  const visibility = (): void => { if (document.hidden) clear() }
  document.addEventListener('pointerdown', pointer, true)
  document.addEventListener('keydown', key, true)
  document.addEventListener('visibilitychange', visibility)
  reduced.addEventListener('change', clear)
  const cleanup = (): void => {
    clear()
    document.removeEventListener('pointerdown', pointer, true)
    document.removeEventListener('keydown', key, true)
    document.removeEventListener('visibilitychange', visibility)
    reduced.removeEventListener('change', clear)
    window.removeEventListener('pagehide', cleanup)
    dispose = undefined
  }
  window.addEventListener('pagehide', cleanup)
  dispose = cleanup
  return cleanup
}
