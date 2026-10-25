// 隐藏测试窗口，只验证真实 Electron + preload + 主进程，不操作用户界面。
const { app, BrowserWindow, nativeImage, dialog } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const assert = require('node:assert/strict')
const ts = require('typescript')
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'musy-treasure-smoke-'))
app.setPath('userData', path.join(root, 'userData'))
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, filename)
}
const { registerTreasureIpc } = require('../src/main/treasureIpc.ts')
const { TreasureStore } = require('../src/main/treasureStore.ts')
let window
app.whenReady().then(async () => {
  try {
    const library = path.join(root, 'library')
    const store = new TreasureStore(library); await store.load(true)
    fs.mkdirSync(app.getPath('userData'), { recursive: true })
    fs.writeFileSync(path.join(app.getPath('userData'), 'treasure-settings.json'), JSON.stringify({ path: library }))
    const source = path.join(root, '贴图 测试.png')
    fs.writeFileSync(source, nativeImage.createFromBitmap(Buffer.alloc(16 * 16 * 4, 255), { width: 16, height: 16 }).toPNG())
    registerTreasureIpc()
    window = new BrowserWindow({ show: false, webPreferences: { preload: path.resolve(__dirname, '../out/preload/index.js'), contextIsolation: true, nodeIntegration: false, sandbox: false } })
    const html = path.join(root, 'smoke.html')
    fs.writeFileSync(html, '<html><body>treasure IPC smoke test</body></html>')
    await window.loadFile(html)
    const invoke = (name, ...args) => window.webContents.executeJavaScript(`window.api.treasure[${JSON.stringify(name)}](...${JSON.stringify(args)})`)
    assert.equal((await invoke('status')).path, library)
    await invoke('importPaths', [source])
    for (let attempt = 0; attempt < 100; attempt++) {
      if ((await invoke('status')).job.state !== 'running') break
      await new Promise(r => setTimeout(r, 50))
    }
    const result = await invoke('query', {})
    assert.equal(result.total, 1)
    const item = result.items[0]
    assert.equal(item.available, true)
    const thumb = await invoke('thumbnail', item.id)
    assert.ok(thumb?.startsWith('data:image/png;base64,'), 'Windows 原生图片缩略图应能通过 IPC 返回')
    assert.ok(!nativeImage.createFromDataURL(thumb).isEmpty())
    await invoke('update', [item.id], { name: '已改名', tags: ['材质'] })
    assert.equal((await invoke('get', item.id)).name, '已改名')
    await invoke('remove', [item.id])
    assert.equal((await invoke('query', { trash: true })).total, 1)
    await invoke('remove', [item.id], true)
    assert.equal((await invoke('query', { tag: '材质' })).total, 1)
    const previewCases = require('./thumbnailFixtures.cjs').cases(nativeImage.createFromBitmap(Buffer.alloc(16 * 16 * 4, 255), { width: 16, height: 16 }).toPNG(), nativeImage.createFromBitmap(Buffer.alloc(16 * 16 * 4, 255), { width: 16, height: 16 }).toJPEG(80))
    for (const [name, data] of Object.entries(previewCases)) fs.writeFileSync(path.join(root, name), data)
    await invoke('importPaths', Object.keys(previewCases).map(name => path.join(root, name)))
    for (let attempt = 0; attempt < 100; attempt++) {
      if ((await invoke('status')).job.state !== 'running') break
      await new Promise(r => setTimeout(r, 50))
    }
    const previews = (await invoke('query', {})).items.filter(a => a.id !== item.id)
    assert.equal(previews.length, Object.keys(previewCases).length)
    for (const asset of previews) {
      const small = await invoke('thumbnail', asset.id)
      assert.ok(small?.startsWith('data:image/png;base64,'), asset.name + ' 缩略图')
      assert.ok(!nativeImage.createFromDataURL(small).isEmpty(), asset.name + ' 可解码')
      const cached = await invoke('thumbnail', asset.id)
      assert.equal(cached, small, asset.name + ' 命中缓存')
      const retried = await invoke('thumbnail', asset.id, true, true)
      assert.ok(retried, asset.name + ' 详情强制重试')
    }
    const cachedFiles = fs.readdirSync(path.join(library, 'cache'))
    assert.ok(cachedFiles.some(name => name.startsWith('preview-v2-')))
    const model = previews.find(asset => asset.originalName === 'preview.3dm')
    const before = await invoke('thumbnail', model.id)
    const changedModel = Buffer.from(previewCases['preview.3dmbak'])
    changedModel[72] ^= 255
    fs.writeFileSync(model.absolutePath, changedModel)
    fs.utimesSync(model.absolutePath, new Date(), new Date(Date.now() + 5000))
    assert.notEqual(await invoke('thumbnail', model.id), before, '原文件变化后缩略图缓存应失效')
    const previousOpenDialog = dialog.showOpenDialog
    try {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [source] })
      assert.equal(await invoke('setCover', model.id), true)
    } finally { dialog.showOpenDialog = previousOpenDialog }
    const manualCover = await invoke('thumbnail', model.id)
    const coverName = (await invoke('get', model.id)).cover
    assert.equal(manualCover, 'data:image/png;base64,' + fs.readFileSync(path.join(library, 'covers', coverName)).toString('base64'), '手动封面优先')
    assert.equal(await invoke('thumbnail', model.id, false, true), manualCover, '刷新保留手动封面')
    const dropPng = nativeImage.createFromBitmap(Buffer.alloc(12 * 12 * 4, 180), { width: 12, height: 12 }).toPNG()
    const dropScript = `window.api.treasure.importDrop({paths:[${JSON.stringify(source)}],images:[{name:'拖入图片.png',bytes:new Uint8Array(${JSON.stringify([...dropPng])})}]})`
    assert.equal(await window.webContents.executeJavaScript(dropScript), true)
    for (let attempt = 0; attempt < 100; attempt++) {
      if ((await invoke('status')).job.state !== 'running') break
      await new Promise(r => setTimeout(r, 50))
    }
    assert.equal((await invoke('status')).job.imported, 1)
    assert.equal((await invoke('status')).job.duplicates, 1)
    const collected = (await invoke('query', {})).items.find(asset => asset.absolutePath.includes(path.sep + 'clipboard' + path.sep))
    assert.ok(collected?.available, '拖入的虚拟图片须保存为真实原件')
    assert.ok(await invoke('thumbnail', collected.id))
    const previousStartDrag = window.webContents.startDrag
    let dragged
    try {
      const fakeDrag = value => { dragged = value }
      window.webContents.startDrag = fakeDrag
      assert.equal(window.webContents.startDrag, fakeDrag, '测试须拦截原生拖放，不能发起桌面实际拖放')
      await invoke('dragOut', [collected.id, item.id])
    } finally { window.webContents.startDrag = previousStartDrag }
    assert.deepEqual(dragged.files, [collected.absolutePath, item.absolutePath])
    assert.ok(!dragged.icon.isEmpty())
    assert.equal(await invoke('previewSession'), null, '普通窗口不应取得其他窗口的预览会话')
    await assert.rejects(() => invoke('importDrop', { paths: ['relative.png'], images: [] }), /路径无效/)
    await window.webContents.executeJavaScript("localStorage.setItem('musy.lang', 'en')")
    await assert.rejects(() => invoke('importDrop', { paths: ['relative.png'], images: [] }), /Import paths are invalid/)
    const originalDialog = dialog.showOpenDialog
    try {
      let options
      dialog.showOpenDialog = async (...args) => { options = args.at(-1); return { canceled: true, filePaths: [] } }
      assert.equal(await invoke('setCover', item.id), false)
      assert.equal(options.title, 'Choose asset cover')
      assert.equal(options.filters[0].name, 'Images')
      await window.webContents.executeJavaScript("localStorage.setItem('musy.lang', 'ja')")
      assert.equal(await invoke('chooseLibrary'), false)
      assert.equal(options.title, 'ライブラリを選択（初回は Musy百宝匣 サブフォルダーを作成）')
    } finally { dialog.showOpenDialog = originalDialog }
    console.log('PASS: Electron preload / IPC / 隔离进程系统缩略图 / 9 种格式结构的嵌入预览 / 缓存 / 重试 / 导入 / 编辑 / 标签 / 回收恢复')
    window.destroy()
    app.exit(0)
  } catch (error) {
    console.error(error)
    if (window && !window.isDestroyed()) window.destroy()
    app.exit(1)
  }
})
app.on('quit', () => {
  const target = path.resolve(root)
  if (path.dirname(target).toLowerCase() === path.resolve(os.tmpdir()).toLowerCase() && path.basename(target).startsWith('musy-treasure-smoke-')) {
    try { fs.rmSync(target, { recursive: true, force: true }) } catch { /* Chromium 文件锁稍后由系统释放；不影响用户资料 */ }
  }
})
