const express = require('express');
const app = express();

// log each request to the console
const requestLoggerMiddleware = require('./utils/request-logger-middleware');
app.use(requestLoggerMiddleware);

// inject the ambrosus helper into the request
const ambrosusMidleware = require('./utils/ambrosus-helper').ambrosusMidleware;
app.use(ambrosusMidleware());

// server static files from the webpack output directory  
app.use('/', express.static(__dirname + '/../dist_front'));

// serve the same file for all frontend routes (we handle actual routing on the client) 
// app.get('*', function (request, response) {
//     response.sendFile(path.resolve(__dirname, 'public', 'index.html'))
// });

const productRouter = require('./routes/product');
app.use('/api/product', productRouter);

// Start the server
var server = app.listen(8081, '0.0.0.0', () => {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Server started at: http://%s:%s', host, port);
});