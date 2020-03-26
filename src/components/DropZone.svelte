<script>

    import { reader } from '../reader/reader'

    let isDropping = false;
    let file = null;
    let errorMessage = null;

    //Check for touch events
    let isMobile = (('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0))

    //Define the input file browse events
    const selectedFile = (e) => {
        e.preventDefault()
        errorMessage = null

        //If a file was chosen, store it
        if (e.target.files.length) {
            file = e.target.files[0]
        }
    }

    //Define the drag/drop events
    const preventDefaults = (e) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const onDragEnter = (e) => {
        preventDefaults(e)
        isDropping = true
        errorMessage = null
    }

    const onDragOver = (e) => {
        preventDefaults(e)
        isDropping = true
    }

    const onDragLeave = (e) => {
        preventDefaults(e)
        isDropping = false
    }

    const onDrop = (e) => {
        preventDefaults(e)
        isDropping = false

        //Ensure file is a tiff
        if (e.dataTransfer.files[0].type == "image/tiff") {
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
        reader.readAsText(file)
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
        accept="image/tiff"
        on:change={selectedFile}
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
                {#if isDropping}
                    <p>Let go to try and read the file!</p>
                {:else if file}
                    <p class="text-center">Current file is : <i>{file.name}</i></p>
                    <p class="text-center mt-4">Drag another file here or click to browse</p>
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