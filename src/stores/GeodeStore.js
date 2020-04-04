import { writable } from 'svelte/store'
import { GeodeProcessorState } from '../processor/GeodeProcessor'

/*

GeodeStore contains : 
* file - original file object gathered through DnD or load dialog
* loading - boolean that defines whether the app is currently processing a file
* rawHeader - all the raw field data

GeodeMetadataStore derives from rawHeader, contains : 
* fields - nicely formatted field information for the metadata items list, including short-strings/formatted data for display

*/

const geodeStoreDefaults = {
  file: null,
  processorState: GeodeProcessorState.IDLE,
  rawHeader: null
}

const createGeodeStore = () => {
  const { subscribe, set, update } = writable(geodeStoreDefaults);
  
  const updateWrapper = (field, value) => {
    update(state => {
      //Update the value
      state[field] = value

      //Return the updated state
      return state
    })
  }

	return {
    subscribe,
    setFile: (data) => updateWrapper('file', data),
    setProcessorState: (data) => updateWrapper('processorState', data),
    setRawHeader: (data) => updateWrapper('rawHeader', data),
		reset: () => set({
      file: null
    })
	};
}

export const GeodeStore = createGeodeStore();