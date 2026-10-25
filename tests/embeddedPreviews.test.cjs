const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const { readFileSync } = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const zlib = require('node:zlib')
const Module = require('node:module')
const ts = require('typescript')
const { dib, zip, cases } = require('./thumbnailFixtures.cjs')
const source = path.resolve(__dirname, '../src/main/embeddedPreviews.ts')
const loaded = new Module(source, module); loaded.filename = source; loaded.paths = Module._nodeModulePaths(path.dirname(source))
loaded._compile(ts.transpileModule(readFileSync(source, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, source)
const { dibToPng, rhinoPreview, sketchupPreview, grasshopperXmlPreview, grasshopperBinaryPreview, readEmbeddedPreview } = loaded.exports
const png = dibToPng(dib())

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'musy-preview-test-'))
  t.after(async () => {
    assert.equal(path.dirname(path.resolve(root)).toLowerCase(), path.resolve(os.tmpdir()).toLowerCase())
    assert.ok(path.basename(root).startsWith('musy-preview-test-'))
    await fs.rm(root, { recursive: true, force: true })
  })
  return root
}
test('DIB 转 PNG 具有正确尺寸、颜色和有效 CRC', () => {
  assert.equal(png.readUInt32BE(16), 8); assert.equal(png.readUInt32BE(20), 8)
  let p = 8; const chunks = []
  const crc = require('buffer-crc32')
  while (p + 12 <= png.length) {
    const length = png.readUInt32BE(p)
    assert.equal(crc.unsigned(png.subarray(p + 4, p + 8 + length)), png.readUInt32BE(p + 8 + length))
    if (png.toString('ascii', p + 4, p + 8) === 'IDAT') chunks.push(png.subarray(p + 8, p + 8 + length))
    p += length + 12
  }
  const pixels = zlib.inflateSync(Buffer.concat(chunks))
  assert.equal(pixels.length, (8 * 4 + 1) * 8)
  assert.deepEqual([...pixels.subarray(1, 5)], [180, 100, 40, 255])
  const bad = dib(); bad.writeUInt32LE(1 << 30, 4)
  assert.equal(dibToPng(bad), null)
})
test('Rhino 压缩/未压缩预览、SU 预览、DWG、PSD、PPTX、GHX 提取', async t => {
  const root = await fixture(t)
  for (const [name, data] of Object.entries(cases(png))) {
    const file = path.join(root, name); await fs.writeFile(file, data)
    const result = await readEmbeddedPreview(file, path.extname(name).slice(1))
    assert.ok(result, name + ' should have a preview')
    if (name.endsWith('.psd')) assert.equal(result.toString('hex'), 'ffd8ffe00002ffd9')
    else assert.deepEqual(result, png, name)
    assert.deepEqual(await fs.readFile(file), data, '读取预览不改写原件')
  }
})
test('无缩略图、错误签名、损坏长度与压缩数据返回空，不扫描模型纹理', async t => {
  const root = await fixture(t)
  assert.equal(rhinoPreview(Buffer.concat([Buffer.alloc(32), dib()])), null)
  assert.equal(sketchupPreview(Buffer.concat([Buffer.alloc(32), png])), null)
  assert.equal(grasshopperXmlPreview('<item name="Texture"><bitmap>' + png.toString('base64') + '</bitmap></item>'), null)
  assert.equal(grasshopperBinaryPreview(zlib.deflateRawSync(Buffer.concat([Buffer.from([4, 82, 111, 111, 116]), png]))), null)
  const badPsd = cases(png)['preview.psd']; badPsd.writeUInt32BE(0xffffffff, 30)
  const badZip = zip('docProps/thumbnail.png', png); badZip[badZip.length - 22 - Buffer.byteLength('docProps/thumbnail.png') - 46 + 16] ^= 1
  for (const [name, data] of Object.entries({ 'bad.psd': badPsd, 'bad.pptx': badZip, 'empty.pptx': zip('ppt/media/image1.png', png) })) {
    const file = path.join(root, name); await fs.writeFile(file, data)
    assert.equal(await readEmbeddedPreview(file, path.extname(name).slice(1)), null)
  }
  for (let n = 0; n < 100; n++) {
    const random = require('node:crypto').randomBytes(n * 7)
    assert.doesNotThrow(() => rhinoPreview(random)); assert.doesNotThrow(() => sketchupPreview(random))
    assert.doesNotThrow(() => grasshopperBinaryPreview(random))
  }
})
test('超大 ZIP 解压声明与 Rhino 解压输出受限制', async t => {
  const root = await fixture(t)
  const huge = zip('docProps/thumbnail.png', png)
  const at = huge.length - 22 - Buffer.byteLength('docProps/thumbnail.png') - 46
  huge.writeUInt32LE(0x7fffffff, at + 24)
  const file = path.join(root, 'large.pptx'); await fs.writeFile(file, huge)
  assert.equal(await readEmbeddedPreview(file, 'pptx'), null)
  const header = Buffer.alloc(32); header.write('3D Geometry File Format')
  const bomb = Buffer.concat([header, dib().subarray(0, 40), Buffer.alloc(13), zlib.deflateSync(Buffer.alloc(4096))])
  assert.equal(rhinoPreview(bomb), null)
})
