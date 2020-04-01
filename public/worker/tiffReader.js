const range = (length) => [...Array(length).keys()]
const roundToDP = (num, dp) => {
  const divisor = Math.pow(10, dp)
  return Math.round((num + Number.EPSILON) * divisor) / divisor
}
const reduceTotal = (valuesArray) => {
  return valuesArray.reduce((total, value) => total + value)
}

class TiffReader {
  constructor(file, onLoadCallback, onErrorCallback) {
    console.log('TiffReader : Reading ' + file.name)

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
    this.onLoadCallback(
      this.ifds,
      this.constructFileSummary(),
      this.constructIFDSummaries()
    )
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
      data = await this.getOffsetFieldData(offset, valuesCount, dataType)
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

  async getOffsetFieldData(offset, valuesCount, dataType) {
    //Figure out how many bytes we need
    const byteCount = reduceTotal(dataType.byteCount) * valuesCount

    //Get the bytes
    const dataBytes = await getUInt8ByteArray(this.file, offset, byteCount)

    //Return the values
    return this.getValuesOfType(dataBytes, dataType, byteCount)
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

  constructIFDSummaries() {
    /*
            That was a XxY, Zbit, Grayscale/RGB image, with Z tiles (each XxY).
            It has/doesn't have GDAL metadata.
            It has/doesn't have GeoAscii params.
            ModelPixelScale is X, Y, Z
        */

    return this.ifds.map((ifd, index) => {
      //IFD one
      let successString = `<span><u>IFD ${index + 1} Details</u></span>`

      //First IFD fields
      const fields = ifd.fields

      //Get all required data
      const w = this.getKeyValueFromFieldWithNameOrNull(
        fields,
        'ImageWidth',
        'data'
      )
      const h = this.getKeyValueFromFieldWithNameOrNull(
        fields,
        'ImageLength',
        'data'
      )
      const bits = this.getKeyValueFromFieldWithNameOrNull(
        fields,
        'BitsPerSample',
        'data'
      )
      const samples = this.getKeyValueFromFieldWithNameOrNull(
        fields,
        'SamplesPerPixel',
        'data'
      )
      const tileCount = this.getKeyValueFromFieldWithNameOrNull(
        fields,
        'TileOffsets',
        'valuesCount'
      )
      const tileW = this.getKeyValueFromFieldWithNameOrNull(
        fields,
        'TileWidth',
        'data'
      )
      const tileH = this.getKeyValueFromFieldWithNameOrNull(
        fields,
        'TileLength',
        'data'
      )
      const stripCount = this.getKeyValueFromFieldWithNameOrNull(
        fields,
        'StripOffsets',
        'valuesCount'
      )
      const rowsPerStrip = this.getKeyValueFromFieldWithNameOrNull(
        fields,
        'RowsPerStrip',
        'valuesCount'
      )
      const gdalMeta = this.getKeyValueFromFieldWithNameOrNull(
        fields,
        'GDAL_METADATA',
        'data'
      )
      const geoAscii = this.getKeyValueFromFieldWithNameOrNull(
        fields,
        'GeoAsciiParamsTag',
        'data'
      )
      const modelPixelScale = this.getKeyValueFromFieldWithNameOrNull(
        fields,
        'ModelPixelScaleTag',
        'data'
      )

      //Resolution
      successString += `<br />${w} x ${h}`

      //Bit-rate
      successString += '<br />'
      if (bits) {
        //We need to handle RGB images, which store bits in an array
        //All channels will have same bit rate so we can just grab the first value
        let comparitor = bits
        if (typeof bits === 'array' || typeof bits === 'object') {
          comparitor = bits[0]
        }
        switch (comparitor) {
          case 8:
            successString += '8-bit'
            break
          case 16:
            successString += '16-bit'
            break
          case 32:
            successString += '32-bit'
            break
          default:
            break
        }
      }

      //Grayscale/RGB/RGBA
      successString += '<br />'
      switch (samples) {
        case 1:
          successString += 'Grayscale'
          break
        case 3:
          successString += 'RGB'
          break
        case 4:
          successString += 'RGBA'
          break
        default:
          break
      }

      //Tile count + resolution
      if (tileCount && tileW && tileH) {
        successString += '<br />'
        successString += `${tileCount} tiles`
        successString += ` (each ${tileW} x ${tileH})`
      }

      //Strip count + rows per strip
      if (stripCount && rowsPerStrip) {
        successString += '<br />'
        successString += `${stripCount} strips`
        successString += ` (each ${rowsPerStrip} row${
          rowsPerStrip === 1 ? '' : 's'
        })`
      }

      //GDAL meta
      successString += '<br />'
      if (gdalMeta) {
        successString += 'GDAL Metadata.'
      } else {
        successString += 'No GDAL Metadata.'
      }

      //Geo Ascii
      successString += '<br />'
      if (geoAscii) {
        successString += 'Geo Ascii params.'
      } else {
        successString += 'No Geo Ascii params.'
      }

      if (modelPixelScale) {
        successString += `<br />Model Pixel Scale is ${roundToDP(
          modelPixelScale[0],
          4
        )} x ${roundToDP(modelPixelScale[1], 4)}.`
      }

      return successString
    })
  }

  getPreviewImage() {}
}

module.exports = { TiffReader }
