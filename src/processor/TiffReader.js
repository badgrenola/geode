import {
  ByteOrder,
  DataType,
  getUInt8ByteArray,
  getDataFromBytes,
  getDataTypeFromID,
  getDataArrayFromBytes
} from './helpers/Bytes'
import {reduceTotal} from '../helpers/jsHelpers'
import { TiffFields } from './helpers/TiffFields'
import { getGeoKeyDataFields, getGeoKeyData } from './helpers/GeoTiff'
import { getEnumKeyFromFieldNameAndValue } from './helpers/Enums'

class TiffReader {
  constructor(onLoad, onError) {
    this.onLoad = onLoad
    this.onError = onError

    //Store state vars
    this.file = null
    this.header = {}
    this.ifds = []
  }

  reset() {
    this.file = null
    this.header = {}
    this.ifds = []
  }

  async startReading(file) {
    console.log('TiffReader : Starting to Read File')

    //Reset any state vars
    this.reset()

    //Set the file
    this.file = file

    //Get the header
    const headerReadError = await this.getHeader()
    if (headerReadError) {
      this.onError(headerReadError)
      return
    }

    //Parse the IFDs
    const parseIFDsError = await this.parseIFDS()
    if (parseIFDsError) {
      this.onError(parseIFDsError)
      return
    }

    //Once the basic IFD data has been found, parse geotiff specific data
    const geotiffParseError = await this.parseGeoTiff()
    if (geotiffParseError) {
      this.onError(geotiffParseError)
      return
    }

    //Finally check if there are known enum values for any of the retrieved fields
    this.populateEnumValues()

    //Return the header and ifd info
    this.onLoad({
      header: this.header,
      ifds: this.ifds,
    })
  }

  async getHeader() {
    //Get the first 8 bytes as uint8
    const initialBytes = await getUInt8ByteArray(this.file, 0, 8)

    //Get the byte order
    this.header.byteOrder = ByteOrder.LittleEndian
    if (initialBytes[0] === 77 && initialBytes[1] === 77) {
      this.header.byteOrder = ByteOrder.BigEndian
    }

    //Query the magic number to ensure this is a tiff fil
    if (
      (this.header.byteOrder === ByteOrder.LittleEndian &&
        initialBytes[2] != 42) ||
      (this.header.byteOrder === ByteOrder.BigEndian && initialBytes[3] != 42)
    ) {
      return 'Not a tiff file'
    }

    //Get the first section offset
    this.header.firstIFDOffset = getDataFromBytes(
      initialBytes.slice(4, 8),
      DataType.Long,
      this.header.byteOrder
    )

    //Finally store the name and size
    this.header.fileName = this.file.name
    this.header.fileSize = this.file.size
  }

  async parseIFDS() {
    //While an offset to the next IFD is known, parse that IFD
    //If an EXIF IFD is found parse it too

    //TODO - This data flow could be cleaned up

    //Store whether an EXIF IFD has been found
    let exifIFDOffset = null

    //Get the initial offset and start the loop
    let ifdOffset = this.header.firstIFDOffset
    while (ifdOffset && ifdOffset > 0) {
      //Parse the single IFD. This returns an object with error, nextIFDOffset, and exifIFDOffset keys
      let parseIFDResults = await this.parseIFDAtOffset(ifdOffset)

      //Check for errors
      if (parseIFDResults.error) {
        return parseIFDResults.error
      }

      //Check for the EXIF IFD
      if (parseIFDResults.exifIFDOffset) {
        exifIFDOffset = parseIFDResults.exifIFDOffset
      }

      //Check for next offset
      if (parseIFDResults.nextIFDOffset) {
        //Set the next IFD offset to continue the loop
        ifdOffset = parseIFDResults.nextIFDOffset
      } else {
        //Default to 0 to stop the loop
        ifdOffset = 0
      }
    }

    //Finally parse the exif offset if found
    if (exifIFDOffset) {
      let parseExifIFDResults = await this.parseIFDAtOffset(exifIFDOffset)
      if (parseExifIFDResults.error) {
        return parseExifIFDResults.error
      }
    }
  }

  async parseIFDAtOffset(offset) {
    //Store field dicts
    let fields = []

    //Get the field count of the current IFD
    const fieldCountBytes = await getUInt8ByteArray(this.file, offset, 2)
    const fieldCount = getDataFromBytes(
      fieldCountBytes,
      DataType.Short,
      this.header.byteOrder
    )

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
        return 'Could not parse field dict'
      }
      fields.push(fieldDict)
    }

    //Store the IFD data
    this.ifds.push({
      id: this.ifds.length,
      offset: offset,
      fields,
    })

    //Check if the fields contain an Exif IFD tag
    let exifIFDField = fields.find((field) => field.dataTypeID === 13)

    //The next 4 bytes will either be 0 if this was the last IFD, or an offset to where the next one starts
    const nextIFDOffsetBytes = await getUInt8ByteArray(
      this.file,
      offset + 2 + fieldCount * 12,
      4
    )
    const nextIFDOffset = getDataFromBytes(nextIFDOffsetBytes, DataType.Long, this.header.byteOrder)

    return {
      error: null,
      exifIFDOffset: exifIFDField ? exifIFDField.offset : null,
      nextIFDOffset
    }
  }

  async parseField(fieldBytes) {
    //Get the ID + corresponding name
    const id = getDataFromBytes(
      fieldBytes.slice(0, 2),
      DataType.Short,
      this.header.byteOrder
    )

    //Get the field name
    const name = TiffFields[id]

    //Get the Data Type
    const dataTypeID = getDataFromBytes(
      fieldBytes.slice(2, 4),
      DataType.Short,
      this.header.byteOrder
    )

    //Get the data type
    const dataType = getDataTypeFromID(dataTypeID)

    //Get the value count
    const valuesCount = getDataFromBytes(
      fieldBytes.slice(4, 8),
      DataType.Long,
      this.header.byteOrder
    )

    //Figure out of the field number is an offset or a value
    const valueIsOffset =
      valuesCount * reduceTotal(dataType.byteCount) > 4 || dataType.isOffset

    //Get either the raw value, or the offset value
    let value = null
    let offset = null
    if (!valueIsOffset) {
      value = getDataFromBytes(fieldBytes.slice(8, 12), dataType, this.header.byteOrder)
    } else {
      offset = getDataFromBytes(fieldBytes.slice(8, 12), DataType.Long, this.header.byteOrder)
    }

    //Get the data the field represents
    let data = value
    if (offset) {
      data = await this.getOffsetFieldData(offset, valuesCount, dataType)
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

  async getOffsetFieldData(offset, valuesCount, dataType) {
    //Figure out how many bytes we need
    const byteCount = reduceTotal(dataType.byteCount) * valuesCount

    //Get the bytes
    const dataBytes = await getUInt8ByteArray(this.file, offset, byteCount)

    //Return the values
    return getDataArrayFromBytes(dataBytes, dataType, this.header.byteOrder)
  }

  async parseGeoTiff() {
    for (let i = 0;i < this.ifds.length; i++) {
      const geoFields = await getGeoKeyDataFields(this.ifds[i].fields)
      if (geoFields) {
        const geoKeyFields = await getGeoKeyData(geoFields, this.file, this.header.byteOrder)
        console.log(geoKeyFields)
        geoKeyFields.forEach(geoKeyField => {
          this.ifds[i].fields.push(geoKeyField)
        })
      }
    }
  }

  populateEnumValues() {
    this.ifds.forEach(ifd => {
      ifd.fields.forEach(field => {
        field.enumValue = getEnumKeyFromFieldNameAndValue(field.name, field.value)
      })
    })
  }

}

export { TiffReader }
