import { get } from 'svelte/store'
import { GeodeStore } from '../stores/GeodeStore.js'
import { GeodeProcessorState } from './GeodeProcessorState'
import { TiffProcessorMessageType } from './TiffReader/TiffProcessorMessageType'
import { GeodeProcessorMessageType } from './GeodeProcessorMessageType'
import GeodeWW from 'web-worker:./GeodeWW.js'


//Test save func
const a = document.createElement("a");
document.body.appendChild(a);
a.style = "display: none";

const downloadBlob = (blob, fileName) => {

  //Create a hidden link in the document
  const link = document.createElement("a")
  link.style = "display: none"
  document.body.appendChild(link)

  //Create a URL from the blob
  const blobURL = window.URL.createObjectURL(blob)

  //Add to the hidden link element and click
  link.href = blobURL
  link.download = fileName
  link.click()

  //Immediately revoke the URL
  window.URL.revokeObjectURL(blobURL)

  //Immediately remove the link
  document.body.removeChild(link)
}


//Create the webworker
const geodeWorker = new GeodeWW()

//Setup responding to messages FROM the web worker
geodeWorker.onmessage = function(e) {

  //Get the message
  const message = e.data

  //Check message type
  switch (message.type) {
    case TiffProcessorMessageType.ERROR:
      console.error("GeodeProcessor : Received an error message")
      console.error(message.error)
      //TODO : Handle error
      break;
    case TiffProcessorMessageType.HEADER_LOADED:
      console.log("GeodeProcessor : TiffReader has finished loading the header")
      GeodeStore.setRawData(message.data)
      GeodeStore.setProcessorState(GeodeProcessorState.PIXEL_LOADING)

      //Tell the webworker to start processing the pixel data
      geodeWorker.postMessage({
        type:GeodeProcessorMessageType.GET_PIXEL_STATS
      })

      break;
    case TiffProcessorMessageType.PIXEL_STATS_LOADED:
      console.log("GeodeProcessor : TiffReader has finished calculating the pixel info")
      GeodeStore.setPixelInfo(message.data)

      //Tell the webworker to start processing the pixel data
      // geodeWorker.postMessage({
      //   type:GeodeProcessorMessageType.MAKE_IMG
      // })

      break;
    case TiffProcessorMessageType.PIXEL_STATS_LOAD_ERROR:
      console.error("GeodeProcessor : TiffReader has encountered a problem loading the pixel info")
      console.error(message.error)

      //Set the pixel info to null
      GeodeStore.setPixelInfo(null)
      break;

    case TiffProcessorMessageType.TEST_IMG_DOWNLOAD:
      console.log("GeodeProcessor : TiffReader has sent a test blob for download")
      console.log(geodeWorker.reader)
      downloadBlob(message.data, "test.IMG")
      break;

    default: 
      console.error("Unknown message received from TiffReader")
      console.error(message)
  }
}

//Setup communicating to the webworker
const onNewFileSelected = (file) => {
  //If we're already loading, tell the processor to stop 
  if (get(GeodeStore).processorState !== GeodeProcessorState.IDLE) {
    console.log("GeodeProcessor: Already processing a file. Cleaning up...")
    stopProcessingAndProcessNewFile(file)
    return
  }

  //Reset the store
  GeodeStore.reset()

  //Add the file to the store
  GeodeStore.setFile(file)

  //Set the loading state
  GeodeStore.setProcessorState(GeodeProcessorState.HEADER_LOAD)

  //Trigger the processing start
  console.log("GeodeProcessor: Starting processing")
  geodeWorker.postMessage({
    type: GeodeProcessorMessageType.LOAD_HEADER,
    file
  })

}

const stopProcessingAndProcessNewFile = (newFile) => {

  //TODO : Cleanup any processing and wait for the go ahead
  setTimeout(() => {

    //Set the loading state
    GeodeStore.setProcessorState(GeodeProcessorState.IDLE)
    console.log('Processing stopped')
    onNewFileSelected(newFile)
  }, 500)
}

export { onNewFileSelected, GeodeProcessorState }