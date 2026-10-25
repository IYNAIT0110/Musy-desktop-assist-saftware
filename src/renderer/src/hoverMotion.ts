export type HoverDirection = 'top' | 'right' | 'bottom' | 'left'
export function hoverDirection(rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>, x: number, y: number): HoverDirection {
  const dx = (x - rect.left - rect.width / 2) / Math.max(1, rect.width)
  const dy = (y - rect.top - rect.height / 2) / Math.max(1, rect.height)
  return Math.abs(dx) > Math.abs(dy) ? dx < 0 ? 'left' : 'right' : dy < 0 ? 'top' : 'bottom'
}
export function directionOffset(direction: HoverDirection, distance = '100%'): string {
  return direction === 'left' ? `translate3d(-${distance},0,0)` : direction === 'right' ? `translate3d(${distance},0,0)` : direction === 'top' ? `translate3d(0,-${distance},0)` : `translate3d(0,${distance},0)`
}
