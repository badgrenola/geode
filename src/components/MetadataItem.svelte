<script>
  import { prettyFormatData } from '../helpers/stringFormatter'

  export let field
  export let isExpanded
  export let onToggle

  let canExpand = false
  let shortDataString = null
  let prettyPrintedData = null
  $: {
    canExpand = canFieldExpand()
    shortDataString = getShortDataString()
    prettyPrintedData = prettyFormatData(field.data, field.name)
  }

  const roundToDP = (num, dp) => {
    const divisor = 10**dp
    return Math.round((num + Number.EPSILON) * divisor) / divisor
  }

  const isObject = value => {
    return value && typeof value === 'object' && value.constructor === Object
  }

  const canFieldExpand = () => {
    if (!field) {
      return false
    }
    if (!field.data) {
      return false
    }
    if (typeof field.data === typeof '' && field.data.length > 18) {
      return true
    }
    if (Array.isArray(field.data)) {
      if (!field.data.every((val, i, arr) => val === arr[0])) {
        return true
      }
    }
    if (isObject(field.data)) {
      return true
    }

    if (typeof field.data === 'number' && `${field.data}`.length > 10) {
      return true
    }
    return false
  }

  const getShortDataString = () => {
    if (field.data === undefined || field.data === null) return 'None'

    if (Array.isArray(field.data)) {
      //If all values are the same, just show one
      if (field.data.every((val, i, arr) => val === arr[0])) {
        return `${field.data.length} x [${field.data[0]}]`
      }

      return `${field.data.length} values`
    }

    //Object
    if (isObject(field.data)) {
      return `${JSON.stringify(field.data).length} char JSON`
    }

    if (typeof field.data === typeof '' && field.data.length > 18) {
      return `${field.data.length} char string`
    }

    if (typeof field.data === 'number' && `${field.data}`.length > 10) {
      return `${roundToDP(field.data, 5)} to 5dp`
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
    class="flex flex-col border-b border-gray-200 h-10 overflow-hidden
    hover:bg-gray-200 hover:text-teal-700 cursor-pointer {isExpanded ? 'bg-gray-200 h-auto' : ' '}">
    <div
      class="w-full flex flex-shrink-0 justify-between h-10 items-center
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
