import { TiffProcessorMessageType } from './TiffProcessorMessageType'
import { ByteOrder, DataType, valueIsValidForDataType } from '../helpers/Bytes'

class TiffIMGGenerator {

  constructor(tiffReader) {
    //Store the tiff reader instance
    this.tiffReader = tiffReader

    //Store the number of bytes to use for the header
    this.headerByteCount = 13680

    //Store a separate proxy level for IMG Generation
    this.imgProxyLevel = 8
  }

  async constructIMG() {
    console.log("Constructing IMG")

    // Get the meta
    if (!this.tiffReader.pixelReader.meta) {
      //We've already send the error so just return
      this.tiffReader.sendMessage(TiffProcessorMessageType.ERROR, null, "PixelReader Meta data not available. Cannot create IMG file.")
      return 
    }

    //Get the label
    let label = this.makePDSLabel()
    if (!label) {
      this.tiffReader.sendMessage(TiffProcessorMessageType.ERROR, null, "Couldn't make IMG label")
      return 
    }
    console.log(label)

    //Ensure that the label is headerByteCount long
    label = label.padEnd(this.headerByteCount)

    //Set the proxy level
    const proxySq = this.imgProxyLevel * this.imgProxyLevel

    //Set the data type of the output data
    const outputDataType = DataType.Float

    //Calculate the size of the data view required for the non-header data
    const unproxiedDVLength = 
      this.tiffReader.pixelReader.meta.width * 
      this.tiffReader.pixelReader.meta.height * 
      outputDataType.byteCount[0]

    //Calculate the full DV size, by proxying the above length, and adding the header
    const finalDVLength = (unproxiedDVLength/proxySq) + this.headerByteCount
    
    //Create a new dataview of the correct length
    const dv = new DataView(new ArrayBuffer(finalDVLength))

    //Get the label as a UInt8 array
    const labelBytes = Uint8Array.from(label, x => x.charCodeAt(0))
    
    //Add the label to the dv
    labelBytes.forEach((byte, i) => {
      dv.setUint8(i, byte)
    })

    //Loop through all the pixels at full resolution, get each value as ??? and add to the buffer
    let dataViewByteOffset = this.headerByteCount;
    await this.tiffReader.pixelReader.pixelLoop(
      this.tiffReader.pixelReader.meta.stripOffsets || this.tiffReader.pixelReader.meta.tileOffsets, 
      this.tiffReader.pixelReader.meta.stripByteCounts || this.tiffReader.pixelReader.meta.tileByteCounts,
      this.tiffReader.pixelReader.meta.dataType, 
      this.imgProxyLevel, 
      (pixelVals) => {

      //For each row, get the min and max and update our value for the entire file
      // let validResults = results.filter(v => valueIsValidForDataType(v, this.meta.dataType, this.meta.noVal))

      pixelVals.forEach(val => {
        if (valueIsValidForDataType(val, this.tiffReader.pixelReader.meta.dataType, this.tiffReader.pixelReader.meta.noVal)) {
          dv.setFloat32(dataViewByteOffset, val, this.tiffReader.sysByteOrder === ByteOrder.LittleEndian);
        }
        dataViewByteOffset +=  outputDataType.byteCount[0]
      })

    })

    //Send the Dataview as a blob to the main thread for download
    this.tiffReader.sendMessage(TiffProcessorMessageType.TEST_IMG_DOWNLOAD, {
      blob: new Blob([dv]),
      fileName: this.tiffReader.header.fileName
    })
  }

  makePDSLabel() {
    //Get the map scale
    let mapScale = this.tiffReader.getMapScale() || 1

    //Format if necessary
    if (typeof mapScale === typeof []) { mapScale = mapScale[0] }

    //TODO Get the mapscale key
    const mapScaleKey = "<DEGREE/PIXEL>"

    // Adjust the width/height/scale based on the proxy
    const labelWidth = Math.floor(this.tiffReader.pixelReader.meta.width / this.imgProxyLevel)
    const labelHeight = Math.floor(this.tiffReader.pixelReader.meta.height / this.imgProxyLevel)
    const labelMapScale = mapScale * this.imgProxyLevel

    //Set up the PDS label
    let labelLines = []
    labelLines.push('PDS_VERSION_ID            = PDS3')

    //File format
    labelLines.push('/* File format and length */')
    labelLines.push('RECORD_TYPE               = FIXED_LENGTH')
    labelLines.push(`RECORD_BYTES              = ${this.headerByteCount}`)
    labelLines.push(`FILE_RECORDS              = ${labelHeight + 1}`)
    labelLines.push('^IMAGE                    = 2')
    labelLines.push('')

    //ID info
    labelLines.push('/* Identification Information */')
    labelLines.push('PRODUCER_FULL_NAME        = "MATT BREALEY"')
    labelLines.push('PRODUCER_ID               = "GEODE"')
    labelLines.push(`PRODUCT_ID                = "${this.tiffReader.header.fileName}"`)
    labelLines.push('PRODUCT_VERSION_ID        = "1"')
    labelLines.push('SOFTWARE_NAME             = "Geode"')
    labelLines.push('')

    //Object
    labelLines.push('OBJECT = IMAGE')
    labelLines.push(`  LINES            = ${labelHeight}`)
    labelLines.push(`  LINE_SAMPLES     = ${labelWidth}`)
    labelLines.push('  BANDS            = 1')
    labelLines.push('  OFFSET           = 0.0')
    labelLines.push('  SCALING_FACTOR   = 1.0')
    labelLines.push(`  SAMPLE_BITS      = 32`)
    labelLines.push(`  SAMPLE_BIT_MASK  = 2#${'1'.repeat(32 )}#`)
    labelLines.push('  SAMPLE_TYPE      = PC_REAL')
    labelLines.push('  MISSING_CONSTANT = 16#FF7FFFFB#')
    labelLines.push(`  VALID_MINIMUM    = ${this.tiffReader.pixelReader.meta.min}`)
    labelLines.push(`  VALID_MAXIMUM    = ${this.tiffReader.pixelReader.meta.max}`)
    labelLines.push('END_OBJECT = IMAGE')
    labelLines.push('')

    //Projection
    labelLines.push('OBJECT = IMAGE_MAP_PROJECTION')
    labelLines.push(`  MAP_SCALE                    = ${labelMapScale} ${mapScaleKey}`)
    labelLines.push('END_OBJECT = IMAGE_MAP_PROJECTION')
    labelLines.push('END')

    //Join and return 
    return labelLines.join("\n\r")
  }

}

export { TiffIMGGenerator }