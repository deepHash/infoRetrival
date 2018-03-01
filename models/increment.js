const mongoose = require('mongoose');
      schema = mongoose.Schema;

    incrementSchema = new schema({
        source: Number,
        post: Number
    }, {collection: 'increment'})

var Increment = mongoose.model('increment', incrementSchema);
module.exports = Increment;