import { ByteOrder } from '../helpers/Bytes'
import { TiffHeaderReader } from './TiffHeaderReader'
import { TiffPixelReader } from './TiffPixelReader'
import { TiffIMGGenerator } from './TiffIMGGenerator'

class TiffReader {
  constructor(sendMessage) {
    this.sendMessage = sendMessage

    //Store state vars
    this.file = null
    this.header = {}
    this.ifds = []

    //Store the system byte order
    this.sysByteOrder = this.getSystemByteOrder()

    //Store the type of file
    this.tiffType = null

    //Store the header reader/pixel reader
    this.headerReader = new TiffHeaderReader(this)
    this.pixelReader = new TiffPixelReader(this)
    this.IMGGenerator = new TiffIMGGenerator(this)
  }

  reset() {
    this.file = null
    this.header = {}
    this.ifds = []
  }

  getSystemByteOrder() {
    //Get the system byte order
    var sysIsBigEndian = new Uint8Array(new Uint32Array([0x12345678]).buffer)[0] === 0x12
    if (sysIsBigEndian) {
     return ByteOrder.BigEndian
    } 
    return ByteOrder.LittleEndian
  }

  readHeader(file) {
    //Pass the message to the TiffHeaderReader
    this.headerReader.readHeader(file)
  }

  getPixelInfo() {
    //Pass the message to the TiffPixelsReader
    this.pixelReader.getPixelInfo()
  }

  constructIMG() {
    //Pass the message to the TiffIMGGenerator
    this.IMGGenerator.constructIMG()
  }

  //Convenience gets
  getFieldData(fieldID) {
    if (this.ifds.length > 0) { 
      const field = this.ifds[0].fields.find(field => field.id === fieldID)
      if (field) {  return field.data }
    }
    return null
  }
  
  getFilename() { return this.header.fileName }
  getWidth() { return this.getFieldData(256) }
  getHeight() { return this.getFieldData(257) }
  getStripOffsets() { return this.getFieldData(273) }
  getStripByteCounts() { return this.getFieldData(279) }
  getTileOffsets() { return this.getFieldData(324) }
  getTileByteCounts() { return this.getFieldData(325) }
  getTileWidth() { return this.getFieldData(322) }
  getTileHeight() { return this.getFieldData(323) }
  getSamplesPerPixel() { return this.getFieldData(277) }
  getBitsPerSample() { return this.getFieldData(258) }
  getNoData() { return this.getFieldData(42113) }
  getMapScale() { return this.getFieldData(33550) }
  getCompression() { return this.getFieldData(259) }

  getGDALMetadata() { return this.getFieldData(42112) }
  getGDALMetaFloat(key) { 
    const gdalMeta = this.getGDALMetadata()
    if (!gdalMeta) { return null }
    const matches = gdalMeta.match(new RegExp(`${key}[^>]+>([^<]+)`))
    if (matches && matches["1"]) { return parseFloat(matches["1"])}
    return null
  }

  getMin() { return this.pixelReader.min }
  getMax() { return this.pixelReader.max }
  getMean() { return this.pixelReader.mean }
}

export { TiffReader }
