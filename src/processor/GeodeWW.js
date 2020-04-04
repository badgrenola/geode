
//Setup the on message
onmessage = (e) => {
  //Get the file
  const file = e.data

  console.log("WebWorker : Got file")
  console.log(file)

  //TODO Do the processing
  setTimeout(() => {
    postMessage({data: [1, 2, 3], error: null})
  }, 1000)

  //Pass to the tiff reader to begin reading
  // const onLoad = (data) => {
  //   postMessage({
  //     data,
  //     error: null,
  //   })
  // }
  // const onError = (errorMessage) => {
  //   postMessage({ data: null, error: errorMessage })
  // }
  // const tiffReader = new TiffReader(file, onLoad, onError)
}
