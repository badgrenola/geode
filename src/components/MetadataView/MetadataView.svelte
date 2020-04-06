<script>
  import { GeodeMetadataStore } from '../../stores/GeodeMetadataStore'
  import { GeodeBandStore } from '../../stores/GeodeBandStore'
  import MetadataKeySection from './MetadataKeySection.svelte'

  //Store the name of the currenty expanded field, if any
  let expandedField = null

  //Set the sections
  let keySections = ['Geo', 'Image', 'Structure', 'Other']

  //Toggle the currently expanded field
  const toggleSelectedField = fieldName => {
    if (expandedField === fieldName) {
      expandedField = null
    } else {
      expandedField = fieldName
    }
  }
</script>

<div class="p-3 pr-1 pb-0 overflow-hidden flex flex-col">
  <span class="h-8 font-semibold text-teal-700 text-sm flex-shrink-0 ">Tags</span>
  <div class="w-full flex-1 flex flex-col overflow-hidden">
    {#if !$GeodeMetadataStore.ifdFields}
      <div class="flex w-full h-full items-center justify-center">
        <p>Processing</p>
      </div>
    {:else}
      <div class="flex-1 overflow-x-hidden overflow-y-scroll select-none pr-2">
        {#each keySections as keySection}
          <MetadataKeySection 
            sectionName={keySection}
            fields={$GeodeMetadataStore.ifdFields[$GeodeBandStore.currentBandIndex][keySection.toLowerCase()]}
            expandedField={expandedField}
            onToggle={toggleSelectedField}
          />
        {/each}
      </div>
    {/if}
  </div>
</div>