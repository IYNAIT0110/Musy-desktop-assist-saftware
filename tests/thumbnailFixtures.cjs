const zlib = require('node:zlib')
const crc32 = require('buffer-crc32')

function dib(width = 8, height = 8) {
  const stride = Math.ceil(width * 3 / 4) * 4
  const result = Buffer.alloc(40 + stride * height)
  result.writeUInt32LE(40); result.writeInt32LE(width, 4); result.writeInt32LE(height, 8)
  result.writeUInt16LE(1, 12); result.writeUInt16LE(24, 14); result.writeUInt32LE(stride * height, 20)
  for (let p = 40; p < result.length; p += 3) { result[p] = 40; result[p + 1] = 100; result[p + 2] = 180 }
  return result
}
function zip(name, content, compress = true) {
  const filename = Buffer.from(name)
  const packed = compress ? zlib.deflateRawSync(content) : content
  const crc = crc32.unsigned(content)
  const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20, 4)
  local.writeUInt16LE(compress ? 8 : 0, 8); local.writeUInt32LE(crc, 14)
  local.writeUInt32LE(packed.length, 18); local.writeUInt32LE(content.length, 22); local.writeUInt16LE(filename.length, 26)
  const central = Buffer.alloc(46); central.writeUInt32LE(0x02014b50); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6)
  central.writeUInt16LE(compress ? 8 : 0, 10); central.writeUInt32LE(crc, 16)
  central.writeUInt32LE(packed.length, 20); central.writeUInt32LE(content.length, 24); central.writeUInt16LE(filename.length, 28)
  const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(1, 8); end.writeUInt16LE(1, 10)
  end.writeUInt32LE(central.length + filename.length, 12); end.writeUInt32LE(local.length + filename.length + packed.length, 16)
  return Buffer.concat([local, filename, packed, central, filename, end])
}
function cases(png, jpeg = Buffer.from('ffd8ffe00002ffd9', 'hex')) {
  const bitmap = dib()
  const rhino = Buffer.alloc(32); rhino.write('3D Geometry File Format      80')
  const skp = Buffer.from('fffeff0e53006b00650074006300680055007000', 'hex')
  const dwg = Buffer.alloc(160 + png.length); dwg.write('AC1032'); dwg.writeUInt32LE(128, 13)
  Buffer.from('1f256d07d43628289d57ca3f9d44102b', 'hex').copy(dwg, 128)
  dwg.writeUInt32LE(png.length + 32, 144); dwg[148] = 1; dwg[149] = 6
  dwg.writeUInt32LE(160, 150); dwg.writeUInt32LE(png.length, 154); png.copy(dwg, 160)
  const psdHeader = Buffer.alloc(30); psdHeader.write('8BPS'); psdHeader.writeUInt16BE(1, 4)
  psdHeader.writeUInt16BE(3, 12); psdHeader.writeUInt32BE(8, 14); psdHeader.writeUInt32BE(8, 18)
  psdHeader.writeUInt16BE(8, 22); psdHeader.writeUInt16BE(3, 24)
  const thumbnail = Buffer.alloc(28); thumbnail.writeUInt32BE(1); thumbnail.writeUInt32BE(8, 4); thumbnail.writeUInt32BE(8, 8)
  thumbnail.writeUInt32BE(jpeg.length, 20); thumbnail.writeUInt16BE(24, 24); thumbnail.writeUInt16BE(1, 26)
  const resource = Buffer.alloc(12); resource.write('8BIM'); resource.writeUInt16BE(1036, 4); resource.writeUInt32BE(thumbnail.length + jpeg.length, 8)
  const resources = Buffer.concat([resource, thumbnail, jpeg, Buffer.alloc((thumbnail.length + jpeg.length) % 2)])
  const resourceSize = Buffer.alloc(4); resourceSize.writeUInt32BE(resources.length)
  const ghLength = Buffer.alloc(4); ghLength.writeUInt32LE(png.length)
  return {
    'preview.3dm': Buffer.concat([rhino, bitmap.subarray(0, 40), Buffer.alloc(13), zlib.deflateSync(bitmap.subarray(40))]),
    'preview.3dmbak': Buffer.concat([rhino, bitmap]),
    'preview.skp': Buffer.concat([skp, Buffer.alloc(12), png]),
    'modern.skp': Buffer.concat([skp, Buffer.alloc(12), zip('meta/model_thumbnail.png', png)]),
    'preview.dwg': dwg,
    'preview.psd': Buffer.concat([psdHeader, resourceSize, resources]),
    'preview.pptx': zip('docProps/thumbnail.png', png),
    'preview.gh': zlib.deflateRawSync(Buffer.concat([Buffer.from([4, 82, 111, 111, 116]), Buffer.from([9]), Buffer.from('Thumbnail'), Buffer.from('ffffffff25000000', 'hex'), ghLength, png])),
    'preview.ghx': Buffer.from(`<Archive><chunks><chunk name="Thumbnail"><items><item name="Thumbnail" type_code="37"><bitmap length="${png.length}">${png.toString('base64')}</bitmap></item></items></chunk></chunks></Archive>`)
  }
}
module.exports = { dib, zip, cases }
