import { useState } from 'react'
import { getDataFolder, importBackup, setDataFolder } from '../store'
import { t, useLang } from '../i18n'

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-secondary)',
  marginBottom: 6,
  display: 'block'
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 36,
  padding: '0 12px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--bg-input)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  fontSize: 13,
  fontFamily: 'var(--font-mono)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color var(--dur-fast) var(--ease-out)'
}

/**
 * 数据保存路径配置弹层：
 * - 手动输入自定义文件夹路径
 * - 一键调系统目录选择器浏览选择
 * - 保存后所有数据自动写入该目录 musy-data.json
 */
export function PathSettings({ onClose }: { onClose: () => void }): JSX.Element {
  useLang()
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 21,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-in"
        style={{
          width: 440,
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-hover)',
          padding: '20px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}
      >
        {/* 标题 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            {t('path.title')}
          </div>
          <button
            onClick={onClose}
            title={t('settings.close')}
            style={{
              width: 26,
              height: 26,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <PathSettingsBody />
      </div>
    </div>
  )
}

/** 数据路径配置内容体（供独立弹层与统一设置面板复用） */
export function PathSettingsBody(): JSX.Element {
  useLang()
  const [path, setPath] = useState(getDataFolder())
  const [saved, setSaved] = useState(false)
  const [importError, setImportError] = useState(false)

  const restore = async (): Promise<void> => {
    const json = await window.api.pickDataBackup().catch(() => null)
    if (!json) return
    if (!window.confirm(t('path.importConfirm'))) return
    if (!importBackup(json)) {
      setImportError(true)
      return
    }
    window.location.reload()
  }

  // 浏览选择文件夹：选完立即生效
  const browse = async (): Promise<void> => {
    let folder: string | null = null
    try {
      folder = await window.api.chooseDataFolder()
    } catch {
      folder = null
    }
    if (folder) {
      setDataFolder(folder)
      setPath(folder)
      setSaved(true)
      window.setTimeout(() => setSaved(false), 800)
    }
  }

  const save = (): void => {
    const trimmed = path.trim()
    setDataFolder(trimmed)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 800)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          lineHeight: 1.5
        }}
      >
        {t('path.desc')}
      </div>

      {/* 路径输入 + 浏览按钮 */}
      <div>
        <label style={labelStyle}>{t('path.label')}</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={path}
            onChange={(e) => {
              setPath(e.target.value)
              setSaved(false)
            }}
            placeholder={t('path.placeholder')}
            spellCheck={false}
            style={inputStyle}
          />
          <button
            onClick={() => void browse()}
            title={t('path.browse')}
            className="pressable"
            style={{
              flexShrink: 0,
              height: 36,
              padding: '0 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--bg-input)',
              color: 'var(--text-secondary)',
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'all var(--dur-fast) var(--ease-out)'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            {t('path.browse')}
          </button>
        </div>
      </div>

      {/* 当前已保存路径展示 */}
      {getDataFolder() && (
        <div
          style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            background: 'var(--bg-hover)',
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            wordBreak: 'break-all'
          }}
        >
          {t('path.current')}{getDataFolder()}
        </div>
      )}

      {/* 保存 */}
      <button
        onClick={save}
        className="pressable"
        style={{
          height: 38,
          borderRadius: 'var(--radius-full)',
          border: 'none',
          background: saved ? 'rgba(255,255,255,0.18)' : 'var(--accent)',
          color: '#0a0a0a',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all var(--dur-fast) var(--ease-out)'
        }}
      >
        {saved ? t('path.saved') : t('path.save')}
      </button>
      <button onClick={() => void restore()} className="pressable" style={{
        height: 36, borderRadius: 'var(--radius-full)', border: '1px solid var(--border)',
        background: 'var(--bg-input)', color: 'var(--text-primary)', cursor: 'pointer'
      }}>
        {t('path.import')}
      </button>
      {importError && <div role="alert" style={{ color: '#ff6b6b', fontSize: 12 }}>{t('path.importError')}</div>}
    </div>
  )
}
