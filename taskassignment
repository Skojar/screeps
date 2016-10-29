/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('roomarchitecture');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    //handles geography related stuff, like placing sructures
    //call run(spawn) for each spawn
    
    run: function(spawn){
        //storage
        if(this.allowed(spawn,STRUCTURE_STORAGE)){
            this.place(STRUCTURE_STORAGE,this.centerOfEnergy(spawn));
        }
            
         
        //towers
        if(this.allowed(spawn,STRUCTURE_TOWER)){
            switch(this.tally(spawn,STRUCTURE_TOWER)){
                case 0: //first tower goes between the spawn and the controller
                    this.place(STRUCTURE_TOWER,this.centerOfControl(spawn));
                    break;
                case 1: //second tower goes between the furthest point of interest and the center of all the other points.
                    this.place(STRUCTURE_TOWER,this.antifulcrum(spawn));
                    break;
                case 2: //third tower
                    var tarpos = this.thirdleg(this.centerOfControl(spawn),this.antifulcrum(spawn),this.centerOfInterest(spawn));
                    this.place(STRUCTURE_TOWER,tarpos);
                    break;
                case 3: //fourth tower between first and second
                    var tarpos = this.centerBetween(spawn.room,this.centerOfControl(spawn),this.antifulcrum(spawn));
                    this.place(STRUCTURE_TOWER,tarpos);
                    break;
                case 4: //fifth between second and third
                    var tarpos = this.thirdleg(this.centerOfControl(spawn),this.antifulcrum(spawn),this.centerOfInterest(spawn));
                    tarpos = this.centerBetween(spawn.room,tarpos,this.antifulcrum(spawn));
                    this.place(STRUCTURE_TOWER,tarpos);
                    break;
                case 5: //last between first and third
                    var tarpos = this.thirdleg(this.centerOfControl(spawn),this.antifulcrum(spawn),this.centerOfInterest(spawn));
                    tarpos = this.centerBetween(spawn.room,tarpos,this.centerOfControl(spawn));
                    this.place(STRUCTURE_TOWER,tarpos);
                    break;                        
                }
            }

        //extensions
        var newextensions = this.allowed(spawn,STRUCTURE_EXTENSION);
        var list = [spawn];
        list = list.concat(spawn.room.find(FIND_SOURCES)); //try to distribute extensions evenly to each source
        if(newextensions > 0){
            var which = this.tally(spawn,STRUCTURE_EXTENSION) % list.length; //this is which source to put it near
            this.place(STRUCTURE_EXTENSION,list[which].pos,3,2);
        }
    },
    
    /* Things that still need to be placed:
        walls
        ramparts
        
    */
    mapRoom: function(spawn){
        //if I get this green flag thing figured out, they can be used by place() below to designate the acceptable area in which extensions can be placed.
        var max_length = 6;                                              //desired radius of bubbles around structures
        if(!spawn.memory.mapfocus || spawn.memory.mapfocus >= 1937) spawn.memory.mapfocus = 0;
        // the entire room is scanned in 1936 ticks; use this to 'map' the room
        var y = Math.floor(spawn.memory.mapfocus / 44) + 3;                                //cycle through entire room, one space per tick
        var x = (spawn.memory.mapfocus % 44) + 3;
        var f = spawn.room.getPositionAt(x,y);                          //position being checked 
        var n = f.findClosestByRange(FIND_MY_STRUCTURES).pos;           //position of nearest owned structure
        //I almost wonder if it wouldn't be better to replace this search with a run throgh all the structures.  Maybe the points of interest array.
        //have to test to see what the CPU cost of that is.
        //      -- use findInRange for the relevant subset!
        var dx = n.x - f.x;                                             //delta x
        var dy = n.y - f.y;                                             //delta y
        var r = Math.floor(Math.sqrt(Math.pow(dx,2) + Math.pow(dy,2))); //distance between n and f
        var l = Math.max(Math.abs(dx),Math.abs(dy));                                        //number of steps 
        var e = _.filter(f.lookFor(LOOK_FLAGS), (existing) => existing.color == COLOR_GREEN);
        for (i = 0; i < e.length; i++) e[i].remove();                             //clear any existing green flag(s)
        if(r < max_length){                                             //check if it's even inside the desired radius, if not don't bother.
            shadow = false;
            if(_.filter(f.lookFor(LOOK_TERRAIN), (t) => t == 'wall').length > 0) shadow = true;
            for(s = 0; s < l; s++){
                hx = f.x + Math.floor(s * dx / l);
                hy = f.y + Math.floor(s * dy / l);
                h = spawn.room.getPositionAt(hx,hy);                        //check to see if there's a wall there.
                if(_.filter(h.lookFor(LOOK_TERRAIN), (t) => t == 'wall').length > 0) shadow = true;
            }
            if(shadow == false) f.createFlag(undefined,COLOR_GREEN, COLOR_WHITE);
        }
        spawn.memory.mapfocus++;
        /*
        // to build walls, maybe start from exits and move straight into room until a flag is encountered?
                                                                                        --Note: This will not work see 32,20
            for ramparts, maybe find exit midpoints, then use directionTo to move toward nearest tower        
            OR OR OR determine contiguous groups of walls and put ramparts in the midpoints!
        */        
    },

    pointsOfInterest: function(spawn){
        //returns an array of important structures and features of a room
        var list = spawn.room.find(FIND_MY_STRUCTURES);
        list = list.concat(spawn.room.find(FIND_SOURCES));
        list = list.concat(spawn.room.find(FIND_MINERALS));
        return list;
    },
    
    centerOf: function(list, where){
        //returns the central point of an array of RoomPostions.  where is a room containing all the points in list
        var x = 0; var y = 0;
        for(var p = 0; p < list.length; p++){
            x += list[p].pos.x;
            y += list[p].pos.y;
        }
        x = Math.floor(x/list.length);
        y = Math.floor(y/list.length);
        return where.getPositionAt(x,y);
    },
    
    centerOfInterest: function(spawn){
        var list = this.pointsOfInterest(spawn);
        return this.centerOf(list,spawn.room);
    },
    
    radiusOfInterest: function(spawn){
        //returns radius of a circle centered on centerofinterest and including all points of interest
        var list = this.pointsOfInterest(spawn);
        var center = this.centerOfInterest(spawn);
        var radius = 0;
        for(var p = 0; p <list.length; p++){
            radius = Math.max(list[p].pos.getRangeTo(center),radius);
        }
        return Math.ceil(radius - 1);
    },
    
    centerOfControl: function(spawn){
        //returns the central point between the spawn and the room controller
        //good place for first tower
        return this.centerBetween(spawn.room,spawn.pos,spawn.room.controller.pos);
    },
    
    centerBetween: function(r,a,b){
        //return central RoomPostion between two given RoomPostions
        //var r = Game.rooms[a.roomName];
        var x = Math.floor((a.x + b.x)/2);
        var y = Math.floor((a.y + b.y)/2);
        console.log(r,x,y,a,b);
        return r.getPositionAt(x,y);        
        
    },
    
    centerOfEnergy: function(spawn){
        //returns central point of energy sources
        //good place for storage
        var list = spawn.room.find(FIND_SOURCES);
        return this.centerOf(list,spawn.room);
        
    },
    
    furthestFrom: function(list, center){
        //returns the point of interest furthest from the a given pos
        var c = 0;
        var f = 0;
        for(i = 0; i < list.length; i++){
            var r= center.getRangeTo(list[c]);
            if(r > f){
                f = r;
                c = i;
            }
        }
        return c;
    },
    
    weightedCenter: function(spawn){
        //returns the center of points of interest excluding the furthest point(s)
        var list = this.pointsOfInterest(spawn);
        var center = this.centerOf(list,spawn.room);
        list.splice(this.furthestFrom(list,center),1); //remove the point furthest from the center
        return this.centerOf(list,spawn.room); //return the center of the new list
    },
    
    antifulcrum: function(spawn){
        //returns midpoint between weightedCenter and furthest point(s)
        //good place for second tower
        var list = this.pointsOfInterest(spawn);
        var center = this.centerOf(list,spawn.room);
        var outlier = list[this.furthestFrom(list,center)]; //outlier is an object outlier.pos is the position
        center = this.weightedCenter(spawn); //center is a RoomPostion object
        center = this.centerBetween(spawn.room,center,outlier.pos); // a little closer to outlier
        return this.centerBetween(spawn.room,center,outlier.pos); // closer still
    },
    
    allowed: function(spawn,type){
        //return how many more of a given structure can be built, based on the controller
        var allowed = this.allowedByLevel(type)[spawn.room.controller.level];
        allowed -= this.tally(spawn,type);
        return allowed;
    },
    
    tally: function(spawn,type){
        //returns how many of a given structure already exist
        var tally = _.filter(spawn.room.find(FIND_MY_STRUCTURES), (structure) => structure.structureType == type).length;
        tally += _.filter(spawn.room.find(FIND_MY_CONSTRUCTION_SITES), (structure) => structure.structureType == type).length;
        return tally;
        
    },
    
    allowedByLevel: function(type){
        //an array showing how many are of a given structure are allowed by the game based on the controller level
        switch (type){
            case STRUCTURE_EXTENSION:
                return [0,0,5,10,20,30,40,50,60];
                break;
            case STRUCTURE_TOWER:
                return [0,0,0,1,1,2,2,3,6];
                break;
            case STRUCTURE_STORAGE:
                return [0,0,0,0,1,1,1,1,1];
                break;
            default:
                return [0,0,0,0,0,0,0,0,0];
        }        
    },
    
    place: function(what,where,dist,step){
        //tries to place a construction type of structure type 'what' at room position 'where'
        //if it can't moves in a spiral around 'where' until it can, 
        //but only if it fits certain criteria
        var xstring = (100 + where.x).toString();
        var ystring = (100 + where.y).toString();
        var wherename = where.roomName + xstring.slice(-2) + ystring.slice(-2);
        
        //Memory[wherename] keeps track of where we were in the spiral around this particular where last time
        
        if(Memory[wherename] == undefined){
            var x = 0;
            var y = 0;
            var d = 1;
            var m = 1;
        } else {
            var x = Memory[wherename + 'x'];
            var y = Memory[wherename + 'y'];
            var d = Memory[wherename + 'd'];
            var m = Memory[wherename + 'm'];            
        }
        var r = Game.rooms[where.roomName];
        var placed = false;
        var tries = 0;
        if(step == undefined) step = 1;
        if(dist == undefined) dist = 0;
        while(placed == false && tries < Game.cpu.tickLimit){ // tries is just a saftey valve.  Game.cpu.tickLimit is an arbitrary choice.
            while((2 * x * d) < m & placed == false){
                if(this.placable(r,where.x + x,where.y + y) && tries % step == 0 && Math.sqrt(Math.pow(x,2)+Math.pow(y,2)) >= dist){
                    if(r.createConstructionSite(where.x + x, where.y + y, what) == OK) placed = true;
                }
                x += d;
                tries++;
                Memory[wherename + 'x'] = x;
                Memory[wherename + 'y'] = y;
                Memory[wherename + 'd'] = d;
                Memory[wherename + 'm'] = m;                
            }
            while((2 * y * d) < m && placed == false){
                if(this.placable(r,where.x + x,where.y + y) && tries % step == 0 && Math.sqrt(Math.pow(x,2)+Math.pow(y,2)) >= dist){
                    if(r.createConstructionSite(where.x + x,where.y + y, what) == OK) placed = true;
                }
                y += d;
                tries++;     
                Memory[wherename + 'x'] = x;
                Memory[wherename + 'y'] = y;
                Memory[wherename + 'd'] = d;
                Memory[wherename + 'm'] = m;                 
            }
            d *= -1;
            m += 1;
        }
    },
    
    placable: function(r,x,y){
        var s = _.filter(r.find(FIND_MY_STRUCTURES), (structure) => structure.structureType == STRUCTURE_SPAWN)[0];
        //returns true if room position where:
        var verdict = true;
        if(x < 3 || x > 47) verdict = false;
        if(y < 3 || y > 47) verdict = false;
        if(verdict == true){
            var where = r.getPositionAt(x,y);
            if(where.getRangeTo(this.centerOfInterest(s)) >= this.radiusOfInterest(s)) verdict = false;                                                   //  is inside the radius of interest
            if(Game.map.getTerrainAt(where) == 'wall') verdict = false;                                                                             //  isn't a terrain wall
            if(_.filter(where.lookFor(LOOK_STRUCTURES), (structure) => structure.structureType != STRUCTURE_ROAD).length > 0) verdict = false;      //  doesn't already have a non-road structure on it
            if(where.lookFor(LOOK_CONSTRUCTION_SITES).length > 0) verdict = false;                                                                             //  there's not already a construction site
        }
        return (verdict ? where : verdict);
    },
    
    polarRadius: function(a,b){ //both as RoomPostion objects!
      //returns the mathematical distance between two points  
      var x = a.x - b.x;
      var y = a.y - b.y;
      return Math.sqrt(Math.pow(x,2) + Math.pow(y,2));
    },
    
    polarAngle: function(a,b){ //both as RoomPostion objects!
        //returns the angle component of polar coordinate if b is the origin and a is the point in question.
        var x = a.x - b.x;
        var y = a.y - b.y;        
        return Math.atan(y/x);
        
    },
    
    thirdleg: function(a,b,c){
        var ra = this.polarRadius(a,c);
        var rb = this.polarRadius(b,c);
        var radius = (ra + rb) / 2;
        var ta = this.polarAngle(a,c);
        var tb = this.polarAngle(b,c);
        var theta = 2 * tb - ta;
        var x = Math.round(radius * Math.cos(theta) + c.x);
        var y = Math.round(radius * Math.sin(theta) + c.y);
        return Game.rooms[c.roomName].getPositionAt(x,y);
    }
    

    
};
