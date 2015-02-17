/**
 * Created by Laur on 08.09.2014.
 */

var Renderer = function(game,textures, viewCanvas) {

    this.game = game;
    this.viewCanvas = viewCanvas;
    this.textures = textures;
    this.player = game.state.objects[0];

    this.screenWidth = 800;
    this.screenHeight =500;
    this.miniMapScale = 8;
    this.showOverlay = true;
    this.showMiniMap = true;
    this.stripWidth = 3;
    this.fov = 60 * Math.PI / 180;

    this.screenStrips = [];
    this.spriteMap = [];

    this.fps = 0;
    this.overlayText = "";
    this.visibleSprites = [];
    this.oldVisibleSprites = [];
    this.worldObjectsSprites = {};
    this.map = game.level.map;

    this.lastRenderTime = new Date();

    this.numRays = Math.ceil(this.screenWidth / this.stripWidth);
    this.viewDistance = (this.screenWidth/2) / Math.tan((this.fov / 2));

    this.initScreen();
    this.initSprites();
    this.initWorldObjects();
};

// just a few helper functions
var $ = function(id) { return document.getElementById(id); };
var dc = function(tag) { return document.createElement(tag); };
var twoPI = Math.PI * 2;

// indexOf for IE. From: https://developer.mozilla.org/En/Core_JavaScript_1.5_Reference:Objects:Array:indexOf
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(elt /*, from*/) {
        var len = this.length;
        var from = Number(arguments[1]) || 0;
        from = (from < 0) ? Math.ceil(from) : Math.floor(from);
        if (from < 0)
            from += len;
        for (; from < len; from++) {
            if (from in this && this[from] === elt)
                return from;
        }
        return -1;
    };
}

Renderer.prototype.initScreen = function () {
    for (var i=0;i<this.screenWidth;i+=this.stripWidth) {
        var strip = dc("img");
        strip.style.position = "absolute";
        strip.style.height = "0px";
        strip.style.left = strip.style.top = "0px";
        strip.oldStyles = {
            left : 0,
            top : 0,
            width : 0,
            height : 0,
            clip : "",
            src : ""
        };

        this.screenStrips.push(strip);
        this.viewCanvas.appendChild(strip);
    }

    // overlay div for adding text like fps count, etc.
    this.overlay = dc("div");
    this.overlay.id = "overlay";
    this.overlay.style.display = this.showOverlay ? "block" : "none";
    this.viewCanvas.appendChild(this.overlay);

};

Renderer.prototype.initSprites = function () {
    for (var y=0; y < this.game.level.height; y++) {
        this.spriteMap[y] = [];
    }
    var ps = this.game.level.spritePositions;
    for (var i in ps) {
        var img = dc("img");
        img.src = this.textures.sprites[ps[i].type];
        img.style.display = "none";
        img.visible = false;
        img.style.position = "absolute";
        img.pos = {x:ps[i].x, y:ps[i].y};
        img.className ='spriteType_'+ ps[i].type;

        this.spriteMap[ps[i].y][ps[i].x] = img;
        this.viewCanvas.appendChild(img);
    }
};

Renderer.prototype.initWorldObjects = function () {
    for (var i in this.game.state.objects) {
        var obj = this.game.state.objects[i];
        if (obj.type=='Player')
            continue;
        var type = this.textures.worldObjects[obj.type];
        var img = dc("img");
        img.src = type.img;
        img.style.display = "none";
        img.style.position = "absolute";
        img.id = 'objectId_'+obj.id;
        img.className ='objectType_'+obj.type;

        obj.oldStyles = {
            left : 0,
            top : 0,
            width : 0,
            height : 0,
            clip : "",
            display : "none",
            zIndex : 0
        };

        obj.img = img;
        //leviate here
        obj.levitate = type.levitate;
        this.worldObjectsSprites[obj.id] = obj;

        this.viewCanvas.appendChild(img);
    }
};

Renderer.prototype.renderCycle = function () {
    this.clearSprites();
    this.castRays();
    this.renderSky();
    this.renderSprites();
    this.renderWorldObjects();


    if (this.showMiniMap) {
        this.updateMiniMap();
        this.drawMiniMap();
    }
    if (this.showOverlay) {
        this.updateOverlay();
    }

    // time since last rendering
    var now = new Date().getTime();
    var timeDelta = now - this.lastRenderTime;
    this.lastRenderTime = now;
    this.fps = 1000 / timeDelta;

};

Renderer.prototype.clearSprites = function() {
    // clear the visible sprites array but keep a copy in oldVisibleSprites for later.
    // also mark all the sprites as not visible so they can be added to visibleSprites again during raycasting.
    for (var i=0; i < this.visibleSprites.length;i++) {
        this.oldVisibleSprites[i] = this.visibleSprites[i];
        this.oldVisibleSprites[i].visible = false;
    }
    this.visibleSprites = [];
};

Renderer.prototype.renderSprites = function () {

    for (var i=0; i< this.visibleSprites.length; i++) {
        var img = this.visibleSprites[i];
        img.style.display = "block";

        // translate position to viewer space
        var dx = img.pos.x + 0.5 - this.player.x;
        var dy = img.pos.y + 0.5 - this.player.y;

        // distance to sprite
        var dist = Math.sqrt(dx*dx + dy*dy);

        // sprite angle relative to viewing angle
        var spriteAngle = Math.atan2(dy, dx) - this.player.angleRad;

        // size of the sprite
        var size = this.viewDistance / (Math.cos(spriteAngle) * dist);

        if (size <= 0) continue;

        // x-position on screen
        var x = Math.tan(spriteAngle) * this.viewDistance;
        img.style.left = (this.screenWidth/2 + x - size/2) + "px";

        // y is constant since we keep all sprites at the same height and vertical position
        img.style.top = ((this.screenHeight-size)/2)+"px";

        img.style.width = size + "px";
        img.style.height =  size + "px";

        var dbx = img.pos.x - this.player.x;
        var dby = img.pos.y - this.player.y;
        var blockDist = dbx*dbx + dby*dby;
        img.style.zIndex = -Math.floor(blockDist*1000);
    }

    // hide the sprites that are no longer visible
    for (i=0; i < this.oldVisibleSprites.length;i++) {
        img = this.oldVisibleSprites[i];
        if (this.visibleSprites.indexOf(img) < 0) {
            img.style.display = "none";
        }
    }
};

//for sprite animation support
Renderer.prototype.getAnimationState = function(entity){
    var wCycleTime = this.textures.worldObjects[entity.type].walkCycleTime;
    //var states = this.textures.worldObjects[entity.type].totalStates;
    var wSprites = this.textures.worldObjects[entity.type].numWalkSprites;
    if (entity.move && wCycleTime /*&& states */&& wSprites) {
        return Math.floor((new Date() % wCycleTime) / (wCycleTime / wSprites)) + 1;
    }
    return 0;
};

Renderer.prototype.renderWorldObjects = function () {
    for (var i in this.worldObjectsSprites) {
        var obj = this.worldObjectsSprites[i];
        // make sure object still exists
        if (!this.game.state.objects[obj.id]) {
            this.viewCanvas.removeChild(obj.img);
            delete this.worldObjectsSprites[i];
            continue;
        }
        var img = obj.img;

        var dx = obj.x - this.player.x;
        var dy = obj.y - this.player.y;

        var angle =  Math.atan2(dy, dx) - this.player.angleRad;

        if (angle < -Math.PI) angle += 2*Math.PI;
        if (angle >= Math.PI) angle -= 2*Math.PI;

        // is obj in front of player? Maybe use the FOV value instead.
        var style = img.style;
        var oldStyles = obj.oldStyles;
        if (angle > -Math.PI*0.5 && angle < Math.PI*0.5) {
            var distSquared = dx*dx + dy*dy;
            var dist = Math.sqrt(distSquared);
            var size = this.viewDistance / (Math.cos(angle) * dist);

            if (size <= 0) continue;

            var x = Math.tan(angle) * this.viewDistance;

            // height is equal to the sprite size
            if (size != oldStyles.height) {
                style.height =  size + "px";
                oldStyles.height = size;
            }

            // width is equal to the sprite size times the total number of states
            var states = this.textures.worldObjects[obj.type].totalStates || 1;
            var styleWidth = size * states;
            if (styleWidth != oldStyles.width) {
                style.width = styleWidth + "px";
                oldStyles.width = styleWidth;
            }

            // top position is halfway down the screen, minus half the sprite height
            var styleTop = ((this.screenHeight-size)/2);
            if (obj.levitate){
                var dt = new Date();
                styleTop+= Math.round((size/140) * Math.cos((((dt.getSeconds()%2)*1000+dt.getMilliseconds())/2000)*twoPI));
                //console.log("float = "+floating);
            }
            if (styleTop != oldStyles.top) {
                style.top = styleTop + "px";
                oldStyles.top = styleTop;
            }

            var walkState = this.getAnimationState(obj);
            // place at x position, adjusted for sprite size and the current sprite state
            var styleLeft = (this.screenWidth/2 + x - size/2 - size*walkState);
            if (styleLeft != oldStyles.left) {
                style.left = styleLeft + "px";
                oldStyles.left = styleLeft;
            }

            var styleZIndex = -(distSquared*1000)>>0;
            if (styleZIndex != oldStyles.zIndex) {
                style.zIndex = styleZIndex;
                oldStyles.zIndex = styleZIndex;
            }

            if ("block" != oldStyles.display) {
                style.display = "block";
                oldStyles.display = "block";
            }

            var styleClip = "rect(0, " + (size*(walkState+1)) + ", " + size + ", " + (size*(walkState)) + ")";
            if (styleClip != oldStyles.clip) {
                style.clip = styleClip;
                oldStyles.clip = styleClip;
            }
        } else {
            if ("none" != oldStyles.display) {
                img.style.display = "none";
                oldStyles.display = "none";
            }
        }
    }
};

Renderer.prototype.updateOverlay = function() {
    this.overlay.innerHTML = "FPS: " + this.fps.toFixed(1) + "<br/>" + this.overlayText;
    this.overlayText = "";
};


Renderer.prototype.castRays = function() {
    var stripIdx = 0;

    for (var i=0;i<this.numRays;i++) {
        // where on the screen does ray go through?
        var rayScreenPos = (-this.numRays/2 + i) * this.stripWidth;

        // the distance from the viewer to the point on the screen, simply Pythagoras.
        var rayViewDist = Math.sqrt(rayScreenPos*rayScreenPos + this.viewDistance*this.viewDistance);

        // the angle of the ray, relative to the viewing direction.
        // right triangle: a = sin(A) * c
        var rayAngle = Math.asin(rayScreenPos / rayViewDist);

        this.castSingleRay(
                this.player.angleRad + rayAngle, 	// add the players viewing direction to get the angle in world space
            stripIdx++
        );
    }
};

Renderer.prototype.castSingleRay = function (rayAngle, stripIdx) {

    // first make sure the angle is between 0 and 360 degrees
    rayAngle %= twoPI;
    if (rayAngle < 0) rayAngle += twoPI;

    // moving right/left? up/down? Determined by which quadrant the angle is in.
    var right = (rayAngle > twoPI * 0.75 || rayAngle < twoPI * 0.25);
    var up = (rayAngle < 0 || rayAngle > Math.PI);

    var wallType = 0;

    // only do these once
    var angleSin = Math.sin(rayAngle);
    var angleCos = Math.cos(rayAngle);

    var dist = 0;	// the distance to the block we hit
    var xHit = 0; 	// the x and y coord of where the ray hit the block
    var yHit = 0;
    var xWallHit = 0;
    var yWallHit = 0;

    var textureX;	// the x-coord on the texture of the block, ie. what part of the texture are we going to render
    var wallX;	// the (x,y) map coords of the block
    var wallY;

    var wallIsShaded = false;

    var wallIsHorizontal = false;

    // first check against the vertical map/wall lines
    // we do this by moving to the right or left edge of the block we're standing in
    // and then moving in 1 map unit steps horizontally. The amount we have to move vertically
    // is determined by the slope of the ray, which is simply defined as sin(angle) / cos(angle).

    var slope = angleSin / angleCos; 	// the slope of the straight line made by the ray
    var dXVer = right ? 1 : -1; 	// we move either 1 map unit to the left or right
    var dYVer = dXVer * slope; 	// how much to move up or down

    var x = right ? Math.ceil(this.player.x) : Math.floor(this.player.x);	// starting horizontal position, at one of the edges of the current map block
    var y = this.player.y + (x - this.player.x) * slope;			// starting vertical position. We add the small horizontal step we just made, multiplied by the slope.

    while (x >= 0 && x < this.game.level.width && y >= 0 && y < this.game.level.height) {
        wallX = (x + (right ? 0 : -1))>>0;
        wallY = (y)>>0;

        if (this.spriteMap[wallY][wallX] && !this.spriteMap[wallY][wallX].visible) {
            this.spriteMap[wallY][wallX].visible = true;
            this.visibleSprites.push(this.spriteMap[wallY][wallX]);
        }

        // is this point inside a wall block?
        if (this.map[wallY][wallX] > 0) {

            distX = x - this.player.x;
            distY = y - this.player.y;
            dist = distX*distX + distY*distY;	// the distance from the player to this point, squared.

            wallType = this.map[wallY][wallX]; // we'll remember the type of wall we hit for later
            textureX = y % 1;	// where exactly are we on the wall? textureX is the x coordinate on the texture that we'll use later when texturing the wall.
            if (!right) textureX = 1 - textureX; // if we're looking to the left side of the map, the texture should be reversed

            xHit = x;	// save the coordinates of the hit. We only really use these to draw the rays on minimap.
            yHit = y;
            xWallHit = wallX;
            yWallHit = wallY;

            // make horizontal walls shaded
            wallIsShaded = true;

            wallIsHorizontal = true;

            break;
        }
        x = x + dXVer;
        y = y + dYVer;
    }

    // now check against horizontal lines. It's basically the same, just "turned around".
    // the only difference here is that once we hit a map block,
    // we check if there we also found one in the earlier, vertical run. We'll know that if dist != 0.
    // If so, we only register this hit if this distance is smaller.

    slope = angleCos / angleSin;
    var dYHor = up ? -1 : 1;
    var dXHor = dYHor * slope;
    y = up ? Math.floor(this.player.y) : Math.ceil(this.player.y);
    x = this.player.x + (y - this.player.y) * slope;

    while (x >= 0 && x < this.game.level.width && y >= 0 && y < this.game.level.height) {
        wallY = (y + (up ? -1 : 0))>>0;
        wallX = (x)>>0;

        if (this.spriteMap[wallY][wallX] && !this.spriteMap[wallY][wallX].visible) {
            this.spriteMap[wallY][wallX].visible = true;
            this.visibleSprites.push(this.spriteMap[wallY][wallX]);
        }

        if (this.map[wallY][wallX] > 0) {
            var distX = x - this.player.x;
            var distY = y - this.player.y;
            var blockDist = distX*distX + distY*distY;
            if (!dist || blockDist < dist) {
                dist = blockDist;
                xHit = x;
                yHit = y;
                xWallHit = wallX;
                yWallHit = wallY;

                wallType = this.map[wallY][wallX];
                textureX = x % 1;
                if (up) textureX = 1 - textureX;

                wallIsShaded = false;
            }
            break;
        }
        x = x + dXHor;
        y = y + dYHor;
    }

    if (dist) {
        //drawRay(xHit, yHit);

        var strip = this.screenStrips[stripIdx];

        dist = Math.sqrt(dist);

        // use perpendicular distance to adjust for fish eye
        // distorted_dist = correct_dist / cos(relative_angle_of_ray)
        dist = dist * Math.cos(this.player.angleRad - rayAngle);

        // now calc the position, height and width of the wall strip

        // "real" wall height in the game world is 1 unit, the distance from the player to the screen is viewDist,
        // thus the height on the screen is equal to wall_height_real * viewDist / dist

        var height = Math.round(this.viewDistance / dist);

        // width is the same, but we have to stretch the texture to a factor of stripWidth to make it fill the strip correctly
        var width = height * this.stripWidth;

        // top placement is easy since everything is centered on the x-axis, so we simply move
        // it half way down the screen and then half the wall height back up.
        var top = Math.round((this.screenHeight - height) / 2);

        var imgTop = 0;

        var style = strip.style;
        var oldStyles = strip.oldStyles;

        var styleSrc = this.textures.walls[wallType];
        if (oldStyles.src != styleSrc) {
            strip.src = styleSrc;
            oldStyles.src = styleSrc
        }

        var styleHeight = height;
        if (oldStyles.height != styleHeight) {
            style.height = styleHeight + "px";
            oldStyles.height = styleHeight
        }

        var texX = Math.round(textureX*width);
        if (texX > width - this.stripWidth)
            texX = width - this.stripWidth;
        texX += (wallIsShaded ? width : 0);

        var styleWidth = (width*2)>>0;
        if (oldStyles.width != styleWidth) {
            style.width = styleWidth +"px";
            oldStyles.width = styleWidth;
        }

        var styleTop = top - imgTop;
        if (oldStyles.top != styleTop) {
            style.top = styleTop + "px";
            oldStyles.top = styleTop;
        }

        var styleLeft = stripIdx*this.stripWidth - texX;
        if (oldStyles.left != styleLeft) {
            style.left = styleLeft + "px";
            oldStyles.left = styleLeft;
        }

        var styleClip = "rect(" + imgTop + ", " + (texX + this.stripWidth)  + ", " + (imgTop + height) + ", " + texX + ")";
        if (oldStyles.clip != styleClip) {
            style.clip = styleClip;
            oldStyles.clip = styleClip;
        }

        var dwx = xWallHit - this.player.x;
        var dwy = yWallHit - this.player.y;
        var wallDist = dwx*dwx + dwy*dwy;
        var styleZIndex = -(wallDist*1000)>>0;
        if (styleZIndex != oldStyles.zIndex) {
            strip.style.zIndex = styleZIndex;
            oldStyles.zIndex = styleZIndex;
        }

    }

};
var skyOffConst = -2000 / Math.PI;
Renderer.prototype.renderSky = function() {
    var skyOff = parseInt((this.player.angleRad + Math.PI/2 ) * skyOffConst);
    // Don't put the sky in the frame array, because that's too slow.  Instead, keep it separate and just change the offset
    $("ceiling").style.backgroundPosition = skyOff + "px 0px";
};


Renderer.prototype.drawMiniMap = function () {

    // draw the topdown view minimap
    var miniMap = $("minimap");			// the actual map
    var miniMapCtr = $("minimapcontainer");		// the container div element
    var miniMapObjects = $("minimapobjects");	// the canvas used for drawing the objects on the map (player character, etc)

    miniMap.width = this.game.level.width * this.miniMapScale;	// resize the internal canvas dimensions
    miniMap.height = this.game.level.height * this.miniMapScale;	// of both the map canvas and the object canvas
    miniMapObjects.width = miniMap.width;
    miniMapObjects.height = miniMap.height;

    miniMap.style.width = miniMapObjects.style.width = miniMapCtr.style.width = (miniMap.width + "px");
    miniMap.style.height = miniMapObjects.style.height = miniMapCtr.style.height = (miniMap.height + "px");

    var ctx = miniMap.getContext("2d");

    ctx.fillStyle = "white";
    ctx.fillRect(0,0,miniMap.width, miniMap.height);

    // loop through all blocks on the map
    for (var y=0; y < this.game.level.height; y++) {
        for (var x=0; x<this.game.level.width; x++) {

            var wall = this.map[y][x];

            if (wall > 0) { // if there is a wall block at this (x,y) ...
                ctx.fillStyle = "rgb(200,200,200)";
                ctx.fillRect(				// ... then draw a block on the minimap
                        x * this.miniMapScale,
                        y * this.miniMapScale,
                    this.miniMapScale,this.miniMapScale
                );
            }

            if (this.spriteMap[y][x]) {
                ctx.fillStyle = "rgb(100,200,100)";
                ctx.fillRect(
                        x * this.miniMapScale + this.miniMapScale*0.25,
                        y * this.miniMapScale + this.miniMapScale*0.25,
                        this.miniMapScale*0.5,this.miniMapScale*0.5
                );
            }
        }
    }

    this.updateMiniMap();
};

Renderer.prototype.updateMiniMap = function() {

    var miniMapObjects = $("minimapobjects");

    var objectCtx = miniMapObjects.getContext("2d");

    objectCtx.strokeStyle = "red";
    objectCtx.beginPath();
    objectCtx.moveTo(this.player.x * this.miniMapScale, this.player.y * this.miniMapScale);
    objectCtx.lineTo(
            (this.player.x + Math.cos(this.player.angleRad) * 4) * this.miniMapScale,
            (this.player.y + Math.sin(this.player.angleRad) * 4) * this.miniMapScale
    );
    objectCtx.closePath();
    objectCtx.stroke();

    var objects = this.game.state.objects;
    for (var i in objects) {
        var obj = objects[i];

        objectCtx.fillStyle = obj.type=='Player'? "red":"blue";
        objectCtx.fillRect(		// draw a dot at the enemy position
                obj.x * this.miniMapScale - 2,
                obj.y * this.miniMapScale - 2,
            4, 4
        );
    }
};

Renderer.prototype.constructor = Renderer;
//function drawRay(rayX, rayY) {
//    var miniMapObjects = $("minimapobjects");
//    var objectCtx = miniMapObjects.getContext("2d");
//
//    objectCtx.strokeStyle = "rgba(0,100,0,0.3)";
//    objectCtx.lineWidth = 0.5;
//    objectCtx.beginPath();
//    objectCtx.moveTo(player.x * miniMapScale, player.y * miniMapScale);
//    objectCtx.lineTo(
//            rayX * miniMapScale,
//            rayY * miniMapScale
//    );
//    objectCtx.closePath();
//    objectCtx.stroke();
//}


