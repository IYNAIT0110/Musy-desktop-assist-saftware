const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const { pathToFileURL } = require('node:url')
const Module = require('node:module')
const ts = require('typescript')
const source = path.resolve(__dirname, '../src/main/treasureClipboard.ts')
const loaded = new Module(source, module)
loaded.filename = source; loaded.paths = Module._nodeModulePaths(path.dirname(source))
loaded._compile(ts.transpileModule(fs.readFileSync(source, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, source)
const { clipboardFilePaths, importTreasureClipboard } = loaded.exports
const storeSource = path.resolve(__dirname, '../src/main/treasureStore.ts')
const storeModule = new Module(storeSource, module)
storeModule.filename = storeSource; storeModule.paths = Module._nodeModulePaths(path.dirname(storeSource))
storeModule._compile(ts.transpileModule(fs.readFileSync(storeSource, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, storeSource)
const { TreasureStore } = storeModule.exports
const first = path.join(os.tmpdir(), '项目 文件', '模型.skp')
const second = path.join(os.tmpdir(), '贴图.png')
const sourceOf = (buffers = {}, text = '') => ({ readBuffer: format => buffers[format] ?? Buffer.alloc(0), readText: () => text })
function dropFiles(files) {
  const header = Buffer.alloc(20); header.writeUInt32LE(20, 0); header.writeUInt32LE(1, 16)
  return Buffer.concat([header, Buffer.from(files.join('\0') + '\0\0', 'utf16le')])
}

test('Windows 多文件列表保留中文和空格，优先于文本且去重', () => {
  assert.deepEqual(clipboardFilePaths(sourceOf({ CF_HDROP: dropFiles([first, second, first]) }, '无关文字')), [first, second])
})
test('兼容 FileNameW、带引号绝对路径和 file URL；忽略网页网址', () => {
  assert.deepEqual(clipboardFilePaths(sourceOf({ FileNameW: Buffer.from(first + '\0', 'utf16le') })), [first])
  assert.deepEqual(clipboardFilePaths(sourceOf({}, `"${first}"\r\n${pathToFileURL(second).href}\nhttps://example.com\nrelative.png`)), [first, second])
})
test('损坏的文件列表和不可读取的格式回退到路径文本', () => {
  const malformed = Buffer.alloc(22); malformed.writeUInt32LE(999999, 0)
  assert.deepEqual(clipboardFilePaths(sourceOf({ CF_HDROP: malformed }, first)), [first])
  assert.deepEqual(clipboardFilePaths({ readBuffer: () => { throw new Error('unsupported') }, readText: () => second }), [second])
})
test('剪贴板图片持久化、重复图片去重、重启可读；目录导入沿用一级归组', async t => {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'musy-clipboard-test-'))
  t.after(async () => {
    assert.equal(path.dirname(path.resolve(root)).toLowerCase(), path.resolve(os.tmpdir()).toLowerCase())
    assert.ok(path.basename(root).startsWith('musy-clipboard-test-'))
    await fs.promises.rm(root, { recursive: true, force: true })
  })
  const library = path.join(root, '库'); const store = new TreasureStore(library); await store.load(true)
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=', 'base64')
  const imageSource = { ...sourceOf(), readImage: () => ({ isEmpty: () => false, toPNG: () => png }) }
  assert.equal(await importTreasureClipboard(store, imageSource), 'image'); await store.waitForImport()
  const item = (await store.query({})).items[0]
  assert.equal(item.available, true); assert.equal(item.kind, 'image')
  assert.deepEqual(await fs.promises.readFile(item.absolutePath), png)
  assert.equal(path.dirname(item.absolutePath), path.join(library, 'clipboard'))
  await importTreasureClipboard(store, imageSource); await store.waitForImport()
  assert.equal(store.status().count, 1); assert.equal(store.status().job.duplicates, 1)
  const restarted = new TreasureStore(library); await restarted.load()
  assert.equal((await restarted.query({})).items[0].available, true)
  const folder = path.join(root, '项目', '贴图'); await fs.promises.mkdir(folder, { recursive: true })
  await fs.promises.writeFile(path.join(folder, '木纹.png'), png)
  const fileSource = { ...sourceOf({ FileNameW: Buffer.from(path.join(folder, '木纹.png') + '\0', 'utf16le') }), readImage: () => { throw new Error('不应读取图片') } }
  assert.equal(await importTreasureClipboard(store, fileSource, [path.dirname(folder)]), 'files'); await store.waitForImport()
  assert.deepEqual(store.status().groups.map(g => g.name), ['项目'])
  assert.equal(store.status().count, 2)
  await assert.rejects(() => importTreasureClipboard(store, { ...sourceOf({}, 'https://example.com'), readImage: () => ({ isEmpty: () => true }) }), /没有可导入/)
})
