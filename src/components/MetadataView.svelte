<script>
  export let fileDetails
  $: console.log(fileDetails)

  //Store the name of the currenty expanded field, if any
  let expandedField = null

  //Store the current IFD
  let currentIFDIndex = 0

  const toggleSelectedField = fieldName => {
    if (expandedField === fieldName) {
      expandedField = null
    } else {
      expandedField = fieldName
    }
  }

  const getShortDataString = data => {
    if (!data) return 'None'

    if (typeof data === typeof []) {
      //If all values are the same, just show one
      if (data.every((val, i, arr) => val === arr[0])) {
        return `${data.length} x [${data[0]}]`
      }

      return `${data.length} values`
    }

    if (typeof data === typeof '' && data.length > 24) {
      return `${data.length} char string`
    }

    return data
  }
</script>

<div
  class="w-full h-full flex flex-col sm:max-w-xs sm:min-w-xs sm:shadow-lg
  sm:border-r">
  <div class="flex items-center justify-between p-2 border-b bg-gray-200 h-12">
    <span class="text-teal-800 font-semibold">MyFileName.tiff</span>
    <span class="">12.98mb</span>
  </div>
  <div class="p-2 flex items-center border-b h-12">
    <span class="flex-1 font-semibold text-teal-700">
      Image File Directories
    </span>
    <span class="font-base">
      {currentIFDIndex + 1} / {fileDetails.data.length}
    </span>
  </div>
  <div class="sm:pt-2 flex-1 overflow-x-hidden overflow-y-scroll">
    <ul class="text-xs">
      {#each fileDetails.data[currentIFDIndex].fields as field}
        <li
          class="flex flex-col border-b border-gray-200 h-10 sm:h-8
          hover:bg-gray-200 hover:text-teal-700 cursor-pointer transition-height
          duration-200 {field.name === expandedField ? 'h-auto' : ''}">
          <div
            class="px-3 w-full flex justify-between h-10 sm:h-8 items-center"
            on:click={toggleSelectedField(field.name)}>
            <span class="font-semibold ">{field.name}</span>
            <span class="text-right" title={field.data}>
              {getShortDataString(field.data)}
            </span>
          </div>
          {#if field.name === expandedField}
            <span
              class="flex-1 px-3 break-words pt-1 pb-2 select-text cursor-text">
              {field.data}
            </span>
          {/if}
        </li>
      {/each}
    </ul>
  </div>
</div>
