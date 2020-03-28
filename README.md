# Geode - A work-in-progress, (soon-to-be) hopefully really very helpful GeoTIFF preview tool 👍

Geode is a prototype web-app that allows you to view all metadata included with a given GeoTiff file, just by dragging/dropping it into the browser. It's [currently running live here](https://mattbrealey.com/geode).

It's written using [Svelte](https://svelte.dev/) and [TailwindCSS](https://tailwindcss.com/), and processes the binary Tiff file using a Web Worker.

Right now, it shows some relatively arbitrary result data in the UI, but behind the scenes all metadata has been gathered and stored ready for use.

The next step is to implement a full, final UI design in which I can display the stored data, a low-res image preview, and potentially a [ThreeJS](https://threejs.org/)-based 3D preview as well.

You can [find more info here](https://mattbrealey.com/projects/geode).

Cheers!