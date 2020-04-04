import { GeodeStore } from '../stores/GeodeStore.js';
import GeodeWW from 'web-worker:./GeodeWW.js';

//Setup the web worker
const geodeWorker = new GeodeWW()
geodeWorker.onmessage = function(e) {
  //Get the result
  console.log("GeodeProcessor : Got result")
  const result = e.data
  console.log(result)
}

const onNewFileSelected = (newFile) => {

  //If we're already loading, tell the processor to stop 
  if (GeodeStore.loading) {
    console.log("Already processing a file. Cleaning up...")
    stopProcessingAndProcessNewFile(newFile)
    return
  }

  //Add the file to the store
  GeodeStore.setFile(newFile)

  //Set the loading state
  GeodeStore.setLoading(true)

  //Trigger the processing start
  console.log("Starting processing")
  geodeWorker.postMessage(newFile)

}

const stopProcessingAndProcessNewFile = (newFile) => {

  //TODO : Cleanup any processing and wait for the go ahead
  setTimeout(() => {

    //Set the loading state
    GeodeStore.setLoading(false)

    console.log('Processing stopped')

    onNewFileSelected(newFile)
  }, 500)
}

export { onNewFileSelected, stopProcessingAndProcessNewFile }