<script>
  import { GeodeMetadataStore } from '../../stores/GeodeMetadataStore'
  import { GeodeBandStore } from '../../stores/GeodeBandStore'
  import MetadataItem from './MetadataItem.svelte'

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

<div class="w-full flex-1 flex flex-col overflow-hidden">
  {#if !$GeodeMetadataStore.ifdFields}
  <div class="flex w-full h-full items-center justify-center">
    <p>Processing</p>
  </div>
  {:else}
    <div class="flex-1 overflow-x-hidden overflow-y-scroll select-none">
      <ul>
        {#each $GeodeMetadataStore.ifdFields[$GeodeBandStore.currentBandIndex] as field}
          <MetadataItem
            {field}
            isExpanded={expandedField === field.name}
            onToggle={toggleSelectedField} />
        {/each}
      </ul>
    </div>
  {/if}
</div>
