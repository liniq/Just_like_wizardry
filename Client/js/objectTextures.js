/**
 * Created by Laur on 15.09.2014.
 */
var textures = {
    //here all images for walls
    walls: [
            "", //0 - empty
            "img/textures/walls_1.png", //1
            "img/textures/walls_2.png", //2
            "img/textures/walls_3.png", //3
            "img/textures/walls_4.png"  //4
        ],
    //sprite is something not a wall, but also not a world object
    sprites: {
        lamp: "img/sprites/bt.png"
    },
    //all other objects. Can be more than one image per object
    worldObjects: {
        donkey: {img : "img/sprites/donkey.png"},
        guard: {
            img : "img/sprites/guard.png",
            //Animated sprites props
            totalStates : 13,
            walkCycleTime: 1000,
            numWalkSprites:4
        },
        demon: {img:"whatever"}
    }
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

