(function(exports) {
/**
 * The game instance that's shared across all clients and the server
 */
 //max fps
var Game = function(level, objectTypes, itemTypes) {
    //this.GUID = 'some random shit here';
    this.isClient = (typeof(window) == 'undefined' ? false : true);
    this.state = {
        objects:{},
        timeStamp: (new Date()).valueOf()
    };
    this.isBattleMode = false;
    this.objectTypes = objectTypes;
    //this.itemTypes = itemTypes;
    this.level = level;

    //containers to store player move input
    this.movesArray = [];
    // Last used ID
    this.lastId = 0;
    this.playersCount =0;

    this.callbacks = {};

    // Counter for the number of updates
    this.updateCount = 0;
    // Timer for the update loop.
    this.timer = null;
    this.createObjects(level.positions);

    if (!this.isClient) {
        this.serverCheckBattleStart = function(objArr){
            //check battle start here
            var newBattleMode = this.getObjectsInBattle(objArr,true).length >0;
            this.changeBattleMode(newBattleMode);
        };
        this.processBattle = function(delta, objArr){
            this.processBattleServer(delta, objArr);
        };
    }
    else {
        this.serverCheckBattleStart = function(objArr){};
        this.processBattle = function(delta, objArr){
            this.processBattleClient(delta, objArr);
        };
    }
};

    Game.prototype.getObjectsInBattle = function(objArray, hostileOnly){
        var inBattle = [];
        for (var i in objArray) {
            var obj = objArray[i];
            //obj hostile and close to player
            if (obj.id !=0 && obj.distanceFrom(objArray[0])<= Game.BattleRange) {
                if (!hostileOnly && !obj.hostility)
                    continue;
                inBattle.push(objArray[i]);
            }
        }
        return inBattle;
    };
    //game settings
    Game.UPDATE_INTERVAL = Math.round(1000 / 30);
    Game.MAX_DELTA = 10000;
    Game.TARGET_LATENCY = 1000; // Maximum latency skew.
    Game.BattleRoundInCycles = 300;
    Game.minPlayers = 1;
    Game.BattleRange = 1.8;

Game.prototype.createObject = function(obj, preventEvent){
    var otypes = this.objectTypes;
    if (otypes[obj.type]){
        var params;
        //if id exists, means we restore saved state, otherwise take from types
        if (typeof obj.id !== 'undefined'){
            params = obj;
            if (this.lastId < obj.id)
                this.lastId= obj.id;
        } else {
            params = otypes.GetNew([obj.type]);
            params.id = (params.objectType == 'Player' ? 0 : this.newId_());
            params.x = obj.x;
            params.y = obj.y;
        }
        if (params.objectType == 'Player')
            this.state.objects[params.id] = new Player(params);
        else if (params.objectType == 'KillableObject')
            this.state.objects[params.id] = new KillableObject(params);
        else if (params.objectType == 'MovingObject')
            this.state.objects[params.id] = new MovingObject(params);
        else if (params.objectType == 'ContainerObject')
            this.state.objects[params.id] = new ContainerObject(params);
        else if (params.objectType == 'WorldObject')
            this.state.objects[params.id] = new WorldObject(params);
        if (preventEvent != true)
            this.callback_('objectCreate',this.state.objects[params.id]);
    }
    else
        throw "undefined type. Define type " +obj.type + " in objectTypes";
};

Game.prototype.deleteObject = function(idOrObj, preventEvent){
    var obj = this.state.objects[idOrObj.id || idOrObj];
    if (obj) {
        if (preventEvent != true)
            this.callback_('objectDelete', obj.id);
        delete this.state.objects[obj.id];
    }
};

Game.prototype.createObjects = function(objects){
    this.state.objects = {};
    for (var i in objects){
        this.createObject(objects[i],true);
    }
};

var initiativeSorter = function (a,b){
    if(a.initiative && b.initiative)
        return b.initiative - a.initiative;
    else if (a.initiative)
        return -1;
    else if (b.initiative)
        return 1;
    return 0;
};

/**
 * Computes the game cycle
 * @param {number} delta Number of milliseconds in the future
 * @return {object} The new game state at that timestamp
*/
Game.prototype.computeState = function(delta) {
    var objects = this.state.objects;
    var i, obj;
    this.serverCheckBattleStart(objects);

    //set player action
    if (this.movesArray.length>0) {
        objects[0].turn = this.movesArray[this.movesArray.length-1].turn; //turn
        objects[0].move = this.movesArray[this.movesArray.length-1].move; // move
        this.movesArray = [];
    }
    if (!this.isBattleMode) {
        var sortedByInitiative =[];
        for(i in objects ) {
            sortedByInitiative[i] = objects[i];
        }
        sortedByInitiative.sort(initiativeSorter);


        for (i in sortedByInitiative) {
            obj = objects[sortedByInitiative[i].id];
            // run AI
            if (this.objectTypes[obj.type] && this.objectTypes[obj.type].AI)
                this.objectTypes[obj.type].AI(obj,objects[0],objects, this.level);
            //and move
            if (obj.move || obj.turn)
                this.moveObject(delta, obj, objects);
        }
    }
    else { // battle mode
        this.processBattle(delta, objects);
    }
    this.state.objects = objects;
    this.state.timeStamp = this.state.timeStamp +  delta;
};

Game.prototype.processBattleServer = function(delta, objects){
    var i;
    for (i in objects[0].characters) { //all have submitted actions
        if (objects[0].characters[i].nick && !objects[0].characters[i].action)
            return;
    }
    var objectsInBattle = this.getObjectsInBattle(objects);
    //add player actions to the list
    for (i in objects[0].characters) {
        if (objects[0].characters[i].nick)
            objectsInBattle.push(objects[0].characters[i]);
    }
    objectsInBattle.sort(initiativeSorter);
    var statistics = [];
    for (i in objectsInBattle) {
        var obj = objectsInBattle[i];
        if (!obj) continue; //dead or so
        if (!obj.action && this.objectTypes[obj.type] && this.objectTypes[obj.type].battleAI) //run battle AI if present
            obj.action = this.objectTypes[obj.type].battleAI(obj,objects[0],objectsInBattle,this.level);

        statistics.push(this.processBattleAction(obj, objectsInBattle));
    }
    this.callback_('turnFinish',statistics);
};

Game.prototype.processBattleClient = function(delta, objects){
    if (objects[0].turn) {
        objects[0].move = 0;
        this.moveObject(delta, objects[0], objects);
    }
};
//
Game.prototype.processBattleAction = function(obj, objectsInBattle){

    var target = null;
    var summary = [];

    if (!obj.action) {
        summary.push((obj.nick || obj.type) + ' does nothing');
        return summary;
    }
    if (obj.action.t == 'self')
        target = obj;
    for (var i in objectsInBattle) {
        var t = objectsInBattle[i];
        if (t.id == obj.action.t){
            target = t;
            break;
        }
    }
    if (target) {
        var dmg = Math.floor((Math.random() * (obj.damage[1] - obj.damage[0])) + obj.damage[0]);
        summary.push((obj.nick || obj.type) +' attacks ' + (target.nick || target.type) + ': '+ dmg +' dmg');
        target.currentHP -= dmg;
        if (target.currentHP <=0 ){
            summary.push((target.nick || target.type) +' dies!');
            this.deleteObject(target.id,true);
            delete objectsInBattle[i];
        }
    }
    obj.action = null;
    return summary;
};

// change battle mode
Game.prototype.changeBattleMode = function(newMode){
  if (this.isBattleMode != newMode){
      this.isBattleMode = newMode; // true or false
      this.callback_('battleModeChange',this.isBattleMode);
  }
};


Game.prototype.forceEndBattle = function(){
    if (!this.isBattleMode)
        return;
    var inBattle = this.getObjectsInBattle(this.state.objects,true);
    for(var i in inBattle ) {
        this.deleteObject(inBattle[i].id);
    }
    this.serverCheckBattleStart(this.state.objects);
};

Game.prototype.createRandomEnemy = function(){
    var objects = this.state.objects;
    var newObj = this.objectTypes.GetNew("donkey");
    var end = false;
    while (!end){
        newObj.x = Math.floor(Math.random() * this.level.width);
        newObj.y = Math.floor(Math.random() * this.level.height);
        end=true;
        for(var i in objects ) {
            var obj = objects[i];
            if (this.level.map[newObj.y][newObj.x]!=0 || obj.distanceFrom(newObj) < newObj.r+obj.r) {
                end = false;
                break;
            }
        }
    }
    this.createObject(newObj);
};


Game.prototype.moveObject = function(timeDelta, entity, otherObjects){
	// time timeDelta has passed since we moved last time. We should have moved after time gameCycleDelay,
    // so calculate how much we should multiply our movement to ensure game speed is constant
    var mul = timeDelta / Game.UPDATE_INTERVAL;
    var moveStep = mul * entity.move * entity.moveSpeed;	// entity will move this far along the current direction vector
    entity.angle += mul * entity.turn * entity.turnSpeed; // add rotation if entity is rotating
    entity.angle %= 360;
    if (entity.angle < -180) entity.angle += 360;
    if (entity.angle >= 180) entity.angle -= 360;

    var snap = (entity.angle+360) % 90;
    if (snap < 2 || snap > 88) {
        entity.angle = Math.round(entity.angle / 90) * 90;
    }
    entity.angleRad = entity.angle * Math.PI / 180;

    if (moveStep <= 0.0001 && moveStep > -0.0001)
		return;
	
	var newPos = {x:0, y:0};
    newPos.x = entity.x + Math.cos(entity.angleRad) * moveStep;	// calculate new entity position with simple trigonometry
    newPos.y = entity.y + Math.sin(entity.angleRad) * moveStep;

    newPos = this.checkObjectCollision(entity, newPos, otherObjects);
    newPos = this.checkMapCollision(entity, newPos);

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
            var ang = entity.angleTo(newPos) - entity.angleTo(obj);
            if (Math.abs(ang)>1.25)
                continue;
            var deltaDist = obj.distanceFrom(entity) - obj.distanceFrom(newPos);
            //part of delta distance after intersection
			var illegalDist = (obj.r+entity.r) - obj.distanceFrom(newPos);
			var ratio = illegalDist/deltaDist;
            var dx = (newPos.x - entity.x);
            var dy = (newPos.y - entity.y);
            var pointOfContact ={x: entity.x + (dx - dx*ratio), y: entity.y + (dy - dy*ratio)};
            var newAng = (illegalDist*Math.sin(ang))/obj.r;
            //if (entity.type=='Player' && obj.type=='donkey' && typeof global === 'undefined')
            //    console.log('ang =' +ang + ', newang =' + newAng +
            //        ' illegal='+illegalDist);
            newPos.x = (obj.x + (pointOfContact.x-obj.x)*Math.cos(newAng)+ (pointOfContact.y-obj.y)*Math.sin(newAng));
            newPos.y = (obj.y + (pointOfContact.y-obj.y)*Math.cos(newAng)-(pointOfContact.x-obj.x)*Math.sin(newAng));

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
  if (this.playersCount < Game.minPlayers)
      return;
  this.computeState(delta);
  this.updateCount++;
  this.callback_('update');
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
Game.prototype.join = function(params) {
    var character = this.state.objects[0].characters[params.character];
    if (character && !character.id) {
        character.id = params.id;
        character.nick = params.nick;
        this.playersCount+=1;
        this.callback_('join', params);
        return true;
    }
    return false;
};

/**
* Called when a player leaves
*/
Game.prototype.leave = function(id) {
    var characters = this.state.objects[0].characters;
    for (var i in characters){
        if (characters[i].id && characters[i].id == id){
            delete characters[i].id;
            delete characters[i].nick;
            this.playersCount-=1;
            this.callback_('leave', id);
            return true;
        }
    }
    return false;
};

Game.prototype.getPlayerCount = function() {
  return this.playersCount;
};

Game.prototype.isPlayer = function(id) {
    var characters = this.state.objects[0].characters;
    for (var i in characters) {
        if (characters[i].id && characters[i].id == id)
            return true;
    }
    return false;
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
    objects: {},
    timeStamp: this.state.timeStamp
  };
  for (var i in this.state.objects) {
    var obj = this.state.objects[i];
    // Serialize to JSON!
    serialized.objects[obj.id] = obj.toJSON();
  }
  serialized.isBattleMode = this.isBattleMode;
  return serialized;
};

/**
 * Load the game state.
 * @param {object} savedState JSON of the game state
 */
Game.prototype.load = function(savedState) {
  //console.log(savedState.objects);
  this.state = {
    objects: {},
    timeStamp: (new Date()).valueOf()
  };
  this.createObjects(savedState.objects);
  var characters = this.state.objects[0].characters;
  for (var charName in characters) {
      if (characters[charName].id)
          this.playersCount++;
  }
  this.changeBattleMode(savedState.isBattleMode);
  this.callback_('load');
};

Game.prototype.objectExists = function(objId) {
  return this.state.objects[objId] !== undefined;
};

///***********************************************
// * Helper functions
// */
Game.prototype.callback_ = function(event, data) {
  var callbacks = this.callbacks[event];
  if (callbacks)
    for (var i in callbacks)
      callbacks[i](data);
  /* else {
    throw "Warning: No callback defined!";
  }*/
};

Game.prototype.newId_ = function() {
  return ++this.lastId;
};

Game.prototype.registerPlayerInput = function(input) {
    if (input.nick) {
        for (var i in this.state.objects[0].characters){
            var chr = this.state.objects[0].characters[i];
            if (chr.nick && chr.nick == input.nick)
                chr.action = {a: input.a, t: input.t };
        }
    }
    else
        this.movesArray.push(input);
};

Game.prototype.on = function(event, callback) {
    if (typeof (this.callbacks[event]) === 'undefined')
        this.callbacks[event] = [];
    this.callbacks[event].push(callback);
};

/**************************************************
 * ObjectTypes
*/
var WorldObject = function(params) {
  if (!params) {
    return;
  }
  this.id = params.id;
  
  this.x = params.x;
  this.y = params.y;
  this.r = params.r || params.radius || 0.2;
  this.isPenetratable = params.isPenetratable;
  
  this.type = params.type;
  
  if (!this.objectType) {
    this.objectType = 'WorldObject';
  }
};

WorldObject.prototype.distanceFrom = function(anotherObject) {
  return Math.sqrt(Math.pow(this.x - anotherObject.x, 2) + Math.pow(this.y - anotherObject.y, 2));
};

WorldObject.prototype.angleTo = function(anotherObject) {
    var dx = this.x - anotherObject.x;
    var dy = this.y - anotherObject.y;
  return Math.atan2(dy, dx);
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
  this.angleRad = params.angleRad || 0;
  
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
	this.defence = params.defence || 0;
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
	
	this.objectType ='Player';
    this.type ='Player';
	MovingObject.call(this, params);

    this.isPenetratable= params.isPenetratable || false;
    this.moveSpeed = params.moveSpeed || 0.08;
    this.turnSpeed = params.turnSpeed || 3;
    // add characters
    this.characters	 = params.characters;
	//calc initiative
    Object.defineProperties(this,{
        'initiative': { get: function(){
            var ti =0;
            for (var i in this.characters)
                ti+= this.characters[i].initiative;
            return ti/this.characters.length;

        }}});
};
Player.prototype = new MovingObject;
Player.prototype.constructor = Player;

exports.Game = Game;

})(typeof global === "undefined" ? window : exports);