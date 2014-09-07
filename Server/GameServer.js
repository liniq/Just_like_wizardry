/**
 * Created by Laur on 02.09.2014.
 *
 * Test by loso de vist
 */
var cfEnv = require("cfenv");
var pkg   = require("../package.json");
var cfCore = cfEnv.getAppEnv({name: pkg.name});

var restify = require('restify');

var server = restify.createServer();
var io = require('socket.io').listen(server);

server.use(restify.acceptParser(server.acceptable));
//server.use(restify.queryParser());
server.use(restify.gzipResponse());

//serve static files
server.get(/.*/, restify.serveStatic({
    directory: './Client',
    default: 'index.htm'
}));

server.listen(cfCore.port || 8080, function() {
    console.log('listening: %s', server.url);
});


//sockets stuff
io.sockets.on('connection', function (socket) {
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', function (data) {
        console.log(data);
    });
});