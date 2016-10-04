var creeplogic = require('creeplogic');
var managepopulation = require('managepopulation');
var taskassignment = require('taskassignment');
//var roomarchitecture = require('roomarchitecture');

module.exports.loop = function() {
	
	//clear dead creeps from memory:
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }
    
    //decay and gradually clear flags
    //the secondary color decriments to show how long it has to live
    if((Game.time % 1000) == 0){
        for(var name in Game.flags) {
            var f = Game.flags[name];
            if(f.secondaryColor == COLOR_RED){
                f.remove();
            } else {
                f.setColor(f.color,f.secondaryColor - 1);
            }
        }
    }    

	//************creep control*************
	for(var name in Game.creeps){
		var creep = Game.creeps[name];
		creeplogic.run(creep);
	}

	//************spawn control*************
	for(var name in Game.spawns){
	    var spawn = Game.spawns[name];
	    spawn.memory.fullness = spawn.room.energyAvailable/spawn.room.energyCapacityAvailable;
		if(Game.time % 50 == 0) managepopulation.run(spawn);
		taskassignment.run(spawn);
		if(Game.time % 20 == 0) console.log('fuel:',(spawn.memory.fullness * 100).toFixed(0) + '%');

		//***************tower control*************
		var t = _.filter(spawn.room.find(FIND_MY_STRUCTURES), (structure) => structure.structureType == STRUCTURE_TOWER);
        for(i=0; i < t.length; i++){
            var tower = t[i];
			
			//shoot at any hostiles
			var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
			if(closestHostile) {
				tower.attack(closestHostile);
			}
			
			//repair every once in a while
            var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) => (structure.hits < structure.hitsMax && structure.structureType != STRUCTURE_WALL)
            });
            if(closestDamagedStructure && Math.random() < t[i].energy/t[i].energyCapacity && Game.time % 2 == 0) {
                if(closestDamagedStructure.structureType != STRUCTURE_ROAD || _.filter(closestDamagedStructure.pos.lookFor(LOOK_FLAGS), (Flag) => Flag.color == COLOR_WHITE).length > 0){
                    tower.repair(closestDamagedStructure);
                }
            }

        } 
        
	}

    //***********spiral test***********
}
