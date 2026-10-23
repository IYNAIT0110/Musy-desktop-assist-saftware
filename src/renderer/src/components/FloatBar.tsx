import { useState } from 'react'
import { Mascot } from './Mascot'

// 悬浮条图标（用简洁 SVG 代替 emoji）
const icons = {
  links: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  prompts: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  shortcuts: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="4" />
      <line x1="6" y1="10" x2="6" y2="14" />
      <line x1="10" y1="10" x2="10" y2="14" />
      <line x1="14" y1="10" x2="14" y2="14" />
      <line x1="18" y1="10" x2="18" y2="14" />
    </svg>
  ),
  polish: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  ),
  models: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.27 6.96 12 12.01l8.73-5.05" />
      <path d="M12 22.08V12" />
    </svg>
  )
}

const items = [
  { key: 'links', label: '链接', icon: icons.links },
  { key: 'prompts', label: '提示词', icon: icons.prompts },
  { key: 'shortcuts', label: '快捷键', icon: icons.shortcuts },
  { key: 'polish', label: '润色', icon: icons.polish },
  { key: 'models', label: '模型库', icon: icons.models }
]

export function FloatBar(): JSX.Element {
  const [active, setActive] = useState<string | null>(null)

  const openMain = (key: string): void => {
    setActive(key)
    window.api.openMainWindow()
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: '10px 0',
        borderRadius: 'var(--radius-xl)',
        background: 'rgba(26, 20, 16, 0.72)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(51, 37, 26, 0.8)',
        WebkitAppRegion: 'drag'
      }}
    >
      {/* 顶部吉祥物 */}
      <div style={{ WebkitAppRegion: 'no-drag', padding: '4px 0' }}>
        <Mascot size={30} mood="happy" floating />
      </div>

      <div
        style={{
          width: '70%',
          height: 1,
          background: 'rgba(51,37,26,0.6)',
          margin: '2px 0'
        }}
      />

      {/* 功能图标入口 */}
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => openMain(item.key)}
          title={item.label}
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: active === item.key ? 'var(--accent-soft)' : 'transparent',
            color: active === item.key ? 'var(--accent-glow)' : 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            WebkitAppRegion: 'no-drag',
            transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: active === item.key ? '0 0 12px rgba(255,107,53,0.25)' : 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-hover)'
            e.currentTarget.style.transform = 'scale(1.08)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background =
              active === item.key ? 'var(--accent-soft)' : 'transparent'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          {item.icon}
        </button>
      ))}
    </div>
  )
}
