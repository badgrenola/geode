<script>
  import BandSelector from './BandSelector/BandSelector.svelte'
  import InfoPanel from './InfoPanel/InfoPanel.svelte'
  import MetadataView from './MetadataView/MetadataView.svelte'
</script>

<div class="w-full h-full flex">

  <!-- Left panel -->
  <div class="w-full h-full flex flex-col sm:max-w-xs sm:min-w-xs sm:shadow-lg sm:border-r">
    <InfoPanel />
    <BandSelector />
    <MetadataView />
  </div>

  <div class="hidden sm:flex w-full h-full flex-1 justify-center items-center text-center text-gray-900 font-light">
    2D & 3D previews coming soon!
  </div>

</div>