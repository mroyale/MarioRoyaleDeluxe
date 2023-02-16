"use strict";
/* global util, vec2, squar */
/* global GameObject, FireballProj, PlayerObject */
/* global NET011, NET020 */

function FireHammerObject(game, level, zone, pos, oid, reverse) {
  GameObject.call(this, game, level, zone, pos);
  
  this.oid = oid; // Unique Object ID, is the shor2 of the spawn location
  
  this.setState(FireHammerObject.STATE.IDLE);
  
  /* Animation */
  this.anim = 0;
  
  /* Dead */
  this.bonkTimer = 0;
  
  /* Physics */
  this.dim = vec2.make(1., 1.5);
  this.moveSpeed = 0;
  this.fallSpeed = 0;
  this.grounded = false;
  
  /* Var */
  this.disabled = false;
  this.disabledTimer = 0;
  this.proxHit = false;    // So we don't send an enable event every single frame while waiting for server response.
  
  this.hammer = undefined;  // last hammer obj we threw
  
  /* Control */
  this.loc = parseInt(reverse)===1?
    [this.pos.x + FireHammerObject.MOVE_AREA, this.pos.x]:
    [this.pos.x, this.pos.x - FireHammerObject.MOVE_AREA];
  this.attackTimer = 0;
  this.attackAnimTimer = 0;
  this.double = 0;
  this.groundTimer = 0;
  this.jumpTimer = -1;
  this.reverse = false; /* direction bro is moving */
  this.dir = true;
  
  this.disable();
}

/* === STATIC =============================================================== */
FireHammerObject.ASYNC = false;
FireHammerObject.ID = 0x32;
FireHammerObject.NAME = "Fire Bro"; // Used by editor

FireHammerObject.ANIMATION_RATE = 10;

FireHammerObject.ENABLE_FADE_TIME = 15;
FireHammerObject.ENABLE_DIST = 33;          // Distance to player needed for proximity to trigger and the enemy to be enabled

FireHammerObject.BONK_TIME = 90;
FireHammerObject.BONK_IMP = vec2.make(0.25, 0.4);
FireHammerObject.BONK_DECEL = 0.925;
FireHammerObject.BONK_FALL_SPEED = 0.25;

FireHammerObject.MOVE_SPEED_MAX = 0.0475;
FireHammerObject.JUMP_DELAY = 110;        // Time between jumps
FireHammerObject.MOVE_AREA = 4;          // 4 Blocks horizontal area
FireHammerObject.JUMP_LENGTH = 8;        // Length of jump
FireHammerObject.JUMP_DECEL = 0.009;     // Jump deceleration
FireHammerObject.ATTACK_DELAY = 150;      // Time between attacks
FireHammerObject.DOUBLE_RATE = 5;        // How many attacks till a double attack
FireHammerObject.DOUBLE_ANIM_LENGTH = 4;
FireHammerObject.ATTACK_ANIM_LENGTH = 2;
FireHammerObject.PROJ_OFFSET = vec2.make(0, 1.);
    
FireHammerObject.FALL_SPEED_MAX = 0.3;
FireHammerObject.FALL_SPEED_ACCEL = 0.085;

FireHammerObject.SPRITE = {};
FireHammerObject.SPRITE_LIST = [
  {NAME: "IDLE0", ID: 0x00, INDEX: [[0x004D],[0x003D]]},
  {NAME: "IDLE1", ID: 0x01, INDEX: [[0x004C],[0x003C]]},
  {NAME: "ATTACK", ID: 0x02, INDEX: [[0x004B],[0x003B]]}
];

/* Makes sprites easily referenceable by NAME. For sanity. */
for(var i=0;i<FireHammerObject.SPRITE_LIST.length;i++) {
  FireHammerObject.SPRITE[FireHammerObject.SPRITE_LIST[i].NAME] = FireHammerObject.SPRITE_LIST[i];
  FireHammerObject.SPRITE[FireHammerObject.SPRITE_LIST[i].ID] = FireHammerObject.SPRITE_LIST[i];
}

FireHammerObject.STATE = {};
FireHammerObject.STATE_LIST = [
  {NAME: "IDLE", ID: 0x00, SPRITE: [FireHammerObject.SPRITE.IDLE0,FireHammerObject.SPRITE.IDLE1]},
  {NAME: "FALL", ID: 0x01, SPRITE: [FireHammerObject.SPRITE.IDLE1]},
  {NAME: "ATTACK", ID: 0x02, SPRITE: [FireHammerObject.SPRITE.ATTACK]},
  {NAME: "BONK", ID: 0x51, SPRITE: []}
];

/* Makes states easily referenceable by either ID or NAME. For sanity. */
for(var i=0;i<FireHammerObject.STATE_LIST.length;i++) {
  FireHammerObject.STATE[FireHammerObject.STATE_LIST[i].NAME] = FireHammerObject.STATE_LIST[i];
  FireHammerObject.STATE[FireHammerObject.STATE_LIST[i].ID] = FireHammerObject.STATE_LIST[i];
}

/* === INSTANCE ============================================================= */

FireHammerObject.prototype.update = function(event) {
  /* Event trigger */
  switch(event) {
    case 0x01 : { this.bonk(); break; }
    case 0xA0 : { this.enable(); break; }
  }
};

FireHammerObject.prototype.step = function() {
  /* Disabled */
  if(this.disabled) { this.proximity(); return; }
  else if(this.disabledTimer > 0) { this.disabledTimer--; }
  
  /* Bonked */
  if(this.state === FireHammerObject.STATE.BONK) {
    if(this.bonkTimer++ > FireHammerObject.BONK_TIME || this.pos.y+this.dim.y < 0) { this.destroy(); return; }
    
    this.pos = vec2.add(this.pos, vec2.make(this.moveSpeed, this.fallSpeed));
    this.moveSpeed *= FireHammerObject.BONK_DECEL;
    this.fallSpeed = Math.max(this.fallSpeed - FireHammerObject.FALL_SPEED_ACCEL, -FireHammerObject.BONK_FALL_SPEED);
    return;
  }

  /* Anim */
  this.anim++;
  this.sprite = this.state.SPRITE[parseInt(this.anim/FireHammerObject.ANIMATION_RATE) % this.state.SPRITE.length];
  
  /* Normal Gameplay */
  this.face();
  this.control();
  this.physics();
  this.sound();
  
  if(this.attackAnimTimer > 0) { this.setState(FireHammerObject.STATE.ATTACK); this.attach(); this.attackAnimTimer--; }
  else if(this.attackTimer++ > FireHammerObject.ATTACK_DELAY) { this.attack(); this.play("fireball.mp3", 1., .04); }
  else { this.hammer = undefined; }
  
  if(this.pos.y < -2.) { this.destroy(); }
};

FireHammerObject.prototype.control = function() {
  if(this.grounded) {
    if(FireHammerObject.JUMP_DELAY < this.groundTimer++) { this.jumpTimer = 0; this.groundTimer = 0; }
    if(this.pos.x > this.loc[0]) { this.reverse = true; }
    else if(this.pos.x < this.loc[1]) { this.reverse = false; }
  }
  else if(this.jumpTimer > FireHammerObject.JUMP_LENGTH) {
    this.jumpTimer = -1;
  }
  
  if(!this.grounded) { this.setState(FireHammerObject.STATE.FALL); }
  else { this.setState(FireHammerObject.STATE.IDLE); }

  this.moveSpeed = (this.moveSpeed * .75) + ((this.reverse ? -FireHammerObject.MOVE_SPEED_MAX : FireHammerObject.MOVE_SPEED_MAX) * .25);  // Rirp
};

FireHammerObject.prototype.physics = function() {
  if(this.jumpTimer !== -1) {
    this.fallSpeed = FireHammerObject.FALL_SPEED_MAX - (this.jumpTimer*FireHammerObject.JUMP_DECEL);
    this.jumpTimer++;
    this.grounded = false;
  }
  else {
    if(this.grounded) { this.fallSpeed = 0; }
    this.fallSpeed = Math.max(this.fallSpeed - FireHammerObject.FALL_SPEED_ACCEL, -FireHammerObject.FALL_SPEED_MAX);
  }
  
  var movx = vec2.add(this.pos, vec2.make(this.moveSpeed, 0.));
  var movy = vec2.add(this.pos, vec2.make(this.moveSpeed, this.fallSpeed));
  
  var ext1 = vec2.make(this.moveSpeed>=0?this.pos.x:this.pos.x+this.moveSpeed, this.fallSpeed<=0?this.pos.y:this.pos.y+this.fallSpeed);
  var ext2 = vec2.make(this.dim.y+Math.abs(this.moveSpeed), this.dim.y+Math.abs(this.fallSpeed));
  var tiles = this.game.world.getZone(this.level, this.zone).getTiles(ext1, ext2);
  var tdim = vec2.make(1., 1.);
  
  this.grounded = false;
  for(var i=0;i<tiles.length;i++) {
    var tile = tiles[i];
    if(!tile.definition.COLLIDE || tile.definition.HIDDEN) { continue; }
    
    var hitx = squar.intersection(tile.pos, tdim, movx, this.dim);
    
    if(hitx) {
      if(this.pos.x + this.dim.x <= tile.pos.x && movx.x + this.dim.x > tile.pos.x) {
        movx.x = tile.pos.x - this.dim.x;
        movy.x = movx.x;
        this.moveSpeed = 0;
      }
      else if(this.pos.x >= tile.pos.x + tdim.x && movx.x < tile.pos.x + tdim.x) {
        movx.x = tile.pos.x + tdim.x;
        movy.x = movx.x;
        this.moveSpeed = 0;
      }
    }
  }
    
  for(var i=0;i<tiles.length;i++) {
    var tile = tiles[i];
    if(!tile.definition.COLLIDE || tile.definition.HIDDEN) { continue; }
    
    var hity = squar.intersection(tile.pos, tdim, movy, this.dim);
    
    if(hity) {
      if(this.pos.y >= tile.pos.y + tdim.y && movy.y < tile.pos.y + tdim.y) {
        movy.y = tile.pos.y + tdim.y;
        this.fallSpeed = 0;
        this.grounded = true;
      }
      else if(this.pos.y + this.dim.y <= tile.pos.y && movy.y + this.dim.y > tile.pos.y) {
        movy.y = tile.pos.y - this.dim.y;
        this.jumpTimer = -1;
        this.fallSpeed = 0;
      }
    }
  }
  this.pos = vec2.make(movx.x, movy.y);
};

/* Tests against client player to see if they are near enough that we should enable this enemy. */
/* On a successful test we send a object event 0xA0 to the server to trigger this enemy being enabled for all players */
FireHammerObject.prototype.proximity = function() {
  var ply = this.game.getPlayer();
  if(ply && !ply.dead && ply.level === this.level && ply.zone === this.zone && !this.proxHit && vec2.distance(ply.pos, this.pos) < FireHammerObject.ENABLE_DIST) {
    this.game.out.push(NET020.encode(this.level, this.zone, this.oid, 0xA0));
    this.proxHit = true;
  }
};

/* Face nearest player */
FireHammerObject.prototype.face = function() {
  var nearest;
  for(var i=0;i<this.game.objects.length;i++) {
     var obj = this.game.objects[i];
     if(obj instanceof PlayerObject && obj.level === this.level && obj.zone === this.zone && obj.isTangible()) {
       if(!nearest || Math.abs(nearest) > vec2.distance(obj.pos, this.pos)) { nearest = obj.pos.x - this.pos.x; }
     }
  }
  if(!nearest) { this.dir = true; }
  else { this.dir = nearest<0; }
};

FireHammerObject.prototype.sound = GameObject.prototype.sound;

FireHammerObject.prototype.enable = function() {
  if(!this.disabled) { return; }
  this.disabled = false;
  this.disabledTimer = FireHammerObject.ENABLE_FADE_TIME;
};

FireHammerObject.prototype.disable = function() {
  this.disabled = true;
};

FireHammerObject.prototype.attack = function() {
  this.attackAnimTimer = FireHammerObject.ATTACK_ANIM_LENGTH;
  this.attackTimer = 0;
  this.hammer = this.game.createObject(FireballProj.ID, this.level, this.zone, vec2.add(this.pos, FireHammerObject.PROJ_OFFSET), [this]);
  this.hammer.owner = this;
  if(++this.double > FireHammerObject.DOUBLE_RATE) { this.double = 0; this.attackTimer = FireHammerObject.ATTACK_DELAY; }
};

/* Keeps the hammer we are throwing attached to us until it's time to actually throw it */
FireHammerObject.prototype.attach = function() {
  if(this.hammer) { this.hammer.pos = vec2.add(this.pos, FireHammerObject.PROJ_OFFSET); this.hammer.dir = !this.dir; }
};

FireHammerObject.prototype.playerCollide = function(p) {
  if(this.dead || this.garbage) { return; }
  p.damage(this);
};

FireHammerObject.prototype.playerStomp = function(p) {
  if(this.dead || this.garbage) { return; }
  this.bonk();
  p.bounce();
  this.game.out.push(NET020.encode(this.level, this.zone, this.oid, 0x01));
};

FireHammerObject.prototype.playerBump = FireHammerObject.prototype.playerCollide;

FireHammerObject.prototype.damage = function(p) { if(!this.dead) { this.bonk(); NET020.encode(this.level, this.zone, this.oid, 0x01); } };

/* 'Bonked' is the type of death where an enemy flips upside down and falls off screen */
/* Generally triggred by shells, fireballs, etc */
FireHammerObject.prototype.bonk = function() {
  if(this.dead) { return; }
  this.setState(FireHammerObject.STATE.BONK);
  this.moveSpeed = FireHammerObject.BONK_IMP.x;
  this.fallSpeed = FireHammerObject.BONK_IMP.y;
  this.dead = true;
  this.play("kick.mp3", 1., .04);
};

FireHammerObject.prototype.kill = function() { /* No standard killstate */ };
FireHammerObject.prototype.isTangible = GameObject.prototype.isTangible;
FireHammerObject.prototype.destroy = GameObject.prototype.destroy;

FireHammerObject.prototype.setState = function(STATE) {
  if(STATE === this.state) { return; }
  this.state = STATE;
  if(STATE.SPRITE.length > 0) { this.sprite = STATE.SPRITE[0]; }
  this.anim = 0;
};

FireHammerObject.prototype.draw = function(sprites) {
  /* Disabled */
  if(this.disabled) { return; }
  
  var mod;
  if(this.state === FireHammerObject.STATE.BONK) { mod = 0x03; }
  else if(this.disabledTimer > 0) { mod = 0xA0 + parseInt((1.-(this.disabledTimer/FireHammerObject.ENABLE_FADE_TIME))*32.); }
  else { mod = 0x00; }
  
  if(this.sprite.INDEX instanceof Array) {
    var s = this.sprite.INDEX;
    for(var i=0;i<s.length;i++) {
      for(var j=0;j<s[i].length;j++) {
        sprites.push({pos: vec2.add(this.pos, vec2.make(j,i)), reverse: !this.dir, index: s[mod!==0x03?i:(s.length-1-i)][j], mode: mod});
      }
    }
  }
  else { sprites.push({pos: this.pos, reverse: !this.dir, index: this.sprite.INDEX, mode: mod}); }
};

FireHammerObject.prototype.play = GameObject.prototype.play;

/* Register object class */
GameObject.REGISTER_OBJECT(FireHammerObject);
