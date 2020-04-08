import { TiffReader } from './TiffReader'

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

//Setup the on message
onmessage = (e) => {
  //Right now the only message is 'Start Reading Please', so we don't have to check message types/ids
  //That'll no doubt come later. TODO

  //Start reading the file
  reader.startReading(e.data)
}
