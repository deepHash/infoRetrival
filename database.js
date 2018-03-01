//--------------------------------Connect to mongodb on mlabs via Mongoose--------------------------------//
const consts = require('./consts'),
      mongoose = require('mongoose');
      mongoose.Promise = global.Promise;
//The server option auto_reconnect is defaulted to true
var options = {
    server: {
        auto_reconnect:true,
        useMongoClient:true,
    }
};
mongoose.connect(consts.MLAB_KEY, options);
const conn = mongoose.connection;//get default connection

// Event handlers for Mongoose
conn.on('error', function (err) {
    console.log('Mongoose: Error: ' + err);
});
conn.on('open', function() {
    console.log('Mongoose: Connection established');
});
conn.on('disconnected', function() {
    console.log('Mongoose: Connection stopped, recconect');
    mongoose.connect(consts.MLAB_KEY, options);
});
conn.on('reconnected', function () {
    console.info('Mongoose reconnected!');
});