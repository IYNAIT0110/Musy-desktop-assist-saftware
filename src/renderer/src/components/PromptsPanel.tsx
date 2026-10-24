import { useEffect, useRef, useState } from 'react'
import {
  getPrompts,
  addPrompt,
  removePrompt,
  updatePrompt,
  getAllPromptTags,
  type PromptItem
} from '../store'
import { loadAIConfig } from './ModelSettings'
import { useLang } from '../i18n'
import { t } from '../i18n'

/** 提示词改写模式 */
type RewriteMode = 'rewrite' | 'expand' | 'concise' | 'translate'

const REWRITE_MODES: { key: RewriteMode; labelKey: string }[] = [
  { key: 'expand', labelKey: 'prompts.expand' },
  { key: 'translate', labelKey: 'prompts.translate' }
]

// 预览图压缩参数：长边 1280px + JPEG 0.85
// 原因：预览图以 base64 data URI 存在 localStorage 里，而单源配额只有 5~10MB，
// 直接存原图（动辄 2~5MB/张）几张就撑爆配额，之后所有保存都会静默失败。
const IMG_MAX_SIDE = 1280
const IMG_QUALITY = 0.85

/** 压缩并转成 data URI；压缩失败时回退原始 data URI，不阻断用户操作 */
async function blobToDataUri(blob: Blob): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (): void => resolve(String(reader.result ?? ''))
    reader.onerror = (): void => reject(new Error('read failed'))
    reader.readAsDataURL(blob)
  })
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = (): void => resolve(el)
      el.onerror = (): void => reject(new Error('decode failed'))
      el.src = raw
    })
    const sw = img.naturalWidth || img.width
    const sh = img.naturalHeight || img.height
    const scale = Math.min(1, IMG_MAX_SIDE / Math.max(sw, sh))
    // 尺寸和体积都够小就原样保留，避免二次压缩损失画质
    if (scale >= 1 && raw.length <= 400 * 1024) return raw
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(sw * scale))
    canvas.height = Math.max(1, Math.round(sh * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) return raw
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', IMG_QUALITY)
  } catch {
    return raw
  }
}

/**
 * 安全读取剪贴板里的第一张图片。
 * Electron 的 file:// 不是安全上下文，navigator.clipboard 可能不存在，
 * 直接 navigator.clipboard.read() 是同步 TypeError，用 .catch 抓不到。
 */
async function readClipboardImage(): Promise<Blob | null> {
  try {
    if (!navigator.clipboard?.read) return null
    const items = await navigator.clipboard.read()
    for (const it of items) {
      const ft = it.types.find((ty) => ty.startsWith('image/'))
      if (ft) return await it.getType(ft)
    }
  } catch {
    /* 无权限 / 无图片 → 忽略 */
  }
  return null
}

/**
 * 文生图提示词收藏面板：
 * - 网格卡片列表（效果预览图 + 正文 + 标签）
 * - 标签筛选（效果分类 / 项目分类都作为标签）
 * - 新增（粘贴图片 + 标签 + 备注）
 * - 点击卡片 → 打开 L4 提示词工作区（母子提示词 + 图片 + AI 改写）
 */
export function PromptsPanel({
  query,
  onOpenPrompt
}: {
  query: string
  onOpenPrompt: (p: PromptItem) => void
}): JSX.Element {
  useLang()
  const [prompts, setPrompts] = useState<PromptItem[]>(getPrompts)
  const [allTags, setAllTags] = useState<string[]>(getAllPromptTags)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  // 新建弹层
  const [showAdd, setShowAdd] = useState(false)
  // toast
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null)

  // L4 工作区/编辑器等改动提示词数据时同步刷新列表
  useEffect(() => {
    const handler = (): void => {
      setPrompts(getPrompts())
      setAllTags(getAllPromptTags())
    }
    window.addEventListener('musy:prompts-changed', handler)
    return () => window.removeEventListener('musy:prompts-changed', handler)
  }, [])

  // 写入失败（localStorage 配额被图片撑满）时提示用户，避免"以为存上了其实没存上"
  useEffect(() => {
    const handler = (e: Event): void => {
      const detail = (e as CustomEvent<{ quotaExceeded?: boolean }>).detail
      if (detail?.quotaExceeded === false) return
      setToast({ ok: false, msg: t('prompts.storageFull') })
      window.setTimeout(() => setToast(null), 3000)
    }
    window.addEventListener('musy:storage-error', handler)
    return () => window.removeEventListener('musy:storage-error', handler)
  }, [])

  const showToast = (ok: boolean, msg: string): void => {
    setToast({ ok, msg })
    window.setTimeout(() => setToast(null), 1800)
  }

  const refresh = (): void => {
    setPrompts(getPrompts())
    setAllTags(getAllPromptTags())
  }

  const q = query.trim().toLowerCase()

  const visible = prompts.filter((p) => {
    // 子提示词不在主网格展示（挂在母提示词详情页）
    if (p.parentId) return false
    if (activeTag && !p.tags.includes(activeTag)) return false
    if (q && !p.text.toLowerCase().includes(q) && !p.tags.some((tg) => tg.toLowerCase().includes(q)))
      return false
    return true
  })

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      {/* 标签筛选条 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '10px 14px',
          borderBottom: '1px solid var(--border)',
          overflowX: 'auto',
          flexShrink: 0
        }}
      >
        <button
          onClick={() => setActiveTag(null)}
          style={tagChipStyle(activeTag === null)}
        >
          {t('prompts.all')}
        </button>
        {allTags.map((tg) => (
          <button key={tg} onClick={() => setActiveTag(tg)} style={tagChipStyle(activeTag === tg)}>
            {tg}
          </button>
        ))}
        <button
          onClick={() => setShowAdd(true)}
          className="pressable"
          title={t('prompts.add')}
          style={{
            marginLeft: 'auto',
            flexShrink: 0,
            height: 28,
            padding: '0 10px',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background: 'var(--accent)',
            color: '#0a0a0a',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t('prompts.add')}
        </button>
      </div>

      {/* 列表 */}
      <div
        className="animate-fade-in"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: 14,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridAutoRows: '200px',
          gap: 16,
          alignContent: 'start'
        }}
      >
        {visible.length === 0 && (
          <div
            style={{
              gridColumn: '1 / -1',
              height: '100%',
              minHeight: 120,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              color: 'var(--text-muted)',
              fontSize: 13
            }}
          >
            <span>{q ? t('prompts.noResult') : t('prompts.empty')}</span>
            {!q && (
              <button
                onClick={() => setShowAdd(true)}
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: 'var(--accent-tint)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {t('prompts.addFirst')}
              </button>
            )}
          </div>
        )}

        {visible.map((p) => (
          <PromptCard
            key={p.id}
            p={p}
            onClick={() => onOpenPrompt(p)}
            onCopy={() => {
              void navigator.clipboard.writeText(p.text)
              showToast(true, t('prompts.copied'))
            }}
            onDelete={() => {
              removePrompt(p.id)
              refresh()
              showToast(true, t('prompts.deleted'))
            }}
          />
        ))}
      </div>

      {/* 新建弹层 */}
      {showAdd && (
        <PromptEditor
          initial={null}
          onClose={() => setShowAdd(false)}
          onSaved={(id) => {
            refresh()
            showToast(true, t('prompts.saved'))
            // 打开 L4 提示词工作区
            const found = getPrompts().find((x) => x.id === id)
            if (found) onOpenPrompt(found)
          }}
        />
      )}

      {/* toast */}
      {toast && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            background: toast.ok ? 'var(--accent-tint)' : '#d34a3a',
            color: '#fff',
            fontSize: 12,
            boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
            zIndex: 60
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}

function tagChipStyle(active: boolean): React.CSSProperties {
  return {
    height: 26,
    padding: '0 12px',
    borderRadius: 'var(--radius-full)',
    border: `1px solid ${active ? 'transparent' : 'var(--border)'}`,
    background: active ? 'var(--accent-tint-soft)' : 'var(--bg-input)',
    color: active ? 'var(--accent-tint)' : 'var(--text-secondary)',
    fontSize: 12,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all var(--dur-fast) var(--ease-out)'
  }
}

/** 单张提示词卡片：预览图 + 正文截断 + 标签 */
function PromptCard({
  p,
  onClick,
  onCopy,
  onDelete
}: {
  p: PromptItem
  onClick: () => void
  onCopy: () => void
  onDelete: () => void
}): JSX.Element {
  // 删除二次确认：点一次进入待确认态（按钮变红色「删除」文字），再点才真正删除
  const [confirming, setConfirming] = useState(false)

  // 鼠标离开卡片时，若正处于待确认态则自动复位
  const resetConfirm = (): void => {
    if (confirming) setConfirming(false)
  }

  return (
    <button
      onClick={onClick}
      className="pressable prompt-card"
      style={{
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        background: 'var(--bg-input)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        textAlign: 'left',
        padding: 0,
        position: 'relative',
        width: '100%',
        height: '100%',
        transition: 'border-color var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-hover)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.transform = 'none'
        resetConfirm()
      }}
    >
      {/* 预览图：铺满整卡 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--bg-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        {p.image ? (
          <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
        )}
      </div>

      {/* 悬停快捷操作：图片上端复制 / 删除 */}
      <div
        className="prompt-card-actions"
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          display: 'flex',
          gap: 6,
          opacity: 0,
          transform: 'translateY(-4px)',
          pointerEvents: 'none',
          transition: 'opacity var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out)'
        }}
      >
        <span
          onClick={(e) => {
            e.stopPropagation()
            onCopy()
          }}
          title={t('prompts.copy')}
          style={cardActionBtnStyle}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </span>
        {confirming ? (
          <span
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="animate-fade-in"
            style={{
              ...cardActionBtnStyle,
              ...cardActionDeleteStyle,
              width: 'auto',
              padding: '0 10px',
              fontSize: 11,
              fontWeight: 600
            }}
          >
            {t('prompts.delete')}
          </span>
        ) : (
          <span
            onClick={(e) => {
              e.stopPropagation()
              setConfirming(true)
            }}
            title={t('prompts.delete')}
            style={{ ...cardActionBtnStyle, ...cardActionDeleteStyle }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </span>
        )}
      </div>
      {/* 悬停提示词片段：图片下端浮现半透明深色条，可滚动查看更多 */}
      <div
        className="prompt-card-text"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          padding: '36px 10px 10px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.7) 45%, rgba(0,0,0,0) 100%)',
          fontSize: 11,
          lineHeight: 1.5,
          color: '#fff',
          overflowY: 'auto',
          opacity: 0,
          transform: 'translateY(4px)',
          pointerEvents: 'none',
          transition: 'opacity var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out)',
          textAlign: 'left'
        }}
      >
        <div style={{ paddingBottom: 8 }}>{p.text}</div>
      </div>

      {/* 标签：浮在图片左下角 */}
      <div
        className="prompt-card-tags"
        style={{
          position: 'absolute',
          left: 8,
          bottom: 8,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          maxWidth: 'calc(100% - 16px)'
        }}
      >
        {p.tags.slice(0, 3).map((tg) => (
          <span
            key={tg}
            style={{
              fontSize: 10,
              color: '#fff',
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(4px)',
              padding: '2px 7px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(255,255,255,0.18)',
              whiteSpace: 'nowrap'
            }}
          >
            {tg}
          </span>
        ))}
      </div>
    </button>
  )
}

/** 新建 / 编辑提示词弹层 */
function PromptEditor({
  initial,
  onClose,
  onSaved
}: {
  initial: PromptItem | null
  onClose: () => void
  onSaved: (id: string) => void
}): JSX.Element {
  const [text, setText] = useState(initial?.text ?? '')
  const [image, setImage] = useState<string | undefined>(initial?.image)
  const [note, setNote] = useState(initial?.note ?? '')
  const [tagsInput, setTagsInput] = useState(initial?.tags.join(' ') ?? '')
  const [tags, setTags] = useState<string[]>(initial?.tags ?? [])
  const fileRef = useRef<HTMLInputElement>(null)

  const addTagFromInput = (): void => {
    const raw = tagsInput.trim()
    if (!raw) return
    const newTags = raw
      .split(/[\s,，、]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    const merged = [...new Set([...tags, ...newTags])]
    setTags(merged)
    setTagsInput('')
  }

  const onPickImage = (): void => {
    const f = fileRef.current?.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) return
    void blobToDataUri(f).then(setImage)
  }

  const save = (): void => {
    if (!text.trim()) return
    if (initial) {
      updatePrompt(initial.id, { text: text.trim(), tags, image, note })
      onSaved(initial.id)
    } else {
      const id = addPrompt({ text: text.trim(), tags, image, note })
      onSaved(id)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onPaste={(e) => {
          // 弹层内任意位置 Ctrl/Cmd+V：剪贴板里有图片则设为预览图
          const items = e.clipboardData?.items
          if (!items) return
          for (const it of items) {
            if (it.type.startsWith('image/')) {
              const f = it.getAsFile()
              if (f) {
                e.preventDefault()
                void blobToDataUri(f).then(setImage)
                return
              }
            }
          }
        }}
        className="animate-fade-in"
        style={{
          width: 420,
          maxHeight: '90%',
          overflowY: 'auto',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-hover)',
          padding: '20px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          {initial ? t('prompts.edit') : t('prompts.add')}
        </div>

        {/* 预览图 */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
            {t('prompts.image')}
          </div>
          <div
            onClick={() => {
              // 已有图 → 点击换图（文件选择）；无图 → 先试剪贴板，没有图再弹文件选择
              if (image) {
                fileRef.current?.click()
                return
              }
              void readClipboardImage().then((blob) => {
                if (blob) void blobToDataUri(blob).then(setImage)
                else fileRef.current?.click()
              })
            }}
            style={{
              height: 120,
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-hover)',
              background: 'var(--bg-input)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {image ? (
              <>
                <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <span
                  onClick={(e) => {
                    e.stopPropagation()
                    setImage(undefined)
                  }}
                  title={t('prompts.removeImage')}
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    background: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </span>
              </>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('prompts.pasteImage')}</span>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPickImage} />
        </div>

        {/* 提示词正文 */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
            {t('prompts.text')}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('prompts.textPlaceholder')}
            rows={5}
            style={{
              width: '100%',
              resize: 'vertical',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontSize: 12.5,
              lineHeight: 1.5,
              padding: '10px 12px',
              outline: 'none',
              fontFamily: 'var(--font-sans)'
            }}
          />
        </div>

        {/* 标签 */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
            {t('prompts.tags')}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  addTagFromInput()
                }
              }}
              placeholder={t('prompts.tagsPlaceholder')}
              style={{
                flex: 1,
                height: 34,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: 12,
                padding: '0 10px',
                outline: 'none'
              }}
            />
            <button
              onClick={addTagFromInput}
              className="pressable"
              style={{
                height: 34,
                padding: '0 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--bg-input)',
                color: 'var(--text-secondary)',
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              {t('prompts.addTag')}
            </button>
          </div>
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {tags.map((tg) => (
                <span
                  key={tg}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    color: 'var(--accent-tint)',
                    background: 'var(--accent-tint-soft)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)'
                  }}
                >
                  {tg}
                  <span
                    onClick={() => setTags(tags.filter((x) => x !== tg))}
                    style={{ cursor: 'pointer', opacity: 0.7 }}
                  >
                    ✕
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 备注（模型参数等） */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
            {t('prompts.note')}
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('prompts.notePlaceholder')}
            style={{
              width: '100%',
              height: 34,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontSize: 12,
              padding: '0 10px',
              outline: 'none'
            }}
          />
        </div>

        {/* 保存 */}
        <button
          onClick={save}
          disabled={!text.trim()}
          className="pressable"
          style={{
            height: 38,
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background: text.trim() ? 'var(--accent)' : 'var(--bg-hover)',
            color: text.trim() ? '#0a0a0a' : 'var(--text-muted)',
            fontSize: 13,
            fontWeight: 600,
            cursor: text.trim() ? 'pointer' : 'default'
          }}
        >
          {t('prompts.save')}
        </button>
      </div>
    </div>
  )
}


/**
 * L4 提示词工作区：母/子提示词 + 图片 + AI 改写
 * 布局：左列（主效果图 + 子提示词缩略图）| 右列（正文 + 修改功能按钮区）
 */
export function PromptWorkspace({
  item,
  onClose,
  onOpenItem
}: {
  item: PromptItem
  onClose: () => void
  onOpenItem: (p: PromptItem) => void
}): JSX.Element {
  useLang()
  const [all, setAll] = useState<PromptItem[]>(getPrompts)
  const [mode, setMode] = useState<RewriteMode>('expand')
  const [rewriting, setRewriting] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  // 内联编辑正文草稿
  const [draft, setDraft] = useState('')
  const [confirmingDel, setConfirmingDel] = useState(false)
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null)
  // 悬停图片放大预览：待展示的完整尺寸图片（data URI）；null 表示关闭
  const [zoomImg, setZoomImg] = useState<string | null>(null)
  // 标签编辑：添加输入态
  const [addingTag, setAddingTag] = useState(false)
  const [tagInput, setTagInput] = useState('')
  // 主图悬停：显示"修改预览图"悬浮条
  const [imgHover, setImgHover] = useState(false)
  const imgInputRef = useRef<HTMLInputElement | null>(null)
  // 子提示词缩略图条：横向滚动容器（鼠标滚轮映射为横向滚动）
  const childStripRef = useRef<HTMLDivElement | null>(null)

  // 应用图片（File 或 data URI 两种来源统一写入）
  const applyImage = (dataUri: string): void => {
    updatePrompt(selected.id, { image: dataUri })
    onToast(true, t('prompts.saved'))
  }

  // 从剪贴板粘贴图片（Ctrl/Cmd+V）
  const pasteImage = (e: React.ClipboardEvent): void => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const it of items) {
      if (it.type.startsWith('image/')) {
        const f = it.getAsFile()
        if (f) {
          e.preventDefault()
          void blobToDataUri(f).then(applyImage)
          return
        }
      }
    }
  }

  // 标签增删（修改 = 删旧加新），写入后由 musy:prompts-changed 事件同步刷新
  const setTags = (tags: string[]): void => {
    updatePrompt(selected.id, { tags })
  }
  const commitTag = (): void => {
    const tg = tagInput.trim()
    if (tg && !selected.tags.includes(tg)) setTags([...selected.tags, tg])
    setAddingTag(false)
    setTagInput('')
  }

  const onToast = (ok: boolean, msg: string): void => {
    setToast({ ok, msg })
    window.setTimeout(() => setToast(null), 1800)
  }

  // 提示词数据变化时同步（新增子提示词 / 编辑 / 删除）
  useEffect(() => {
    const handler = (): void => setAll(getPrompts())
    window.addEventListener('musy:prompts-changed', handler)
    return () => window.removeEventListener('musy:prompts-changed', handler)
  }, [])

  // 写入失败（localStorage 配额被图片撑满）时提示用户
  useEffect(() => {
    const handler = (e: Event): void => {
      const detail = (e as CustomEvent<{ quotaExceeded?: boolean }>).detail
      if (detail?.quotaExceeded === false) return
      onToast(false, t('prompts.storageFull'))
    }
    window.addEventListener('musy:storage-error', handler)
    return () => window.removeEventListener('musy:storage-error', handler)
  }, [])

  // 卸载后不再 setState（AI 改写是异步的，期间可能已关闭工作区）
  const aliveRef = useRef(true)
  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
    }
  }, [])

  const selected = all.find((x) => x.id === item.id) ?? item
  const parent = selected.parentId ? (all.find((x) => x.id === selected.parentId) ?? null) : null
  // 层级只有两层：母提示词 → 子提示词
  // 当前是母提示词时展示它的子提示词；当前是子提示词时展示同级的其他子提示词（不再往下嵌套）
  const isChild = !!selected.parentId
  const listParentId = selected.parentId ?? selected.id
  const children = all.filter((x) => x.parentId === listParentId && x.id !== selected.id)
  // 新建子提示词时归属的母提示词：子提示词级一律挂回原本的母提示词下
  const childOwnerId = parent?.id ?? selected.id

  // 子提示词过多时：鼠标滚轮 → 横向滚动缩略图条
  // （React 的 onWheel 是被动监听，无法 preventDefault，因此用原生非被动监听）
  useEffect(() => {
    const el = childStripRef.current
    if (!el) return
    const onWheel = (e: WheelEvent): void => {
      if (el.scrollWidth <= el.clientWidth + 1) return // 未溢出则交还给外层滚动
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX
      if (delta === 0) return
      e.preventDefault()
      el.scrollLeft += delta
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [children.length, selected.id])

  const doRewrite = async (): Promise<void> => {
    const cfg = loadAIConfig()
    if (!cfg.apiKey) {
      onToast(false, t('prompts.noKey'))
      return
    }
    setRewriting(true)
    setResult(null)
    try {
      const out = await window.api.rewritePrompt(cfg, selected.text, mode)
      if (!aliveRef.current) return
      if (out && !out.startsWith('ERROR:')) {
        setResult(out)
      } else if (out && out.startsWith('ERROR:')) {
        onToast(false, out.slice('ERROR:'.length))
      } else {
        onToast(false, t('prompts.rewriteFailed'))
      }
    } catch {
      // IPC 失败（主进程未注册 / 网络异常）时也要解除按钮禁用，否则两个按钮会永久卡住
      if (aliveRef.current) onToast(false, t('prompts.rewriteFailed'))
    } finally {
      if (aliveRef.current) setRewriting(false)
    }
  }

  // 保存改写结果为子提示词（子提示词级 → 挂回母提示词下，成为同级）
  const saveAsChild = (): void => {
    if (!result) return
    addPrompt({
      text: result,
      tags: selected.tags,
      image: selected.image,
      note: selected.note,
      parentId: childOwnerId
    })
    setResult(null)
    onToast(true, t('prompts.savedAsChild'))
  }

  const copyText = (txt: string): void => {
    void navigator.clipboard.writeText(txt)
    onToast(true, t('prompts.copied'))
  }

  // 内联编辑正文：进入编辑 / 保存 / 取消
  const startEdit = (): void => {
    setDraft(selected.text)
    setEditing(true)
  }
  const saveEdit = (): void => {
    const txt = draft.trim()
    if (txt && txt !== selected.text) updatePrompt(selected.id, { text: txt })
    setEditing(false)
  }
  // 编辑态：把当前草稿另存为一条新子提示词（不改动原文；子提示词级 → 挂回母提示词下）
  const saveDraftAsChild = (): void => {
    const txt = draft.trim()
    if (!txt) return
    const id = addPrompt({
      text: txt,
      tags: selected.tags,
      image: selected.image,
      note: selected.note,
      parentId: childOwnerId
    })
    setEditing(false)
    onToast(true, t('prompts.savedAsChild'))
    onOpenItem(getPrompts().find((x) => x.id === id) ?? selected)
  }

  // 删除：删子提示词回母提示词；删母提示词关闭工作区（子级联删除）
  const doDelete = (): void => {
    const back = parent
    removePrompt(selected.id)
    if (back) onOpenItem(back)
    else onClose()
    onToast(true, t('prompts.deleted'))
  }

  return (
    <div
      style={{
        position: 'relative',
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '12px 16px 14px',
        background: 'var(--bg-panel)',
        borderTop: '1px solid var(--border)'
      }}
      onClick={() => {
        // 删除确认态下点击其他任意位置 = 取消删除
        if (confirmingDel) setConfirmingDel(false)
      }}
    >
      {/* === 上排：主效果图 | 正文（底部对齐） === */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 12, minWidth: 0 }}>
      {/* 左列：主效果图 */}
      <div style={{ width: 210, flexShrink: 0, display: 'flex', minHeight: 0 }}>
        {/* 主效果图（悬停上缘浮现"修改预览图"按钮） */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
          onMouseEnter={() => setImgHover(true)}
          onMouseLeave={() => setImgHover(false)}
          onPaste={pasteImage}
        >
          {selected.image ? (
            <img
              src={selected.image}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }}
              draggable={false}
              onClick={() => setZoomImg(selected.image ?? null)}
            />
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          )}
          {/* 上缘悬浮条：选择本地图片 / 粘贴剪贴板图片 */}
          {imgHover && (
            <div
              className="animate-fade-in"
              style={{
                position: 'absolute',
                top: 8,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  imgInputRef.current?.click()
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  height: 26,
                  padding: '0 11px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  background: 'rgba(20, 20, 20, 0.88)',
                  backdropFilter: 'blur(6px)',
                  color: '#fff',
                  fontSize: 11.5,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.4)'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
                {t('prompts.changeImage')}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  void readClipboardImage().then((blob) => {
                    if (!blob) {
                      onToast(false, t('prompts.pasteImage'))
                      return
                    }
                    void blobToDataUri(blob).then(applyImage)
                  })
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  height: 26,
                  padding: '0 11px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  background: 'rgba(20, 20, 20, 0.88)',
                  backdropFilter: 'blur(6px)',
                  color: '#fff',
                  fontSize: 11.5,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.4)'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                {t('prompts.pasteImage')}
              </button>
            </div>
          )}
          <input
            ref={imgInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (!f) return
              e.target.value = ''
              void blobToDataUri(f).then(applyImage)
            }}
          />
        </div>

      </div>

      {/* 右列：正文 + 改写结果 */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* 正文区：编辑态为内联 textarea，仅编辑正文（不含标签/备注） */}
        {editing ? (
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setEditing(false)
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveEdit()
            }}
            style={{
              flex: 1,
              minHeight: 0,
              resize: 'none',
              border: '1px solid var(--accent-tint)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)',
              padding: '12px 14px',
              fontSize: 12.5,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              outline: 'none'
            }}
          />
        ) : (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)',
              padding: '12px 14px',
              fontSize: 12.5,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: 'var(--text-primary)'
            }}
          >
            {selected.text}
          </div>
        )}

        {/* 改写结果 */}
        {result && (
          <div
            style={{
              flexShrink: 0,
              maxHeight: 150,
              overflowY: 'auto',
              border: '1px solid var(--border-hover)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-tint-soft)',
              padding: '10px 12px',
              fontSize: 12,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: 'var(--text-primary)'
            }}
          >
            {result}
          </div>
        )}

      </div>
      </div>

      {/* === 下排：子提示词 | 标签（与上排左右对齐，正文底边与主图底边平齐） === */}
      <div style={{ height: 94, flexShrink: 0, display: 'flex', gap: 12 }}>
        {/* 子提示词缩略图（横向排列，过多时鼠标滚轮横向滚动查看） */}
        <div
          style={{
            width: 210,
            flexShrink: 0,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {children.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, flexShrink: 0 }}>
                {isChild ? t('prompts.siblings') : t('prompts.children')}（{children.length}）
              </div>
              <div
                ref={childStripRef}
                className="child-strip"
                style={{
                  display: 'flex',
                  gap: 8,
                  flex: 1,
                  minHeight: 0,
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  paddingBottom: 4
                }}
              >
                {children.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onOpenItem(c)}
                    title={c.text}
                    className="pressable"
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      padding: 0,
                      overflow: 'hidden',
                      background: 'var(--bg-card)',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    {c.image ? (
                      <img
                        src={c.image}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        draggable={false}
                      />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '20px auto', display: 'block' }}>
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="m21 15-5-5L5 21" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 标签行：显示 + 编辑（悬停删除、添加新标签） */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            alignItems: 'flex-start',
            alignContent: 'flex-start',
            overflowY: 'auto',
            paddingTop: 2
          }}
        >
          {selected.tags.map((tg) => (
            <span
              key={tg}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                height: 22,
                padding: '0 8px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border)',
                background: 'var(--bg-input)',
                fontSize: 11,
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap'
              }}
            >
              {tg}
              <span
                onClick={() => setTags(selected.tags.filter((x) => x !== tg))}
                title={t('prompts.delete')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: 11,
                  lineHeight: 1
                }}
              >
                ✕
              </span>
            </span>
          ))}
          {addingTag ? (
            <input
              autoFocus
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onBlur={() => {
                setAddingTag(false)
                setTagInput('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitTag()
                if (e.key === 'Escape') {
                  setAddingTag(false)
                  setTagInput('')
                }
              }}
              placeholder={t('prompts.tagsPlaceholder')}
              style={{
                height: 22,
                width: 150,
                padding: '0 8px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-hover)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: 11,
                outline: 'none'
              }}
            />
          ) : (
            <span
              onClick={() => setAddingTag(true)}
              className="pressable"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                height: 22,
                padding: '0 9px',
                borderRadius: 'var(--radius-full)',
                border: '1px dashed var(--border-hover)',
                fontSize: 11,
                color: 'var(--text-muted)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              + {t('prompts.addTag')}
            </span>
          )}
        </div>
      </div>

        {/* 操作按钮区：扩写 | 复制/编辑/删除 | 翻译(宽) | 返回+退出 */}
        <div style={{ flexShrink: 0, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          {/* 扩写 + 翻译：整体宽度对齐左侧主图列（210px），两按钮等分 */}
          <div style={{ width: 210, flexShrink: 0, display: 'flex', gap: 6 }}>
          {/* 扩写 */}
          <button
            onClick={() => {
              setMode('expand')
              setResult(null)
              void doRewrite()
            }}
            disabled={rewriting}
            className="pressable"
            style={{
              flex: 1,
              minWidth: 0,
              height: 28,
              padding: 0,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: rewriting ? 'var(--bg-hover)' : 'var(--accent)',
              color: rewriting ? 'var(--text-muted)' : '#0a0a0a',
              fontSize: 11.5,
              fontWeight: 600,
              cursor: rewriting ? 'default' : 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {rewriting ? t('prompts.rewriting') : t(REWRITE_MODES[0].labelKey)}
          </button>
          {/* 翻译：等宽按钮，紧贴扩写右侧 */}
          <button
            onClick={() => {
              setMode('translate')
              setResult(null)
              void doRewrite()
            }}
            disabled={rewriting}
            className="pressable"
            style={{
              flex: 1,
              minWidth: 0,
              height: 28,
              padding: 0,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: rewriting ? 'var(--bg-hover)' : 'var(--accent)',
              color: rewriting ? 'var(--text-muted)' : '#0a0a0a',
              fontSize: 11.5,
              fontWeight: 600,
              cursor: rewriting ? 'default' : 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {rewriting ? t('prompts.rewriting') : t(REWRITE_MODES[1].labelKey)}
          </button>
          </div>
          {/* 复制 */}
          <button
            onClick={() => copyText(selected.text)}
            className="pressable"
            style={{
              height: 28,
              padding: '0 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--bg-input)',
              color: 'var(--text-secondary)',
              fontSize: 11.5,
              cursor: 'pointer'
            }}
          >
            {t('prompts.copy')}
          </button>
          {/* 保存为子提示词（有改写结果时） */}
          {result && (
            <button
              onClick={saveAsChild}
              className="pressable"
              style={{
                height: 28,
                padding: '0 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: 'var(--accent-tint)',
                color: '#fff',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {t('prompts.saveAsChild')}
            </button>
          )}
          {/* 编辑 / 保存组 */}
          {editing ? (
            <>
              <button
                onClick={saveDraftAsChild}
                className="pressable"
                style={{
                  height: 28,
                  padding: '0 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: 'var(--accent-tint)',
                  color: '#fff',
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {t('prompts.saveAsChild')}
              </button>
              <button
                onClick={saveEdit}
                className="pressable"
                title={t('prompts.save')}
                style={{
                  height: 28,
                  padding: '0 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#0a0a0a',
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {t('prompts.save')}
              </button>
            </>
          ) : (
            <button
              onClick={startEdit}
              title={t('prompts.edit')}
              className="pressable"
              style={{ ...iconBtnStyle, width: 28, height: 28 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
            </button>
          )}
          {/* 删除（二次确认） */}
          {confirmingDel ? (
            <button
              onClick={(e) => {
                e.stopPropagation() // 不触发根容器的"点击取消"
                doDelete()
              }}
              className="pressable"
              title={t('links.confirm')}
              style={{
                ...iconBtnStyle,
                width: 'auto',
                height: 28,
                padding: '0 12px',
                background: '#e74c3c',
                borderColor: '#e74c3c',
                color: '#fff',
                fontSize: 11.5,
                fontWeight: 600
              }}
            >
              {t('prompts.delete')}
            </button>
          ) : (
            <button
              onClick={() => setConfirmingDel(true)}
              title={t('prompts.delete')}
              className="pressable"
              style={{ ...iconBtnStyle, width: 28, height: 28 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
          {/* 返回母提示词 + 退出：紧贴在一起，靠右 */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            {parent && (
              <button
                onClick={() => onOpenItem(parent)}
                className="pressable"
                title={t('prompts.openParent')}
                style={{ ...iconBtnStyle, width: 28, height: 28 }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              title={t('prompts.close')}
              className="pressable"
              style={{ ...iconBtnStyle, width: 28, height: 28 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      {/* 悬停图片放大预览：完整尺寸居中展示，缩放入场动画 */}
      {zoomImg && (
        <div
          className="img-zoom-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out'
          }}
          onClick={() => setZoomImg(null)}
        >
          <img
            src={zoomImg}
            alt=""
            style={{
              maxWidth: '82vw',
              maxHeight: '82vh',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255,255,255,0.14)',
              boxShadow: '0 18px 60px rgba(0,0,0,0.6)',
              objectFit: 'contain',
              pointerEvents: 'none'
            }}
          />
        </div>
      )}

      {/* toast */}
      {toast && (
        <div
          style={{
            position: 'absolute',
            bottom: 54,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '7px 14px',
            borderRadius: 'var(--radius-full)',
            background: toast.ok ? 'var(--accent-tint)' : '#d34a3a',
            color: '#fff',
            fontSize: 12,
            boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
            zIndex: 30,
            whiteSpace: 'nowrap'
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}

const iconBtnStyle: React.CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)',
  background: 'var(--bg-input)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'border-color var(--dur-fast) var(--ease-out)'
}

/** 卡片悬停快捷按钮 */
const cardActionBtnStyle: React.CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 'var(--radius-sm)',
  background: 'rgba(0,0,0,0.62)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'background var(--dur-fast) var(--ease-out)'
}

const cardActionDeleteStyle: React.CSSProperties = {
  background: 'rgba(211, 74, 58, 0.82)'
}
