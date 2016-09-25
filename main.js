var spawnAction = require('spawn.functions');
var creepAction = require('creep.functions');
var architect = require('architect.functions')

module.exports.loop = function () {

    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        creepAction.run(creep);                 //creep actions go first so that renewal takes precedence over spawning, hopefully.
    }
    
    for(var name in Game.spawns) {
    spawnAction.run(Game.spawns[name]);         //maintains creep populations
    architect.run(Game.spawns[name].room);      //places structures, runs towers    
    }

    
    //clear dead creeps from memory:
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }
    

    //basic tower control:
    var tower = Game.getObjectById('TOWER_ID');
    if(tower) {
        var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => structure.hits < structure.hitsMax
        });
        if(closestDamagedStructure) {
            tower.repair(closestDamagedStructure);
        }

        var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if(closestHostile) {
            tower.attack(closestHostile);
        }
    }


}
