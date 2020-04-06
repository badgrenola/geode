<script>
  export let field
  export let isExpanded
  export let onToggle

  const fieldClicked = () => {
    if (field.expandable) {
      onToggle(field.name)
    }
  }
</script>

{#if field}
  <li
    class="relative flex flex-col h-10 overflow-hidden cursor-pointer text-xs
    text-gray-700 even:bg-gray-100 {isExpanded ? ' h-auto' : ' '}
    ">
    <div
      class="w-full flex flex-shrink-0 justify-between h-10 items-center"
      on:click={fieldClicked}>
      <div class="flex items-center">
        <span
          class="w-8 flex items-center justify-center {field.expandable ? 'opacity-100' : 'opacity-25'}">
          {#if isExpanded}▼{:else}▶{/if}
        </span>
        <span class="">{field.name}</span>
      </div>
      <span class="text-right pr-3" title={field.data}>
        {field.shortString}
      </span>
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
          {@html field.data}
        </span>
      </div>
    {/if}
  </li>
{/if}
