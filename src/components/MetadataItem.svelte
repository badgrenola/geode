<script>
  export let field
  export let isExpanded
  export let onToggle

  let canExpand = false
  let shortDataString = null
  let prettyPrintedData = null
  $: {
    canExpand = canFieldExpand()
    shortDataString = getShortDataString()
    prettyPrintedData = getPrettyPrintedData()
  }

  const canFieldExpand = () => {
    if (!field) {
      return false
    }
    if (!field.data) {
      return false
    }
    if (typeof field.data === typeof '' && field.data.length > 24) {
      return true
    }
    if (typeof field.data === typeof []) {
      if (!field.data.every((val, i, arr) => val === arr[0])) {
        return true
      }
    }
    return false
  }

  const getShortDataString = () => {
    if (!field.data) return 'None'

    if (typeof field.data === typeof []) {
      //If all values are the same, just show one
      if (field.data.every((val, i, arr) => val === arr[0])) {
        return `${field.data.length} x [${field.data[0]}]`
      }

      return `${field.data.length} values`
    }

    if (typeof field.data === typeof '' && field.data.length > 24) {
      return `${field.data.length} char string`
    }

    return field.data
  }

  const getPrettyPrintedData = () => {
    if (!field.data) {
      return 'None'
    }
    if (typeof field.data === typeof []) {
      return field.data.join('<br />')
    }
    return field.data
  }

  const fieldClicked = () => {
    if (field && canExpand) {
      onToggle(field.name)
    }
  }
</script>

{#if field}
  <li
    class="flex flex-col border-b border-gray-200 h-10 sm:h-8 overflow-hidden
    hover:bg-gray-200 hover:text-teal-700 cursor-pointer {isExpanded ? 'bg-gray-200 h-auto sm:h-auto' : ''}">
    <div
      class="w-full flex flex-shrink-0 justify-between h-10 sm:h-8 items-center
      border-b border-gray-300"
      on:click={fieldClicked}>
      <div class="flex items-center">
        <span
          class="w-8 flex items-center justify-center {canExpand ? 'opacity-100' : 'opacity-25'}">
          {#if isExpanded}▼{:else}▶{/if}
        </span>
        <span class="font-semibold ">{field.name}</span>
      </div>
      <span class="text-right pr-3" title={field.data}>{shortDataString}</span>
    </div>
    {#if isExpanded}
      <div class="flex-1 flex">
        <div
          class="w-8 h-auto bg-gray-200 border-r border-gray-300 flex-shrink-0
          hover:bg-gray-100"
          title={'collapse'}
          on:click={fieldClicked} />
        <span
          class="p-1 break-words bg-gray-100 w-full cursor-text select-text
          overflow-hidden">
          {@html prettyPrintedData}
        </span>
      </div>
    {/if}
  </li>
{/if}
