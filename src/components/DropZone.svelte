<script>

    //Setup the props
    export let loading = false
    export let errorMessage = null
    export let successMessage = null
    export let success = false
    export let onFileSelected = null
    export let allowedType = "image/tiff"

    //Setup the internal state
    let isDropping = false

    //Check for touch events
    let isMobile = (('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0))

    //Helper function to prevent event defaults/bubbling
    const preventDefaults = (e) => {
        e.preventDefault()
        e.stopPropagation()
    }

    //Define the drag/drop events
    const onDragEnter = (e) => {
        preventDefaults(e)

        //Don't do anything if we're already loading
        if (loading) { return }

        //Update state
        isDropping = true
    }

    const onDragOver = (e) => {
        preventDefaults(e)

        //Don't do anything if we're already loading
        if (loading) { return }

        //Update state
        isDropping = true
    }

    const onDragLeave = (e) => {
        preventDefaults(e)

        //Don't do anything if we're already loading
        if (loading) { return }

        //Update state
        isDropping = false
    }

    const onDrop = (e) => {
        preventDefaults(e)

        //Don't do anything if we're already loading
        if (loading) { return }

        //Update state
        isDropping = false

        //Ensure file is a tiff
        if (e.dataTransfer.files[0].type == allowedType) {
            if (onFileSelected) { onFileSelected(e.dataTransfer.files[0]) }
        } else {
            errorMessage = "File was not a tiff :("
            file = null
        }
    }

    //Setup the methods for click/file select
    const onClick = (e) => {
        //Don't do anything if we're already loading
        if (loading) { return }

        //Get the hidden input and click
        document.getElementById("hiddenFileInput").click()
    }

    const selectedFile = (e) => {
        preventDefaults(e)

        //If a file was chosen, run the callback
        if (e.target.files.length) {
            if (onFileSelected) { onFileSelected(e.target.files[0]) }
        }
    }

    //Update the dropzone style depending on whether we're in process of dropping/already have a file
    let dropzoneClasses = null
    $: {
        dropzoneClasses = "w-full h-full bg-gray-200 rounded-lg cursor-pointer"
        if (errorMessage) { dropzoneClasses += " border-dashed border-4 border-red-500"}
        else if (isDropping) { dropzoneClasses += " border-dashed border-4 border-green-500"}
        else if (success) { dropzoneClasses += " border-4 border-green-400"}
    }

</script>

<div class="w-full h-full">
    <input 
        id="hiddenFileInput" 
        type="file" 
        class="hidden" 
        on:change={selectedFile}
        accept={allowedType}
    />
    <div
        class={dropzoneClasses}
        on:dragenter={onDragEnter}
        on:dragover={onDragOver}
        on:dragleave={onDragLeave}
        on:drop={onDrop}
        on:click={onClick}
    >
        <div class="h-full flex flex-col justify-center items-center text-gray-600 font-light text-sm sm:text-base overflow-hidden">
            <div class="p-4 text-center" style="word-break:break-word;">
                {#if loading}
                    <p> Loading...</p>
                {:else if isDropping}
                    <p>Let go to try and read the file!</p>
                {:else if success}
                    {#if successMessage}
                        <p>{successMessage}</p>
                    {/if}
                    {#if isMobile}
                        <p class="mt-4">{!successMessage && "Success! "}Click her to browse for another file on your device</p>
                    {:else}
                        <p class="mt-4">{!successMessage && "Success! "}Drag another file here or click to browse</p>
                    {/if}
                {:else if errorMessage}
                    <p>Error : {errorMessage}</p>
                    {#if isMobile}
                        <p class="mt-4">Click her to browse for another file on your device</p>
                    {:else}
                        <p class="mt-4">Drag another file here or click to browse</p>
                    {/if}
                {:else}
                    {#if isMobile}
                        <p>Click here to browse for a file on your device</p>   
                    {:else}
                        <p>Drag a file here or click to browse</p>   
                    {/if}
                {/if}
            </div>
        </div>
    </div>
</div>