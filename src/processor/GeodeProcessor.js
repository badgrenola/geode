import { get } from 'svelte/store'
import { GeodeStore } from '../stores/GeodeStore.js'
import { GeodeProcessorState} from './GeodeProcessorState'
import GeodeWW from 'web-worker:./GeodeWW.js'


//Setup the web worker
const geodeWorker = new GeodeWW()
geodeWorker.onmessage = function(e) {
  //Get the result
  console.log("GeodeProcessor : Got result")
  const result = e.data
  GeodeStore.setRawData(result.data)
  GeodeStore.setProcessorState(GeodeProcessorState.IDLE)
}

const onNewFileSelected = (newFile) => {
  //If we're already loading, tell the processor to stop 
  if (get(GeodeStore).processorState !== GeodeProcessorState.IDLE) {
    console.log("Already processing a file. Cleaning up...")
    stopProcessingAndProcessNewFile(newFile)
    return
  }

  //Reset the store
  GeodeStore.reset()

  //Add the file to the store
  GeodeStore.setFile(newFile)

  //Set the loading state
  GeodeStore.setProcessorState(GeodeProcessorState.HEADER_LOAD)

  //Trigger the processing start
  console.log("Starting processing")
  geodeWorker.postMessage(newFile)

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