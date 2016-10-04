/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('creeplogic');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    //call run(creep) for each creep
    
	run: function(creep) {
		//do whatever taskwas assigned last tick
		creep.say(creep.memory.task);
		switch (creep.memory.task){
			case 'harvest': this.harvestEnergy(creep); break;
			case 'upgrade': this.upgrade(creep); break;
			case 'supply': this.supplyEnergy(creep); break;
			case 'build': this.constructSite(creep); break;
			case 'repair': this.repairStructure(creep); break;
			case 'convalesce': this.convalesce(creep); break;
			case 'defend': this.defend(creep); break;
			case 'explore': this.explore(creep); break;
			case 'heal': this.heal(creep); break;
		}
		//check if this creep needs to retire
		var homeController = Game.getObjectById(creep.memory.home).room.controller;
		var popInService = Game.getObjectById(creep.memory.home).memory[creep.memory.role];
		if(homeController.level > creep.memory.lvl || popInService > 1) creep.memory.retired = true;
		//make sure retirement isn't a bad idea
		if(popInService < 1) creep.memory.retired = false;
		//check if a not busy creep has other business or should be assigned a task
		if(creep.memory.busy == false){
			switch (creep.memory.role){
				case 'warrior': 
				    creep.memory.task = 'defend'; 
				    creep.memory.busy = true; 
				    break;
				case 'explorer': 
				    creep.memory.task = 'explore'; 
				    creep.memory.busy = true; 
				    break;
				case 'priest':
				    creep.memory.task = 'heal';
				    creep.memory.busy = true;
				    break;
				default:
				    creep.memory.task = 'wait';
			}
		}
		//check if the creep is empty
		if(creep.carryCapacity > 0 && creep.carry.energy == 0 && creep.memory.task != 'convalesce'){
				creep.memory.task = 'harvest'; creep.memory.busy = true; 		    
		}
		//check if this creep needs to convalesce
		if(creep.ticksToLive < 250 && !creep.memory.retired && Game.getObjectById(creep.memory.home).memory.patients < 4 ) {
			creep.memory.task = 'convalesce';
			creep.memory.busy = true;
		}
		//leave a trace flag if on a road.  this marks it as 'should be repaired'
		if(_.filter(creep.pos.lookFor(LOOK_STRUCTURES), (structure) => structure.structureType == STRUCTURE_ROAD).length > 0 ? true : false){
			var traced = false;
			var existingFlags = creep.pos.lookFor(LOOK_FLAGS);
			for(var f = 0; f < existingFlags.length; f++){
				if(existingFlags[f].color == COLOR_WHITE) traced = true;
			}
			if(!traced) creep.pos.createFlag(undefined,COLOR_WHITE,COLOR_RED);
		}
	},
	
	randomDirectionNot: function(excludedDirection){
		var d = excludedDirection;
		while(d == excludedDirection){
			d = Math.ceil(Math.random() * 8);
		}
		return d;
	},
	
	harvestEnergy: function(creep){
		var target = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
		if(target == null){
		    //if there are no active sources, check for stored energy, and go there as an alternate
		    if(creep.room.storage.store[RESOURCE_ENERGY] > 0) {
		        var alternate = _.filter(creep.room.find(FIND_STRUCTURES), (Structure) => Structure.structureType == STRUCTURE_STORAGE)[0];
		        if(creep.withdraw(alternate, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
		            creep.moveTo(alternate);
		        }
		    }
		} else {
		    //harvest sources
			if(creep.harvest(target) == ERR_NOT_IN_RANGE) {
				creep.moveTo(target);
			}
		}
		if(creep.carry.energy == creep.carryCapacity) creep.memory.busy = false;
	},
	
	upgrade: function(creep){
		var target = Game.getObjectById(creep.memory.target);
		if(creep.upgradeController(target) == ERR_NOT_IN_RANGE){
			creep.moveTo(target);
		}
		creep.memory.busy = false;
	},
	
	supplyEnergy: function(creep){
		var target = Game.getObjectById(creep.memory.target);
		if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
			creep.moveTo(target);
		}
		creep.memory.busy = false;
	},
	
	constructSite: function(creep){
		var target = Game.getObjectById(creep.memory.target);
		if(creep.build(target) == ERR_NOT_IN_RANGE){
			creep.moveTo(target);
		}
		creep.memory.busy = false;
	},
	
	repairStructure: function(creep){
		var target = Game.getObjectById(creep.memory.target);
		if(creep.repair(target) == ERR_NOT_IN_RANGE){
			creep.moveTo(target);
		}
		creep.memory.busy = false;		
	},
	
	convalesce: function(creep){
		var target = Game.getObjectById(creep.memory.home);
		var triage = creep.ticksToLive;
		var patients = this.lookForCreepsAround(target);
		for(var p = 0; p < patients.length; p++) {
		    triage = Math.min(patients[p].ticksToLive,triage);
		}
		if((triage < creep.ticksToLive && creep.pos.getRangeTo(target) < 3) || target.spawning != null) {
			creep.move(this.randomDirectionNot(creep.pos.getDirectionTo(target))); //wait your turn, keep spawn area clear
		} else {
			creep.moveTo(target);
		}
		creep.transfer(target, RESOURCE_ENERGY);
		if(creep.pos.isNearTo(target)) target.renewCreep(creep);
		if(creep.ticksToLive > (400 + target.memory[creep.memory.role] * 300 + target.memory.fullness * 700)) creep.memory.busy = false;
	},
	
	lookForCreepsAround: function(center){
	  //returns all creeps in a 3x3 square around center 
	  //because built in lookForAtArea didn't seem to work as expected
	  var list = [];
	  for(var x=-1;x<2;x++){
	      for(var y=-1;y<2;y++){
	          var found = center.room.lookForAt(LOOK_CREEPS, center.pos.x+x,center.pos.y+y);
	          if(found.length)list = list.concat(found);
	      }
	  }
	  return list;
	},
	
	defend: function(creep){
        var closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
		var home = Game.getObjectById(creep.memory.home);
        if(closestHostile) {
            home.memory.alarm = true;
            if(creep.attack(closestHostile) == ERR_NOT_IN_RANGE){
                creep.moveTo(closestHostile);
                creep.rangedAttack(closestHostile);
            }
        } else {
            home.memory.alarm = false;
            if (creep.ticksToLive > 700 && creep.pos.getRangeTo(home) < 10){
                creep.move(this.randomDirectionNot(creep.pos.getDirectionTo(home))); //directions constants are 1-8
            } else {
                creep.moveTo(home);
            }
        }
        if(creep.ticksToLive < 1100 && !creep.memory.retired && creep.pos.isNearTo(home)) home.renewCreep(creep);      
	},
	
	heal: function(creep){
	    var patient = _.filter(creep.pos.findClosestByRange(FIND_MY_CREEPS), (likely) => likely.hits < likely.hitsMax)[0];
	    if(patient){
	        if(creep.heal(patient) == ERR_NOT_IN_RANGE){
	            creep.moveTo(patient);
	            creep.rangedHeal(patient);
	        }
	        console.log(patient.name);
	    } else {
	        this.explore(creep);
	    }
	},
	
	explore: function(creep){
		//stigmurgic road designer
		//wander from point of interest to point of interest randomly
		while(!creep.memory.myDestination || creep.pos.isNearTo(Game.getObjectById(creep.memory.myDestination))){
			//choose a new destination
			var destinations = creep.room.find(FIND_SOURCES);
			destinations = destinations.concat(creep.room.find(FIND_MY_STRUCTURES));
			if(creep.room.controller != undefined) destinations.push(creep.room.controller);
			creep.memory.myDestination = destinations[Math.floor(Math.random() * destinations.length)].id;
		}
		creep.moveTo(Game.getObjectById(creep.memory.myDestination));
		//en route, drop 'scent trail' of flags to mark where you've been.
		//when the trail is strong enough, build a road in its place.
		var existingFlags = creep.pos.lookFor(LOOK_FLAGS);
        var scented = false;
        for(var f = 0; f < existingFlags.length;f++){
            if(existingFlags[f].color == COLOR_GREY) {
                scented = true;
                var existingFlag = existingFlags[f];
                if(existingFlag.secondaryColor < 8) {
                    existingFlag.setColor(COLOR_GREY,existingFlag.secondaryColor + 1);
                } else {
                    creep.pos.createConstructionSite(STRUCTURE_ROAD);
                    existingFlag.remove(); //I think flags get removed even if road build fails.
                }
            }
        }
        if(!scented){
            var somethingHere = creep.pos.lookFor(LOOK_CONSTRUCTION_SITES).length 
            somethingHere += _.filter(creep.pos.lookFor(LOOK_STRUCTURES), (Structure) => Structure.structureType == STRUCTURE_ROAD).length
            if(!somethingHere) {
                var newFlag = creep.pos.createFlag(undefined,COLOR_GREY,COLOR_RED);
            }        
        }		
	}
};
