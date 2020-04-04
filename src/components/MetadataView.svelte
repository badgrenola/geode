<script>

  import { GeodeStore } from '../stores/GeodeStore'
  import { GeodeProcessorState } from '../processor/GeodeProcessor'
  import { bytesToMB } from '../helpers/jsHelpers'

  // import MetadataItem from './MetadataItem.svelte'

  //Store the current IFD index
  let currentIFDIndex = 0

  //Store the name of the currenty expanded field, if any
  let expandedField = null

  // //Toggle the currently expanded field
  // const toggleSelectedField = fieldName => {
  //   if (expandedField === fieldName) {
  //     expandedField = null
  //   } else {
  //     expandedField = fieldName
  //   }
  // }

  let loadedFileName = $GeodeStore.file.name
  $: {
    //If a new file has been loaded, reset the vars
    if (loadedFileName != $GeodeStore.file.name) {
      console.log("Resetting Metadata View Vars")
      currentIFDIndex = 0
      expandedField = null
      loadedFileName = $GeodeStore.file.name
    }

  }
</script>

<div
  class="w-full h-full flex flex-col text-xs sm:max-w-xs sm:min-w-xs
  sm:shadow-lg sm:border-r">
  {#if $GeodeStore.processorState === GeodeProcessorState.HEADER_LOAD}
    <p>Processing</p>
  {:else if $GeodeStore.processorState === GeodeProcessorState.IDLE}
    <div class="flex items-center justify-between p-2 border-b bg-gray-200 h-12 ">
      <span class="text-teal-800 font-semibold">{$GeodeStore.file.name}</span>
      <span>{bytesToMB($GeodeStore.file.size, 2)}mb</span>
    </div>
    {#if $GeodeStore.rawHeader && $GeodeStore.rawHeader.ifds}
      <div class="p-3 flex items-center border-b h-12 ">
        <span class="flex-1 font-semibold text-teal-700">
          Image File Directories
        </span>
        <span class="font-base">
          {currentIFDIndex + 1} / {$GeodeStore.rawHeader.ifds.length}
        </span>
      </div>
      <div class="flex-1 overflow-x-hidden overflow-y-scroll select-none">
        <ul>
          {#each $GeodeStore.rawHeader.ifds[currentIFDIndex].fields as field}
            <!-- <MetadataItem
              {field}
              isExpanded={field.name === expandedField}
              onToggle={toggleSelectedField} /> -->
          {/each}
        </ul>
      </div>
    {/if}
  {/if}
</div>
