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
var gameEngine = require("../shared/gameEngine.js");
var level = require("../shared/level.js");
var objTypes = require("../shared/objectTypes.js");

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.gzipResponse());

//serve static files
server.get(/gameEngine.js/, restify.serveStatic({
    directory: './Shared'
}));
server.get(/level.js/, restify.serveStatic({
    directory: './Shared'
}));
server.get(/objectTypes.js/, restify.serveStatic({
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
        socket.emit('join',game.save());
        socket.broadcast.emit('join',{nick: nick});
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
        if (socket.id == masterSocketId){
            game.registerPlayerInput({turn: data.t, move:data.m});
            var pl  = game.state.objects[0];
            io.sockets.emit('move', {m: data.m, t:data.t, x:pl.x, y: pl.y, a:pl.angle});
            //io.sockets.emit('path', process.cwd());
        }

    });
});

server.listen(cfCore.port || 8080, function() {
    console.log('listening: %s', server.url);
});

