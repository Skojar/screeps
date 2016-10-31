/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('taskassignment');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    //call run(spawn) for each spawn.
    //all other functions are referenced in it.
	run: function(spawn){
	    if(!spawn.memory.tasklist) this.init(spawn);
		//assign tasks to closest available creep
		
		//first get the list of creeps who are available to do these tasks 
		var roster = this.availableCreeps(spawn);

		//then check if upgrading isn't more important than anything else		
		if(roster.length > 0){
		    if(spawn.room.controller.ticksToDowngrade < 5000 || spawn.room.controller.level <2) roster = this.assignTask(spawn.room.controller,'upgrade',roster);
		}
		
		//then see if anything needs energy
		if(roster.length > 0){
		    var energies = this.energyRequests(spawn);
		    for(var e = 0; e < energies.length; e++) {
		        roster = this.assignTask(energies[e],'supply', roster);		 
		        //spawn.memory.tasklist.push({target: energies[e].id,action: 'supply'}); //this works, just need to check if it already exist to prevent duplicates
		    }
		}

		//then if anything needs repairing (that's not a wall)
		if(roster.length > 0){
		   var repairs = this.repairRequests(spawn);
		   for(var r = 0; r < repairs.length; r++) roster = this.assignTask(repairs[r], 'repair', roster);
		}

		//then if anything needs to be built, work on it
		if(roster.length > 0){
		    var builds = this.buildRequests(spawn);
		    for(var b = 0; b < builds.length; b++) roster = this.assignTask(builds[b], 'build', roster);
		}
		
		//then if there's a storage unit, make a deposit for the future, but only if it's not the sole source of energy at the moment
        var bank = spawn.room.storage;		
		if(spawn.room.find(FIND_SOURCES_ACTIVE).length > 0){
		    if(roster.length > 0){
	              if(bank != undefined) roster = this.assignTask(bank,'supply',roster);
		    }			
		}		
		//...and report on how much energy is stored, relative to A. a source maximum and B. the total energy capacity of the room
		if(bank != undefined && Game.time % 25 == 0){ 
		    var numerator = spawn.room.storage.store[RESOURCE_ENERGY];
		    var denominator = spawn.room.energyCapacityAvailable;
		    spawn.memory.energyCycles = Math.floor(numerator/3000);
		    spawn.memory.report += '+ ' + (numerator/3000).toFixed(1) + "|" + (numerator/denominator).toFixed(1);
	    }
		

		
		//then throw in upgrade again here for good measure
		if(roster.length > 0) roster = this.assignTask(spawn.room.controller,'upgrade',roster);
		
		//then let creeps fortify where needed
		if(roster.length > 0){
		   var walls = this.fortificationRequests(spawn);
		   for(var w = 0; w < walls.length; w++) roster = this.assignTask(walls[w], 'repair',roster);
		}

		//if any creeps are left over still available, have them upgrade
		while(roster.length > 0) roster = this.assignTask(spawn.room.controller,'upgrade',roster);
	},
	
	energyRequests: function(spawn){
		//returns an array of everything in spawn's room that needs energy
		//first, extensions from farthest to nearest (from spawn)
		//then towers,
		//then the spawn
		if(spawn.memory.alarm){
		    //if under attack, prioritize towers
		    var list = _.filter(spawn.room.find(FIND_MY_STRUCTURES), (structure) => (structure.structureType == STRUCTURE_TOWER));
		    list = list.concat(_.filter(spawn.room.find(FIND_MY_STRUCTURES), (structure) => (structure.structureType == STRUCTURE_EXTENSION && structure.energy < structure.energyCapacity)).sort(function(a,b){return b.pos.getRangeTo(spawn) - a.pos.getRangeTo(spawn)}));
		    list.push(spawn);
		} else {
		    //otherwise, prioritize extensions and let towers run slightly low
            var list = _.filter(spawn.room.find(FIND_MY_STRUCTURES), (structure) => (structure.structureType == STRUCTURE_EXTENSION && structure.energy < structure.energyCapacity)).sort(function(a,b){return b.pos.getRangeTo(spawn) - a.pos.getRangeTo(spawn)});
            list = list.concat(_.filter(spawn.room.find(FIND_MY_STRUCTURES), (structure) => (structure.structureType == STRUCTURE_TOWER && structure.energy < (structure.energyCapacity - 49))));
            list.push(spawn);
		}
        return list;
	},
	
	repairRequests: function(spawn){
		//returns an array of everything in spawn's room that need repair, that isn't a wall or rampart
	    return spawn.room.find(FIND_MY_STRUCTURES, { 
                filter: (structure) => structure.hits < structure.hitsMax 
					&& structure.structureType != STRUCTURE_WALL 
					//&& structure.structureType != STRUCTURE_RAMPART
            });		
	},
	
	buildRequests: function(spawn){
		//returns an array of everything that wants to be built
		return spawn.room.find(FIND_MY_CONSTRUCTION_SITES);
	},
	
	fortificationRequests: function(spawn){
		//returns an array of walls and ramparts that need additional fortification
		//needs good formula for deciding how much to build up a wall.  For now I just picked an arbitrary number
		var wallMinimum = Math.min(450000, Math.pow(spawn.room.controller.level,3) * 10000);
		//the sort suffix puts the weakes walls at the top of the list (hoepfully)
        return _.filter(spawn.room.find(FIND_STRUCTURES), (structure) => (structure.structureType == STRUCTURE_WALL || structure.structureType == STRUCTURE_RAMPART) && structure.hits < wallMinimum).sort(function(a,b){return a.hits - b.hits}); 
	},
	
	availableCreeps: function(spawn){
		//returns an array of creeps in the spawn's room that aren't occupied
		//creeps decide if they are busy elsewhere.  
		return _.filter(spawn.room.find(FIND_MY_CREEPS), (creep) => creep.memory.busy != true);
	},
	
	findClosestFromList: function(target, list){
	    var nearest = 71;
	    var candidate = 0;
	    if(target == null){
	        console.log('error assigning creep to ' + target);
	    } else {
	        for(i = 0; i < list.length; i++){
	            var dist = target.pos.getRangeTo(list[i]);
	            if(dist < nearest) {
	                candidate = i;
	                nearest = dist;
	            }
	        }
	    }
	    return candidate;
	},
	
	assignTask: function(target, task, roster){
		//assigns target and task to the available creep closest to target.pos
		var assignee = this.findClosestFromList(target,roster);
		if(roster[assignee] != undefined){ //if a creep was found, make it busy with this task
			roster[assignee].memory.target = target.id;
			roster[assignee].memory.task = task;
			roster[assignee].memory.busy = true;
			roster.splice(assignee,1); //remove the assigned creep from the list of available creeps
		}
		return roster; //then return the updated list back to the caller
	},
	
	init: function(spawn){
	    spawn.memory.tasklist = [];
	}
};
