(function(exports) {
/**
 * The game instance that's shared across all clients and the server
 */
 //max fps
var Game = function(level, objectTypes, itemTypes) {
  this.GUID = 'some random shit here';
  this.state = {
      objects:[],
      timeStamp: (new Date()).valueOf()
  };
  this.isBattleMode = false;
  this.objectTypes = objectTypes;
  //this.itemTypes = itemTypes;
  this.level = level;

  this.players ={};
  this.actionArray = [];
    // Last used ID
  this.lastId = 1;
  this.callbacks = {};

  // Counter for the number of updates
  this.updateCount = 0;
  // Timer for the update loop.
  this.timer = null;
  this.createObjects(level.positions);
};

    //game settings
    Game.UPDATE_INTERVAL = Math.round(1000 / 30);
    Game.MAX_DELTA = 10000;
    Game.TARGET_LATENCY = 1000; // Maximum latency skew.
    Game.BattleRoundInCycles = 300;
    Game.minPlayers = 1;

Game.prototype.createObjects = function(objects){
    var otypes = this.objectTypes;
    var id;
    for (var i in objects){
        if(objects[i].type == 'Player'){
            this.state.objects[0] = new Player(objects[i]);
            this.state.objects[0].id = 0;
        }
        else if (otypes[objects[i].type]){
            id = this.newId_();
            var objType= otypes[objects[i].type].objectType;
            if (objType == 'KillableObject')
                this.state.objects[id] = new KillableObject(otypes[objects[i].type]);
            else if (objType == 'MovingObject')
                this.state.objects[id] = new MovingObject(otypes[objects[i].type]);
            else if (objType == 'ContainerObject')
                this.state.objects[id] = new ContainerObject(otypes[objects[i].type]);
            else if (objType == 'WorldObject')
                this.state.objects[id] = new WorldObject(otypes[objects[i].type]);
            this.state.objects[id].id = id;
            this.state.objects[id].x = objects[i].x;
            this.state.objects[id].y = objects[i].y;
        }
        else
            throw "undefined type. Define type " +objects[i].type + " in objectTypes";
    }
};

var initiativeSorter = function (a,b){
    if(a.initiative && b.initiative)
        return a.initiative - b.initiative;
    else if (a.initiative)
        return 1;
    else if (b.initiative)
        return -1;
    return 0;
};

/**
 * Computes the game cycle
 * @param {number} delta Number of milliseconds in the future
 * @return {object} The new game state at that timestamp
*/


Game.prototype.computeState = function(delta) {
  var newState = {
    objects: [],
    timeStamp: this.state.timeStamp + delta
  };
  var objects = this.state.objects;
  var i, obj;
  // Generate a new state based on the old one
  if (!this.isBattleMode) {
      //
      if(this.actionArray.length>0) {
          objects[0].turn = this.actionArray.last.turn;
          objects[0].move = this.actionArray.last.move;
          this.actionArray.clear();
      }
      objects.sort(initiativeSorter);
      for (i in objects) {
          obj = objects[i];
          if (this.objectTypes[obj.type] && this.objectTypes[obj.type].AI)
              this.objectTypes[obj.type].AI(obj,objects[0],objects, this.level);
	  }
	//sort newObjects by initiative
    for (i in objects) {
        obj = objects[i];
		if (obj.hasOwnProperty('speed'))
			this.moveObject(delta, obj, objects);
	}
  }
  else {
	for (i in objects) {
        obj = objects[i];
        if (this.objectTypes[obj.type] && this.objectTypes[obj.type].battleAI)
            this.objectTypes[obj.type].battleAI(obj,objects[0],objects, this.level);
	}
  }
  newState.objects = objects;
  return newState;
};

Game.prototype.moveObject = function(timeDelta, entity, otherObjects){
	// time timeDelta has passed since we moved last time. We should have moved after time gameCycleDelay,
    // so calculate how much we should multiply our movement to ensure game speed is constant
    var mul = timeDelta / Game.UPDATE_INTERVAL;
    var moveStep = mul * entity.speed * entity.moveSpeed;	// entity will move this far along the current direction vector
    entity.angle += mul * entity.angle * entity.turnSpeed; // add rotation if entity is rotating
    entity.angle %= 360;
    if (entity.angle < -180) entity.angle += 360;
    if (entity.angle >= 180) entity.angle -= 360;

    var snap = (entity.angle+360) % 90;
    if (snap < 2 || snap > 88) {
        entity.angle = Math.round(entity.angle / 90) * 90;
    }
	if (moveStep <= 0.0001)
		return;
	
	var newPos = {x:0, y:0};
    var angleRad = entity.angle * Math.PI / 180;
    newPos.x = entity.x + Math.cos(angleRad) * moveStep;	// calculate new entity position with simple trigonometry
    newPos.y = entity.y + Math.sin(angleRad) * moveStep;

    newPos = this.checkMapCollision(entity, newPos);
	newPos = this.checkObjectCollision(entity, newPos, otherObjects);

    entity.x = newPos.x; // set new position
    entity.y = newPos.y;
};

Game.prototype.checkMapCollision = function(entity, newPos) {
    var pos = {
        x : entity.x,
        y : entity.y
    };
    
    if (this.isMapBlocking(newPos.x,newPos.y)) {
        return pos;
    }

    pos.x = newPos.x;
    pos.y = newPos.y;

	var blockX = Math.floor(newPos.x);
	var blockY = Math.floor(newPos.y);
    var blockTop = this.isMapBlocking(blockX,blockY-1);
    var blockBottom = this.isMapBlocking(blockX,blockY+1);
    var blockLeft = this.isMapBlocking(blockX-1,blockY);
    var blockRight = this.isMapBlocking(blockX+1,blockY);

    if (blockTop && newPos.y - blockY < entity.r) {
        pos.y = blockY + entity.r;
    }
    if (blockBottom && blockY + 1 - newPos.y < entity.r) {
        pos.y = blockY + 1 - entity.r;
    }
    if (blockLeft && newPos.x - blockX < entity.r) {
        pos.x = blockX + entity.r;
    }
    if (blockRight && blockX + 1 - newPos.x < entity.r) {
        pos.x = blockX + 1 - entity.r;
    }

    // is tile to the top-left a wall
    var dx, dy;
    if (this.isMapBlocking(blockX-1,blockY-1)  && !(blockTop && blockLeft)) {
        dx = newPos.x - blockX;
        dy = newPos.y - blockY;
        if (dx*dx+dy*dy < entity.r*entity.r) {
            if (dx*dx > dy*dy)
                pos.x = blockX + entity.r;
            else
                pos.y = blockY + entity.r;
        }
    }
    // is tile to the top-right a wall
    if (this.isMapBlocking(blockX+1,blockY-1) && !(blockTop && blockRight)) {
        dx = newPos.x - (blockX+1);
        dy = newPos.y - blockY;
        if (dx*dx+dy*dy < entity.r*entity.r) {
            if (dx*dx > dy*dy)
                newPos.x = pos.x = blockX + 1 - entity.r;
            else
                newPos.y = pos.y = blockY + entity.r;
        }
    }
    // is tile to the bottom-left a wall
    if (this.isMapBlocking(blockX-1,blockY+1) && !(blockBottom && blockLeft)) {
        dx = newPos.x - blockX;
        dy = newPos.y - (blockY+1);
        if (dx*dx+dy*dy < entity.r*entity.r) {
            if (dx*dx > dy*dy)
                newPos.x = pos.x = blockX + entity.r;
            else
                newPos.y = pos.y = blockY + 1 - entity.r;
        }
    }
    // is tile to the bottom-right a wall
    if (this.isMapBlocking(blockX+1,blockY+1) && !(blockBottom && blockRight)) {
        dx = newPos.x - (blockX+1);
        dy = newPos.y - (blockY+1);
        if (dx*dx+dy*dy < entity.r*entity.r) {
            if (dx*dx > dy*dy)
                pos.x = blockX + 1 - entity.r;
            else
                pos.y = blockY + 1 - entity.r;
        }
    }
    return pos;
};

Game.prototype.isMapBlocking = function(x,y) {
    // first make sure that we cannot move outside the boundaries of the level
    if (y < 0 || y >= this.level.height || x < 0 || x >= this.level.width)
        return true;
    var ix = Math.floor(x);
    var iy = Math.floor(y);
    // return true if the map block is not 0, ie. if there is a blocking wall.
    return this.level.map[iy][ix] > 0;
};

Game.prototype.checkObjectCollision = function(entity, newPos, otherObjects){
	if (entity.isPenetratable)
		return newPos;

	newPos.r = entity.r;
    var obj;
	for (var i in otherObjects) {
        obj = otherObjects[i];
		if (obj.isPenetratable || obj.id == entity.id)
			continue;
		if (obj.intersects(newPos)) {
			var deltaDist = obj.distanceFrom(newPos) - obj.distanceFrom(entity);
			var falseDist =  deltaDist - (obj.r+entity.r);
			var ratio = falseDist/deltaDist;
			newPos.x -= (newPos.x -entity.x)*ratio;
			newPos.y -= (newPos.y -entity.y)*ratio;
		}
	}
	return newPos;
};


/**
 * Computes the game state for a given timestamp in the future
 * @param {number} timeStamp Timestamp to compute for
 */
Game.prototype.update = function(timeStamp) {
  var delta = timeStamp - this.state.timeStamp;
  if (delta < 0) {
    throw "Can't compute state in the past. Delta: " + delta;
  }
  if (delta > Game.MAX_DELTA) {
    throw "Can't compute state so far in the future. Delta: " + delta;
  }
  //do not do anything if no players
  if (this.state.length >= Game.minPlayers) {
      this.state = this.computeState(delta);
      this.updateCount++;
  }
};

/**
 * Set up an accurate timer in JS
 */
Game.prototype.updateEvery = function(interval, skew) {
  if (!skew) {
    skew = 0;
  }
  var lastUpdate = (new Date()).valueOf() - skew;
  var ctx = this;
  this.timer = setInterval(function() {
    var date = (new Date()).valueOf() - skew;
    if (date - lastUpdate >= interval) {
      ctx.update(date);
      lastUpdate += interval;
    }
  }, 1);
};

Game.prototype.over = function() {
  clearInterval(this.timer);
};

/**
 * Called when a new player joins
 */
Game.prototype.join = function(player) {
    this.players[player.id] = player;
};

/**
* Called when a player leaves
*/
Game.prototype.leave = function(id) {
  delete this.players[id];
};

Game.prototype.getPlayerCount = function() {
  return this.players.length;
};

/***********************************************
 * Loading and saving
 */

/**
 * Save the game state.
 * @return {object} JSON of the game state
 */
Game.prototype.save = function() {
  var serialized = {
    objects: [],
    timeStamp: this.state.timeStamp
  };
  for (var obj in this.state.objects) {
    // Serialize to JSON!
    serialized.objects[obj.id] = obj.toJSON();
  }

  return serialized;
};

/**
 * Load the game state.
 * @param {object} savedState JSON of the game state
 */
Game.prototype.load = function(savedState) {
  //console.log(savedState.objects);
  this.state = {
    objects: [],
    timeStamp: savedState.timeStamp.valueOf()
  };
  this.createObjects(savedState.objects);
};

Game.prototype.objectExists = function(objId) {
  return this.state.objects[objId] !== undefined;
};

///***********************************************
// * Helper functions
// */
Game.prototype.callback_ = function(event, data) {
  var callback = this.callbacks[event];
  if (callback) {
    callback(data);
  } else {
    throw "Warning: No callback defined!";
  }
};

Game.prototype.newId_ = function() {
  return ++this.lastId;
};

Game.prototype.registerPlayerInput = function(input) {
    this.actionArray.add(input);
};

Game.prototype.on = function(event, callback) {
  this.callbacks[event] = callback;
};

/**************************************************
 * ObjectTypes
*/
var WorldObject = function(params) {
  if (!params) {
    return;
  }
  this.id = params.id || 1;
  
  this.x = params.x;
  this.y = params.y;
  this.r = params.radius || 0.2;
  this.isPenetratable = params.isPenetratable;
  
  this.type = params.type;
  
  if (!this.objectType) {
    this.objectType = 'WorldObject';
  }
};

WorldObject.prototype.distanceFrom = function(anotherObject) {
  return Math.sqrt(Math.pow(this.x - anotherObject.x, 2) + Math.pow(this.y - anotherObject.y, 2));
};

WorldObject.prototype.intersects = function(anotherObject) {
  return this.distanceFrom(anotherObject) < anotherObject.r + this.r;
};

WorldObject.prototype.toJSON = function() {
  var obj = {};
  for (var prop in this) {
    if (this.hasOwnProperty(prop)) {
      obj[prop] = this[prop];
    }
  }
  return obj;
};

//represents any moving thing we can encounter
var MovingObject = function(params) {
    if (!params) {
        return;
    }
  this.angle = params.angle || 0;
  this.turnSpeed = params.turnSpeed || 0;
  this.moveSpeed = params.moveSpeed || 0;
  
  // from -1 to 1.
  this.move = params.move || 0;
  this.turn = params.turn || 0;
  
  this.initiative = params.initiative || 0;
  if (!this.objectType)
    this.objectType ='MovingObject';
  WorldObject.call(this,params);
};
MovingObject.prototype = new WorldObject;
MovingObject.prototype.constructor = MovingObject;

//represents container (or corpse with loot)
var ContainerObject = function (params) {
    if (!params) {
        return;
    }
	this.inventory = params.inventory || {};
    if (!this.objectType)
	  this.objectType = 'ContainterObject';
	WorldObject.call(this,params);
};
ContainerObject.prototype = new WorldObject;
ContainerObject.prototype.constructor = ContainerObject;

//represents a creature that can participate in battle. hostile or not
var KillableObject = function (params){
    if (!params) {
        return;
    }
	this.hostility = params.hostility || 0;
	this.totalHP = params.totalHP || 1;
	this.currentHP = params.currentHP || this.totalHP;
	this.sightDistance = params.sightDistance || 10;
	if (typeof params.isPenetratable === 'undefined')
        params.isPenetratable=false;
	
	//battle mode props
    //todo spellpoints, characteristics, attack, class etc
    if (!this.objectType)
	  this.objectType ='KillableObject';
	MovingObject.call(this, params);
    this.meleeAttackRange = params.meleeAttackRange || (this.r+0.3);
};
KillableObject.prototype = new MovingObject;
KillableObject.prototype.constructor = KillableObject;

var Player = function (params){
    if (!params) {
        return;
    }
	this.hp1 = params.hp1;
	this.hp2 = params.hp2;
	this.hp3 = params.hp3;
	this.hp4 = params.hp4;
	
	this.objectType ='Player';
    this.type ='Player';
	MovingObject.call(this, params);
};
Player.prototype = new MovingObject;
Player.prototype.constructor = Player;

exports.Game = Game;

})(typeof global === "undefined" ? window : exports);