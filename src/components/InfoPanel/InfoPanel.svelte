<script>
  import { GeodeInfoPanelStore } from '../../stores/GeodeInfoPanelStore'
</script>

<div
  class="p-3 pr-0 flex-shrink-0 flex flex-col border-b select-none
  overflow-hidden bg-gray-100">
  <span class="flex-1 font-semibold text-teal-700 text-sm">Summary</span>
  <div class="mt-2 grid row-gap-3 grid-cols-3 text-xs pt-1">
    <div class="flex flex-col">
      <span class="font-semibold text-teal-800">Resolution</span>
      <span class="font-light text-gray-700">{$GeodeInfoPanelStore.resolution}</span>
    </div>
    <div class="flex flex-col">
      <span class="font-semibold text-teal-800">Format</span>
      <span class="font-light text-gray-700">{$GeodeInfoPanelStore.format}</span>
    </div>
    <div class="flex flex-col">
      <span class="font-semibold text-teal-800">Structure</span>
      <span class="font-light text-gray-700">{$GeodeInfoPanelStore.structure}</span>
    </div>
    <div class="flex flex-col">
      <span class="font-semibold text-teal-800">Min Value</span>
      <span class="font-light text-gray-700">{$GeodeInfoPanelStore.minValue}</span>
    </div>
    <div class="flex flex-col">
      <span class="font-semibold text-teal-800">Max Value</span>
      <span class="font-light text-gray-700">{$GeodeInfoPanelStore.maxValue}</span>
    </div>
    <div class="flex flex-col">
      <span class="font-semibold text-teal-800">Mean Value</span>
      <span class="font-light text-gray-700">{$GeodeInfoPanelStore.meanValue}</span>
    </div>
  </div>
</div>
