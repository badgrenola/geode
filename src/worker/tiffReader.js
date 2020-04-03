import {
  ByteOrder,
  getUInt8ByteArray,
  getUInt16FromBytes,
  getUInt32FromBytes,
  getDoubleFromBytes,
  getUInt16sFromBytes,
  getUInt32sFromBytes,
  getDoublesFromBytes
} from './bytesHelper'
import { tiffFields } from './tiffFields'
import { getDataTypeFromID, DataType } from './dataTypes'
import { enumsObject } from './enums'
import { roundToDP, reduceTotal } from '../helpers/jsHelpers'

class TiffReader {
  constructor(file, onLoadCallback, onErrorCallback) {
    console.log('TiffReader : Reading ' + file.name)

    console.log(getUInt8ByteArray)

    //Store the file
    this.file = file

    //Store the callbacks
    this.onLoadCallback = onLoadCallback
    this.onErrorCallback = onErrorCallback

    //Setup the required vars
    this.headerInfo = {}
    this.byteOrder = null
    this.ifds = []

    //Store any errors
    this.error = null

    //Immediately start reading the file data
    this.startReading()
  }

  async startReading() {
    //Get the header info
    await this.getHeaderInfo()

    //Check that we have no errors
    if (this.error) {
      //Error found, abort the process
      this.onErrorCallback(this.error)
      return
    }

    //Parse the initial IFD and return the offsets found
    let offsets = await this.readIFD(this.headerInfo.firstIFDOffset)
    let nextIFDOffset = offsets.nextIFDOffset
    let exifIFDOffset = offsets.exifIFDOffset

    if (this.error) {
      //Error found, abort the process
      this.onErrorCallback(this.error)
      return
    }

    //Continue parsing IFDs until the next offset is 0
    while (nextIFDOffset > 0) {
      //Parse the IFD and return any IFD offsets found within it
      const offsets = await this.readIFD(nextIFDOffset)
      nextIFDOffset = offsets.nextIFDOffset
      exifIFDOffset =
        offsets.exifIFDOffset > 0 ? offset.exifIFDOffset : exifIFDOffset

      //Check for errors
      if (this.error) {
        //Error found, abort the process
        this.onErrorCallback(this.error)
        return
      }
    }

    //If an Exif IFD was found, parse that
    if (exifIFDOffset > 0) {
      await this.readIFD(exifIFDOffset)

      //Check for errors
      if (this.error) {
        //Error found, abort the process
        this.onErrorCallback(this.error)
        return
      }
    }

    console.log('All IFDs read successfully')
    console.log(this.ifds)

    //Run the finished callback
    this.onLoadCallback({
      file: {
        name: this.file.name,
        size: roundToDP(this.file.size / 1000 / 1000, 2),
      },
      ifds: this.ifds,
    })
  }

  async getHeaderInfo() {
    console.log('Getting Header Info')
    //Clear the dict
    this.headerInfo = {}

    //Get the first 8 bytes as uint8
    const initialBytes = await getUInt8ByteArray(this.file, 0, 8)

    //Query the byte order
    if (initialBytes[0] === 73 && initialBytes[1] === 73) {
      this.byteOrder = ByteOrder.LittleEndian
    } else if (initialBytes[0] === 77 && initialBytes[1] === 77) {
      this.byteOrder = ByteOrder.BigEndian
    }
    this.headerInfo.byteOrder = this.byteOrder

    //Query the magic number to ensure this is a tiff fil
    if (
      (this.byteOrder === ByteOrder.LittleEndian && initialBytes[2] != 42) ||
      (this.byteOrder === ByteOrder.BigEndian && initialBytes[3] != 42)
    ) {
      console.error(initialBytes, 'Not a tiff file')
      this.error = 'Not a tiff file'
      return
    } else {
      this.headerInfo.isTiff = true
    }

    //Get the first section offset
    const offset = getUInt32FromBytes(initialBytes.slice(4, 8), this.byteOrder)
    this.headerInfo.firstIFDOffset = offset
  }

  async readIFD(offset) {
    console.log(`Reading IFD starting at offset : ${offset}`)

    //Store field dicts
    let fields = []

    //Get the field count of the current IFD
    const fieldCountBytes = await getUInt8ByteArray(this.file, offset, 2)
    const fieldCount = getUInt16FromBytes(fieldCountBytes, this.byteOrder)

    //Each field is 12 bytes long
    //Read each field and store it's bytes
    let allFieldBytes = []
    for (let i = 0; i < fieldCount; i++) {
      const bytes = await getUInt8ByteArray(this.file, offset + 2 + i * 12, 12)
      allFieldBytes.push(bytes)
    }

    //Parse each field in turn
    for (let i = 0; i < fieldCount; i++) {
      const fieldDict = await this.parseField(allFieldBytes[i])
      if (!fieldDict) {
        this.error = 'Could not parse field dict'
        return
      }
      fields.push(fieldDict)
    }

    //Parse GeoData
    this.getGeoKeyDirectoryDataFromFields(fields)

    //Store the IFD data
    this.ifds.push({
      id: this.ifds.length,
      offset: offset,
      fields,
    })

    //If the fields contains an Exif IFD tag, return the offset to that
    let exifIFDOffset = 0
    let exifIFDField = fields.find((field) => field.dataTypeID === 13)
    if (exifIFDField) {
      console.log('Found Exif IFD field')
      exifIFDOffset = exifIFDField.offset
    }

    //The next 4 bytes will either be 0 if this was the last IFD, or an offset to where the next one starts
    const nextIFDOffsetBytes = await getUInt8ByteArray(
      this.file,
      offset + 2 + fieldCount * 12,
      4
    )
    const nextIFDOffset = getUInt32FromBytes(nextIFDOffsetBytes, this.byteOrder)
    return {
      nextIFDOffset,
      exifIFDOffset,
    }
  }

  async parseField(fieldBytes) {
    //Get the ID + corresponding name
    const id = getUInt16FromBytes(fieldBytes.slice(0, 2), this.byteOrder)

    //Get the field name
    const name = tiffFields[id]

    //Get the Data Type
    const dataTypeID = getUInt16FromBytes(
      fieldBytes.slice(2, 4),
      this.byteOrder
    )

    //Get the data type
    const dataType = getDataTypeFromID(dataTypeID)

    //Get the value count
    const valuesCount = getUInt32FromBytes(
      fieldBytes.slice(4, 8),
      this.byteOrder
    )

    //Figure out of the field number is an offset or a value
    const valueIsOffset =
      valuesCount * reduceTotal(dataType.byteCount) > 4 || dataType.isOffset

    //Get either the raw value, or the offset value
    let value = null
    let offset = null
    if (!valueIsOffset) {
      value = this.getValue(fieldBytes, dataType)
    } else {
      offset = this.getValue(fieldBytes, DataType.Long)
    }

    //Get the data the field represents
    let data = value
    if (offset) {
      data = await this.getOffsetFieldData(offset, valuesCount, dataType, name)
    } else {
      //If field name is a known enum, get the enum value
      if (Object.keys(enumsObject).find((key) => key === name)) {
        //If enum contains the given value, return the key
        const matchedEnum = enumsObject[name]
        data = Object.keys(matchedEnum).find(
          (key) => matchedEnum[key] === value
        )
      }
    }

    //Return an array of the info
    return {
      id,
      name,
      dataTypeID,
      dataType,
      valuesCount,
      value,
      offset,
      data,
    }
  }

  getValue(fieldBytes, dataType) {
    //Get the sliced bytes for the value section
    let slicedBytes = fieldBytes.slice(8, 12)
    switch (dataType.id) {
      case 3:
        //Short
        return getUInt16FromBytes(slicedBytes, this.byteOrder)
        break
      case 4:
        //Long
        return getUInt32FromBytes(slicedBytes, this.byteOrder)
        break
      case 12:
        //Double
        return getDoubleFromBytes(slicedBytes, this.byteOrder)
        break
      default:
        return null
        break
    }
  }

  async getOffsetFieldData(offset, valuesCount, dataType, name) {
    //Figure out how many bytes we need
    const byteCount = reduceTotal(dataType.byteCount) * valuesCount

    //Get the bytes
    const dataBytes = await getUInt8ByteArray(this.file, offset, byteCount)

    //Special case the GeoTiff tags
    if (name === 'GeoKeyDirectoryTag') {
      return 'Found'
    } 

    //Return the values
    return this.getValuesOfType(dataBytes, dataType, byteCount)
  }

  async getGeoKeyDirectoryDataFromFields(fields) {

    //Check that we have all the fields needed
    const geoDirectoryField = fields.find(field => field.id === 34735)
    const geoAsciiField = fields.find(field => field.id === 34737)
    const geoDoubleField = fields.find(field => field.id === 34736)

    if (!geoDirectoryField && (!geoAsciiField || !geoDoubleField)) {
      //One of the required fields is missing
      return
    }

    //Get the directory field info
    //Figure out how many bytes we need
    const byteCount = reduceTotal(geoDirectoryField.dataType.byteCount) * geoDirectoryField.valuesCount

    //Get the bytes
    const directoryBytes = await getUInt8ByteArray(this.file, geoDirectoryField.offset, byteCount)

    //http://geotiff.maptools.org/spec/geotiff2.4.html
    //All 2 byte unsigned short
    //First 4 values are KeyDirectoryVersion, KeyRevision, MinorRevision, NumberOfKeys
    const header = {
      KeyDirectoryVersion: getUInt16FromBytes(
        directoryBytes.slice(0, 2),
        this.byteOrder
      ),
      KeyRevision: getUInt16FromBytes(
        directoryBytes.slice(2, 4),
        this.byteOrder
      ),
      MinorRevision: getUInt16FromBytes(
        directoryBytes.slice(4, 6),
        this.byteOrder
      ),
      NumberOfKeys: getUInt16FromBytes(
        directoryBytes.slice(6, 8),
        this.byteOrder
      ),
    }

    //Next are NumberOfKeys * 4 values
    //KeyID, TIFFTagLocation, Count, Value_Offset
    let keyLookup = []
    let offset = 8
    for (var i = 0; i < header.NumberOfKeys; i++) {
      keyLookup.push({
        KeyID: getUInt16FromBytes(
          directoryBytes.slice(offset, offset + 2),
          this.byteOrder
        ),
        TIFFTagLocation: getUInt16FromBytes(
          directoryBytes.slice(offset + 2, offset + 4),
          this.byteOrder
        ),
        Count: getUInt16FromBytes(
          directoryBytes.slice(offset + 4, offset + 6),
          this.byteOrder
        ),
        Value_Offset: getUInt16FromBytes(
          directoryBytes.slice(offset + 6, offset + 8),
          this.byteOrder
        ),
      })
      offset += 8
    }

    //Loop through each of the key lookups and create a field item
    // return {
    //   id,
    //   name,
    //   dataTypeID,
    //   dataType,
    //   valuesCount,
    //   value,
    //   offset,
    //   data,
    // }

    keyLookup.forEach((lookup) => {
      //Get the name like normal
      const keyName = tiffFields[lookup.KeyID]

      //Get the value
      let value = null
      let dir = null
      let offset = null
      let data = null
      
      //If the TiffTagLocation is 0, then the value offset IS the value
      if (lookup.TIFFTagLocation === 0) {
        value = lookup.Value_Offset
      } else {
        //Value is in another directory, at a specific offset
        dir = lookup.TIFFTagLocation
        offset = lookup.Value_Offset
      }

      //Other dirs are
      //34736: 'GeoDoubleParamsTag'
      //34737: 'GeoAsciiParamsTag'
      let dataTypeID = null
      let dataType = null
      if (dir === 34736) {
        //Value is a Double
        data = geoDoubleField.data[offset]
        dataTypeID = 12
        dataType = DataType.Double
      } else if (dir === 34737) {
        //Value is a string
        data = geoAsciiField.data.slice(offset).split("|")[0]
        dataTypeID = 2
        dataType = DataType.Ascii
      } else {
        data = value
        dataTypeID = 3
        dataType = DataType.Short
      }

      //Check Enum for known values
      if (Object.keys(enumsObject).find((key) => key === keyName)) {
        //If enum contains the given value, return the key
        const matchedEnum = enumsObject[keyName]
        const result = Object.keys(matchedEnum).find(
          (key) => matchedEnum[key] === data
        )
        if (result) { 
          data = result
        }
      }

      const field = {
        id:lookup.KeyID,
        name:keyName,
        dataTypeID,
        dataType,
        valuesCount:1, //TODO : is this always true?
        value,
        offset,
        data,
      }

      fields.push(field)
    })

  }

  getValuesOfType(bytes, dataType) {
    switch (dataType) {
      case DataType.Ascii:
        return String.fromCharCode.apply(null, bytes).trim()
        break
      case DataType.Short:
        return getUInt16sFromBytes(bytes, this.byteOrder)
        break
      case DataType.Long:
        return getUInt32sFromBytes(bytes, this.byteOrder)
        break
      case DataType.Double:
        return getDoublesFromBytes(bytes, this.byteOrder)
        break
      default:
        return null
        break
    }
  }

  getKeyValueFromFieldWithNameOrNull(fields, fieldName, valueKey) {
    const field = fields.find((field) => field.name === fieldName)
    if (!field) {
      return null
    }
    return field[valueKey]
  }

  constructFileSummary() {
    //Name and Resolution
    let successString = `${this.file.name}`

    //File size
    successString += `<br />${roundToDP(this.file.size / 1000 / 1000, 2)}mb`

    //IFD count
    successString += `<br />${this.ifds.length} Image File Director${
      this.ifds.length === 1 ? 'y' : 'ies'
    } (IFDs) found`

    return successString
  }

  getPreviewImage() {}
}

export { TiffReader }
