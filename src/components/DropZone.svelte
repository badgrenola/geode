<script>

    // import { reader } from '../reader/reader'

    //Setup the web worker
    let worker = new Worker("./worker/test.js")
    worker.onmessage = function(e){
        //Update the state from the worker info
        fileDetails = e.data
        loading = false
    };

    //Setup the state
    let isDropping = false
    let file = null
    let errorMessage = null
    let loading = false
    let fileDetails = null

    //Set the allowed types
    let allowedType = "image/tiff"

    //Check for touch events
    let isMobile = (('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0))

    //Define the input file browse events
    const selectedFile = (e) => {
        e.preventDefault()
        errorMessage = null

        //If a file was chosen, store it
        if (e.target.files.length) {
            file = e.target.files[0]
            getFileInfo(file)
        }
    }

    //Define the drag/drop events
    const preventDefaults = (e) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const onDragEnter = (e) => {
        preventDefaults(e)

        //Don't do anything if we're already loading
        if (loading) { return }

        //Update state
        isDropping = true
        errorMessage = null
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
            file = e.dataTransfer.files[0];
            getFileInfo(file)
        } else {
            errorMessage = "File was not a tiff :("
            file = null
        }
    }

    const onClick = (e) => {
        //Get the hidden input and click
        document.getElementById("hiddenFileInput").click()
    }

    //Handle the actually file reading
    const getFileInfo = (file) => {

        //Clear the old file details
        fileDetails = null

        //Post file to webworker for reading
        worker.postMessage(file);

        //Set state to loading
        loading = true
    }

    //Update the dropzone style depending on whether we're in process of dropping/already have a file
    let dropzoneClasses = null
    $: {
        dropzoneClasses = "w-full h-full bg-gray-200 rounded-lg cursor-pointer"
        if (errorMessage) { dropzoneClasses += " border-dashed border-4 border-red-500"}
        else if (isDropping) { dropzoneClasses += " border-dashed border-4 border-green-500"}
        else if (file) { dropzoneClasses += " border-4 border-green-400"}
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
        <div class="h-full flex flex-col justify-center items-center text-gray-600 font-light text-sm sm:text-base">
            <div class="p-4 text-center">
                {#if loading}
                    <p> Loading...</p>
                {:else if isDropping}
                    <p>Let go to try and read the file!</p>
                {:else if file}
                    <p>Current file is : <i>{file.name}</i></p>
                    <p class="mt-4">{fileDetails}</p>
                    {#if isMobile}
                        <p class="mt-4">Click her to browse for another file on your device</p>
                    {:else}
                        <p class="mt-4">Drag another file here or click to browse</p>
                    {/if}
                {:else if errorMessage}
                    <p>{errorMessage}</p>
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