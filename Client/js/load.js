
(function($) {

// these files are preloaded while the title screen is showing
var files = [
    "../../Server/wolf.js",
    "../../Server/random.js",
    "../../Server/angle.js",
    "../../Server/math.js",
	"../../Server/file.js",
    "../../Server/episodes.js",
    "../../Server/maps.js",
    "../../Server/game.js",
    "../../Server/player.js",
	"../../Server/powerups.js",
    "../../Server/ai.js",
    "../../Server/actorai.js",
    "../../Server/actors.js",
    "../../Server/actstat.js",
    "../../Server/weapon.js",
    "../../Server/doors.js",
    "../../Server/pushwall.js",
    "../../Server/areas.js",
    "../../Server/level.js",
    "../../Server/raycaster.js",
    
	"js/renderer.js",
	"js/sprites.js",
	"js/input.js",
    "js/sound.js",
    "js/menu.js",

    "preload!art/menubg_main.png",
    "preload!art/menuitems.png",
    "preload!art/menuselector.png"

];

// these files are preloaded in the background after the menu is displayed.
// only non-essential files here
var files2 = [
    "preload!art/menubg_episodes.png",
    "preload!art/menuitems_episodes.png",
    "preload!art/menubg_skill.png",
    "preload!art/menubg_levels.png",
    "preload!art/menuitems_levels.png",
    "preload!art/skillfaces.png",
    "preload!art/getpsyched.png",
    "preload!art/menubg_control.png",
    "preload!art/menulight.png",
    "preload!art/menubg_customize.png",
    "preload!art/control_keys.png",
    "preload!art/confirm_newgame.png",
    "preload!art/paused.png"
];

$(document).ready(function() {
  
    var progress = $("<div>"),
        n = 0;

    progress.addClass("load-progress").appendTo("#title-screen");
    $("#title-screen").show();
    
    
    yepnope.addPrefix("preload", function(resource) {
        resource.noexec = true;
        resource.instead = function(input, callback) {
            var image = new Image();
            image.onload = callback;
            image.onerror = callback;
            image.src = input.substr(input.lastIndexOf("!")+1);
        };
        return resource;
    });

    
    Modernizr.load([
        {
            test : window.requestAnimationFrame,
            nope : "js/requestAnimFrame.js"
        },{
            test : window.atob && window.btoa,
            nope : "js/base64.js"
        },{
            load : files,
            callback : function(file) {
                progress.width((++n / files.length) * 100 + "%");
            },
            complete : function() {
                progress.remove();
                $("#title-screen").fadeOut(1500, function() {
                    Wolf.Input.init();
                    Wolf.Game.init();
                    Wolf.Menu.show();
                });
                // preload non-essential art
                Modernizr.load(files2);
            }
        }
    ]);
});

})(jQuery);