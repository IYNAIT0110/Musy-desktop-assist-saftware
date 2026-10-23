import type { CSSProperties } from 'react'

interface MascotProps {
  size?: number
  mood?: 'happy' | 'focus' | 'sad' | 'excited'
  floating?: boolean
}

// 可爱吉祥物：圆脸小人，随情绪变化表情
export function Mascot({
  size = 34,
  mood = 'happy',
  floating = false
}: MascotProps): JSX.Element {
  const eyeStyle: CSSProperties = {
    width: size * 0.18,
    height: size * 0.18,
    background: '#ffe8db',
    borderRadius: '50%'
  }

  const mouthMap: Record<string, string> = {
    happy: `M ${size * 0.35} ${size * 0.62} Q ${size * 0.5} ${size * 0.72} ${size * 0.65} ${size * 0.62}`,
    focus: `M ${size * 0.4} ${size * 0.64} L ${size * 0.6} ${size * 0.64}`,
    sad: `M ${size * 0.35} ${size * 0.68} Q ${size * 0.5} ${size * 0.58} ${size * 0.65} ${size * 0.68}`,
    excited: `M ${size * 0.32} ${size * 0.6} Q ${size * 0.5} ${size * 0.78} ${size * 0.68} ${size * 0.6}`
  }

  return (
    <div
      className={floating ? 'animate-float' : ''}
      style={{
        width: size,
        height: size,
        position: 'relative',
        flexShrink: 0
      }}
    >
      {/* 圆脸 */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: '#2e1f14',
          border: '1px solid #40291a',
          position: 'relative'
        }}
      >
        {/* 左眼 */}
        <div
          style={{
            ...eyeStyle,
            position: 'absolute',
            left: size * 0.22,
            top: size * 0.32
          }}
        />
        {/* 右眼 */}
        <div
          style={{
            ...eyeStyle,
            position: 'absolute',
            right: size * 0.22,
            top: size * 0.32
          }}
        />
        {/* 嘴巴 */}
        <svg
          width={size}
          height={size}
          style={{ position: 'absolute', inset: 0 }}
          viewBox={`0 0 ${size} ${size}`}
        >
          <path
            d={mouthMap[mood]}
            stroke={mood === 'excited' ? '#ff6b35' : '#ff8a3d'}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
        {/* 腮红 */}
        <div
          style={{
            width: size * 0.14,
            height: size * 0.08,
            borderRadius: '50%',
            background: 'rgba(255,107,53,0.35)',
            position: 'absolute',
            left: size * 0.1,
            top: size * 0.55
          }}
        />
        <div
          style={{
            width: size * 0.14,
            height: size * 0.08,
            borderRadius: '50%',
            background: 'rgba(255,107,53,0.35)',
            position: 'absolute',
            right: size * 0.1,
            top: size * 0.55
          }}
        />
      </div>
    </div>
  )
}
