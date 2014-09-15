/**
 * Created by Laur on 15.09.2014.
 */


var wallTextures = [
    "img/textures/walls_1.png", //1
    "img/textures/walls_2.png", //2
    "img/textures/walls_3.png", //3
    "img/textures/walls_4.png"  //4
];


var renderObjectTypes = {};
renderObjectTypes.lamp = { img : "img/sprites/d.gif"};
renderObjectTypes.donkey = { img : "img/sprites/donkey.png"};
renderObjectTypes.guard = {
    img : "img/sprites/guard.png",
    totalStates : 13,
    walkCycleTime: 1000,
    numWalkSprites:4
};

//for sprite animation support
var getWalkState = function(entity){
    var wCycleTime = renderObjectTypes[entity.type].walkCycleTime;
    //var states = renderObjectTypes[entity.type].totalStates;
    var wSprites = renderObjectTypes[entity.type].numWalkSprites;
    if (wCycleTime /*&& states */&& wSprites) {
        return Math.floor((new Date() % wCycleTime) / (wCycleTime / wSprites)) + 1;
    }
    return 1;
};

