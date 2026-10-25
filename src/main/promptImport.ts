import { nativeImage } from 'electron'
import { readFile } from 'fs/promises'
import { basename, extname } from 'path'

export interface ImportedPrompt {
  text: string
  tags: string[]
  image?: string
  note?: string
}

export interface PromptImportResult {
  fileName: string
  items: ImportedPrompt[]
  warnings: string[]
}

type ImportConfig = { baseUrl: string; apiKey: string; model: string }
type ExtractedDocument = { text: string; images: Map<string, string>; warnings: string[] }

const MAX_FILE_BYTES = 25 * 1024 * 1024
const MAX_DOCUMENT_CHARS = 70000
const MAX_AI_IMAGES = 8

function decodeEntities(value: string): string {
  return value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (_all, entity: string) => {
    const named: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
    if (entity[0] !== '#') return named[entity.toLowerCase()] ?? ''
    const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10)
    return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : ''
  })
}

function thumbnail(dataUri: string): string | null {
  try {
    if (!/^data:image\/(png|jpeg|jpg|webp|gif|bmp);base64,/i.test(dataUri)) return null
    const image = nativeImage.createFromDataURL(dataUri)
    if (image.isEmpty()) return null
    const size = image.getSize()
    const scale = Math.min(1, 640 / Math.max(size.width, size.height))
    const resized = scale < 1 ? image.resize({ width: Math.max(1, Math.round(size.width * scale)) }) : image
    return `data:image/jpeg;base64,${resized.toJPEG(72).toString('base64')}`
  } catch { return null }
}

function htmlToDocument(html: string): ExtractedDocument {
  const images = new Map<string, string>()
  let skippedImages = 0
  const safeHtml = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
  const text = safeHtml.replace(/<img\b[^>]*>/gi, (tag) => {
    const match = tag.match(/\bsrc\s*=\s*["'](data:image\/[^"']+)["']/i)
    const image = match ? thumbnail(decodeEntities(match[1])) : null
    if (!image) { skippedImages++; return ' ' }
    const id = `IMG_${images.size + 1}`
    images.set(id, image)
    return `\n[${id}]\n`
  }).replace(/<(?:br|\/p|\/div|\/h[1-6]|\/li|\/tr)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .split('\n').map((line) => decodeEntities(line).replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n')
  return { text, images, warnings: skippedImages ? ['部分图片不是内嵌图片或格式不受支持，未导入这些图片。'] : [] }
}

async function extractDocument(filePath: string): Promise<ExtractedDocument> {
  const bytes = await readFile(filePath)
  if (bytes.length > MAX_FILE_BYTES) throw new Error('文件超过 25 MB，请拆分后导入。')
  const ext = extname(filePath).toLowerCase()
  if (ext === '.docx') {
    const mammoth = await import('mammoth')
    const result = await mammoth.convertToHtml({ buffer: bytes }, { externalFileAccess: false })
    const extracted = htmlToDocument(result.value)
    extracted.warnings.push(...result.messages.filter((m) => m.type === 'warning').map((m) => m.message))
    return extracted
  }
  if (ext === '.pdf') {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(bytes), useSystemFonts: true, disableFontFace: true })
    const pdf = await loadingTask.promise
    const canvasFactory = pdf.canvasFactory as { create: (width: number, height: number) => { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D }; destroy: (value: { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D }) => void }
    const pages: string[] = []
    const images = new Map<string, string>()
    let renderUnavailable = false
    for (let i = 1; i <= Math.min(pdf.numPages, 80); i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const text = content.items.map((item) => 'str' in item ? item.str : '').join(' ').trim()
      if (text) pages.push(`[PAGE_${i}]\n${text}`)
      if (i <= 20 && !renderUnavailable) {
        try {
          const base = page.getViewport({ scale: 1 })
          const viewport = page.getViewport({ scale: Math.min(1.3, 720 / base.width) })
          const canvasAndContext = canvasFactory.create(Math.ceil(viewport.width), Math.ceil(viewport.height))
          await page.render({ canvasContext: canvasAndContext.context, viewport, canvas: canvasAndContext.canvas }).promise
          const rendered = thumbnail(canvasAndContext.canvas.toDataURL('image/jpeg', 0.75))
          if (rendered) images.set(`PAGE_${i}`, rendered)
          canvasFactory.destroy(canvasAndContext)
        } catch { renderUnavailable = true }
      }
      page.cleanup()
    }
    await loadingTask.destroy()
    const warnings: string[] = []
    if (renderUnavailable) warnings.push('PDF 页面图像无法渲染，已仅根据可选中的文字识别。')
    else warnings.push('PDF 参考图使用整页预览，可能包含页面文字。')
    if (pdf.numPages > 20) warnings.push('PDF 只为前 20 页生成参考图，后续页仍会提取文字。')
    return { text: pages.join('\n\n'), images, warnings }
  }
  if (ext === '.html' || ext === '.htm') return htmlToDocument(bytes.toString('utf8'))
  if (['.txt', '.md', '.markdown', '.csv', '.json', '.rtf'].includes(ext)) {
    const text = bytes.toString('utf8').replace(/\{\\rtf[\s\S]*?\}/g, (value) => value.replace(/\\[a-z]+-?\d*\s?/gi, '').replace(/[{}]/g, ''))
    return { text, images: new Map(), warnings: [] }
  }
  throw new Error('支持 DOCX、PDF、TXT、Markdown、HTML、CSV、JSON 和 RTF 文件。旧版 DOC 请先另存为 DOCX。')
}

function parseResponse(raw: string): { items: Array<{ text: string; imageId?: string; groupId?: string; tags: string[] }>; groups: Map<string, string> } {
  const plain = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const cleaned = plain.slice(plain.indexOf('{'), plain.lastIndexOf('}') + 1)
  const value = JSON.parse(cleaned) as { items?: unknown; groups?: unknown }
  if (!Array.isArray(value.items)) throw new Error('AI 返回的内容格式不正确，请重试。')
  const groups = new Map<string, string>()
  if (Array.isArray(value.groups)) for (const group of value.groups) {
    if (group && typeof group === 'object' && typeof group.id === 'string' && typeof group.tag === 'string') {
      groups.set(group.id, group.tag.trim())
    }
  }
  const items = value.items.filter((item): item is { text: string; imageId?: string; groupId?: string; tags: string[] } => {
    if (!item || typeof item !== 'object') return false
    const p = item as Record<string, unknown>
    return typeof p.text === 'string' && p.text.trim().length > 0 && Array.isArray(p.tags)
  }).map((item) => ({
    text: item.text.trim(),
    imageId: typeof item.imageId === 'string' ? item.imageId.replace(/[\[\]]/g, '') : undefined,
    groupId: typeof item.groupId === 'string' ? item.groupId : undefined,
    tags: item.tags.filter((tag): tag is string => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean)
  }))
  return { items, groups }
}

export async function analyzePromptFile(filePath: string, cfg: ImportConfig, existingTags: string[]): Promise<PromptImportResult> {
  if (!cfg.apiKey || !cfg.baseUrl || !cfg.model) throw new Error('请先在设置中配置 AI 模型和 API Key。')
  const extracted = await extractDocument(filePath)
  if (!extracted.text.trim()) throw new Error('文件中没有可识别的文字。扫描版文件请先进行 OCR。')
  if (extracted.text.length > MAX_DOCUMENT_CHARS) extracted.warnings.push('文档较长，只分析前 70,000 个字符。')
  const content = extracted.text.slice(0, MAX_DOCUMENT_CHARS)
  const imageList = [...extracted.images.entries()].slice(0, MAX_AI_IMAGES)
  const system = `你是建筑设计文生图提示词整理助手。请从文档中准确找出每一条独立的提示词正文，保留原文，不要改写、扩写或把说明文字当成提示词。文档中的 [IMG_N] 是 Word/HTML 参考图位置，[PAGE_N] 是 PDF 页码及页面图。请为每条提示词关联最靠近且语义对应的图片编号，没有则省略 imageId。先把相似类型的图片与提示词归为同一组，每组只给一个统一的简短中文类型标签，尽量复用已有标签。再给每条提示词恰好三个简短中文标签：类型标签、风格或材质、场景或光线。相同组的第一标签必须完全相同，避免同义标签。仅输出 JSON 对象，格式 {"groups":[{"id":"G1","tag":"建筑类型"}],"items":[{"text":"原文","imageId":"IMG_1","groupId":"G1","tags":["建筑类型","材质","光线"]}]}，不要 Markdown。`
  const userText = `已有标签：${existingTags.slice(0, 80).join('、') || '无'}\n\n文件内容：\n${content}`
  const imageParts = imageList.flatMap(([id, image]) => [
    { type: 'text', text: `参考图 ${id}` },
    { type: 'image_url', image_url: { url: image, detail: 'low' } }
  ])
  const endpoint = `${cfg.baseUrl.replace(/\/+$/, '')}/chat/completions`
  const request = async (withImages: boolean): Promise<string> => {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({ model: cfg.model, messages: [
        { role: 'system', content: system },
        { role: 'user', content: withImages ? [{ type: 'text', text: userText }, ...imageParts] : userText }
      ], temperature: 0.2, max_tokens: 6000 }),
      signal: AbortSignal.timeout(120000)
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`AI 请求失败（HTTP ${res.status}）${detail ? `：${detail.slice(0, 180)}` : ''}`)
    }
    const data = await res.json() as { choices?: { message?: { content?: string } }[] }
    return data.choices?.[0]?.message?.content ?? ''
  }
  let raw: string
  try { raw = await request(imageParts.length > 0) }
  catch (error) {
    if (imageParts.length === 0) throw error
    extracted.warnings.push('当前模型不支持图片输入，已根据文档文字与图片位置重新识别。')
    raw = await request(false)
  }
  const parsed = parseResponse(raw)
  const candidates = parsed.items
  const canonical = new Map(existingTags.map((tag) => [tag.normalize('NFKC').toLocaleLowerCase(), tag]))
  const markers = [...content.matchAll(/\[(IMG_\d+|PAGE_\d+)\]/g)]
    .map((match) => ({ id: match[1], index: match.index }))
    .filter((marker) => extracted.images.has(marker.id))
  const items = candidates.slice(0, 100).map((item) => {
    const tags: string[] = []
    const groupTag = item.groupId ? parsed.groups.get(item.groupId) : undefined
    for (const rawTag of groupTag ? [groupTag, ...item.tags.slice(1)] : item.tags) {
      const key = rawTag.normalize('NFKC').toLocaleLowerCase()
      if (!canonical.has(key)) canonical.set(key, rawTag)
      const tag = canonical.get(key)!
      if (!tags.includes(tag)) tags.push(tag)
      if (tags.length === 3) break
    }
    let image = item.imageId ? extracted.images.get(item.imageId) : undefined
    if (!image && markers.length) {
      const position = content.indexOf(item.text.slice(0, 30))
      if (position >= 0) {
        const nearest = markers.reduce((best, marker) =>
          Math.abs(marker.index - position) < Math.abs(best.index - position) ? marker : best)
        if (Math.abs(nearest.index - position) < 4000) image = extracted.images.get(nearest.id)
      }
    }
    return { text: item.text, tags, image, note: `导入自 ${basename(filePath)}` }
  }).filter((item) => item.tags.length === 3)
  if (!items.length) throw new Error('AI 未识别出带有三个标签的提示词，请检查文档内容或换用其他模型。')
  if (candidates.length > items.length) extracted.warnings.push('部分结果缺少三个有效标签，已跳过。')
  return { fileName: basename(filePath), items, warnings: extracted.warnings }
}
