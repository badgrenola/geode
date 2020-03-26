<script>
	import DropZone from './components/DropZone.svelte'

</script>

<style>
	
</style>

<main class="w-full h-full">
	<div class="flex flex-col h-full">
		<div class="flex flex-col justify-center items-center pt-8">
			<h1 id="geodeTitle" class="text-6xl tracking-superwide -mr-8 text-green-500">Geode</h1>
			<h2 class="text-gray-600 text-l font-light -mt-4">A really very helpful GeoTIFF previewer</h2>
		</div>
		<div class="w-full flex-1 p-8">
			<DropZone />
		</div>
		<p class="w-full text-center pb-8 text-sm text-gray-600">No information on your files is uploaded, and all processing happens on your own machine.</p>
	</div>
</main>