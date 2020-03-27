const ByteOrder = {
	Null: null,
	BigEndian: 'big',
    LittleEndian: 'little'
}

const DataType = {
	Nil: 0,
	Ascii: 1,
	Short: 2,
	Long: 4,
	Double: 8
}


const range = (length) => [...Array(length).keys()]

class TiffReader {
    constructor(file, onLoadCallback){
        console.log("TiffReader : Reading " + file.name)        

        //Store the file
        this.file = file

        //Store the callback
        this.onLoadCallback = onLoadCallback

        //Setup the required vars
        this.headerInfo = {}
        this.ifds = []

        //Start reading
        this.startReading()
    }

    async startReading() {
        await this.getHeaderInfo()
        await this.readIFD(this.headerInfo.firstIFDOffset)
        this.onLoadCallback(`${this.ifds[0].fieldDicts.length} Fields Found in the first IFD`)
    }

    async getUInt8ByteArray(offset, length) {
        const buffer = await new Response(this.file.slice(offset, offset+length)).arrayBuffer()
        return new Uint8Array(buffer)
    }

    getUInt16FromBytes(bytes) {
        if (bytes.byteLength !== 2) { console.error("Need 2 bytes for a UInt16"); return null; }
        if (this.headerInfo.byteOrder === ByteOrder.LittleEndian) {
            return new DataView(bytes.buffer).getUint16(0, true)
        } 
        return new DataView(bytes.buffer).getUint16(0, false)
    }

    getUInt32FromBytes(bytes) {
        if (bytes.byteLength !== 4) { console.error("Need 4 bytes for a UInt32"); return null; }
        if (this.headerInfo.byteOrder === ByteOrder.LittleEndian) {
            return new DataView(bytes.buffer).getUint32(0, true)
        }
        return new DataView(bytes.buffer).getUint32(0, false)
    }

    async getHeaderInfo() {

        //Clear the dict
        this.headerInfo = {}

        //Get the first 8 bytes as uint8
        const initialBytes = await this.getUInt8ByteArray(0, 8)

        //Query the byte order
        if (initialBytes[0] === 73 && initialBytes[1] === 73) {
            this.headerInfo.byteOrder = ByteOrder.LittleEndian
        } else if (initialBytes[0] === 77 && initialBytes[1] === 77) {
            this.headerInfo.byteOrder = ByteOrder.BigEndian
        }

        //Query the magic number to ensure this is a tiff fil
        if (initialBytes[2] != 42) {
            console.error(initialBytes, "Not a tiff file")
        } else {
            this.headerInfo.isTiff = true
        }

        //Get the first section offset
        const offset = this.getUInt32FromBytes(initialBytes.slice(4, 8))
        this.headerInfo.firstIFDOffset = offset
    }

    async readIFD(offset) {
        
        console.log(`Reading IFD starting at offset : ${offset}`)
        
        //Store field dicts
        let fieldDicts = []

        //Get the field count of the current IFD
        const fieldCountBytes = await this.getUInt8ByteArray(offset, 2)
        const fieldCount = this.getUInt16FromBytes(fieldCountBytes)

        //Each field is 12 bytes long
        //Read each field and store it's bytes
        let allFieldBytes = []
        for (let i=0; i < fieldCount; i++) {
            const bytes = await this.getUInt8ByteArray(offset + 2 + (i*12), 12) 
            allFieldBytes.push(bytes)
         }

        //Parse each field in turn
        allFieldBytes.forEach(async fieldBytes => {
            const fieldDict = await this.parseField(fieldBytes)
            fieldDicts.push(fieldDict)
        })

        this.ifds.push({
            offset: offset,
            fieldDicts
        })

        //The next 4 bytes will either be 0 if this was the last IFD, or an offset to where the next one starts
        const nextIFDOffsetBytes = await this.getUInt8ByteArray(offset + 2 + (fieldCount*12), 4)
        const nextIFDOffset = this.getUInt32FromBytes(nextIFDOffsetBytes)
        if (nextIFDOffset > 0) {
            this.readIFD(nextIFDOffset)
        } else {
            console.log("Last IFD read successfully")
        }
    }

    getDataTypeFromID(id) {
        switch(id){
            case 2:
                return DataType.Ascii
                break
            case 3:
                return DataType.Short
                break
            case 4:
                return DataType.Long
                break
            case 12:
                return DataType.Double
                break
            default: 
                break
        }
    }

    async parseField(fieldBytes) {
        /*

        #Get the ID of the field. This is the first 2 bytes as an int
        fieldID = int.from_bytes(fieldBytes[0:2], byteOrder)

        #Lookup the ID to get the field Name
        fieldName = fieldNames[fieldID]

        #Now get the data type of the field. This is the 3rd/4th byte of the field
        fieldDataType = getFieldDataTypeFromInt(int.from_bytes(fieldBytes[2:4], byteOrder))

        #Count the values in the field. This is bytes 5-8
        fieldValueCount = int.from_bytes(fieldBytes[4:8], byteOrder)

        #Get the field's number. This could be a value or an offset. It's the final 4 bytes
        fieldNumber = int.from_bytes(fieldBytes[8:], byteOrder)

        #Now figure out if that's a value or an offset
        fieldNumberIsOffset = (fieldValueCount * fieldDataType.value) > 4

        */

        //Get the ID
        const fieldID = this.getUInt16FromBytes(fieldBytes.slice(0, 2))

        //Get the Data Type
        const dataTypeID = this.getUInt16FromBytes(fieldBytes.slice(2, 4))
        const dataType = this.getDataTypeFromID(dataTypeID)

        //Get the value count
        const valuesCount = this.getUInt32FromBytes(fieldBytes.slice(4, 8))

        //Get the field number
        const fieldValue = this.getUInt32FromBytes(fieldBytes.slice(8, 12))

        //Figure out of the field number is an offset or a value
        const fieldValueIsOffset = (valuesCount * dataType) > 4
        
        return {
            fieldID, 
            dataType,
            valuesCount,
            fieldValue,
            fieldValueIsOffset
        }

    }
}

module.exports = { TiffReader }