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
        me.speed = 1;
    } else {
        me.speed = 0;
    }
};

var lamp = {type:'lamp', objectType: 'WorldObject', isPenetratable: true};
var guard = {type:'guard', objectType: 'KillableObject', totalHP:10, moveSpeed: 0.03, turnSpeed: 3, hostility:1, AI: defaultAI, battleAI: null};
var donkey = {type:'donkey', objectType: 'KillableObject', totalHP:100, moveSpeed:0.01, turnSpeed:1, hostility: 1, AI: defaultAI, battleAI: null};

exports.lamp = lamp;
exports.guard = guard;
exports.donkey= donkey;

})(typeof global === "undefined" ? window : exports);