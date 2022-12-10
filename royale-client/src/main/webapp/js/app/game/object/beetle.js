"use strict";
/* global util, vec2, squar */
/* global GameObject, PlayerObject */
/* global NET011, NET020 */

function BeetleObject(game, level, zone, pos, oid) {
  GameObject.call(this, game, level, zone, pos);
  
  this.oid = oid; // Unique Object ID, is the shor2 of the spawn location
  
  this.setState(BeetleObject.STATE.RUN);
  
  /* Animation */
  this.anim = 0;
  
  /* Dead */
  this.bonkTimer = 0;
  
  /* Physics */
  this.dim = vec2.make(1., 1.);
  this.moveSpeed = 0;
  this.fallSpeed = 0;
  this.grounded = false;
  this.jump = -1;
  
  /* Var */
  this.disabled = false;
  this.disabledTimer = 0;
  this.proxHit = false;    // So we don't send an enable event every single frame while waiting for server response.
  
  this.immuneTimer = 0;
  
  /* Control */
  this.dir = true; /* false = right, true = left */
  
  this.disable();
}


/* === STATIC =============================================================== */
BeetleObject.ASYNC = false;
BeetleObject.ID = 0x18;
BeetleObject.NAME = "Buzzy Beetle"; // Used by editor

BeetleObject.ANIMATION_RATE = 6;

BeetleObject.ENABLE_FADE_TIME = 15;
BeetleObject.ENABLE_DIST = 26;          // Distance to player needed for proximity to trigger and the enemy to be enabled

BeetleObject.BONK_TIME = 90;
BeetleObject.BONK_IMP = vec2.make(0.25, 0.4);
BeetleObject.BONK_DECEL = 0.925;
BeetleObject.BONK_FALL_SPEED = 0.25;

BeetleObject.PLAYER_IMMUNE_TIME = 12;  // Player is immune to damage for this many frames after bouncing off or kicking this enemy

BeetleObject.MOVE_SPEED_MAX = 0.0375;
BeetleObject.SHELL_MOVE_SPEED_MAX = 0.175;

BeetleObject.FALL_SPEED_MAX = 0.175;
BeetleObject.FALL_SPEED_ACCEL = 0.085;

BeetleObject.JUMP_LENGTH_MAX = 20;
BeetleObject.JUMP_DECEL = 0.025;

BeetleObject.TRANSFORM_TIME = 350;
BeetleObject.TRANSFORM_THRESHOLD = 150;

BeetleObject.SPRITE = {};
BeetleObject.SPRITE_LIST = [
  {NAME: "RUN0", ID: 0x02, INDEX: 0x007D},
  {NAME: "RUN1", ID: 0x03, INDEX: 0x007C},
  {NAME: "TRANSFORM", ID: 0x04, INDEX: 0x0078},
  {NAME: "SHELL", ID: 0x05, INDEX: 0x0078},
  {NAME: "SPIN0", ID: 0x06, INDEX: 0x0078},
  {NAME: "SPIN1", ID: 0x07, INDEX: 0x0077},
  {NAME: "SPIN2", ID: 0x08, INDEX: 0x0076},
  {NAME: "SPIN3", ID: 0x09, INDEX: 0x0075},
];

/* Makes sprites easily referenceable by NAME. For sanity. */
for(var i=0;i<BeetleObject.SPRITE_LIST.length;i++) {
  BeetleObject.SPRITE[BeetleObject.SPRITE_LIST[i].NAME] = BeetleObject.SPRITE_LIST[i];
  BeetleObject.SPRITE[BeetleObject.SPRITE_LIST[i].ID] = BeetleObject.SPRITE_LIST[i];
}

BeetleObject.STATE = {};
BeetleObject.STATE_LIST = [
  {NAME: "RUN", ID: 0x01, SPRITE: [BeetleObject.SPRITE.RUN0,BeetleObject.SPRITE.RUN1]},
  {NAME: "TRANSFORM", ID: 0x02, SPRITE: [BeetleObject.SPRITE.SHELL,BeetleObject.SPRITE.TRANSFORM]},
  {NAME: "SHELL", ID: 0x03, SPRITE: [BeetleObject.SPRITE.SHELL]},
  {NAME: "SPIN", ID: 0x04, SPRITE: [BeetleObject.SPRITE.SPIN0,BeetleObject.SPRITE.SPIN1,BeetleObject.SPRITE.SPIN2,BeetleObject.SPRITE.SPIN3]},
  {NAME: "BONK", ID: 0x51, SPRITE: []}
];

/* Makes states easily referenceable by either ID or NAME. For sanity. */
for(var i=0;i<BeetleObject.STATE_LIST.length;i++) {
  BeetleObject.STATE[BeetleObject.STATE_LIST[i].NAME] = BeetleObject.STATE_LIST[i];
  BeetleObject.STATE[BeetleObject.STATE_LIST[i].ID] = BeetleObject.STATE_LIST[i];
}


/* === INSTANCE ============================================================= */

BeetleObject.prototype.update = function(event) {
  /* Event trigger */
  switch(event) {
    case 0x01 : { this.bonk(); break; }
    case 0x10 : { this.stomped(true); break; }
    case 0x11 : { this.stomped(false); break; }
    case 0xA0 : { this.enable(); break; }
  }
};

BeetleObject.prototype.step = function() {
  /* Disabled */
  if(this.disabled) { this.proximity(); return; }
  else if(this.disabledTimer > 0) { this.disabledTimer--; }
  
  /* Bonked */
  if(this.state === BeetleObject.STATE.BONK) {
    if(this.bonkTimer++ > BeetleObject.BONK_TIME || this.pos.y+this.dim.y < 0) { this.destroy(); return; }
    
    this.pos = vec2.add(this.pos, vec2.make(this.moveSpeed, this.fallSpeed));
    this.moveSpeed *= BeetleObject.BONK_DECEL;
    this.fallSpeed = Math.max(this.fallSpeed - BeetleObject.FALL_SPEED_ACCEL, -BeetleObject.BONK_FALL_SPEED);
    return;
  }
  
  /* Anim */
  this.anim++;
  this.sprite = this.state.SPRITE[parseInt(this.anim/BeetleObject.ANIMATION_RATE) % this.state.SPRITE.length];
  
  if(this.state === BeetleObject.STATE.SHELL || this.state === BeetleObject.STATE.TRANSFORM) {
    if(--this.transformTimer < BeetleObject.TRANSFORM_THRESHOLD) { this.setState(BeetleObject.STATE.TRANSFORM); }
    if(this.transformTimer <= 0) { this.setState(BeetleObject.STATE.RUN); }
  }
  
  /* Normal Gameplay */
  if(this.immuneTimer > 0) { this.immuneTimer--; }
  
  this.control();
  this.physics();
  this.interaction();
  this.sound();
  
  if(this.pos.y < 0.) { this.destroy(); }
};

BeetleObject.prototype.control = function() {
  if(this.state === BeetleObject.STATE.RUN) { this.moveSpeed = this.dir ? -BeetleObject.MOVE_SPEED_MAX : BeetleObject.MOVE_SPEED_MAX; }
  else if(this.state === BeetleObject.STATE.SPIN) { this.moveSpeed = this.dir ? -BeetleObject.SHELL_MOVE_SPEED_MAX : BeetleObject.SHELL_MOVE_SPEED_MAX; }
  else if(this.state === BeetleObject.STATE.SHELL || this.state === BeetleObject.STATE.TRANSFORM) { this.moveSpeed = 0; }
  
  if(this.jump > BeetleObject.JUMP_LENGTH_MAX) { this.jump = -1; }
};

BeetleObject.prototype.physics = function() {
  if(this.jump !== -1) {
    this.fallSpeed = BeetleObject.FALL_SPEED_MAX - (this.jump*BeetleObject.JUMP_DECEL);
    this.jump++;
    this.grounded = false;
  }
  else {
    if(this.grounded) { this.fallSpeed = 0; }
    this.fallSpeed = Math.max(this.fallSpeed - BeetleObject.FALL_SPEED_ACCEL, -BeetleObject.FALL_SPEED_MAX);
  }
  
  if(this.grounded) {
    this.fallSpeed = 0;
  }
  this.fallSpeed = Math.max(this.fallSpeed - BeetleObject.FALL_SPEED_ACCEL, -BeetleObject.FALL_SPEED_MAX);
  
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
      if(this.pos.x + this.dim.x <= tile.pos.x && movx.x + this.dim.x > tile.pos.x) {
        movx.x = tile.pos.x - this.dim.x;
        movy.x = movx.x;
        this.moveSpeed = 0;
        changeDir = true;
      }
      else if(this.pos.x >= tile.pos.x + tdim.x && movx.x < tile.pos.x + tdim.x) {
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
      if(this.pos.y >= tile.pos.y + tdim.y && movy.y < tile.pos.y + tdim.y) {
        movy.y = tile.pos.y + tdim.y;
        this.grounded = true;
      }
      else if(this.pos.y + this.dim.y <= tile.pos.y && movy.y + this.dim.y > tile.pos.y) {
        movy.y = tile.pos.y - this.dim.y;
        this.jump = -1;
        this.fallSpeed = 0;
      }
    }
  }
  this.pos = vec2.make(movx.x, movy.y);
  if(changeDir) { this.dir = !this.dir; }
};

BeetleObject.prototype.interaction = function() {
  if(this.state !== BeetleObject.STATE.SPIN) { return; }
  for(var i=0;i<this.game.objects.length;i++) {
    var obj = this.game.objects[i];
    if(obj === this || obj instanceof PlayerObject || !obj.isTangible() || !obj.damage) { continue; }  // Skip players and objects that lack a damage function to call
    if(obj.level === this.level && obj.zone === this.zone) {
      var hit = squar.intersection(obj.pos, obj.dim, this.pos, this.dim);
      if(hit) { obj.damage(this); }  // We don't sync this event since it's not a direct player interaction. It *should* synchronize naturally though.
    }
  }
};

/* Tests against client player to see if they are near enough that we should enable this enemy. */
/* On a successful test we send a object event 0xA0 to the server to trigger this enemy being enabled for all players */
BeetleObject.prototype.proximity = function() {
  var ply = this.game.getPlayer();
  if(ply && !ply.dead && ply.level === this.level && ply.zone === this.zone && !this.proxHit && vec2.distance(ply.pos, this.pos) < BeetleObject.ENABLE_DIST) {
    this.game.out.push(NET020.encode(this.level, this.zone, this.oid, 0xA0));
    this.proxHit = true;
  }
};

BeetleObject.prototype.sound = GameObject.prototype.sound;

BeetleObject.prototype.enable = function() {
  if(!this.disabled) { return; }
  this.disabled = false;
  this.disabledTimer = BeetleObject.ENABLE_FADE_TIME;
};

BeetleObject.prototype.disable = function() {
  this.disabled = true;
};

BeetleObject.prototype.damage = function(p) { if(!this.dead && !(p instanceof FireballProj)) { this.bonk(); this.game.out.push(NET020.encode(this.level, this.zone, this.oid, 0x01)); } };

/* 'Bonked' is the type of death where an enemy flips upside down and falls off screen */
/* Generally triggred by shells, fireballs, etc */
BeetleObject.prototype.bonk = function() {
  if(this.dead) { return; }
  this.setState(BeetleObject.STATE.BONK);
  this.moveSpeed = BeetleObject.BONK_IMP.x;
  this.fallSpeed = BeetleObject.BONK_IMP.y;
  this.dead = true;
  this.play("kick.mp3", 1., .04);
};

/* dir (true = left, false = right) */
BeetleObject.prototype.stomped = function(dir) {
  if(this.state === BeetleObject.STATE.RUN) { this.setState(BeetleObject.STATE.SHELL); this.transformTimer = BeetleObject.TRANSFORM_TIME; }
  else if(this.state === BeetleObject.STATE.SPIN) { this.setState(BeetleObject.STATE.SHELL); this.transformTimer = BeetleObject.TRANSFORM_TIME; }
  else if(this.state === BeetleObject.STATE.SHELL || this.state === BeetleObject.STATE.TRANSFORM) {
    this.setState(BeetleObject.STATE.SPIN);
    this.dir = dir;
    this.game.world.getZone(this.level, this.zone).effects.push(new DustEffect(this.pos));
  }
  this.play("stomp.mp3", 1., .04);
};

BeetleObject.prototype.playerCollide = function(p) {
  if(this.dead || this.garbage) { return; }
  if(this.state === BeetleObject.STATE.SHELL || this.state === BeetleObject.STATE.TRANSFORM) {
    var dir = p.pos.x-this.pos.x > 0;
    this.stomped(dir);
    this.game.out.push(NET020.encode(this.level, this.zone, this.oid, dir?0x10:0x11));
    this.immuneTimer = BeetleObject.PLAYER_IMMUNE_TIME;
  }
  else if(this.immuneTimer <= 0) { p.damage(this); }
};

BeetleObject.prototype.playerStomp = function(p) {
  if(this.dead || this.garbage) { return; }
  var dir = p.pos.x-this.pos.x > 0;
  p.bounce();
  this.stomped(dir);
  this.immuneTimer = BeetleObject.PLAYER_IMMUNE_TIME;
  this.game.out.push(NET020.encode(this.level, this.zone, this.oid, dir?0x10:0x11));
};

BeetleObject.prototype.playerBump = function(p) {
  if(this.dead || this.garbage) { return; }
  p.damage(this);
};

BeetleObject.prototype.kill = function() { };
BeetleObject.prototype.destroy = GameObject.prototype.destroy;
BeetleObject.prototype.isTangible = GameObject.prototype.isTangible;

BeetleObject.prototype.setState = function(STATE) {
  if(STATE === this.state) { return; }
  this.state = STATE;
  if(STATE.SPRITE.length > 0) { this.sprite = STATE.SPRITE[0]; }
  this.anim = 0;
};

BeetleObject.prototype.draw = function(sprites) {
  /* Disabled */
  if(this.disabled) { return; }
  
  var mod;
  if(this.state === BeetleObject.STATE.BONK) { mod = 0x03; }
  else if(this.disabledTimer > 0) { mod = 0xA0 + parseInt((1.-(this.disabledTimer/BeetleObject.ENABLE_FADE_TIME))*32.); }
  else { mod = 0x00; }
  
  if(this.sprite.INDEX instanceof Array) {
    var s = this.sprite.INDEX;
    for(var i=0;i<s.length;i++) {
      for(var j=0;j<s[i].length;j++) {
        var sp = s[mod!==0x03?i:(s.length-1-i)][j];
        sprites.push({pos: vec2.add(this.pos, vec2.make(j,i)), reverse: !this.dir, index: sp, mode: mod});
      }
    }
  }
  else {
    var sp = this.sprite.INDEX;
    sprites.push({pos: this.pos, reverse: !this.dir, index: sp, mode: mod});
  }
};

BeetleObject.prototype.play = GameObject.prototype.play;

/* Register object class */
GameObject.REGISTER_OBJECT(BeetleObject);