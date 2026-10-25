import { readFile, writeFile, mkdir, rename, copyFile, unlink, stat, readdir, open } from 'fs/promises'
import { join, resolve, relative, dirname, basename, extname, isAbsolute, sep } from 'path'
import { randomUUID } from 'crypto'
import type { AssetCatalog, AssetItem, AssetPatch, AssetQuery, ImportJob, TreasureStatus } from '../shared/treasure'

const LIMIT = 64 * 1024 * 1024
const idPattern = /^[a-f0-9-]{36}$/
const kinds: AssetItem['kind'][] = ['image', 'model', 'document', 'video', 'audio', 'font', 'other']
export function assetKind(ext: string): AssetItem['kind'] {
  if (['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'tif', 'tiff', 'psd', 'psb'].includes(ext)) return 'image'
  if (['skp', 'skb', '3dm', '3dmbak', 'gh', 'ghx', 'blend', 'max', 'dwg', 'dxf', 'obj', 'fbx', 'stl', 'glb', 'gltf', 'ifc'].includes(ext)) return 'model'
  if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'potx', 'ppsx', 'xls', 'xlsx', 'txt', 'md', 'ai', 'eps'].includes(ext)) return 'document'
  if (['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(ext)) return 'video'
  if (['mp3', 'wav', 'flac', 'ogg', 'm4a'].includes(ext)) return 'audio'
  if (['ttf', 'otf', 'woff', 'woff2'].includes(ext)) return 'font'
  return 'other'
}
function key(path: string): string { return process.platform === 'win32' ? resolve(path).toLowerCase() : resolve(path) }
function safeRelative(path: string): boolean {
  return Boolean(path) && !isAbsolute(path) && !path.split(/[\\/]/).includes('..') && !path.includes('\0') && !path.includes(':')
}
function text(value: unknown, max = 10000): value is string { return typeof value === 'string' && value.length <= max }
export function validateCatalog(value: unknown): AssetCatalog {
  const c = value as AssetCatalog
  if (!c || c.version !== 1 || !idPattern.test(c.libraryId) || !Array.isArray(c.roots) ||
      !Array.isArray(c.groups) || !Array.isArray(c.items) || c.items.length > 100000) throw new Error('资料库格式或版本不受支持')
  const rootIds = new Set<string>()
  for (const r of c.roots) {
    if (!r || !idPattern.test(r.id) || !text(r.path, 32768) || !isAbsolute(r.path) || rootIds.has(r.id)) throw new Error('资料根目录记录无效')
    rootIds.add(r.id)
  }
  const groupIds = new Set<string>()
  const groupNames = new Set<string>()
  for (const g of c.groups) {
    if (!g || !idPattern.test(g.id) || !text(g.name, 80) || !g.name.trim() || groupIds.has(g.id) || groupNames.has(g.name)) throw new Error('分组记录无效或重复')
    groupIds.add(g.id); groupNames.add(g.name)
  }
  const ids = new Set<string>()
  for (const a of c.items) {
    if (!a || !idPattern.test(a.id) || ids.has(a.id) || !rootIds.has(a.rootId) || !safeRelative(a.relativePath) ||
        !text(a.relativePath, 32768) || !text(a.name, 300) || !a.name.trim() || !text(a.originalName, 1000) || !text(a.ext, 80) ||
        !kinds.includes(a.kind) || a.storageMode !== 'reference' || !Number.isFinite(a.size) || a.size < 0 || !Number.isFinite(a.modifiedAt) ||
        !Number.isFinite(a.createdAt) || !Number.isFinite(a.updatedAt) ||
        (a.lastOpenedAt !== undefined && !Number.isFinite(a.lastOpenedAt)) ||
        (a.deletedAt !== undefined && !Number.isFinite(a.deletedAt)) ||
        (a.groupId !== '' && !groupIds.has(a.groupId)) || !Array.isArray(a.tags) || a.tags.length > 100 ||
        !a.tags.every(t => text(t, 80)) || !text(a.note) || !text(a.sourceUrl, 2048) || !text(a.author, 300) || !text(a.licenseNote) ||
        (a.cover !== undefined && !/^[a-f0-9-]{36}\.png$/.test(a.cover))) throw new Error('素材记录无效：' + String(a?.name ?? '未知条目'))
    ids.add(a.id)
  }
  if (c.job) {
    const j = c.job
    if (!idPattern.test(j.id) || !['running', 'completed', 'canceled', 'interrupted', 'failed'].includes(j.state) ||
        !Array.isArray(j.inputs) || j.inputs.length > 10000 || !j.inputs.every(p => text(p, 32768) && isAbsolute(p)) ||
        !Array.isArray(j.errors) || !j.errors.every(e => text(e, 40000)) ||
        ![j.scanned, j.imported, j.duplicates, j.failed, j.startedAt].every(n => Number.isFinite(n) && n >= 0)) throw new Error('导入任务记录无效')
  }
  if (c.lastBackup !== undefined && !Number.isFinite(c.lastBackup)) throw new Error('备份时间无效')
  if (c.folderGrouping !== undefined && c.folderGrouping !== 'root') throw new Error('目录分组规则无效')
  // 只接受声明的字段，备份中的任意附加字段不会进入本地索引。
  return {
    version: 1, libraryId: c.libraryId, folderGrouping: c.folderGrouping,
    roots: c.roots.map(r => ({ id: r.id, path: r.path })),
    groups: c.groups.map(g => ({ id: g.id, name: g.name })),
    items: c.items.map(a => ({ id: a.id, name: a.name, originalName: a.originalName, ext: a.ext, kind: a.kind, storageMode: 'reference',
      rootId: a.rootId, relativePath: a.relativePath, size: a.size, modifiedAt: a.modifiedAt, createdAt: a.createdAt, updatedAt: a.updatedAt,
      lastOpenedAt: a.lastOpenedAt, groupId: a.groupId, tags: [...a.tags], note: a.note, sourceUrl: a.sourceUrl, author: a.author, licenseNote: a.licenseNote, cover: a.cover, deletedAt: a.deletedAt })),
    job: c.job ? { id: c.job.id, state: c.job.state, inputs: [...c.job.inputs], scanned: c.job.scanned, imported: c.job.imported, duplicates: c.job.duplicates,
      failed: c.job.failed, errors: c.job.errors.slice(0, 201), startedAt: c.job.startedAt } : undefined,
    lastBackup: c.lastBackup
  }
}

export async function atomicJson(path: string, value: unknown, previous = true): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  const temporary = path + '.' + randomUUID() + '.tmp'
  const snapshot = temporary + '.previous'
  try {
    await writeFile(temporary, JSON.stringify(value), { flag: 'wx' })
    const handle = await open(temporary, 'r+')
    try { await handle.sync() } finally { await handle.close() }
    // 写完并关闭临时文件后才替换主文件；上一版也通过临时文件替换。
    if (previous) {
      try { await copyFile(path, snapshot); await rename(snapshot, path + '.previous') }
      catch (e) { if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e }
    }
    await rename(temporary, path)
  } finally {
    await unlink(temporary).catch(() => undefined)
    await unlink(snapshot).catch(() => undefined)
  }
}
async function readCatalog(path: string): Promise<AssetCatalog> {
  if ((await stat(path)).size > LIMIT) throw new Error('索引文件超过 64 MB，已停止读取')
  return validateCatalog(JSON.parse(await readFile(path, 'utf8')))
}

export class TreasureStore {
  private catalog!: AssetCatalog
  private queue: Promise<unknown> = Promise.resolve()
  private canceled = false
  private importing = false
  private importDone: Promise<void> | null = null
  recovery?: string
  constructor(readonly directory: string) {}
  get data(): AssetCatalog { return structuredClone(this.catalog) }
  get busy(): boolean { return this.importing }
  async load(create = false): Promise<void> {
    const file = join(this.directory, 'catalog.json')
    if (create) await mkdir(this.directory, { recursive: true })
    else if (!(await stat(this.directory)).isDirectory()) throw new Error('资料库目录不存在')
    try { this.catalog = await readCatalog(file) }
    catch (e) {
      try {
        this.catalog = await readCatalog(file + '.previous')
        await copyFile(file, file + '.damaged-' + Date.now()).catch(() => undefined)
        await atomicJson(file, this.catalog, false)
        this.recovery = '索引异常，已从上一份有效快照恢复；损坏文件已保留。'
      } catch (previousError) {
        if (!create || (e as NodeJS.ErrnoException).code !== 'ENOENT' || (previousError as NodeJS.ErrnoException).code !== 'ENOENT') throw e
        this.catalog = { version: 1, folderGrouping: 'root', libraryId: randomUUID(), roots: [], groups: [], items: [] }
        await atomicJson(file, this.catalog, false)
      }
    }
    await mkdir(join(this.directory, 'covers'), { recursive: true })
    await mkdir(join(this.directory, 'cache'), { recursive: true })
    if (this.catalog.job?.state === 'running') {
      await this.change(c => { if (c.job) c.job.state = 'interrupted' })
    }
    if (!this.catalog.folderGrouping) await this.collapseLegacyFolderGroups()
    if (this.catalog.items.some(item => item.kind !== assetKind(item.ext))) {
      await this.change(c => { for (const item of c.items) item.kind = assetKind(item.ext) })
    }
  }
  private async collapseLegacyFolderGroups(): Promise<void> {
    await this.change(c => {
      // 旧版没有来源标记，仅合并最近导入任务中与直接父目录同名、
      // 且在该任务期间更新的分组归属，保留其他手动整理结果。
      const inputs = new Set(c.job?.inputs.map(key) ?? [])
      const roots = new Map(c.roots.filter(root => inputs.has(key(root.path))).map(root => [root.id, root]))
      const touched = new Set<string>()
      const groups = new Map(c.groups.map(group => [group.id, group.name]))
      for (const item of c.items) {
        const root = roots.get(item.rootId)
        if (!root || !item.groupId || item.updatedAt < (c.job?.startedAt ?? Infinity)) continue
        const parent = (basename(dirname(resolve(root.path, item.relativePath))).trim() || '根目录').slice(0, 80)
        const name = (basename(root.path).trim() || '根目录').slice(0, 80)
        if (parent === name || groups.get(item.groupId) !== parent) continue
        let target = c.groups.find(group => group.name === name)
        if (!target) { target = { id: randomUUID(), name }; c.groups.push(target) }
        touched.add(item.groupId)
        item.groupId = target.id; item.updatedAt = Date.now()
      }
      const used = new Set(c.items.map(item => item.groupId))
      c.groups = c.groups.filter(group => !touched.has(group.id) || used.has(group.id))
      c.folderGrouping = 'root'
    })
  }
  async change(mutator: (draft: AssetCatalog) => void): Promise<void> {
    const action = this.queue.then(async () => {
      const draft = this.data
      mutator(draft)
      const clean = validateCatalog(draft)
      if (Buffer.byteLength(JSON.stringify(clean)) > LIMIT) throw new Error('索引超过当前 64 MB 上限，请分库管理')
      await atomicJson(join(this.directory, 'catalog.json'), clean)
      this.catalog = clean
    })
    this.queue = action.catch(() => undefined)
    return action
  }
  status(): TreasureStatus {
    const c = this.catalog
    return { path: this.directory, count: c.items.filter(a => !a.deletedAt).length,
      trashCount: c.items.filter(a => a.deletedAt).length, roots: structuredClone(c.roots), groups: structuredClone(c.groups),
      job: c.job ? structuredClone(c.job) : undefined, lastBackup: c.lastBackup, recovery: this.recovery }
  }
  item(id: string): AssetItem {
    const a = this.catalog.items.find(a => a.id === id)
    if (!a) throw new Error('素材不存在，请刷新列表')
    return structuredClone(a)
  }
  path(item: AssetItem): string {
    const root = this.catalog.roots.find(r => r.id === item.rootId)
    if (!root || !safeRelative(item.relativePath)) throw new Error('文件路径无效')
    return resolve(root.path, item.relativePath)
  }
  async query(q: AssetQuery): Promise<{ items: (AssetItem & { absolutePath: string; available: boolean })[]; total: number }> {
    const needle = (q.text ?? '').toLocaleLowerCase().trim()
    const items = this.catalog.items.filter(a => Boolean(a.deletedAt) === Boolean(q.trash) &&
      (!q.groupId || (q.groupId === 'ungrouped' ? !a.groupId : a.groupId === q.groupId)) &&
      (!q.tag || a.tags.includes(q.tag.trim())) &&
      (!q.kind || a.kind === q.kind) && (!needle || [a.name, a.originalName, a.note, a.author, a.sourceUrl, a.licenseNote, ...a.tags].join(' ').toLocaleLowerCase().includes(needle)))
    items.sort((a, b) => {
      let order = 0
      switch (q.sort) {
        case 'name': order = a.name.localeCompare(b.name, 'zh-Hans-CN'); break
        case 'recent': order = (b.lastOpenedAt ?? 0) - (a.lastOpenedAt ?? 0); break
        case 'modified': order = b.modifiedAt - a.modifiedAt; break
        case 'size': order = b.size - a.size; break
        default: order = b.createdAt - a.createdAt
      }
      return order || b.createdAt - a.createdAt || a.id.localeCompare(b.id)
    })
    const offset = Math.max(0, Math.floor(q.offset ?? 0))
    const page = items.slice(offset, offset + 60)
    return { total: items.length, items: await Promise.all(page.map(async a => {
      const absolutePath = this.path(a)
      const available = await stat(absolutePath).then(s => s.isFile()).catch(() => false)
      return { ...structuredClone(a), absolutePath, available }
    })) }
  }
  async update(ids: string[], patch: AssetPatch): Promise<void> {
    if (!patch || typeof patch !== 'object') throw new Error('修改内容无效')
    if (patch.name !== undefined && (!text(patch.name, 300) || !patch.name.trim())) throw new Error('请填写 1–300 字的显示名称')
    if (patch.tags && (patch.tags.length > 100 || !patch.tags.every(t => text(t, 80)))) throw new Error('最多保存 100 个标签，每个不超过 80 字')
    await this.change(c => {
      for (const a of c.items.filter(a => ids.includes(a.id))) {
        for (const field of ['name', 'groupId', 'tags', 'note', 'sourceUrl', 'author', 'licenseNote'] as const) {
          if (patch[field] !== undefined) Object.assign(a, { [field]: patch[field] })
        }
        a.updatedAt = Date.now()
      }
    })
  }
  async remove(ids: string[], restore = false): Promise<void> {
    await this.change(c => { for (const a of c.items) if (ids.includes(a.id)) { a.deletedAt = restore ? undefined : Date.now(); a.updatedAt = Date.now() } })
  }
  async group(action: string, name: string, id?: string, direction?: number): Promise<void> {
    await this.change(c => {
      const clean = name.trim()
      if (action === 'add' || action === 'rename') {
        if (!clean || clean.length > 80 || c.groups.some(g => g.name === clean && g.id !== id)) throw new Error('分组名称为空、过长或已存在')
        if (action === 'add') c.groups.push({ id: randomUUID(), name: clean })
        else { const g = c.groups.find(g => g.id === id); if (!g) throw new Error('分组不存在'); g.name = clean }
      } else if (action === 'delete') {
        c.groups = c.groups.filter(g => g.id !== id)
        for (const a of c.items) if (a.groupId === id) a.groupId = ''
      } else if (action === 'move') {
        const i = c.groups.findIndex(g => g.id === id)
        const target = name ? c.groups.findIndex(g => g.id === name) : i + (direction === -1 ? -1 : 1)
        if (i >= 0 && target >= 0 && target < c.groups.length) { const [moved] = c.groups.splice(i, 1); c.groups.splice(target, 0, moved) }
      } else throw new Error('分组操作无效')
    })
  }
  async relink(rootId: string, path: string): Promise<void> {
    await this.change(c => { const root = c.roots.find(r => r.id === rootId); if (!root) throw new Error('根目录不存在'); root.path = resolve(path) })
  }
  async locate(id: string, path: string): Promise<void> {
    const info = await stat(path)
    if (!info.isFile()) throw new Error('请选择一个文件')
    const old = this.item(id)
    if (extname(path).slice(1).toLowerCase() !== old.ext) throw new Error('新位置的文件类型与原条目不一致')
    await this.change(c => {
      let root = c.roots.find(r => key(r.path) === key(dirname(path)))
      if (!root) { root = { id: randomUUID(), path: dirname(resolve(path)) }; c.roots.push(root) }
      const a = c.items.find(a => a.id === id)!
      a.rootId = root.id; a.relativePath = basename(path); a.size = info.size; a.modifiedAt = info.mtimeMs; a.updatedAt = Date.now()
    })
  }
  async cover(id: string, name: string): Promise<void> { await this.change(c => { const a = c.items.find(a => a.id === id); if (!a) throw new Error('素材不存在'); a.cover = name; a.updatedAt = Date.now() }) }
  async waitForImport(): Promise<void> { await this.importDone }
  cancel(): void { this.canceled = true }
  async startImport(paths: string[]): Promise<void> {
    if (this.importing) throw new Error('已有导入任务，请等待或取消')
    if (!paths.length || paths.length > 10000 || paths.some(p => !isAbsolute(p))) throw new Error('导入路径无效或数量过多')
    const job: ImportJob = { id: randomUUID(), inputs: [...new Set(paths.map(p => resolve(p)))], state: 'running', scanned: 0, imported: 0, duplicates: 0, failed: 0, errors: [], startedAt: Date.now() }
    this.importing = true; this.canceled = false
    try { await this.change(c => { c.job = structuredClone(job) }) } catch (e) { this.importing = false; throw e }
    this.importDone = this.runImport(job).finally(() => { this.importing = false })
  }
  private async runImport(job: ImportJob): Promise<void> {
    let pending: AssetItem[] = []
    const seen = new Map(this.catalog.items.map(a => [key(this.path(a)), a.id]))
    const folderGroups = new Map<string, string>()
    const failure = (path: string, error: unknown): void => {
      job.failed++
      if (job.errors.length < 200) job.errors.push((path + '：' + String((error as Error).message ?? error)).slice(0, 39000))
    }
    const flush = async (): Promise<void> => {
      const additions = pending
      await this.change(c => {
        if (c.items.length + additions.length > 100000) throw new Error('达到当前版本 100,000 条索引上限，请分库管理')
        c.items.push(...additions)
        // 分组和条目在同一次写盘中提交；重试也只补齐未分组的有效条目。
        const groups = new Map(c.groups.map(g => [g.name, g.id]))
        for (const item of c.items) {
          const name = folderGroups.get(item.id)
          if (!name || item.groupId || item.deletedAt) continue
          let groupId = groups.get(name)
          if (!groupId) {
            groupId = randomUUID()
            c.groups.push({ id: groupId, name }); groups.set(name, groupId)
          }
          item.groupId = groupId; item.updatedAt = Date.now()
        }
        c.job = structuredClone(job)
      })
      pending = []
      folderGroups.clear()
    }
    try {
      let checkpoint = Date.now()
      for (const input of job.inputs) {
        if (this.canceled) break
        let base: string; let folder: boolean
        try { folder = (await stat(input)).isDirectory(); base = folder ? input : dirname(input) } catch (e) { failure(input, e); continue }
        let root = this.catalog.roots.find(r => key(r.path) === key(base))
        if (!root) { root = { id: randomUUID(), path: base }; const next = root; await this.change(c => { c.roots.push(next) }) }
        for await (const file of this.walk(input, failure)) {
          if (this.canceled) break
          job.scanned++
          try {
            const groupName = folder ? (basename(input).trim() || '根目录').slice(0, 80) : ''
            const existingId = seen.get(key(file))
            if (existingId) {
              job.duplicates++
              if (groupName) folderGroups.set(existingId, groupName)
            }
            else {
              const info = await stat(file)
              if (!info.isFile()) continue
              const ext = extname(file).slice(1).toLowerCase()
              const now = Date.now()
              const id = randomUUID()
              pending.push({ id, name: basename(file), originalName: basename(file), ext, kind: assetKind(ext), storageMode: 'reference', rootId: root.id,
                relativePath: relative(base, file), size: info.size, modifiedAt: info.mtimeMs, createdAt: now, updatedAt: now,
                groupId: '', tags: [], note: '', sourceUrl: '', author: '', licenseNote: '' })
              if (groupName) folderGroups.set(id, groupName)
              seen.set(key(file), id); job.imported++
            }
          } catch (e) { failure(file, e) }
          if (pending.length >= 25 || folderGroups.size >= 25 || Date.now() - checkpoint > 400) { await flush(); checkpoint = Date.now() }
        }
      }
      job.state = this.canceled ? 'canceled' : 'completed'
      await flush()
    } catch (e) {
      // 未提交的条目不计入成功，保留上一份真实落盘的任务统计。
      const saved = this.catalog.job!
      const failed = { ...saved, state: 'failed' as const, errors: [...saved.errors, String((e as Error).message)] }
      await this.change(c => { c.job = failed }).catch(() => { this.catalog.job = failed })
    }
  }
  private async *walk(input: string, failure: (path: string, error: unknown) => void): AsyncGenerator<string> {
    const stack = [input]
    while (stack.length && !this.canceled) {
      const path = stack.pop()!
      // 永远不把资料库自己的索引、缓存和恢复点重新导入。
      const rel = relative(this.directory, path)
      const insideLibrary = !rel || (!rel.startsWith('..' + sep) && rel !== '..' && !isAbsolute(rel))
      const clipboardOriginal = rel === 'clipboard' || rel.startsWith('clipboard' + sep)
      if (insideLibrary && !clipboardOriginal) continue
      try {
        const info = await stat(path)
        if (info.isDirectory()) {
          const entries = await readdir(path, { withFileTypes: true })
          for (const e of entries) if (!e.isSymbolicLink()) stack.push(join(path, e.name))
        } else if (info.isFile()) yield path
      } catch (e) { failure(path, e) }
    }
  }
  async exportBackup(): Promise<{ format: 'musy-treasure'; version: 1; catalog: AssetCatalog; covers: Record<string, string> }> {
    await this.queue
    if (this.importing) throw new Error('请先等待导入完成或取消导入，再备份')
    const catalog = this.data
    const covers: Record<string, string> = {}
    let estimatedBytes = Buffer.byteLength(JSON.stringify(catalog))
    for (const name of new Set(catalog.items.map(a => a.cover).filter((n): n is string => Boolean(n)))) {
      estimatedBytes += Math.ceil((await stat(join(this.directory, 'covers', name))).size / 3) * 4 + 100
      if (estimatedBytes > 250 * 1024 * 1024) throw new Error('封面备份超过当前版本的体积上限，请分库管理')
      covers[name] = (await readFile(join(this.directory, 'covers', name))).toString('base64')
    }
    return { format: 'musy-treasure', version: 1, catalog, covers }
  }
  async restoreBackup(raw: unknown): Promise<void> {
    if (this.importing) throw new Error('请先取消或完成导入')
    const b = raw as { format: string; version: number; catalog: AssetCatalog; covers: Record<string, string> }
    if (!b || b.format !== 'musy-treasure' || b.version !== 1 || !b.covers || typeof b.covers !== 'object') throw new Error('不是百宝匣备份文件')
    const next = validateCatalog(b.catalog)
    // 恢复前完整留存当前元数据与自有封面，而非只留下上一版索引。
    const recovery = await this.exportBackup()
    await atomicJson(join(this.directory, 'recovery', Date.now() + '.musybox'), recovery, false)
    const mapping = new Map<string, string>()
    for (const name of new Set(next.items.map(a => a.cover).filter((n): n is string => Boolean(n)))) {
      const encoded = b.covers[name]
      if (typeof encoded !== 'string' || encoded.length > 8 * 1024 * 1024 || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) throw new Error('备份封面缺失或无效')
      const bytes = Buffer.from(encoded, 'base64')
      if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('封面不是 PNG 图片')
      const renamed = randomUUID() + '.png'
      await writeFile(join(this.directory, 'covers', renamed), bytes, { flag: 'wx' })
      mapping.set(name, renamed)
    }
    for (const a of next.items) if (a.cover) a.cover = mapping.get(a.cover)!
    if (next.job?.state === 'running') next.job.state = 'interrupted'
    await this.change(c => { Object.assign(c, next) })
  }
}
