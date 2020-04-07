<script>
  import BandSelector from './BandSelector/BandSelector.svelte'
  import InfoPanel from './InfoPanel/InfoPanel.svelte'
  import MetadataView from './MetadataView/MetadataView.svelte'
</script>

<div class="w-full h-full flex flex-col sm:max-w-xs sm:min-w-xs sm:shadow-lg sm:border-r">
  <BandSelector />
  <InfoPanel />
  <MetadataView />
</div>