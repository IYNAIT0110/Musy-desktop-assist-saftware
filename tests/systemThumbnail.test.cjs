const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const { EventEmitter } = require('node:events')
const ts = require('typescript')

function fixture() {
  const app = new EventEmitter(); const windows = []; let hang = true
  class FakeWindow {
    constructor(options) {
      this.options = options; this.dead = false; this.webContents = new EventEmitter()
      this.webContents.setWindowOpenHandler = () => {}
      this.webContents.executeJavaScript = async () => hang ? new Promise(() => {}) : Buffer.from('png-result').toString('base64')
      this.webContents.forcefullyCrashRenderer = () => { this.crashed = true; this.webContents.emit('render-process-gone') }
      windows.push(this)
    }
    isDestroyed() { return this.dead }
    destroy() { this.dead = true }
    async loadURL() {}
  }
  const source = path.resolve(__dirname, '../src/main/systemThumbnail.ts')
  const loaded = new Module(source, module); loaded.filename = source; loaded.paths = Module._nodeModulePaths(path.dirname(source))
  const originalRequire = loaded.require.bind(loaded)
  loaded.require = name => name === 'electron' ? { app, BrowserWindow: FakeWindow } : originalRequire(name)
  loaded._compile(ts.transpileModule(fs.readFileSync(source, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, source)
  return { app, windows, reader: loaded.exports.createSystemThumbnailReader(), recover: () => { hang = false } }
}
test('系统预览超时只终止专用隐藏进程，后续请求可恢复，退出后不再创建进程', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const f = fixture()
  const task = f.reader('C:\\模型\\file.skp', 320)
  await new Promise(setImmediate)
  assert.equal(f.windows[0].options.show, false)
  t.mock.timers.tick(6001)
  assert.equal(await task, null)
  assert.equal(f.windows[0].crashed, true); assert.equal(f.windows[0].dead, true)
  f.recover()
  assert.equal((await f.reader('C:\\模型\\file.skp', 320)).toString(), 'png-result')
  assert.equal(f.windows.length, 2)
  f.app.emit('before-quit')
  assert.equal(f.windows[1].dead, true)
  assert.equal(await f.reader('C:\\模型\\file.skp', 320), null)
  assert.equal(f.windows.length, 2)
})
