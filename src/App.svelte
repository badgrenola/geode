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

  //Setup the web worker
  const worker = new Worker('./worker/geodeWW.js')
  worker.onmessage = function(e) {
    //Get the result
    const result = e.data

    //Look for errors first
    if (!result || result.error) {
      //An error was found
      errorMessage = result.error
      console.log(result.error)
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
        <span slot="dropping">
          <p>Let go to try and read the file!</p>
        </span>
        <span slot="fileNotValid">
          <p>Error : File is not a Tiff :(</p>
        </span>
        <span slot="error">
          <p>Error : {errorMessage}</p>
        </span>
        <span slot="start" />
      </DropZone>
    </div>
    <Footer />
  </div>
</main>
