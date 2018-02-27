const split = require('strsplit'),
      alphaSort = require('alpha-sort'),
      uniq = require('uniq'),
      arrayOccurrence = require('array-occurrence'),
      TempIndex = require('./../models/tempIndex');

class Indexing{
    
    addNewDocument(text, summary) {
        var workingText,
            noDupArray,
            count = 0,
            tmpIndexArray = [],
            docNumber = 1; //change to dynamic

        return new Promise((resolve, reject) => {
            workingText = split(text.replace(/[^\w\s]/gi,''), /\s+/);//break text to words
            workingText.sort(alphaSort.asc); //sort text in alphabetical order
            workingText = workingText.map(w => w.toLowerCase()); //convert all text in lowercase
            noDupArray = Array.from(workingText);
            uniq(noDupArray);
            for(var i=0; i<noDupArray.length; i++){
                let tmpI = new TempIndex({
                    term: noDupArray[i],
                    docNumber: docNumber,
                    hits: arrayOccurrence(workingText, noDupArray[i])
                })
                tmpIndexArray.push(tmpI);
            }
            resolve(tmpIndexArray);
        });
    }
}

module.exports = () => {
    var indexing = new Indexing();
    return indexing;
}