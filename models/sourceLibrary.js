const mongoose = require('mongoose'),
      schema   = mongoose.Schema;

    sourceLibrarySchema = new schema({
        name: String,
        author: String,
        date: String,
        text: {type: String, required: true},
        summary: {type: String, required:true },
        parsed: Boolean
    },{collection: 'SourceLibrary'});

var SourceLibrary = mongoose.model('SourceLibrary', sourceLibrarySchema);
module.exports = SourceLibrary;