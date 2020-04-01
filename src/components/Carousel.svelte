<script>
  export let summaries

  let currentIndex = 0

  const next = e => {
    e.preventDefault()
    e.stopPropagation()
    currentIndex += 1
  }

  const prev = e => {
    e.preventDefault()
    e.stopPropagation()
    currentIndex -= 1
  }
</script>

<div class="mt-2 sm:mt-6 flex">
  {#if summaries && summaries.length}
    {#if summaries.length > 1}
      <div
        class="w-10 h-10 flex justify-end items-center select-none {currentIndex === 0 ? ' opacity-25 pointer-events-none' : ''}"
        style="transform:rotate(180deg);"
        on:click={prev}>
        <span>⮕</span>
      </div>
    {/if}

    <div class="w-64 h-48 pb-2">
      {@html summaries[currentIndex]}
    </div>

    {#if summaries.length > 1}
      <div
        class="w-10 h-10 flex justify-end items-center select-none {currentIndex === summaries.length - 1 ? ' opacity-25 pointer-events-none' : ''}"
        on:click={next}>
        <span>⮕</span>
      </div>
    {/if}
  {/if}
</div>
