export const FLOAT_ANIMATION_GUTTER = 72
export interface FloatInsets { top: number; bottom: number }
export function floatInsets(level: number): FloatInsets {
  // Keep the same native vertical canvas for the ball and navigation. Moving a
  // transparent HWND while its renderer resizes can expose an empty frame.
  return { top: FLOAT_ANIMATION_GUTTER, bottom: level === 3 || level === 4 ? 0 : FLOAT_ANIMATION_GUTTER }
}
export function reframeFloatBounds(bounds: { x: number; y: number; width: number; height: number }, previous: FloatInsets, next: FloatInsets, target: { w: number; h: number }, workArea: { x: number; y: number; width: number; height: number }): { x: number; y: number; width: number; height: number } {
  const height = Math.max(64 + next.top + next.bottom, bounds.height + next.top - previous.top + next.bottom - previous.bottom)
  let x = bounds.x
  let y = bounds.y + previous.top - next.top
  if (target.w > bounds.width || target.h > height) {
    if (x + target.w > workArea.x + workArea.width) x = workArea.x + workArea.width - target.w
    if (y + target.h > workArea.y + workArea.height) y = workArea.y + workArea.height - target.h
  }
  return { x, y: Math.max(workArea.y, y), width: bounds.width, height }
}
export function floatSize(level: number, workHeight: number): { w: number; h: number } {
  const sizes: Record<number, { w: number; h: number }> = { 1: { w: 64, h: 64 }, 2: { w: 312, h: 64 }, 3: { w: 760, h: 680 }, 4: { w: 760, h: 1100 } }
  const value = sizes[level] ?? sizes[1]
  const inset = floatInsets(level in sizes ? level : 1)
  const height = value.h + inset.top + inset.bottom
  return { w: value.w, h: level >= 3 ? Math.min(height, Math.max(64 + inset.top, workHeight - 12)) : height }
}
export function floatGutterContains(bounds: { x: number; y: number; width: number; height: number }, inset: FloatInsets, point: { x: number; y: number }): boolean {
  return point.x >= bounds.x && point.x < bounds.x + bounds.width && point.y >= bounds.y && point.y < bounds.y + bounds.height &&
    (point.y < bounds.y + inset.top || point.y >= bounds.y + bounds.height - inset.bottom)
}
