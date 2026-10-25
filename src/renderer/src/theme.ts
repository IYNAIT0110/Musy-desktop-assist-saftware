import { useSyncExternalStore } from 'react'

export type ThemeId = 'graphite' | 'ocean' | 'forest' | 'plum' | 'apricot' | 'rose' | 'indigo' | 'teal' | 'clay' | 'latte' | 'ice' | 'olive'
export type MaterialId = 'smooth' | 'glass' | 'kraft' | 'plush' | 'linen' | 'ceramic'
export interface Appearance { theme: ThemeId; material: MaterialId; strength: number }

type Theme = { id: ThemeId; swatch: string; surface: string; variables: Record<string, string> }

const STORAGE_KEY = 'musy.appearance.theme'
const MATERIAL_KEY = 'musy.appearance.material'
const STRENGTH_KEY = 'musy.appearance.strength'
const CHANNEL = 'musy-appearance'

export const MATERIALS: { id: MaterialId }[] = [
  { id: 'smooth' }, { id: 'glass' }, { id: 'kraft' }, { id: 'plush' }, { id: 'linen' }, { id: 'ceramic' }
]

function mix(first: string, second: string, ratio: number): string {
  const channels = [1, 3, 5].map(at => Math.round(parseInt(first.slice(at, at + 2), 16) * (1 - ratio) + parseInt(second.slice(at, at + 2), 16) * ratio).toString(16).padStart(2, '0'))
  return '#' + channels.join('')
}
function rgba(color: string, alpha: number): string {
  return `rgba(${[1, 3, 5].map(at => parseInt(color.slice(at, at + 2), 16)).join(',')},${alpha.toFixed(3)})`
}
function tinted(id: ThemeId, base: string, tint: string, mascot: string): Theme {
  const card = mix(base, '#ffffff', .045)
  const accent = mix(tint, '#ffffff', .64)
  return { id, swatch: tint, surface: card, variables: {
    '--bg-panel': base, '--bg-card': card, '--bg-hover': mix(base, '#ffffff', .12), '--bg-input': mix(base, '#ffffff', .065),
    '--accent': accent, '--accent-ink': base, '--accent-glow': mix(tint, '#ffffff', .8), '--accent-soft': rgba(tint, .16),
    '--accent-tint': tint, '--accent-tint-soft': rgba(tint, .18),
    '--text-primary': '#f7f4f1', '--text-secondary': mix(tint, '#ffffff', .45), '--text-muted': mix(tint, base, .22), '--text-kbd': mix(tint, '#ffffff', .7),
    '--border': mix(base, tint, .20), '--border-hover': mix(base, tint, .34), '--border-accent': accent,
    '--glass-bar': rgba(card, .80), '--bubble-bg': mix(base, tint, .13),
    '--mascot-color': mascot, '--mascot-glow': rgba(mascot, .72), '--mascot-eye': '#fffdf7'
  } }
}

export const THEMES: Theme[] = [
  {
    id: 'graphite', swatch: '#e5665a', surface: '#151518',
    variables: {
      '--bg-panel': '#0d0d0f', '--bg-card': '#151518', '--bg-hover': '#1f1f23', '--bg-input': '#151518',
      '--accent': '#f5f5f7', '--accent-ink': '#0d0d0f', '--accent-glow': '#ffffff', '--accent-soft': 'rgba(255,255,255,.1)',
      '--accent-tint': '#e5665a', '--accent-tint-soft': 'rgba(229,102,90,.16)',
      '--text-primary': '#f5f5f7', '--text-secondary': '#a6a6ad', '--text-muted': '#85858e', '--text-kbd': '#cfcfd6',
      '--border': '#26262b', '--border-hover': '#35353c', '--border-accent': '#f5f5f7',
      '--glass-bar': 'rgba(30,30,34,.72)', '--bubble-bg': '#222226',
      '--mascot-color': '#050505', '--mascot-glow': 'rgba(0,0,0,.75)', '--mascot-eye': '#fffdf7'
    }
  },
  {
    id: 'ocean', swatch: '#76c7e5', surface: '#142532',
    variables: {
      '--bg-panel': '#0b1922', '--bg-card': '#142532', '--bg-hover': '#203b4b', '--bg-input': '#172b39',
      '--accent': '#c5efff', '--accent-ink': '#0b1922', '--accent-glow': '#d8f5ff', '--accent-soft': 'rgba(118,199,229,.17)',
      '--accent-tint': '#76c7e5', '--accent-tint-soft': 'rgba(118,199,229,.18)',
      '--text-primary': '#f0f8fb', '--text-secondary': '#b4ccd7', '--text-muted': '#91acba', '--text-kbd': '#d6e8ef',
      '--border': '#2a4553', '--border-hover': '#3b5e6f', '--border-accent': '#c5efff',
      '--glass-bar': 'rgba(17,42,56,.78)', '--bubble-bg': '#1c3848',
      '--mascot-color': '#28799a', '--mascot-glow': 'rgba(40,121,154,.72)', '--mascot-eye': '#f8ffff'
    }
  },
  {
    id: 'forest', swatch: '#a5d5aa', surface: '#1d3029',
    variables: {
      '--bg-panel': '#101e19', '--bg-card': '#1d3029', '--bg-hover': '#2b4539', '--bg-input': '#20362c',
      '--accent': '#d8f1d8', '--accent-ink': '#101e19', '--accent-glow': '#ebfae8', '--accent-soft': 'rgba(165,213,170,.16)',
      '--accent-tint': '#a5d5aa', '--accent-tint-soft': 'rgba(165,213,170,.18)',
      '--text-primary': '#f1f7ef', '--text-secondary': '#bdd1c0', '--text-muted': '#98b29d', '--text-kbd': '#d8e5d6',
      '--border': '#334c3d', '--border-hover': '#45664f', '--border-accent': '#d8f1d8',
      '--glass-bar': 'rgba(29,53,40,.78)', '--bubble-bg': '#264334',
      '--mascot-color': '#407f5a', '--mascot-glow': 'rgba(64,127,90,.72)', '--mascot-eye': '#fffdf1'
    }
  },
  {
    id: 'plum', swatch: '#d8a9df', surface: '#2a2035',
    variables: {
      '--bg-panel': '#1a1421', '--bg-card': '#2a2035', '--bg-hover': '#3d304a', '--bg-input': '#30253d',
      '--accent': '#f4dffa', '--accent-ink': '#1a1421', '--accent-glow': '#fbeaff', '--accent-soft': 'rgba(216,169,223,.16)',
      '--accent-tint': '#d8a9df', '--accent-tint-soft': 'rgba(216,169,223,.18)',
      '--text-primary': '#f8f1fa', '--text-secondary': '#d4c2da', '--text-muted': '#ad98b7', '--text-kbd': '#e8dbea',
      '--border': '#45364e', '--border-hover': '#604969', '--border-accent': '#f4dffa',
      '--glass-bar': 'rgba(48,35,61,.78)', '--bubble-bg': '#392a47',
      '--mascot-color': '#80589a', '--mascot-glow': 'rgba(128,88,154,.7)', '--mascot-eye': '#fff8ff'
    }
  },
  tinted('apricot', '#251d17', '#ecc09a', '#ac7954'),
  tinted('rose', '#261b22', '#e7b0c4', '#a56583'),
  tinted('indigo', '#171b2c', '#aab9f0', '#5b6bad'),
  tinted('teal', '#122724', '#8ad4c9', '#387f77'),
  tinted('clay', '#2b1b18', '#dfa58e', '#aa6a52'),
  tinted('latte', '#211c18', '#cfb69a', '#8b7055'),
  tinted('ice', '#19232b', '#b6d3e5', '#658ca7'),
  tinted('olive', '#22251a', '#c6d39e', '#778554')
]

const validTheme = (value: string | null): ThemeId =>
  THEMES.some((theme) => theme.id === value) ? value as ThemeId : 'graphite'

const validMaterial = (value: unknown): MaterialId => MATERIALS.some(item => item.id === value) ? value as MaterialId : 'smooth'
const validStrength = (value: unknown): number => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 60
function stored(key: string): string | null { try { return localStorage.getItem(key) } catch { return null } }
function savedAppearance(): Appearance {
  const rawStrength = stored(STRENGTH_KEY)
  return { theme: validTheme(stored(STORAGE_KEY)), material: validMaterial(stored(MATERIAL_KEY)), strength: validStrength(rawStrength === null || !rawStrength.trim() ? undefined : Number(rawStrength)) }
}
let current: Appearance = savedAppearance()
const listeners = new Set<() => void>()
let channel: BroadcastChannel | null = null
let initialized = false

function applyAppearance(next: Appearance): void {
  const changed = next.theme !== current.theme || next.material !== current.material || next.strength !== current.strength
  if (changed) current = next
  const theme = THEMES.find((item) => item.id === next.theme)!
  for (const [key, value] of Object.entries(theme.variables)) {
    document.documentElement.style.setProperty(key, value)
  }
  document.documentElement.style.setProperty('--material-level', String(next.strength / 100))
  document.documentElement.style.setProperty('--material-blur', `${Math.round(next.strength * .32)}px`)
  document.documentElement.style.setProperty('--capsule-filter', next.material === 'smooth' ? 'blur(24px) saturate(150%)' : 'none')
  if (next.material === 'glass') {
    for (const key of ['--bg-panel', '--bg-card', '--bg-input']) document.documentElement.style.setProperty(key, rgba(theme.variables[key], 1 - next.strength * .003))
    document.documentElement.style.setProperty('--glass-bar', rgba(theme.variables['--bg-card'], 1 - next.strength * .004))
  } else if (next.material !== 'smooth') document.documentElement.style.setProperty('--glass-bar', theme.variables['--bg-card'])
  document.documentElement.dataset.theme = next.theme
  document.documentElement.dataset.material = next.material
  if (changed) listeners.forEach((listener) => listener())
}

export function initTheme(): void {
  if (initialized) return
  initialized = true
  applyAppearance(current)
  window.addEventListener('storage', (event) => {
    if (event.key === null || [STORAGE_KEY, MATERIAL_KEY, STRENGTH_KEY].includes(event.key)) applyAppearance(savedAppearance())
  })
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(CHANNEL)
    channel.onmessage = (event: MessageEvent<unknown>) => {
      if (typeof event.data === 'string') { applyAppearance({ ...current, theme: validTheme(event.data) }); return }
      const value = event.data as Partial<Appearance> | null
      if (value && typeof value === 'object' && typeof value.theme === 'string') {
        applyAppearance({ theme: validTheme(value.theme), material: validMaterial(value.material), strength: validStrength(value.strength) })
      }
    }
  }
}

function saveAppearance(next: Appearance): void {
  applyAppearance(next)
  try {
    localStorage.setItem(STORAGE_KEY, next.theme)
    localStorage.setItem(MATERIAL_KEY, next.material)
    localStorage.setItem(STRENGTH_KEY, String(next.strength))
  } catch { /* Current session and other open windows still change. */ }
  channel?.postMessage(next)
}

export function setTheme(id: ThemeId): void { saveAppearance({ ...current, theme: validTheme(id) }) }
export function setMaterial(id: MaterialId): void { saveAppearance({ ...current, material: validMaterial(id) }) }
export function setMaterialStrength(strength: number): void { saveAppearance({ ...current, strength: validStrength(strength) }) }
export function resetAppearance(): void { saveAppearance({ theme: 'graphite', material: 'smooth', strength: 60 }) }
function subscribe(listener: () => void): () => void { listeners.add(listener); return () => listeners.delete(listener) }
export function useTheme(): ThemeId { return useSyncExternalStore(subscribe, () => current.theme) }
export function useAppearance(): Appearance { return useSyncExternalStore(subscribe, () => current) }
