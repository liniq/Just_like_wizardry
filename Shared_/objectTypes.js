(function(exports) {
/**
 * Instance of an object in the world
 */
var defaultAI = function (me,player,others,level){
    var dx = player.x - me.x;
    var dy = player.y - me.y;

    var dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > 4) {
        var angle = Math.atan2(dy, dx);
        me.angle = angle * 180 / Math.PI;
        me.move = 1;
    } else {
        me.move = 0;
    }
};

//supported battle props
    /*
    HP: [1,1]; // current, max
    SP: [1,1]; // current, max
    damage: [[0,5],[0,0]]; //damage types [physical,magic], per type[min/max]
    resist: [0,0.25]; // resists per damage type
    attack: 1; //attackRating
    defence: 1; //defenceRating
    attackType: 0; // melee or ranged
    */

//declare new object in game and its characteristics.  Add more objects here. Possible objectTypes in game -WorldObject,MovingObject,LivingObject,ContainerObject
//exports.some = {type:'some', objectType: 'WorldObject', props};
exports.guard = {
    objectType: 'LivingObject',
    moveSpeed: 0.03,
    initiative: 3,
    HP: [10,10],
    damage: [[0,3],[0,0]],
    AI: defaultAI,
    battleAI: null
};
exports.donkey = {
    objectType: 'LivingObject',
    moveSpeed:0.01,
    r:0.8,
    initiative: 3,
    HP: [10,10],
    damage: [[0,3],[0,0]],
    AI: defaultAI,
    battleAI: null
};

//definition of player characters characteristics
exports.Player = {
	objectType: 'Player',
	characters: {
		Zombotron: {
            initiative: 1,
            HP: [10,10],
            SP: [10,10],
            damage: [[0,1],[0,0]],
            resist: [0,0],
            attack:1,
            defence:1,
            attackType:0,
            equipped:{
                hand1:'Crude Dagger',
                hand2:'Buckler Shield'
            }
		},
		Lososo: {
            initiative: 1,
            HP: [10,10],
            SP: [10,10],
            damage: [[0,1],[0,0]],
            resist: [0,0],
            attack:1,
            defence:1,
            attackType:0,

            inventory:['Red Potion', 'Blue Potion']
		},
		WarGay: {
            initiative: 1,
            HP: [10,10],
            SP: [10,10],
            damage: [[0,1],[0,0]],
            resist: [0,0],
            attack:1,
            defence:1,
            attackType:0
		},
		PabloPicasso: {
            initiative: 1,
            HP: [10,10],
            SP: [10,10],
            damage: [[0,1],[0,0]],
            resist: [0,0],
            attack:1,
            defence:1,
            attackType:0,
            equipped:{
                body:'Robe'
            }
		}
	}
};

exports.GetNew = function(typeName) {
    return JSON.parse( JSON.stringify( exports[typeName] ) );
};


for (var prop in exports) {
    if (exports.hasOwnProperty(prop))
            exports[prop].type = ''+prop;
}

})(typeof global === "undefined" ? window.gameTypes = {} : exports);