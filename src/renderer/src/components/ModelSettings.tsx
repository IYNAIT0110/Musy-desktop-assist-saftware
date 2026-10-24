import { useState } from 'react'
import { t, useLang } from '../i18n'

export interface AIConfig {
  provider: string
  baseUrl: string
  apiKey: string
  model: string
}

// 内置国内外主流大模型预设（OpenAI 兼容接口）
export const PROVIDERS: {
  id: string
  name: string
  baseUrl: string
  models: string[]
}[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-reasoner']
  },
  {
    id: 'qwen',
    name: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: ['qwen-plus', 'qwen-turbo', 'qwen-max', 'qwen-long']
  },
  {
    id: 'zhipu',
    name: '智谱 GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: ['glm-4-plus', 'glm-4-air', 'glm-4-flash', 'glm-4v-plus']
  },
  {
    id: 'moonshot',
    name: 'Moonshot Kimi',
    baseUrl: 'https://api.moonshot.cn/v1',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k']
  },
  {
    id: 'doubao',
    name: '字节豆包',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    models: ['doubao-pro-32k', 'doubao-pro-128k', 'doubao-lite-32k']
  },
  {
    id: 'siliconflow',
    name: '硅基流动',
    baseUrl: 'https://api.siliconflow.cn/v1',
    models: ['deepseek-ai/DeepSeek-V3', 'Qwen/Qwen2.5-72B-Instruct', 'THUDM/glm-4-9b-chat']
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'o3-mini']
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: ['openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet', 'google/gemini-2.0-flash-001']
  },
  {
    id: 'custom',
    name: '自定义',
    baseUrl: '',
    models: []
  }
]

const STORAGE_KEY = 'musy.ai.config'

export function loadAIConfig(): AIConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AIConfig
  } catch {
    /* ignore */
  }
  return { provider: 'deepseek', baseUrl: PROVIDERS[0].baseUrl, apiKey: '', model: PROVIDERS[0].models[0] }
}

function saveAIConfig(cfg: AIConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
}

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
  fontFamily: 'var(--font-sans)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color var(--dur-fast) var(--ease-out)'
}

/**
 * 模型配置弹层：预设国内外主流大模型 + 自定义 + Key 填写
 */
export function ModelSettings({ onClose }: { onClose: () => void }): JSX.Element {
  useLang()
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 20,
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
          width: 420,
          maxHeight: '88%',
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
        {/* 标题 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            {t('settings.model')}
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
        <ModelSettingsBody />
      </div>
    </div>
  )
}

/** 模型配置内容体（供独立弹层与统一设置面板复用） */
export function ModelSettingsBody(): JSX.Element {
  useLang()
  const [cfg, setCfg] = useState<AIConfig>(loadAIConfig)
  const [saved, setSaved] = useState(false)
  const [showKey, setShowKey] = useState(false)

  const preset = PROVIDERS.find((p) => p.id === cfg.provider)

  const pickProvider = (id: string): void => {
    const p = PROVIDERS.find((x) => x.id === id)
    if (!p) return
    setCfg({
      ...cfg,
      provider: id,
      baseUrl: p.baseUrl,
      model: p.models[0] ?? ''
    })
    setSaved(false)
  }

  const save = (): void => {
    saveAIConfig(cfg)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 800)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 服务商预设（网格选择） */}
      <div>
        <label style={labelStyle}>{t('model.provider')}</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => pickProvider(p.id)}
              style={{
                height: 34,
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${cfg.provider === p.id ? 'rgba(255,255,255,0.35)' : 'var(--border)'}`,
                background: cfg.provider === p.id ? 'var(--accent-soft)' : 'var(--bg-input)',
                color: cfg.provider === p.id ? '#ffffff' : 'var(--text-secondary)',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all var(--dur-fast) var(--ease-out)',
                boxShadow: cfg.provider === p.id ? '0 0 10px rgba(255,255,255,0.15)' : 'none'
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* 接口地址 */}
      <div>
        <label style={labelStyle}>{t('model.baseUrl')}</label>
        <input
          value={cfg.baseUrl}
          onChange={(e) => {
            setCfg({ ...cfg, baseUrl: e.target.value })
            setSaved(false)
          }}
          placeholder="https://api.example.com/v1"
          style={inputStyle}
        />
      </div>

      {/* API Key */}
      <div>
        <label style={labelStyle}>{t('model.apiKey')}</label>
        <div style={{ position: 'relative' }}>
          <input
            type={showKey ? 'text' : 'password'}
            value={cfg.apiKey}
            onChange={(e) => {
              setCfg({ ...cfg, apiKey: e.target.value })
              setSaved(false)
            }}
            placeholder="sk-..."
            style={{ ...inputStyle, paddingRight: 44 }}
          />
          <button
            onClick={() => setShowKey(!showKey)}
            title={showKey ? t('model.hide') : t('model.show')}
            style={{
              position: 'absolute',
              right: 6,
              top: 5,
              width: 26,
              height: 26,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {showKey ? (
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </>
              ) : (
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* 模型：预设下拉 + 自定义输入 */}
      <div>
        <label style={labelStyle}>{t('model.model')}</label>
        {preset && preset.models.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <select
              value={preset.models.includes(cfg.model) ? cfg.model : ''}
              onChange={(e) => {
                setCfg({ ...cfg, model: e.target.value })
                setSaved(false)
              }}
              style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
            >
              {preset.models.map((m) => (
                <option key={m} value={m} style={{ background: 'var(--bg-card)' }}>
                  {m}
                </option>
              ))}
              {!preset.models.includes(cfg.model) && cfg.model && (
                <option value={cfg.model}>{cfg.model}</option>
              )}
            </select>
            {/* 下拉框选预设，下面这行用于手填预设以外的模型名（加前缀说明，避免看起来像两个重复的模型框） */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                {t('model.orManual')}
              </span>
              <input
                value={cfg.model}
                onChange={(e) => {
                  setCfg({ ...cfg, model: e.target.value })
                  setSaved(false)
                }}
                placeholder={t('model.customPlaceholder')}
                style={{ ...inputStyle, fontSize: 12.5 }}
              />
            </div>
          </div>
        ) : (
          <input
            value={cfg.model}
            onChange={(e) => {
              setCfg({ ...cfg, model: e.target.value })
              setSaved(false)
            }}
            placeholder={t('model.modelPlaceholder')}
            style={inputStyle}
          />
        )}
      </div>

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
        {saved ? t('model.saved') : t('model.save')}
      </button>
    </div>
  )
}
