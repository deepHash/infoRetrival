const express = require('express'),
    bodyParser = require('body-parser'),
    indexing = require('./controllers/indexing.js'),
    app = express(),
    port = process.env.PORT || 3000,
    data = indexing();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('port', port);

app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/api.html`);
});

app.use(
    (req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept");
        res.set("Content-Type", "application/json");
        next();
});

app.post('/addNewDocument/', (req, res, next) => {
    data.addNewDocument(
        req.body.text,
        req.body.summary).then((result) => {
        result.length === 0 ? next() : res.status(200).send(result);
    }, (error) => {
        console.log(error);
        next();
    })
})

//error 404 route
app.all('*', (req, res) => {
    res.send(`error: route not found, global handler`);
});

app.listen(port,
    () => {
        console.log(`listening on port ${port}`);
});