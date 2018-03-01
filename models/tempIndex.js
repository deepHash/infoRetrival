var mongoose = require('mongoose'),
    schema   = mongoose.Schema;

TempIndexSchema = new schema({
    term: String,
    docNumber: Number,
    soundex: String,
    hits: Number
});

var TempIndex = mongoose.model('TempIndex', TempIndexSchema);
module.exports = TempIndex;