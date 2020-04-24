import { get } from 'svelte/store'
import { GeodeStore } from '../stores/GeodeStore.js'
import { GeodeProcessorState } from './GeodeProcessorState'
import { TiffProcessorMessageType } from './TiffProcessorMessageType'
import { GeodeProcessorMessageType } from './GeodeProcessorMessageType'
import GeodeWW from 'web-worker:./GeodeWW.js'


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
      console.log("GeodeProcessor : WebWorker has finished loading the header")
      GeodeStore.setRawData(message.data)
      GeodeStore.setProcessorState(GeodeProcessorState.PIXEL_LOADING)

      //Tell the webworker to start processing the pixel data
      geodeWorker.postMessage({
        type:GeodeProcessorMessageType.LOAD_PIXELS
      })

      break;
    default: 
      console.error("Unknown message received from WebWorker")
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