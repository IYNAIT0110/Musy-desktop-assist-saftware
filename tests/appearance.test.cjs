const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')

function fixture(t, values = {}) {
  const old = { localStorage: global.localStorage, document: global.document, window: global.window, BroadcastChannel: global.BroadcastChannel }
  const storage = new Map(Object.entries(values)); const styles = new Map(); const events = new Map(); const channels = []
  global.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }
  global.document = { documentElement: { dataset: {}, style: { setProperty: (key, value) => styles.set(key, value) } } }
  global.window = { addEventListener: (event, handler) => events.set(event, handler) }
  global.BroadcastChannel = class { constructor() { channels.push(this) } postMessage(value) { this.sent = structuredClone(value) } }
  const source = path.resolve(__dirname, '../src/renderer/src/theme.ts')
  const loaded = new Module(source, module); loaded.filename = source; loaded.paths = Module._nodeModulePaths(path.dirname(source))
  const originalRequire = loaded.require.bind(loaded)
  loaded.require = name => name === 'react' ? { useSyncExternalStore: (_subscribe, snapshot) => snapshot() } : originalRequire(name)
  loaded._compile(ts.transpileModule(fs.readFileSync(source, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, source)
  t.after(() => Object.assign(global, old))
  return { api: loaded.exports, storage, styles, events, channels, root: global.document.documentElement }
}
function luminance(hex) {
  const rgb = [1, 3, 5].map(at => parseInt(hex.slice(at, at + 2), 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722
}
function contrast(a, b) { const l = [luminance(a), luminance(b)].sort((x, y) => y - x); return (l[0] + .05) / (l[1] + .05) }

test('原配色偏好兼容，12 套配色与 6 种材质，主要文字保持可读对比', t => {
  const f = fixture(t, { 'musy.appearance.theme': 'plum' }); f.api.initTheme()
  assert.deepEqual(f.api.useAppearance(), { theme: 'plum', material: 'smooth', strength: 60 })
  assert.equal(f.api.THEMES.length, 12); assert.equal(new Set(f.api.THEMES.map(theme => theme.id)).size, 12)
  assert.equal(f.api.MATERIALS.length, 6)
  for (const theme of f.api.THEMES) {
    for (const token of ['--text-primary', '--text-secondary']) assert.ok(contrast(theme.variables[token], theme.variables['--bg-card']) >= 4.5, theme.id + ' ' + token)
  }
})
test('配色和质感独立保存，透明材质退出后恢复基色，强度随配色保留', t => {
  const f = fixture(t); f.api.initTheme()
  f.api.setTheme('latte'); f.api.setMaterial('glass'); f.api.setMaterialStrength(35)
  assert.ok(f.styles.get('--bg-panel').startsWith('rgba('))
  f.api.setMaterial('kraft')
  assert.equal(f.styles.get('--bg-panel'), f.api.THEMES.find(theme => theme.id === 'latte').variables['--bg-panel'])
  f.api.setTheme('rose')
  assert.deepEqual(f.api.useAppearance(), { theme: 'rose', material: 'kraft', strength: 35 })
  assert.equal(f.storage.get('musy.appearance.material'), 'kraft')
  assert.equal(f.storage.get('musy.appearance.theme'), 'rose')
  assert.equal(f.storage.get('musy.appearance.strength'), '35')
  assert.deepEqual(f.channels[0].sent, f.api.useAppearance())
})
test('跨窗口同步完整外观、兼容旧主题消息，并限制异常强度', t => {
  const f = fixture(t); f.api.initTheme(); f.api.initTheme()
  assert.equal(f.channels.length, 1)
  f.channels[0].onmessage({ data: { theme: 'teal', material: 'plush', strength: 999 } })
  assert.deepEqual(f.api.useAppearance(), { theme: 'teal', material: 'plush', strength: 100 })
  f.channels[0].onmessage({ data: 'forest' })
  assert.deepEqual(f.api.useAppearance(), { theme: 'forest', material: 'plush', strength: 100 })
  assert.equal(f.root.dataset.material, 'plush')
  f.storage.set('musy.appearance.theme', 'ice'); f.storage.set('musy.appearance.material', 'linen'); f.storage.set('musy.appearance.strength', '50')
  f.events.get('storage')({ key: 'musy.appearance.material' })
  assert.deepEqual(f.api.useAppearance(), { theme: 'ice', material: 'linen', strength: 50 })
})
test('损坏偏好安全回退，保存失败不阻止当次切换，重置只影响外观', t => {
  const f = fixture(t, { 'musy.appearance.theme': 'broken', 'musy.appearance.material': 'unknown', 'musy.appearance.strength': 'invalid', 'musy.data': 'keep' })
  f.api.initTheme()
  assert.deepEqual(f.api.useAppearance(), { theme: 'graphite', material: 'smooth', strength: 60 })
  global.localStorage.setItem = () => { throw new Error('storage unavailable') }
  assert.doesNotThrow(() => f.api.setMaterial('ceramic'))
  assert.equal(f.api.useAppearance().material, 'ceramic')
  f.api.resetAppearance()
  assert.deepEqual(f.api.useAppearance(), { theme: 'graphite', material: 'smooth', strength: 60 })
  assert.equal(f.storage.get('musy.data'), 'keep')
})
