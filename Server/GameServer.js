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
var io = require('socket.io')(server.server);
var gameEngine = require("../Shared_/gameEngine.js");
var level = require("../Shared_/level.js");
var objTypes = require("../Shared_/objectTypes.js");

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.gzipResponse());

//serve static files
server.get(/gameEngine.js/, restify.serveStatic({
    directory: './Shared_'
}));
server.get(/level.js/, restify.serveStatic({
    directory: './Shared_'
}));
server.get(/objectTypes.js/, restify.serveStatic({
    directory: './Shared_'
}));
server.get(/.*/, restify.serveStatic({
    directory: './Client',
    default: 'index.htm'
}));

var game = new gameEngine.Game(level,objTypes,null);
game.updateEvery(gameEngine.Game.UPDATE_INTERVAL,0);
game.on('battleModeChange',serverHandleGameModeChanged);
game.on('objectDelete',serverHandleObjectDeleted);
game.on('objectCreate',serverHandleObjectCreated);
game.on('turnFinish',serverHandleTurnFinished);

function serverHandleGameModeChanged(newMode){
    io.sockets.emit('battleModeChange',{isBattleMode: newMode, gameState:game.save()});
}
function serverHandleObjectDeleted(objId){
    io.sockets.emit('objectDelete',{id:objId});
}
function serverHandleObjectCreated(obj){
    io.sockets.emit('objectCreate',obj);
}
function serverHandleTurnFinished(obj){
    io.sockets.emit('turnFinish',obj);
}

//sockets stuff
var masterSocketId=null;
io.sockets.on('connection', function (socket) {
    //console.log('socket connected');
    socket.emit('id',socket.id);
    //console.log("id "+ socket.id +' joined');

    socket.on('join', function(data){
        if (data) { // new player join
            data.id = socket.id;
            if (game.join(data)){
                socket.username = data.nick;
                io.sockets.emit('playerJoin',data);
                if (masterSocketId==null) {
                    masterSocketId=socket.id;
                    io.sockets.emit('masterChanged',{id: data.id, nick:data.nick});
                }
            }
        }
        else { //spectator joined
            // send game state
            var spectators = io.sockets.sockets.length - game.getPlayerCount();
            socket.emit('spectatorJoin', {spectators: spectators, gameState: game.save()});
            //send all others that spectator joined
            socket.broadcast.emit('spectatorJoin', {spectators: spectators});
        }
    });

    socket.on('masterChanged', function () {
        if (game.isPlayer(socket.id) && masterSocketId!=socket.id) {
            masterSocketId = socket.id;
            io.sockets.emit('masterChanged', {id: socket.id, nick:socket.username});
        }
    });
    socket.on('disconnect', function () {
        socket.broadcast.emit('leave', {id: socket.id, nick:socket.username});
        //console.log("id "+ socket.id +' left');
        game.leave(socket.id);
        if (masterSocketId==socket.id) {
            var characters = game.state.objects[0].characters;
            masterSocketId=null;
            for (var i in characters){
                if (characters[i].id){
                    masterSocketId = characters[i].id;
                    break;
                }
            }
            if (masterSocketId!=null)
                io.sockets.emit('masterChanged',{id: masterSocketId, nick:io.sockets.connected[masterSocketId].username});
        }
    });

    socket.on('actionData', function (data) {
        game.registerPlayerInput(data);
        io.sockets.emit('actionData', data);
    });

    socket.on('move', function (data) {
        if (socket.id == masterSocketId){
            game.registerPlayerInput({turn: data.t, move:data.m});
            var pl  = game.state.objects[0];
            io.sockets.emit('move', {m: data.m, t:data.t, x:pl.x, y: pl.y, a:pl.angle});
            //io.sockets.emit('path', process.cwd());
        }
    });

    socket.on('forceEndBattle', function (data) {
        if (socket.id == masterSocketId){
            game.forceEndBattle();
        }
    });
    socket.on('createRandomEnemy', function () {
        if (socket.id == masterSocketId){
            game.createRandomEnemy();
        }
    });
});

server.listen(cfCore.port || 8080, function() {
    console.log('listening: %s', server.url);
});

