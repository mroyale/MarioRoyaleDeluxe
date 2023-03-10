"use strict";
/* global util, vec2, squar */
/* global GameObject */
/* global NET011, NET020 */

/* Big fireballs that shoot up from lava */
function FishObject(game, level, zone, pos, oid, delay, impulse) {
  GameObject.call(this, game, level, zone, pos);
  
  this.oid = oid; // Unique Object ID, is the shor2 of the spawn location
  
  this.setState(FishObject.STATE.IDLE);
  
  this.delay = isNaN(parseInt(delay))?FishObject.DELAY_DEFAULT:parseInt(delay);
  this.impulse = isNaN(parseFloat(impulse))?1.:parseFloat(impulse);
  
  /* Animation */
  this.anim = 0;
  
  /* Var */
  this.disabled = false;
  this.delayTimer = this.delay;
  this.bonkTimer = 0;
  
  /* Physics */
  this.pos.x += FishObject.SOFFSET.x;
  this.loc = vec2.copy(this.pos);
  this.fallSpeed = 0;
  this.moveSpeed = 0;
  this.dim = vec2.make(.7,.7);
  this.dir = true;
}


/* === STATIC =============================================================== */
FishObject.ASYNC = false;
FishObject.ID = 0x15;
FishObject.NAME = "Flying Fish"; // Used by editor
FishObject.PARAMS = [{'name': 'Delay', 'type': 'int', 'tooltip': "How long until the fish flies again"}, {'name': 'Impulse', 'type': 'float', 'tooltip': "The force the fish with which jumps with"}];

FishObject.ANIMATION_RATE = 6;

FishObject.BONK_TIME = 90;
FishObject.BONK_IMP = vec2.make(0.25, 0.4);
FishObject.BONK_DECEL = 0.925;
FishObject.BONK_FALL_SPEED = 0.25;
FishObject.BONK_FALL_ACCEL = 0.085;

FishObject.DELAY_DEFAULT = 150;
FishObject.IMPULSE = vec2.make(0.225, 0.335);
FishObject.DRAG = .996;
FishObject.FALL_SPEED_ACCEL = .0055;
FishObject.SOFFSET = vec2.make(.15,.15);

FishObject.SPRITE = {};
FishObject.SPRITE_LIST = [
  {NAME: "IDLE0", ID: 0x00, INDEX: 0x00CE},
  {NAME: "IDLE1", ID: 0x01, INDEX: 0x00CF}
];

/* Makes sprites easily referenceable by NAME. For sanity. */
for(var i=0;i<FishObject.SPRITE_LIST.length;i++) {
  FishObject.SPRITE[FishObject.SPRITE_LIST[i].NAME] = FishObject.SPRITE_LIST[i];
  FishObject.SPRITE[FishObject.SPRITE_LIST[i].ID] = FishObject.SPRITE_LIST[i];
}

FishObject.STATE = {};
FishObject.STATE_LIST = [
  {NAME: "IDLE", ID: 0x00, SPRITE: [FishObject.SPRITE.IDLE0,FishObject.SPRITE.IDLE1]},
  {NAME: "BONK", ID: 0x51, SPRITE: []}
];

/* Makes states easily referenceable by either ID or NAME. For sanity. */
for(var i=0;i<FishObject.STATE_LIST.length;i++) {
  FishObject.STATE[FishObject.STATE_LIST[i].NAME] = FishObject.STATE_LIST[i];
  FishObject.STATE[FishObject.STATE_LIST[i].ID] = FishObject.STATE_LIST[i];
}


/* === INSTANCE ============================================================= */

FishObject.prototype.update = function(event) {
  /* Event trigger */
  switch(event) {
    case 0x01 : { this.bonk(); break; }
  }
};

FishObject.prototype.step = function() {
  /* Bonked */
  if(this.state === FishObject.STATE.BONK) {
    if(this.bonkTimer++ > FishObject.BONK_TIME || this.pos.y+this.dim.y < 0) { this.destroy(); return; }
    
    this.pos = vec2.add(this.pos, vec2.make(this.moveSpeed, this.fallSpeed));
    this.moveSpeed *= FishObject.BONK_DECEL;
    this.fallSpeed = Math.max(this.fallSpeed - FishObject.BONK_FALL_ACCEL, -FishObject.BONK_FALL_SPEED);
    return;
  }
  
  /* Anim */
  this.anim++;
  this.sprite = this.state.SPRITE[parseInt(this.anim/FishObject.ANIMATION_RATE) % this.state.SPRITE.length];
  
  if(this.delayTimer > 0) { this.delayTimer--; }
  else { this.jump(); }
  
  /* Normal Gameplay */
  this.physics();
  this.sound();
};

FishObject.prototype.physics = function() {
  if(this.pos.y > this.loc.y || this.fallSpeed > 0.) {
    this.fallSpeed = (this.fallSpeed-FishObject.FALL_SPEED_ACCEL)*FishObject.DRAG;
    this.pos.x += this.moveSpeed*FishObject.DRAG;
    this.pos.y += this.fallSpeed;
  }
  else { this.disable(); }
};

FishObject.prototype.sound = GameObject.prototype.sound;

FishObject.prototype.jump = function() {
  this.enable();
  this.pos = vec2.copy(this.loc);
  this.fallSpeed = FishObject.IMPULSE.y*this.impulse;
  this.moveSpeed = FishObject.IMPULSE.x*this.impulse;
  this.delayTimer = this.delay;
};

FishObject.prototype.disable = function() { this.disabled = true; };
FishObject.prototype.enable = function() { this.disabled = false; };

FishObject.prototype.damage = function(p) { if(!this.dead) { this.bonk(); this.game.out.push(NET020.encode(this.level, this.zone, this.oid, 0x01)); } };

/* 'Bonked' is the type of death where an enemy flips upside down and falls off screen */
/* Generally triggred by shells, fireballs, etc */
FishObject.prototype.bonk = function() {
  if(this.dead) { return; }
  this.setState(FishObject.STATE.BONK);
  this.moveSpeed = FishObject.BONK_IMP.x;
  this.fallSpeed = FishObject.BONK_IMP.y;
  this.dead = true;
  this.play("kick.mp3", 1., .04);
};


FishObject.prototype.playerCollide = function(p) {
  if(this.dead || this.garbage) { return; }
  p.damage(this);
};

FishObject.prototype.playerStomp = function(p) {
  if(this.dead || this.garbage) { return; }
  this.bonk();
  p.bounce();
  this.game.out.push(NET020.encode(this.level, this.zone, this.oid, 0x01));
};

FishObject.prototype.playerBump = function(p) {
  this.playerCollide(p);
};

FishObject.prototype.kill = function() { };
FishObject.prototype.isTangible = GameObject.prototype.isTangible;
FishObject.prototype.destroy = GameObject.prototype.destroy;

FishObject.prototype.setState = function(STATE) {
  if(STATE === this.state) { return; }
  this.state = STATE;
  if(STATE.SPRITE.length > 0) { this.sprite = STATE.SPRITE[0]; }
  this.anim = 0;
};

FishObject.prototype.draw = function(sprites) {
  if(this.disabled) { return; }
  
  var mod;
  if(this.state === FishObject.STATE.BONK) { mod = 0x03; }
  else { mod = 0x00; }
  sprites.push({pos: vec2.subtract(this.pos, FishObject.SOFFSET), reverse: this.dir, index: this.sprite.INDEX, mode: mod});
};

FishObject.prototype.play = GameObject.prototype.play;

/* Register object class */
GameObject.REGISTER_OBJECT(FishObject);