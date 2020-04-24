import { TiffProcessorMessageType } from './TiffProcessorMessageType'
import { TiffType } from './TiffType'
import { DataType, getUInt8ByteArray, getDataArrayFromBytes } from '../helpers/Bytes'

class TiffPixelReader {

  constructor(tiffReader) {
    //Store the tiff reader instance
    this.tiffReader = tiffReader

    //Store a default proxy level
    this.proxyLevel = 4
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

    const fields = this.tiffReader.ifds[0].fields
    const width = fields.find(field => field.id === 256)
    const length = fields.find(field => field.id === 257)
    const stripOffsets = fields.find(field => field.id === 273)
    const stripByteCounts = fields.find(field => field.id === 279)
    const samplesPerPixel = fields.find(field => field.id === 277)
    const bitsPerSample = fields.find(field => field.id === 258)
    const noData = fields.find(field => field.id === 42113)

    if (!width || !length || !stripOffsets || !stripByteCounts || !samplesPerPixel || !bitsPerSample || !noData) {
      this.tiffReader.sendMessage(TiffProcessorMessageType.ERROR, null, "Cannot find strip info")
      return
    }

    let noVal = parseFloat(noData.data)
    const arrMin = arr => Math.min(...arr.filter(v => v !== noVal));
    const arrMax = arr => Math.max(...arr.filter(v => v !== noVal));
    const arrAvg = (arr) => (arr.reduce((a,b) => a + b, 0) / arr.length)

    let min = 999999
    let max = -999999
    let averages = []

    console.time(`Proxy ${this.proxyLevel} pixel read`)

    let dataType = DataType.Short
    if (bitsPerSample.data === 32) {
      dataType = DataType.Float
    }

    //For each strip
    for (var stripIndex = 0; stripIndex<length.data; stripIndex += this.proxyLevel) {
      //Get the strip data as floats
      //TODO : Figure out data type properly
      let bytes = await getUInt8ByteArray(this.tiffReader.file, stripOffsets.data[stripIndex], stripByteCounts.data[stripIndex])
      let results = getDataArrayFromBytes(bytes, dataType, this.tiffReader.header.byteOrder, this.proxyLevel)

      let rowMin = arrMin(results)
      let rowMax = arrMax(results)
      if (isFinite(rowMin) && rowMin < min) { min = rowMin }
      if (isFinite(rowMax) && rowMax > max) { max = rowMax }

      let validVals = results.filter(v => v !== noVal)
      if (validVals.length) {
        averages.push(arrAvg(validVals))
      }
    }

    let mean = arrAvg(averages)

    console.timeEnd(`Proxy ${this.proxyLevel} pixel read`)

    this.tiffReader.sendMessage(TiffProcessorMessageType.PIXEL_INFO_LOADED, {
      min,
      max,
      mean
    })
  }

}

export { TiffPixelReader }