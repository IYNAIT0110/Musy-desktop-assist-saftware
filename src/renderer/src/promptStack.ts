import type { PromptItem } from './store'

export function promptChildren(items: PromptItem[]): Map<string, PromptItem[]> {
  const groups = new Map<string, PromptItem[]>()
  for (const item of items) if (item.parentId) {
    const group = groups.get(item.parentId) ?? []
    group.push(item); groups.set(item.parentId, group)
  }
  return groups
}
export function promptFamily(parent: PromptItem, children: PromptItem[]): PromptItem[] {
  const seen = new Set([parent.id])
  return [parent, ...children.filter(item => {
    if (item.parentId !== parent.id || seen.has(item.id)) return false
    seen.add(item.id); return true
  })]
}
export function stepStackIndex(index: number, direction: number, length: number): number {
  return length > 0 ? ((index + direction) % length + length) % length : 0
}
export function stackSwipe(dx: number, dy: number, width: number): -1 | 0 | 1 {
  return Math.abs(dx) >= Math.min(60, Math.max(24, width * .18)) && Math.abs(dx) > Math.abs(dy) ? dx < 0 ? 1 : -1 : 0
}
