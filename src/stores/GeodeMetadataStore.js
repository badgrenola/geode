import { GeodeStore } from '../stores/GeodeStore.js'
import { derived, get } from 'svelte/store'
import { toPrecision, isObject } from '../helpers/jsHelpers'

/*

GeodeMetadataStore derives from rawHeader, contains : 
* ifdFields - nicely formatted field information for the metadata items list, including short-strings/formatted data for display, grouped by IFD

*/

const geodeMetadataStoreDefaults = {
  ifdFields: null,
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
    //Split into Image, Structure, Geo and Other Section
    const imageIDs = [256, 257, 258, 277, 262]
    const structureIDs = [259, 284, 322, 323, 324, 325, 317, 339]
    const geoTiffIDs = [33550, 33922, 34264, 42112, 42113]

    const imageFields = ifd.fields.filter((field) =>
      imageIDs.includes(field.id)
    )
    const structureFields = ifd.fields.filter((field) =>
      structureIDs.includes(field.id)
    )
    const geoFields = ifd.fields.filter((field) => field.isGeoKey || geoTiffIDs.includes(field.id) )
    const otherFields = ifd.fields.filter(
      (field) =>
        !field.isGeoKey &&
        !geoTiffIDs.includes(field.id) &&
        !imageIDs.includes(field.id) &&
        !structureIDs.includes(field.id)
    )

    return {
      image: processFieldSection(imageFields),
      structure: processFieldSection(structureFields),
      geo: processFieldSection(geoFields),
      other: processFieldSection(otherFields)
    }

    // return ifd.fields
    //   .map((field) => processField(field))
    //   .filter((field) => field !== null)
    //   .sort((a, b) => {
    //     return a.name > b.name ? 1 : -1
    //   })
  })
}

const processFieldSection = (fields) => {
  return fields
    .map((field) => processField(field))
    .filter((field) => field !== null)
    .sort((a, b) => {
      return a.name > b.name ? 1 : -1
    })
}

//Process a single IFD field into the form needed for display
const processField = (field) => {
  console.log(field.id, field.name)
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

  //Set the sf for numbers
  const sf = 4

  //Get the name and data
  let name = field.name || `Unknown Key : ${field.id}`
  name = name.replace("GeoKey", "").replace("Tag", "")
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
  else if (
    typeof field.data === 'number' &&
    `${field.data}`.includes('.') &&
    `${field.data}`.length > sf
  ) {
    expandable = true
    shortString = `${toPrecision(field.data, sf)} to ${sf}sf`
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
