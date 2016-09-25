/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('general.functions');
 * mod.thing == 'a thing'; // true
 */

module.exports = {

    roomEnergyPercent: function(room) {
	    return room.energyAvailable / room.energyCapacityAvailable;        
    },
    
    roomEnergyPercentFormatted: function(room) {
        return ((this.roomEnergyPercent(room) * 100).toFixed(1)+"%");
    },
    
    countCreepsByRole: function(roleName) {
        return _.filter(Game.creeps, (creep) => creep.memory.role == roleName).length;
    },
    
    randomSelectionFromArray: function(myList) {
        return myList[Math.floor(Math.random() * myList.length)];
    },
    
    randomDirectionNot: function(excluded) {
        var d = excluded;
        while(d == excluded){
            d = Math.ceil(Math.random() * 8);
        }
        return d;
    },
    
    countSources: function(room) {
        return room.find(FIND_SOURCES).length
    }
};
