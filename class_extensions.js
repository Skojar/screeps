 // this module contains prototype extensions for the various objects.

Creep.prototype.announce = function(action, target){
    //console.log(this,action,target);
}

global.convertTicksToTime = function(t){
    //guesses how much RL time a given no of ticks will take
    var units = " s";
    t *= TICKS_PER_SECOND;
    if(t > 90){ units = " m"; t = t / 60; }
    if(t > 90){ units = " h"; t = t / 60; }
    if(t > 60){ units = " d"; t = t / 24; }
    return t.toFixed(1) + units;
}

global.calculateAverage = function(collection,count){
    var total = 0;
    for(var e = 0; e < count; e++) total += collection[e];
    return total / count;
}

global.findClosestFromList = function(origin, list){
    //returns the index for the member of list that is closest to origin.pos
    var nearest = 71;
    var candidate = 0;
    if(origin){
        for(i = 0; i < list.length; i++){
            var dist = origin.pos.getRangeTo(list[i]);
            if(dist < nearest) {
                candidate = i;
                nearest = dist;
            }
        }
    }
    return candidate;
}

//spawn
StructureSpawn.prototype.record = function(category){
    var timestamp = Game.time % 100;
    if(!this.memory.control) this.memory.control = {};
    if(!this.memory.exploit) this.memory.exploit = {};	    
    switch(category){
        case 'control':
            this.memory.control[timestamp] = this.room.controller.progress;
            break;
        case 'exploit':
            var sources = this.room.find(FIND_SOURCES);
            this.memory.exploit[timestamp] = 0;	    
            for(s = 0; s < sources.length; s++) this.memory.exploit[timestamp] += sources[s].energy/sources[s].energyCapacity;
            this.memory.exploit[timestamp] = this.memory.exploit[timestamp]/sources.length; //averaged among sources.  This is okay because capacity will be the same for all sources in the same room.            
	        break;
	    case 'fullness':
	        this.memory.fullness = this.room.energyAvailable/this.room.energyCapacityAvailable;
	        break;
	    case 'patients':
	        this.memory.patients = _.filter(this.room.find(FIND_MY_CREEPS), (creep) => creep.memory.task == 'convalesce');
	        break;
	    default:
	        console.log('no instructions for recording',category);
    }
}

StructureSpawn.prototype.report = function(statistic){
    switch(statistic){
        case 'toUpgrade':  //returns information on control generated per tick and estimated time to upgrade
            var thistick = Game.time % 100; //the last 100 ticks are kept in spawn.memory, there's a value for spawn.memory.control[thisttick];
	        var nexttick = thistick + 1; if (nexttick == 100) nexttick = 0; // nexttick contains the oldest information
	        var rate = (this.memory.control[thistick] - this.memory.control[nexttick]) / 100; //aveerage control per tick 
	        var toGo = this.room.controller.progressTotal - this.room.controller.progress;  //amount of control to go until upgrade
	        return " cpt = " + rate.toFixed(1) + " (" + (rate > 0 ? convertTicksToTime(toGo/rate) : "---") + ")";
	        break;
	    default:
	        console.log('no instructions for reporting',statistic);
    }
}

//tower
StructureTower.prototype.defend_room = function(){
    //attempts to find a target that needs shooting, and shoots if found.
    var hostiles = this.room.find(FIND_HOSTILE_CREEPS);
	var healers = [];
	var closestHostile = false;
    if(hostiles.length > 0){
	    for(var h=0;h < hostiles.length; h++){
		    if(hostiles[h].getActiveBodyparts(HEAL) > 0) healers.push(hostiles[h]);
		}
		if(healers.length > 0) hostiles = healers; //if there are any hostiles that can heal, attack them in preference to any others.
		closestHostile = hostiles[findClosestFromList(this,hostiles)];
	} else {
	    closestHostile = false;
	}

	if(closestHostile) {
		this.attack(closestHostile);
	}    
}

StructureTower.prototype.heal_room = function(){
    var needy = _.filter(this.room.find(FIND_MY_CREEPS), (creep) => creep.hits < creep.hitsMax).sort(function(a,b){return (b.hitsMax - b.hits) - (a.hitsMax - a.hits)});
    if(needy.length > 0) this.heal(needy[0]);
}


StructureTower.prototype.repair_room = function(repairdelay){
    //repair every once in a while.  repairdelay is how many ticks it should wait until it looks for a repair target.  this is to keep it from constantly running dry, which would make it hard to max out room energy.
    if(Game.time % repairdelay == 0){   //don't bother to do these calculations if it's not.
        var closestDamagedStructure = this.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => (structure.hits < structure.hitsMax && structure.structureType != STRUCTURE_WALL) //don't repair walls with towers.
        });
        if(closestDamagedStructure && Math.random() < this.energy/this.energyCapacity) {
            if(closestDamagedStructure.structureType != STRUCTURE_ROAD || 
                    _.filter(closestDamagedStructure.pos.lookFor(LOOK_FLAGS), //if it's a road, it needs to have evidence of being used, or don't bother to repair it.
                        (Flag) => Flag.color == COLOR_WHITE && Flag.secondaryColor >= FLAG_REPAIR_THRESHOLD).length > 0){
                this.repair(closestDamagedStructure);
            }
        }
    }
}

Room.prototype.polarRadius = function(a,b){ //both as RoomPostion objects!
    //returns the mathematical distance between two points  
    var x = a.x - b.x;
    var y = a.y - b.y;
    return Math.sqrt(Math.pow(x,2) + Math.pow(y,2));
}

Room.prototype.polarAngle = function(point,origin){ //both as RoomPostion objects!
    //returns the angle component of polar coordinate if b is the origin and a is the point.
    var x = point.x - origin.x;
    var y = point.y - origin.y;        
    return Math.atan(y/x);
}

module.exports = {


};
