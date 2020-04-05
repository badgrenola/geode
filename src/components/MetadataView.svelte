<script>
  import { GeodeMetadataStore } from '../stores/GeodeMetadataStore'
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
  class="w-full h-full flex flex-col text-xs sm:max-w-xs sm:min-w-xs
  sm:shadow-lg sm:border-r">
  {#if !$GeodeMetadataStore.ifdFields}
    <p>Processing</p>
  {:else}
    <div class="p-3 flex items-center border-b h-12 ">
      <span class="flex-1 font-semibold text-teal-700">
        Image File Directories
      </span>
      <span class="font-base">
        {currentIFDIndex + 1} / {$GeodeMetadataStore.ifdFields.length}
      </span>
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
