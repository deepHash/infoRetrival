const Q = require('q'),
      Promise = require('bluebird'),
      split = require('strsplit'),
      dcopy = require('deepcopy'),
      sortByKey = require('./alphasort'),
      uniq = require('./uniq'),
      arrayOccurrence = require('array-occurrence'),
      mongoose = require('mongoose'),
      Increment = require('./../models/increment'),
      stopWords = require('./stopWords'),
      soundex = require('./soundex'),
      indexFile = require('./../models/indexFile'),
      postFile = require('./../models/postingFile'),
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
            Increment.update({}, {$set: {post: newPost, source: newSource}}, (err, result) => {
                if (err) console.log(err);
                else return(result);
            })
    }

    newIndex(term) {
        //Check if we already have this term in DB or its a first
        return new Promise((resolve, reject) => {
            indexFile.findOne({'term': term}, (err, result) => {
                if (err) console.log(err);
                else 
                    if (result == null)
                        resolve(true);
                    //if its an existing index, return it here:    
                    resolve(result);
            })
        })
    }
    updateIndex(updatedIndex) {
        return new Promise((resolve, reject) => {
            indexFile.update({'term': updatedIndex.term}, {updatedIndex}, {upsert: true}, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        })
    }

    indexAndPost(tmpIndexArray) {
        var source,
            post,
            promiseArray = [];
        this.getIncrements().then((result) => {
            post = result.post;
            source = result.source;
            //loop to get the terms that are already in the Index File
            for(let i=0;i<tmpIndexArray.length; i++){
                promiseArray.push(this.newIndex(tmpIndexArray[i]['term']));
            }
            Promise.all(promiseArray).then(function(responseArray){
                console.log(responseArray);
                for(let j=0; j<tmpIndexArray.length; j++){
                    //create a new entry in the post file for each
                    var newPost = new postFile({
                        post_id: ++post,
                        docNumber: tmpIndexArray[j]['docNumber'],
                        hits: tmpIndexArray[j]['hits'],
                        show: true     
                    });
                    //save to post file
                    // newPost.save((err) => {
                    //     if(err) console.log(err);
                    // })
                    if (responseArray[j] === true){
                        //if its first time in the indexing file, create a new entery in the indexing file
                        var newIndex = new indexFile({
                            term: tmpIndexArray[j]['term'],
                            numOfDocs: 1,
                            soundex: tmpIndexArray[j]['soundex'],
                            locations: [{'post_id': post}]
                        });
                        //save to the indexing file
                        // newIndex.save((err) => {
                        //     if (err) console.log(err);
                        // }) 
                    }
                    else{
                        //if its not the first time 
                        var updatedIndex = responseArray[j];
                        updatedIndex.locations.push({'post_id': post});
                        updatedIndex.numOfDocs++;
                        //console.log(updatedIndex);
                        //this.updateIndex(updatedIndex).then()
                    }                        
                }
                console.log("post is: ", post);
                this.setIncrements(source, post)
            });

        })
    }
    
    addNewDocument(text, summary) {
        var workingText,
            noDupArray,
            count = 0,
            tmpIndexArray = [],
            docNumber = 2; //change to dynamic

        return new Promise((resolve, reject) => {
            workingText = split(text.replace(/[^\w\s]/gi,''), /\s+/);//break text to words
            workingText = workingText.map(w => w.toLowerCase()); //convert all text in lowercase
            for(var i=0; i<workingText.length; i++){
                let tmpI = new TempIndex({
                    term: workingText[i],
                    docNumber: docNumber,
                    soundex: "",
                    hits: 1
                })
                tmpIndexArray.push(tmpI);
            }
            tmpIndexArray = sortByKey(tmpIndexArray, 'term'); //sort text in alphabetical order
            uniq(tmpIndexArray, 'term', false, true); //reove duplicate words
            tmpIndexArray = stopWords(tmpIndexArray, 'term'); // remove all stop words
            for(var i=0; i<tmpIndexArray.length; i++){
                //count the hits for every word
                tmpIndexArray[i]['hits'] = arrayOccurrence(workingText, tmpIndexArray[i]['term']);
                //add soundex code to each word
                tmpIndexArray[i]['soundex'] = soundex(tmpIndexArray[i]['term']);
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