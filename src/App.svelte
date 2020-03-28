<script>
	import DropZone from './components/DropZone.svelte'
	import Footer from './components/Footer.svelte'

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

<main class="w-full h-full">
	<div class="container mx-auto flex flex-col h-full">
		<div class="flex flex-col sm:flex-row justify-center pt-4 mx-6 sm:items-center">
			<h1 id="geodeTitle" class="flex-1 text-green-500 text-4xl sm:text-5xl">Geode</h1>
			<h2 class="text-sm text-gray-600 font-light sm:w-5/12 lg:w-3/12 sm:text-base sm:text-base sm:text-right">
				A work-in-progress, (soon-to-be) hopefully really very helpful GeoTIFF preview tool 👍
			</h2>
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
		<Footer />
	</div>
</main>