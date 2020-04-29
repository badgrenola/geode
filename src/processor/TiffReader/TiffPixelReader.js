import { TiffProcessorMessageType } from './TiffProcessorMessageType'
import { TiffType } from './TiffType'
import { DataType, valueIsValidForDataType, getDataArrayFromFileBuffer, getEmptyDataArrayFromCount} from '../helpers/Bytes'
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

    //Check for RGB files. We only want a single sample per pixel
    const samplesPerPixel = this.tiffReader.getSamplesPerPixel()
    if (samplesPerPixel !== 1) {
      this.tiffReader.sendMessage(TiffProcessorMessageType.PIXEL_STATS_LOAD_ERROR, null, "Non-Grayscale files not currently supported")
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

        //For each set of results that comes back, get the min and max and update our value for the entire file
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
    let dataType = DataType.Byte
    if (bitsPerSample === 16) { dataType = DataType.Short }
    if (bitsPerSample === 32) { dataType = DataType.Float }

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
      tilesX, 
      tilesY,
      dataType
    }

  }

  async pixelLoop(offsets, counts, dataType, proxyLevel, pixelsCallback) {

    //We need the same number of offsets and counts
    if (offsets.length !== counts.length) {
      console.error("Offsets and Counts don't match")
      return "Offsets and Counts don't match"
    }

    //Calculate the skip amount for this outer level.
    //For strip files, it'll be the proxyLevel.
    //For tiled files, it'll be 1
    let offsetDataSkipVal = proxyLevel
    if (this.tiffReader.tiffType === TiffType.TILED) {
      offsetDataSkipVal = 1
    }

    //Loop through each strip or each tile
    for (var i = 0; i<counts.length; i += offsetDataSkipVal) {

      //Get the byte offset and count for each strip or tile
      const byteOffset = offsets[i]
      const byteCount = counts[i]

      //Get the results, passing in the tileWidth if this is a tiled file, so that value skipping can happen internally
      let results = await getDataArrayFromFileBuffer(
        this.tiffReader.file, 
        byteOffset,
        byteCount,
        dataType,
        this.tiffReader.header.byteOrder, 
        this.tiffReader.sysByteOrder,
        proxyLevel,
        this.tiffReader.tiffType === TiffType.TILED ? this.meta.tileWidth : null
      )

      //Run the callback
      if (pixelsCallback) {
        pixelsCallback(results, i)
      }
    }
  }

}

export { TiffPixelReader }

