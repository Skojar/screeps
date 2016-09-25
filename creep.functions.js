var generalFunctions = require('general.functions');
const GUARD_DISTANCE = 5;

var creepAction = {
    
    run: function(creep) {
        //main() for creeps
        this.always(creep);
    },

    always: function(creep) {
        //things that all creeps do
        this.determineActivity(creep);                                              //determine activity based on role
        if(creep.memory.lvl < creep.room.controller.level) creep.memory.retired = true; //if creep is too old, set it to retired (not convalesce)
        if(creep.ticksToLive <150 && !creep.memory.retired) creep.memory.currently = 'convalescing';         //check if instead I need to be renewed.  If so, over-ride activity
        //do current activity
        this.doActivity(creep);
    },
    
    determineActivity: function(creep) {
        if(creep.memory.currently != 'convalescing'){
            //if(creep.memory.role == 'worker' || creep.memory.role == 'upgrader' || creep.memory.role == 'starter') this.energyDecision(creep);
            if(creep.getActiveBodyparts(WORK) > 0 && creep.getActiveBodyparts(CARRY) > 0) this.energyDecision(creep);
            if(creep.memory.role == 'defender') creep.memory.currently = 'defending';
            if(creep.memory.role == 'scout') creep.memory.currently = 'exploring';
        }
    },
    
    doActivity: function(creep){
        if(Math.random() < .3) creep.say(creep.memory.currently); 
        switch (creep.memory.currently) {
            case 'harvesting': this.harvestEnergy(creep); break;
            case 'upgrading': this.upgrade(creep); break; 
            case 'supplying': this.supplyEnergy(creep); break;
            case 'building': this.buildStructure(creep); break;
            case 'repairing': this.repairStructure(creep); break;
            case 'fortifying': this.fortify(creep); break;
            case 'convalescing': this.convalesce(creep); break;
            case 'defending': this.defend(creep); break;     
            case 'exploring': this.scout(creep); break;
            case 'reloading': this.reloadTower(creep); break;
            default: this.upgrade(creep);
        }
    },
	
	energyDecision: function (creep) {
	    //called if the creep is of a type that harvests and uses energy: 
	    //  worker, upgrader, starter
        //check if I need to switch to harvesting
        if(creep.carryCapacity > 0 && creep.carry.energy == 0) {
            creep.memory.currently = 'harvesting';
            creep.memory.target = this.findSource;
        }
        //check if I need to switch from harvesting
        if((creep.carryCapacity >0 && creep.carry.energy == creep.carryCapacity) || creep.memory.currently != 'harvesting'){
            creep.memory.currently = 'upgrading' // by default, upgrade the controller
            if(creep.memory.role == 'worker' || creep.memory.role == 'starter') { //if a worker, consider doing something else:
                //am i needed to build up walls?            
                if(this.findWallTarget(creep)) creep.memory.currently = 'fortifying';
                //...build new structures?
                if(this.findBuildTarget(creep)) creep.memory.currently = 'building';
                //...repair damaged structures (not walls)?
                if(this.findRepairTarget(creep)) creep.memory.currently = 'repairing';
                //...supply energy generally?
                if(this.surveyRoomEnergy(creep)) creep.memory.currently = 'supplying';
                //...or maybe to any tower that needs it
                if(this.findNeedyTower(creep).length) creep.memory.currently = 'reloading';
                //...most important don't let the controller downgrade!
                if(creep.room.controller.ticksToDowngrade <1000 || creep.room.controller.level == 1) creep.memory.currenlty = 'upgrading';
            }
        }	    
	},
	
	surveyRoomEnergy: function(creep) {
	    //return true if more energy is needed
	    var supplyThreshold = _.filter(Game.creeps, (creep) => creep.memory.currently == 'supplying').length -1;
	    //var energyPercent = creep.room.energyAvailable / creep.room.energyCapacityAvailable;
        return (supplyThreshold < (1-generalFunctions.roomEnergyPercent(creep.room))/0.07 ? true : false);	    
	},
	
    upgrade: function(creep) {
        var target = creep.room.controller;
        if(creep.upgradeController(target) == ERR_NOT_IN_RANGE){
                creep.moveTo(target);
        }
    },
    
	findSource: function(creep) {
	    //find a source to get energy
	    return creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
	},
	
	harvestEnergy: function(creep) {
        var target = this.findSource(creep);
        if(creep.harvest(target) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
        }
    },
	
	findEnergyTarget: function(creep) {
	    //find a place to deposit energy
	    return creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_EXTENSION ||
                                structure.structureType == STRUCTURE_SPAWN ||
                                structure.structureType == STRUCTURE_TOWER) && structure.energy < structure.energyCapacity;
                    }
            });
	},

	supplyEnergy: function(creep) {
	    var target = this.findEnergyTarget(creep);
        if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }
        if(Math.random() < .3) creep.say(generalFunctions.roomEnergyPercentFormatted(creep.room));
	},
	
	findNeedyTower: function(creep) {
	    return creep.room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => (structure.structureType == STRUCTURE_TOWER && structure.energy < structure.energyCapacity * 0.6)});
	},
	
	reloadTower: function(creep) {
	    var target = this.findNeedyTower(creep)[0];
        if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }	    
	},
	
	findBuildTarget: function(creep) {
	    //find something to build
        return creep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES);
	},
	
	buildStructure: function(creep) {
	    var target = this.findBuildTarget(creep);
        if(creep.build(target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }	    
	},
	
	findRepairTarget: function(creep) {
	    //find something to repair
	    return creep.pos.findClosestByRange(FIND_MY_STRUCTURES, { //check for damaged structures
                filter: (structure) => structure.hits < structure.hitsMax * 0.9 
                && structure.structureType != STRUCTURE_WALL 
                //&& structure.structureType != STRUCTURE_RAMPART
            });
	},

    repairStructure: function(creep){
        var target = this.findRepairTarget(creep);
        if(creep.repair(target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }
    },
    
    findWallTarget: function(creep) {
        var wallMinimum = Math.pow(creep.room.controller.level,3) * 10000;
        return creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) => (structure.structureType == STRUCTURE_WALL || structure.structureType == STRUCTURE_RAMPART) 
                && structure.hits < wallMinimum
            });
    },
    
    fortify: function(creep) {
        var target = this.findWallTarget(creep);
        if(creep.repair(target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }
    },
    
    findSpawn: function(creep) {
        return creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                    filter: (structure) => (structure.structureType == STRUCTURE_SPAWN)});
    },
    
    convalesce: function(creep) {
        var target = this.findSpawn(creep);
        //wait your turn
        var triage = 0;
        var otherPatients = creep.room.lookForAtArea(LOOK_CREEPS,target.pos.y-1,target.pos.x-1,target.pos.y+1,target.pos.x+1);
        for(p=0; p<otherPatients.length; p++){
            if(otherPatients[p].memory.currently = 'convalescing' && otherPatients[p].ticksToLive > triage && otherPatients[p].id != creep.id) triage = otherPatients[p].ticksToLive;
        }
        if((triage > creep.ticksToLive || otherPatients.length == 1) && creep.pos.getRangeTo(target) < GUARD_DISTANCE){
                creep.move(generalFunctions.randomDirectionNot(creep.pos.getDirectionTo(target))); //directions constants are 1-8
            } else {
                creep.moveTo(target);            
        }
        //creep.moveTo(target);
        creep.say(creep.ticksToLive);
        creep.transfer(target, RESOURCE_ENERGY);
        target.renewCreep(creep);
        if(creep.ticksToLive >1200) creep.memory.currently = "ready";
    },
    
    defend: function(creep) {
        var closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        var home = this.findSpawn(creep);
        if(closestHostile) {
            this.findSpawn(creep).memory.alarm = true;
            if(creep.attack(closestHostile) == ERR_NOT_IN_RANGE){
                creep.moveTo(closestHostile);
            }
        } else {
            this.findSpawn(creep).memory.alarm = false;
            if (creep.ticksToLive > 700 && creep.pos.getRangeTo(home) < GUARD_DISTANCE){
                creep.move(generalFunctions.randomDirectionNot(creep.pos.getDirectionTo(home))); //directions constants are 1-8
            } else {
                creep.moveTo(home);
            }
        }
        if(creep.ticksToLive < 1100 && !creep.memory.retired){
            home.renewCreep(creep);            
        }
    },
    
    scout: function(creep) {
        //stigmurgic road designer
        //scout will constantly travel from location to location, dropping flags.
        //when there are enough flags on a spot, uild a road.
        //the architect causes flags to decay.
        while(!creep.memory.myDestination || creep.pos.isNearTo(Game.getObjectById(creep.memory.myDestination))) {
            //choose new destination
            var destinations = creep.room.find(FIND_SOURCES);       //add sources
            destinations.concat(creep.room.find(FIND_MY_STRUCTURES)); //add structures
            destinations.push(creep.room.controller);                //add room controller
            creep.memory.myDestination = generalFunctions.randomSelectionFromArray(destinations).id;
        }
        creep.moveTo(Game.getObjectById(creep.memory.myDestination)); 
        
        var existingFlag = creep.pos.lookFor(LOOK_FLAGS)[0];
        if(existingFlag) {
            if(existingFlag.secondaryColor < 8) {
                existingFlag.setColor(COLOR_GREY,existingFlag.secondaryColor + 1);
            } else {
                creep.pos.createConstructionSite(STRUCTURE_ROAD);
                existingFlag.remove(); //I think flags get removed even if road build fails.
            }
        } else {
            var somethingHere = creep.pos.lookFor(LOOK_CONSTRUCTION_SITES).length 
            somethingHere += _.filter(creep.pos.lookFor(LOOK_STRUCTURES), (Structure) => Structure.structureType == STRUCTURE_ROAD).length;
            if(!somethingHere) {
                var newFlag = creep.pos.createFlag(undefined,COLOR_GREY,COLOR_RED);
            }
        }
        
    }

};

module.exports = creepAction;
