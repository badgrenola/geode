<script context="module">
  //Setup the methods for click/file select
  export const showFileBrowser = e => {

    //We can show the file browser. 
    e.preventDefault()
    e.stopPropagation()

    //Get the hidden input and click
    document.getElementById('hiddenFileInput').click()
  }
</script>

<script>
  //Setup the props
  export let loading = false
  export let errorMessage = null
  export let onFileSelected = null
  export let allowedType = 'image/tiff'

  let fileNotValid = false

  //Setup the internal state
  let isDropping = false

  //Helper function to prevent event defaults/bubbling
  const preventDefaults = e => {
    e.preventDefault()
    e.stopPropagation()
  }

  const fileSelected = e => {
    preventDefaults(e)

    //If a file was chosen, run the callback
    if (e.target.files.length) {
      if (onFileSelected) {
        onFileSelected(e.target.files[0])
      }
    }
  }

  const setIsDroppingFromEvent = (e, state) => {
    preventDefaults(e)

    //Don't do anything if we're already loading
    if (loading) {
      return
    }

    //Update state
    isDropping = state
  }

  //Define the drag/drop events
  const onDragEnter = e => {
    setIsDroppingFromEvent(e, true)
  }

  const onDragOver = e => {
    setIsDroppingFromEvent(e, true)
  }

  const onDragLeave = e => {
    setIsDroppingFromEvent(e, false)
  }

  const onDrop = e => {

    //Update states
    setIsDroppingFromEvent(e, false)
    fileNotValid = false

    //Ensure file is a tiff
    if (e.dataTransfer.files[0].type == allowedType) {
      if (onFileSelected) {
        onFileSelected(e.dataTransfer.files[0])
      }
    } else {
      fileNotValid = true
    }
  }

  //Update the dropzone style depending on whether we're in process of dropping/already have a file
  let dropzoneClasses = null
  $: {
    dropzoneClasses = 'w-full h-full pointer-events-none'
    if (errorMessage || (fileNotValid && !isDropping)) {
      dropzoneClasses += ' border-dashed border-4 border-red-500'
    } else if (isDropping) {
      dropzoneClasses += ' border-dashed border-4 border-green-500'
    }
  }
</script>

<svelte:window
  on:dragenter={onDragEnter}
  on:dragover={onDragOver}
  on:dragleave={onDragLeave}
  on:drop={onDrop} />
<div
  class="w-full h-full absolute z-10 pointer-events-none" draggable="true">
  <input
    id="hiddenFileInput"
    type="file"
    class="hidden"
    on:change={fileSelected}
    accept={allowedType} />
  <div class={dropzoneClasses}>
    <div class="relative w-full h-full">
      <div
        class="absolute top-0 w-full h-full {isDropping ? ' bg-gray-100 opacity-75' : ''}" />
      {#if isDropping}
        <slot name="dropping" />
      {/if}
    </div>
  </div>
  <div class="w-full h-full flex flex-col overflow-hidden relative">
    {#if errorMessage}
      <slot name="error" />
    {:else if fileNotValid}
      <slot name="fileNotValid" />
    {:else if !isDropping}
      <slot name="start" />
    {/if}
  </div>
</div>
