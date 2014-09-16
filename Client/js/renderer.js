/**
 * Created by Laur on 08.09.2014.
 */

var Renderer = function(game,textures, viewCanvas,overlay) {

    this.game = game;
    this.viewCanvas = viewCanvas;
    this.overlay = overlay;
    this.textures = textures;
    this.player = game.state.objects[0];

    this.screenWidth = 800;
    this.screenHeight =600;
    this.miniMapScale = 8;
    this.showOverlay = true;
    this.showMiniMap = true;
    this.stripWidth = 3;
    this.fov = 60 * Math.PI / 180;

    this.spriteMap = [];
    this.screenStrips = [];
    this.fps = 0;
    this.overlayText = "";
    this.visibleSprites = [];
    this.oldVisibleSprites = [];

    this.lastRenderTime = new Date();

    this.numRays = Math.ceil(this.screenWidth / this.stripWidth);
    this.viewDistance = (this.screenWidth/2) / Math.tan((this.fov / 2));

    this.initSprites();
    game.on('update', this.renderCycle);
};

Renderer.prototype.initSprites = function () {
    for (var y=0; y < this.game.level.height; y++) {
        this.spriteMap[y] = [];
    }
    var ps = this.game.level.spritePositions;
    for (var i=0; i < ps; i++) {
        var img = dc("img");
        img.src = this.textures.sprites[ps[i].type];
        img.style.display = "none";
        img.style.position = "absolute";

        this.spriteMap[ps[i].y][ps[i].x] = img;
        this.viewCanvas.appendChild(img);
    }

};

Renderer.prototype.renderCycle = function () {
    this.player.angleRad = this.player.angle * Math.PI / 180;

    this.clearSprites();
    this.castRays();
    this.renderSprites();
    this.renderWorldObjects();

    if (this.showMiniMap) {
        this.updateMiniMap();
        this.drawMiniMap();
    }
    if (this.showOverlay) {
        updateOverlay();
    }

    // time since last rendering
    var now = new Date().getTime();
    var timeDelta = now - this.lastRenderCycleTime;
    this.lastRenderCycleTime = now;
    this.fps = 1000 / timeDelta;

};

Renderer.prototype.clearSprites = function() {
    // clear the visible sprites array but keep a copy in oldVisibleSprites for later.
    // also mark all the sprites as not visible so they can be added to visibleSprites again during raycasting.
    for (var i=0; i < this.visibleSprites.length;i++) {
        this.oldVisibleSprites[i] = this.visibleSprites[i];
    }
    this.visibleSprites.clear();
};

Renderer.prototype.renderSprites = function () {

    for (var i=0; i< this.visibleSprites.length; i++) {
        var sprite = this.visibleSprites[i];
        var img = sprite.img;
        img.style.display = "block";

        // translate position to viewer space
        var dx = sprite.x + 0.5 - this.player.x;
        var dy = sprite.y + 0.5 - this.player.y;

        // distance to sprite
        var dist = Math.sqrt(dx*dx + dy*dy);

        // sprite angle relative to viewing angle
        var spriteAngle = Math.atan2(dy, dx) - player.angleRad;

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

        var dbx = sprite.x - player.x;
        var dby = sprite.y - player.y;
        var blockDist = dbx*dbx + dby*dby;
        img.style.zIndex = -Math.floor(blockDist*1000);
    }

    // hide the sprites that are no longer visible
    for (i=0; i < this.oldVisibleSprites.length;i++) {
        sprite = this.oldVisibleSprites[i];
        if (this.visibleSprites.indexOf(sprite) < 0) {
            sprite.img.style.display = "none";
        }
    }
};

Renderer.prototype.renderWorldObjects = function () {
    for (var i=1 ;i < this.game.state.objects.length;i++) {
        var obj = this.game.state.objects;
        var img = this.textures.worldObjects[obj.type];

        var dx = obj.x - this.player.x;
        var dy = obj.y - this.player.y;

        var angle = Math.atan2(dy, dx) - player.rot;

        if (angle < -Math.PI) angle += 2*Math.PI;
        if (angle >= Math.PI) angle -= 2*Math.PI;

        // is enemy in front of player? Maybe use the FOV value instead.
        if (angle > -Math.PI*0.5 && angle < Math.PI*0.5) {
            var distSquared = dx*dx + dy*dy;
            var dist = Math.sqrt(distSquared);
            var size = viewDist / (Math.cos(angle) * dist);

            if (size <= 0) continue;

            var x = Math.tan(angle) * viewDist;

            var style = img.style;
            var oldStyles = enemy.oldStyles;

            // height is equal to the sprite size
            if (size != oldStyles.height) {
                style.height =  size + "px";
                oldStyles.height = size;
            }

            // width is equal to the sprite size times the total number of states
            var styleWidth = size * enemy.totalStates;
            if (styleWidth != oldStyles.width) {
                style.width = styleWidth + "px";
                oldStyles.width = styleWidth;
            }

            // top position is halfway down the screen, minus half the sprite height
            var styleTop = ((screenHeight-size)/2);
            if (styleTop != oldStyles.top) {
                style.top = styleTop + "px";
                oldStyles.top = styleTop;
            }

            // place at x position, adjusted for sprite size and the current sprite state
            var styleLeft = (screenWidth/2 + x - size/2 - size*enemy.state);
            if (styleLeft != oldStyles.left) {
                style.left = styleLeft + "px";
                oldStyles.left = styleLeft;
            }

            var styleZIndex = -(distSquared*1000)>>0;
            if (styleZIndex != oldStyles.zIndex) {
                style.zIndex = styleZIndex;
                oldStyles.zIndex = styleZIndex;
            }

            var styleDisplay = "block";
            if (styleDisplay != oldStyles.display) {
                style.display = styleDisplay;
                oldStyles.display = styleDisplay;
            }

            var styleClip = "rect(0, " + (size*(enemy.state+1)) + ", " + size + ", " + (size*(enemy.state)) + ")";
            if (styleClip != oldStyles.clip) {
                style.clip = styleClip;
                oldStyles.clip = styleClip;
            }
        } else {
            var styleDisplay = "none";
            if (styleDisplay != enemy.oldStyles.display) {
                img.style.display = styleDisplay;
                enemy.oldStyles.display = styleDisplay;
            }
        }
    }
}

function updateOverlay() {
    this.overlay.innerHTML = "FPS: " + this.fps.toFixed(1) + "<br/>" + this.overlayText;
    this.overlayText = "";
}


function castRays() {
    var stripIdx = 0;

    for (var i=0;i<numRays;i++) {
        // where on the screen does ray go through?
        var rayScreenPos = (-numRays/2 + i) * stripWidth;

        // the distance from the viewer to the point on the screen, simply Pythagoras.
        var rayViewDist = Math.sqrt(rayScreenPos*rayScreenPos + viewDist*viewDist);

        // the angle of the ray, relative to the viewing direction.
        // right triangle: a = sin(A) * c
        var rayAngle = Math.asin(rayScreenPos / rayViewDist);

        castSingleRay(
                player.rot + rayAngle, 	// add the players viewing direction to get the angle in world space
            stripIdx++
        );
    }
}

function castSingleRay(rayAngle, stripIdx) {

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

    var x = right ? Math.ceil(player.x) : Math.floor(player.x);	// starting horizontal position, at one of the edges of the current map block
    var y = player.y + (x - player.x) * slope;			// starting vertical position. We add the small horizontal step we just made, multiplied by the slope.

    while (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
        var wallX = (x + (right ? 0 : -1))>>0;
        var wallY = (y)>>0;

        if (spriteMap[wallY][wallX] && !spriteMap[wallY][wallX].visible) {
            spriteMap[wallY][wallX].visible = true;
            visibleSprites.push(spriteMap[wallY][wallX]);
        }

        // is this point inside a wall block?
        if (map[wallY][wallX] > 0) {

            var distX = x - player.x;
            var distY = y - player.y;
            dist = distX*distX + distY*distY;	// the distance from the player to this point, squared.

            wallType = map[wallY][wallX]; // we'll remember the type of wall we hit for later
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

    var slope = angleCos / angleSin;
    var dYHor = up ? -1 : 1;
    var dXHor = dYHor * slope;
    var y = up ? Math.floor(player.y) : Math.ceil(player.y);
    var x = player.x + (y - player.y) * slope;

    while (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
        var wallY = (y + (up ? -1 : 0))>>0;
        var wallX = (x)>>0;

        if (spriteMap[wallY][wallX] && !spriteMap[wallY][wallX].visible) {
            spriteMap[wallY][wallX].visible = true;
            visibleSprites.push(spriteMap[wallY][wallX]);
        }

        if (map[wallY][wallX] > 0) {
            var distX = x - player.x;
            var distY = y - player.y;
            var blockDist = distX*distX + distY*distY;
            if (!dist || blockDist < dist) {
                dist = blockDist;
                xHit = x;
                yHit = y;
                xWallHit = wallX;
                yWallHit = wallY;

                wallType = map[wallY][wallX];
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

        var strip = screenStrips[stripIdx];

        dist = Math.sqrt(dist);

        // use perpendicular distance to adjust for fish eye
        // distorted_dist = correct_dist / cos(relative_angle_of_ray)
        dist = dist * Math.cos(player.rot - rayAngle);

        // now calc the position, height and width of the wall strip

        // "real" wall height in the game world is 1 unit, the distance from the player to the screen is viewDist,
        // thus the height on the screen is equal to wall_height_real * viewDist / dist

        var height = Math.round(viewDist / dist);

        // width is the same, but we have to stretch the texture to a factor of stripWidth to make it fill the strip correctly
        var width = height * stripWidth;

        // top placement is easy since everything is centered on the x-axis, so we simply move
        // it half way down the screen and then half the wall height back up.
        var top = Math.round((screenHeight - height) / 2);

        var imgTop = 0;

        var style = strip.style;
        var oldStyles = strip.oldStyles;

        var styleHeight;
        if (useSingleTexture) {
            // then adjust the top placement according to which wall texture we need
            imgTop = (height * (wallType-1))>>0;
            var styleHeight = (height * numTextures)>>0;
        } else {
            var styleSrc = wallTextures[wallType-1];
            if (oldStyles.src != styleSrc) {
                strip.src = styleSrc;
                oldStyles.src = styleSrc
            }
            var styleHeight = height;
        }

        if (oldStyles.height != styleHeight) {
            style.height = styleHeight + "px";
            oldStyles.height = styleHeight
        }

        var texX = Math.round(textureX*width);
        if (texX > width - stripWidth)
            texX = width - stripWidth;
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

        var styleLeft = stripIdx*stripWidth - texX;
        if (oldStyles.left != styleLeft) {
            style.left = styleLeft + "px";
            oldStyles.left = styleLeft;
        }

        var styleClip = "rect(" + imgTop + ", " + (texX + stripWidth)  + ", " + (imgTop + height) + ", " + texX + ")";
        if (oldStyles.clip != styleClip) {
            style.clip = styleClip;
            oldStyles.clip = styleClip;
        }

        var dwx = xWallHit - player.x;
        var dwy = yWallHit - player.y;
        var wallDist = dwx*dwx + dwy*dwy;
        var styleZIndex = -(wallDist*1000)>>0;
        if (styleZIndex != oldStyles.zIndex) {
            strip.style.zIndex = styleZIndex;
            oldStyles.zIndex = styleZIndex;
        }

    }

}

function drawRay(rayX, rayY) {
    var miniMapObjects = $("minimapobjects");
    var objectCtx = miniMapObjects.getContext("2d");

    objectCtx.strokeStyle = "rgba(0,100,0,0.3)";
    objectCtx.lineWidth = 0.5;
    objectCtx.beginPath();
    objectCtx.moveTo(player.x * miniMapScale, player.y * miniMapScale);
    objectCtx.lineTo(
            rayX * miniMapScale,
            rayY * miniMapScale
    );
    objectCtx.closePath();
    objectCtx.stroke();
}


