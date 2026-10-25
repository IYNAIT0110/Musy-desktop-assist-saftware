import { InteractiveButton } from './HoverFeedback'
import { useEffect, useState } from 'react'
import { ModelSettingsBody } from './ModelSettings'
import { PathSettingsBody } from './PathSettings'
import { LANGS, getLang, setLang, loadCustomLang, hasCustomLang, clearCustomLang, t, useLang, type LangKey } from '../i18n'
import { isClipboardPromptEnabled, setClipboardPromptEnabled } from '../clipboardPrompt'
import { AppearanceSettings } from './AppearanceSettings'

type TabKey = 'model' | 'path' | 'appearance' | 'language' | 'interaction'

const TABS: { key: TabKey; labelKey: string; icon: JSX.Element }[] = [
  {
    key: 'model',
    labelKey: 'settings.model',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    )
  },
  {
    key: 'path',
    labelKey: 'settings.path',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    )
  },
  {
    key: 'appearance',
    labelKey: 'settings.appearance',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3a9 9 0 0 0 0 18V3Z" />
      </svg>
    )
  },
  {
    key: 'language',
    labelKey: 'settings.language',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    )
  },
  {
    key: 'interaction',
    labelKey: 'settings.interaction',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.9-5.5a9 9 0 0 1-.9-4A8.5 8.5 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5Z" />
      </svg>
    )
  }
]

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-secondary)',
  marginBottom: 6,
  display: 'block'
}

/**
 * 统一设置面板：左侧 tab 导航（模型配置 / 数据路径 / 语言），右侧内容区。
 * 三个设置项同级并列，避免多弹层逻辑混乱。
 */
export function Settings({ onClose, initial = 'model' }: { onClose: () => void; initial?: TabKey }): JSX.Element {
  useLang()
  const [tab, setTab] = useState<TabKey>(initial)
  const [lang, setLangState] = useState<LangKey>(getLang)
  const [loadMsg, setLoadMsg] = useState<string | null>(null)
  const [clipboardPromptEnabled, setClipboardPromptEnabledState] = useState(isClipboardPromptEnabled)

  useEffect(() => {
    const onEsc = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [onClose])

  const pickLang = (id: LangKey): void => {
    setLang(id)
    setLangState(id)
  }

  // 加载本地语言包：调系统文件选择器，主进程读取 JSON 后导入
  const loadLangFile = async (): Promise<void> => {
    let json: string | null = null
    try {
      json = await window.api.pickLanguageFile()
    } catch {
      json = null
    }
    if (!json) return
    const ok = loadCustomLang(json)
    setLoadMsg(ok ? t('settings.langLoaded') : t('settings.langLoadFail'))
    window.setTimeout(() => setLoadMsg(null), 2200)
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 22,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-in musy-surface"
        style={{
          width: 560,
          maxHeight: '88%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-hover)',
          overflow: 'hidden'
        }}
      >
        {/* 标题栏 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 18px 12px'
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{t('settings.title')}</div>
          <InteractiveButton
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
          </InteractiveButton>
        </div>

        {/* 主体：左 tab + 右内容 */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* 左侧 tab 导航 */}
          <div
            style={{
              width: 120,
              flexShrink: 0,
              padding: '8px 8px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              borderRight: '1px solid var(--border)',
              background: 'var(--bg-panel)'
            }}
          >
            {TABS.map((tabItem) => (
              <InteractiveButton
                key={tabItem.key}
                onClick={() => setTab(tabItem.key)}
                style={{
                  height: 34,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: tab === tabItem.key ? 'var(--accent-tint-soft)' : 'transparent',
                  color: tab === tabItem.key ? 'var(--accent-tint)' : 'var(--text-secondary)',
                  fontSize: 12,
                  textAlign: 'left',
                  padding: '0 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'background-color var(--dur-fast) var(--ease-out)'
                }}
              >
                {tabItem.icon}
                <span style={{ whiteSpace: 'nowrap' }}>{t(tabItem.labelKey)}</span>
              </InteractiveButton>
            ))}
          </div>

          {/* 右侧内容区 */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              padding: '14px 18px 18px',
              overflowY: 'auto'
            }}
          >
            {tab === 'model' && <ModelSettingsBody />}
            {tab === 'path' && <PathSettingsBody />}
            {tab === 'appearance' && <AppearanceSettings />}
            {tab === 'interaction' && (
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: '10px 2px' }}>
                <input
                  type="checkbox"
                  checked={clipboardPromptEnabled}
                  onChange={(e) => {
                    setClipboardPromptEnabled(e.target.checked)
                    setClipboardPromptEnabledState(e.target.checked)
                  }}
                  style={{ marginTop: 3, accentColor: 'var(--accent)' }}
                />
                <span>
                  <strong style={{ display: 'block', fontSize: 13, color: 'var(--text-primary)' }}>{t('settings.clipboardPrompt')}</strong>
                  <small style={{ display: 'block', marginTop: 6, lineHeight: 1.5, color: 'var(--text-muted)' }}>{t('settings.clipboardPromptDesc')}</small>
                </span>
              </label>
            )}
            {tab === 'language' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* 内置语言 */}
                <div>
                  <label style={labelStyle}>{t('settings.builtinLang')}</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {LANGS.map((l) => (
                      <InteractiveButton
                        key={l.id}
                        onClick={() => pickLang(l.id)}
                        style={{
                          height: 40,
                          borderRadius: 'var(--radius-sm)',
                          border: `1px solid ${lang === l.id ? 'rgba(255,255,255,0.35)' : 'var(--border)'}`,
                          background: lang === l.id ? 'var(--accent-soft)' : 'var(--bg-input)',
                          color: lang === l.id ? '#ffffff' : 'var(--text-secondary)',
                          fontSize: 13,
                          cursor: 'pointer',
                          padding: '0 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all var(--dur-fast) var(--ease-out)'
                        }}
                      >
                        <span>{l.native}</span>
                        <span style={{ fontSize: 11, color: lang === l.id ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
                          {l.name}
                        </span>
                      </InteractiveButton>
                    ))}
                  </div>
                </div>

                {/* 自定义语言包 */}
                <div>
                  <label style={labelStyle}>{t('settings.customLang')}</label>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      lineHeight: 1.5,
                      marginBottom: 10
                    }}
                  >
                    {t('settings.customLangDesc')}
                    {hasCustomLang() && <span style={{ color: 'var(--accent-tint)' }}>{t('settings.customLangLoaded')}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <InteractiveButton
                      onClick={() => void loadLangFile()}
                      className="pressable"
                      style={{
                        height: 34,
                        padding: '0 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      {t('settings.chooseLangFile')}
                    </InteractiveButton>
                    {hasCustomLang() && (
                      <InteractiveButton
                        onClick={() => {
                          clearCustomLang()
                          setLoadMsg(t('settings.langCleared'))
                          window.setTimeout(() => setLoadMsg(null), 2000)
                        }}
                        style={{
                          height: 34,
                          padding: '0 14px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)',
                          background: 'transparent',
                          color: 'var(--text-secondary)',
                          fontSize: 12,
                          cursor: 'pointer'
                        }}
                      >
                        {t('settings.clear')}
                      </InteractiveButton>
                    )}
                  </div>
                  {loadMsg && (
                    <div
                      style={{
                        marginTop: 10,
                        fontSize: 12,
                        color: 'var(--accent-tint)'
                      }}
                    >
                      {loadMsg}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
