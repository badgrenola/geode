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
  ExifIFD: { id: 13, byteCount: [4], isOffset: true } //https://www.awaresystems.be/imaging/tiff/tifftags/exififd.html
};

function getDataTypeFromID(id) {
  const matchingKey = Object.keys(DataType).find(
    dataTypeKey => DataType[dataTypeKey].id === id
  );
  if (matchingKey) {
    return DataType[matchingKey];
  }
  return null;
}
