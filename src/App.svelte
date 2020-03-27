<script>
	import DropZone from './components/DropZone.svelte'

	//Setup the web worker
    let worker = new Worker("./worker/test.js")
    worker.onmessage = function(e){
        //Update the state from the worker info
        fileDetails = e.data
        loading = false
	};
	
	//Handle the actually file reading
    const onFileSelected = (file) => {
		//Post file to webworker for reading
		worker.postMessage(file);
	}

</script>

<style>
	
</style>

<main class="w-full h-full">
	<div class="container mx-auto flex flex-col h-full">
		<div class="flex flex-col justify-center items-center pt-8">
			<h1 id="geodeTitle" class="text-green-500 text-4xl tracking-superwide -mr-4 sm:text-5xl sm:tracking-superwider sm:-mr-8 ">Geode</h1>
			<h2 class="text-center text-gray-600 font-light -mt-1 sm:text-l sm:-mt-2">A really very helpful GeoTIFF previewer</h2>
		</div>
		<div class="w-full flex-1 p-8 overflow-hidden">
			<DropZone onFileSelected={onFileSelected}/>
		</div>
		<p class="w-full text-center px-8 pb-8 text-sm text-gray-500">No information on your files is uploaded, and all processing happens on your own machine.</p>
	</div>
</main>