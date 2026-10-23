import { useState } from 'react'
import { Mascot } from './Mascot'

type ModuleKey = 'links' | 'prompts' | 'shortcuts' | 'polish' | 'models'

const navItems: { key: ModuleKey; label: string }[] = [
  { key: 'links', label: '链接收藏' },
  { key: 'prompts', label: '提示词' },
  { key: 'shortcuts', label: '快捷键' },
  { key: 'polish', label: '润色' },
  { key: 'models', label: '模型库' }
]

// 空状态文案（可爱情绪）
const emptyText: Record<ModuleKey, string> = {
  links: '空空如也～要不要记一条常用链接？',
  prompts: '还没有提示词哦，收藏第一条灵感吧！',
  shortcuts: '这里会显示快捷键指引，敬请期待～',
  polish: '选中文字，我来帮你润色得更专业 ✨',
  models: '把你的模型和素材都装进来吧！'
}

export function MainWindow(): JSX.Element {
  const [active, setActive] = useState<ModuleKey>('links')
  const [query, setQuery] = useState('')

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        overflow: 'hidden'
      }}
    >
      {/* 顶部栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
          WebkitAppRegion: 'drag'
        }}
      >
        <Mascot size={36} mood="happy" />
        <div style={{ WebkitAppRegion: 'no-drag' }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--text-primary)',
              lineHeight: 1.2
            }}
          >
            今天也辛苦啦！
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.2,
              marginTop: 2
            }}
          >
            我帮你搜链接、提示词、命令和模型
          </div>
        </div>
      </div>

      {/* 搜索框 */}
      <div style={{ padding: '0 18px 12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 16px',
            height: 44,
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            transition: 'border-color 0.2s'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索…"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontFamily: 'var(--font-sans)'
            }}
          />
          <kbd
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-kbd)',
              background: 'var(--bg-hover)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-hover)'
            }}
          >
            ⌘K
          </kbd>
        </div>
      </div>

      {/* 主体：左侧导航 + 右侧内容 */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 左侧导航 */}
        <nav
          style={{
            width: 110,
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            borderRight: '1px solid var(--border)'
          }}
        >
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              style={{
                height: 36,
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: active === item.key ? 'var(--accent-soft)' : 'transparent',
                color: active === item.key ? 'var(--accent-glow)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 13,
                fontFamily: 'var(--font-sans)',
                textAlign: 'left',
                padding: '0 14px',
                transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: active === item.key ? '0 0 12px rgba(255,107,53,0.2)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (active !== item.key) e.currentTarget.style.background = 'var(--bg-hover)'
              }}
              onMouseLeave={(e) => {
                if (active !== item.key) e.currentTarget.style.background = 'transparent'
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* 右侧内容区 */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
          <div
            className="animate-bounce-in"
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14
            }}
          >
            <Mascot size={64} mood={query ? 'focus' : 'happy'} floating />
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center' }}>
              {query ? '正在找相关的内容…' : emptyText[active]}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
