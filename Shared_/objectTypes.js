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

//declare new object in game and its characteristics.  Add more objects here. Possible objectTypes in game -WorldObject,MovingObject,KillableObject,ContainerObject
//exports.some = {type:'some', objectType: 'WorldObject', isPenetratable: true};
exports.guard = {type:'guard', objectType: 'KillableObject', isPenetratable:false, totalHP:10, moveSpeed: 0.03, turnSpeed: 3, initiative: 1, hostility:1, AI: defaultAI, battleAI: null};
exports.donkey= {type:'donkey', objectType: 'KillableObject', totalHP:100, moveSpeed:0.01, turnSpeed:1, r:0.8, hostility: 1, initiative: 3, AI: defaultAI, battleAI: null};


//definition of player characters characteristics
exports.Player = {
	type:'Player', 
	objectType: 'Player',
	isPenetratable:false,
	moveSpeed: 0.08,
    turnSpeed: 3,
	characters: {
		Zombotron: {
			totalHP: 15,
			currentHP: 15,
			damage: [1,3], //min,max
			meleeAttackRange: 0.6,
			initiative: 1
		},
		Lososo: {
			totalHP: 10,
			currentHP: 10,
			damage: [2,3],
			meleeAttackRange: 0.5,
			initiative: 1
		},
		WarGay: {
			totalHP: 8,
			currentHP: 8,
			damage: [2,4],
			meleeAttackRange: 0.7,
			initiative: 1
		},
		PabloPicasso: {
			totalHP: 11,
			currentHP: 11,
			damage: [0,5],
			meleeAttackRange: 0.6,
			initiative: 1
		}
	}
};

})(typeof global === "undefined" ? window.gameTypes = {} : exports);