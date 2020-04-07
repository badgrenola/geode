<script>
  import { GeodeBandStore } from '../../stores/GeodeBandStore'
  import Spinner from '../Spinner.svelte'
</script>

<div class="p-3 pr-0 flex flex-shrink-0 items-center border-b h-12 select-none bg-gray-100 subpixel-antialiased">
  <span class="flex-1 font-semibold text-teal-700 text-sm">Image Subfiles</span>
  {#if $GeodeBandStore.bandCount}
    <div class="flex items-center text-xs">
      <button
        type="button"
        class="w-10 h-10 flex justify-center text-lg text-gray-700
        hover:text-teal-700 focus:outline-none {$GeodeBandStore.currentBandIndex === 0 ? 'pointer-events-none cursor-default opacity-25' : ''}"
        on:click={GeodeBandStore.setBandIndex($GeodeBandStore.currentBandIndex - 1)}>
        ◀
      </button>
      <span class="">
        {$GeodeBandStore.currentBandIndex + 1} / {$GeodeBandStore.bandCount}
      </span>
      <button
        type="button"
        class="w-10 h-10 flex justify-center text-lg text-gray-700
        hover:text-teal-700 focus:outline-none {$GeodeBandStore.currentBandIndex === $GeodeBandStore.bandCount - 1 ? 'pointer-events-none cursor-default opacity-25' : ''}"
        on:click={GeodeBandStore.setBandIndex($GeodeBandStore.currentBandIndex + 1)}>
        ▶
      </button>
    </div>
  {:else}
    <div class="pr-3">
      <Spinner size={4}/>
    </div>
  {/if}
</div>
