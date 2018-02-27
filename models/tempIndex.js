var mongoose = require('mongoose'),
    schema   = mongoose.Schema;

TempIndexSchema = new schema({
    term: String,
    docNumber: Number,
    hits: Number
});

var TempIndex = mongoose.model('TempIndex', TempIndexSchema);
module.exports = TempIndex;