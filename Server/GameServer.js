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
var io = require('socket.io').listen(server.server);
var gameEngine = require('../shared/gameEngine');
var level = require('../shared/level');
var objTypes = require('../shared/objectTypes');

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.gzipResponse());

//serve static files
server.get(/game.js/, restify.serveStatic({
    directory: './Shared'
}));
server.get(/.*/, restify.serveStatic({
    directory: './Client',
    default: 'index.htm'
}));

var game = new gameEngine.Game(level,objTypes,null);
game.updateEvery(gameEngine.Game.UPDATE_INTERVAL,0);

//sockets stuff
var masterSocketId=null;
io.sockets.on('connection', function (socket) {
    //console.log('socket connected');
    socket.emit('id',socket.id);

    socket.on('join', function(nick){
        //console.log('join emitted');
        socket.username = nick;
        io.sockets.emit('join',nick);
        if (masterSocketId==null)
        {
            masterSocketId=socket.id;
            io.sockets.emit('masterChanged',{id: socket.id, nick:nick});
        }
    });

    socket.on('masterChanged', function (nick) {
        if (masterSocketId!=socket.id) {
            masterSocketId = socket.id;
            io.sockets.emit('masterChanged', {id: socket.id, nick:nick});
        }
    });
    socket.on('disconnect', function () {
      socket.broadcast.emit('leave', socket.username);
        if (masterSocketId==socket.id)
        {
            masterSocketId = io.sockets.length > 0 && io.sockets[0].id != socket.id ? io.sockets[0].id : null;
            if (masterSocketId!=null)
                io.sockets.emit('masterChanged',io.sockets[0].username);
        }
    });

    socket.on('move', function (data) {
        if (socket.id == masterSocketId)
            io.sockets.emit('move', data);
    });
});

server.listen(cfCore.port || 8080, function() {
    console.log('listening: %s', server.url);
});

