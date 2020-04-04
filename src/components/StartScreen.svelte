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
    } file in or click the load icon above to browse`
    interactionMessage = isMobile ? mobile : desktop
  }
</script>

<p>{interactionMessage}</p>