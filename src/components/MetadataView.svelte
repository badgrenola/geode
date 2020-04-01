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

<div class="w-3/12 h-full bg-gray-100 p-2">
  {#each fileDetails.data as ifd, ifdIndex}
    <p class="text-base font-light">IFD {ifdIndex + 1}</p>
    <ul class="text-xs h-full pt-1">
      {#each ifd.fields as field}
        <li
          class="pb-1 flex items-center justify-between border-b border-gray-200
          h-8 hover:bg-white cursor-pointer">
          <span class="font-semibold">{field.name}</span>
          <span class="text-right" title={field.data}>
            {getShortDataString(field.data)}
          </span>
        </li>
      {/each}
    </ul>
  {/each}
</div>
