const split = require('strsplit'),
      dcopy = require('deepcopy'),
      sortByKey = require('./alphasort'),
      uniq = require('./uniq'),
      arrayOccurrence = require('array-occurrence'),
      mongoose = require('mongoose'),
      Increment = require('./../models/increment'),
      stopWords = require('./stopWords');
      TempIndex = require('./../models/tempIndex');

class Indexing{

    getIncrements() {
        return new Promise((resolve, reject) => {
            Increment.findOne((err, result) => {
                if (err) console.log(err); 
                else resolve(result);
            })
        })
    }

    setIncrements(newSource, newPost) {
        return new Promise((resolve, reject) => {
            Increment.update({}, {$set: {post: newPost, source: newSource}}, (err, result) => {
                if (err) console.log(err); 
                else resolve(result);
            })
        })
    }

    indexAndPost(tmpIndexArray) {
        var source;
        var post;
        this.getIncrements().then((result) => {
            source = result.source;
            post = result.post;
            post++;
            source++;
            this.setIncrements(source, post).then((result) => {
           
            })           
        })

    }
    
    addNewDocument(text, summary) {
        var workingText,
            noDupArray,
            count = 0,
            tmpIndexArray = [],
            docNumber = 1; //change to dynamic

        return new Promise((resolve, reject) => {
            workingText = split(text.replace(/[^\w\s]/gi,''), /\s+/);//break text to words
            workingText = workingText.map(w => w.toLowerCase()); //convert all text in lowercase
            for(var i=0; i<workingText.length; i++){
                let tmpI = new TempIndex({
                    term: workingText[i],
                    docNumber: docNumber,
                    hits: 1
                })
                tmpIndexArray.push(tmpI);
            }
            tmpIndexArray = sortByKey(tmpIndexArray, 'term'); //sort text in alphabetical order
            uniq(tmpIndexArray, 'term', false, true); //reove duplicate words
            tmpIndexArray = stopWords(tmpIndexArray, 'term'); // remove all stop words
            for(var i=0; i<tmpIndexArray.length; i++){
                //count the hits for every word
                tmpIndexArray[i]['hits'] = arrayOccurrence(workingText, tmpIndexArray[i]['term'])
            }
            this.indexAndPost(tmpIndexArray);
            resolve(tmpIndexArray);
        });
    }
}

module.exports = () => {
    var indexing = new Indexing();
    return indexing;
}