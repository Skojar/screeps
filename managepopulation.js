/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('managepopulation');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    //add light fighters (raiders?)
    //add light workers (minions?)
    //add scounts

	run: function(spawn){
		//this is where the spawn maintains it's population of creeps
		//check each role and if more are needed, try to spawn them.
		//record census data in spawn.memory[roleName] = count/goal
		var roles = ['worker','priest','warrior','vanguard','raider','minion'];
		var spawnInitiated = false;
		spawn.memory.population = 0;
		for(var m = 0; m < roles.length; m++){
			//for each role, get the current model
			var model = this.modelCatalog(spawn,roles[m]);
			//check if there are enough.  if not, try to spawn
			var count = _.filter(Game.creeps, (creep) => creep.memory.role == roles[m] && creep.memory.home == spawn.id).length;
			spawn.memory.population += count;
			if(count < model.minimum && spawn.canCreateCreep(model.parts) == OK && spawnInitiated == false) {
				var newName = spawn.createCreep(model.parts, undefined, {role: roles[m], lvl: model.lvl, home: spawn.id, busy: false});
				console.log("__" + spawn.name + " spawning " + roles[m],newName);
				spawnInitiated = true;
				count++;
			}
			spawn.memory[roles[m]] = count/model.minimum || 1;
			if(spawn.memory[roles[m]] != 1 && Game.time % 25 == 0) console.log("\t" + roles[m] + "s = ",count + "/" + model.minimum + "\n");			
		}
		if(spawn.memory['worker'] < .25){
		    var best = Math.floor(spawn.room.energyAvailable / 250);
		    var model = this.buildTemplate(3,[best *2,best,best,0,0,0,0,0],spawn.room.controller.level-1);
		    spawn.createCreep(model.parts, undefined, {role: 'worker', lvl: model.lvl, home: spawn.id, busy: false});
		}
		if(spawn.memory['warrior'] == 0 && home.memory.alarm){
		    spawn.room.controller.activateSafeMode();
		    home.memory.alarm = false;
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
	    var cap = spawn.room.energyCapacityAvailable - (lvl - 1) * 50;
	    switch (role){
	        case 'warrior':
	            var surp = spawn.memory.energyCycles;
	            var qty = ((spawn.room.controller.safeMode > 3500 || spawn.memory['worker'] < 0.5) ? 0 : Math.max((lvl - 2) , 1));
	            var bow = Math.floor(cap / 700);
	            cap -= bow * 200;
	            var arm = Math.floor(cap / 300);
	            cap -= arm * 300;
	            var leg = Math.max(Math.floor(cap / 50) - 1, 0);
	            return this.buildTemplate(qty,[bow + arm * 3 + leg,0,0,arm,bow,0,0,arm * 2],lvl);	            
	            break;
	        case 'raider':
	            var surp = spawn.memory.energyCycles;
	            var qty = ((spawn.room.controller.safeMode > 1000 || spawn.memory['worker'] < 0.5) ? 0 : Math.floor(surp / 2));
	            if(spawn.memory.alarm) qty += 5;
	            if(spawn.room.controller.safeModeCooldown) qty += 1;
	            var limb = Math.floor((cap - 200) / 260);
	            return this.buildTemplate(qty,[limb + 1, 0,0,limb,1,0,0,0],lvl - 1);
	            break;
	        case 'worker':
	            var sources = spawn.room.find(FIND_SOURCES).length;
	            var surp = spawn.memory.energyCycles;
	            var qty = (spawn.room.storage != undefined ? Math.ceil(8 - lvl + sources) : Math.ceil(Math.pow(lvl + 1, 2) * sources / 2));
	            if(spawn.memory['worker'] < 0.5) qty++;
	            var arm = Math.floor(cap / 250);
	            cap -= arm * 250;
	            var gut = Math.floor(cap / 100);
	            cap -= gut * 100;
	            var leg = Math.max(Math.floor(cap / 50) - 1, 0);
	            return this.buildTemplate(qty,[leg + arm * 2 + gut, arm, arm + gut,0,0,0,0,0],lvl);
	            break;
	       case 'minion':
	           var surp = spawn.memory.energyCycles;
	           var qty = (spawn.memory.alarm ? 0 : Math.floor(surp));
	            if(spawn.memory['worker'] < 0.5) qty++;	           
	           var limb = Math.floor((cap - 100) / 400);
	           return this.buildTemplate(surp,[limb + 1,limb,1,0,0,0,0,0],lvl - 1);
	       case 'priest':
	           var qty = Math.ceil((lvl-1)/2)
	           var two = Math.floor(lvl/2);
	           var three = Math.floor(lvl/3);
	           var four = Math.floor(lvl/4);
	           var five = Math.floor(lvl/5);
	           var seven = Math.floor(lvl/7);
	           var hands = three + five + seven;
	           var bows = five + four + seven;
	           var legs = 5 + two + two + hands + bows;
	           return this.buildTemplate(qty,[legs,two,two,0,bows,hands,0,0],lvl); 
	           break;
	       case 'vanguard':
	           var qty = (Game.gcl.level - Memory.spawncount) * 2;
	           var claim = 0; //claim should be = 1 in the production model.  it's set to 0 for testing.
	           var e = Math.floor((spawn.room.energyCapacityAvailable - 650 * claim) / 260);
	           return this.buildTemplate(qty,[e + 2,e,e,1,0,0,claim,0],lvl); 
	           break;
	       default:
	            return this.buildTemplate(0,[1,0,0,0,0,0,0,0],0);
	    }
	}

};
