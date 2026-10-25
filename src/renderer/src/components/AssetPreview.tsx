import { InteractiveButton, DirectionalHover } from './HoverFeedback'
import { tx, useLang } from '../i18n'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { AssetPreviewSession, AssetView } from '../../../shared/treasure'
import { dragAssetFiles } from '../treasureTransfer'
import './asset-preview.css'

const api = window.api.treasure
function PreviewImage({ item, zoom, attempt, onError, onZoom }: { item: AssetView; zoom: number; attempt: number; onError: (error: string) => void; onZoom: (delta: number) => void }): JSX.Element {
  const [src, setSrc] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [natural, setNatural] = useState({ width: 1, height: 1 })
  const [size, setSize] = useState({ width: 400, height: 300 })
  const frame = useRef<HTMLDivElement>(null)
  const image = useRef<HTMLImageElement>(null)
  const anchor = useRef<{ x: number; y: number; cursorX: number; cursorY: number } | null>(null)
  const previousAttempt = useRef(attempt)
  useEffect(() => {
    const node = frame.current
    if (!node) return
    const observer = new ResizeObserver(() => setSize({ width: node.clientWidth, height: node.clientHeight }))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    let live = true
    const force = attempt !== previousAttempt.current
    previousAttempt.current = attempt
    setSrc(null); setLoading(true)
    void api.thumbnail(item.id, true, force).then(value => { if (live) setSrc(value) }).catch(() => { if (live) setSrc(null) }).finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [item.id, item.cover, item.modifiedAt, attempt])
  useEffect(() => {
    const node = frame.current
    if (!node || !src) return
    const wheel = (event: WheelEvent): void => {
      if (!event.deltaY || event.shiftKey || !image.current) return
      event.preventDefault()
      const rect = image.current.getBoundingClientRect()
      const viewport = node.getBoundingClientRect()
      anchor.current = {
        x: Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width))),
        y: Math.max(0, Math.min(1, (event.clientY - rect.top) / Math.max(1, rect.height))),
        cursorX: event.clientX - viewport.left, cursorY: event.clientY - viewport.top
      }
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? node.clientHeight : 1)
      onZoom(Math.max(-300, Math.min(300, delta)))
    }
    node.addEventListener('wheel', wheel, { passive: false })
    return () => node.removeEventListener('wheel', wheel)
  }, [src, onZoom])
  const scale = Math.min((size.width - 32) / natural.width, (size.height - 32) / natural.height, 1) * zoom
  const width = Math.max(1, Math.round(natural.width * scale)); const height = Math.max(1, Math.round(natural.height * scale))
  useLayoutEffect(() => {
    const node = frame.current; const point = anchor.current
    if (!node || !point) return
    node.scrollLeft = (Math.max(size.width, width + 32) - width) / 2 + point.x * width - point.cursorX
    node.scrollTop = (Math.max(size.height, height + 32) - height) / 2 + point.y * height - point.cursorY
    anchor.current = null
  }, [width, height, size.width, size.height])
  return <article className="asset-reference-pane">
    <header title={item.absolutePath}><strong>{item.name}</strong><span>{item.ext.toUpperCase()} · {item.available ? tx("引用原件") : tx("原件缺失")}</span></header>
    <div ref={frame} className="asset-preview-scroll" tabIndex={0} aria-label={tx('{name}预览区域', { name: item.name })}>
      {loading ? <div className="asset-preview-placeholder" role="status">{tx("正在读取预览…")}</div> : src ?
        <DirectionalHover className="asset-preview-canvas" style={{ width: Math.max(size.width, width + 32), height: Math.max(size.height, height + 32) }}>
          <img ref={image} src={src} alt={item.name} style={{ width, height }} draggable={item.available && !item.deletedAt}
            onLoad={event => setNatural({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
            onError={() => setSrc(null)} onDragStart={event => {
              event.preventDefault(); event.dataTransfer.setData('application/x-musy-assets', item.id)
              void dragAssetFiles([item.id]).catch(error => onError(String(error.message ?? error)))
            }} />
        </DirectionalHover> : <div className="asset-preview-placeholder"><strong>{item.ext.toUpperCase() || 'FILE'}</strong><span>{tx("暂无可读取的预览")}</span><small>{tx("可用外部软件打开，或右击卡片设置封面。")}</small></div>}
    </div>
  </article>
}

export function AssetPreview(): JSX.Element {
  const lang = useLang()
  useEffect(() => { document.title = tx('Musy · 素材预览') }, [lang])
  const [session, setSession] = useState<AssetPreviewSession | null>(null)
  const [assets, setAssets] = useState<AssetView[]>([])
  const [index, setIndex] = useState(0)
  const [zoom, setZoom] = useState(1)
  const wheelZoom = useCallback((delta: number): void => { setZoom(value => Math.max(.5, Math.min(4, value * Math.exp(-delta * .0015)))) }, [])
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const request = useRef(0)
  const load = useCallback(async (): Promise<void> => {
    const current = ++request.current
    setLoading(true); setError('')
    try {
      const value = await api.previewSession()
      if (!value) throw new Error(tx("预览会话已结束，请重新从百宝匣打开"))
      const items = await Promise.all(value.ids.map(id => api.get(id)))
      if (current !== request.current) return
      setSession(value); setAssets(items); setIndex(value.index); setZoom(1)
    } catch (e) { if (current === request.current) setError(String((e as Error).message ?? e)) }
    finally { if (current === request.current) setLoading(false) }
  }, [])
  useEffect(() => {
    void load()
    const unsubscribe = api.onPreviewChange(() => { void load() })
    return () => { request.current++; unsubscribe() }
  }, [load])
  useEffect(() => {
    const key = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') { event.preventDefault(); void api.previewControl('close'); return }
      if ((event.target as HTMLElement).closest('input,textarea,select,[contenteditable=true]')) return
      if (event.key === ' ' && !(event.target as HTMLElement).closest('button')) { event.preventDefault(); void api.previewControl('close') }
      else if (session?.mode === 'single' && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault(); setIndex(i => Math.max(0, Math.min(assets.length - 1, i + (event.key === 'ArrowRight' ? 1 : -1)))); setZoom(1)
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [assets.length, session?.mode])
  const compare = session?.mode === 'compare'
  const visible = compare ? assets : assets[index] ? [assets[index]] : []
  const action = async (kind: 'open' | 'folder' | 'copy'): Promise<void> => {
    if (!visible[0]) return
    setError('')
    try { await api.open(visible[0].id, kind) } catch (e) { setError(String((e as Error).message ?? e)) }
  }
  return <main className="asset-preview-window musy-surface">
    <header className="asset-preview-toolbar">
      <div className="asset-preview-heading"><strong>{compare ? tx("并排参考") : tx("轻预览")}</strong><span>{compare ? tx('{count} 张图片', { count: assets.length }) : assets.length ? `${index + 1} / ${assets.length}` : ''}</span></div>
      <div className="asset-preview-zoom"><InteractiveButton aria-label={tx("缩小预览")} disabled={zoom <= .5} onClick={() => setZoom(z => Math.max(.5, z - .25))}>−</InteractiveButton><span title={tx("相对于适应窗口的预览尺寸")}>{Number(zoom.toFixed(2))}×</span><InteractiveButton aria-label={tx("放大预览")} disabled={zoom >= 4} onClick={() => setZoom(z => Math.min(4, z + .25))}>＋</InteractiveButton><InteractiveButton onClick={() => setZoom(1)}>{tx("适应")}</InteractiveButton></div>
      <InteractiveButton onClick={() => setAttempt(n => n + 1)}>{tx("重试预览")}</InteractiveButton>
      <InteractiveButton aria-pressed={session?.pinned ?? false} onClick={() => void api.previewControl('pin').then(pinned => setSession(value => value ? { ...value, pinned } : value))}>{session?.pinned ? tx("已置顶") : tx("置顶")}</InteractiveButton>
      <InteractiveButton onClick={() => void api.previewControl('close')}>{tx("关闭")}</InteractiveButton>
    </header>
    {error && <div className="asset-preview-error" role="alert">{tx(error)}<InteractiveButton onClick={() => setError('')}>{tx("收起")}</InteractiveButton></div>}
    {loading ? <div className="asset-preview-placeholder" role="status">{tx("正在打开素材…")}</div> : <div className={`asset-preview-grid count-${visible.length}`}>
      {visible.map(item => <PreviewImage key={item.id} item={item} zoom={zoom} attempt={attempt} onError={setError} onZoom={wheelZoom} />)}
    </div>}
    <footer className="asset-preview-actions">
      {!compare && <><InteractiveButton disabled={index === 0} onClick={() => { setIndex(i => i - 1); setZoom(1) }}>{tx("上一项")}</InteractiveButton><InteractiveButton disabled={index >= assets.length - 1} onClick={() => { setIndex(i => i + 1); setZoom(1) }}>{tx("下一项")}</InteractiveButton><InteractiveButton disabled={!visible[0]?.available} onClick={() => void action('open')}>{tx("外部打开")}</InteractiveButton><InteractiveButton disabled={!visible[0]?.available} onClick={() => void action('folder')}>{tx("所在位置")}</InteractiveButton></>}
      <InteractiveButton draggable={visible.length > 0 && visible.every(item => item.available && !item.deletedAt)} disabled={!visible.length || visible.some(item => !item.available || item.deletedAt)} title={tx("按住此按钮拖到资源管理器或支持文件拖入的软件")}
        onDragStart={event => { event.preventDefault(); event.dataTransfer.setData('application/x-musy-assets', '1'); void dragAssetFiles(visible.map(item => item.id)).catch(e => setError(String(e.message ?? e))) }}>{compare ? tx("拖出这些图片") : tx("拖出原文件")}</InteractiveButton>
      <span>{tx("滚轮缩放 · Esc / 空格关闭")}{!compare && tx(" · ← → 切换")}</span>
    </footer>
  </main>
}
