<script>
  export let size;
</script>

<style>
  @keyframes spinner {
    to {
      transform: rotate(360deg);
    }
  }

  .spinner:before {
    content: '';
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    position: absolute;
    border-radius: 50%;
    border: 2px solid #ccc;
    border-top-color: #234e52;
    animation: spinner 0.6s linear infinite;
  }

</style>


<div class="relative w-{size} h-{size} flex justify-center items-center overflow-hidden">
  <span class="spinner w-full h-full" />
</div>