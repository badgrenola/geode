import { range, rangeSkipping } from '../../helpers/jsHelpers'

const ByteOrder = {
  Null: null,
  BigEndian: 'big',
  LittleEndian: 'little',
}

//DATA TYPES
//http://paulbourke.net/dataformats/tiff/tiff_summary.pdf
const DataType = {
  Nil: { id: 0 },
  Byte: { id: 1, byteCount: [1] }, //8-bit unsigned
  Ascii: { id: 2, byteCount: [1] }, //8-bit null terminated
  Short: { id: 3, byteCount: [2] }, //16-bit unsigned
  Long: { id: 4, byteCount: [4] }, //32-bit unsigned
  Rational: { id: 5, byteCount: [4, 4] }, //2x32-bit unsigned
  SByte: { id: 6, byteCount: [1] }, //8-bit signed
  Undefine: { id: 7, byteCount: [1] }, //8-bit byte
  SShort: { id: 8, byteCount: [2] }, //16-bit signed
  SLong: { id: 9, byteCount: [4] }, //32-bit signed
  SRational: { id: 10, byteCount: [4, 4] }, //2x32-bit signed
  Float: { id: 11, byteCount: [4] }, //4-bytes single precision
  Double: { id: 12, byteCount: [8] }, //8-bytes double precision
  ExifIFD: { id: 13, byteCount: [4], isOffset: true }, //https://www.awaresystems.be/imaging/tiff/tifftags/exififd.html
}

function getDataTypeFromID(id) {
  const matchingKey = Object.keys(DataType).find(
    (dataTypeKey) => DataType[dataTypeKey].id === id
  )
  if (matchingKey) {
    return DataType[matchingKey]
  }
  return null
}

function valueIsValidForDataType(value, dataType, noVal) {
  // https://en.wikipedia.org/wiki/Half-precision_floating-point_format
  // "Integers above 65519 are rounded to "infinity" if using round-to-even, or above 65535 if using round-to-zero, or above 65504 if using round-to-infinity."
    
  switch (dataType.id) {
    case 3: //SHORT
      return value !== noVal && value <= 65519
    case 11: //FLOAT
      return value.toPrecision(4) !== noVal && value <= ((2**32)/2)-1
    default: 
      return false
  }
}


// BYTE ARRAY FUNCTION
async function getUInt8ByteArray(file, offset, length) {
  //Get an array buffer from the file
  const buffer = await new Response(
    file.slice(offset, offset + length)
  ).arrayBuffer()

  //Return as a UInt8 Array
  return new Uint8Array(buffer)
}

function getDataFromBytes(bytes, dataType, byteOrder) {
  //Check byteorder and return using DataView to set endianness appropriately
  switch (dataType.id) {
    case 1: //ASCII
      return String.fromCharCode.apply(null, bytes).trim()
    case 2: //ASCII
      return String.fromCharCode.apply(null, bytes).trim()
    case 3: //Short
      return new DataView(bytes.buffer).getUint16(0, byteOrder === ByteOrder.LittleEndian)
    case 4: //Long
      return new DataView(bytes.buffer).getUint32(0, byteOrder === ByteOrder.LittleEndian)
    case 5: //Rational
      return new DataView(bytes.buffer).getUint32(0, byteOrder === ByteOrder.LittleEndian)
    case 7: //Undefine
      return String.fromCharCode.apply(null, bytes).trim()
    case 11: //Float
      return new DataView(bytes.buffer).getFloat32(0, byteOrder === ByteOrder.LittleEndian)
    case 12: //Double
      return new DataView(bytes.buffer).getFloat64(0, byteOrder === ByteOrder.LittleEndian)
    default: 
      return null
  }
}

function getDataArrayFromBytes(bytes, dataType, byteOrder, skip) {
  let offset = 0
  let byteCount = dataType.byteCount[0]

  let rangeVal = Math.floor(bytes.byteLength / byteCount)

  let byteRange = null;
  if (skip) {
    byteRange = rangeSkipping(rangeVal, skip)
  } else {
    byteRange = range(rangeVal)
  }

  const result = byteRange.map((index) => {
    offset = index * byteCount
    const byteSlice = bytes.slice(offset, offset + byteCount)
    return getDataFromBytes(byteSlice, dataType, byteOrder)
  })
  
  //If data type is ascii, merge the results
  if ([1, 2, 7].includes(dataType.id)) {
    return result.join("")
  }
  return result

}




async function getDataArrayFromFileBuffer(file, byteOffset, byteCount, dataType, byteOrder, sysByteOrder, skipValue, rowLengthForTileSkip) {
  //If byte order and system byte order is the same we can do a direct convert to the arrays of the required type.
  //Right now, we only support files that match the system byte order so <thumbs up emoticon>
  if (byteOrder !== sysByteOrder) { return null } 

  //Slice the buffer to the required size
  const buffer = await new Response(
    file.slice(byteOffset, byteOffset + byteCount)
  ).arrayBuffer()

  //Construct the filter functions
  let filterFunc = (_, i) => i%skipValue === 0
  if (rowLengthForTileSkip) {
    //We've been given a rowLength.
    //Thinking of the results as a square of rowLength x rowLength, we'll skip rows based on skipValue
    filterFunc = (_, i) => (i%skipValue === 0) && (Math.floor(i/rowLengthForTileSkip)%skipValue === 0)
  }

  //Switch on the datatype to return the values directly
  switch (dataType) {
    case DataType.Byte:
      return new Uint8Array(buffer).filter(filterFunc)
    case DataType.Ascii:
      return [String.fromCharCode.apply(null, buffer).trim()]
    case DataType.Short:
      return new Uint16Array(buffer).filter(filterFunc)
    case DataType.Long:
      return new Uint32Array(buffer).filter(filterFunc)
    case DataType.Undefine:
      return new Int8Array(buffer).filter(filterFunc)
    case DataType.SShort:
      return new Int16Array(buffer).filter(filterFunc)
    case DataType.SLong:
      return new Int32Array(buffer).filter(filterFunc)
    case DataType.Float:
      return new Float32Array(buffer).filter(filterFunc)
    case DataType.Double:
      return new Float64Array(buffer).filter(filterFunc)
    default: 
      return null
  }
}

async function getEmptyDataArrayFromCount(byteCount, dataType) {
  //Switch on the datatype to return the values directly
  switch (dataType) {
    case DataType.Byte:
      return new Uint8Array(byteCount)
    case DataType.Ascii:
      return [" ".repeat(byteCount)]
    case DataType.Short:
      return new Uint16Array(byteCount)
    case DataType.Long:
      return new Uint32Array(byteCount)
    case DataType.Undefine:
      return new Int8Array(byteCount)
    case DataType.SShort:
      return new Int16Array(byteCount)
    case DataType.SLong:
      return new Int32Array(byteCount)
    case DataType.Float:
      return new Float32Array(byteCount)
    case DataType.Double:
      return new Float64Array(byteCount)
    default: 
      return null
  }
}



export { ByteOrder, DataType, getDataTypeFromID, getUInt8ByteArray, getDataFromBytes, getDataArrayFromBytes, valueIsValidForDataType, getDataArrayFromFileBuffer, getEmptyDataArrayFromCount }