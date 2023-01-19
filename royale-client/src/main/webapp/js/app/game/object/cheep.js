"use strict";
/* global util, vec2, squar */
/* global GameObject */
/* global NET011, NET020 */

/* Cheep cheeps that move horizontally once spawned */
function CheepObject(game, level, zone, pos, oid, variant) {
  GameObject.call(this, game, level, zone, pos);
  
  this.oid = oid; // Unique Object ID, is the shor2 of the spawn location
  this.loc = vec2.copy(this.pos); // Our original position
  
  this.setState(CheepObject.STATE.IDLE);
  
  /* Animation */
  this.anim = 0;
  
  /* Var */
  this.bonkTimer = 0;
  
  /* Physics */
  this.dim = vec2.make(.8,.8);
  this.moveSpeed = 0;
  this.fallSpeed = 0;
  this.variant = isNaN(parseInt(variant)) ? 0 : parseInt(variant);
}


/* === STATIC =============================================================== */
CheepObject.ASYNC = false;
CheepObject.ID = 0x26;
CheepObject.NAME = "Cheep Cheep"; // Used by editor

CheepObject.ANIMATION_RATE = 12;
CheepObject.VARIANT_OFFSET = 2;

CheepObject.SPEED = 0.510;
CheepObject.SPEED_FAST = 0.625;

CheepObject.BONK_TIME = 90;
CheepObject.BONK_IMP = vec2.make(0.25, 0.4);
CheepObject.BONK_DECEL = 0.925;
CheepObject.BONK_FALL_SPEED = 0.25;
CheepObject.BONK_FALL_ACCEL = 0.085;

CheepObject.DELAY_DEFAULT = 1800;
CheepObject.FALL_SPEED_ACCEL = .0055;
CheepObject.SOFFSET = vec2.make(.15,.15);

CheepObject.SPRITE = {};
CheepObject.SPRITE_LIST = [
  {NAME: "IDLE0", ID: 0x00, INDEX: 204},
  {NAME: "IDLE1", ID: 0x01, INDEX: 205}
];

/* Makes sprites easily referenceable by NAME. For sanity. */
for(var i=0;i<CheepObject.SPRITE_LIST.length;i++) {
  CheepObject.SPRITE[CheepObject.SPRITE_LIST[i].NAME] = CheepObject.SPRITE_LIST[i];
  CheepObject.SPRITE[CheepObject.SPRITE_LIST[i].ID] = CheepObject.SPRITE_LIST[i];
}

CheepObject.STATE = {};
CheepObject.STATE_LIST = [
  {NAME: "IDLE", ID: 0x00, SPRITE: [CheepObject.SPRITE.IDLE0, CheepObject.SPRITE.IDLE1]},
  {NAME: "BONK", ID: 0x51, SPRITE: []}
];

/* Makes states easily referenceable by either ID or NAME. For sanity. */
for(var i=0;i<CheepObject.STATE_LIST.length;i++) {
  CheepObject.STATE[CheepObject.STATE_LIST[i].NAME] = CheepObject.STATE_LIST[i];
  CheepObject.STATE[CheepObject.STATE_LIST[i].ID] = CheepObject.STATE_LIST[i];
}


/* === INSTANCE ============================================================= */

CheepObject.prototype.update = function(event) {
  /* Event trigger */
  switch(event) {
    case 0x01: this.bonk(); break;
  }
};

CheepObject.prototype.step = function() {
  /* Bonked */
  if(this.state === CheepObject.STATE.BONK) {
    if(this.bonkTimer++ > CheepObject.BONK_TIME || this.pos.y+this.dim.y < 0) { this.destroy(); return; }
    
    this.pos = vec2.add(this.pos, vec2.make(this.moveSpeed, this.fallSpeed));
    this.moveSpeed *= CheepObject.BONK_DECEL;
    this.fallSpeed = Math.max(this.fallSpeed - CheepObject.BONK_FALL_ACCEL, -CheepObject.BONK_FALL_SPEED);
    return;
  }
  
  /* Anim */
  this.anim++;
  this.sprite = this.state.SPRITE[parseInt(this.anim/CheepObject.ANIMATION_RATE) % this.state.SPRITE.length];
  
  /* Normal Gameplay */
  this.physics();
  this.sound();
};

CheepObject.prototype.physics = function() {
  this.pos.x -= (this.variant ? CheepObject.SPEED_FAST : CheepObject.SPEED);
};

CheepObject.prototype.sound = GameObject.prototype.sound;

CheepObject.prototype.disable = function() { this.disabled = true; };
CheepObject.prototype.enable = function() { this.disabled = false; };

CheepObject.prototype.damage = function(p) { this.bonk(); };

/* 'Bonked' is the type of death where an enemy flips upside down and falls off screen */
/* Generally triggred by shells, fireballs, etc */
CheepObject.prototype.bonk = function() {
  if(this.dead) { return; }
  this.setState(CheepObject.STATE.BONK);
  this.moveSpeed = CheepObject.BONK_IMP.x;
  this.fallSpeed = CheepObject.BONK_IMP.y;
  this.dead = true;
  this.play("kick.mp3", 1., .04);
};


CheepObject.prototype.playerCollide = function(p) {
  if(this.dead || this.garbage) { return; }
  p.damage(this);
};

CheepObject.prototype.playerStomp = function(p) {
  this.playerCollide(p);
};

CheepObject.prototype.playerBump = function(p) {
  this.playerCollide(p);
};

CheepObject.prototype.kill = function() { };
CheepObject.prototype.isTangible = GameObject.prototype.isTangible;
CheepObject.prototype.destroy = GameObject.prototype.destroy;

CheepObject.prototype.setState = function(STATE) {
  if(STATE === this.state) { return; }
  this.state = STATE;
  if(STATE.SPRITE.length > 0) { this.sprite = STATE.SPRITE[0]; }
  this.anim = 0;
};

CheepObject.prototype.draw = function(sprites) {
  var mod;
  if(this.state === CheepObject.STATE.BONK) { mod = 0x03; }
  else { mod = 0x00; }
  var sp = this.sprite.INDEX;
  switch(this.variant) {
    case 1 : { sp += CheepObject.VARIANT_OFFSET; }
    default : { break; }
  }
  sprites.push({pos: vec2.subtract(this.pos, CheepObject.SOFFSET), reverse: false, index: sp, mode: mod});
};

CheepObject.prototype.play = GameObject.prototype.play;

/* Register object class */
GameObject.REGISTER_OBJECT(CheepObject);