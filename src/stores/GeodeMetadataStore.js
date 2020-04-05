import { GeodeStore } from '../stores/GeodeStore.js'
import { derived } from 'svelte/store'
import { toPrecision, isObject } from '../helpers/jsHelpers'

/*

GeodeMetadataStore derives from rawHeader, contains : 
* ifdFields - nicely formatted field information for the metadata items list, including short-strings/formatted data for display, grouped by IFD

*/

const geodeMetadataStoreDefaults = {
  ifdFields: null
}

//Process the rawData from the GeodeStore into data usable by the Metadata Panel
const processData = (rawData, set) => {
  //If data isn't preseent set to default
  if (!rawData) {
    set(geodeMetadataStoreDefaults)
    return
  }

  //We have the data.
  const ifdFields = processFields(rawData)

  //Set the results
  set({
    ifdFields,
  })
}

//Process the rawData from the GeodeStore into ifd field data displayed in a list in the metadata panel
const processFields = (rawData) => {
  return rawData.ifds.map((ifd) => {
    return ifd.fields
      .map((field) => processField(field))
      .filter((field) => field !== null)
      .sort((a, b) => {
        return a.name > b.name ? 1 : -1
      })
  })
}

//Process a single IFD field into the form needed for display
const processField = (field) => {
  //Ignore certain fields
  const ignoredTags = [
    'Exif IFD',
    'GeoKeyDirectoryTag',
    'GeoAsciiParamsTag',
    'GeoDoubleParamsTag',
  ]
  if (ignoredTags.includes(field.name)) {
    return null
  }

  //Get the name and data
  const name = field.name || `Unknown Key : ${field.id}`
  const data = prettyFormatData(field.data)

  //Set defaults for expandable and shortString
  let expandable = false
  let shortString = field.enumValue || field.data

  //Undefined
  if (field.data === undefined || field.data === null) {
    shortString = 'None'
  }

  //Strings
  else if (typeof field.data === typeof '' && field.data.length > 18) {
    expandable = true
    shortString = `${field.data.length} char string`
  }

  //Objects
  else if (isObject(field.data)) {
    expandable = true
    shortString = `${JSON.stringify(field.data).length} char JSON`
  }

  //Numbers
  else if (typeof field.data === 'number' && `${field.data}`.includes('.') && `${field.data}`.length > 6) {
    expandable = true
    shortString = `${toPrecision(field.data, 6)} to 6sf`
  }

  //Arrays
  else if (Array.isArray(field.data)) {
    //If all values are the same
    if (field.data.every((val, i, arr) => val === arr[0])) {
      expandable = false
      shortString = `${field.data.length} x [${field.data[0]}]`
    }

    //If values are different
    else {
      expandable = true
      shortString = `${field.data.length} values`
    }
  }

  return {
    name,
    data,
    expandable,
    shortString,
    isGeoKey: field.isGeoKey,
  }
}

const prettyFormatData = (data) => {
  //Empty data
  if (!data) {
    return 'None'
  }

  //Array data
  if (Array.isArray(data)) {
    return data.join('<br />')
  }

  //Object
  if (isObject(data)) {
    return JSON.stringify(data)
  }

  //Any other
  return data
}

const GeodeMetadataStore = derived(GeodeStore, ($GeodeStore, set) => {
  processData($GeodeStore.rawData, set)
})

export { GeodeMetadataStore }
