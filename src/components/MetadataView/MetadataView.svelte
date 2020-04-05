<script>
  import { GeodeMetadataStore } from '../../stores/GeodeMetadataStore'
  import MetadataItem from './MetadataItem.svelte'

  //Store the current IFD index
  let currentIFDIndex = 0

  //Store the name of the currenty expanded field, if any
  let expandedField = null

  //Toggle the currently expanded field
  const toggleSelectedField = fieldName => {
    if (expandedField === fieldName) {
      expandedField = null
    } else {
      expandedField = fieldName
    }
  }
</script>

<div
  class="w-full h-full flex flex-col">
  {#if !$GeodeMetadataStore.ifdFields}
    <p>Processing</p>
  {:else}
    <div class="p-3 pr-0 flex items-center border-b h-12 select-none">
      <span class="flex-1 font-semibold text-teal-700 text-sm">Image Bands</span>
      <div class="flex items-center text-xs">
        <button
          type="button"
          class="w-10 h-10 flex justify-center text-lg text-gray-700 hover:text-teal-700 focus:outline-none {currentIFDIndex === 0 ? 'pointer-events-none cursor-default opacity-25' : ''}"
          on:click={() => {
            currentIFDIndex -= 1
          }}>
          ◀
        </button>
        <span class="">
          {currentIFDIndex + 1} / {$GeodeMetadataStore.ifdFields.length}
        </span>
        <button
          type="button"
          class="w-10 h-10 flex justify-center text-lg text-gray-700 hover:text-teal-700 focus:outline-none {currentIFDIndex === ($GeodeMetadataStore.ifdFields.length - 1) ? 'pointer-events-none cursor-default opacity-25' : ''}"
          on:click={() => {
            currentIFDIndex += 1
          }}>
          ▶
        </button>
      </div>
    </div>
    <div class="flex-1 overflow-x-hidden overflow-y-scroll select-none">
      <ul>
        {#each $GeodeMetadataStore.ifdFields[currentIFDIndex] as field}
          <MetadataItem
            {field}
            isExpanded={expandedField === field.name}
            onToggle={toggleSelectedField} />
        {/each}
      </ul>
    </div>
  {/if}
</div>
