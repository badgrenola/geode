<script>

    import { reader } from '../reader/reader'

    let isDropping = false;
    let file = false;

    //Define the drag/drop events
    const preventDefaults = (e) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const onDragEnter = (e) => {
        preventDefaults(e)
        isDropping = true
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
        file = e.dataTransfer.files[0];
        getFileInfo(file)
    }

    //Handle the actually file reading
    const getFileInfo = (file) => {
        reader.readAsText(file)
    }

    //Update the dropzone style depending on whether we're in process of dropping/already have a file
    let dropzoneClasses = null
    $: {
        dropzoneClasses = "w-full h-full bg-gray-200 rounded-lg"
        if (isDropping) { dropzoneClasses += " bg-blue-200"}
        else if (file) { dropzoneClasses += " bg-green-200"}
    }

</script>

<div class="w-full h-full p-8">
    <div
        class={dropzoneClasses}
        on:dragenter={onDragEnter}
        on:dragover={onDragOver}
        on:dragleave={onDragLeave}
        on:drop={onDrop}
    >
        <div class="h-full flex justify-center items-center text-2xl text-gray-600">
            {#if isDropping}
                <p>Let go to read the file!</p>
            {:else if file}
                <p>Current file is {file.name}</p>
            {:else}
                <p>Drop a file here!</p>
            {/if}
        </div>
    </div>
</div>