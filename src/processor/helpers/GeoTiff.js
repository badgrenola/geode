import { reduceTotal } from '../../helpers/jsHelpers'
import {
  DataType,
  getUInt8ByteArray,
  getDataFromBytes,
} from '../helpers/Bytes'
import { TiffFields } from './TiffFields'

async function getGeoKeyDataFields(fields) {
  //Check that we have all the fields needed
  const directoryField = fields.find(field => field.id === 34735)
  const asciiField = fields.find(field => field.id === 34737)
  const doubleField = fields.find(field => field.id === 34736)

  if (!directoryField && (!asciiField || !doubleField)) {
    //One of the required fields is missing
    return null
  }

  return {
    directory: directoryField,
    ascii: asciiField,
    double: doubleField
  }
}

async function getGeoKeyData(geoFields, file, byteOrder) {
  //Get the directory field info
  //Figure out how many bytes we need
  const byteCount = reduceTotal(geoFields.directory.dataType.byteCount) * geoFields.directory.valuesCount

  //Get the bytes
  const directoryBytes = await getUInt8ByteArray(file, geoFields.directory.offset, byteCount)

  //Get the header 
  const geoKeyHeader = await getGeoKeyHeader(directoryBytes, byteOrder)

  //Get the fields
  const geoFieldLookups = await getGeoKeyFieldLookups(directoryBytes, geoKeyHeader, byteOrder)
  const geoKeyFields = await getGeoKeyFields(geoFieldLookups, geoFields)
  
  return geoKeyFields
  
}

async function getGeoKeyHeader(directoryBytes, byteOrder) {
  //http://geotiff.maptools.org/spec/geotiff2.4.html
  //All 2 byte unsigned short
  //First 4 values are KeyDirectoryVersion, KeyRevision, MinorRevision, NumberOfKeys
  return {
    KeyDirectoryVersion: getDataFromBytes(
      directoryBytes.slice(0, 2),
      DataType.Short,
      byteOrder
    ),
    KeyRevision: getDataFromBytes(
      directoryBytes.slice(2, 4),
      DataType.Short,
      byteOrder
    ),
    MinorRevision: getDataFromBytes(
      directoryBytes.slice(4, 6),
      DataType.Short,
      byteOrder
    ),
    NumberOfKeys: getDataFromBytes(
      directoryBytes.slice(6, 8),
      DataType.Short,
      byteOrder
    ),
  }
}

async function getGeoKeyFieldLookups(directoryBytes, header, byteOrder) {
  //Next are NumberOfKeys * 4 values
  //KeyID, TIFFTagLocation, Count, Value_Offset
  let geoFieldLookups = []
  let offset = 8
  for (var i = 0; i < header.NumberOfKeys; i++) {
    geoFieldLookups.push({
      KeyID: getDataFromBytes(
        directoryBytes.slice(offset, offset + 2),
        DataType.Short,
        byteOrder
      ),
      TIFFTagLocation: getDataFromBytes(
        directoryBytes.slice(offset + 2, offset + 4),
        DataType.Short,
        byteOrder
      ),
      Count: getDataFromBytes(
        directoryBytes.slice(offset + 4, offset + 6),
        DataType.Short,
        byteOrder
      ),
      Value_Offset: getDataFromBytes(
        directoryBytes.slice(offset + 6, offset + 8),
        DataType.Short,
        byteOrder
      ),
    })
    offset += 8
  }
  return geoFieldLookups
}

async function getGeoKeyFields(geoKeyLookups, geoFields) {

  //Store all the fields
  let geoKeyFields = []

  //Loop through the lookups
  geoKeyLookups.forEach((lookup) => {
    //Get the name like normal
    const keyName = TiffFields[lookup.KeyID]

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
      data = geoFields.double.data[offset]
      dataTypeID = 12
      dataType = DataType.Double
    } else if (dir === 34737) {
      //Value is a string
      data = geoFields.ascii.data.slice(offset).split("|")[0]
      dataTypeID = 2
      dataType = DataType.Ascii
    } else {
      data = value
      dataTypeID = 3
      dataType = DataType.Short
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

    geoKeyFields.push(field)
  })

  return geoKeyFields

}

export { getGeoKeyDataFields, getGeoKeyData }