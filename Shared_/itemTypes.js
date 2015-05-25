/**
 * Created by Laur on 25.05.2015.
 */
(function(exports) {

    exports['Crude Dagger'] = {
       canEquip: true,
       effects:{
           damage:[[1,3],[0,0]],
           attack: 1
       }
    };
    exports['Short Bow'] = {
        canEquip: true,
        effects:{
            damage:[[0,2],[0,0]],
            attackType: 1 //ranged attack
        }
    };
    exports['Buckler Shield'] = {
        canEquip: true,
        effects:{
            defence: 1,
            resist: [0.01,0]
        }
    };
    exports['Robe'] = {
        canEquip: true,
        effects:{
            HP:1
        }
    };

    //potions
    exports['Red Potion'] = {
        canUse: true,
        effects:{
            HP: 5
        }
    };
    exports['Blue Potion'] = {
        canUse: true,
        effects:{
            SP: 5
        }
    };






   exports.GetNew = function(typeName) {
       return JSON.parse( JSON.stringify( exports[typeName] ) );
   };
   for (var prop in exports) {
        if (exports.hasOwnProperty(prop))
            exports[prop].type = ''+prop;
   }
})(typeof global === "undefined" ? window.itemTypes = {} : exports);