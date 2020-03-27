var reader = new FileReader()

// file reading started
reader.addEventListener('loadstart', function() {
    console.log('File reading started')
});

// file reading finished successfully
reader.addEventListener('load', function(e) {

    console.log('File reading finished')

    //Get the array buffer
    const arrayBuffer = e.target.result

    //Run the callback with the array buffer
    if (readerOnLoadCallback) {
        readerOnLoadCallback(arrayBuffer)
    }
});

// file reading failed
reader.addEventListener('error', function() {
    alert('Error : Failed to read file')
});

// file read progress 
reader.addEventListener('progress', function(e) {
    if(e.lengthComputable == true) {
    	var percent_read = Math.floor((e.loaded/e.total)*100)
    	console.log(percent_read + '% read')
    }
});

var readerOnLoadCallback = null;
function setReaderOnLoadCallback(callback) {
    readerOnLoadCallback = callback
}