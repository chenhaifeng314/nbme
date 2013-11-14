var express = require('express');
var http = require('http');
var path = require('path');
var app = express();
var compressor = require('./scaffolds/compressors');

app.set('port', process.env.PORT || 3000);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res) {
    res.sendfile('public/404.html');
});

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
    app.get('/hbs', compressor.html);
    app.get('/js', compressor.js);
    app.get('/css', compressor.css);
    app.get('/img', compressor.img);
}

require('./scaffolds/models').scan(app);
require('./routes').Route(app);

http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});
