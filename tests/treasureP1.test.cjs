const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const { readFileSync } = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const Module = require('node:module')
const { EventEmitter } = require('node:events')
const ts = require('typescript')

function load(relative, overrides = {}) {
  const source = path.resolve(__dirname, relative)
  const loaded = new Module(source, module); loaded.filename = source; loaded.paths = Module._nodeModulePaths(path.dirname(source))
  const original = loaded.require.bind(loaded)
  loaded.require = name => overrides[name] ?? original(name)
  loaded._compile(ts.transpileModule(readFileSync(source, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, source)
  return loaded.exports
}
const { TreasureStore } = load('../src/main/treasureStore.ts')
const { resolveDragFiles } = load('../src/main/treasureReuse.ts')
async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'musy-p1-test-'))
  t.after(async () => {
    assert.equal(path.dirname(path.resolve(root)).toLowerCase(), path.resolve(os.tmpdir()).toLowerCase())
    assert.ok(path.basename(root).startsWith('musy-p1-test-'))
    await fs.rm(root, { recursive: true, force: true })
  })
  const originals = path.join(root, '项目 空格')
  await fs.mkdir(originals)
  await fs.writeFile(path.join(originals, '图一.png'), 'image-1')
  await fs.writeFile(path.join(originals, '图二.png'), 'image-2')
  await fs.writeFile(path.join(originals, '模型.3dm'), 'model')
  const store = new TreasureStore(path.join(root, '库')); await store.load(true)
  await store.startImport([originals]); await store.waitForImport()
  return { root, store, items: (await store.query({})).items }
}
test('拖出按条目解析真实文件、去重，缺失和回收素材整批拦截', async t => {
  const f = await fixture(t)
  const image = f.items.find(item => item.ext === 'png'); const model = f.items.find(item => item.ext === '3dm')
  assert.deepEqual(await resolveDragFiles(f.store, [image.id, image.id, model.id]), [image.absolutePath, model.absolutePath])
  assert.equal(await fs.readFile(image.absolutePath, 'utf8'), 'image-' + (image.name.includes('一') ? 1 : 2))
  await f.store.remove([image.id])
  await assert.rejects(() => resolveDragFiles(f.store, [model.id, image.id]), /恢复/)
  await f.store.remove([image.id], true)
  await fs.unlink(model.absolutePath)
  await assert.rejects(() => resolveDragFiles(f.store, [image.id, model.id]), /缺失/)
  await assert.rejects(() => resolveDragFiles(f.store, []), /1–60/)
})
test('独立预览会话绑定原资料库、复用窗口、置顶、关闭与比较范围校验', async t => {
  const f = await fixture(t)
  const windows = []
  class FakeWindow extends EventEmitter {
    constructor(options) {
      super(); this.options = options; this.dead = false; this.top = false
      this.webContents = new EventEmitter(); this.webContents.id = windows.length + 500
      this.webContents.send = channel => { this.sent = channel }; this.webContents.setWindowOpenHandler = () => {}
      windows.push(this)
    }
    isDestroyed() { return this.dead }
    isMinimized() { return false }
    setAlwaysOnTop(top) { this.top = top }
    async loadFile() {}
    async loadURL() {}
    show() { this.shown = true }
    focus() {}
    close() { this.dead = true; this.emit('closed') }
    destroy() { this.close() }
  }
  const { createTreasurePreviewWindows } = load('../src/main/treasurePreviewWindows.ts', { electron: {
    app: { isPackaged: true }, BrowserWindow: FakeWindow,
    screen: { getPrimaryDisplay: () => ({ workArea: { x: 0, y: 0, width: 1280, height: 800 } }) }
  } })
  const previews = createTreasurePreviewWindows()
  await previews.open(f.store, f.items.map(item => item.id), 'single', 1, null)
  const sender = windows[0].webContents.id
  assert.equal(previews.store(sender), f.store)
  const nextStore = new TreasureStore(path.join(f.root, '另一个库')); await nextStore.load(true)
  assert.notEqual(previews.store(sender), nextStore)
  assert.equal(previews.session(sender).index, 1)
  const copy = previews.session(sender); copy.ids.length = 0
  assert.equal(previews.session(sender).ids.length, 3)
  assert.equal(previews.control(sender, 'pin'), false); assert.equal(windows[0].top, false)
  const images = f.items.filter(item => item.kind === 'image').map(item => item.id)
  await previews.open(f.store, images, 'compare', 0, null)
  assert.equal(windows.length, 1); assert.equal(previews.session(sender).mode, 'compare')
  assert.equal(windows[0].sent, 'treasure:preview-changed')
  await assert.rejects(() => previews.open(f.store, [images[0]], 'compare', 0, null), /2–4/)
  await assert.rejects(() => previews.open(f.store, f.items.map(item => item.id), 'compare', 0, null), /2–4/)
  previews.control(sender, 'close')
  assert.equal(previews.session(sender), null); assert.equal(previews.store(sender), undefined)
})
test('拖入解析支持本地文件、虚拟图片、本地 URL，拒绝网页链接和自身素材', async t => {
  const previous = global.window
  t.after(() => { global.window = previous })
  global.window = { api: { getFilePath: file => file.nativePath ?? '' } }
  const { readTreasureDrop, canCollectTransfer } = load('../src/renderer/src/treasureTransfer.ts')
  const transfer = { types: ['Files'], files: [
    { nativePath: 'C:\\资料 空格\\模型.3dm' },
    { nativePath: 'C:\\资料 空格\\模型.3dm' },
    { type: 'image/png', name: '截图.png', size: 3, arrayBuffer: async () => Uint8Array.from([1, 2, 3]).buffer }
  ], getData: () => '' }
  const result = await readTreasureDrop(transfer)
  assert.deepEqual(result.paths, ['C:\\资料 空格\\模型.3dm'])
  assert.equal(result.images[0].name, '截图.png'); assert.deepEqual([...result.images[0].bytes], [1, 2, 3])
  const local = await readTreasureDrop({ types: ['text/uri-list'], files: [], getData: () => 'file:///C:/素材/模型.3dm' })
  assert.deepEqual(local.paths, ['C:\\素材\\模型.3dm'])
  await assert.rejects(() => readTreasureDrop({ types: ['text/uri-list'], files: [], getData: () => 'https://example.com/picture.png' }), /本地文件/)
  assert.equal(canCollectTransfer({ types: ['application/x-musy-assets', 'Files'] }), false)
  await assert.rejects(() => readTreasureDrop({ types: ['application/x-musy-assets', 'Files'], files: [] }), /无需再次/)
})
