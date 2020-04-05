import { GeodeStore } from '../stores/GeodeStore.js'
import { derived, writable } from 'svelte/store'

/*

GeodeBandStore derives from rawHeader, contains : 
* bandCount - the total number of bands (IFDs) available in the file
* currentBandIndex - the currently displayed/active band index

*/

//Setup a writable store for the current index value
const CurrentBandIndex = writable(0)

//Create a custom store which combines values derived from the main GeodeStore, and the CurrentBandIndex with an update function
const createGeodeBandStore = () => {

  //Setup the derived store
  const { subscribe } = derived(
    [CurrentBandIndex, GeodeStore],
    ([$CurrentBandIndex, $GeodeStore], set) => {

      //Update the derived store based on current band index/geode store 
      const bandCount =
        $GeodeStore.rawData !== null ? $GeodeStore.rawData.ifds.length : null
      set({
        bandCount,
        currentBandIndex: $CurrentBandIndex,
      })
    }
  )

  //Return a custom store with the derived values AND a method to update the CurrentBandIndex
  return {
    subscribe,
    setBandIndex: (newIndex) => {
      CurrentBandIndex.update((n) => newIndex)
    },
  }
}

export const GeodeBandStore = createGeodeBandStore()
