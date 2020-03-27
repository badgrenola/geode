const ByteOrder = {
	Null: null,
	BigEndian: 'big',
    LittleEndian: 'little'
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

        //Start reading
        this.startReading()
    }

    async startReading() {
        await this.getHeaderInfo()
        this.onLoadCallback(this.headerInfo)
    }

    async getHeaderInfo() {

        //Clear the dict
        this.headerInfo = {}

        //Get the first 8 bytes as uint8
        const initialBuffer = await new Response(this.file.slice(0, 8)).arrayBuffer()
        const initialBytes = new Uint8Array(initialBuffer)

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
        const offset = new Uint32Array(initialBytes.slice(4, 8))[0];
        this.headerInfo.offset = offset
    }
}

module.exports = { TiffReader }