<script>
  import MetadataItem from './MetadataItem.svelte'

  export let fileDetails
  $: console.log(fileDetails)

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
  class="w-full h-full flex flex-col sm:max-w-xs sm:min-w-xs sm:shadow-lg
  sm:border-r">
  <div
    class="flex items-center justify-between p-2 border-b bg-gray-200 h-12
    text-sm">
    <span class="text-teal-800 font-semibold">{fileDetails.file.name}</span>
    <span>{fileDetails.file.size}mb</span>
  </div>
  <div class="p-2 flex items-center border-b h-12 text-sm">
    <span class="flex-1 font-semibold text-teal-700">
      Image File Directories
    </span>
    <span class="font-base">
      {currentIFDIndex + 1} / {fileDetails.ifds.length}
    </span>
  </div>
  <div class="flex-1 overflow-x-hidden overflow-y-scroll select-none">
    <ul class="text-xs">
      {#each fileDetails.ifds[currentIFDIndex].fields as field}
        <MetadataItem
          {field}
          isExpanded={field.name === expandedField}
          onToggle={toggleSelectedField} />
      {/each}
    </ul>
  </div>
</div>
