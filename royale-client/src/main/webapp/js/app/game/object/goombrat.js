"use strict";
/* global util, vec2, squar */
/* global GameObject */
/* global NET011, NET020 */

function GoombratObject(game, level, zone, pos, oid) {
  GameObject.call(this, game, level, zone, pos);
  
  this.oid = oid; // Unique Object ID, is the shor2 of the spawn location
  
  this.setState(GoombratObject.STATE.RUN);
  
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
GoombratObject.ASYNC = false;
GoombratObject.ID = 0x10;
GoombratObject.NAME = "Goombrat"; // Used by editor

GoombratObject.ANIMATION_RATE = 10;

GoombratObject.ENABLE_FADE_TIME = 15;
GoombratObject.ENABLE_DIST = 26;          // Distance to player needed for proximity to trigger and the enemy to be enabled

GoombratObject.DEAD_TIME = 60;
GoombratObject.BONK_TIME = 90;
GoombratObject.BONK_IMP = vec2.make(0.25, 0.4);
GoombratObject.BONK_DECEL = 0.925;
GoombratObject.BONK_FALL_SPEED = 0.25;

GoombratObject.MOVE_SPEED_MAX = 0.0375;

GoombratObject.FALL_SPEED_MAX = 0.175;
GoombratObject.FALL_SPEED_ACCEL = 0.085;

GoombratObject.SPRITE = {};
GoombratObject.SPRITE_LIST = [
  {NAME: "RUN0", ID: 0x00, INDEX: 64},
  {NAME: "RUN1", ID: 0x01, INDEX: 65},
  {NAME: "FALL", ID: 0x02, INDEX: 64},
  {NAME: "DEAD", ID: 0x03, INDEX: 66}
];

/* Makes sprites easily referenceable by NAME. For sanity. */
for(var i=0;i<GoombratObject.SPRITE_LIST.length;i++) {
  GoombratObject.SPRITE[GoombratObject.SPRITE_LIST[i].NAME] = GoombratObject.SPRITE_LIST[i];
  GoombratObject.SPRITE[GoombratObject.SPRITE_LIST[i].ID] = GoombratObject.SPRITE_LIST[i];
}

GoombratObject.STATE = {};
GoombratObject.STATE_LIST = [
  {NAME: "RUN", ID: 0x00, SPRITE: [GoombratObject.SPRITE.RUN0,GoombratObject.SPRITE.RUN1]},
  {NAME: "FALL", ID: 0x01, SPRITE: [GoombratObject.SPRITE.FALL]},
  {NAME: "DEAD", ID: 0x50, SPRITE: [GoombratObject.SPRITE.DEAD]},
  {NAME: "BONK", ID: 0x51, SPRITE: []}
];

/* Makes states easily referenceable by either ID or NAME. For sanity. */
for(var i=0;i<GoombratObject.STATE_LIST.length;i++) {
  GoombratObject.STATE[GoombratObject.STATE_LIST[i].NAME] = GoombratObject.STATE_LIST[i];
  GoombratObject.STATE[GoombratObject.STATE_LIST[i].ID] = GoombratObject.STATE_LIST[i];
}


/* === INSTANCE ============================================================= */

GoombratObject.prototype.update = function(event) {
  /* Event trigger */
  switch(event) {
    case 0x00 : { this.kill(); break; }
    case 0x01 : { this.bonk(); break; }
    case 0xA0 : { this.enable(); break; }
  }
};

GoombratObject.prototype.step = function() {
  /* Disabled */
  if(this.disabled) { this.proximity(); return; }
  else if(this.disabledTimer > 0) { this.disabledTimer--; }
  
  /* Bonked */
  if(this.state === GoombratObject.STATE.BONK) {
    if(this.bonkTimer++ > GoombratObject.BONK_TIME || this.pos.y+this.dim.y < 0) { this.destroy(); return; }
    
    this.pos = vec2.add(this.pos, vec2.make(this.moveSpeed, this.fallSpeed));
    this.moveSpeed *= GoombratObject.BONK_DECEL;
    this.fallSpeed = Math.max(this.fallSpeed - GoombratObject.FALL_SPEED_ACCEL, -GoombratObject.BONK_FALL_SPEED);
    return;
  }
  
  /* Anim */
  this.anim++;
  this.sprite = this.state.SPRITE[parseInt(this.anim/GoombratObject.ANIMATION_RATE) % this.state.SPRITE.length];
  
  /* Dead */
  if(this.state === GoombratObject.STATE.DEAD) {
    if(this.deadTimer++ < GoombratObject.DEAD_TIME) { }
    else { this.destroy(); }
    return;
  }
  
  /* Normal Gameplay */
  this.control();
  this.physics();
  this.sound();
  
  if(this.pos.y < 0.) { this.destroy(); }
};

GoombratObject.prototype.control = function() {
  if(this.grounded && !this.checkGround()) { this.dir = !this.dir; }
  this.moveSpeed = this.dir ? -GoombratObject.MOVE_SPEED_MAX : GoombratObject.MOVE_SPEED_MAX;
  if(!this.grounded) { this.setState(GoombratObject.STATE.FALL); }
  else { this.setState(GoombratObject.STATE.RUN); }
};

GoombratObject.prototype.physics = function() {
  if(this.grounded) {
    this.fallSpeed = 0;
  }
  this.fallSpeed = Math.max(this.fallSpeed - GoombratObject.FALL_SPEED_ACCEL, -GoombratObject.FALL_SPEED_MAX);
  
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
    if(!tile.definition.COLLIDE) { continue; }
    
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
    if(!tile.definition.COLLIDE) { continue; }
    
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

GoombratObject.prototype.sound = GameObject.prototype.sound;

/* Looks at the ground in front of this goombrat and checks if it's solid. */
GoombratObject.prototype.checkGround = TroopaObject.prototype.checkGround;

/* Tests against client player to see if they are near enough that we should enable this enemy. */
/* On a successful test we send a object event 0xA0 to the server to trigger this enemy being enabled for all players */
GoombratObject.prototype.proximity = function() {
  var ply = this.game.getPlayer();
  if(ply && !ply.dead && ply.level === this.level && ply.zone === this.zone && !this.proxHit && vec2.distance(ply.pos, this.pos) < GoombratObject.ENABLE_DIST) {
    this.game.out.push(NET020.encode(this.level, this.zone, this.oid, 0xA0));
    this.proxHit = true;
  }
};

GoombratObject.prototype.enable = function() {
  if(!this.disabled) { return; }
  this.disabled = false;
  this.disabledTimer = GoombratObject.ENABLE_FADE_TIME;
};

GoombratObject.prototype.disable = function() {
  this.disabled = true;
};

GoombratObject.prototype.damage = function(p) { if(!this.dead) { this.bonk(); this.game.out.push(NET020.encode(this.level, this.zone, this.oid, 0x01)); } };

/* 'Bonked' is the type of death where an enemy flips upside down and falls off screen */
/* Generally triggred by shells, fireballs, etc */
GoombratObject.prototype.bonk = function() {
  if(this.dead) { return; }
  this.setState(GoombratObject.STATE.BONK);
  this.moveSpeed = GoombratObject.BONK_IMP.x;
  this.fallSpeed = GoombratObject.BONK_IMP.y;
  this.dead = true;
  this.play("kick.mp3", 1., .04);
};

GoombratObject.prototype.playerCollide = function(p) {
  if(this.dead || this.garbage) { return; }
  p.damage(this);
};

GoombratObject.prototype.playerStomp = function(p) {
  if(this.dead || this.garbage) { return; }
  this.kill();
  p.bounce();
  this.game.out.push(NET020.encode(this.level, this.zone, this.oid, 0x00));
};

GoombratObject.prototype.playerBump = function(p) {
  if(this.dead || this.garbage) { return; }
  p.damage(this);
};

GoombratObject.prototype.kill = function() {
  this.dead = true;
  this.setState(GoombratObject.STATE.DEAD);
  this.play("stomp.mp3", 1., .04);
};

GoombratObject.prototype.destroy = GameObject.prototype.destroy;
GoombratObject.prototype.isTangible = GameObject.prototype.isTangible;

GoombratObject.prototype.setState = function(STATE) {
  if(STATE === this.state) { return; }
  this.state = STATE;
  if(STATE.SPRITE.length > 0) { this.sprite = STATE.SPRITE[0]; }
  this.anim = 0;
};

GoombratObject.prototype.draw = function(sprites) {
  /* Disabled */
  if(this.disabled) { return; }

  var mod;
  if(this.state === GoombratObject.STATE.BONK) { mod = 0x03; }
  else if(this.disabledTimer > 0) { mod = 0xA0 + parseInt((1.-(this.disabledTimer/GoombratObject.ENABLE_FADE_TIME))*32.); }
  else { mod = 0x00; }
  
  if(this.sprite.INDEX instanceof Array) {
    var s = this.sprite.INDEX;
    for(var i=0;i<s.length;i++) {
      for(var j=0;j<s[i].length;j++) {
        var sp = s[!mod?i:(s.length-1-i)][j];
        sprites.push({pos: vec2.add(this.pos, vec2.make(j,i)), reverse: !this.dir, index: sp, mode: mod});
      }
    }
  }
  else {
    var sp = this.sprite.INDEX;
    sprites.push({pos: this.pos, reverse: !this.dir, index: sp, mode: mod});
  }
};

GoombratObject.prototype.play = GameObject.prototype.play;

/* Register object class */
GameObject.REGISTER_OBJECT(GoombratObject);