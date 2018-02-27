const mongoose = require('mongoose'),
      schema = mongoose.Schema;

    postingFileSchema = new schema({
        post_id: {type: Number, required: true},
        docNumber: Number,
        hits: Number,
        show: Boolean
    }, {collection: 'PostingFile'});

    var PostingFile = mongoose.model('PostingFile', postingFileSchema);
    module.exports = PostingFile;