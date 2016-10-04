/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('managepopulation');
 * mod.thing == 'a thing'; // true
 */

module.exports = {

	run: function(spawn){
		//this is where the spawn maintains it's population of creeps
		//check each role and if more are needed, try to spawn them.
		//record census data in spawn.memory[roleName] = count/goal
		var roles = ['worker','warrior','priest'];
		for(var m = 0; m < roles.length; m++){
			//for each role, get the current model
			var model = this.modelCatalog(spawn,roles[m]);
			//check if there are enough.  if not, try to spawn
			var count = _.filter(Game.creeps, (creep) => creep.memory.role == roles[m] && creep.memory.home == spawn.id).length;
			if(count < model.minimum && spawn.canCreateCreep(model.parts) == OK) {
				var newName = spawn.createCreep(model.parts, undefined, {role: roles[m], lvl: model.lvl, home: spawn.id, busy: false});
				console.log('Spawning ' + roles[m],newName);
				count++;
			}
			spawn.memory[roles[m]] = count/model.minimum;
			if(spawn.memory[roles[m]] != 1) console.log(roles[m] + "s = ",count + "/" + model.minimum + "\n");			
		}
		if(spawn.memory['worker'] < .2){
		    var best = Math.floor(spawn.room.energyAvailable / 250);
		    var model = this.buildTemplate(3,[best *2,best,best,0,0,0,0,0],spawn.room.controller.level-1);
		    spawn.createCreep(model.parts, undefined, {role: 'worker', lvl: model.lvl, home: spawn.id, busy: false});
		}
	},
	
	buildTemplate: function (min, parts, lvl) {
	    var newTemplate = {};
	    newTemplate.minimum = min;
	    newTemplate.parts = this.translatePartArray(parts);
	    newTemplate.lvl = lvl;
	    return newTemplate;
	},
	
	translatePartArray: function (q) {
	    var p = [];
	    for (var m = 0;m < q[0];m++) p.push(MOVE);
	    for (var w = 0;w < q[1];w++) p.push(WORK);
	    for (var c = 0;c < q[2];c++) p.push(CARRY);
	    for (var a = 0;a < q[3];a++) p.push(ATTACK);
	    for (var r = 0;r < q[4];r++) p.push(RANGED_ATTACK);
	    for (var h = 0;h < q[5];h++) p.push(HEAL);
	    for (var l = 0;l < q[6];l++) p.push(CLAIM);
	    for (var t = 0;t < q[7];t++) p.push(TOUGH);
	    return p;
	},

	modelCatalog: function(spawn, role){
	    var lvl = spawn.room.controller.level;
	    switch (role){
	        case 'warrior':
	            switch(lvl){
	                case 1:
	                    return this.buildTemplate(0,[1,0,0,1,0,0,0,0],1);
	                    break;
	                case 2:
	                    return this.buildTemplate((spawn.room.controller.safeMode > 3500 ? 0 : 1),[5,0,0,1,1,0,0,3],2);
	                    break;
	                case 3:
	                    return this.buildTemplate((spawn.room.controller.safeMode > 3500 ? 0 : 3),[7,0,0,3,1,0,0,3],3);
	                    break;	                    
	                case 4:
	                    return this.buildTemplate((spawn.room.controller.safeMode > 3500 ? 0 : 5),[11,0,0,5,2,0,0,4],4);
	                    break;	                    	                    
	                case 5:
	                    return this.buildTemplate((spawn.room.controller.safeMode > 3500 ? 0 : 8),[14,0,0,7,3,0,0,4],5);
	                    break;	    
	                case 6:
	                    return this.buildTemplate((spawn.room.controller.safeMode > 3500 ? 0 : 10),[18,0,0,9,4,0,0,5],6);
	                    break;	                    	                    
	                case 7:
	                    return this.buildTemplate((spawn.room.controller.safeMode > 3500 ? 0 : 15),[22,0,0,11,5,0,0,6],7);
	                    break;	                    	                    
	                case 8:
	                    return this.buildTemplate((spawn.room.controller.safeMode > 3500 ? 0 : 20),[25,0,0,13,6,0,0,6],8);
	                    break;	                    	                    
	            }
	            break;
	        case 'worker':
	            switch(lvl){ //worker numbers should depend on the number of spawns.
	               case 1:
	                    return this.buildTemplate(5,[1,1,1,0,0,0,0,0],1);
	                    break;
	               case 2:
	                   return this.buildTemplate(10 ,[4,2,2,0,0,0,0,0],2);
	                   break;
	               case 3:
	                   return this.buildTemplate(16,[6,3,3,0,0,0,0,0],3);
	                   break;
	               case 4:
	                   return this.buildTemplate(12 + Math.ceil(spawn.memory.energyCycles/2),[9,4,5,0,0,0,0,0],4);
	                   break;
	               case 5:
	                   return this.buildTemplate(8 + Math.ceil(spawn.memory.energyCycles/3),[15,6,9,0,0,0,0,0],5);
	                   break;
	               case 6:
	                   return this.buildtemplate(6,[18,9,9,0,0,0,0,0],6);
	                   break;
	               case 7:
	                   return this.buildTemplate(5,[22,12,10,0,0,0,0,0],7);
	                   break;
	               case 8:
	                   return this.buildTemplate(3,[25,15,10,0,0,0,0,0],8);
	                   break;
	            }
	            break;
	       case 'priest':
	           return this.buildTemplate(Math.ceil((lvl-1)/2),[5,0,0,0,0,1,0,0],8);
	           break;
	       default:
	            return this.buildTemplate(0,[1,0,0,0,0,0,0,0],0);
	    }
	}

};
