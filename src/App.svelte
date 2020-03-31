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
			errorMessage = null
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
		loading = true
	}

</script>

<main class="w-full h-full">
	<div class="container mx-auto flex flex-col h-full">
		<Header />
		<span>Geode is a work-in-progress, (soon-to-be) hopefully really very helpful GeoTIFF preview tool 👍</span>
		<div class="w-full flex-1 px-6 py-4 overflow-hidden">
			<DropZone 
				loading={loading}
				success={!loading && fileDetails && !errorMessage}
				errorMessage={errorMessage}
				onFileSelected={onFileSelected}
			>
				<span slot="success">
					{#if fileDetails}
						<p class="text-xs sm:text-sm">{@html fileDetails.fileSummary}</p>
						<Carousel summaries={fileDetails.ifdSummaries} />
					{/if}
				</span>
			</DropZone>
		</div>
		<Footer />
	</div>
</main>