import fs from "node:fs"
import path from "node:path"
import zlib from "node:zlib"

const [, , sourcePath, outputDirectory] = process.argv

if (!sourcePath || !outputDirectory) {
  throw new Error("Usage: node scripts/extract-sloth-frames.mjs <source.png> <output-dir>")
}

const FRAME_SIZE = 256
const EXPECTED_SOURCE = { width: 1448, height: 1086 }

const frames = [
  { name: "idle", x: 990, y: 548 },
  { name: "wave", x: 1180, y: 548 },
  { name: "celebrate", x: 930, y: 307 },
  { name: "thumbs-up", x: 730, y: 307 },
  { name: "blink", x: 992, y: 54 },
  { name: "nod", x: 272, y: 307 },
]

function readPng(filePath) {
  const input = fs.readFileSync(filePath)
  if (input.readUInt32BE(0) !== 0x89504e47) throw new Error("Not a PNG file")

  let offset = 8
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = 0
  let interlace = 0
  const compressed = []

  while (offset < input.length) {
    const length = input.readUInt32BE(offset)
    const type = input.subarray(offset + 4, offset + 8).toString("ascii")
    const data = input.subarray(offset + 8, offset + 8 + length)
    offset += 12 + length

    if (type === "IHDR") {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data[8]
      colorType = data[9]
      interlace = data[12]
    } else if (type === "IDAT") {
      compressed.push(data)
    } else if (type === "IEND") {
      break
    }
  }

  if (width !== EXPECTED_SOURCE.width || height !== EXPECTED_SOURCE.height) {
    throw new Error(`Unexpected source dimensions: ${width}x${height}`)
  }
  if (bitDepth !== 8 || colorType !== 2 || interlace !== 0) {
    throw new Error("Source must be an 8-bit, non-interlaced RGB PNG")
  }

  const bytesPerPixel = 3
  const rowBytes = width * bytesPerPixel
  const inflated = zlib.inflateSync(Buffer.concat(compressed))
  const pixels = Buffer.alloc(width * height * 4)
  let inputOffset = 0
  let previous = Buffer.alloc(rowBytes)

  const paeth = (a, b, c) => {
    const p = a + b - c
    const pa = Math.abs(p - a)
    const pb = Math.abs(p - b)
    const pc = Math.abs(p - c)
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
  }

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[inputOffset++]
    const row = Buffer.from(inflated.subarray(inputOffset, inputOffset + rowBytes))
    inputOffset += rowBytes

    for (let x = 0; x < rowBytes; x += 1) {
      const left = x >= bytesPerPixel ? row[x - bytesPerPixel] : 0
      const up = previous[x]
      const upperLeft = x >= bytesPerPixel ? previous[x - bytesPerPixel] : 0
      if (filter === 1) row[x] = (row[x] + left) & 0xff
      else if (filter === 2) row[x] = (row[x] + up) & 0xff
      else if (filter === 3) row[x] = (row[x] + Math.floor((left + up) / 2)) & 0xff
      else if (filter === 4) row[x] = (row[x] + paeth(left, up, upperLeft)) & 0xff
      else if (filter !== 0) throw new Error(`Unsupported PNG filter ${filter}`)
    }

    for (let x = 0; x < width; x += 1) {
      const source = x * bytesPerPixel
      const target = (y * width + x) * 4
      pixels[target] = row[source]
      pixels[target + 1] = row[source + 1]
      pixels[target + 2] = row[source + 2]
      pixels[target + 3] = 255
    }
    previous = row
  }

  return { width, height, pixels }
}

function crc32(buffer) {
  let crc = 0xffffffff
  for (const value of buffer) {
    crc ^= value
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type)
  const result = Buffer.alloc(12 + data.length)
  result.writeUInt32BE(data.length, 0)
  typeBuffer.copy(result, 4)
  data.copy(result, 8)
  result.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length)
  return result
}

function writePng(filePath, width, height, pixels) {
  const scanlines = Buffer.alloc(height * (1 + width * 4))
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (1 + width * 4)
    scanlines[rowStart] = 0
    pixels.copy(scanlines, rowStart + 1, y * width * 4, (y + 1) * width * 4)
  }

  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8
  header[9] = 6

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", zlib.deflateSync(scanlines, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ])
  fs.writeFileSync(filePath, png)
}

function isGreenBackground(r, g, b) {
  const dominance = g - Math.max(r, b)
  if (g < 90 || dominance < 10) return 0
  if (dominance >= 34) return 255
  return Math.round(((dominance - 10) / 24) * 255)
}

const source = readPng(sourcePath)
fs.mkdirSync(outputDirectory, { recursive: true })

for (const frame of frames) {
  if (frame.x < 0 || frame.y < 0 || frame.x + FRAME_SIZE > source.width || frame.y + FRAME_SIZE > source.height) {
    throw new Error(`Frame ${frame.name} is outside source bounds`)
  }

  const output = Buffer.alloc(FRAME_SIZE * FRAME_SIZE * 4)
  for (let y = 0; y < FRAME_SIZE; y += 1) {
    for (let x = 0; x < FRAME_SIZE; x += 1) {
      const sourceIndex = ((frame.y + y) * source.width + frame.x + x) * 4
      const outputIndex = (y * FRAME_SIZE + x) * 4
      const r = source.pixels[sourceIndex]
      const g = source.pixels[sourceIndex + 1]
      const b = source.pixels[sourceIndex + 2]
      const greenAlpha = isGreenBackground(r, g, b)
      const alpha = greenAlpha === 255 ? 0 : 255 - greenAlpha
      output[outputIndex] = alpha === 0 ? 0 : r
      output[outputIndex + 1] = alpha === 0 ? 0 : g
      output[outputIndex + 2] = alpha === 0 ? 0 : b
      output[outputIndex + 3] = alpha
    }
  }

  writePng(path.join(outputDirectory, `${frame.name}.png`), FRAME_SIZE, FRAME_SIZE, output)
}

console.log(`Extracted ${frames.length} transparent sloth frames to ${outputDirectory}`)
