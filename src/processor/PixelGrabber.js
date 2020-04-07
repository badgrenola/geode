import {
  ByteOrder,
  DataType,
  getUInt8ByteArray,
  getDataFromBytes,
  getDataTypeFromID,
  getDataArrayFromBytes
} from './helpers/Bytes'

class PixelGrabber {
  constructor(onLoad, onError) {
    this.onLoad = onLoad
    this.onError = onError
    this.headerData = null
    this.file = null
  }

  async grabData(headerData, file) {
    this.headerData = headerData
    this.file = file
    await this.readStrips()
  }

  async readStrips() {
    const fields = this.headerData.ifds[0].fields
    const width = fields.find(field => field.id === 256)
    const length = fields.find(field => field.id === 257)
    const stripOffsets = fields.find(field => field.id === 273)
    const stripByteCounts = fields.find(field => field.id === 279)
    const samplesPerPixel = fields.find(field => field.id === 277)
    const bitsPerSample = fields.find(field => field.id === 258)

    if (!width || !length || !stripOffsets || !stripByteCounts || !samplesPerPixel || !bitsPerSample) {
      console.log("Cannot find strip info")
      return
    }
    console.log(fields)

    const proxy = 2
    console.time(`Proxy ${proxy} byte conversion`)

    const proxySq = proxy*proxy
    for (var i = 0; i < (length.data / proxySq); i++) {
      const offset = stripOffsets.data[i]
      const byteCount = stripByteCounts.data[i]
      const bytes = await getUInt8ByteArray(this.file, offset, (byteCount / proxySq))
      const result = new DataView(bytes.buffer).getFloat32(0, this.headerData.header.byteOrder === ByteOrder.LittleEndian)
      // console.log(result)
    }
    console.timeEnd(`Proxy ${proxy} byte conversion`)

    console.log(width.data/proxySq, length.data / proxySq)
    // let byteIndex = 0
    // for (var i = 0; i < width.data; i++) {
    //   const result = getDataFromBytes(bytes, DataType.Float, this.headerData.header.byteOrder)
    //   console.log(result)
    //   byteIndex = i * 4
    //   return
    // }
  }

}

export { PixelGrabber }