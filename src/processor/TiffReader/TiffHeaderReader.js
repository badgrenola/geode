import {
  ByteOrder,
  DataType,
  getUInt8ByteArray,
  getDataFromBytes,
  getDataTypeFromID,
  getDataArrayFromBytes
} from '../helpers/Bytes'
import {reduceTotal} from '../../helpers/jsHelpers'
import { TiffFields } from '../helpers/TiffFields'
import { getGeoKeyDataFields, getGeoKeyData } from '../helpers/GeoTiff'
import { getEnumKeyFromFieldNameAndValue } from '../helpers/Enums'
import { TiffProcessorMessageType } from './TiffProcessorMessageType'
import { TiffType } from './TiffType'

class TiffHeaderReader {

  constructor(tiffReader) {
    //Store the tiff reader instance
    this.tiffReader = tiffReader
  }

  async readHeader(file) {
    console.log('TiffReader : Starting to Read File Header')

    //Reset any state vars
    this.tiffReader.reset()

    //Set the file
    this.tiffReader.file = file

    //Get the header
    const headerReadError = await this.getHeader()
    if (headerReadError) {
      this.tiffReader.sendMessage(TiffProcessorMessageType.ERROR, null, headerReadError)
      return
    }

    //Parse the IFDs
    const parseIFDsError = await this.parseIFDS()
    if (parseIFDsError) {
      this.tiffReader.sendMessage(TiffProcessorMessageType.ERROR, null, parseIFDsError)
      return
    }

    //Once the basic IFD data has been found, parse geotiff specific data
    const geotiffParseError = await this.parseGeoTiff()
    if (geotiffParseError) {
      this.tiffReader.sendMessage(TiffProcessorMessageType.ERROR, null, geotiffParseError)
      return
    }

    //Check if there are known enum values for any of the retrieved fields
    this.populateEnumValues()

    //Determine the tiff type
    this.determineTiffType()

    //Return the header and ifd info
    console.log('TiffReader : Finished Reading File Header')
    this.tiffReader.sendMessage(
      TiffProcessorMessageType.HEADER_LOADED,
      {
        header: this.tiffReader.header,
        ifds: this.tiffReader.ifds,
      }
    )
  }

  async getHeader() {
    //Get the first 8 bytes as uint8
    const initialBytes = await getUInt8ByteArray(this.tiffReader.file, 0, 8)

    //Get the byte order
    this.tiffReader.header.byteOrder = ByteOrder.LittleEndian
    if (initialBytes[0] === 77 && initialBytes[1] === 77) {
      this.tiffReader.header.byteOrder = ByteOrder.BigEndian
    }

    //Query the magic number to ensure this is a tiff fil
    if (
      (this.tiffReader.header.byteOrder === ByteOrder.LittleEndian &&
        initialBytes[2] != 42) ||
      (this.tiffReader.header.byteOrder === ByteOrder.BigEndian && initialBytes[3] != 42)
    ) {
      return 'Not a tiff file'
    }

    //Get the first section offset
    this.tiffReader.header.firstIFDOffset = getDataFromBytes(
      initialBytes.slice(4, 8),
      DataType.Long,
      this.tiffReader.header.byteOrder
    )

    //Finally store the name and size
    this.tiffReader.header.fileName = this.tiffReader.file.name
    this.tiffReader.header.fileSize = this.tiffReader.file.size
  }

  async parseIFDS() {
    //While an offset to the next IFD is known, parse that IFD
    //If an EXIF IFD is found parse it too

    //TODO - This data flow could be cleaned up

    //Store whether an EXIF IFD has been found
    let exifIFDOffset = null

    //Get the initial offset and start the loop
    let ifdOffset = this.tiffReader.header.firstIFDOffset
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
      //Parse the EXIF fields to a new IFD
      let parseExifIFDResults = await this.parseIFDAtOffset(exifIFDOffset)
      if (parseExifIFDResults.error) {
        return parseExifIFDResults.error
      }

      //TODO - There's definitely a better way to do this
      //Merge the EXIF IFD fields into the first IFD, removing the EXIF-only IFD
      const exifIFD = this.tiffReader.ifds.pop()
      exifIFD.fields.forEach(field => {
        this.tiffReader.ifds[0].fields.push(field)
      })
    }
  }

  async parseIFDAtOffset(offset) {
    //Store field dicts
    let fields = []

    //Get the field count of the current IFD
    const fieldCountBytes = await getUInt8ByteArray(this.tiffReader.file, offset, 2)
    const fieldCount = getDataFromBytes(
      fieldCountBytes,
      DataType.Short,
      this.tiffReader.header.byteOrder
    )

    //Each field is 12 bytes long
    //Read each field and store it's bytes
    let allFieldBytes = []
    for (let i = 0; i < fieldCount; i++) {
      const bytes = await getUInt8ByteArray(this.tiffReader.file, offset + 2 + i * 12, 12)
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
    this.tiffReader.ifds.push({
      id: this.tiffReader.ifds.length,
      offset: offset,
      fields,
    })

    //Check if the fields contain an Exif IFD tag
    let exifIFDField = fields.find((field) => field.dataTypeID === 13)

    //The next 4 bytes will either be 0 if this was the last IFD, or an offset to where the next one starts
    const nextIFDOffsetBytes = await getUInt8ByteArray(
      this.tiffReader.file,
      offset + 2 + fieldCount * 12,
      4
    )
    const nextIFDOffset = getDataFromBytes(nextIFDOffsetBytes, DataType.Long, this.tiffReader.header.byteOrder)

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
      this.tiffReader.header.byteOrder
    )

    //Get the field name
    const name = TiffFields[id]

    //Get the Data Type
    const dataTypeID = getDataFromBytes(
      fieldBytes.slice(2, 4),
      DataType.Short,
      this.tiffReader.header.byteOrder
    )

    //Get the data type
    const dataType = getDataTypeFromID(dataTypeID)

    //Get the value count
    const valuesCount = getDataFromBytes(
      fieldBytes.slice(4, 8),
      DataType.Long,
      this.tiffReader.header.byteOrder
    )

    //Figure out of the field number is an offset or a value
    const valueIsOffset =
      valuesCount * reduceTotal(dataType.byteCount) > 4 || dataType.isOffset

    //Get either the raw value, or the offset value
    let value = null
    let offset = null
    if (!valueIsOffset) {
      value = getDataFromBytes(fieldBytes.slice(8, 12), dataType, this.tiffReader.header.byteOrder)
    } else {
      offset = getDataFromBytes(fieldBytes.slice(8, 12), DataType.Long, this.tiffReader.header.byteOrder)
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
    const dataBytes = await getUInt8ByteArray(this.tiffReader.file, offset, byteCount)

    //Return the values
    return getDataArrayFromBytes(dataBytes, dataType, this.tiffReader.header.byteOrder)
  }

  async parseGeoTiff() {
    for (let i = 0;i < this.tiffReader.ifds.length; i++) {
      const geoFields = await getGeoKeyDataFields(this.tiffReader.ifds[i].fields)
      if (geoFields) {
        const geoKeyFields = await getGeoKeyData(geoFields, this.tiffReader.file, this.tiffReader.header.byteOrder)
        geoKeyFields.forEach(geoKeyField => {
          this.tiffReader.ifds[i].fields.push(geoKeyField)
        })
      }
    }
  }

  populateEnumValues() {
    this.tiffReader.ifds.forEach(ifd => {
      ifd.fields.forEach(field => {
        field.enumValue = getEnumKeyFromFieldNameAndValue(field.name, field.value)
      })
    })
  }

  determineTiffType() {
    // tag StripOffsets = 273
    // tag TileOffsets = 324
    const isStrip = this.tiffReader.ifds[0].fields.find(field => field.id === 273)
    const isTiled = this.tiffReader.ifds[0].fields.find(field => field.id === 324)
    if (isStrip) { this.tiffReader.tiffType = TiffType.STRIPS }
    else if (isTiled) { this.tiffReader.tiffType = TiffType.TILED }
  }
}

export { TiffHeaderReader }