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

app.get('/getSearch/:query/:soundex', (req, res, next) => {
    data.getSearch(req.params.query, req.params.soundex).then((result) => {
        res.status(200).json(result);
    }, (error) => {
        console.log(error);
        next();
    })
})


app.get('/parseDocuments/', (req, res, next) => {
    data.parseDocuments().then((result) => {
        res.status(200).json(result);
    }, (error) => {
        console.log(error);
        next();
    })
})

app.post('/addNewDocument/', (req, res, next) => {
    data.addNewDocument(
        req.body.docHeader, req.body.docText).then((result) => {
        result.length === 0 ? next() : res.status(200).json(result);
    }, (error) => {
        console.log(error);
        next();
    })
})

app.post('/removeDocument/', (req, res, next) => {
    data.removeDocument(req.body.id).then((result) => {
        result.length === 0 ? next() : res.status(200).json(result);
    }, (error) => {
        console.log(error);
        next();
    })
})

app.get('/getAllDocuments/', (req,res,next) => {
    data.getAllDocuments().then((result) => {
        res.status(200).send(result);    
    }, (error) => {
        console.log(error);
        next();
    })
})

app.get('/getDocumentByID/:id', (req,res,next) => {
    data.getDocumentByID(req.params.id).then((result) => {
        res.status(200).send(result);    
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
