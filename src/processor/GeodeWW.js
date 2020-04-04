import { TiffReader } from './TiffReader'

//Define simple onLoad/onError callbacks for the TiffReader
const onLoad = (data) => {
  console.log(data)
  postMessage({
    data,
    error: null
  })
}

const onError = (error) => {
  console.log(error)
  postMessage({
    data: null,
    error
  })
}

//Create a TiffReader object
const reader = new TiffReader(onLoad, onError)

//Setup the on message
onmessage = (e) => {
  //Right now the only message is 'Start Reading Please', so we don't have to check message types/ids
  //That'll no doubt come later. TODO

  //Start reading the file
  reader.startReading(e.data)
}
