import { GeodeStore } from '../stores/GeodeStore.js'
import { GeodeBandStore } from '../stores/GeodeBandStore.js'
import { derived } from 'svelte/store'

/*

GeodeInfoPanelStore derives from rawHeader, contains : 
* resolution - a string version of the current band's width x height
* format - a string describing bit rate and image format (Grayscale/RGB/RGBA) 
* structure - whether tiled/strip
* min value - the min pixel value found in the current band
* max value - the max pixel value found in the current band
* mean value - the mean pixel value found in the current band

*/

//Determine the defaults
const geodeInfoPanelDefaults = {
  resolution: null,
  format: null,
  structure: null,
  minValue: null,
  maxValue: null,
  meanValue: null,
}

//Get the resolution string from the ImageWidth/ImageLength fields
const getResolution = (fields) => {
  const imageWidthField = fields.find(field => field.id === 256)
  const imageHeightField = fields.find(field => field.id === 257)
  if (imageWidthField && imageHeightField) {
    return `${imageWidthField.data} x ${imageHeightField.data}`
  }
  return null
}

//Get the format string from the BitsPerSample/SamplesPerPixel fields
const getFormat = (fields) => {
  const bitsPerSample = fields.find(field => field.id === 258)
  const samplesPerPixel = fields.find(field => field.id === 277)
  if (bitsPerSample && samplesPerPixel) {
    let colorDepthString = "Grayscale"
    if (samplesPerPixel.data === 3) {
      colorDepthString = "RGB"
    } else if (samplesPerPixel.data === 4) {
      colorDepthString = "RGBA"
    }

    //Bit count could be an array - grab a single value
    const bitCount = Array.isArray(bitsPerSample.data) ? bitsPerSample.data[0] : bitsPerSample.data
    return `${bitCount}-bit, ${colorDepthString}`
  }
  return null
}

//Get the structure string from either the TileByteCounts/StripOffsets fields
const getStructure = (fields) => {
  const tileByteCounts = fields.find(field => field.id === 325)
  const stripOffsets = fields.find(field => field.id === 273)
  if (tileByteCounts) {
    return "Tiled"
  } else if (stripOffsets) {
    return "Non-tiled"
  }
  return null
}

//Parse the information
const parseInfo = (currentBandIndex, rawData, pixelInfo, set) => {
  //Check that we have raw data available. If not, set all to defaults
  if (!rawData) { 
    set(geodeInfoPanelDefaults)
    return
  }

  //Get the image values
  const resolution = getResolution(rawData.ifds[currentBandIndex].fields)
  const format = getFormat(rawData.ifds[currentBandIndex].fields)
  const structure = getStructure(rawData.ifds[currentBandIndex].fields)

  //Set the new values
  set({
    resolution,
    format,
    structure,
    minValue: null,
    maxValue: null,
    meanValue: null,
  })
}

//Setup the derived store
const GeodeInfoPanelStore = derived(
  [GeodeBandStore, GeodeStore],
  ([$GeodeBandStore, $GeodeStore], set) => {
    //Update the derived store based on current band index/geode store 
    parseInfo($GeodeBandStore.currentBandIndex, $GeodeStore.rawData, $GeodeStore.pixelInfo, set)
  }
)


export { GeodeInfoPanelStore }
