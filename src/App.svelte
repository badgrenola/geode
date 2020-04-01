<script>
  import Header from './components/Header.svelte'
  import DropZone from './components/DropZone.svelte'
  import Footer from './components/Footer.svelte'
  import Carousel from './components/Carousel.svelte'

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
        {loading}
        success={!loading && fileDetails && !errorMessage}
        {errorMessage}
        {onFileSelected}>
        <span slot="success">
          {#if fileDetails}
            <p class="text-xs sm:text-sm">
              {@html fileDetails.fileSummary}
            </p>
            <Carousel summaries={fileDetails.ifdSummaries} />
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
        <span slot="start">
          <h2
            class="text-sm text-gray-600 font-light sm:w-5/12 lg:w-3/12
            sm:text-base sm:text-base sm:text-right">
            <p>
              Geode is a work-in-progress, (soon-to-be) hopefully really very
              helpful GeoTIFF preview tool.
            </p>
            <p>
              To get started, drag/drop a file here, or click the load icon
              above
            </p>
          </h2>
        </span>
      </DropZone>
    </div>
    <Footer />
  </div>
</main>
