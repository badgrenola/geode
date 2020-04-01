<script>
  //Setup the props
  export let loading = false
  export let errorMessage = null
  export let success = false
  export let onFileSelected = null
  export let allowedType = 'image/tiff'

  let fileNotValid = false

  //Setup the internal state
  let isDropping = false

  //Check for touch events
  let interactionMessage = ''
  let isMobile =
    'ontouchstart' in window ||
    navigator.MaxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  $: {
    const mobile = `Click here to browse for ${
      success ? 'another' : 'a'
    } file on your device`
    const desktop = `Drag ${
      success ? 'another' : 'a'
    } file in or click here to browse`
    interactionMessage = isMobile ? mobile : desktop
  }

  //Helper function to prevent event defaults/bubbling
  const preventDefaults = e => {
    e.preventDefault()
    e.stopPropagation()
  }

  //Define the drag/drop events
  const onDragEnter = e => {
    preventDefaults(e)

    //Don't do anything if we're already loading
    if (loading) {
      return
    }

    //Update state
    isDropping = true
  }

  const onDragOver = e => {
    preventDefaults(e)

    //Don't do anything if we're already loading
    if (loading) {
      return
    }

    //Update state
    isDropping = true
  }

  const onDragLeave = e => {
    preventDefaults(e)

    //Don't do anything if we're already loading
    if (loading) {
      return
    }

    //Update state
    isDropping = false
  }

  const onDrop = e => {
    preventDefaults(e)

    //Don't do anything if we're already loading
    if (loading) {
      return
    }

    //Update state
    isDropping = false
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

  //Setup the methods for click/file select
  const onClick = e => {
    //Don't do anything if we're already loading
    if (loading) {
      return
    }
    preventDefaults(e)

    //Get the hidden input and click
    document.getElementById('hiddenFileInput').click()
  }

  const selectedFile = e => {
    preventDefaults(e)

    //If a file was chosen, run the callback
    if (e.target.files.length) {
      if (onFileSelected) {
        onFileSelected(e.target.files[0])
      }
    }
  }

  //Update the dropzone style depending on whether we're in process of dropping/already have a file
  let dropzoneClasses = null
  $: {
    dropzoneClasses = 'w-full h-full cursor-pointer'
    if (errorMessage || (fileNotValid && !isDropping)) {
      dropzoneClasses += ' border-dashed border-4 border-red-500'
    } else if (isDropping) {
      dropzoneClasses += ' border-dashed border-4 border-green-500'
    } else if (success) {
      dropzoneClasses += ' border-solid border-4 border-white'
    }
  }
</script>

<div class="w-full h-full">
  <input
    id="hiddenFileInput"
    type="file"
    class="hidden"
    on:change={selectedFile}
    accept={allowedType} />
  <div
    class={dropzoneClasses}
    on:dragenter={onDragEnter}
    on:dragover={onDragOver}
    on:dragleave={onDragLeave}
    on:drop={onDrop}
    on:click={e => {
      if (!success) {
        onClick(e)
      }
    }}>
    <div
      class="h-full flex flex-col text-gray-600 font-light text-sm sm:text-base
      overflow-hidden relative">
      {#if errorMessage || (fileNotValid && !isDropping)}
        <slot name="error" />
      {:else if success}
        <slot name="success" />
      {:else if loading}
        <slot name="loading" />
      {:else if isDropping}
        <slot name="dropping" />
      {:else if fileNotValid}
        <slot name="fileNotValid" />
      {:else}
        <slot name="start" />
      {/if}
    </div>
  </div>
</div>
