<script>
  import Header from './components/Header.svelte'
  import DropZone, { showFileBrowser } from './components/DropZone.svelte'
  import StartScreen from './components/StartScreen.svelte'
  import FileLayout from './components/FileLayout.svelte'
  import Footer from './components/Footer.svelte'

  import { GeodeStore } from './stores/GeodeStore.js'
  import { onNewFileSelected } from './processor/GeodeProcessor'
</script>

<main class="w-full h-full">
  <div class="flex flex-col h-full">
    <Header onLoadButtonPressed={(showFileBrowser)} />
    <div class="w-full flex-1 overflow-hidden relative">
      <DropZone 
          onFileSelected={onNewFileSelected}
        >
      </DropZone>
      {#if $GeodeStore.file === undefined}
        <StartScreen />
      {:else}
        <FileLayout />
      {/if}
    </div>
    <Footer />
  </div>
</main>
