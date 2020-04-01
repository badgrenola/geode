<script>
  export let fileDetails
  $: console.log(fileDetails)

  function getShortDataString(data) {
    if (!data) return 'None'

    if (typeof data === typeof []) {
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
  {#each fileDetails.data as ifd, ifdIndex}
    <div
      class="flex items-center justify-between p-2 border-b bg-gray-200 h-12">
      <span class="text-teal-800 font-semibold">MyFileName.tiff</span>
      <span class="">12.98mb</span>
    </div>
    <div class="p-2 flex items-center border-b h-12">
      <span class="flex-1 font-semibold text-teal-700">
        Image File Directories
      </span>
      <span class="font-base">{ifdIndex + 1} / {fileDetails.data.length}</span>
    </div>
    <div class="pt-2 flex-1 overflow-x-hidden overflow-y-scroll">
      <ul class="text-xs">
        {#each ifd.fields as field}
          <li
            class="pb-1 flex items-center justify-between border-b
            border-gray-200 h-8 hover:bg-gray-200 hover:text-teal-700
            cursor-pointer">
            <span class="font-semibold pl-3">{field.name}</span>
            <span class="text-right pr-3" title={field.data}>
              {getShortDataString(field.data)}
            </span>
          </li>
        {/each}
      </ul>
    </div>
  {/each}
</div>
