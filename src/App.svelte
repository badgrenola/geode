<script>
	import DropZone from './components/DropZone.svelte'

	//Store info 
	let loading = false
	let fileDetails = null
	let errorMessage = null
	let successMessage = null

	//Setup the web worker
    const worker = new Worker("./worker/geodeWW.js")
    worker.onmessage = function(e){
		//Get the result
		const result = e.data

		//Look for errors first
		if (!result || result.error) {
			//An error was found
			errorMessage = result.error
		} else {
			//No error was found
			fileDetails = result.data
			successMessage = result.successMessage
		}

		//Switch loading state to false
		loading = false
	};
	
	//Handle the actually file reading
    const onFileSelected = (file) => {
		//Post file to webworker for reading
		worker.postMessage(file);

		//Set the state
		fileDetails = null
		errorMessage = null
		successMessage = null
		loading = true
	}

</script>

<style>
	
</style>

<main class="w-full h-full">
	<div class="container mx-auto flex flex-col h-full">
		<div class="flex flex-col justify-center items-center pt-4 mx-6">
			<h1 id="geodeTitle" class="text-green-500 text-4xl tracking-superwide -mr-4 sm:text-5xl sm:tracking-superwider sm:-mr-8 ">Geode</h1>
			<h2 class="text-center text-sm text-gray-600 font-light -mt-1 sm:text-l sm:-mt-2 sm:text-base">A really very helpful GeoTIFF previewer</h2>
		</div>
		<div class="w-full flex-1 px-6 py-4 overflow-hidden">
			<DropZone 
				loading={loading}
				success={!loading && fileDetails && !errorMessage}
				errorMessage={errorMessage}
				successMessage={successMessage}
				onFileSelected={onFileSelected}
			/>
		</div>
		<p class="w-full text-center px-8 pb-4 text-xs text-gray-500">No information on your files is uploaded, and all processing happens on your own machine.</p>
	</div>
</main>