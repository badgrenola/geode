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
        console.log(this.ifds)

        //Run the finished callback
        this.onLoadCallback(["Yup"])
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

    getUInt16sFromBytes(bytes) {
        //Ensure we have an even number of bytes
        if (bytes.byteLength %2 != 0) { console.error("Need an even number of bytes for a UInt16 array"); return null; }
        let offset = 0
        return range(bytes.byteLength / 2).map (index => { 
            offset = index * 2
            return this.getUInt16FromBytes(bytes.slice(offset, offset + 2))
        })
    }

    getUInt32sFromBytes(bytes) {
        //Ensure we have an even number of bytes
        let offset = 0
        return range(bytes.byteLength / 4).map (index => { 
            offset = index * 4
            return this.getUInt32FromBytes(bytes.slice(offset, offset + 4))
        })
    }

    getValues(bytes, dataType) {
        switch (dataType) {
            case DataType.Ascii:
                return String.fromCharCode.apply(null, bytes).trim()
                break
            case DataType.Short:
                return this.getUInt16sFromBytes(bytes)
                break
            case DataType.Long:
                return this.getUInt32sFromBytes(bytes)
                break
            default: 
                return null
                break
        }
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
        let fields = []

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
        for (let i=0; i < fieldCount; i++) {
            const fieldDict = await this.parseField(allFieldBytes[i])
            fields.push(fieldDict)
        }

        //Store the IFD data
        this.ifds.push({
            id: this.ifds.length,
            offset: offset,
            fields
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
        const id = this.getUInt16FromBytes(fieldBytes.slice(0, 2))

        //Get the Data Type
        const dataTypeID = this.getUInt16FromBytes(fieldBytes.slice(2, 4))

        //Get the value count
        const valuesCount = this.getUInt32FromBytes(fieldBytes.slice(4, 8))

        //Get the field number
        const value = this.getUInt32FromBytes(fieldBytes.slice(8, 12))

        //Now we have the original data, lets get the 'computed' values
        //Get the data type
        const dataType = this.getDataTypeFromID(dataTypeID)

        //Figure out of the field number is an offset or a value
        const valueIsOffset = (valuesCount * dataType) > 4

        //Get the field name
        const name = tiffFields[id]

        //Get the data the field represents
        const data = await this.getFieldData(value, valueIsOffset, valuesCount, dataType)
        
        return {
            id, 
            name,
            dataType,
            valuesCount,
            value,
            valueIsOffset,
            data
        }
    }

    async getFieldData(fieldValue, fieldValueIsOffset, valuesCount, dataType) {
        //If the field value is not an offset, just return the value
        //TODO - Lookups
        if (!fieldValueIsOffset && valuesCount === 1) { return fieldValue }

        //Get the bytes
        const byteLength = dataType * valuesCount
        const dataBytes = await this.getUInt8ByteArray(fieldValue, byteLength)

        //Get the values from the bytes
        return this.getValues(dataBytes, dataType)
    }
}

module.exports = { TiffReader }