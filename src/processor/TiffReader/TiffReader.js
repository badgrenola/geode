import { ByteOrder } from '../helpers/Bytes'
import { TiffHeaderReader } from './TiffHeaderReader'
import { TiffPixelReader } from './TiffPixelReader'

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

  parsePixels() {
    //Pass the message to the TiffPixelsReader
    this.pixelReader.parsePixels()
  }
}

export { TiffReader }
