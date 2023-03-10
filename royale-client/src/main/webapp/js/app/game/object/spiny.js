"use strict";
/* global util, vec2, squar */
/* global GameObject */
/* global NET011, NET020 */

function SpinyObject(game, level, zone, pos, oid, variant) {
  GameObject.call(this, game, level, zone, pos);
  
  this.oid = oid; // Unique Object ID, is the shor2 of the spawn location
  
  this.variant = isNaN(parseInt(variant))?0:parseInt(variant);
  this.setState(SpinyObject.STATE.RUN);
  
  /* Animation */
  this.anim = 0;
  
  /* Dead */
  this.deadTimer = 0;
  this.bonkTimer = 0;
  
  /* Physics */
  this.dim = vec2.make(1., 1.);
  this.moveSpeed = 0;
  this.fallSpeed = 0;
  this.grounded = false;
  
  /* Var */
  this.disabled = false;
  this.disabledTimer = 0;
  this.proxHit = false;    // So we don't send an enable event every single frame while waiting for server response.
  
  /* Control */
  this.dir = true; /* false = right, true = left */
  
  this.disable();
}


/* === STATIC =============================================================== */
SpinyObject.ASYNC = false;
SpinyObject.ID = 0x17;
SpinyObject.NAME = "Spiny"; // Used by editor
SpinyObject.PARAMS = [{'name': "Variant", 'type': "int", 'tooltip': "Variant of the spiny. 0 is normal and 1 is the 'Metal Spiny' and acts like the one from Mario Forever"}]

SpinyObject.ANIMATION_RATE = 10;
SpinyObject.VARIANT_OFFSET = 0x10;   //1 row down in the sprite sheet

SpinyObject.ENABLE_FADE_TIME = 15;
SpinyObject.ENABLE_DIST = 26;          // Distance to player needed for proximity to trigger and the enemy to be enabled

SpinyObject.DEAD_TIME = 60;
SpinyObject.BONK_TIME = 90;
SpinyObject.BONK_IMP = vec2.make(0.25, 0.4);
SpinyObject.BONK_DECEL = 0.925;
SpinyObject.BONK_FALL_SPEED = 0.25;

SpinyObject.MOVE_SPEED_MAX = 0.0375;

SpinyObject.FALL_SPEED_MAX = 0.175;
SpinyObject.FALL_SPEED_ACCEL = 0.085;

SpinyObject.SPRITE = {};
SpinyObject.SPRITE_LIST = [
  {NAME: "RUN0", ID: 0x00, INDEX: 166},
  {NAME: "RUN1", ID: 0x01, INDEX: 167},
  {NAME: "FALL", ID: 0x02, INDEX: 166},
  {NAME: "DEAD", ID: 0x03, INDEX: 166}
];

/* Makes sprites easily referenceable by NAME. For sanity. */
for(var i=0;i<SpinyObject.SPRITE_LIST.length;i++) {
  SpinyObject.SPRITE[SpinyObject.SPRITE_LIST[i].NAME] = SpinyObject.SPRITE_LIST[i];
  SpinyObject.SPRITE[SpinyObject.SPRITE_LIST[i].ID] = SpinyObject.SPRITE_LIST[i];
}

SpinyObject.STATE = {};
SpinyObject.STATE_LIST = [
  {NAME: "RUN", ID: 0x00, SPRITE: [SpinyObject.SPRITE.RUN0,SpinyObject.SPRITE.RUN1]},
  {NAME: "FALL", ID: 0x01, SPRITE: [SpinyObject.SPRITE.FALL]},
  {NAME: "DEAD", ID: 0x50, SPRITE: [SpinyObject.SPRITE.DEAD]},
  {NAME: "BONK", ID: 0x51, SPRITE: []}
];

/* Makes states easily referenceable by either ID or NAME. For sanity. */
for(var i=0;i<SpinyObject.STATE_LIST.length;i++) {
  SpinyObject.STATE[SpinyObject.STATE_LIST[i].NAME] = SpinyObject.STATE_LIST[i];
  SpinyObject.STATE[SpinyObject.STATE_LIST[i].ID] = SpinyObject.STATE_LIST[i];
}


/* === INSTANCE ============================================================= */

SpinyObject.prototype.update = function(event) {
  /* Event trigger */
  switch(event) {
    case 0x00 : { this.kill(); break; }
    case 0x01 : { this.bonk(); break; }
    case 0xA0 : { this.enable(); break; }
  }
};

SpinyObject.prototype.step = function() {
  /* Disabled */
  if(this.disabled) { this.proximity(); return; }
  else if(this.disabledTimer > 0) { this.disabledTimer--; }
  
  /* Bonked */
  if(this.state === SpinyObject.STATE.BONK) {
    if(this.bonkTimer++ > SpinyObject.BONK_TIME || this.pos.y+this.dim.y < 0) { this.destroy(); return; }
    
    this.pos = vec2.add(this.pos, vec2.make(this.moveSpeed, this.fallSpeed));
    this.moveSpeed *= SpinyObject.BONK_DECEL;
    this.fallSpeed = Math.max(this.fallSpeed - SpinyObject.FALL_SPEED_ACCEL, -SpinyObject.BONK_FALL_SPEED);
    return;
  }
  
  /* Anim */
  this.anim++;
  this.sprite = this.state.SPRITE[parseInt(this.anim/SpinyObject.ANIMATION_RATE) % this.state.SPRITE.length];
  
  /* Dead */
  if(this.state === SpinyObject.STATE.DEAD) {
    if(this.deadTimer++ < SpinyObject.DEAD_TIME) { }
    else { this.destroy(); }
    return;
  }
  
  /* Normal Gameplay */
  this.control();
  this.physics();
  this.sound();
  
  if(this.pos.y < -2.) { this.destroy(); }
};

SpinyObject.prototype.control = function() {
  this.moveSpeed = this.dir ? -SpinyObject.MOVE_SPEED_MAX : SpinyObject.MOVE_SPEED_MAX;
  if(!this.grounded) { this.setState(SpinyObject.STATE.FALL); }
  else { this.setState(SpinyObject.STATE.RUN); }
};

SpinyObject.prototype.physics = function() {
  if(this.grounded) {
    this.fallSpeed = 0;
  }
  this.fallSpeed = Math.max(this.fallSpeed - SpinyObject.FALL_SPEED_ACCEL, -SpinyObject.FALL_SPEED_MAX);
  
  var movx = vec2.add(this.pos, vec2.make(this.moveSpeed, 0.));
  var movy = vec2.add(this.pos, vec2.make(this.moveSpeed, this.fallSpeed));
  
  var ext1 = vec2.make(this.moveSpeed>=0?this.pos.x:this.pos.x+this.moveSpeed, this.fallSpeed<=0?this.pos.y:this.pos.y+this.fallSpeed);
  var ext2 = vec2.make(this.dim.y+Math.abs(this.moveSpeed), this.dim.y+Math.abs(this.fallSpeed));
  var tiles = this.game.world.getZone(this.level, this.zone).getTiles(ext1, ext2);
  var tdim = vec2.make(1., 1.);
  
  var changeDir = false;
  this.grounded = false;
  for(var i=0;i<tiles.length;i++) {
    var tile = tiles[i];
    if(!tile.definition.COLLIDE || tile.definition.HIDDEN) { continue; }
    
    var hitx = squar.intersection(tile.pos, tdim, movx, this.dim);
    
    if(hitx) {
      if(this.pos.x <= movx.x && movx.x + this.dim.x > tile.pos.x) {
        movx.x = tile.pos.x - this.dim.x;
        movy.x = movx.x;
        this.moveSpeed = 0;
        changeDir = true;
      }
      else if(this.pos.x >= movx.x && movx.x < tile.pos.x + tdim.x) {
        movx.x = tile.pos.x + tdim.x;
        movy.x = movx.x;
        this.moveSpeed = 0;
        changeDir = true;
      }
    }
  }
    
  for(var i=0;i<tiles.length;i++) {
    var tile = tiles[i];
    if(!tile.definition.COLLIDE || tile.definition.HIDDEN) { continue; }
    
    var hity = squar.intersection(tile.pos, tdim, movy, this.dim);
    
    if(hity) {
      if(this.pos.y >= movy.y && movy.y < tile.pos.y + tdim.y) {
        movy.y = tile.pos.y + tdim.y;
        this.fallSpeed = 0;
        this.grounded = true;
      }
      else if(this.pos.y <= movy.y && movy.y + this.dim.y > tile.pos.y) {
        movy.y = tile.pos.y - this.dim.y;
        this.fallSpeed = 0;
      }
    }
  }
  this.pos = vec2.make(movx.x, movy.y);
  if(changeDir) { this.dir = !this.dir; }
};

SpinyObject.prototype.sound = GameObject.prototype.sound;

/* Tests against client player to see if they are near enough that we should enable this enemy. */
/* On a successful test we send a object event 0xA0 to the server to trigger this enemy being enabled for all players */
SpinyObject.prototype.proximity = function() {
  var ply = this.game.getPlayer();
  if(ply && !ply.dead && ply.level === this.level && ply.zone === this.zone && !this.proxHit && vec2.distance(ply.pos, this.pos) < SpinyObject.ENABLE_DIST) {
    this.game.out.push(NET020.encode(this.level, this.zone, this.oid, 0xA0));
    this.proxHit = true;
  }
};

SpinyObject.prototype.enable = function() {
  if(!this.disabled) { return; }
  this.disabled = false;
  this.disabledTimer = SpinyObject.ENABLE_FADE_TIME;
};

SpinyObject.prototype.disable = function() {
  this.disabled = true;
};

SpinyObject.prototype.damage = function(p) {
  if(!this.dead) {
    if(this.variant === 1 && p instanceof FireballProj) { return; }
    this.bonk();
    this.game.out.push(NET020.encode(this.level, this.zone, this.oid, 0x01));
  }
};

/* 'Bonked' is the type of death where an enemy flips upside down and falls off screen */
/* Generally triggred by shells, fireballs, etc */
SpinyObject.prototype.bonk = function() {
  if(this.dead) { return; }
  this.setState(SpinyObject.STATE.BONK);
  this.moveSpeed = SpinyObject.BONK_IMP.x;
  this.fallSpeed = SpinyObject.BONK_IMP.y;
  this.dead = true;
  this.play("kick.mp3", 1., .04);
};

SpinyObject.prototype.playerCollide = function(p) {
  if(this.dead || this.garbage) { return; }
  p.damage(this);
};

SpinyObject.prototype.playerStomp = SpinyObject.prototype.playerCollide;
SpinyObject.prototype.playerBump = SpinyObject.prototype.playerCollide;

SpinyObject.prototype.kill = function() {
  this.dead = true;
  this.setState(SpinyObject.STATE.DEAD);
  this.play("stomp.mp3", 1., .04);
};

SpinyObject.prototype.destroy = GameObject.prototype.destroy;
SpinyObject.prototype.isTangible = GameObject.prototype.isTangible;

SpinyObject.prototype.setState = function(STATE) {
  if(STATE === this.state) { return; }
  this.state = STATE;
  if(STATE.SPRITE.length > 0) { this.sprite = STATE.SPRITE[0]; }
  this.anim = 0;
};

SpinyObject.prototype.draw = function(sprites) {
  /* Disabled */
  if(this.disabled) { return; }

  var mod;
  if(this.state === SpinyObject.STATE.BONK) { mod = 0x03; }
  else if(this.disabledTimer > 0) { mod = 0xA0 + parseInt((1.-(this.disabledTimer/SpinyObject.ENABLE_FADE_TIME))*32.); }
  else { mod = 0x00; }
  
  if(this.sprite.INDEX instanceof Array) {
    var s = this.sprite.INDEX;
    for(var i=0;i<s.length;i++) {
      for(var j=0;j<s[i].length;j++) {
        var sp = s[!mod?i:(s.length-1-i)][j];
        switch(this.variant) {
          case 1 : { sp += SpinyObject.VARIANT_OFFSET; break; }
          default : { break; }
        }
        sprites.push({pos: vec2.add(this.pos, vec2.make(j,i)), reverse: !this.dir, index: sp, mode: mod});
      }
    }
  }
  else {
    var sp = this.sprite.INDEX;
    switch(this.variant) {
      case 1 : { sp += SpinyObject.VARIANT_OFFSET; break; }
      default : { break; }
    }
    sprites.push({pos: this.pos, reverse: !this.dir, index: sp, mode: mod});
  }
};

SpinyObject.prototype.play = GameObject.prototype.play;

/* Register object class */
GameObject.REGISTER_OBJECT(SpinyObject);