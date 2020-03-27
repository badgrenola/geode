//Polyfill for require
//https://stackoverflow.com/a/49237306
function requireWW(moduleName) {
  self.module = { exports: null };
  importScripts(moduleName);
  return self.module.exports;
}

//Import the reader
requireWW('./reader.js') // Needs full file name + ext

//Set the reader onload callback
setReaderOnLoadCallback((arrayBuffer) => {
  postMessage(`Array Buffer is ${arrayBuffer.byteLength} bytes long`)
})

//Setup the on message
onmessage = (e) => {
  //Start reading the file
  reader.readAsArrayBuffer(e.data)
}