import { writable } from 'svelte/store'
import { GeodeProcessorState } from '../processor/GeodeProcessorState'

/*

GeodeStore contains : 
* file - original file object gathered through DnD or load dialog
* loading - boolean that defines whether the app is currently processing a file
* rawData - all the raw field data

*/

const geodeStoreDefaults = {
  file: null,
  processorState: GeodeProcessorState.IDLE,
  rawData: null
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
    setRawData: (data) => updateWrapper('rawData', data),
		reset: () => set({
      file: null
    })
	};
}

export const GeodeStore = createGeodeStore();