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

        //Immediately start reading the file data
        this.startReading()
    }

    async startReading() {
        //Get the header info
        await this.getHeaderInfo()

        //Parse the initial IFD and return the next IFD offset 
        let nextIFDOffset = await this.readIFD(this.headerInfo.firstIFDOffset)

        //Continue parsing IFDs until the next offset is 0
        while (nextIFDOffset > 0) {
            nextIFDOffset = await this.readIFD(nextIFDOffset)
        }
        console.log("Last IFD read successfully")

        //Get the field list and return
        const fieldList = this.ifds[0].fieldDicts.map(fieldDict => fieldDict.fieldName)

        //Run the finished callback
        this.onLoadCallback(fieldList)
    }

    async getUInt8ByteArray(offset, length) {
        //Get an array buffer from the file
        const buffer = await new Response(this.file.slice(offset, offset+length)).arrayBuffer()

        //Return as a UInt8 Array
        return new Uint8Array(buffer)
    }

    getUInt16FromBytes(bytes) {
        //Ensure we have 2 bytes
        if (bytes.byteLength !== 2) { console.error("Need 2 bytes for a UInt16"); return null; }

        //Check byteorder and return using DataView to set endianness appropriately
        if (this.headerInfo.byteOrder === ByteOrder.LittleEndian) {
            return new DataView(bytes.buffer).getUint16(0, true)
        } 
        return new DataView(bytes.buffer).getUint16(0, false)
    }

    getUInt32FromBytes(bytes) {
        //Ensure we have 4 bytes
        if (bytes.byteLength !== 4) { console.error("Need 4 bytes for a UInt32"); return null; }

        //Check byteorder and return using DataView to set endianness appropriately
        if (this.headerInfo.byteOrder === ByteOrder.LittleEndian) {
            return new DataView(bytes.buffer).getUint32(0, true)
        }
        return new DataView(bytes.buffer).getUint32(0, false)
    }

    async getHeaderInfo() {
        console.log("Getting Header Info")
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

        //Store the IFD data
        this.ifds.push({
            offset: offset,
            fieldDicts
        })

        //The next 4 bytes will either be 0 if this was the last IFD, or an offset to where the next one starts
        const nextIFDOffsetBytes = await this.getUInt8ByteArray(offset + 2 + (fieldCount*12), 4)
        const nextIFDOffset = this.getUInt32FromBytes(nextIFDOffsetBytes)
        return nextIFDOffset
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
        //Get the ID + corresponding name
        const fieldID = this.getUInt16FromBytes(fieldBytes.slice(0, 2))
        const fieldName = tiffFields[fieldID]

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
            fieldName,
            dataType,
            valuesCount,
            fieldValue,
            fieldValueIsOffset
        }
    }
}

module.exports = { TiffReader }