"use strict";
/* global util, vec2, shor2, td32 */

function World(game, data) {
  this.game = game;
  this.initial = data.initial; // ID for the first level of this world.
  
  this.levels = [];
  for(var i=0;i<data.world.length;i++) {
    this.levels.push(new Level(game, data.world[i]));
  }
}

World.prototype.step = function() {
  for(var i=0;i<this.levels.length;i++) {
    this.levels[i].step();
  }
};

World.prototype.getInitialLevel = function() {
  return this.getLevel(this.initial);
};

World.prototype.getInitialZone = function() {
  var lvl = this.getLevel(this.initial);
  return this.getZone(lvl.id, lvl.initial);
};

World.prototype.getLevel = function(level) {
  for(var i=0;i<this.levels.length;i++) {
    var l = this.levels[i];
    if(l.id === level) {
      return l;
    }
  }
  return undefined;
};

World.prototype.getZone = function(level, zone) {
  for(var i=0;i<this.levels.length;i++) {
    var l = this.levels[i];
    if(l.id === level) {
      for(var j=0;j<l.zones.length;j++) {
        var z = l.zones[j];
        if(z.id === zone) {
          return z;
        }
      }
    }
  }
  return undefined;
};

/* ========================================================================== */

function Level(game, data) {
  this.game = game;
  
  this.id = data.id;
  this.name = data.name;
  this.initial = data.initial; // ID for the stating zone of this level.
  
  this.zones = [];
  for(var i=0;i<data.zone.length;i++) {
    this.zones.push(new Zone(game, this.id, data.zone[i]));
  }
}

Level.prototype.step = function() {
  for(var i=0;i<this.zones.length;i++) {
    this.zones[i].step();
  }
};

Level.prototype.getInitial = function() {
  for(var i=0;i<this.zones.length;i++) {
    var zon = this.zones[i];
    if(zon.id === this.initial) { return zon; }
  }
  return undefined;
};

Level.prototype.getWarp = function(wid) {
  wid = parseInt(wid);

  for(var j=0;j<this.zones.length;j++) {
    var zon = this.zones[j];
    for(var k=0;k<zon.warp.length;k++) {
      var wrp = zon.warp[k];
      if(wrp.id === wid) { return {level: this.id, zone: zon.id, pos: shor2.decode(wrp.pos), data: wrp.data}; }
    }
  }
};

/* Returns all warp IDs in the level */
Level.prototype.getWarps = function() {
  var warps = [];

  for(var j=0;j<this.zones.length;j++) {
    var zon = this.zones[j];
    for(var k=0;k<zon.warp.length;k++) {
      var wrp = zon.warp[k];
      warps.push(wrp.id);
    }
  }

  return warps;
};

/* ========================================================================== */

function Zone(game, level, data) {
  this.game = game;
  
  this.id = data.id;
  this.level = level;    // ID of the Level that this zone is a part of
  
  this.initial = data.initial; // shor2 starting point for this zone.
  this.color = data.color; // HTML color of the sky for this zone.
  this.music = data.music?data.music:"";
  this.musicBlock = null; // Used when we touch a music block
  this.camera = parseInt(data.camera) || 0; // The camera mode: 0: horizontal, 1: vertical, 2: both
  
  this.layers = data.layers || []; // All layers which are 2D arrays of td32

  /* If we have an (old) level that uses the old data system, adjust. */
  if (data.data) {
    for (var i = 0; i < this.layers.length && this.layers[i].z < 0; i++);
    this.layers.splice(i, 0, { z: 0, data: data.data });
  }

  this.mainLayer = undefined;
  for (var layer of this.layers) if (layer.z == 0) {
      this.mainLayer = layer;
      break;
  }

  this.obj = data.obj; // Copied by reference!
  this.warp = data.warp; // Copied by reference!
  this.spawnpoint = data.spawnpoint || []; // This is new so we should have a fail-safe.
  this.background = data.background || [];
  
  this.bumped = [];
  this.effects = [];
  this.vines = [];
  this.sounds = [];
  this.regens = []; // used by display to render time remaining
}

Zone.prototype.getLayer = function(z) {
  for (var i=0; i<this.layers.length; i++) {
    if (this.layers[i].z == z) {
      return this.layers[i];
    }
  }
};

Zone.prototype.getBgLayer = function(z) {
  for (var i=0; i<this.background.length; i++) {
    return this.background[i]; // since this is only used in initialization, get the first layer
  }
}

Zone.prototype.update = function(game, pid, level, zone, x, y, type) {
  var yo = this.dimensions().y-1-y;
  var td = td32.decode(this.mainLayer.data[yo][x]);
  td.definition.TRIGGER(game, pid, td, level, zone, x, y, type);
};

Zone.prototype.step = function() {
  /* Update Bumps */
  for(var i=0;i<this.bumped.length;i++) {
    var e = this.bumped[i];
    var td = td32.decode(this.mainLayer.data[e.y][e.x]);
    if(td.bump > 0) {
      this.mainLayer.data[e.y][e.x] = td32.bump(this.mainLayer.data[e.y][e.x], td.bump-0.5);
    }
    else {
      this.bumped.splice(i--,1);
    }
  }
  
  /* Update effects */
  for(var i=0;i<this.effects.length;i++) {
    var fx = this.effects[i];
    if(fx.garbage) { this.effects.splice(i--,1); }
    else { fx.step(); }
  }
  
  /* Grow vines */
  for(var i=0;i<this.vines.length;i++) {
    var vn = this.vines[i];
    if(vn.y < 0) { this.vines.splice(i--, 1); continue; }
    this.mainLayer.data[vn.y--][vn.x] = vn.td;
  }
  
  /* Update Sounds */
  for(var i=0;i<this.sounds.length;i++) {
    var snd = this.sounds[i];
    if(snd.done()) { this.sounds.splice(i--, 1); }
  }

  /* Update regen timers */
  for(var i=0;i<this.regens.length;i++) {
    var rgn = this.regens[i];
    if(--rgn.time < 0) { this.regens.splice(i--, 1); }
  }
  
  /* !!! Snitch !!! */
  td32.update(this.game);
};

/* returns raw data of tile (as an int) */
Zone.prototype.tile = function(x,y) {
  var yo = this.dimensions().y-1-y;
  return this.mainLayer.data[yo][x];
};

Zone.prototype.bump = function(x,y) {
  var yo = this.dimensions().y-1-y;
  this.mainLayer.data[yo][x] = td32.bump(this.mainLayer.data[yo][x], 15);
  this.bumped.push({x: x, y: yo});
  this.play(x,y,"bump.mp3", .5, .04);
};

Zone.prototype.replace = function(x,y,td) {
  var yo = this.dimensions().y-1-y;
  this.mainLayer.data[yo][x] = td;
};

Zone.prototype.flip = function(x,y,sprite) {
  var that = this;
  var yo = this.dimensions().y-1-y;
  var air = [sprite, 0, 0, 0, 0]; // flip blocks are just animated air tiles when hit
  var cur = this.mainLayer.data[yo][x];

  this.mainLayer.data[yo][x] = air;
  setTimeout(function() {
    that.mainLayer.data[yo][x] = cur;
  }, 5000);
};

Zone.prototype.regen = function(x,y,td) {
  var that = this;
  var yo = this.dimensions().y-1-y;
  this.regens.push({x: x, y: yo, time: 300});
  setTimeout(function() {
    that.mainLayer.data[yo][x] = td;
  }, 5000);
};

Zone.prototype.grow = function(x,y,td) {
  var yo = this.dimensions().y-1-y;
  this.vines.push({x: x, y: yo, td: td});
};

Zone.prototype.break = function(x,y,td) {
  var yo = this.dimensions().y-1-y;
  var orig = td32.decode16(this.mainLayer.data[yo][x]);
  this.mainLayer.data[yo][x] = td;
  this.effects.push(new BreakEffect(vec2.make(x,y), orig.index));
  this.play(x,y,"break.mp3", 1.5, .04);
};

Zone.prototype.coin = function(x,y) {
  var yo = this.dimensions().y-1-y;
  this.effects.push(new CoinEffect(vec2.make(x,y)));
};

Zone.prototype.play = function(x,y,path,gain,shift) {
  if(this.game.getZone() !== this) { return; }              // Don't play sounds in areas the player/camera aren't in
  var sfx = this.game.audio.getSpatialAudio(path, gain, shift, "effect");
  sfx.play(vec2.make(x,y));
  this.sounds.push(sfx);
};

/* Returns width and height of the zone in tiles. */
Zone.prototype.dimensions = function() {
  return vec2.make(this.layers[0].data[0].length, this.layers[0].data.length);
};

/* Returns a single tile at the given position. Pos is world coordiantes! */
Zone.prototype.getTile = function(pos) {
  var zd = this.dimensions();
  var cpos = vec2.copy(pos);
  cpos.y = zd.y - cpos.y -1;
  
  return td32.decode(this.mainLayer.data[Math.max(0, Math.min(zd.y, Math.floor(cpos.y)))][Math.max(0, Math.min(zd.x, Math.floor(cpos.x)))]);
};

/* Returns an array of all tiles in an area with position <vec2 pos> width/height <vec2 dim> */
/* +y dimension is up, specifying because of a confusing bug */
Zone.prototype.getTiles = function(pos, dim) {
  var zd = this.dimensions();
  var cpos = vec2.copy(pos);
  cpos.y = zd.y - cpos.y; // Might be a bug... maybe -1?
  
  var x1 = parseInt(Math.max(Math.min(Math.floor(cpos.x)-1, zd.x), 0.));
  var x2 = parseInt(Math.max(Math.min(Math.ceil(cpos.x+dim.x)+1, zd.x), 0.));
  var y1 = parseInt(Math.max(Math.min(Math.floor(cpos.y-dim.y)-1, zd.y), 0.));
  var y2 = parseInt(Math.max(Math.min(Math.ceil(cpos.y)+1, zd.y), 0.));
  
  var tiles = [];
  
  for(var i=y1;i<y2;i++) {
    for(var j=x1;j<x2;j++) {
      var td = td32.decode(this.mainLayer.data[i][j]);
      td.pos = vec2.make(j,zd.y-1.-i);
      td.ind = [i,j];
      tiles.push(td);
    }
  }
  
  return tiles;
};

Zone.prototype.getEffects = function(fxs) {
  for(var i=0;i<this.effects.length;i++) {
    this.effects[i].draw(fxs);
  }
};