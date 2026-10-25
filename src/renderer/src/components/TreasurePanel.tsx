import { InteractiveButton, DirectionalHover } from './HoverFeedback'
import { tx, useLang, getLang } from '../i18n'
import { useCallback, useEffect, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react'
import type { AssetView, AssetPatch, TreasureStatus } from '../../../shared/treasure'
import { SelectMenu } from './SelectMenu'
import { StateButton } from './InteractionMotion'
import { rememberCard, useCardExpansion } from '../interactionMotion'
import { canCollectTransfer, readTreasureDrop, dragAssetFiles } from '../treasureTransfer'
import './treasure.css'

const api = window.api.treasure
const empty: TreasureStatus = { path: null, count: 0, trashCount: 0, groups: [], roots: [] }
function bytes(size: number): string { return size < 1024 * 1024 ? (size / 1024).toFixed(0) + ' KB' : size < 1024 ** 3 ? (size / 1024 ** 2).toFixed(1) + ' MB' : (size / 1024 ** 3).toFixed(1) + ' GB' }
function cleanError(e: unknown): string { return String((e as Error).message ?? e).replace(/^Error invoking remote method '[^']+': Error: /, '') }

function FileGlyph({ ext }: { ext: string }): JSX.Element {
  return <div className="treasure-file-glyph"><svg aria-hidden="true" width="30" height="34" viewBox="0 0 24 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M5 2h9l5 5v16a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3Zm9 0v6h5" /></svg><span>{ext.slice(0, 6).toUpperCase() || 'FILE'}</span></div>
}
function Cover({ item, large = false, attempt = 0 }: { item: AssetView; large?: boolean; attempt?: number }): JSX.Element {
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const previousAttempt = useRef(attempt)
  useEffect(() => {
    let live = true
    setSrc(null); setFailed(false)
    const force = attempt > 0 && previousAttempt.current !== attempt
    previousAttempt.current = attempt
    void api.thumbnail(item.id, large, force).then(value => { if (live) { setSrc(value); setFailed(!value && Boolean(item.cover || item.kind === 'image')) } }).catch(() => { if (live) setFailed(true) })
    return () => { live = false }
  }, [item.id, item.cover, item.modifiedAt, item.available, large, attempt])
  return src ? <img src={src} alt="" draggable={false} loading="lazy" onError={() => { setSrc(null); setFailed(true) }} /> : <><FileGlyph ext={item.ext} />{failed && <span className="treasure-cover-failed">{tx("封面未就绪")}</span>}</>
}
function Dialog({ title, close, children, expansionKey, dismissible = true, closeRequested = false }: { title: string; close: () => void; children: ReactNode; expansionKey?: string; dismissible?: boolean; closeRequested?: boolean }): JSX.Element {
  const root = useRef<HTMLDivElement>(null)
  const collapse = useCardExpansion(expansionKey, root)
  const dismissibleRef = useRef(dismissible)
  dismissibleRef.current = dismissible
  const closeRef = useRef(close)
  closeRef.current = () => { if (dismissibleRef.current) void collapse(close) }
  useEffect(() => { if (closeRequested && dismissible) closeRef.current() }, [closeRequested, dismissible])
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    root.current?.focus()
    const handler = (e: KeyboardEvent): void => {
      if ((e.target as Element)?.closest('.musy-select-popup')) return
      if (e.key === 'Escape') { e.stopPropagation(); closeRef.current() }
      if (e.key !== 'Tab') return
      const elements = Array.from(root.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, select, textarea, [tabindex="0"]') ?? [])
      const first = elements[0]; const last = elements[elements.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === root.current)) { e.preventDefault(); last?.focus() }
      else if (!e.shiftKey && (document.activeElement === last || document.activeElement === root.current)) { e.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', handler, true)
    return () => { document.removeEventListener('keydown', handler, true); previous?.focus() }
  }, [])
  return <div className="treasure-overlay"><div ref={root} className="treasure-dialog musy-expand-surface" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
    <header><strong>{title}</strong><InteractiveButton onClick={() => closeRef.current()} disabled={!dismissible} aria-label={tx("关闭对话框")}>{tx("关闭")}</InteractiveButton></header>{children}
  </div></div>
}

export function TreasurePanel({ query }: { query: string }): JSX.Element {
  useLang()
  const kinds = { image: tx("图片"), model: tx("模型"), document: tx("文档"), video: tx("视频"), audio: tx("音频"), font: tx("字体"), other: tx("其他") }
  const jobLabels = { running: tx("正在导入"), completed: tx("导入完成"), canceled: tx("已取消，成功条目已保留"), interrupted: tx("上次导入已中断，可重试"), failed: tx("导入失败，已保存条目保留") }
  const [status, setStatus] = useState(empty)
  const [items, setItems] = useState<AssetView[]>([])
  const [total, setTotal] = useState(0)
  const [group, setGroup] = useState('')
  const [trash, setTrash] = useState(false)
  const [kind, setKind] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [sort, setSort] = useState<'newest' | 'name' | 'recent' | 'modified' | 'size'>('newest')
  const [offset, setOffset] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  const [detail, setDetail] = useState<AssetView | null>(null)
  const [detailCloseRequested, setDetailCloseRequested] = useState(false)
  const [savingDetail, setSavingDetail] = useState(false)
  const [previewAttempt, setPreviewAttempt] = useState(0)
  const [thumbnailAttempt, setThumbnailAttempt] = useState(0)
  const [draft, setDraft] = useState<AssetPatch>({})
  const [tags, setTags] = useState('')
  const [settings, setSettings] = useState(false)
  const [newGroup, setNewGroup] = useState('')
  const [renameId, setRenameId] = useState('')
  const [renameName, setRenameName] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [undoIds, setUndoIds] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [revision, setRevision] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [groupDragging, setGroupDragging] = useState<string | null>(null)
  const [groupOver, setGroupOver] = useState<string | null>(null)
  const groupCleanup = useRef<(() => void) | null>(null)
  const suppressClick = useRef(false)
  const seq = useRef(0)
  const initialized = useRef(false)
  const grid = useRef<HTMLDivElement>(null)

  const refresh = useCallback(async (): Promise<void> => { setStatus(await api.status()); setRevision(n => n + 1) }, [])
  useEffect(() => {
    const changed = (): void => { void refresh().catch(e => setError(cleanError(e))) }
    window.addEventListener('musy:treasure-changed', changed)
    return () => window.removeEventListener('musy:treasure-changed', changed)
  }, [refresh])
  const run = async (task: () => Promise<unknown>, message = ''): Promise<boolean> => {
    setBusy(true); setError('')
    try {
      const result = await task()
      if (result !== false) { if (message) setNotice(message); await refresh() }
      return result !== false
    } catch (e) { setError(cleanError(e)); return false } finally { setBusy(false) }
  }
  useEffect(() => {
    let live = true
    void api.status().then(value => { if (live) setStatus(value) }).catch(e => { if (live) setError(cleanError(e)) })
    try {
      const f = JSON.parse(localStorage.getItem('musy.treasure.filters') ?? '{}')
      setGroup(typeof f.group === 'string' ? f.group : ''); setKind(kinds[f.kind] ? f.kind : ''); setTagFilter(typeof f.tag === 'string' ? f.tag : ''); setSort(['name', 'recent', 'modified', 'size'].includes(f.sort) ? f.sort : 'newest')
    } catch { /* 损坏的筛选偏好可以重新选择 */ }
    initialized.current = true
    return () => { live = false; groupCleanup.current?.() }
  }, [])
  useEffect(() => {
    if (initialized.current) try { localStorage.setItem('musy.treasure.filters', JSON.stringify({ group, kind, sort, tag: tagFilter })) } catch { /* 不影响素材存储 */ }
    setOffset(0); setSelected([])
  }, [query, group, trash, kind, sort, tagFilter, status.path])
  useEffect(() => {
    if (status.path && group && group !== 'ungrouped' && !status.groups.some(g => g.id === group)) setGroup('')
  }, [status.path, status.groups, group])
  useEffect(() => {
    if (!status.path) return
    const request = ++seq.current
    setLoading(true)
    const timer = window.setTimeout(() => {
      void api.query({ text: query, tag: tagFilter, groupId: group, kind, sort, trash, offset }).then(result => {
        if (request !== seq.current) return
        setItems(result.items); setTotal(result.total)
        if (!result.items.length && offset > 0) setOffset(Math.max(0, Math.floor((result.total - 1) / 60) * 60))
      }).catch(e => { if (request === seq.current) setError(cleanError(e)) }).finally(() => { if (request === seq.current) setLoading(false) })
    }, 150)
    return () => { clearTimeout(timer); seq.current++ }
  }, [query, group, kind, sort, tagFilter, trash, offset, status.path, revision])
  useEffect(() => {
    if (status.job?.state !== 'running') return
    const timer = window.setInterval(() => { void refresh().catch(e => setError(cleanError(e))) }, 1000)
    return () => clearInterval(timer)
  }, [status.job?.state, refresh])
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 6500)
    return () => clearTimeout(timer)
  }, [notice])

  const showDetail = (item: AssetView, origin: HTMLElement): void => {
    rememberCard(`asset:${item.id}`, origin)
    setDetailCloseRequested(false)
    setError(''); setDetail(item)
    setDraft({ name: item.name, groupId: item.groupId, note: item.note, sourceUrl: item.sourceUrl, author: item.author, licenseNote: item.licenseNote })
    setTags(item.tags.join(', '))
  }
  const saveDetail = async (): Promise<boolean> => {
    if (!detail || busy || !document.querySelector<HTMLFormElement>('#treasure-edit')?.reportValidity()) return false
    setSavingDetail(true)
    try {
      const saved = await run(() => api.update([detail.id], { ...draft, tags: [...new Set(tags.split(/[,，]/).map(t => t.trim()).filter(Boolean))] }), tx('资料已保存'))
      if (saved) setDetailCloseRequested(true)
      return saved
    } finally { setSavingDetail(false) }
  }
  const quickPreview = (item: AssetView): void => {
    void api.openPreview(items.map(asset => asset.id), 'single', items.findIndex(asset => asset.id === item.id)).catch(e => setError(cleanError(e)))
  }
  const compareSelected = (): void => { void api.openPreview(selected, 'compare').catch(e => setError(cleanError(e))) }
  const canCompare = selected.length >= 2 && selected.length <= 4 && selected.every(id => items.find(item => item.id === id)?.kind === 'image')
  const remove = (): void => {
    const ids = [...selected]
    void run(async () => { await api.remove(ids, trash); setSelected([]); if (!trash) setUndoIds(ids) }, trash ? tx("已恢复所选素材") : tx("已移入回收区，引用原文件仍在原处"))
  }
  const chooseLibrary = (): void => { void run(async () => { const ok = await api.chooseLibrary(); if (ok) { setGroup(''); setOffset(0); setSelected([]); setDetail(null) } return ok }) }
  const importClipboard = (): Promise<boolean> => {
    return run(async () => {
      const kind = await api.importClipboard()
      setNotice(kind === 'image' ? tx("剪贴板图片已保存，正在导入；再次导入同一图片会自动去重") : tx("正在导入剪贴板中的文件或文件夹"))
    })
  }
  const longPressGroup = (event: ReactPointerEvent<HTMLButtonElement>, id: string): void => {
    if (event.button !== 0 || busy) return
    groupCleanup.current?.()
    const button = event.currentTarget
    const x = event.clientX; const y = event.clientY; const pointer = event.pointerId
    let active = false; let target: string | null = null
    const cleanup = (): void => {
      clearTimeout(timer)
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', cancel)
      window.removeEventListener('blur', cancel)
      if (button.hasPointerCapture(pointer)) button.releasePointerCapture(pointer)
      groupCleanup.current = null
    }
    const move = (e: PointerEvent): void => {
      if (e.pointerId !== pointer) return
      if (!active) { if (Math.hypot(e.clientX - x, e.clientY - y) > 6) cleanup(); return }
      e.preventDefault()
      const list = button.closest('.treasure-groups')
      if (list) { const rect = list.getBoundingClientRect(); list.scrollTop += e.clientY < rect.top + 20 ? -10 : e.clientY > rect.bottom - 20 ? 10 : 0 }
      target = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-boxgroup]')?.dataset.boxgroup ?? null
      setGroupOver(target)
    }
    const up = (e: PointerEvent): void => {
      if (e.pointerId !== pointer) return
      cleanup()
      if (active) {
        suppressClick.current = true; setTimeout(() => { suppressClick.current = false }, 80)
        if (target && target !== id) void run(() => api.group('move', target!, id))
      }
      setGroupDragging(null); setGroupOver(null)
    }
    const cancel = (): void => { cleanup(); setGroupDragging(null); setGroupOver(null) }
    const timer = window.setTimeout(() => { active = true; button.setPointerCapture(pointer); setGroupDragging(id) }, 350)
    window.addEventListener('pointermove', move, { passive: false }); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', cancel)
    window.addEventListener('blur', cancel)
    groupCleanup.current = cleanup
  }

  return <section className="treasure" aria-label={tx("百宝匣")} onPaste={e => {
    const target = e.target as HTMLElement
    if (target.closest('input, textarea, [contenteditable=true]')) return
    if (!status.path || busy || status.job?.state === 'running' || detail || settings) return
    e.preventDefault(); importClipboard()
  }} onDragOver={e => { if (canCollectTransfer(e.dataTransfer)) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDragging(true) } }}
    onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false) }}
    onDrop={e => {
      if (!canCollectTransfer(e.dataTransfer)) return
      e.preventDefault(); e.stopPropagation(); setDragging(false)
      if (!status.path) { setError(tx("请先选择资料库，再拖入文件")); return }
      if (busy || status.job?.state === 'running') return
      const data = readTreasureDrop(e.dataTransfer)
      void run(async () => api.importDrop(await data))
    }}>
    <aside className="treasure-sidebar">
      <div className="treasure-imports">
        <StateButton className="treasure-primary" disabled={!status.path || busy || status.job?.state === 'running'} onAction={() => run(() => api.importFiles('files'))} successLabel={tx('已开始导入')}>{tx("＋ 导入文件")}</StateButton>
        <StateButton disabled={!status.path || busy || status.job?.state === 'running'} onAction={() => run(() => api.importFiles('folder'))} successLabel={tx('已开始导入')}>{tx("导入文件夹")}</StateButton>
        <StateButton disabled={!status.path || busy || status.job?.state === 'running'} onAction={importClipboard} successLabel={tx('已开始导入')} title={tx("复制文件、文件夹或截图后点击；列表中也可按 Ctrl+V")}>{tx("从剪贴板导入")}</StateButton>
      </div>
      <span className="treasure-caption">{tx("整理素材")}</span>
      <div className="treasure-groups">
        <InteractiveButton className={!group && !trash ? 'chosen' : ''} onClick={() => { setGroup(''); setTrash(false) }}>{tx("全部素材")} <small>{status.count}</small></InteractiveButton>
        <InteractiveButton className={group === 'ungrouped' && !trash ? 'chosen' : ''} onClick={() => { setGroup('ungrouped'); setTrash(false) }}>{tx("未分组")}</InteractiveButton>
        {status.groups.map(g => <InteractiveButton key={g.id} data-boxgroup={g.id} title={tx("长按后拖动排序；也可在管理中用上下按钮调整")}
          onPointerDown={e => longPressGroup(e, g.id)}
          style={{ opacity: groupDragging === g.id ? .5 : 1, boxShadow: groupOver === g.id && groupDragging !== g.id ? 'inset 0 -2px var(--accent-tint)' : undefined }}
          className={group === g.id && !trash ? 'chosen' : ''} onClick={() => { if (!suppressClick.current) { setGroup(g.id); setTrash(false) } }}>{g.name}</InteractiveButton>)}
      </div>
      <InteractiveButton className={trash ? 'chosen' : ''} onClick={() => { setTrash(true); setGroup('') }}>{tx("回收区")} <small>{status.trashCount}</small></InteractiveButton>
      <InteractiveButton onClick={() => setSettings(true)}>{tx("管理资料库")}</InteractiveButton>
    </aside>
    <div className="treasure-main">
      <div className="treasure-toolbar">
        <SelectMenu label={tx("素材类型")} icon="filter" width={184} value={kind} onChange={setKind} options={[{ value: '', label: tx("所有类型") }, ...Object.entries(kinds).map(([value, label], index) => ({ value, label, separator: index === 0 }))]} />
        <SelectMenu label={tx("排列方式")} icon="sort" width={244} value={sort} onChange={value => setSort(value as typeof sort)} options={[
          { value: 'newest', label: tx("最近导入"), description: tx("最新加入百宝匣的素材在前") },
          { value: 'recent', label: tx("最近使用"), description: tx("最近打开过的素材在前") },
          { value: 'name', label: tx("名称排序"), description: tx("按素材名称排列") },
          { value: 'modified', label: tx("文件日期"), description: tx("按文件修改时间，从新到旧"), separator: true },
          { value: 'size', label: tx("文件大小"), description: tx("按文件大小，从大到小") }
        ]} />
        <input className="treasure-tag-filter" aria-label={tx("精确筛选标签")} placeholder={tx("筛选标签")} value={tagFilter} onChange={e => setTagFilter(e.target.value)} />
        <InteractiveButton onClick={() => { setThumbnailAttempt(n => n + 1); void run(refresh) }} disabled={busy} title={tx("刷新素材列表并重新读取缩略图")}>{tx("刷新")}</InteractiveButton>
        {(group || kind || tagFilter) && <InteractiveButton onClick={() => { setKind(''); setGroup(''); setTagFilter('') }}>{tx("清除筛选")}</InteractiveButton>}
        <span className="treasure-count">{loading ? tx("查找中…") : tx('{count} 项', { count: total })}</span>
      </div>
      {error && <div className="treasure-error" role="alert">{tx(error)}<InteractiveButton onClick={() => setError('')} aria-label={tx("关闭错误提示")}>×</InteractiveButton></div>}
      {status.recovery && <div className="treasure-message">{tx(status.recovery)}</div>}
      {notice && <div className="treasure-message" role="status">{tx(notice)}{undoIds.length > 0 && <InteractiveButton disabled={busy} onClick={() => void run(async () => { await api.remove(undoIds, true); setUndoIds([]) }, tx("已撤销移除"))}>{tx("撤销移除")}</InteractiveButton>}</div>}
      {status.job && <div className="treasure-job" role="status">
        <span>{jobLabels[status.job.state]}  {tx("· 已扫")} {status.job.scanned}  {tx("· 新增")} {status.job.imported}  {tx("· 已有")} {status.job.duplicates}  {tx("· 失败")} {status.job.failed}</span>
        {status.job.state === 'running' ? <InteractiveButton disabled={busy} onClick={() => void run(() => api.cancelImport())}>{tx("取消")}</InteractiveButton> : status.job.state !== 'completed' || status.job.failed > 0 ? <InteractiveButton disabled={busy} onClick={() => void run(() => api.importFiles('retry'))}>{tx("重试")}</InteractiveButton> : null}
        {status.job.errors.length > 0 && <details><summary>{tx("失败明细（最多保留 200 项）")}</summary><pre>{status.job.errors.map(message => tx(message)).join('\n')}</pre></details>}
      </div>}
      {selected.length > 0 && <div className="treasure-selection">
        <span>{tx("已选")} {selected.length}  {tx("项")}</span>
        <InteractiveButton disabled={!canCompare} title={canCompare ? tx("在独立浮窗中并排查看，支持置顶参考") : tx("选择 2–4 张图片后可并排参考")} onClick={compareSelected}>{tx("并排参考")}</InteractiveButton>
        {!trash && <SelectMenu label={tx("归入分组")} icon="folder" value="" placeholder={tx("归入分组…")} disabled={busy} onChange={target => { void run(() => api.update(selected, { groupId: target === 'ungrouped' ? '' : target }), tx("已更新分组")) }} options={[{ value: 'ungrouped', label: tx("未分组") }, ...status.groups.map(g => ({ value: g.id, label: g.name }))]} />}
        <InteractiveButton disabled={busy} onClick={remove}>{trash ? tx("恢复所选") : tx("移入回收区")}</InteractiveButton>
        <InteractiveButton onClick={() => setSelected(selected.length === items.length ? [] : items.map(a => a.id))}>{selected.length === items.length ? tx("取消选择") : tx("全选本页")}</InteractiveButton>
      </div>}
      {!status.path ? <div className="treasure-empty"><strong>{tx("把常用素材装进百宝匣")}</strong><p>{tx("先选一个本地资料库，再拖入模型、贴图和参考图。")}</p><InteractiveButton className="treasure-primary" disabled={busy} onClick={chooseLibrary}>{tx("选择或创建资料库")}</InteractiveButton><p>{tx("导入仅记录原件位置，自定义封面保存在资料库中。")}</p></div> : !items.length && !loading ?
        <div className="treasure-empty"><strong>{trash ? tx("回收区是空的") : query || group || kind || tagFilter ? tx("没有找到匹配素材") : tx("百宝匣准备好了")}</strong><p>{trash ? tx("移除的条目可以在这里恢复。") : query || group || kind || tagFilter ? tx("试试其他关键词，或清除分组、类型、标签筛选。") : tx("将文件或文件夹拖到这里开始导入，原文件保持原位。")}</p></div> :
        <div className="treasure-grid" ref={grid} aria-label={tx("素材列表")} aria-busy={loading}>
          {items.map(item => <DirectionalHover key={item.id} role="button" tabIndex={0} data-asset={item.id} aria-pressed={selected.includes(item.id)} aria-label={`${item.name}，${kinds[item.kind]}${item.available ? '' : tx("，原件缺失")}`}
            className={`treasure-card ${selected.includes(item.id) ? 'selected' : ''}`} title={`${item.name}\n${item.absolutePath}\n${tx('修改时间：{date}', { date: new Date(item.modifiedAt).toLocaleString(getLang()) })}\n${tx('大小：{size}', { size: bytes(item.size) })}`}
            onClick={e => setSelected(e.ctrlKey || e.metaKey ? selected.includes(item.id) ? selected.filter(id => id !== item.id) : [...selected, item.id] : [item.id])}
            onDoubleClick={() => void run(() => api.open(item.id, 'open'))}
            onContextMenu={e => { e.preventDefault(); e.stopPropagation(); showDetail(item, e.currentTarget) }}
            draggable={!trash && item.available}
            onDragStart={e => {
              e.preventDefault(); setDragging(false)
              if ((e.target as HTMLElement).closest('input')) return
              e.dataTransfer.setData('application/x-musy-assets', item.id)
              const ids = selected.includes(item.id) ? selected : [item.id]
              setSelected(ids)
              void dragAssetFiles(ids).catch(error => setError(cleanError(error)))
            }}
            onKeyDown={e => {
              if (e.target !== e.currentTarget) return
              if (e.key === ' ') { e.preventDefault(); quickPreview(item) }
              else if (e.key === 'Enter') void run(() => api.open(item.id, 'open'))
              else if (e.key === 'Escape') setSelected([])
              else if (e.key.startsWith('Arrow')) {
                e.preventDefault()
                const cards = Array.from(grid.current?.querySelectorAll<HTMLElement>('[data-asset]') ?? [])
                const cols = Math.max(1, cards.filter(c => c.offsetTop === cards[0]?.offsetTop).length)
                const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowDown' ? cols : -cols
                const target = cards[Math.max(0, Math.min(cards.length - 1, cards.findIndex(c => c.dataset.asset === item.id) + delta))]
                target?.focus(); if (target?.dataset.asset) setSelected([target.dataset.asset])
              }
            }}>
            <div className="treasure-card-cover"><Cover item={item} attempt={thumbnailAttempt} /><input type="checkbox" aria-label={tx('选择 {name}', { name: item.name })} checked={selected.includes(item.id)} onClick={e => e.stopPropagation()} onChange={e => setSelected(e.target.checked ? [...selected, item.id] : selected.filter(id => id !== item.id))} /></div>
            <div className="treasure-card-name">{item.name}</div><div className="treasure-card-meta">{item.available ? item.ext.toUpperCase() || 'FILE' : tx("原件缺失")} · {sort === 'modified' ? new Date(item.modifiedAt).toLocaleDateString(getLang()) : bytes(item.size)}</div>
          </DirectionalHover>)}
        </div>}
      <footer className="treasure-footer"><span>{tx("拖出复用 · 右击编辑 · 空格预览")}</span><div><InteractiveButton disabled={offset === 0 || loading} onClick={() => { setOffset(Math.max(0, offset - 60)); setSelected([]) }}>{tx("上一页")}</InteractiveButton><span>{Math.floor(offset / 60) + 1} / {Math.max(1, Math.ceil(total / 60))}</span><InteractiveButton disabled={offset + 60 >= total || loading} onClick={() => { setOffset(offset + 60); setSelected([]) }}>{tx("下一页")}</InteractiveButton></div></footer>
    </div>
    {dragging && <div className="treasure-drop" aria-hidden="true">{tx("松手加入百宝匣")}<br /><small>{tx("仅建立引用，原件不会被搬动")}</small></div>}

    {detail && <Dialog title={tx("素材详情")} expansionKey={`asset:${detail.id}`} dismissible={!busy} closeRequested={detailCloseRequested} close={() => setDetail(null)}>
      <div className="treasure-detail-body"><div className="treasure-preview"><Cover item={detail} large attempt={previewAttempt} /><StateButton disabled={busy} onAction={() => run(async () => { const ok = await api.setCover(detail.id); if (ok) setDetail(await api.get(detail.id)); return ok }, tx("封面已保存"))}>{tx("替换封面")}</StateButton><InteractiveButton onClick={() => setPreviewAttempt(n => n + 1)}>{tx("重试预览")}</InteractiveButton></div>
      <form id="treasure-edit" onSubmit={e => { e.preventDefault(); void saveDetail() }}>
        <label>{tx("显示名称")}<input required maxLength={300} value={draft.name ?? ''} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label>
        <div className="treasure-group-field"><span>{tx("分组")}</span><SelectMenu label={tx("素材分组")} icon="folder" value={draft.groupId ?? ''} onChange={groupId => setDraft({ ...draft, groupId })} options={[{ value: '', label: tx("未分组") }, ...status.groups.map(g => ({ value: g.id, label: g.name }))]} /></div>
        <label>{tx("标签（逗号分隔）")}<input value={tags} onChange={e => setTags(e.target.value)} /></label>
        <label>{tx("备注")}<textarea rows={3} maxLength={10000} value={draft.note ?? ''} onChange={e => setDraft({ ...draft, note: e.target.value })} /></label>
        <label>{tx("来源网址")}<input type="url" maxLength={2048} value={draft.sourceUrl ?? ''} onChange={e => setDraft({ ...draft, sourceUrl: e.target.value })} /></label>
        <label>{tx("作者")}<input maxLength={300} value={draft.author ?? ''} onChange={e => setDraft({ ...draft, author: e.target.value })} /></label>
        <label>{tx("授权备注")}<textarea rows={2} maxLength={10000} value={draft.licenseNote ?? ''} onChange={e => setDraft({ ...draft, licenseNote: e.target.value })} /></label>
        <div className="treasure-path">{detail.absolutePath}<br />{detail.available ? tx("引用原件") : tx("原件缺失，请重新定位")} · {bytes(detail.size)}</div>
      </form></div>
      {error && <div className="treasure-error" role="alert">{tx(error)}</div>}
      <div className="treasure-dialog-actions"><InteractiveButton disabled={busy} onClick={() => void run(() => api.open(detail.id, 'open'))}>{tx("打开原件")}</InteractiveButton><InteractiveButton disabled={busy} onClick={() => void run(() => api.open(detail.id, 'folder'))}>{tx("所在位置")}</InteractiveButton><StateButton disabled={busy} onAction={() => run(() => api.open(detail.id, 'copy'), tx("路径已复制"))}>{tx("复制路径")}</StateButton><InteractiveButton disabled={busy} onClick={() => void run(async () => { const ok = await api.locate(detail.id); if (ok) setDetail(await api.get(detail.id)); return ok }, tx("已重新定位"))}>{tx("重新定位")}</InteractiveButton><StateButton className="treasure-primary" type="submit" form="treasure-edit" onAction={saveDetail} pending={savingDetail} disabled={busy}>{tx("保存")}</StateButton></div>
    </Dialog>}

    {settings && <Dialog title={tx("管理百宝匣")} dismissible={!busy} close={() => setSettings(false)}>
      <div className="treasure-settings-body">
        {error && <div className="treasure-error" role="alert">{tx(error)}</div>}
        <h3>{tx("资料库")}</h3><p className="treasure-path">{status.path ?? tx("尚未选择资料库")}</p><InteractiveButton disabled={busy || status.job?.state === 'running'} onClick={chooseLibrary}>{tx("选择 / 切换资料库")}</InteractiveButton>
        <h3>{tx("备份与恢复")}</h3><p>{tx("备份包含条目、标签、分组和自定义封面。引用原件不包含在内，请另外保管原资料目录。")}</p>
        <div className="treasure-inline"><StateButton disabled={busy || !status.path || status.job?.state === 'running'} onAction={() => run(() => api.backup(), tx("索引与封面备份完成（不含引用原件）"))}>{tx("导出备份")}</StateButton><StateButton disabled={busy || !status.path || status.job?.state === 'running'} onAction={() => run(async () => { const ok = await api.restore(); if (ok) { setGroup(''); setSelected([]) } return ok }, tx("索引与封面已恢复，请核对外部原件位置"))}>{tx("从备份恢复")}</StateButton></div>
        <p>{tx("最近备份：")}{status.lastBackup ? new Date(status.lastBackup).toLocaleString(getLang()) : tx("尚未备份")}{tx("。恢复前会将当前索引与封面保留到资料库的 recovery 目录，可用“从备份恢复”选择该恢复点。")}</p>
        <h3>{tx("分组")}</h3>
        <form className="treasure-inline" onSubmit={e => { e.preventDefault(); void run(async () => { await api.group('add', newGroup); setNewGroup('') }) }}><label className="sr-only" htmlFor="treasure-group-name">{tx("新分组名称")}</label><input id="treasure-group-name" placeholder={tx("新分组名称")} required maxLength={80} value={newGroup} onChange={e => setNewGroup(e.target.value)} /><InteractiveButton disabled={busy || !status.path}>{tx("新建")}</InteractiveButton></form>
        {status.groups.map((g, index) => <div className="treasure-group-editor" key={g.id}>
          {renameId === g.id ? <form className="treasure-inline" onSubmit={e => { e.preventDefault(); void run(async () => { await api.group('rename', renameName, g.id); setRenameId('') }) }}><input aria-label={tx("分组新名称")} required maxLength={80} value={renameName} onChange={e => setRenameName(e.target.value)} /><InteractiveButton disabled={busy}>{tx("保存")}</InteractiveButton><InteractiveButton type="button" onClick={() => setRenameId('')}>{tx("取消")}</InteractiveButton></form> : <><span>{g.name}</span><InteractiveButton disabled={busy || index === 0} aria-label={tx('上移 {name}', { name: g.name })} onClick={() => void run(() => api.group('move', '', g.id, -1))}>↑</InteractiveButton><InteractiveButton disabled={busy || index === status.groups.length - 1} aria-label={tx('下移 {name}', { name: g.name })} onClick={() => void run(() => api.group('move', '', g.id, 1))}>↓</InteractiveButton><InteractiveButton disabled={busy} onClick={() => { setRenameId(g.id); setRenameName(g.name) }}>{tx("改名")}</InteractiveButton><InteractiveButton disabled={busy} onClick={() => void run(async () => { await api.group('delete', '', g.id); if (group === g.id) setGroup('') }, tx("分组已移除，素材归入未分组"))}>{tx("删除")}</InteractiveButton></>}
        </div>)}
        <h3>{tx("原资料位置")}</h3><p>{tx("移动硬盘换盘符或目录搬家后，选择对应的新根目录。单个文件移动可在素材详情中重新定位。")}</p>
        {status.roots.map(root => <div className="treasure-root" key={root.id}><span>{root.path}</span><InteractiveButton disabled={busy || status.job?.state === 'running'} onClick={() => void run(() => api.relink(root.id), tx("根目录已更新，请刷新核对素材"))}>{tx("更换根目录")}</InteractiveButton></div>)}
      </div>
    </Dialog>}
  </section>
}
