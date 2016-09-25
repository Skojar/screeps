var architecture = { //deals with the room:  places structures when available, decays flags, runs towers, etc.

    run: function(room) {
        if((Game.time % 25) == 0){
            this.placeCoreRoads(room);
            this.layoutExtensions(room);
            this.placeTower(room);
        }
        this.decayFlags();
        this.towerControl(room);
        //var circle = this.centerOfGravity(room);
        //circle[0].createFlag(String(circle[1]),COLOR_RED);
    },

    decayFlags: function(){
        if((Game.time % 1000) == 0){
            for(var name in Game.flags) {
                var t = Game.flags[name];
                if(t.secondaryColor == COLOR_RED){
                    t.remove();
                } else {
                    t.setColor(t.color,t.secondaryColor - 1);
                }
            }
        }
        
    },
    
    placeCoreRoads: function(room){
        var list = this.pointsOfInterest(room);
        for(var x = 0; x < list.length; x++){
            var location = list[x].pos;
            for(var h = -1; h<2; h++){
                for(var v = -1; v <2; v++){
                    var attempt = room.getPositionAt(location.x + h, location.y + v);
                    room.createConstructionSite(attempt, STRUCTURE_ROAD);
                }
            }
        }
    },
    
    layoutExtensions: function(room) {
        var sources = room.find(FIND_SOURCES);
        sources.push(this.findSpawn(room));
        var i=0;
        while (this.allowedExtenstions(room)) {
            var placement = sources[i].pos;
            for (e = 0 ; e < 2 ; e++){
                placement = this.randomStepFrom(placement);
            }
            this.tryPlacement(room,placement,STRUCTURE_EXTENSION);
            i++;
            if(i == sources.length) i=0;
        }    
    },

    placeTower: function(room) {
        var a = this.findSpawn(room).pos; 
        var b = room.controller.pos; 
        var c = room.getPositionAt(Math.floor((a.x+b.x)/2),Math.floor((a.y+b.y)/2)); 
        if(this.allowedTowers(room)){
            this.tryPlacement(room,c,STRUCTURE_TOWER);
            /*
            var placed = false; var tries = 0;
            while(!placed && tries < 8){
                if(room.createConstructionSite(c,STRUCTURE_TOWER) == OK){
                    placed = true;
                } else {
                    c = this.randomStepFrom(c);
                    tries++;
                }
            }
            */
        }
    },
    
    tryPlacement: function(room,location,type){
            var placed = false; var tries = 0;
            while(!placed && tries < 10){
                for(var h = -1; h<2; h++){
                    for(var v = -1; v <2; v++){
                        var attempt = room.getPositionAt(location.x + h, location.y + v);
                        if(room.createConstructionSite(attempt, type) == OK) placed = true;
                    }
                }
                location = this.randomStepFrom(location);
                tries++;
            }           
            return placed;
    },
    
    findSpawn: function(room) {
        return room.find(FIND_MY_STRUCTURES, {
                    filter: (structure) => (structure.structureType == STRUCTURE_SPAWN)})[0];
    },
    
    stepTowardSpawn: function(pos) {
        var target = pos.findClosestByRange(FIND_MY_SPAWNS);
        if(target.pos.x < pos.x) pos.x--;
        if(target.pos.x > pos.x) pos.x++;
        if(target.pos.y < pos.y) pos.y--;
        if(target.pos.y > pos.y) pos.y++;
        return pos;
    },
    
    stepTowardCenter: function(pos) {
        if(pos.x > 25) pos.x--;
        if(pos.x < 25) pos.x++;
        if(pos.y > 25) pos.y--;
        if(pos.y < 25) pos.y++;
        return pos;        
    },
    
    allowedExtenstions: function(room) {
        var allowedByLevel = [0,0,5,10,20,30,40,50,60];
        var allowed = allowedByLevel[room.controller.level];
        allowed -= _.filter(room.find(FIND_MY_STRUCTURES), (structure) => structure.structureType == STRUCTURE_EXTENSION).length;
        allowed -= _.filter(room.find(FIND_MY_CONSTRUCTION_SITES), (ConstructionSite) => ConstructionSite.structureType == STRUCTURE_EXTENSION).length;
        return allowed;
    },
    
    allowedTowers: function(room) {
        var allowedByLevel = [0,0,0,1,1,2,2,3,6];
        var allowed = allowedByLevel[room.controller.level];
        allowed -= _.filter(room.find(FIND_MY_STRUCTURES), (structure) => structure.structureType == STRUCTURE_TOWER).length;
        allowed -= _.filter(room.find(FIND_MY_CONSTRUCTION_SITES), (ConstructionSite) => ConstructionSite.structureType == STRUCTURE_TOWER).length;
        return allowed;        
    },
    
    randomStepFrom: function(pos){
        if(Game.time % 3){
            pos = this.stepTowardSpawn(pos);
        } else if(Game.Time % 2){
            pos = this.stepTowardCenter(pos);
        } else {
            var sign = (Game.time % 2 ? 1 : -1); //coinflip plus or minus
            if(Math.random <.5){                //coinflip x or y
                pos.x = pos.x + sign;
            } else {
                pos.y = pos.y + sign;
            }
        }
        return pos;
    },
    
    towerControl: function(room){
        var t = _.filter(room.find(FIND_MY_STRUCTURES), (structure) => structure.structureType == STRUCTURE_TOWER);
        for(i=0; i < t.length; i++){
            var tower = t[i];
            var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) => (structure.hits < structure.hitsMax && structure.structureType != STRUCTURE_WALL)
            });
            if(closestDamagedStructure && Math.random() < t[i].energy/t[i].energyCapacity && Game.time % 2 == 0) {
                tower.repair(closestDamagedStructure);
            }

            var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if(closestHostile) {
                tower.attack(closestHostile);
            }
        } 
    },
    
    centerOfGravity: function(room){
        //determine the geographic center of the main structures in the room.
        var centerx = 0; var centery = 0;
        var minx = 55; var maxx = -5;
        var miny = 55; var maxy = -5;
        var list = this.pointsOfInterest(room);
        for(i = 0; i < list.length; i++){
            centerx += list[i].pos.x;
            centery += list[i].pos.y;
            minx = Math.min(minx, list[i].pos.x);
            miny = Math.min(miny, list[i].pos.y);
            maxx = Math.max(maxx, list[i].pos.x);
            maxy = Math.max(maxy, list[i].pos.y);
            
        }
        center = room.getPositionAt(Math.floor(centerx / list.length), Math.floor(centery/list.length));
        radius = 0;
        for(i = 0; i <list.length; i++){
            rg = list[i].pos.getRangeTo(center);
            if(rg > radius) radius = rg;
        }
        radius += 2
        return [center, radius];
        
    },
    
    pointsOfInterest: function(room) {
        var list = room.find(FIND_MY_STRUCTURES, {
                    filter: (structure) => (structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_TOWER)});
        var ctrl = room.find(FIND_STRUCTURES, {
                    filter: (structure) => (structure.structureType == STRUCTURE_CONTROLLER)});
            for(c = 0; c < ctrl.length; c++) list.push(ctrl[c]);
        var srcs = room.find(FIND_SOURCES);
            for(c = 0; c < srcs.length; c++) list.push(srcs[c]);
        var mnrl = room.find(FIND_MINERALS); 
            for(c = 0; c < mnrl.length; c++) list.push(mnrl[c]);        
        return list;
    }
};

module.exports = architecture;
