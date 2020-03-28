const ByteOrder = {
	Null: null,
	BigEndian: 'big',
    LittleEndian: 'little'
}

async function getUInt8ByteArray(file, offset, length) {
    //Get an array buffer from the file
    const buffer = await new Response(file.slice(offset, offset+length)).arrayBuffer()

    //Return as a UInt8 Array
    return new Uint8Array(buffer)
}

function getUInt16FromBytes(bytes, byteOrder) {
    //Ensure we have 2 bytes
    if (bytes.byteLength !== 2) { console.error("Need 2 bytes for a UInt16"); return null; }

    //Check byteorder and return using DataView to set endianness appropriately
    if (byteOrder === ByteOrder.LittleEndian) {
        return new DataView(bytes.buffer).getUint16(0, true)
    } 
    return new DataView(bytes.buffer).getUint16(0, false)
}

function getUInt32FromBytes(bytes, byteOrder) {
    //Ensure we have 4 bytes
    if (bytes.byteLength !== 4) { console.error("Need 4 bytes for a UInt32"); return null; }

    //Check byteorder and return using DataView to set endianness appropriately
    if (byteOrder === ByteOrder.LittleEndian) {
        return new DataView(bytes.buffer).getUint32(0, true)
    }
    return new DataView(bytes.buffer).getUint32(0, false)
}

function getDoubleFromBytes(bytes, byteOrder) {
    //Ensure we have 8 bytes
    if (bytes.byteLength !== 8) { console.error("Need 8 bytes for a Double"); return null; }

    //Check byteorder and return using DataView to set endianness appropriately
    if (byteOrder === ByteOrder.LittleEndian) {
        return new DataView(bytes.buffer).getFloat64(0, true)
    }
    return new DataView(bytes.buffer).getFloat64(0, false)
}

function getUInt16sFromBytes(bytes, byteOrder) {
    //Ensure we have an even number of bytes
    if (bytes.byteLength %2 != 0) { console.error("Need an even number of bytes for a UInt16 array"); return null; }
    let offset = 0
    return range(bytes.byteLength / 2).map (index => { 
        offset = index * 2
        return this.getUInt16FromBytes(bytes.slice(offset, offset + 2), byteOrder)
    })
}

function getUInt32sFromBytes(bytes, byteOrder) {
    //Ensure we have an even number of bytes
    if (bytes.byteLength %2 != 0) { console.error("Need an even number of bytes for a UInt32 array"); return null; }
    let offset = 0
    return range(bytes.byteLength / 4).map (index => { 
        offset = index * 4
        return this.getUInt32FromBytes(bytes.slice(offset, offset + 4), byteOrder)
    })
}

function getDoublesFromBytes(bytes, byteOrder) {
    //Ensure we have an even number of bytes
    if (bytes.byteLength %2 != 0) { console.error("Need an even number of bytes for a UInt32 array"); return null; }
    let offset = 0
    return range(bytes.byteLength / 8).map (index => { 
        offset = index * 8
        return this.getDoubleFromBytes(bytes.slice(offset, offset + 8), byteOrder)
    })

}