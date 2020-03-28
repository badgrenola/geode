//Polyfill for require
//https://stackoverflow.com/a/49237306
function requireWW(moduleName) {
  self.module = { exports: null };
  importScripts(moduleName);
  return self.module.exports;
}

//Import the reader
requireWW('./tiffReader.js') // Needs full file name + ext
requireWW('./tiffFields.js') // Needs full file name + ext

//Setup the on message
onmessage = (e) => {

  //Get the file
  const file = e.data

  //Pass to the tiff reader to begin reading
  const onLoad = (fileInfo) => { postMessage({data:fileInfo, error:null}) }
  const onError = (errorMessage) => { postMessage({data:null, error:errorMessage}) }
  const tiffReader = new TiffReader(file, onLoad, onError)
}