<script>
  export let onLoadButtonPressed
</script>

<div class="flex flex-row h-12 bg-teal-800 pl-3 items-center justify-between">
  <h1 id="geodeTitle" class="flex-1 text-gray-100 text-3xl">Geode</h1>
  <button
    type="button"
    class="h-full w-12 flex justify-center sm:p outline-none focus:outline-none
    sm:opacity-75 hover:opacity-100"
    on:click={onLoadButtonPressed}>
    <img src="images/loadIcon.svg" alt="Load" class="w-6 h-6" />
  </button>
</div>
