import { TiffProcessorMessageType } from '../TiffProcessorMessageType'
import { TiffType } from './TiffType'

class TiffPixelReader {

  constructor(tiffReader) {
    //Store the tiff reader instance
    this.tiffReader = tiffReader
  }

  //Pixel reading
  async parsePixels() {
    console.log("System byte order is :", this.tiffReader.sysByteOrder)
    console.log("File byte order is : ", this.tiffReader.header.byteOrder)

    if (this.tiffReader.sysByteOrder !== this.tiffReader.header.byteOrder) {
      this.tiffReader.sendMessage(TiffProcessorMessageType.ERROR, null, "System Byte Order doesn't match File Byte Order")
      return
    }

    if (this.tiffReader.tiffType === TiffType.TILED) {
      await this.parseTiledFile()
    } else if (this.tiffReader.tiffType === TiffType.STRIPS) {
      await this.parseStripFile()
    } else {
      this.tiffReader.sendMessage(TiffProcessorMessageType.ERROR, null, "File TiffType not set")
      return
    }
  }

  async parseTiledFile() {
    this.tiffReader.sendMessage(TiffProcessorMessageType.ERROR, null, "Tiled Files not currently supported")
  }

  async parseStripFile() {

    if (!width || !length || !stripOffsets || !stripByteCounts || !samplesPerPixel || !bitsPerSample) {
      this.tiffReader.sendMessage(TiffProcessorMessageType.ERROR, null, "Cannot find strip info")
      return
    }

    const fields = this.tiffReader.ifds[0].fields
    const width = fields.find(field => field.id === 256)
    const length = fields.find(field => field.id === 257)
    const stripOffsets = fields.find(field => field.id === 273)
    const stripByteCounts = fields.find(field => field.id === 279)
    const samplesPerPixel = fields.find(field => field.id === 277)
    const bitsPerSample = fields.find(field => field.id === 258)
    const noData = fields.find(field => field.id === 42113)
    // console.log(fields)


    // // console.log(fields)

    // const proxy = 1
    // console.time(`Proxy ${proxy} byte conversion`)

    // const arrMin = arr => Math.min(...arr);
    // // const arrMax = arr => Math.max(...arr);
    // const arrAvg = (arr) => (arr.reduce((a,b) => a + b, 0) / arr.length)

    // let noVal = parseFloat(noData.data)
    // let min = 999999
    // let max = -999999
    // let averages = []
    // const proxySq = proxy*proxy
    // const proxyWidth = width.data / proxySq
    // const proxyHeight = length.data / proxySq

    // console.log(proxyWidth, proxyHeight)

    // for (var i = 0; i < proxyHeight; i++) {
    //   const offset = stripOffsets.data[i]
    //   const byteCount = stripByteCounts.data[i] / proxySq
    //   const bytesPerVal = 4
    //   const buffer = await new Response(this.tiffReader.file.slice(offset, offset + byteCount - 1)).arrayBuffer()
    //   const dv = new DataView(buffer)

    //   let rowMin = 999999
    //   let rowMax = -999999
    //   let rowVals = []

    //   for (var j = 0; j < proxyHeight -1 ; j++) {
    //     // console.log(j)
    //     const val = dv.getFloat32(j*bytesPerVal, this.tiffReader.header.byteOrder === ByteOrder.LittleEndian)
    //     if (val !== noVal) {
    //       if (val < rowMin) { rowMin = val }
    //       if (val > rowMax) { rowMax = val }
    //       rowVals.push(val)
    //     }
    //   }
      
    //   if (rowMin < min) { min = rowMin }
    //   if (rowMax > max) { max = rowMax }
    //   averages.push(arrAvg(rowVals))
    //   // console.log(result)
    //   // break
    // }

    // console.log(averages)
    // const mean = arrAvg(averages)
    // console.log(min, max, mean)

    // console.timeEnd(`Proxy ${proxy} byte conversion`)
    // console.log(width.data/proxySq, length.data / proxySq)
  }
}

export { TiffPixelReader }