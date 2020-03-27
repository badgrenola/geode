//Polyfill for require
//https://stackoverflow.com/a/49237306
function requireWW(moduleName) {
  self.module = { exports: null };
  importScripts(moduleName);
  return self.module.exports;
}

//Import the reader
requireWW('./tiffReader.js') // Needs full file name + ext

//Setup the on message
onmessage = (e) => {

  //Get the file
  const file = e.data

  //Pass to the tiff reader to begin reading
  const tiffReader = new TiffReader(file, (headerDict) => {
    postMessage(headerDict)
  })
}