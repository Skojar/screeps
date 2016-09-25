var generalFunctions = require('general.functions');

var spawnAction = {
    
	run: function(spawn) {
	    //standard spawn behaviors done every tick
	    this.populationMinimums(spawn);
	    //console.log(generalFunctions.countCreepsByRole('starter'),'starters');
	},
	
	checkInvasion: function(spawn){
	    if(spawn.memory.alarm && generalFunctions.countCreepsByRole('defenders') == 0 && spawn.room.controller.safeModeAvailable){
	        spawn.room.controller.activateSafeMode();
	        spawn.memory.alarm = false;
	    }
	},
	
	populationMinimums: function(spawn) {
	    //maintain minimum numbers of specialist creeps
	    var roles = ['upgrader','defender','worker','scout','medic'];

        var report = "report = \n";
	    for (var i=0; i < roles.length; i++){
	        var model = this.modelCatalog(spawn,roles[i]);
            report += this.checkAndSpawn(spawn, roles[i], model); //this.checkAndSpawn(spawn, roles[i], models[roles[i]]);
        }
        
        if((Game.time % 50) == 0) console.log(report); //periodically report on population
	},    
	
	checkAndSpawn: function(spawn, roleName, model) { 
	    var currentCount = generalFunctions.countCreepsByRole(roleName);
	    if (currentCount < model.minimum && spawn.canCreateCreep(model.parts) == OK) {
            var newName = spawn.createCreep(model.parts, undefined, {role: roleName, lvl: model.lvl});
            console.log('Spawning ' + roleName, newName );
            currentCount++;
        }	    
        return String(roleName +'s: ' + String(currentCount) + '/' + String(model.minimum) + "\n");
	},

	buildTemplate: function (min, parts, lvl) {
	    var newTemplate = {};
	    newTemplate.minimum = min;
	    newTemplate.parts = this.translatePartArray(parts);
	    //newTemplate.parts = parts;
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
	    var sources = generalFunctions.countSources(spawn.room);
	    switch (role){
	        case 'upgrader':
	            switch(lvl){
	               case 0:
	  	                return this.buildTemplate(1,[1,1,1,0,0,0,0,0],1);                 
	               case 1:
	                    return this.buildTemplate(1,[1,2,1,0,0,0,0,0],1);
	                    break;
	               case 2:
	                   return this.buildTemplate(lvl-1,[3,2,1,0,0,0,0,0],2);
	                   break;
	               case 3:
	                   return this.buildTemplate(lvl-1,[5,3,2,0,0,0,0,0],3);
	                   break;
	               case 4:
	                   return this.buildTemplate(lvl-1,[10,4,6,0,0,0,0,0],4);
	                   break;
	               case 5:
	                   return this.buildTemplate(lvl-1,[14,6,8,0,0,0,0,0],5);
	                   break;
	               case 6:
	                   return this.buildtemplate(lvl-1,[17,9,8,0,0,0,0,0],6);
	                   break;
	               case 7:
	                   return this.buildTemplate(lvl-1,[21,12,9,0,0,0,0,0],7);
	                   break;
	               case 8:
	                   return this.buildTemplate(lvl-1,[24,15,9,0,0,0,0,0],8);
	                   break;
	            }
	            break;
	        case 'defender':
	            return this.buildTemplate((spawn.room.controller.safeMode > 3500 ? 0 : 5),[5,0,0,3,0,0,0,6],8);
	            break;
	        case 'worker':
	            switch(lvl){ //worker numbers should depend on the number of spawns.
	               case 1:
	                    return this.buildTemplate(5,[1,2,1,0,0,0,0,0],1);
	                    break;
	               case 2:
	                   return this.buildTemplate(sources * 7 ,[4,2,2,0,0,0,0,0],2);
	                   break;
	               case 3:
	                   return this.buildTemplate(sources * 11,[6,3,3,0,0,0,0,0],3);
	                   break;
	               case 4:
	                   return this.buildTemplate(sources * 10,[11,4,7,0,0,0,0,0],4);
	                   break;
	               case 5:
	                   return this.buildTemplate(sources * 8,[15,6,9,0,0,0,0,0],5);
	                   break;
	               case 6:
	                   return this.buildtemplate(sources * 5,[18,9,9,0,0,0,0,0],6);
	                   break;
	               case 7:
	                   return this.buildTemplate(sources * 4,[22,12,10,0,0,0,0,0],7);
	                   break;
	               case 8:
	                   return this.buildTemplate(sources * 3,[25,15,10,0,0,0,0,0],8);
	                   break;
	            }
	            break;
	       case 'scout':
               return this.buildTemplate(lvl-1,[5,0,0,0,0,0,0,0],8); //no need to see upgraded scouts until I give them something more to do.
	           break;
	       case 'medic':
	           return this.buildTemplate(0,[7,0,0,0,1,1,0,5],8); //same with medics.  They're not even scripted yet/
	           break;
	    }
	}
	
};

module.exports = spawnAction;
