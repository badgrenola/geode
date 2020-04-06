<script>
  import MetadataItem from './MetadataItem.svelte'

  export let sectionName
  export let fields
  export let expandedField
  export let onToggle

  $: console.log(fields)
</script>

<h3
  class="pl-4 h-6 flex flex-col justify-center font-semibold text-gray-100
  text-xs bg-teal-700 rounded-sm">
  {sectionName}
</h3>
<ul class="">
  {#each fields as field}
    <MetadataItem
      {field}
      isExpanded={expandedField === field.name}
      {onToggle} />
  {/each}
</ul>
