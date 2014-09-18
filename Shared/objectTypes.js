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

exports.lamp = {type:'lamp', objectType: 'WorldObject', isPenetratable: true};
exports.guard = {type:'guard', objectType: 'KillableObject', isPenetratable:false, totalHP:10, moveSpeed: 0.03, turnSpeed: 3, hostility:1, AI: defaultAI, battleAI: null};
exports.donkey= {type:'donkey', objectType: 'KillableObject', totalHP:100, moveSpeed:0.01, turnSpeed:1, hostility: 1, AI: defaultAI, battleAI: null};


})(typeof global === "undefined" ? window.gameTypes = {} : exports);