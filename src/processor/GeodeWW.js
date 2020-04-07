import { TiffReader } from './TiffReader'
import { PixelGrabber } from './PixelGrabber'

//Define simple onLoad/onError callbacks for the TiffReader
const onLoad = (data, file) => {

  grabber.grabData(data, file)

  postMessage({
    data,
    error: null
  })
}

const onError = (error) => {
  postMessage({
    data: null,
    error
  })
}

//Define simple onLoad/onError callbacks for the PixelGraber
const onPixelLoad = (data) => {
  postMessage({
    data,
    error: null
  })
}

const onPixelError = (error) => {
  postMessage({
    data: null,
    error
  })
}

//Create a TiffReader object
const reader = new TiffReader(onLoad, onError)

//Create a PixelGrabber object
const grabber = new PixelGrabber(onPixelLoad, onPixelError)

//Setup the on message
onmessage = (e) => {
  //Right now the only message is 'Start Reading Please', so we don't have to check message types/ids
  //That'll no doubt come later. TODO

  //Start reading the file
  reader.startReading(e.data)
}
