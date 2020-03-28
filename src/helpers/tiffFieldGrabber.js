/*
Tag List : http://www.loc.gov/preservation/digital/formats/content/tiff_tags.shtml

In order to grab the gigantic list of Tiff fields from the table on the site above and get them into a useable format, 
I copied the entire table element from that site into the sourceData var below, and then ran the following code.
Instead of dealing with file I/O I then simply copied the result into the tiffFields.js file, cleaned up and exported.

This is obviously not the best code in the world, but it's quick and gets the job done :)
*/
const sourceData = ``

//This was created using https://regex101.com/ for testing
const regExp = /<tr><td>(\d+)<\/td>[\w\W]+?<a[\w\W]+?>([\w\W]+?)<\/a><\/td>/g;

//Get all matches
const matches = sourceData.matchAll(regExp);

//Initialise an object to store the data
const fields = {}

//Loop through each match found
for (const match of matches) {

    //There are 2 groups defined in the regex, the first is the ID and the second is the name
    //Store name by ID in the fields object
    fields[match["1"]] = match[2]
}

//Print so you can copy and use
console.log(fields)