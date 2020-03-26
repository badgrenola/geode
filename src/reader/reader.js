var reader = new FileReader();

// file reading started
reader.addEventListener('loadstart', function() {
    console.log('File reading started');
});

// file reading finished successfully
reader.addEventListener('load', function(e) {
    var text = e.target.result;

    // contents of the file
    console.log("Finished loading the whole file very inefficiently");
});

// file reading failed
reader.addEventListener('error', function() {
    alert('Error : Failed to read file');
});

// file read progress 
reader.addEventListener('progress', function(e) {
    if(e.lengthComputable == true) {
    	var percent_read = Math.floor((e.loaded/e.total)*100);
    	console.log(percent_read + '% read');
    }
});

export { reader }