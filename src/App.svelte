<script>
  import Header from './components/Header.svelte'
  import DropZone from './components/DropZone.svelte'
  import Footer from './components/Footer.svelte'
  import Carousel from './components/Carousel.svelte'
  import MetadataView from './components/MetadataView.svelte'

  //Store info
  let loading = false
  let fileDetails = null
  let errorMessage = null

  //Get the interaction text
  let interactionMessage = ''
  let isMobile =
    'ontouchstart' in window ||
    navigator.MaxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  $: {
    const mobile = `Click the load icon above to browse for ${
      fileDetails && !errorMessage ? 'another' : 'a'
    } file on your device`
    const desktop = `Drag ${
      fileDetails && !errorMessage ? 'another' : 'a'
    } file in or click the load icon above to browse`
    interactionMessage = isMobile ? mobile : desktop
  }

  //Setup the web worker
  const worker = new Worker('./worker/geodeWW.js')
  worker.onmessage = function(e) {
    //Get the result
    const result = e.data

    //Look for errors first
    if (!result || result.error) {
      //An error was found
      errorMessage = result.error
    } else {
      //No error was found
      fileDetails = result.data
      errorMessage = null
    }

    //Switch loading state to false
    loading = false
  }

  //Handle the actually file reading
  const onFileSelected = file => {
    //Post file to webworker for reading
    worker.postMessage(file)

    //Set the state
    fileDetails = null
    errorMessage = null
    loading = true
  }

  //On load button presse
  const onLoadButtonPressed = () => {
    document.getElementById('hiddenFileInput').click()
  }
</script>

<main class="w-full h-full">
  <div class="flex flex-col h-full">
    <Header onLoad={onLoadButtonPressed} />
    <div class="w-full flex-1 overflow-hidden">
      <DropZone
        allowClickToLoad={false}
        {loading}
        success={!loading && fileDetails && !errorMessage}
        {errorMessage}
        {onFileSelected}>
        <span slot="success" class="w-full h-full">
          {#if fileDetails}
            <MetadataView {fileDetails} />
          {/if}
        </span>
        <span slot="loading">
          <p>Loading...</p>
        </span>
        <span
          slot="dropping"
          class="w-full h-full p-8 flex justify-center items-center text-center
          relative">
          Let go to try and read the file!
        </span>
        <span
          slot="fileNotValid"
          class="w-full h-full p-8 flex justify-center items-center text-center
          relative">
          <p>Error : File is not a Tiff :(</p>
        </span>
        <span
          slot="error"
          class="w-full h-full p-8 flex justify-center items-center text-center
          relative">
          <p>Error : {errorMessage}</p>
        </span>
        <div
          slot="start"
          class="w-full h-full p-8 flex justify-center items-center text-center">
          {interactionMessage}
        </div>
      </DropZone>
    </div>
    <Footer />
  </div>
</main>
