import { range } from '../../helpers/jsHelpers'

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
    case 12: //Double
      return new DataView(bytes.buffer).getFloat64(0, byteOrder === ByteOrder.LittleEndian)
    default: 
      return null
  }
}

function getDataArrayFromBytes(bytes, dataType, byteOrder) {
  let offset = 0
  let byteCount = dataType.byteCount[0]
  const result = range(bytes.byteLength / byteCount).map((index) => {
    offset = index * byteCount
    const byteSlice = bytes.slice(offset, offset + byteCount)
    return getDataFromBytes(byteSlice, dataType, byteOrder)
  })
  
  //If data type is ascii, merge the results
  if ([1, 2].includes(dataType.id)) {
    return result.join("")
  }
  return result

}

export { ByteOrder, DataType, getDataTypeFromID, getUInt8ByteArray, getDataFromBytes, getDataArrayFromBytes}