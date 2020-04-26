import { TiffReader } from './TiffReader/TiffReader'
import { GeodeProcessorMessageType } from './GeodeProcessorMessageType'

//Define simple onLoad/onError callbacks for the TiffReader
const sendMessageToMain = (type, data, error) => {
  postMessage({
    type,
    data: data || null,
    error: error || null
  })
}

//Create a TiffReader object
const reader = new TiffReader(sendMessageToMain)

//Setup the on message from the main thread
onmessage = (e) => {

  //Get the message
  const message = e.data

  switch (message.type) {
    case GeodeProcessorMessageType.LOAD_HEADER:
      //Start reading the header
      reader.readHeader(message.file)
      break;
    case GeodeProcessorMessageType.LOAD_PIXELS:
      //Start loading the pixels
      reader.getPixelInfo()
      break;
    case GeodeProcessorMessageType.MAKE_IMG:
      //Start making an IMG
      reader.constructIMG()
      break;
    default:
      console.error("GeodeWW : Unknown message type received")
      console.error(message)
  }
}
