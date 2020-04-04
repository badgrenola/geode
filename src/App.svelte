<script>
  import Header from './components/Header.svelte'
  import DropZone, { showFileBrowser } from './components/DropZone.svelte'
  import Footer from './components/Footer.svelte'

  import { GeodeStore } from './stores/GeodeStore.js'
  import { onNewFileSelected, GeodeProcessorState } from './processor/GeodeProcessor'

  // import MetadataView from './components/MetadataView.svelte'
  // import GeodeWW from 'web-worker:./worker/geodeWW.js';

  //Store info
  // let loading = false
  // let fileDetails = null
  // let errorMessage = null

  //Get the interaction text
  let interactionMessage = ''
  let isMobile =
    'ontouchstart' in window ||
    navigator.MaxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  $: {
    const mobile = `Click the load icon above to browse for ${
      $GeodeStore.file ? 'another' : 'a'
    } file on your device`
    const desktop = `Drag ${
      $GeodeStore.file ? 'another' : 'a'
    } file in or click the load icon above to browse`
    interactionMessage = isMobile ? mobile : desktop
  }

  //Setup the web worker
  // const worker = new GeodeWW()
  // worker.onmessage = function(e) {
  //   //Get the result
  //   const result = e.data

  //   //Look for errors first
  //   if (!result || result.error) {
  //     //An error was found
  //     errorMessage = result.error
  //   } else {
  //     //No error was found
  //     fileDetails = result.data
  //     errorMessage = null
  //   }

  //   //Switch loading state to false
  //   loading = false
  // }

  //Handle the actually file reading
  // const onFileSelected = file => {
  //   //Post file to webworker for reading
  //   worker.postMessage(file)

  //   //Set the state
  //   fileDetails = null
  //   errorMessage = null
  //   loading = true
  // }

  // //On load button presse
  // const onLoadButtonPressed = () => {
  //   document.getElementById('hiddenFileInput').click()
  // }
</script>

<main class="w-full h-full">
  <div class="flex flex-col h-full">
    <Header onLoadButtonPressed={(showFileBrowser)} />
    <div class="w-full flex-1 overflow-hidden relative">
      <DropZone 
          onFileSelected={onNewFileSelected}
        >
      </DropZone>
      {#if $GeodeStore.file === null}
        <p>{interactionMessage}</p>
      {:else if $GeodeStore.processorState === GeodeProcessorState.HEADER_LOAD}
        <p>Loading Header</p>
      {:else if $GeodeStore.file && $GeodeStore.processorState === GeodeProcessorState.IDLE}
        <p>File Loaded</p>
        <p>{interactionMessage}</p>
      {/if}
    </div>
    <Footer />
  </div>
</main>
