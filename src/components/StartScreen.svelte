<script>

  import { GeodeStore } from '../stores/GeodeStore'

  //Get the interaction text
  let interactionMessage = ''
  let isMobile =
    'ontouchstart' in window ||
    navigator.MaxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  $: {
    const mobile = `Click the load icon above to browse for ${
      $GeodeStore.file ? 'another' : 'a'
    } file on your device`
    const desktop = `Drag ${
      $GeodeStore.file ? 'another' : 'a'
    } Tiff file into this window, or click the load icon above to browse`
    interactionMessage = isMobile ? mobile : desktop
  }
</script>

<p class="w-full h-full p-12 flex justify-center items-center text-center text-gray-900 font-light">{interactionMessage}</p>