import { TiffProcessorMessageType } from './TiffProcessorMessageType'
import { ByteOrder, DataType } from '../helpers/Bytes'

class TiffIMGGenerator {

  constructor(tiffReader) {
    //Store the tiff reader instance
    this.tiffReader = tiffReader

    //Store the number of bytes to use for the header
    this.headerByteCount = 13680
  }

  async constructIMG() {
    console.log("Constructing IMG")

    //Get the label
    let label = this.makePDSLabel()
    if (!label) {
      this.tiffReader.sendMessage(TiffProcessorMessageType.ERROR, null, "Couldn't make IMG label")
      return 
    }
    console.log(label)


    return

    //Ensure that the label is headerByteCount long
    label = label.padEnd(this.headerByteCount)

    //Get the required info for pixel looping
    //TODO : Refactor this out and split to strip vs tile
    let width = this.tiffReader.getWidth()
    let height = this.tiffReader.getHeight()
    let offsets = this.tiffReader.getStripOffsets()
    let counts = this.tiffReader.getStripByteCounts()
    let bitsPerSample = this.tiffReader.getBitsPerSample()
    const noData = this.tiffReader.getNoData()
    if (typeof bitsPerSample === typeof []) { bitsPerSample = bitsPerSample[0] }

    if (!width || !height || !bitsPerSample || !offsets || !counts) { 
      this.tiffReader.sendMessage(TiffProcessorMessageType.ERROR, null, "No Strip Offsets/Byte Counts found when creating IMG")
      return
    }

    //Set the proxy level
    const proxyLevel = 1
    const proxySq = proxyLevel * proxyLevel

    
    //Get the data type of the image sbyte info
    let imageDataType = DataType.Short
    if (bitsPerSample === 32) {
      imageDataType = DataType.Float
    }

    let noVal = parseFloat(noData.data)
    const maxForDataType = imageDataType === DataType.Short ? (2**16)-1 : ((2**32)/2)-1
    const isValid = num => num !== noVal && num <= (maxForDataType - 50) // THere seems to be a threshold around this max value. TODO.

    //Set the data type of the output data
    const outputDataType = DataType.Float

    //Create a data view of the correct length, from the array buffer
    const unproxiedDVLength = width * height * outputDataType.byteCount[0] // + this.headerByteCount
    const finalDVLength = (unproxiedDVLength/proxySq) + this.headerByteCount
    // console.log(unproxiedDVLength, finalDVLength)
    const dv = new DataView(new ArrayBuffer(finalDVLength))

    //Get the label as a UInt8 array
    const labelBytes = Uint8Array.from(label, x => x.charCodeAt(0))
    
    //Add the label to the dv
    labelBytes.forEach((byte, i) => {
      dv.setUint8(i, byte)
    })

    //Loop through all the pixels at full resolution, get each value as ??? and add to the buffer
    let dataViewByteOffset = this.headerByteCount;
    await this.tiffReader.pixelReader.pixelLoop(offsets, counts, imageDataType, proxyLevel, (pixelVals) => {
      //For every row, add the float values to the DataView
      pixelVals.forEach(val => {
        if (isValid(val)) {
          dv.setFloat32(dataViewByteOffset, val, this.tiffReader.sysByteOrder === ByteOrder.LittleEndian);
          dataViewByteOffset +=  outputDataType.byteCount[0]
        }
      })
    })

    //Send the Dataview as a blob to the main thread for download
    this.tiffReader.sendMessage(TiffProcessorMessageType.TEST_IMG_DOWNLOAD, new Blob([dv]))
  }

  makePDSLabel() {
    //Get the required fields
    const filename = this.tiffReader.getFilename()
    const width = this.tiffReader.getWidth()
    const height = this.tiffReader.getHeight()
    const min = this.tiffReader.getMin()
    const max = this.tiffReader.getMax()
    let mapScale = this.tiffReader.getMapScale()
    if (!width || !height || min === null || max === null || !mapScale) { return null }

    //Format if necessary
    if (typeof mapScale === typeof []) { mapScale = mapScale[0] }

    //TODO Get the mapscale key
    const mapScaleKey = "<DEGREE/PIXEL>"

    //Set up the PDS label
    let labelLines = []
    labelLines.push('PDS_VERSION_ID            = PDS3')

    //File format
    labelLines.push('/* File format and length */')
    labelLines.push('RECORD_TYPE               = FIXED_LENGTH')
    labelLines.push(`RECORD_BYTES              = ${this.headerByteCount}`)
    labelLines.push(`FILE_RECORDS              = ${height + 1}`)
    labelLines.push('^IMAGE                    = 2')
    labelLines.push('')

    //ID info
    labelLines.push('/* Identification Information */')
    labelLines.push('PRODUCER_FULL_NAME        = "MATT BREALEY"')
    labelLines.push('PRODUCER_ID               = "GEODE"')
    labelLines.push(`PRODUCT_ID                = "${filename}"`)
    labelLines.push('PRODUCT_VERSION_ID        = "1"')
    labelLines.push('SOFTWARE_NAME             = "Geode"')
    labelLines.push('')

    //Object
    labelLines.push('OBJECT = IMAGE')
    labelLines.push(`  LINES            = ${height}`)
    labelLines.push(`  LINE_SAMPLES     = ${width}`)
    labelLines.push('  BANDS            = 1')
    labelLines.push('  OFFSET           = 0.0')
    labelLines.push('  SCALING_FACTOR   = 1.0')
    labelLines.push(`  SAMPLE_BITS      = 32`)
    labelLines.push(`  SAMPLE_BIT_MASK  = 2#${'1'.repeat(32 )}#`)
    labelLines.push('  SAMPLE_TYPE      = PC_REAL')
    labelLines.push('  MISSING_CONSTANT = 16#FF7FFFFB#')
    labelLines.push(`  VALID_MINIMUM    = ${min}`)
    labelLines.push(`  VALID_MAXIMUM    = ${max}`)
    labelLines.push('END_OBJECT = IMAGE')
    labelLines.push('')

    //Projection
    labelLines.push('OBJECT = IMAGE_MAP_PROJECTION')
    labelLines.push(`  MAP_SCALE                    = ${mapScale} ${mapScaleKey}`)
    labelLines.push('END_OBJECT = IMAGE_MAP_PROJECTION')
    labelLines.push('END')

    //Join and return 
    return labelLines.join("\n\r")
  }

}

export { TiffIMGGenerator }