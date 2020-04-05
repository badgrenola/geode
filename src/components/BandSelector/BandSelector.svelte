<script>
  import { GeodeBandStore } from '../../stores/GeodeBandStore'
</script>

<div class="p-3 pr-0 flex items-center border-b h-12 select-none">
  <span class="flex-1 font-semibold text-teal-700 text-sm">Image Bands</span>
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
  {/if}
</div>
