var classes = require('class_extensions');
var creeplogic = require('creeplogic');
var managepopulation = require('managepopulation');
var taskassignment = require('taskassignment');
var roomarchitecture = require('roomarchitecture');



global.CLEANUP_DELAY = 300;                 // the number of ticks to wait before cleaning up 
global.ALLOW_PERMANENT_FLAGS = true;        // if false, all flags decay.  if true flags with white as secondary color do not.
global.FLAG_REPAIR_THRESHOLD = 6;           // the amount of traffic a road needs to get to warrant maintenance, 1-9

global.TICKS_PER_SECOND = 3.19;             // estimated based on http://status.screeps.com/

module.exports.loop = function() {

    //some spawn-based recordkeeping
    Memory.spawncount = 0;
    for(var c in Game.spawns) {
        Memory.spawncount++; // count spawns to compare with GCL allowance, to see if there is an expantion opportunity.
        var spawn = Game.spawns[c];
	    spawn.record('control'); // note the control level of the room, for later analysis
	    spawn.record('exploit'); // note the % of energy available to be harvested, for later analysis
    }
	
	//clear dead creeps from memory:
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('__Clearing non-existing creep memory:', name);
        }
    }
    
    //decay and gradually clear flags
    //the secondary color decriments to show how long it has to live, as multiple of CLEANUP_DELAY
    if((Game.time % CLEANUP_DELAY) == 0){
        for(var name in Game.flags) {
            var f = Game.flags[name]; 
            if(ALLOW_PERMANENT_FLAGS == true && f.secondaryColor != COLOR_WHITE){ //white-tipped flags don't deteriorate, so that permanent flags are possible.
                if(f.secondaryColor == COLOR_RED){
                    f.remove();
                } else {
                    f.setColor(f.color,f.secondaryColor - 1);
                }
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

        if(Game.time % 25 == 0) console.log("***" + spawn.name + " report:\n");
	    spawn.memory.report = "";
	    
	    spawn.record('fullness');
	    spawn.record('patients');
		managepopulation.run(spawn);
		taskassignment.run(spawn);
		roomarchitecture.run(spawn);
		
		spawn.memory.report = '\tfuel: ' + (spawn.memory.fullness * 100).toFixed(0) + '% ' + spawn.memory.report;
	    spawn.memory.report = spawn.memory.report + spawn.report('toUpgrade') + '\n';
	    var pluralize = spawn.memory.population != 1 ? "s" : "";
	    spawn.memory.report = spawn.memory.report + "\t" + spawn.memory.population + " creep" + pluralize;
	    spawn.memory.report = spawn.memory.report + " | lvl " + spawn.room.controller.level;
	    if(Game.time % 25 == 0){
	        var totale = 0;
    	    for(e = 0; e < 100; e++) totale += spawn.memory.exploit[e];
            
	    }
	    var expl = 100 - totale;
	    spawn.memory.report = spawn.memory.report + " | " + expl.toFixed(1) + "% exploited";
        if(Game.time % 25 == 0) console.log(spawn.memory.report);
        

		//***************tower control*************
		var towers = _.filter(spawn.room.find(FIND_MY_STRUCTURES), (structure) => structure.structureType == STRUCTURE_TOWER);
		var repairdelay = Math.max(Math.floor((1 - spawn.memory['worker']) * 10),1);
        towers.forEach(tower => tower.defend_room());
        towers.forEach(tower => tower.heal_room());
        towers.forEach(tower => tower.repair_room(repairdelay));

        //**********clean up road construction sites
        if((Game.time % (CLEANUP_DELAY + 1)) == 0){ //right after flags decay, get rid of some road sites that haven't been worked.
            var sites = _.filter(spawn.room.find(FIND_CONSTRUCTION_SITES), (site) => (site.structureType == STRUCTURE_ROAD && site.progress == 0));
            for(s = sites.length; s > 0; s--){ //gets rid of the newest sites first.  I actually don't think this matters now that Math.random() is being used.
                var w = sites[s-1].pos;
                if(Math.random() < 0.2){
                    sites[s-1].remove();
                    w.createFlag(undefined,COLOR_GREY,COLOR_BROWN);
                }
            }
        }
        
        //***********check room mapping**********
        if(Game.cpu.getUsed() < 10){
            //roomarchitecture.mapRoom(spawn);
        }
	}
	
	
	//record and report on CPU usage
	if(!Memory.process) Memory.process = {};
	Memory.process[Game.time % 100] = Game.cpu.getUsed();
	if(Game.time % 100 == 0){
	    var total = 0;
	    var peak = 0;
	    for(p = 0; p < 100; p++){
	        total += Memory.process[p];
	        peak = Math.max(Memory.process[p], peak); 
	    }
	    console.log((total/100).toFixed(1),'CPU |',Math.ceil(peak) , (Game.cpu.bucket/100).toFixed(1) + "% bucket");
	}

}



/* emergency new creep:

Game.spawns['Spawn1'].createCreep([WORK,MOVE,CARRY], undefined, {role: 'worker', lvl: 1, home: Game.spawns['Spawn1'].id, busy: false})

*/
