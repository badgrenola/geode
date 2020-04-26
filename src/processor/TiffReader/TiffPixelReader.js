import { TiffProcessorMessageType } from './TiffProcessorMessageType'
import { TiffType } from './TiffType'
import { DataType, getUInt8ByteArray, getDataArrayFromBytes, getFloat32ByteArray, valueIsValidForDataType} from '../helpers/Bytes'
import { Enums } from '../helpers/Enums'
import { arrAvg, arrMin, arrMax } from '../../helpers/jsHelpers'

class TiffPixelReader {

  constructor(tiffReader) {
    //Store the tiff reader instance
    this.tiffReader = tiffReader

    //Store a default proxy level
    this.proxyLevel = 8

    //Store the reader metadata
    this.meta = null

    //Store the saved values
    this.min = null
    this.max = null
    this.mean = null
  }

  //Get Min/Max/Mean Pixel info
  async getPixelInfo() {

    //Check if the values already exist in the metadata
    const existingMin = this.tiffReader.getGDALMetaFloat('MINIMUM')
    const existingMax = this.tiffReader.getGDALMetaFloat('MAXIMUM')
    const existingMean = this.tiffReader.getGDALMetaFloat('MEAN')
    if (existingMin && existingMax && existingMean) {
      //There ARE existing values
      console.log("Found existing Min/Max/Mean values in the GDAL_METADATA")

      //Store them
      this.min = existingMin
      this.max = existingMax
      this.mean = existingMean

      //Send the results back to the processor
      this.tiffReader.sendMessage(TiffProcessorMessageType.PIXEL_INFO_LOADED, {
        min: this.min,
        max: this.max,
        mean: this.mean
      })

      return
    }

    console.log("Calculating Min/Max/Mean values")
    console.debug("System byte order is :", this.tiffReader.sysByteOrder)
    console.debug("File byte order is : ", this.tiffReader.header.byteOrder)

    if (this.tiffReader.sysByteOrder !== this.tiffReader.header.byteOrder) {
      this.tiffReader.sendMessage(TiffProcessorMessageType.ERROR, null, "System Byte Order doesn't match File Byte Order")
      return
    }

    //Check for compressed files
    const compression = this.tiffReader.getCompression()
    if (compression !== Enums.Compression.NONE) {
      this.tiffReader.sendMessage(TiffProcessorMessageType.ERROR, null, "Compressed files not currently supported")
      return
    }

    //Get the data needed for the pixel read
    this.storeMetadataForPixelRead()
    if (!this.meta) {
      //We've already send the error so just return
      return
    }

    //Get the data type of the byte info
    let dataType = DataType.Short
    if (this.meta.bitsPerSample === 32) {
      dataType = DataType.Float
    }

    //Store min/max for the entire file
    this.min = 999999
    this.max = -999999

    //Store averages array - contains average value of each row
    let averages = []

    //Start a timer
    console.time(`Proxy level ${this.proxyLevel} pixel read complete`)

    //Start the pixel loop
    let pixelLoopError = await this.pixelLoop(
      this.meta.stripOffsets || this.meta.tileOffsets, 
      this.meta.stripByteCounts || this.meta.tileByteCounts,
      dataType, 
      this.proxyLevel, 
      (results) => {

      //For each row, get the min and max and update our value for the entire file
      let validResults = results.filter(v => valueIsValidForDataType(v, dataType, this.meta.noVal))
      if (validResults.length) {
        //Update the min/max
        let resultsMin = arrMin(validResults)
        let resultsMax = arrMax(validResults)
        if (isFinite(resultsMin) && resultsMin < this.min) { this.min = resultsMin }
        if (isFinite(resultsMax) && resultsMax > this.max) { this.max = resultsMax }

        // Update the averages
        averages.push(arrAvg(validResults))
      }
    })

    //Check for a pixel loop error
    if (pixelLoopError) {
      this.tiffReader.sendMessage(TiffProcessorMessageType.ERROR, null, pixelLoopError)
      return
    }

    //Now we have all row averages, find the overall average value
    this.mean = arrAvg(averages)

    //End the timer
    console.timeEnd(`Proxy level ${this.proxyLevel} pixel read complete`)

    //Send the results back to the processor
    this.tiffReader.sendMessage(TiffProcessorMessageType.PIXEL_INFO_LOADED, {
      min: this.min,
      max: this.max,
      mean: this.mean,
      isApproximate: this.proxyLevel !== 1
    })
  }

  storeMetadataForPixelRead() {
    //Get the basic image info
    const width = this.tiffReader.getWidth()
    const height = this.tiffReader.getHeight()
    const samplesPerPixel = this.tiffReader.getSamplesPerPixel()
    const bitsPerSample = this.tiffReader.getBitsPerSample()

    //Check we have all the basic infor required
    if (!width || !height || !samplesPerPixel || !bitsPerSample ) {
      this.tiffReader.sendMessage(TiffProcessorMessageType.ERROR, null, "Cannot find basic structure info")
      return
    }

    //Get the structure info
    let stripOffsets, stripByteCounts, tileOffsets, tileByteCounts, tileWidth, tileHeight = null
    stripOffsets = this.tiffReader.getStripOffsets()
    stripByteCounts = this.tiffReader.getStripByteCounts()
    tileOffsets = this.tiffReader.getTileOffsets()
    tileByteCounts = this.tiffReader.getTileByteCounts()
    tileWidth = this.tiffReader.getTileWidth()
    tileHeight = this.tiffReader.getTileHeight()

    //Check we have the values needed for the current type
    if (this.tiffReader.tiffType === TiffType.TILED) {
      if (!tileOffsets || !tileByteCounts || !tileWidth || !tileHeight) { 
        this.tiffReader.sendMessage(TiffProcessorMessageType.ERROR, null, "Cannot find tile info")
        return
      }
    } else if (this.tiffReader.tiffType === TiffType.STRIPS) {
      if (!stripOffsets || !stripByteCounts) {
        this.tiffReader.sendMessage(TiffProcessorMessageType.ERROR, null, "Cannot find strip info")
        return
      }
    }

    //Try to get the no data value
    const noData = this.tiffReader.getNoData()

    //Store all of the data in a single object
    this.meta = {
      width,
      height,
      samplesPerPixel,
      bitsPerSample,
      noVal: noData ? parseFloat(noData).toPrecision(4) : null,
      stripOffsets, 
      stripByteCounts, 
      tileOffsets, 
      tileByteCounts, 
      tileWidth, 
      tileHeight
    }

  }

  async pixelLoop(offsets, counts, dataType, proxyLevel, pixelsCallback) {

    //We need the same number of offsets and counts
    if (offsets.length !== counts.length) {
      console.error("Offsets and Counts don't match")
      return "Offsets and Counts don't match"
    }

    //Loop through 
    for (var i = 0; i<counts.length; i += proxyLevel) {

      //Get the byte offset and count
      const byteOffset = offsets[i]
      const byteCount = counts[i]

      //TODO : If file/sys endian-ness is the same, we can bypass the Dataview entirely. Also in the header 
      //Get the strip data as floats
      //TODO : Cleanup the imports for these
      // let floatArray = await getFloat32ByteArray(this.tiffReader.file, byteOffset, byteCount);
      let bytes = await getUInt8ByteArray(this.tiffReader.file, byteOffset, byteCount)
      let results = getDataArrayFromBytes(bytes, dataType, this.tiffReader.header.byteOrder, proxyLevel)

      if (pixelsCallback) {
        pixelsCallback(results)
      }
    }
  }

}

export { TiffPixelReader }