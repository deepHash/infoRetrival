const mongoose = require('mongoose');
      schema = mongoose.Schema;

    indexFileSchema = new schema({
        term: {type: String, required: true, unique: true},
        numOfDocs: Number,
        soundex: String,
        locations: [{
            post_id: Number}]
    }, {collection: 'IndexFile'})

var indexFile = mongoose.model('IndexFile', indexFileSchema);
module.exports = indexFile;