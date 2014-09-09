/**
 * Created by Laur on 08.09.2014.
 */

var map = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 	// 0
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], 	// 1
    [1, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], 	// 2
    [1, 0, 0, 3, 0, 3, 0, 0, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1], 	// 3
    [1, 0, 0, 3, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], 	// 4
    [1, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], 	// 5
    [1, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 1, 1, 1, 1, 1], 	// 6
    [1, 0, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], 	// 7
    [1, 0, 0, 3, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2], 	// 8
    [1, 0, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], 	// 9
    [1, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 1, 1, 1, 1, 1], 	// 10
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], 	// 11
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2], 	// 12
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], 	// 13
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 1, 1, 1, 1, 1], 	// 14
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], 	// 15
    [1, 0, 0, 4, 0, 0, 4, 2, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 2, 4, 4, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 1], 	// 16
    [1, 0, 0, 4, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 1], 	// 17
    [1, 0, 0, 4, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 1], 	// 18
    [1, 0, 0, 4, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 1], 	// 19
    [1, 0, 0, 4, 3, 3, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 4, 3, 3, 4, 0, 0, 0, 0, 0, 0, 0, 1], 	// 20
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], 	// 21
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], 	// 22
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]	// 23
];
//	 0  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31

var itemTypes = [
    { img : "img/sprites/d.gif", block : true },	// 0
    { img : "img/sprites/armor.png", block : true },		// 1
    { img : "img/sprites/donkey.png", block : true },	// 2
    { img : "img/sprites/bt.png", block : false }		// 3
];

var mapItems = [

    // lamps in center area
    {type:3, x:10, y:7},
    {type:2, x:15, y:7},

    // lamps in bottom corridor
    {type:3, x:5, y:22},
    {type:3, x:12, y:22},
    {type:3, x:19, y:22},

    // tables in long bottom room
    {type:0, x:10, y:18},
    {type:0, x:15, y:18},
    // lamps in long bottom room
    {type:3, x:8, y:18},
    {type:3, x:17, y:18}
];


var enemyTypes = [
    { img : "img/sprites/guard.png", moveSpeed : 0.05, rotSpeed : 3, totalStates : 13 }
];

var mapEnemies = [
    {type : 0, x : 17.5, y : 4.5},
    {type : 0, x : 25.5, y : 16.5}
];

var player = {
    x : 10.5,		// current x, y position
    y : 6.5,
    dir : 0,		// the direction that the player is turning, either -1 for left or 1 for right.
    rotDeg : 0,		// the current angle of rotation
    rot : 0,		// rotation in radians
    speed : 0,		// is the playing moving forward (speed = 1) or backwards (speed = -1).
    moveSpeed : 0.10,	// how far (in map units) does the player move each step/update
    rotSpeed : 3		// how much does the player rotate each step/update (in degrees)
};

var mapWidth = 0;
var mapHeight = 0;
var twoPI = Math.PI * 2;
var lastGameCycleTime = 0;
var gameCycleDelay = 1000 / 30; // aim for 30 fps for game logic

function gameCycle() {
    var now = new Date().getTime();

    // time since last game logic
    var timeDelta = now - lastGameCycleTime;

    move(player, timeDelta);

    ai(timeDelta);

    var cycleDelay = gameCycleDelay;

    // the timer will likely not run that fast due to the rendering cycle hogging the cpu
    // so figure out how much time was lost since last cycle

    if (timeDelta > cycleDelay) {
        cycleDelay = Math.max(1, cycleDelay - (timeDelta - cycleDelay))
    }

    setTimeout(gameCycle, cycleDelay);

    lastGameCycleTime = now;
}

function ai(timeDelta) {
    for (var i=0;i<enemies.length;i++) {
        var enemy = enemies[i];

        var dx = player.x - enemy.x;
        var dy = player.y - enemy.y;

        var dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 4) {
            var angle = Math.atan2(dy, dx);

            enemy.rotDeg = angle * 180 / Math.PI;
            enemy.rot = angle;
            enemy.speed = 1;

            var walkCycleTime = 1000;
            var numWalkSprites = 4;

            enemy.state = Math.floor((new Date() % walkCycleTime) / (walkCycleTime / numWalkSprites)) + 1;

        } else {
            enemy.state = 0;
            enemy.speed = 0;
        }

        move(enemies[i], timeDelta);
    }
}


function move(entity, timeDelta) {
    // time timeDelta has passed since we moved last time. We should have moved after time gameCycleDelay,
    // so calculate how much we should multiply our movement to ensure game speed is constant

    var mul = timeDelta / gameCycleDelay;

    var moveStep = mul * entity.speed * entity.moveSpeed;	// entity will move this far along the current direction vector

    entity.rotDeg += mul * entity.dir * entity.rotSpeed; // add rotation if entity is rotating (entity.dir != 0)
    entity.rotDeg %= 360;

    if (entity.rotDeg < -180) entity.rotDeg += 360;
    if (entity.rotDeg >= 180) entity.rotDeg -= 360;

    var snap = (entity.rotDeg+360) % 90;
    if (snap < 2 || snap > 88) {
        entity.rotDeg = Math.round(entity.rotDeg / 90) * 90;
    }

    entity.rot = entity.rotDeg * Math.PI / 180;

    var newX = entity.x + Math.cos(entity.rot) * moveStep;	// calculate new entity position with simple trigonometry
    var newY = entity.y + Math.sin(entity.rot) * moveStep;

    var pos = checkCollision(entity.x, entity.y, newX, newY, 0.35);

    entity.x = pos.x; // set new position
    entity.y = pos.y;
}

function checkCollision(fromX, fromY, toX, toY, radius) {
    var pos = {
        x : fromX,
        y : fromY
    };

    if (toY < 0 || toY >= mapHeight || toX < 0 || toX >= mapWidth) {
        return pos;
    }

    var blockX = Math.floor(toX);
    var blockY = Math.floor(toY);


    if (isBlocking(blockX,blockY)) {
        return pos;
    }

    pos.x = toX;
    pos.y = toY;

    var blockTop = isBlocking(blockX,blockY-1);
    var blockBottom = isBlocking(blockX,blockY+1);
    var blockLeft = isBlocking(blockX-1,blockY);
    var blockRight = isBlocking(blockX+1,blockY);

    if (blockTop != 0 && toY - blockY < radius) {
        toY = pos.y = blockY + radius;
    }
    if (blockBottom != 0 && blockY+1 - toY < radius) {
        toY = pos.y = blockY + 1 - radius;
    }
    if (blockLeft != 0 && toX - blockX < radius) {
        toX = pos.x = blockX + radius;
    }
    if (blockRight != 0 && blockX+1 - toX < radius) {
        toX = pos.x = blockX + 1 - radius;
    }

    // is tile to the top-left a wall
    var dx, dy;
    if (isBlocking(blockX-1,blockY-1) != 0 && !(blockTop != 0 && blockLeft != 0)) {
        dx = toX - blockX;
        dy = toY - blockY;
        if (dx*dx+dy*dy < radius*radius) {
            if (dx*dx > dy*dy)
                toX = pos.x = blockX + radius;
            else
                toY = pos.y = blockY + radius;
        }
    }
    // is tile to the top-right a wall
    if (isBlocking(blockX+1,blockY-1) != 0 && !(blockTop != 0 && blockRight != 0)) {
        dx = toX - (blockX+1);
        dy = toY - blockY;
        if (dx*dx+dy*dy < radius*radius) {
            if (dx*dx > dy*dy)
                toX = pos.x = blockX + 1 - radius;
            else
                toY = pos.y = blockY + radius;
        }
    }
    // is tile to the bottom-left a wall
    if (isBlocking(blockX-1,blockY+1) != 0 && !(blockBottom != 0 && blockBottom != 0)) {
        dx = toX - blockX;
        dy = toY - (blockY+1);
        if (dx*dx+dy*dy < radius*radius) {
            if (dx*dx > dy*dy)
                toX = pos.x = blockX + radius;
            else
                toY = pos.y = blockY + 1 - radius;
        }
    }
    // is tile to the bottom-right a wall
    if (isBlocking(blockX+1,blockY+1) != 0 && !(blockBottom != 0 && blockRight != 0)) {
        dx = toX - (blockX+1);
        dy = toY - (blockY+1);
        if (dx*dx+dy*dy < radius*radius) {
            if (dx*dx > dy*dy)
                pos.x = blockX + 1 - radius;
            else
                pos.y = blockY + 1 - radius;
        }
    }

    return pos;
}

function isBlocking(x,y) {
    // first make sure that we cannot move outside the boundaries of the level
    if (y < 0 || y >= mapHeight || x < 0 || x >= mapWidth)
        return true;
    var ix = Math.floor(x);
    var iy = Math.floor(y);
    // return true if the map block is not 0, ie. if there is a blocking wall.
    if (map[iy][ix] != 0)
        return true;
    return !!(spriteMap[iy][ix] && spriteMap[iy][ix].block);
}
