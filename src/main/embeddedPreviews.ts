import { open, type FileHandle } from 'fs/promises'
import { inflateSync, inflateRawSync, deflateSync } from 'zlib'

// Rhino / DWG / SKP extraction adapted from cad-preview (MIT), Cameron Tacklind.
// See licenses/cad-preview-MIT.txt. Reads and decompression are bounded here.
const MB = 1024 * 1024
const MAX_IMAGE = 16 * MB
const MAX_SCAN = 16 * MB
const PNG = Buffer.from('89504e470d0a1a0a', 'hex')
const SENTINEL = Buffer.from('1f256d07d43628289d57ca3f9d44102b', 'hex')
const crcTable = Array.from({ length: 256 }, (_, value) => {
  for (let i = 0; i < 8; i++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  return value >>> 0
})
function crc32(data: Buffer): number {
  let crc = 0xffffffff
  for (const byte of data) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}
function chunk(name: string, data: Buffer): Buffer {
  const type = Buffer.from(name); const size = Buffer.alloc(4); size.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([type, data])))
  return Buffer.concat([size, type, data, crc])
}
function dibInfo(data: Buffer): { width: number; height: number; bpp: number; palette: number; pixels: number; stride: number } | null {
  if (data.length < 40 || data.readUInt32LE(0) !== 40) return null
  const width = data.readInt32LE(4); const height = Math.abs(data.readInt32LE(8)); const bpp = data.readUInt16LE(14)
  const colors = data.readUInt32LE(32)
  if (width < 1 || height < 1 || width > 4096 || height > 4096 || width * height > 4 * 1024 * 1024 ||
      data.readUInt16LE(12) !== 1 || ![8, 24, 32].includes(bpp) || data.readUInt32LE(16) !== 0 || (bpp === 8 && colors > 256)) return null
  const palette = bpp === 8 ? (colors || 256) * 4 : 0
  const stride = Math.floor((width * bpp + 31) / 32) * 4
  const pixels = stride * height
  return pixels + palette <= MAX_IMAGE ? { width, height, bpp, palette, pixels, stride } : null
}
export function dibToPng(data: Buffer): Buffer | null {
  const info = dibInfo(data)
  if (!info || data.length < 40 + info.palette + info.pixels) return null
  const { width, height, bpp, palette, stride } = info
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    const sourceY = data.readInt32LE(8) < 0 ? y : height - 1 - y
    for (let x = 0; x < width; x++) {
      let from = 40 + palette + sourceY * stride + x * (bpp / 8)
      if (bpp === 8) {
        const index = data[from]
        if (index * 4 >= palette) return null
        from = 40 + index * 4
      }
      const to = y * (width * 4 + 1) + 1 + x * 4
      raw[to] = data[from + 2]; raw[to + 1] = data[from + 1]; raw[to + 2] = data[from]; raw[to + 3] = 255
    }
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6
  return Buffer.concat([PNG, chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}
function pngAt(data: Buffer, start: number): Buffer | null {
  if (!data.subarray(start, start + 8).equals(PNG)) return null
  let p = start + 8
  for (let count = 0; count < 10000 && p + 12 <= data.length && p - start <= MAX_IMAGE; count++) {
    const size = data.readUInt32BE(p)
    if (size > MAX_IMAGE || p + 12 + size > data.length || p + 12 + size - start > MAX_IMAGE) return null
    const type = data.toString('ascii', p + 4, p + 8)
    if (count === 0) {
      if (type !== 'IHDR' || size !== 13) return null
      const width = data.readUInt32BE(p + 8); const height = data.readUInt32BE(p + 12)
      if (!width || !height || width * height > 16 * 1024 * 1024) return null
    }
    p += 12 + size
    if (type === 'IEND' && size === 0) return data.subarray(start, p)
  }
  return null
}
export function rhinoPreview(data: Buffer): Buffer | null {
  if (!data.subarray(0, 23).equals(Buffer.from('3D Geometry File Format'))) return null
  const signature = Buffer.from([40, 0, 0, 0])
  let from = 32
  for (let count = 0; count < 128; count++) {
    const at = data.indexOf(signature, from)
    if (at < 0) return null
    from = at + 4
    const info = dibInfo(data.subarray(at, at + 40))
    if (!info || info.width < 8 || info.height < 8) continue
    let compressed = false
    for (let p = at + 40; p < Math.min(at + 40 + info.palette + 96, data.length - 2); p++) {
      if (data[p] !== 0x78 || ![0x01, 0x9c, 0xda, 0x5e].includes(data[p + 1])) continue
      compressed = true
      try {
        const decoded = inflateSync(data.subarray(p), { maxOutputLength: info.pixels + info.palette })
        if (decoded.length === info.pixels + info.palette) return dibToPng(Buffer.concat([data.subarray(at, at + 40), decoded]))
        if (decoded.length === info.pixels && info.palette) return dibToPng(Buffer.concat([data.subarray(at, at + 40 + info.palette), decoded]))
      } catch { /* Unsupported or damaged compressed preview; try another candidate. */ }
    }
    // openNURBS uncompressed previews have their pixels directly after the DIB.
    if (!compressed) { const direct = dibToPng(data.subarray(at)); if (direct) return direct }
  }
  return null
}
export function sketchupPreview(data: Buffer): Buffer | null {
  if (!data.subarray(0, 20).equals(Buffer.from('fffeff0e53006b00650074006300680055007000', 'hex'))) return null
  // Only the early preview, never scan arbitrary model textures.
  const start = data.indexOf(PNG, 20)
  return start >= 0 && start < MB ? pngAt(data, start) : null
}
export function grasshopperXmlPreview(xml: string): Buffer | null {
  const item = /<item\b[^>]*\bname\s*=\s*["']Thumbnail["'][^>]*>([\s\S]*?)<\/item>/i.exec(xml)
  if (!item) return null
  const bitmap = /<bitmap\b[^>]*>([A-Za-z0-9+/=\s]+)<\/bitmap>/i.exec(item[1])
  if (!bitmap || bitmap[1].length > MAX_IMAGE * 1.4) return null
  const data = Buffer.from(bitmap[1].replace(/\s/g, ''), 'base64')
  return pngAt(data, 0)
}
export function grasshopperBinaryPreview(data: Buffer): Buffer | null {
  try {
    const archive = inflateRawSync(data, { maxOutputLength: 32 * MB })
    if (!archive.subarray(0, 5).equals(Buffer.from([4, 82, 111, 111, 116]))) return null
    // Binary GH_IO dictionary item: string "Thumbnail", unindexed (-1),
    // gh_drawing_bitmap (37), byte count, PNG. Do not use component IconOverride.
    const marker = Buffer.concat([Buffer.from([9]), Buffer.from('Thumbnail'), Buffer.from('ffffffff25000000', 'hex')])
    const at = archive.indexOf(marker)
    if (at < 0 || at + marker.length + 4 > archive.length) return null
    const length = archive.readUInt32LE(at + marker.length)
    const start = at + marker.length + 4
    if (length > MAX_IMAGE || start + length > archive.length) return null
    const png = pngAt(archive.subarray(start, start + length), 0)
    return png?.length === length ? png : null
  } catch { return null }
}
async function read(handle: FileHandle, at: number, length: number): Promise<Buffer> {
  if (!Number.isSafeInteger(at) || at < 0 || length < 0 || length > MAX_SCAN) return Buffer.alloc(0)
  const buffer = Buffer.alloc(length)
  const { bytesRead } = await handle.read(buffer, 0, length, at)
  return buffer.subarray(0, bytesRead)
}
async function psdPreview(file: FileHandle, size: number): Promise<Buffer | null> {
  const head = await read(file, 0, 30)
  if (head.length !== 30 || head.toString('ascii', 0, 4) !== '8BPS' || ![1, 2].includes(head.readUInt16BE(4))) return null
  const sectionAt = 30 + head.readUInt32BE(26)
  if (sectionAt + 4 > size) return null
  const lengthBytes = await read(file, sectionAt, 4)
  if (lengthBytes.length !== 4) return null
  const length = lengthBytes.readUInt32BE(0)
  if (length > MAX_IMAGE || sectionAt + 4 + length > size) return null
  const resources = await read(file, sectionAt + 4, length)
  let p = 0
  for (let count = 0; count < 10000 && p + 12 <= resources.length; count++) {
    if (resources.toString('ascii', p, p + 4) !== '8BIM') return null
    const id = resources.readUInt16BE(p + 4)
    const nameLength = resources[p + 6] + 1
    p += 6 + nameLength + (nameLength % 2)
    if (p + 4 > resources.length) return null
    const blockLength = resources.readUInt32BE(p); p += 4
    if (p + blockLength > resources.length) return null
    if (id === 1036 && blockLength > 28 && resources.readUInt32BE(p) === 1) {
      const width = resources.readUInt32BE(p + 4); const height = resources.readUInt32BE(p + 8)
      const compressedSize = resources.readUInt32BE(p + 20)
      if (width && height && width * height <= 16 * 1024 * 1024 && compressedSize <= blockLength - 28) {
        const jpeg = resources.subarray(p + 28, p + 28 + compressedSize)
        if (jpeg[0] === 255 && jpeg[1] === 216 && jpeg[2] === 255) return jpeg
      }
    }
    p += blockLength + (blockLength % 2)
  }
  return null
}
async function zipPreview(file: FileHandle, size: number, sketchup: boolean): Promise<Buffer | null> {
  const tailAt = Math.max(0, size - 65557)
  const tail = await read(file, tailAt, size - tailAt)
  let eocd = tail.length - 22
  for (; eocd >= 0; eocd--) if (tail.readUInt32LE(eocd) === 0x06054b50 && eocd + 22 + tail.readUInt16LE(eocd + 20) === tail.length) break
  if (eocd < 0 || tail.readUInt16LE(eocd + 4) || tail.readUInt16LE(eocd + 6)) return null
  const count = tail.readUInt16LE(eocd + 10)
  const centralLength = tail.readUInt32LE(eocd + 12); const centralOffset = tail.readUInt32LE(eocd + 16)
  if (count > 20000 || centralLength > 8 * MB || centralOffset === 0xffffffff) return null
  const base = tailAt + eocd - centralLength - centralOffset
  const central = await read(file, centralOffset + base, centralLength)
  let p = 0
  for (let i = 0; i < count && p + 46 <= central.length; i++) {
    if (central.readUInt32LE(p) !== 0x02014b50) return null
    const nameSize = central.readUInt16LE(p + 28); const extra = central.readUInt16LE(p + 30); const comment = central.readUInt16LE(p + 32)
    const end = p + 46 + nameSize + extra + comment
    if (end > central.length) return null
    const name = central.toString('utf8', p + 46, p + 46 + nameSize)
    const match = sketchup ? /^(meta\/model_thumbnail|doc_thumbnail|preview)\.png$/i.test(name) : /^docProps\/thumbnail\.(png|jpe?g)$/i.test(name)
    if (match) {
      const method = central.readUInt16LE(p + 10); const flags = central.readUInt16LE(p + 8)
      const packed = central.readUInt32LE(p + 20); const unpacked = central.readUInt32LE(p + 24)
      const local = base + central.readUInt32LE(p + 42)
      if ((flags & 1) || ![0, 8].includes(method) || packed > MAX_IMAGE || unpacked > MAX_IMAGE || local < 0) return null
      const header = await read(file, local, 30)
      if (header.length !== 30 || header.readUInt32LE(0) !== 0x04034b50) return null
      const start = local + 30 + header.readUInt16LE(26) + header.readUInt16LE(28)
      if (start + packed > size) return null
      const buffer = await read(file, start, packed)
      const data = method === 8 ? inflateRawSync(buffer, { maxOutputLength: MAX_IMAGE }) : buffer
      if (data.length !== unpacked || crc32(data) !== central.readUInt32LE(p + 16)) return null
      return data.subarray(0, 8).equals(PNG) ? pngAt(data, 0) : data[0] === 255 && data[1] === 216 ? data : null
    }
    p = end
  }
  return null
}
async function dwgPreview(file: FileHandle, size: number): Promise<Buffer | null> {
  const head = await read(file, 0, Math.min(size, MB))
  if (head.length < 17 || !/^AC10\d\d/.test(head.toString('ascii', 0, 6))) return null
  let at = head.readUInt32LE(13)
  let section = at + 21 <= size ? await read(file, at, 21) : Buffer.alloc(0)
  if (!section.subarray(0, 16).equals(SENTINEL)) {
    at = head.indexOf(SENTINEL)
    if (at < 0) return null
    section = await read(file, at, 21)
  }
  if (section.length !== 21 || section[20] > 16) return null
  const entries = await read(file, at + 21, section[20] * 9)
  let bitmap: Buffer | null = null
  for (let p = 0; p + 9 <= entries.length; p += 9) {
    const code = entries[p]; const start = entries.readUInt32LE(p + 1); const length = entries.readUInt32LE(p + 5)
    if (![2, 6].includes(code) || length > MAX_IMAGE || start + length > size) continue
    const data = await read(file, start, length)
    if (code === 6) { const png = pngAt(data, 0); if (png) return png }
    if (code === 2) bitmap = dibToPng(data)
  }
  return bitmap
}
export async function readEmbeddedPreview(path: string, ext: string): Promise<Buffer | null> {
  const file = await open(path, 'r')
  try {
    const { size } = await file.stat()
    if (['psd', 'psb'].includes(ext)) return await psdPreview(file, size)
    if (['pptx', 'potx', 'ppsx', 'docx', 'xlsx', 'skp', 'skb'].includes(ext)) {
      const zipped = await zipPreview(file, size, ['skp', 'skb'].includes(ext)).catch(() => null)
      if (zipped) return zipped
    }
    if (['dwg', 'bak'].includes(ext)) return await dwgPreview(file, size)
    if (!['3dm', '3dmbak', 'skp', 'skb', 'ghx', 'gh'].includes(ext)) return null
    const prefix = await read(file, 0, Math.min(size, MAX_SCAN))
    if (['3dm', '3dmbak'].includes(ext)) return rhinoPreview(prefix)
    if (['skp', 'skb'].includes(ext)) return sketchupPreview(prefix)
    if (ext === 'ghx' && size <= MAX_SCAN) return grasshopperXmlPreview(prefix.toString('utf8'))
    if (ext === 'gh' && size <= MAX_SCAN) return grasshopperBinaryPreview(prefix)
    return null
  } catch { return null } finally { await file.close() }
}
