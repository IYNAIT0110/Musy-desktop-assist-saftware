const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')
const root = path.resolve(__dirname, '..')
function load(relative, mocks = {}, cache = new Map()) {
  const file = path.resolve(root, relative)
  if (cache.has(file)) return cache.get(file).exports
  const value = new Module(file, module); value.filename = file; value.paths = Module._nodeModulePaths(path.dirname(file)); cache.set(file, value)
  const original = value.require.bind(value)
  value.require = name => mocks[name] ?? (name.startsWith('.') ? load(path.relative(root, path.resolve(path.dirname(file), name + '.ts')), mocks, cache) : original(name))
  value._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file)
  return value.exports
}
const catalog = load('src/shared/uiMessages.ts')
const { translateMessage: tx } = catalog
function strings(file) {
  const source = ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'), ts.ScriptTarget.Latest, true)
  const result = []
  function visit(node) {
    if (ts.isStringLiteral(node) && /\p{Script=Han}/u.test(node.text)) result.push(node.text)
    ts.forEachChild(node, visit)
  }
  visit(source)
  return result
}
test('关键界面、气泡各状态和所有内置快捷键均有英日翻译', () => {
  for (const [zh, en, ja] of catalog.UI_MESSAGES) {
    assert.ok(zh && en && ja, JSON.stringify([zh,en,ja]))
    const parameters = value => [...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort()
    assert.deepEqual(parameters(en), parameters(zh), zh)
    assert.deepEqual(parameters(ja), parameters(zh), zh)
  }
  const names = new Set(catalog.UI_MESSAGES.map(row => row[0]))
  for (const file of ['src/renderer/src/data/shortcuts.ts', 'src/renderer/src/components/TreasurePanel.tsx', 'src/renderer/src/components/AssetPreview.tsx', 'src/renderer/src/components/BallCollector.tsx', 'src/renderer/src/components/InteractionMotion.tsx', 'src/renderer/src/treasureTransfer.ts']) {
    for (const source of strings(file)) {
      if (source === ' · 已取消') continue // Part of the complete result template below.
      assert.ok(names.has(source), `${file}: missing ${source}`)
    }
  }
  assert.equal(tx('松手，交给我收好', 'en'), 'Drop it, I’ll keep it')
  assert.equal(tx('文件、文件夹或图片', 'ja'), 'ファイル・フォルダー・画像')
  assert.equal(tx('请选择', 'en'), 'Choose an option')
})
test('气泡数量、取消后缀和嵌套错误可即时重新翻译，用户文件名保持原文', () => {
  const result = '新增 3 · 已有 2 · 失败 0'
  assert.equal(tx(result,'en'), 'Added 3 · 2 dup · 0 failed')
  assert.equal(tx(result + ' · 已取消','en'), 'Added 3 · 2 dup · 0 failed · Canceled')
  assert.equal(tx(tx(result,'en'),'ja'), '追加 3 · 登録済み 2 · 失敗 0')
  assert.equal(tx('导入未完成：已有导入任务，请等待或取消', 'en'), 'Import incomplete: An import is running; wait or cancel it')
  assert.equal(tx("Error invoking remote method 'treasure:request': Error: 素材不存在", 'en'), 'Asset not found')
  assert.equal(tx('重新定位：{name}', 'en', {name:'中文建筑方案.png'}), 'Locate file: 中文建筑方案.png')
  assert.equal(tx('用户原创备注', 'en'), '用户原创备注')
  assert.equal(tx('Musy百宝匣', 'en'), 'Musy百宝匣')
})
function fixture(t, values = {}) {
  const old = { localStorage: global.localStorage, document: global.document, window: global.window, BroadcastChannel: global.BroadcastChannel }
  const storage = new Map(Object.entries(values)), events = new Map(), channels = [], snapshots = [], subscribers = new Set()
  global.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key,value) => storage.set(key,value), removeItem: key => storage.delete(key) }
  global.document = { documentElement: {} }
  global.window = { addEventListener: (event,handler) => events.set(event,handler) }
  global.BroadcastChannel = class { constructor(){channels.push(this)} postMessage(value){this.sent=structuredClone(value)} }
  const api = load('src/renderer/src/i18n.ts', { react: { useSyncExternalStore(subscribe, snapshot) { subscribe(() => snapshots.push(snapshot())); snapshots.push(snapshot()); subscribers.add(snapshot) } } })
  t.after(() => Object.assign(global, old))
  return { api, storage, events, channels, snapshots, root: global.document.documentElement }
}
test('语言切换同步小球和独立预览窗，自定义包更改同一语言也更新订阅', t => {
  const f=fixture(t);f.api.initLanguage();f.api.initLanguage();f.api.useLang()
  assert.equal(f.channels.length,1)
  f.api.setLang('en');assert.equal(f.api.tx('查看'),'View');assert.equal(f.root.lang,'en');assert.equal(f.channels[0].sent.lang,'en')
  const revision = f.snapshots.at(-1)
  assert.equal(f.api.loadCustomLang(JSON.stringify({'查看':'Inspect'})),true)
  assert.ok(f.snapshots.at(-1)>revision);assert.equal(f.api.tx('查看'),'Inspect')
  f.channels[0].onmessage({data:{lang:'ja',custom:{}}});assert.equal(f.api.tx('查看'),'表示');assert.equal(f.api.t('nav.links'),'ポータル')
  f.storage.set('musy.lang','en');f.storage.delete('musy.lang.custom');f.events.get('storage')({key:'musy.lang'})
  assert.equal(f.api.tx('查看'),'View');assert.equal(f.root.lang,'en')
})
test('语言包损坏安全回退；存储不可写不阻止当次切换', t => {
  const f=fixture(t, {'musy.lang':'bad','musy.lang.custom':'["bad"]','musy.data':'keep'});f.api.initLanguage()
  assert.equal(f.api.getLang(),'zh');assert.equal(f.api.loadCustomLang('{"x":42}'),false)
  global.localStorage.setItem=()=>{throw Error('disk full')}
  assert.doesNotThrow(()=>f.api.setLang('ja'));assert.equal(f.api.tx('查看'),'表示')
  assert.equal(f.api.loadCustomLang('{"查看":"Custom"}'),true);assert.equal(f.api.tx('查看'),'Custom')
  f.api.clearCustomLang();assert.equal(f.api.tx('查看'),'表示');assert.equal(f.storage.get('musy.data'),'keep')
})
