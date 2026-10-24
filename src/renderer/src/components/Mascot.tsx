import { useEffect, useId, useRef } from 'react'
import { GROKBOT_ORIGINAL as DATA } from '../data/grokbot-data'

interface MascotProps {
  size?: number
  /**
   * 情绪 → 直接对应原版 GrokBot 状态名（POOLS 键），共 39 种。
   * 常用：idle / happy / thinking / listening / working / excited /
   *       surprised / curious / suspicious / confused / angry / sad /
   *       laughing / scared / proud / shy / playful / celebrate / drowsy / sleeping
   */
  mood?: GrokState | 'focus'
  floating?: boolean
  /**
   * circle: 悬浮条上把眼睛直接放在胶囊顶部（无独立球体底），
   * 主窗口等独立场景则渲染完整的蓝色球体身体。
   */
  circle?: boolean
}

// 原版 GrokBot 配色（移植自 LaoA-GrokBot）
const EYE = '#fffdf7'

// 全部 39 种原版状态名（POOLS 键）
type GrokState =
  | 'sleeping' | 'waking' | 'idle' | 'listening' | 'thinking' | 'searching'
  | 'working' | 'excited' | 'surprised' | 'suspicious' | 'angry' | 'drowsy'
  | 'happy' | 'curious' | 'confused' | 'bored' | 'proud' | 'shy' | 'sad'
  | 'laughing' | 'scared' | 'playful' | 'celebrate' | 'orbit' | 'radar'
  | 'progress' | 'spawning' | 'humming' | 'loading' | 'dictating' | 'sending'
  | 'receiving' | 'uploading' | 'writing' | 'notifying' | 'alerting'
  | 'bouncing' | 'dragging' | 'powering-down'

// 供外部随机轮换用的状态列表（导出，便于 FloatBar 等组件使用）
export const ALL_STATES: GrokState[] = [
  'sleeping', 'waking', 'idle', 'listening', 'thinking', 'searching',
  'working', 'excited', 'surprised', 'suspicious', 'angry', 'drowsy',
  'happy', 'curious', 'confused', 'bored', 'proud', 'shy', 'sad',
  'laughing', 'scared', 'playful', 'celebrate', 'orbit', 'radar',
  'progress', 'spawning', 'humming', 'loading', 'dictating', 'sending',
  'receiving', 'uploading', 'writing', 'notifying', 'alerting',
  'bouncing', 'dragging', 'powering-down'
]

export type { GrokState }

// 情绪 → 原版状态名（POOLS 键），保留常用别名映射
const MOOD_TO_STATE: Record<string, GrokState> = {
  idle: 'idle',
  happy: 'happy',
  focus: 'thinking',
  thinking: 'thinking',
  listening: 'listening',
  working: 'working',
  sad: 'sad',
  excited: 'excited',
  sleepy: 'drowsy',
  drowsy: 'drowsy',
  sleeping: 'sleeping',
  surprised: 'surprised',
  curious: 'curious',
  confused: 'confused',
  suspicious: 'suspicious',
  angry: 'angry',
  bored: 'bored',
  laughing: 'laughing',
  scared: 'scared',
  proud: 'proud',
  shy: 'shy',
  playful: 'playful',
  celebrate: 'celebrate'
}

// 原版身体 blob 形 SVG path（球心 114.27, 114.23，半径约 105）
const BODY_PATH =
  'M228.541 114.228C228.541 130.133 225.184 145.994 218.738 160.534C212.674 174.217 203.904 186.669 193.065 196.988C155.933 232.34 99.497 238.596 55.5255 212.24C45.097 205.99 35.6851 198.072 27.7451 188.866C19.1926 178.953 12.3686 167.569 7.65781 155.351C2.60712 142.264 0 128.257 0 114.228C0 98.3219 3.35751 82.4611 9.80315 67.9215C15.8672 54.2382 24.6377 41.7862 35.4767 31.4668C72.6081 -3.88483 129.044 -10.1413 173.016 16.2153C183.444 22.4653 192.856 30.3829 200.796 39.5896C209.349 49.5018 216.173 60.8859 220.883 73.1037C225.934 86.1906 228.541 100.198 228.541 114.228Z'

// 球面几何常量（原版 app.js 硬编码）
const CX = 114.2705
const R = 105

// 眼睛整体上移量：让眼睛在球体/悬浮条里更靠上（更接近可爱比例）
const EYE_LIFT = 20

const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v))
const centroid = (ring: number[][]): number[] =>
  ring.reduce((a, p) => [a[0] + p[0] / ring.length, a[1] + p[1] / ring.length], [0, 0])
const toPath = (ring: number[][]): string =>
  'M' + ring.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join('L') + 'Z'

/**
 * 吉祥物：原版 GrokBot 球面透视动画引擎 + 白色实心眼。
 * 核心：眼睛沿球面移动，转到背面时透视压缩并消失 → 体现三维球体。
 */
export function Mascot({
  size = 40,
  mood = 'idle',
  floating = false,
  circle = false
}: MascotProps): JSX.Element {
  const eye0Ref = useRef<SVGPathElement>(null)
  const eye1Ref = useRef<SVGPathElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const clipId = useId().replace(/:/g, '')
  // 保存最新 mood 供引擎内部轮询（避免 mood 变化导致引擎重建、表情硬切）
  const moodRef = useRef(mood)
  moodRef.current = mood

  useEffect(() => {
    const eyeEls = [eye0Ref.current, eye1Ref.current]
    if (!eyeEls[0] || !eyeEls[1]) return

    // === 状态初始化（复用原版引擎变量） ===
    let stateName = (MOOD_TO_STATE[moodRef.current] ?? (moodRef.current as GrokState)) || 'idle'
    let pool: number[] = DATA.POOLS[stateName] ?? [0]
    let expression = pool[0]
    let current = DATA.EXPRESSIONS[expression].map((r) => r.map((p) => [...p]))
    let target = DATA.EXPRESSIONS[expression]
    let morph = 1
    let velocity = 0
    let last = performance.now()
    let blinkStart = 0
    let gazeY = 0 // 当前垂直视线（上下）
    let turn = 0 // 当前球体水平旋转角（度）
    let targetTurn = 0 // 目标水平旋转角
    let targetGazeY = 0 // 目标垂直视线
    let stateTimer: ReturnType<typeof setTimeout> | null = null
    let raf = 0

    const chooseExpression = (index: number): void => {
      current = current.map((ring, e) =>
        ring.map((p, i) => [
          p[0] + (target[e][i][0] - p[0]) * clamp(morph, 0, 1),
          p[1] + (target[e][i][1] - p[1]) * clamp(morph, 0, 1)
        ])
      )
      target = DATA.EXPRESSIONS[index]
      expression = index
      morph = 0
      velocity = 0
    }

    // 弹簧变形：morph 从 0 → 1，临界阻尼弹簧
    const blinkScale = (now: number): number => {
      if (!blinkStart) return 1
      const t = (now - blinkStart) / 320
      if (t >= 1) {
        blinkStart = 0
        return 1
      }
      return Math.max(t < 0.42 ? 1 - t / 0.42 : (t - 0.42) / 0.58, 0.04)
    }

    const blink = (): void => {
      blinkStart = performance.now()
    }

    // 状态内表情池轮换（按原版 EXPR_CADENCE 节奏）
    const scheduleNext = (): void => {
      if (stateTimer) clearTimeout(stateTimer)
      const cadence = DATA.EXPR_CADENCE[stateName]
      if (cadence && pool.length > 1) {
        const [min, max] = cadence
        stateTimer = setTimeout(() => {
          const choice = pool[Math.floor(Math.random() * pool.length)]
          chooseExpression(choice)
          scheduleNext()
        }, min + Math.random() * (max - min))
      }
    }

    // === 核心渲染循环：球面透视投影（原版 frame()） ===
    const frame = (now: number): void => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now

      // 检测 mood 变化：平滑 morph 到新状态的表情（而非引擎重建硬切）
      const nextState = (MOOD_TO_STATE[moodRef.current] ?? (moodRef.current as GrokState)) || 'idle'
      if (nextState !== stateName) {
        stateName = nextState
        pool = DATA.POOLS[stateName] ?? [0]
        // 切到新状态：选池内第一个表情，走弹簧 morph 平滑过渡
        chooseExpression(pool[0])
        scheduleNext()
      }

      // 弹簧变形积分（临界阻尼弹簧，稍放缓让表情衔接更柔和）
      velocity += (-11 * velocity - 30 * (morph - 1)) * dt
      morph += velocity * dt
      if (!Number.isFinite(morph)) {
        morph = 1
        velocity = 0
      }

      // 视线平滑：turn / gazeY 向目标值缓动（避免瞬间跳变）
      turn += (targetTurn - turn) * Math.min(1, dt * 8)
      gazeY += (targetGazeY - gazeY) * Math.min(1, dt * 8)

      const bs = blinkScale(now)
      const rad = (turn * Math.PI) / 180

      const shown = current.map((ring, e) =>
        ring.map((p, i) => [
          p[0] + (target[e][i][0] - p[0]) * clamp(morph, 0, 1),
          p[1] + (target[e][i][1] - p[1]) * clamp(morph, 0, 1)
        ])
      )

      shown.forEach((ring, i) => {
        const el = eyeEls[i]
        if (!el) return
        // 眼睛整体上移：把整个环的 y 坐标减去 EYE_LIFT
        const lifted = ring.map((p) => [p[0], p[1] - EYE_LIFT])
        const c = centroid(lifted)
        // 球面经度：眼睛在球面上的位置
        const base = Math.asin(clamp((c[0] - CX) / R, -1, 1))
        const longitude = base + rad
        const depth = Math.cos(longitude)
        const perspective = Math.max(depth, 0.02) / Math.max(Math.cos(base), 0.02)
        const x = CX + R * Math.sin(longitude)
        const y = c[1] + gazeY
        el.setAttribute('d', toPath(lifted))
        el.setAttribute(
          'transform',
          `translate(${x} ${y}) scale(${clamp(perspective, 0.02, 2.4)} ${bs}) translate(${-c[0]} ${-c[1]})`
        )
        el.style.opacity = depth > 0.02 ? '1' : '0'
      })

      raf = requestAnimationFrame(frame)
    }

    // === 交互：视线全局跟随鼠标 + 眨眼 ===
    // 鼠标在整个桌面任意位置，眼睛都看向它（主进程推送全局坐标）
    const el = wrapRef.current
    let unsubscribeCursor: (() => void) | null = null

    const handleGlobalCursor = (point: { x: number; y: number }): void => {
      if (!el) return
      const box = el.getBoundingClientRect()
      // 眼睛中心的【屏幕坐标】= 窗口屏幕位置 + 窗口内偏移
      const cx = window.screenX + box.left + box.width / 2
      const cy = window.screenY + box.top + box.height / 2
      // 鼠标相对眼睛中心的偏移向量
      const dx = point.x - cx
      const dy = point.y - cy

      // 感应半径：鼠标在 R 内视线随距离线性增长，R 外饱和到最大转角
      const R = 260
      const dist = Math.hypot(dx, dy)
      const t = Math.min(dist / R, 1) // 0..1

      // 水平：驱动球体旋转角 turn（度），左右 ±30°
      targetTurn = (dx / R) * 30
      // 垂直：驱动 gazeY 平移（上下看），±14
      targetGazeY = (dy / R) * 14
      // 限制范围
      targetTurn = clamp(targetTurn, -30, 30)
      targetGazeY = clamp(targetGazeY, -14, 14)
      // t 用于整体强度（远处轻微饱和，但保持方向正确）
      targetTurn *= 0.7 + 0.3 * t
      targetGazeY *= 0.7 + 0.3 * t
    }

    const onPointerDown = (): void => {
      blink()
    }

    // 订阅主进程推送的全局鼠标坐标
    if (window.api?.onGlobalCursor) {
      unsubscribeCursor = window.api.onGlobalCursor(handleGlobalCursor)
    }
    window.addEventListener('pointerdown', onPointerDown)

    // 随机眨眼（按原版 BLINK 节奏）
    let blinkTimer: ReturnType<typeof setTimeout>
    const blinkLoop = (): void => {
      const range = DATA.BLINK[stateName]
      if (range) {
        blinkTimer = setTimeout(() => {
          blink()
          blinkLoop()
        }, range[0] + Math.random() * (range[1] - range[0]))
      }
    }
    blinkLoop()

    // 启动
    scheduleNext()
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      if (stateTimer) clearTimeout(stateTimer)
      if (blinkTimer) clearTimeout(blinkTimer)
      if (unsubscribeCursor) unsubscribeCursor()
      window.removeEventListener('pointerdown', onPointerDown)
    }
  }, [])

  // viewBox：原版 -28 -28 285 285（含眼眶外溢空间）
  const viewBox = '-28 -28 285 285'

  return (
    <div
      ref={wrapRef}
      className={floating ? 'animate-float' : ''}
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        style={{ overflow: 'visible', cursor: 'pointer' }}
      >
        <defs>
          <clipPath id={clipId}>
            <path d={BODY_PATH} />
          </clipPath>
        </defs>

        {/* 身体（纯黑球体，无高光）。悬浮条上 circle=false 时不渲染，只留眼睛 */}
        {circle && (
          <path className="mascot-body" d={BODY_PATH} fill="#000000" />
        )}

        {/* 眼睛（白色实心多边形，裁剪在球体内，球面透视驱动） */}
        <g clipPath={circle ? `url(#${clipId})` : undefined}>
          <path ref={eye0Ref} className="mascot-eye" fill={EYE} />
          <path ref={eye1Ref} className="mascot-eye" fill={EYE} />
        </g>
      </svg>
    </div>
  )
}
