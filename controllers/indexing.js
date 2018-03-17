const Promise = require('bluebird'),
      split = require('strsplit'),
      sortByKey = require('./alphasort'),
      uniq = require('./uniq'),
      mongoose = require('mongoose'),
      Increment = require('./../models/increment'),
      stemmer = require('./stemmer'),
      stopWords = require('./stopWords'),
      soundex = require('./soundex'),
      sourceLibrary = require('./../models/sourceLibrary'),
      indexFile = require('./../models/indexFile'),
      postFile = require('./../models/postingFile'),
      TempIndex = require('./../models/tempIndex');

class Indexing{

    /**
     * The following methods are inside class methods and not called
     * By any route from a server, they are to be used internally only!
     */

    getIncrements() {
        return new Promise((resolve, reject) => {
            Increment.findOne((err, result) => {
                if (err) console.log(err); 
                else resolve(result);
            })
        })
    }

    getUnparsedDocuments() {
        return new Promise((resolve, reject) => {
            sourceLibrary.find({parsed: false},(err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
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
    /**currently not in use, buggy from Promise.all inside indexAndPost() */
    updateIndex(updatedIndex) {
        return new Promise((resolve, reject) => {
            indexFile.update({'term': updatedIndex.term}, {updatedIndex}, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        })
    }

    duplicateInOneParse() {

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
            //update the post counter per post files to be added to DB
            Increment.update({$inc:{'post': tmpIndexArray.length}}, (err) =>{
                if (err) console.log(err)
            });
            Promise.all(promiseArray).then(function(responseArray){
                for(let j=0; j<tmpIndexArray.length; j++){
                    //create a new entry in the post file for each
                    var newPost = new postFile({
                        post_id: ++post,
                        docNumber: tmpIndexArray[j]['docNumber'],
                        hits: tmpIndexArray[j]['hits'],
                        show: true     
                    });
                    //save to post file
                    newPost.save((err) => {
                        if(err) console.log(err);
                    })
                        if (responseArray[j] === true){
                            //if its first time in the indexing file, create a new entery in the indexing file
                            var newIndex = new indexFile({
                                term: tmpIndexArray[j]['term'],
                                numOfDocs: 1,
                                soundex: tmpIndexArray[j]['soundex'],
                                locations: [{'post_id': post}]
                            });
                            responseArray[j] = newIndex;
                            // save to the indexing file
                            newIndex.save((err) => {
                                if (err) console.log(err);
                             }) 
                                }
                        else{
                            //if its not the first time 
                            var updatedIndex = responseArray[j];
                            updatedIndex.locations.push({'post_id': post});
                            updatedIndex.numOfDocs++;
                            //UPDATE the INDEX FILE
                            responseArray[j] = updatedIndex;
                             indexFile.findOneAndUpdate({'term': updatedIndex.term},
                                       {$set:{"numOfDocs": updatedIndex.numOfDocs,
                                            "locations": updatedIndex.locations}}, 
                                (err, result) => {
                                    if (err) console.log(err);
                                });
                            //END OF INDEX FILE update
                         }
                         //incase we have two words from diffrent documents  
                        if((j+1 != tmpIndexArray.length) && tmpIndexArray[j]['term'] === tmpIndexArray[j+1]['term']){
                            responseArray[j+1] = responseArray[j];
                        }                  
                }
            });

        })
    }

    getBinaryExpression(arg1, arg2, op) {

    }

    getPostFromDB(post) {
        return new Promise((resolve, reject) => {
            postFile.find({$and: [{'post_id': post}, {'show': true}]}, (err, result) => {
                if (err) reject (err);
                else if(result == null) resolve(null);
                else {resolve(result[0])}
            }) 
        })
    }
    
    getDocByPostID(indexs){
        var promiseArray = [];
        return new Promise((resolve, reject) => {
            if (typeof(indexs) == Array) {
                for (let i=0; i<indexs.length; i++) {
                    for (let j=0; j<indexs[i].location.length; j++) {
                        promiseArray.push(this.getPostFromDB(indexs[i].locations[j].post_id));
                    } 
                }
            }
            else {
                for (let j=0; j<indexs.locations.length; j++) {
                    promiseArray.push(this.getPostFromDB(indexs.locations[j].post_id));
                }
            }
            Promise.all(promiseArray).then(function(documentsArray){
                //remove empty undefined results
                documentsArray = documentsArray.filter(function(n){ return n != undefined });
                resolve(documentsArray)
            });
        })
    }

    getDocumentNumber(term, soundex) {
        return new Promise((resolve, reject) => {
            var docArray = [];
            
            //if we need to get indexes not only by exact term but the ones that sound similar aswell
            if (soundex) {
                indexFile.find({$or: [{'term': term}, {'soundex': soundex(term)}]}, (err, result) => {
                    if (err) reject(err);
                    else {
                        this.getDocByPostID(result).then((res, err) => {
                            for(let i in res) {
                                docArray.push(res[i].docNumber)
                            }
                            resolve(docArray);
                        })
                    };
                })               
            }
            else {
                indexFile.findOne({'term': term}, (err, result) => {
                    if (err) reject(err);
                    else {
                        this.getDocByPostID(result).then((res, err) => {
                            for(let i in res) {
                                docArray.push(res[i].docNumber)
                            }
                            resolve(docArray);
                        })
                    };
                })
            }
        })
    }

    isOperator(word) {
        if (word == "and" || word == "or" || word == "not")
            return true;
        else
            return false;
    }

    /**
     * The following methods are called by routes only from the server.js file
     */

    getSearch(query, soundex) {
        var search;
        var pStart,
            pEnd,
            pArray = []; // airplane variable
         return new Promise((resolve, reject) => {
            search = split(query.replace(/^[\w\s() ]/,query[0]));
            //** the following code returns the relevant post IDs, need to check with multiple and soundex */
            // for (let i in search) {
            //         if(search[i][0] == '(' && search[i] != '(not') {
            //             let word = search[i];
            //             this.getBinaryExpression(search[i], search[i+2], search[i+1])
            //             console.log(search[i][word.length-1]);
            //             search.splice(i,3);
            //         }
            //         else if(search[i] == '.') {
                        
            //         }
                
            // }
            
            //END OF THE FOLLOWING CODE

            
            search = search.map(w => stemmer(w.toLowerCase()));
            for (let i in search) {
                if (!this.isOperator(search[i])){
                    this.getDocumentNumber(search[i], false).then((result, err) => {
                       pArray.push(result)
                    })
                }
                else {pArray.push(search[i]);}   
            }
            /**@ToDo 7/3 Airplane code, no internet, double check! */
            for(let i=0; i<search.length; i++) {
                if(search[i][0] == '(') {
                    for(let j=i; j<search.length; j++){
                        let word = search[j];
                        pArray.push(search[j]);
                        if(word[word.length-1] == ')') {
                            //console.log("test", word);
                        }

                    }
                } 
            }
            resolve(pArray);
         })
     }

    getAllDocuments() {
        return new Promise((resolve, reject) => {
            sourceLibrary.find({}, '-_id', (err, result) => {
                if (err) reject(err);
                else resolve(result);
            })
        })    
    }

    getDocumentByID(id) {
        return new Promise((resolve, reject) => {
            sourceLibrary.find({'id': id}, '-_id', (err, result) => {
                if (err) reject(err);
                else resolve(result[0]);
            })
        }) 
    }
    
    parseDocuments() {
        var workingText,
            tmpIndexArray = [],
            documentCounter = 0,
            docNumber = -1;

        return new Promise((resolve, reject) => {
            this.getUnparsedDocuments().then((result) => {
                if(!result[0]){
                    //no new documents to parse
                    resolve(null);
                }
                else {
                    for (let r=0; r<result.length; r++, documentCounter++){
            headers = docHeader;
                        workingText = split(result[r].text.replace(/[^\w\s]/gi,''), /\s+/);//break text to words
                        workingText = workingText.map(w => stemmer(w.toLowerCase())); //convert all text in lowercase and stemm them
                        for(let i=0; i<workingText.length; i++){
                            if(workingText[i] !== ""){
                                let tmpI = new TempIndex({
                                    term: workingText[i],
                                    docNumber: result[r].id,
                                    soundex: soundex(workingText[i]),
                                    hits: 1
                                })
                                tmpIndexArray.push(tmpI);
                            }
                        }
                        //update in sourceLibrary the parsing boolean
                       sourceLibrary.updateOne({'id': result[r].id}, {$set: {'parsed': true}},
                                       (err, result) => {if (err) console.log(err)});                   
                    }
                    tmpIndexArray = sortByKey(tmpIndexArray, 'term'); //sort text in alphabetical order
                    tmpIndexArray = stopWords(tmpIndexArray, 'term'); // remove all stop words
                    uniq(tmpIndexArray);// remove duplicates and update hits
    
                    this.indexAndPost(tmpIndexArray);//create index and post files
                }
                resolve(documentCounter);
            });
        });
    }

    addNewDocument(docHeader, docText) {
        var source = -1,
            headers = docHeader;
        return new Promise((resolve, reject) => {
            //get the current index (ID) for the sourceLibrary elements
            this.getIncrements().then((result) => {
                source = result.source;
                if (source == -1) resolve(new Error('Source counter not updating properly'));
                //if successfully got the index from DB, increment by 1 and save to DB
                 Increment.update({$inc:{'source': 1}}, (err) =>{
                    if (err) console.log(err)
                 });                
                //create a new document for the Source Library
                let newDocument = new sourceLibrary({
                    id: source,
                    name: headers.name,
                    author: headers.author,
                    date: headers.date,
                    text: docText,
                    summary: headers.summary,
                    parsed: false,
                    show: true    
                })
                //save to the source library
                newDocument.save((err) => {
                    if (err) resolve("ERROR in document insertion, ",err);
                    else resolve(`Entered as SourceID ${source} the following documenet: ${headers.name}`);
                })                   
            })
        })
    }

    removeDocument(id) {
        return new Promise((resolve, reject) => {
                sourceLibrary.update({'docNumber': id}, 
                {$set:{"show": false}}, (err) => {
                    if (err) reject (err);
                });

                postFile.updateMany({'docNumber': id},
                {$set:{"show": false}}, (err, result) => {
                    if (err) reject(err);
                    else resolve(result)
              });
        })
    }
}


module.exports = () => {
    var indexing = new Indexing();
    return indexing;
}