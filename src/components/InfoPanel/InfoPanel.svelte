<script>
  import { GeodeInfoPanelStore } from '../../stores/GeodeInfoPanelStore'
  import { roundToDP } from '../../helpers/jsHelpers'
  import Spinner from '../Spinner.svelte'

  let spinnerSize = 3
</script>

<div
  class="p-3 pr-0 flex-shrink-0 flex flex-col border-b select-none
  overflow-hidden bg-gray-200">
  <span class="flex-1 font-semibold text-teal-700 text-sm">Summary</span>
  <div class="grid col-gap-1 row-gap-3 grid-cols-3 text-xs sm:mt-2">
    <div class="flex flex-col col-span-2">
      <span class="font-semibold text-teal-800">Name</span>
      {#if $GeodeInfoPanelStore.fileName}
        <span class="font-light text-gray-700 truncate">
          {$GeodeInfoPanelStore.fileName}
        </span>
      {:else}
        <Spinner size={spinnerSize} />
      {/if}
    </div>
    <div class="flex flex-col">
      <span class="font-semibold text-teal-800">Filesize</span>
      {#if $GeodeInfoPanelStore.fileSize}
        <span class="font-light text-gray-700">
          {$GeodeInfoPanelStore.fileSize}mb
        </span>
      {:else}
        <Spinner size={spinnerSize} />
      {/if}
    </div>

    <div class="flex flex-col">
      <span class="font-semibold text-teal-800">Resolution</span>
      {#if $GeodeInfoPanelStore.resolution}
        <span class="font-light text-gray-700">
          {$GeodeInfoPanelStore.resolution}
        </span>
      {:else}
        <Spinner size={spinnerSize} />
      {/if}
    </div>
    <div class="flex flex-col">
      <span class="font-semibold text-teal-800">Format</span>
      {#if $GeodeInfoPanelStore.format}
        <span class="font-light text-gray-700">
          {$GeodeInfoPanelStore.format}
        </span>
      {:else}
        <Spinner size={spinnerSize} />
      {/if}
    </div>
    <div class="flex flex-col">
      <span class="font-semibold text-teal-800">Structure</span>
      {#if $GeodeInfoPanelStore.structure}
        <span class="font-light text-gray-700">
          {$GeodeInfoPanelStore.structure}
        </span>
      {:else}
        <Spinner size={spinnerSize} />
      {/if}
    </div>

    
    <div class="flex flex-col">
      <span class="font-semibold text-teal-800">Min Value</span>
      {#if $GeodeInfoPanelStore.minValue !== null}
        <span class="font-light text-gray-700" title={$GeodeInfoPanelStore.minValue}>{roundToDP($GeodeInfoPanelStore.minValue, 4)}</span>
      {:else}
        <Spinner size={spinnerSize} />
      {/if}
    </div>
    <div class="flex flex-col">
      <span class="font-semibold text-teal-800">Max Value</span>
      {#if $GeodeInfoPanelStore.maxValue !== null}
        <span class="font-light text-gray-700" title={$GeodeInfoPanelStore.maxValue}>{roundToDP($GeodeInfoPanelStore.maxValue, 4)}</span>
      {:else}
        <Spinner size={spinnerSize} />
      {/if}
    </div>
    <div class="flex flex-col">
      <span class="font-semibold text-teal-800">Mean Value</span>
      {#if $GeodeInfoPanelStore.meanValue !== null}
        <span class="font-light text-gray-700" title={$GeodeInfoPanelStore.meanValue}>{roundToDP($GeodeInfoPanelStore.meanValue, 4)}</span>
      {:else}
        <Spinner size={spinnerSize} />
      {/if}
    </div>
  </div>
</div>
