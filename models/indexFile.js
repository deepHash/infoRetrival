const mongoose = require('mongoose');
      schema = mongoose.Schema;

    indexFileSchema = new schema({
        term: {type: String, required: true},
        numOfDocs: 1,
        soundex: String,
        locations: [{
            post_id: Number}]
    }, {collection: 'IndexFile'})

var IndexFile = mongoose.model('IndexFile', indexFileSchema);
module.exports = IndexFile;