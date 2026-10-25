import type { TreasureDrop } from '../../shared/treasure'

let outgoingUntil = 0
let remoteDragging = false
if (typeof window !== 'undefined' && window.api?.treasure?.onDragState) {
  window.api.treasure.onDragState(active => { remoteDragging = active })
}
export function isNativeAssetDrag(): boolean { return remoteDragging || Date.now() < outgoingUntil }
export async function dragAssetFiles(ids: string[]): Promise<void> {
  outgoingUntil = Date.now() + 120000
  try { await window.api.treasure.dragOut(ids) }
  finally { outgoingUntil = Date.now() + 600 }
}
export function canCollectTransfer(transfer: DataTransfer): boolean {
  return !isNativeAssetDrag() && !transfer.types.includes('application/x-musy-assets') &&
    transfer.types.some(type => ['Files', 'text/uri-list', 'text/plain'].includes(type))
}
export async function readTreasureDrop(transfer: DataTransfer): Promise<TreasureDrop> {
  if (isNativeAssetDrag() || transfer.types.includes('application/x-musy-assets')) throw new Error('这是百宝匣中的素材，无需再次收集')
  const drop: TreasureDrop = { paths: [], images: [] }
  let total = 0
  for (const file of Array.from(transfer.files)) {
    const path = window.api.getFilePath(file)
    if (path) { drop.paths.push(path); continue }
    if (!file.type.startsWith('image/')) continue
    total += file.size
    if (drop.images.length >= 32 || total > 128 * 1024 * 1024) throw new Error('图片过多或超过 128 MB，请分批导入')
    drop.images.push({ name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) })
  }
  if (!drop.paths.length && !drop.images.length) {
    const text = transfer.getData('text/uri-list') || transfer.getData('text/plain')
    for (const line of text.split(/\r?\n/).map(value => value.trim()).filter(Boolean)) {
      if (line.startsWith('#')) continue
      if (/^[A-Za-z]:[\\/]|^\\\\/.test(line)) drop.paths.push(line)
      else if (/^file:/i.test(line)) {
        try {
          const url = new URL(line)
          const path = decodeURIComponent(url.pathname).replace(/^\/([a-z]:)/i, '$1').replace(/\//g, '\\')
          drop.paths.push(url.hostname ? '\\\\' + url.hostname + path : path)
        } catch { /* Ignore malformed local URLs. */ }
      }
    }
  }
  drop.paths = [...new Set(drop.paths)]
  if (!drop.paths.length && !drop.images.length) throw new Error('请拖入本地文件或图片；网页图片可先复制，再用“从剪贴板导入”')
  return drop
}
