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
  }

  //Get Min/Max/Mean Pixel info
  async getPixelInfo() {

    //Get the data needed for the pixel read
    this.storeMetadataForPixelRead()
    if (!this.meta) {
      //We've already send the error so just return
      return
    }

    //Check if the values already exist in the metadata
    const existingMin = this.tiffReader.getGDALMetaFloat('MINIMUM')
    const existingMax = this.tiffReader.getGDALMetaFloat('MAXIMUM')
    const existingMean = this.tiffReader.getGDALMetaFloat('MEAN')
    if (existingMin && existingMax && existingMean) {
      //There ARE existing values
      console.debug("Found existing Min/Max/Mean values in the GDAL_METADATA")

      //Store them in the meta
      this.meta.min = existingMin
      this.meta.max = existingMax
      this.meta.mean = existingMean

      //Send the results back to the processor
      this.tiffReader.sendMessage(TiffProcessorMessageType.PIXEL_STATS_LOADED, {
        min: this.meta.min,
        max: this.meta.max,
        mean: this.meta.mean
      })

      return
    }

    console.debug("Calculating Min/Max/Mean values")
    console.debug("System byte order is :", this.tiffReader.sysByteOrder)
    console.debug("File byte order is : ", this.tiffReader.header.byteOrder)

    if (this.tiffReader.sysByteOrder !== this.tiffReader.header.byteOrder) {
      this.tiffReader.sendMessage(TiffProcessorMessageType.PIXEL_STATS_LOAD_ERROR, null, "System Byte Order doesn't match File Byte Order")
      return
    }

    //Check for compressed files
    const compression = this.tiffReader.getCompression()
    if (compression !== Enums.Compression.NONE) {
      this.tiffReader.sendMessage(TiffProcessorMessageType.PIXEL_STATS_LOAD_ERROR, null, "Compressed files not currently supported")
      return
    }

    //Check for RGB files
    const rgbCheck = this.tiffReader.getPhotometricInterpretation()
    if (rgbCheck !== Enums.PhotometricInterpretation.MINISBLACK) {
      this.tiffReader.sendMessage(TiffProcessorMessageType.PIXEL_STATS_LOAD_ERROR, null, "RGB files not currently supported")
      return
    }

    //Store min/max for the entire file
    this.meta.min = 999999
    this.meta.max = -999999

    //Store averages array - contains average value of each row
    let averages = []

    //Start a timer
    console.time(`Pixel Stats Calculation Completed @P${this.proxyLevel}`)

    //Start the pixel loop
    let pixelLoopError = await this.pixelLoop(
      this.meta.stripOffsets || this.meta.tileOffsets, 
      this.meta.stripByteCounts || this.meta.tileByteCounts,
      this.meta.dataType, 
      this.proxyLevel, 
      (results) => {

      //For each row, get the min and max and update our value for the entire file
      let validResults = results.filter(v => valueIsValidForDataType(v, this.meta.dataType, this.meta.noVal))
      if (validResults.length) {
        //Update the min/max
        let resultsMin = arrMin(validResults)
        let resultsMax = arrMax(validResults)
        if (isFinite(resultsMin) && resultsMin < this.meta.min) { this.meta.min = resultsMin }
        if (isFinite(resultsMax) && resultsMax > this.meta.max) { this.meta.max = resultsMax }

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
    this.meta.mean = arrAvg(averages)

    //End the timer
    console.timeEnd(`Pixel Stats Calculation Completed @P${this.proxyLevel}`)

    //Send the results back to the processor
    this.tiffReader.sendMessage(TiffProcessorMessageType.PIXEL_STATS_LOADED, {
      min: this.meta.min,
      max: this.meta.max,
      mean: this.meta.mean,
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
      this.tiffReader.sendMessage(TiffProcessorMessageType.PIXEL_STATS_LOAD_ERROR, null, "Cannot find basic structure info")
      return
    }

    //Get the structure info
    let stripOffsets, stripByteCounts, tileOffsets, tileByteCounts, tileWidth, tileHeight, tilesX, tilesY = null
    stripOffsets = this.tiffReader.getStripOffsets()
    stripByteCounts = this.tiffReader.getStripByteCounts()
    tileOffsets = this.tiffReader.getTileOffsets()
    tileByteCounts = this.tiffReader.getTileByteCounts()
    tileWidth = this.tiffReader.getTileWidth()
    tileHeight = this.tiffReader.getTileHeight()
    tilesX = tileWidth ? Math.floor((width + tileWidth - 1) / tileWidth) : null
    tilesY = tileHeight ? Math.floor((height + tileHeight - 1) / tileHeight) : null

    //Check we have the values needed for the current type
    if (this.tiffReader.tiffType === TiffType.TILED) {

      if (!tileOffsets || !tileByteCounts || !tileWidth || !tileHeight || !tilesX || !tilesY) { 
        this.tiffReader.sendMessage(TiffProcessorMessageType.PIXEL_STATS_LOAD_ERROR, null, "Cannot find tile info")
        return
      }

      if ((tilesX * tilesY !== tileOffsets.length || tilesX * tilesY !== tileByteCounts.length) ) { 
        this.tiffReader.sendMessage(TiffProcessorMessageType.PIXEL_STATS_LOAD_ERROR, null, "Incorrect offsets/byteCounts for given tiles")
        return
      }

    } else if (this.tiffReader.tiffType === TiffType.STRIPS) {
      if (!stripOffsets || !stripByteCounts) {
        this.tiffReader.sendMessage(TiffProcessorMessageType.PIXEL_STATS_LOAD_ERROR, null, "Cannot find strip info")
        return
      }
    }

    //Try to get the no data value
    const noData = this.tiffReader.getNoData()

    //Get the data type of the byte info
    let dataType = DataType.Short
    if (bitsPerSample === 32) {
      dataType = DataType.Float
    }

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
      tileHeight,
      dataType
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