import { isAbsolute, join } from 'path'
import { fileURLToPath } from 'url'
import { mkdir, writeFile } from 'fs/promises'
import { createHash } from 'crypto'
import { execFile } from 'child_process'
import type { TreasureStore } from './treasureStore'

interface ClipboardSource {
  readBuffer: (format: string) => Buffer
  readText: () => string
}

interface ImportSource extends ClipboardSource {
  readImage: () => { isEmpty: () => boolean; toPNG: () => Buffer }
}

export async function importTreasureClipboard(store: TreasureStore, source: ImportSource, nativeFiles: string[] = []): Promise<'files' | 'image'> {
  if (store.busy) throw new Error('已有导入任务，请等待或取消')
  const files = nativeFiles.length ? paths(nativeFiles) : clipboardFilePaths(source)
  if (files.length) { await store.startImport(files); return 'files' }
  const image = source.readImage()
  if (image.isEmpty()) throw new Error('剪贴板中没有可导入的文件或图片。请先复制文件、文件夹、绝对路径，或截取图片。')
  const png = image.toPNG()
  if (png.length > 128 * 1024 * 1024) throw new Error('剪贴板图片超过 128 MB，请先保存为文件再导入')
  const path = await persistCollectedImage(store.directory, png)
  await store.startImport([path])
  return 'image'
}

export async function persistCollectedImage(directory: string, png: Buffer): Promise<string> {
  const folder = join(directory, 'clipboard')
  await mkdir(folder, { recursive: true })
  const filename = '剪贴板图片-' + createHash('sha256').update(png).digest('hex') + '.png'
  const path = join(folder, filename)
  try { await writeFile(path, png, { flag: 'wx' }) }
  catch (e) { if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e }
  return path
}

/** Electron 的 FileNameW 可能只返回第一个文件，使用系统 STA 接口读取完整多选列表。 */
export async function windowsClipboardFiles(): Promise<string[]> {
  if (process.platform !== 'win32') return []
  const script = "[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false); Add-Type -AssemblyName System.Windows.Forms; ConvertTo-Json -InputObject @([System.Windows.Forms.Clipboard]::GetFileDropList()) -Compress"
  const executable = join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
  return new Promise(resolve => {
    execFile(executable, ['-NoProfile', '-NonInteractive', '-STA', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')],
      { windowsHide: true, timeout: 4000, maxBuffer: 4 * 1024 * 1024, encoding: 'utf8' }, (error, output) => {
        if (error) { resolve([]); return }
        try {
          const result = JSON.parse(output.replace(/^\uFEFF/, ''))
          resolve(Array.isArray(result) && result.every(value => typeof value === 'string') ? paths(result) : [])
        } catch { resolve([]) }
      })
  })
}

function paths(values: string[]): string[] {
  return [...new Set(values.map(value => {
    const clean = value.trim().replace(/^"(.*)"$/, '$1')
    try { return clean.startsWith('file:') ? fileURLToPath(clean) : clean } catch { return '' }
  }).filter(value => value.length <= 32768 && !value.includes('\0') && isAbsolute(value)))].slice(0, 10000)
}

/** Windows 资源管理器多文件列表优先，随后兼容单文件格式及复制的绝对路径。 */
export function clipboardFilePaths(source: ClipboardSource): string[] {
  const read = (format: string): Buffer => {
    try { return source.readBuffer(format) } catch { return Buffer.alloc(0) }
  }
  const drop = read('CF_HDROP')
  if (drop.length >= 20 && drop.length <= 16 * 1024 * 1024) {
    const offset = drop.readUInt32LE(0)
    const wide = drop.readUInt32LE(16) !== 0
    if (offset >= 20 && offset < drop.length) {
      const data = drop.subarray(offset)
      // Unicode 文件列表是当前 Windows 的标准；旧 ANSI 格式仅接受 ASCII，
      // 避免按错误代码页解码中文路径，随后继续尝试 Unicode 格式。
      if ((wide && offset % 2 === 0 && data.length % 2 === 0) || (!wide && data.every(byte => byte < 128))) {
        const result = paths(data.toString(wide ? 'utf16le' : 'ascii').split('\0').filter(Boolean))
        if (result.length) return result
      }
    }
  }
  const unicode = read('FileNameW')
  if (unicode.length && unicode.length <= 65536 && unicode.length % 2 === 0) {
    const result = paths([unicode.toString('utf16le').split('\0')[0]])
    if (result.length) return result
  }
  return paths(source.readText().split(/\r?\n/).filter(line => line.trim() && !line.trim().startsWith('#')))
}
