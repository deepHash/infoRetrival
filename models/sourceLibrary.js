const mongoose = require('mongoose'),
      schema   = mongoose.Schema;

    sourceLibrarySchema = new schema({
        id: Number,
        name: String,
        author: String,
        date: String,
        text: {type: String, required: true},
        summary: {type: String, required:true },
        parsed: Boolean,
        show: Boolean
    },{collection: 'SourceLibrary'});

var SourceLibrary = mongoose.model('SourceLibrary', sourceLibrarySchema);
module.exports = SourceLibrary;