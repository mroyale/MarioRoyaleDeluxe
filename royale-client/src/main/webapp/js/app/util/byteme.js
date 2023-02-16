"use strict";
/* global app, util, vec2, squar */
/* global PlayerObject, CoinObject, CheckObject */

var shor2 = {}; // Two Shorts 32bits // Stored as an int32
/* ======================================================================================== */

shor2.encode = function(/* short */ a, /* short */ b) {
  return 0 | (parseInt(a) & 0x0000FFFF) | ((parseInt(b) << 16) & 0xFFFF0000);
};

/* returns <vec2> */
shor2.decode = function(/* shor2 */ a) {
  return vec2.make(a & 0xFFFF, (a >> 16) & 0xFFFF);
};

/* returns [x,y] */
shor2.asArray = function(/* shor2 */ a) {
  return [a & 0xFFFF, (a >> 16) & 0xFFFF];
};










var td32 = {}; // Tile Data 32bit // Stored as an int32
/* ======================================================================================== */

td32.encode = function(/* 11bit int */ index, /* 4bit int */ bump, /* boolean */ depth, /* byte */ definition, /* byte */ data) {
  return [index, bump, parseInt(depth), definition, data];
};

td32.decode16 = function(/* td32 */ a) {
  return {
    index: a[0],
    bump: a[1],
    depth: parseInt(a[2])
  };
};

td32.decode = function(/* td32 */ a) {
  var i = a[3];
  var def = !td32.TILE_PROPERTIES[i]?td32.TILE_PROPERTIES[0]:td32.TILE_PROPERTIES[i];
  return {
    index: a[0],
    bump: a[1],
    depth: parseInt(a[2]),
    definition: def,
    data: a[4]
  }
};

td32.bump = function(/* td32 */ a, /*4bit unsigned integer*/ b ) {
  return [a[0], b, a[2], a[3], a[4]];
};

td32.data = function(/* td32 */ a, /*1 byte uint*/ b) {
  return [a[0], a[1], a[2], a[3], b];
  //return (a & 0x00FFFFFF) | ((b << 24) & 0xFF000000);
};

td32.asArray = function(/* td32 */ a) {
  return [a[0], a[1], a[2], a[3], a[4], a[5]] //[a & 0x7FF, (a >> 11) & 0xF, ((a >> 15) & 0x1) === 1, (a >> 16) & 0xFF, (a >> 24) & 0xFF];
};

td32.TRIGGER = {
  TYPE: {
    TOUCH: 0x00,
    DOWN: 0x01,
    PUSH: 0x02,
    FIREBALL: 0x03,
    SHELL: 0x04,
    STAND: 0x05,
    SMALL_BUMP: 0x10,
    BIG_BUMP: 0x11
  }
};

td32.GEN_FUNC = {};

td32.GEN_FUNC.BUMP = function(game, pid, td, level, zone, x, y, type) {
  game.world.getZone(level, zone).bump(x,y);
  var tdim = vec2.make(1.,0.15);
  var tpos = vec2.make(x, y+1.);
  for(var i=0;i<game.objects.length;i++) {
    var obj = game.objects[i];
    if(!obj.dead && obj.level === level && obj.zone === zone && obj.dim) {
      if(squar.intersection(tpos, tdim, obj.pos, obj.dim)) {
        if(obj instanceof PlayerObject) { obj.bounce(); }
        else if(obj.bounce) { obj.bounce(); }
        else if(obj.bonk) { obj.bonk(); }
        else if(obj instanceof CoinObject) {
          if(game.pid === pid) { obj.playerCollide(game.getPlayer()); }
          game.world.getZone(level, zone).coin(obj.pos.x, obj.pos.y);
        }
      }
    }
  }
};

td32.GEN_FUNC.BREAK = function(game, pid, td, level, zone, x, y, type) {
  var rep = [30,0,0,0,0]; // Replacement td32 data for broken tile.
  game.world.getZone(level, zone).break(x,y,rep);
  var tdim = vec2.make(1.,0.15);
  var tpos = vec2.make(x, y+1.);
  for(var i=0;i<game.objects.length;i++) {
    var obj = game.objects[i];
    if(!obj.dead && obj.level === level && obj.zone === zone && obj.dim) {
      if(squar.intersection(tpos, tdim, obj.pos, obj.dim)) {
        if(obj instanceof PlayerObject) { obj.bounce(); }
        else if(obj.bounce) { obj.bounce(); }
        else if(obj.bonk) { obj.bonk(); }
        else if(obj instanceof CoinObject) {
          if(game.pid === pid) { obj.playerCollide(game.getPlayer()); }
          game.world.getZone(level, zone).coin(obj.pos.x, obj.pos.y);
        }
      }
    }
  }
};

td32.TILE_PROPERTIES = {
  /* Nothing */
  0x00: {
    NAME: "AIR",
    COLLIDE: false,
    HIDDEN: false,
    ASYNC: true,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {}
  },
  /* Solid Standard */
  0x01: {
    NAME: "SOLID STANDARD",
    COLLIDE: true,
    HIDDEN: false,
    ASYNC: true,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {}
  },
  /* Solid Bumpable */
  0x02: {
    NAME: "SOLID BUMPABLE",
    COLLIDE: true,
    HIDDEN: false,
    ASYNC: false,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {
      switch(type) {
        /* Small bump */
        case 0x10 : {
          if(game.pid === pid) { game.out.push(NET030.encode(level, zone, shor2.encode(x,y), type)); }
          td32.GEN_FUNC.BUMP(game, pid, td, level, zone, x, y, type);
          break;
        }
        /* Big bump */
        case 0x11 : {
          if(game.pid === pid) { game.out.push(NET030.encode(level, zone, shor2.encode(x,y), type)); }
          td32.GEN_FUNC.BUMP(game, pid, td, level, zone, x, y, type);
          break;
        }
      }
    }
  },
  /* Solid Breakable Normal */
  0x03: {
    NAME: "SOLID BREAKABLE NORMAL",
    COLLIDE: true,
    HIDDEN: false,
    ASYNC: false,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {
      switch(type) {
        /* Small bump */
        case 0x10 : {
          if(game.pid === pid) { game.out.push(NET030.encode(level, zone, shor2.encode(x,y), type)); }
          td32.GEN_FUNC.BUMP(game, pid, td, level, zone, x, y, type);
          break;
        }
        /* Big bump */
        case 0x11 : {
          if(game.pid === pid) { game.out.push(NET030.encode(level, zone, shor2.encode(x,y), type)); }
          td32.GEN_FUNC.BREAK(game, pid, td, level, zone, x, y, type);
          break;
        }
      }
    }
  },
  /* Solid Damage */
  0x04: {
    NAME: "SOLID DAMAGE",
    DATA: "Instant Death (0=no/1=yes)",
    COLLIDE: true,
    HIDDEN: false,
    ASYNC: false,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {
      switch(type) {
        /* Touch */
        /* Stand */
        case 0x00 :
        case 0x05 : {
          if (game.pid === pid) {
            var data = Math.max(0, Math.min(1, parseInt(td.data) || 0));
            switch (data) {
              case 1 : { game.getPlayer().kill(); break; }
              default : { game.getPlayer().damage(); break; }
            }
          }
          break;
        }
      }
    }
  },
  /* Air Damage */
  0x05: {
    NAME: "AIR DAMAGE",
    COLLIDE: false,
    HIDDEN: false,
    ASYNC: false,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {
      switch(type) {
        /* Touch */
        case 0x00 : {
          if (game.pid === pid) {
            game.getPlayer().damage();
          }
          break;
        }
      }
    }
  },
  /* Semisolid */
  0x06: {
    NAME: "SEMISOLID STANDARD",
    COLLIDE: true,
    HIDDEN: false,
    ASYNC: false,
    SEMISOLID: true,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {}
  },
  /* Water Standard */
  0x07: {
    NAME: "WATER STANDARD",
    COLLIDE: false,
    HIDDEN: false,
    ASYNC: false,
    WATER: true,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {}
  },
  /* Ice Block */
  0x0A: {
    NAME: "ICE BLOCK",
    COLLIDE: true,
    HIDDEN: false,
    ASYNC: false,
    ICE: true,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {}
  },
  /* Note Block */
  0x0B: {
    NAME: "NOTE BLOCK",
    COLLIDE: true,
    HIDDEN: false,
    ASYNC: false,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {
      switch (type) {
        /* Stand */
        case 0x05: {
            if (game.pid === pid) { game.getPlayer().bounce(); game.out.push(NET030.encode(level, zone, shor2.encode(x, y), type)); }
            td32.GEN_FUNC.BUMP(game, pid, td, level, zone, x, y, type);
            break;
        }

        /* Small Bump */
        /* Big Bump */
        case 0x10:
        case 0x11: {
            if (game.pid === pid) { game.out.push(NET030.encode(level, zone, shor2.encode(x, y), type)); }
            td32.GEN_FUNC.BUMP(game, pid, td, level, zone, x, y, type);
            break;
        }
      }
    }
  },
  /* Item Note Block */
  12: {
    NAME: "ITEM NOTE BLOCK",
    DATA: "Object ID",
    COLLIDE: true,
    HIDDEN: false,
    ASYNC: true,
    TRIGGER: function (game, pid, td, level, zone, x, y, type) {
        switch (type) {
            /* Stand */
            /* Shell */
            case 0x05:
            case 0x04: {
                if (game.pid === pid) { game.getPlayer().bounce(); game.out.push(NET030.encode(level, zone, shor2.encode(x, y), type)); }

                var rep = td32.encode(td.index, 0, td.depth, 0xb, 0); // Replacement td32 data for tile.
                game.world.getZone(level, zone).replace(x, y, rep);

                game.createObject(parseInt(td.data), level, zone, vec2.make(x, y), [shor2.encode(x, y), true]);
                
                td32.GEN_FUNC.BUMP(game, pid, td, level, zone, x, y, type);
                game.world.getZone(level, zone).play(x, y, "item.mp3", 1., 0.04);
                break;
            }

            /* Small bump */
            /* Big bump */
            case 0x10:
            case 0x11: {
                if (game.pid === pid) { game.out.push(NET030.encode(level, zone, shor2.encode(x, y), type)); }
                var rep = [td.index, 0, td.depth, 0xb, 0]; // Replacement td32 data for tile.
                game.world.getZone(level, zone).replace(x, y, rep);
                game.createObject(td.data, level, zone, vec2.make(x, y), [shor2.encode(x, y), false, false]);

                td32.GEN_FUNC.BUMP(game, pid, td, level, zone, x, y, type);
                game.world.getZone(level, zone).play(x, y, "item.mp3", 1., 0.04);
                break;
            }
        }
    }
  },
  /* Ice Object Block */
  13: {
    NAME: "ICE OBJECT BLOCK",
    DATA: "Object ID",
    COLLIDE: true,
    HIDDEN: false,
    ASYNC: false,
    ICE: true,
    TRIGGER: function (game, pid, td, level, zone, x, y, type, obj) {
        switch (type) {
            /* Fireball */
            case 0x03: {
                var rep = [30, 0, 0, 0, 0]; // td32 replacement tile
                game.world.getZone(level, zone).replace(x, y, rep);
                game.createObject(td.data, level, zone, vec2.make(x, y), [shor2.encode(x, y)]);
                obj.kill();
                break;
            }
        }
    }
  },
  /* Item Block Normal */
  0x11: {
    NAME: "ITEM BLOCK STANDARD",
    DATA: "Object ID",
    COLLIDE: true,
    HIDDEN: false,
    ASYNC: false,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {
      switch(type) {
        /* Shell */
        /* Small bump */
        /* Big bump */
        case 0x04 :
        case 0x10 : 
        case 0x11 : {
          if(game.pid === pid) { game.out.push(NET030.encode(level, zone, shor2.encode(x,y), type)); }
          var rep = [27, 0, 1, 1, 0] // Replacement td32 data for tile.
          game.world.getZone(level, zone).replace(x,y,rep);
          game.createObject(td.data, level, zone, vec2.make(x,y), [shor2.encode(x,y)]);
          td32.GEN_FUNC.BUMP(game, pid, td, level, zone, x, y, type);
          game.world.getZone(level, zone).play(x,y,"item.mp3",1.,0.04);
          break;
        }
      }
    }
  },
  /* Item Block Infinite */
  0x19: {
    NAME: "ITEM BLOCK INFINITE",
    DATA: "Object ID",
    COLLIDE: true,
    HIDDEN: false,
    ASYNC: false,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {
      switch(type) {
        /* Small bump */
        /* Big bump */
        /* Shell */
        case 0x10 :
        case 0x11 : 
        case 0x04 : {
          if(game.pid === pid) { game.out.push(NET030.encode(level, zone, shor2.encode(x,y), type)); }
          game.createObject(td.data, level, zone, vec2.make(x,y), [shor2.encode(x,y)]);
          td32.GEN_FUNC.BUMP(game, pid, td, level, zone, x, y, type);
          game.world.getZone(level, zone).play(x,y,"item.mp3",1.,0.04);
          break;
        }
      }
    }
  },
  /* Item Block Regen */
  0x1A: {
    NAME: "ITEM BLOCK REGEN",
    DATA: "Object ID",
    COLLIDE: true,
    HIDDEN: false,
    ASYNC: false,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {
      switch(type) {
        /* Small bump */
        /* Big bump */
        /* Shell */
        case 0x10 :
        case 0x11 :
        case 0x04 : {
          if(game.pid === pid) { game.out.push(NET030.encode(level, zone, shor2.encode(x,y), type)); }
          var raw = game.world.getZone(level, zone).tile(x,y);
          var rep = [27, 0, 1, 1, 0] // Replacement td32 data for tile.
          var og = td32.data(raw, td.data);                      // Replacement td32 data for tile.
          game.world.getZone(level, zone).replace(x,y,rep);
          game.world.getZone(level, zone).regen(x,y,og);
          game.createObject(td.data, level, zone, vec2.make(x,y), [shor2.encode(x,y)]);
          td32.GEN_FUNC.BUMP(game, pid, td, level, zone, x, y, type);
          game.world.getZone(level, zone).play(x,y,"item.mp3",1.,0.04);
          break;
        }
      }
    }
  },
  /* Coin Block Normal */
  0x12: {
    NAME: "COIN BLOCK STANDARD",
    COLLIDE: true,
    HIDDEN: false,
    ASYNC: false,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {
      switch(type) {
        /* Small bump */
        /* Big bump */
        /* Shell */
        case 0x10 :
        case 0x11 :
        case 0x04 : {
          if(game.pid === pid) { game.coinage(); game.out.push(NET030.encode(level, zone, shor2.encode(x,y), type)); }
          var rep = [27, 0, 1, 1, 0] // Replacement td32 data for tile.
          game.world.getZone(level, zone).replace(x,y,rep);
          game.world.getZone(level, zone).coin(x,y+1);
          td32.GEN_FUNC.BUMP(game, pid, td, level, zone, x, y, type);
          break;
        }
      }
    }
  },
  /* Coin Block Multi */
  0x13: {
    NAME: "COIN BLOCK MULTI",
    DATA: "Coin Amount",
    COLLIDE: true,
    HIDDEN: false,
    ASYNC: false,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {
      switch(type) {
        /* Small bump */
        /* Big bump */
        /* Shell */
        case 0x04 :
        case 0x10 :
        case 0x11 : {
          if(game.pid === pid) { game.coinage(); game.out.push(NET030.encode(level, zone, shor2.encode(x,y), type)); }
          if(td.data > 0) {
            var raw = game.world.getZone(level, zone).tile(x,y);
            var rep = td32.data(raw, td.data-1);                      // Replacement td32 data for tile.
            game.world.getZone(level, zone).replace(x,y,rep);
            game.world.getZone(level, zone).coin(x,y+1);
            td32.GEN_FUNC.BUMP(game, pid, td, level, zone, x, y, type);
          }
          else {
            var rep = [27, 0, 1, 1, 0] // Replacement td32 data for tile.
            game.world.getZone(level, zone).replace(x,y,rep);
            game.world.getZone(level, zone).coin(x,y+1);
            td32.GEN_FUNC.BUMP(game, pid, td, level, zone, x, y, type);
          }
          break;
        }
      }
    }
  },
  /* Vine Block */
  0x18: {
    NAME: "VINE BLOCK",
    DATA: "Target Warp ID",
    COLLIDE: true,
    HIDDEN: false,
    ASYNC: false,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {
      switch(type) {
        /* Small bump */
        /* Big bump */
        /* Shell */
        case 0x04 :
        case 0x10 :
        case 0x11 : {
          if(game.pid === pid) { game.coinage(); game.out.push(NET030.encode(level, zone, shor2.encode(x,y), type)); }
          var rep = [27, 0, 1, 1, 0]; // Replacement td32 data for tile.
          var vin = [31, 0, 0, 165, td.data]; // Vine td32 data for tile.
          game.world.getZone(level, zone).replace(x,y,rep);
          game.world.getZone(level, zone).grow(x,y+1,vin);
          td32.GEN_FUNC.BUMP(game, pid, td, level, zone, x, y, type);
          game.world.getZone(level, zone).play(x,y,"vine.mp3",1.,0.04);
          break;
        }
      }
    }
  },
  /* Progressive Item Block */
  0x14: {
    NAME: "ITEM BLOCK PROGRESSIVE",
    DATA: "Final Powerup (0=flower,1=leaf,2=random)",
    COLLIDE: true,
    HIDDEN: false,
    ASYNC: false,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {
      if (type === 0x10 || type === 0x11 || type === 0x04) {
        if(game.pid === pid) { game.out.push(NET030.encode(level, zone, shor2.encode(x,y), type)); }
        var ply = game.getPlayer();
        var rep = [27, 0, 1, 1, 0] // Replacement td32 data for tile.
        game.world.getZone(level, zone).replace(x,y,rep);
        game.createObject((type === 0x10 ? 0x51 : (parseInt(td.data) === 2 ? parseInt(Math.random()*2) === 1 ? 0x52 : 0x57 : (parseInt(td.data) === 1 ? 0x57 : 0x52))), level, zone, vec2.make(x,y), [shor2.encode(x,y)]);
        td32.GEN_FUNC.BUMP(game, pid, td, level, zone, x, y, type);
        game.world.getZone(level, zone).play(x,y,"item.mp3",1.,0.04);
      }
    }
  },
  /* Item Block Invisible */
  0x15: {
    NAME: "ITEM BLOCK INVISIBLE",
    DATA: "Object ID",
    COLLIDE: true,
    HIDDEN: true,
    ASYNC: false,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {
      switch(type) {
        /* Small bump */
        /* Big bump */
        /* Shell */
        case 0x04 :
        case 0x10 :
        case 0x11 : {
          if(game.pid === pid) { game.out.push(NET030.encode(level, zone, shor2.encode(x,y), type)); }
          var rep = [27, 0, 1, 1, 0] // Replacement td32 data for tile.
          game.world.getZone(level, zone).replace(x,y,rep);
          game.createObject(td.data, level, zone, vec2.make(x,y), [shor2.encode(x,y)]);
          td32.GEN_FUNC.BUMP(game, pid, td, level, zone, x, y, type);
          game.world.getZone(level, zone).play(x,y,"item.mp3",1.,0.04);
          break;
        }
      }
    }
  },
  /* Coin Block INVISIBLE */
  0x16: {
    NAME: "COIN BLOCK INVISIBLE",
    COLLIDE: true,
    HIDDEN: true,
    ASYNC: false,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {
      switch(type) {
        /* Small bump */
        /* Big bump */
        /* Shell */
        case 0x04 :
        case 0x10 :
        case 0x11 : {
          if(game.pid === pid) { game.coinage(); game.out.push(NET030.encode(level, zone, shor2.encode(x,y), type)); }
          var rep = [27, 0, 1, 1, 0] // Replacement td32 data for tile.
          game.world.getZone(level, zone).replace(x,y,rep);
          game.world.getZone(level, zone).coin(x,y+1);
          td32.GEN_FUNC.BUMP(game, pid, td, level, zone, x, y, type);
          break;
        }
      }
    }
  },
  /* Lock Camera Scroll */
  30: {
    NAME: "LOCK CAMERA SCROLL",
    COLLIDE: false,
    HIDDEN: false,
    ASYNC: true,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {
      switch (type) {
        /* Touch */
        case 0x00 : {
          game.cameraLocked = true;
          break;
        }
      }
    }
  },
  /* Unlock Camera Scroll */
  31: {
    NAME: "UNLOCK CAMERA SCROLL",
    COLLIDE: false,
    HIDDEN: false,
    ASYNC: true,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {
      switch (type) {
        /* Touch */
        case 0x00 : {
          game.cameraLocked = false;
          break;
        }
      }
    }
  },
  /* Warp Tile */
  0x51: {
    NAME: "WARP TILE",
    DATA: "Target Warp ID",
    COLLIDE: false,
    HIDDEN: false,
    ASYNC: true,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {
      switch(type) {
        /* Touch */
        case 0x00 : {
          if(game.pid === pid) {
            game.getPlayer().warp(parseInt(td.data));
            game.cameraLocked = false;
          }
        }
      }
    }
  },
  /* Warp Pipe */
  0x52: {
    NAME: "WARP PIPE SLOW",
    DATA: "Target Warp ID",
    COLLIDE: true,
    HIDDEN: false,
    ASYNC: true,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {
      switch(type) {
        /* Down */
        case 0x01 : {
          if(game.pid === pid) {
            var ply = game.getPlayer();
            var l = game.world.getZone(level, zone).getTile(vec2.make(x-1,y));
            var r = game.world.getZone(level, zone).getTile(vec2.make(x+1,y));
            
            var cx;
            if(l.definition === this) { cx = x; }
            else if(r.definition === this) { cx = x+1; }
            else { return; }
            
            if(Math.abs((ply.pos.x + (ply.dim.x*.5)) - cx) <= 0.45) { ply.pipe(2, parseInt(td.data), 50); }
          }
        }
      }
    }
  },
  /* Warp Pipe Horiz */
  0x53: {
    NAME: "WARP PIPE RIGHT SLOW",
    DATA: "Target Warp ID",
    COLLIDE: true,
    HIDDEN: false,
    ASYNC: true,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {
      switch(type) {
        /* Push */
        case 0x02 : {
          if(game.pid === pid) {
            game.getPlayer().pipe(4, parseInt(td.data), 50);
          }
        }
      }
    }
  },
  /* Warp Pipe */
  0x54: {
    NAME: "WARP PIPE FAST",
    DATA: "Target Warp ID",
    COLLIDE: true,
    HIDDEN: false,
    ASYNC: true,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {
      switch(type) {
        /* Down */
        case 0x01 : {
          if(game.pid === pid) {
            var ply = game.getPlayer();
            var l = game.world.getZone(level, zone).getTile(vec2.make(x-1,y));
            var r = game.world.getZone(level, zone).getTile(vec2.make(x+1,y));
            
            var cx;
            if(l.definition === this) { cx = x; }
            else if(r.definition === this) { cx = x+1; }
            else { return; }
            
            if(Math.abs((ply.pos.x + (ply.dim.x*.5)) - cx) <= 0.45) { ply.pipe(2, parseInt(td.data), 0); }
          }
        }
      }
    }
  },
  /* Warp Pipe Horiz */
  0x55: {
    NAME: "WARP PIPE RIGHT FAST",
    DATA: "Target Warp ID",
    COLLIDE: true,
    HIDDEN: false,
    ASYNC: true,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {
      switch(type) {
        /* Push */
        case 0x02 : {
          if(game.pid === pid) {
            game.getPlayer().pipe(4, parseInt(td.data), 0);
          }
        }
      }
    }
  },
  /* End of Level Warp */
  0x56: {
    NAME: "LEVEL END WARP",
    DATA: "Target Level ID",
    COLLIDE: false,
    HIDDEN: false,
    ASYNC: true,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {
      switch(type) {
        /* Touch */
        case 0x00 : {
          if(game.pid === pid) {
            game.levelWarp(parseInt(td.data));
          }
        }
      }
    }
  },
  /* Random Warp Tile */
  0x57: {
    NAME: "Random Warp Tile",
    COLLIDE: false,
    HIDDEN: false,
    ASYNC: true,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {
      switch(type) {
        /* Touch */
        /* Stand */
        case 0x00 :
        case 0x05 : {
          if(game.pid === pid) {
            var warps = this.game.world.getLevel(level).getWarps();
            game.getPlayer().warp(warps[Math.floor(Math.random() * warps.length)]);
            game.cameraLocked = false;
          }
          break;
        }
      }
    }
  },
  /* Warp Pipe Horiz */
  89: {
    NAME: "WARP PIPE LEFT SLOW",
    DATA: "Target Warp ID",
    COLLIDE: true,
    HIDDEN: false,
    ASYNC: true,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {
      switch(type) {
        /* Push */
        case 0x02 : {
          if(game.pid === pid) {
            game.getPlayer().pipe(3, parseInt(td.data), 50);
          }
        }
      }
    }
  },
  /* Warp Pipe Horiz */
  90: {
    NAME: "WARP PIPE LEFT FAST",
    DATA: "Target Warp ID",
    COLLIDE: true,
    HIDDEN: false,
    ASYNC: true,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {
      switch(type) {
        /* Push */
        case 0x02 : {
          if(game.pid === pid) {
            game.getPlayer().pipe(3, parseInt(td.data), 0);
          }
        }
      }
    }
  },
  /* Flagpole */
  0xA0: {
    NAME: "FLAGPOLE",
    COLLIDE: false,
    HIDDEN: false,
    ASYNC: true,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {
      switch(type) {
        /* Touch */
        case 0x00 : {
          if(game.pid === pid) {
            var ply = game.getPlayer();
            if(ply.pos.x >= x) { ply.pole(vec2.make(x,y)); }
          }
        }
      }
    }
  },
  /* Vine */
  0xA5: {
    NAME: "VINE",
    COLLIDE: false,
    HIDDEN: false,
    ASYNC: true,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {
      switch(type) {
        /* Touch */
        case 0x00 : {
          if(game.pid === pid) {
            var ply = game.getPlayer();
            if(ply.pos.x >= x && ply.pos.x <= x+1. && ply.btnU) { ply.vine(vec2.make(x,y), parseInt(td.data)); game.cameraLocked = false; }
          }
        }
      }
    }
  },
  /* Vote Block */
  0xF0: {
    NAME: "VOTE BLOCK",
    COLLIDE: true,
    HIDDEN: false,
    ASYNC: false,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {
      switch(type) {
        /* Small bump */
        case 0x10 : {
          if(game.pid === pid) { game.send({type: "g50"}); }
          var rep = [27, 0, 1, 1, 0] // Replacement td32 data for tile.
          game.world.getZone(level, zone).replace(x,y,rep);
          game.createObject(CheckObject.ID, level, zone, vec2.make(x,y+1), [shor2.encode(x,y)]);
          td32.GEN_FUNC.BUMP(game, pid, td, level, zone, x, y, type);
          break;
        }
        /* Big bump */
        case 0x11 : {
          if(game.pid === pid) { game.send({type: "g50"}); }
          var rep = [27, 0, 1, 1, 0] // Replacement td32 data for tile.
          game.world.getZone(level, zone).replace(x,y,rep);
          game.createObject(CheckObject.ID, level, zone, vec2.make(x,y+1), [shor2.encode(x,y)]);
          td32.GEN_FUNC.BUMP(game, pid, td, level, zone, x, y, type);
          break;
        }
      }
    }
  },
  /* Music Block AIR (NEW) */
  239: {
    NAME: "MUSIC BLOCK STANDARD",
    COLLIDE: false,
    HIDDEN: false,
    ASYNC: false,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {
      if (game.pid !== pid) { return; }

      switch(type) {
        /* Touch */
        case 0x00: {
          if (!(td.data) || !(td.data.trim())) { app.menu.warn.show("Faulty music value."); return; }
          game.getZone().musicBlock = td.data;
        }
      }
    }
  },
  /* Message Block (NEW) */
  0xF1: {
    NAME: "MESSAGE BLOCK",
    COLLIDE: true,
    HIDDEN: false,
    ASYNC: false,
    TRIGGER: function(game, pid, td, level, zone, x, y, type) {
      switch(type) {
        /* Small bump */
        /* Big bump */
        case 0x10 :
        case 0x11 : {
          if (!game.pid === pid) { return; }
          if (game.messageTimer) { clearTimeout(game.messageTimer); }

          var tmp = document.getElementById("messageBlock");

          game.messageTimer = setTimeout(function() { tmp.style.transform = "scale(0) translateX(50%) translateY(50%)"; }, 5000);
          td32.GEN_FUNC.BUMP(game, pid, td, level, zone, x, y, type);
          game.world.getZone(level, zone).play(x,y,"message.mp3",1.,0.04);

          tmp.style.display = "";
          tmp.innerText = td.data;
          tmp.style.transform = "scale(1) translateX(50%) translateY(50%)";
        }
      }
    }
  }
};


var NETX = {}; // Main
/* ======================================================================================== */

NETX.decode = function(/* Uint8Array */ data) {
  var de = [];
  var i = 0;
  while(i<data.length) {
    var desig = data.slice(i++, i)[0];
    switch(desig) {
      case 0x02 : { de.push(NET001.decode(data.slice(i, i+=NET001.BYTES-1))); break; }
      case 0x10 : { de.push(NET010.decode(data.slice(i, i+=NET010.BYTES-1))); break; }
      case 0x11 : { de.push(NET011.decode(data.slice(i, i+=NET011.BYTES-1))); break; }
      case 0x12 : { de.push(NET012.decode(data.slice(i, i+=NET012.BYTES-1))); break; }
      case 0x13 : { de.push(NET013.decode(data.slice(i, i+=NET013.BYTES-1))); break; }
      case 0x17 : { de.push(NET017.decode(data.slice(i, i+=NET017.BYTES-1))); break; }
      case 0x18 : { de.push(NET018.decode(data.slice(i, i+=NET018.BYTES-1))); break; }
      case 0x20 : { de.push(NET020.decode(data.slice(i, i+=NET020.BYTES-1))); break; }
      case 0x30 : { de.push(NET030.decode(data.slice(i, i+=NET030.BYTES-1))); break; }
      default : { if(app) { app.menu.warn.show("Error decoding binary data!"); } return de; }
    }
  }
  return de;
};











var NET001 = {}; // ASSIGN_PID [0x1] // As Uint8Array
/* ======================================================================================== */
NET001.DESIGNATION = 0x02;
NET001.BYTES = 3;

/* Server->Client */
NET001.decode = function(/* NET001_SERV */ a) {
  return {designation: NET001.DESIGNATION, pid: (a[1] & 0x00FF) | ((a[0] << 8) & 0xFF00)};
};












var NET010 = {}; // CREATE_PLAYER_OBJECT [0x10] // As Uint8Array
/* ======================================================================================== */
NET010.DESIGNATION = 0x10;
NET010.BYTES = 10;

/* Client->Server */
NET010.encode = function(/* byte */ levelID, /* byte */ zoneID, /* shor2 */ pos, /* byte */ character) {
  return new Uint8Array([NET010.DESIGNATION, levelID, zoneID, (pos >> 24) & 0xFF, (pos >> 16) & 0xFF, (pos >> 8) & 0xFF, pos & 0xFF, character]);
};

/* Server->>>Client */
NET010.decode = function(/* NET010_SERV */ a) {
  return {
    designation: NET010.DESIGNATION,
    pid: (a[1] & 0x00FF) | ((a[0] << 8) & 0xFF00),
    level: a[2],
    zone: a[3],
    pos: (a[7] & 0xFF) | ((a[6] << 8) & 0xFF00) | ((a[5] << 16) & 0xFF0000) | ((a[4] << 24) & 0xFF0000),
    character: a[8]
  };
};










var NET011 = {}; // KILL_PLAYER_OBJECT [0x11] // As Uint8Array
/* ======================================================================================== */
NET011.DESIGNATION = 0x11;
NET011.BYTES = 3;

/* Client->Server */
NET011.encode = function() {
  return new Uint8Array([NET011.DESIGNATION]);
};

/* Server->>>Client */
NET011.decode = function(/* NET011_SERV */ a) {
  return {
    designation: NET011.DESIGNATION, pid: (a[1] & 0x00FF) | ((a[0] << 8) & 0xFF00)
  };
};









var NET012 = {}; // UPDATE_PLAYER_OBJECT [0x12] // As Uint8Array
/* ======================================================================================== */
NET012.DESIGNATION = 0x12;
NET012.BYTES = 17;

/* Client->Server */
NET012.encode = function(/* byte */ levelID, /* byte */ zoneID, /* vec2 */ pos, /* byte */ spriteID, /* byte */ reverse, /* byte */ character) {
  var farr = new Float32Array([pos.x, pos.y]);
  var barr = new Uint8Array(farr.buffer);
  return new Uint8Array([
    NET012.DESIGNATION, levelID, zoneID,
    barr[3], barr[2], barr[1], barr[0],
    barr[7], barr[6], barr[5], barr[4],
    spriteID >> 8 & 0xFF, spriteID & 0xFF,
    reverse,
    character
  ]);
};

/* Server->>Client */
NET012.decode = function(/* NET012_SERV */ a) {
  var b1 = new Uint8Array([a[4], a[5], a[6], a[7]]);
  var b2 = new Uint8Array([a[8], a[9], a[10], a[11]]);
  var v1 = new DataView(b1.buffer);
  var v2 = new DataView(b2.buffer);
  
  return {
    designation: NET012.DESIGNATION,
    pid: (a[1] & 0x00FF) | ((a[0] << 8) & 0xFF00),
    level: a[2],
    zone: a[3],
    pos: vec2.make(v1.getFloat32(0), v2.getFloat32(0)),
    sprite: (a[13] & 0x00FF) | ((a[12] << 8) & 0xFF00),
    reverse: a[14] !== 0,
    character: a[15]
  };
};


var NET013 = {}; // PLAYER_OBJECT_EVENT [0x13] // As Uint8Array
/* ======================================================================================== */
NET013.DESIGNATION = 0x13;
NET013.BYTES = 4;

/* Client->Server */
NET013.encode = function(/* byte */ type) {
  return new Uint8Array([NET013.DESIGNATION, type]);
};

/* Server->>>Client */
NET013.decode = function(/* NET013_SERV */ a) {
  return {
    designation: NET013.DESIGNATION,
    pid: (a[1] & 0x00FF) | ((a[0] << 8) & 0xFF00),
    type: a[2]
  };
};

var NET015 = {}; // PLAYER_INVALID_MOVE [0x15] // As Uint8Array
/* ======================================================================================== */
NET015.DESIGNATION = 0x15;
NET015.BYTES = 3;

/* Client->Server */
NET015.encode = function() {
  return new Uint8Array([NET015.DESIGNATION]);
};

var NET017 = {}; // PLAYER_KILL_EVENT [0x17] // As Uint8Array
/* ======================================================================================== */
NET017.DESIGNATION = 0x17;
NET017.BYTES = 5;

/* Client->Server */
NET017.encode = function(/* short */ killer) {
  return new Uint8Array([NET017.DESIGNATION, killer >> 8 & 0xFF, killer & 0xFF]);
};

/* Server->Client */
NET017.decode = function(/* NET017_SERV */ a) {
  return {
    designation: NET017.DESIGNATION,
    pid: (a[1] & 0x00FF) | ((a[0] << 8) & 0xFF00),
    killer: (a[3] & 0x00FF) | ((a[2] << 8) & 0xFF00)
  };
};



var NET018 = {}; // PLAYER_RESULT_REQUEST [0x18] // As Uint8Array
/* ======================================================================================== */
NET018.DESIGNATION = 0x18;
NET018.BYTES = 5;

/* Client->Server */
NET018.encode = function() {
  return new Uint8Array([NET018.DESIGNATION]);
};

/* Server->>>Client */
NET018.decode = function(/* NET011_SERV */ a) {
  return {
    designation: NET018.DESIGNATION, pid: (a[1] & 0x00FF) | ((a[0] << 8) & 0xFF00), result: a[2], extra: a[3]
  };
};

var NET019 = {}; // PLAYER_SNITCH [0x19] // As Uint8Array
/* ======================================================================================== */
NET019.DESIGNATION = 0x19;
NET019.BYTES = 3;

/* Client->Server */
NET019.encode = function() {
  return new Uint8Array([NET019.DESIGNATION]);
};

var NET020 = {}; // OBJECT_EVENT_TRIGGER [0x20] // As Uint8Array
/* ======================================================================================== */
NET020.DESIGNATION = 0x20;
NET020.BYTES = 10;

/* Client->Server */
NET020.encode = function(/* byte */ levelID, /* byte */ zoneID, /* int */ oid, /* byte */ type) {
  return new Uint8Array([
    NET020.DESIGNATION, levelID, zoneID,
    (oid >> 24) & 0xFF, (oid >> 16) & 0xFF, (oid >> 8) & 0xFF, oid & 0xFF,
    type
  ]);
};

/* Server->>>Client */
NET020.decode = function(/* NET020_SERV */ a) {
  return {
    designation: NET020.DESIGNATION,
    pid: (a[1] & 0x00FF) | ((a[0] << 8) & 0xFF00),
    level: a[2],
    zone: a[3],
    oid: (a[7] & 0xFF) | ((a[6] << 8) & 0xFF00) | ((a[5] << 16) & 0xFF0000) | ((a[4] << 24) & 0xFF0000),
    type: a[8]
  };
};



var NET021 = {}; // PLAYER_COLLECT_COIN [0x21] // As Uint8Array
/* ======================================================================================== */
NET021.DESIGNATION = 0x21;
NET021.BYTES = 3;

/* Client->Server */
NET021.encode = function() {
  return new Uint8Array([NET021.DESIGNATION]);
};


var NET030 = {}; // TILE_EVENT_TRIGGER [0x30] // As Uint8Array
/* ======================================================================================== */
NET030.DESIGNATION = 0x30;
NET030.BYTES = 10;

/* Client->Server */
NET030.encode = function(/* byte */ levelID, /* byte */ zoneID, /* shor2 */ pos, /* byte */ type) {
  return new Uint8Array([
    NET030.DESIGNATION, levelID, zoneID,
    (pos >> 24) & 0xFF, (pos >> 16) & 0xFF, (pos >> 8) & 0xFF, pos & 0xFF,
    type
  ]);
};

/* Server->/>Client */
NET030.decode = function(/* NET030_SERV */ a) {
  return {
    designation: NET030.DESIGNATION,
    pid: (a[1] & 0x00FF) | ((a[0] << 8) & 0xFF00),
    level: a[2],
    zone: a[3],
    pos: shor2.decode((a[7] & 0xFF) | ((a[6] << 8) & 0xFF00) | ((a[5] << 16) & 0xFF0000) | ((a[4] << 24) & 0xFF0000)),
    type: a[8]
  };
};



/* Merges all Uint8Arrays into one */
var MERGE_BYTE = function(/* Uint8Array[] */ a) {
  var data = [];
  for(var i=0;i<a.length;i++) {
    for(var j=0;j<a[i].length;j++) {
      data.push(a[i][j]);
    }
  }
  return new Uint8Array(data);
};
