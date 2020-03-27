const ByteOrder = {
	Null: null,
	BigEndian: 'big',
    LittleEndian: 'little'
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

        //Start reading
        this.startReading()
    }

    async startReading() {
        await this.getHeaderInfo()
        await this.readIFD(this.headerInfo.firstIFDOffset)
        this.onLoadCallback(this.headerInfo)
    }

    async getUInt8ByteArray(offset, length) {
        const buffer = await new Response(this.file.slice(offset, offset+length)).arrayBuffer()
        return new Uint8Array(buffer)
    }

    getUInt16FromBytes(bytes) {
        if (bytes.byteLength !== 2) { console.error("Need 2 bytes for a UInt16"); return null; }
        return new Uint16Array(bytes.slice(0, 2))[0]
    }

    getUInt32FromBytes(bytes) {
        if (bytes.byteLength !== 4) { console.error("Need 4 bytes for a UInt32"); return null; }
        return new Uint32Array(bytes.slice(0, 4))[0]
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

        //Get the field count of the current IFD
        const fieldCountBytes = await this.getUInt8ByteArray(offset, 2)
        const fieldCount = this.getUInt16FromBytes(fieldCountBytes)

        //Each field is 12 bytes long
        //Read each field and store it's bytes
        let allFieldBytes = []
        for (let i=0; i <= fieldCount; i++) {
            const bytes = await this.getUInt8ByteArray(offset + 2 + (i*12), 12) 
            allFieldBytes.push(bytes)
         }

        //Parse each field in turn
        allFieldBytes.forEach(async fieldBytes => {
            await this.parseField(fieldBytes)
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

    async parseField(fieldBytes) {
        console.log(fieldBytes)
    }
}

module.exports = { TiffReader }