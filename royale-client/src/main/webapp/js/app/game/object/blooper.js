"use strict";
/* global util, vec2, squar */
/* global GameObject */
/* global NET011, NET020 */

/* Bullet bills that shoot from blasters */
function BlooperObject(game, level, zone, pos, oid) {
  GameObject.call(this, game, level, zone, pos);
  
  this.oid = oid; // Unique Object ID, is the shor2 of the spawn location
  
  this.setState(BlooperObject.STATE.IDLE);
  
  /* Animation */
  this.anim = 0;
  
  /* Var */
  this.bonkTimer = 0;
  
  /* Physics */
  this.dim = vec2.make(.8,.8);
  this.moveSpeed = 0;
  this.fallSpeed = 0;
  this.direction = false;
  this.moveTimer = 0;
  this.holdTime = 20;

  /* Not a finished/WORKING object, so just make it not work. */
  this.destroy();
}


/* === STATIC =============================================================== */
BlooperObject.ASYNC = false;
BlooperObject.ID = 39;
BlooperObject.NAME = "Blooper (DISABLED)"; // Used by editor

BlooperObject.ANIMATION_RATE = 12;

BlooperObject.SPEED = 0.1075;

BlooperObject.BONK_TIME = 90;
BlooperObject.BONK_IMP = vec2.make(0.25, 0.4);
BlooperObject.BONK_DECEL = 0.925;
BlooperObject.BONK_FALL_SPEED = 0.25;
BlooperObject.BONK_FALL_ACCEL = 0.085;

BlooperObject.DELAY_DEFAULT = 550;
BlooperObject.IMPULSE = vec2.make(0.225, 0.335);
BlooperObject.DRAG = .996;
BlooperObject.FALL_SPEED_ACCEL = .0055;
BlooperObject.SOFFSET = vec2.make(.15,.15);

BlooperObject.SPRITE = {};
BlooperObject.SPRITE_LIST = [
  {NAME: "IDLE", ID: 0x00, INDEX: [[172], [156]]},
  {NAME: "COMPRESS", ID: 0x01, INDEX: 173},
];

/* Makes sprites easily referenceable by NAME. For sanity. */
for(var i=0;i<BlooperObject.SPRITE_LIST.length;i++) {
  BlooperObject.SPRITE[BlooperObject.SPRITE_LIST[i].NAME] = BlooperObject.SPRITE_LIST[i];
  BlooperObject.SPRITE[BlooperObject.SPRITE_LIST[i].ID] = BlooperObject.SPRITE_LIST[i];
}

BlooperObject.STATE = {};
BlooperObject.STATE_LIST = [
  {NAME: "IDLE", ID: 0x00, SPRITE: [BlooperObject.SPRITE.IDLE]},
  {NAME: "COMPRESS", ID: 0x01, SPRITE: [BlooperObject.SPRITE.COMPRESS]},
  {NAME: "BONK", ID: 0x51, SPRITE: []}
];

/* Makes states easily referenceable by either ID or NAME. For sanity. */
for(var i=0;i<BlooperObject.STATE_LIST.length;i++) {
  BlooperObject.STATE[BlooperObject.STATE_LIST[i].NAME] = BlooperObject.STATE_LIST[i];
  BlooperObject.STATE[BlooperObject.STATE_LIST[i].ID] = BlooperObject.STATE_LIST[i];
}


/* === INSTANCE ============================================================= */

BlooperObject.prototype.update = function(event) {
  /* Event trigger */
  switch(event) {
    case 0x01: this.bonk(); break;
    case 0xA0: this.enable(); break;
  }
};

BlooperObject.prototype.step = function() {
  /* Disabled */
  if(this.disabled) { this.proximity(); return; }
  else if(this.disabledTimer > 0) { this.disabledTimer--; }

  /* Bonked */
  if(this.state === BlooperObject.STATE.BONK) {
    if(this.bonkTimer++ > BlooperObject.BONK_TIME || this.pos.y+this.dim.y < 0) { this.destroy(); return; }
    
    this.pos = vec2.add(this.pos, vec2.make(this.moveSpeed, this.fallSpeed));
    this.moveSpeed *= BlooperObject.BONK_DECEL;
    this.fallSpeed = Math.max(this.fallSpeed - BlooperObject.BONK_FALL_ACCEL, -BlooperObject.BONK_FALL_SPEED);
    return;
  }
  
  /* Anim */
  this.anim++;
  this.sprite = this.state.SPRITE[parseInt(this.anim/BlooperObject.ANIMATION_RATE) % this.state.SPRITE.length];
  
  /* Normal Gameplay */
  this.physics();
  this.sound();
};

BlooperObject.prototype.physics = function() {
  if(this.pos.x > 0) {
    this.setState(BlooperObject.STATE.COMPRESS);
    this.face();
    if (++this.moveTimer >= 20 + this.holdTime) {
      this.setState(BlooperObject.STATE.IDLE);
      var ang = 45 * Math.PI / 180;
      var x = Math.cos(ang) * BlooperObject.SPEED/2;
      var y = Math.sin(ang) * BlooperObject.SPEED/2;

      this.pos.x += (this.direction ? x : -x);
      this.pos.y += y;

      if (this.moveTimer >= 110) {
        this.moveTimer = 0;
      }
    } else {
      this.pos.y -= BlooperObject.SPEED/3;
      this.holdTime = Math.min(20, Math.max(35, parseInt(Math.random()*15)))
    }
  }
  else { this.destroy(); }
};

/* Face nearest player */
BlooperObject.prototype.face = function() {
  var nearest;
  var target;
  for(var i=0;i<this.game.objects.length;i++) {
     var obj = this.game.objects[i];
     if(obj instanceof PlayerObject && obj.level === this.level && obj.zone === this.zone && obj.isTangible()) {
       if(!nearest || Math.abs(nearest) > vec2.distance(obj.pos, this.pos)) { nearest = obj.pos.x - this.pos.x; target = obj; }
     }
  }
  if(!nearest) { this.direction = false; }
  else { this.direction = nearest<0; this.direction = !this.direction; this.target = focus; }
};

BlooperObject.prototype.sound = GameObject.prototype.sound;

/* Tests against client player to see if they are near enough that we should enable this enemy. */
/* On a successful test we send a object event 0xA0 to the server to trigger this enemy being enabled for all players */
BlooperObject.prototype.proximity = function() {
  var ply = this.game.getPlayer();
  if(ply && !ply.dead && ply.level === this.level && ply.zone === this.zone && !this.proxHit && vec2.distance(ply.pos, this.pos) < BlooperObject.ENABLE_DIST) {
    this.game.out.push(NET020.encode(this.level, this.zone, this.oid, 0xA0));
    this.proxHit = true;
  }
};

BlooperObject.prototype.disable = function() { this.disabled = true; };
BlooperObject.prototype.enable = function() { this.disabled = false; };

BlooperObject.prototype.damage = function(p) { };

/* 'Bonked' is the type of death where an enemy flips upside down and falls off screen */
/* Generally triggred by shells, fireballs, etc */
BlooperObject.prototype.bonk = function() {
  if(this.dead) { return; }
  this.setState(BlooperObject.STATE.BONK);
  this.moveSpeed = BlooperObject.BONK_IMP.x;
  this.fallSpeed = BlooperObject.BONK_IMP.y;
  this.dead = true;
  this.play("kick.mp3", 1., .04);
};


BlooperObject.prototype.playerCollide = function(p) {
  if(this.dead || this.garbage) { return; }
  p.damage(this);
};

BlooperObject.prototype.playerStomp = function(p) {
  this.playerCollide(p);
};

BlooperObject.prototype.playerBump = function(p) {
  this.playerCollide(p);
};

BlooperObject.prototype.kill = function() { };
BlooperObject.prototype.isTangible = GameObject.prototype.isTangible;
BlooperObject.prototype.destroy = GameObject.prototype.destroy;

BlooperObject.prototype.setState = function(STATE) {
  if(STATE === this.state) { return; }
  this.state = STATE;
  if(STATE.SPRITE.length > 0) { this.sprite = STATE.SPRITE[0]; }
  this.anim = 0;
};

BlooperObject.prototype.draw = function(sprites) {
  var mod;
  if(this.state === BlooperObject.STATE.BONK) { mod = 0x03; }
  else { mod = 0x00; }
  if(this.sprite.INDEX instanceof Array) {
    var s = this.sprite.INDEX;
    for(var i=0;i<s.length;i++) {
      for(var j=0;j<s[i].length;j++) {
        var sp = s[mod!==0x03?i:(s.length-1-i)][j];
        sprites.push({pos: vec2.add(this.pos, vec2.make(j,i)), reverse: false, index: sp, mode: mod});
      }
    }
  }
  else {
    var sp = this.sprite.INDEX;
    sprites.push({pos: this.pos, reverse: false, index: sp, mode: mod});
  }
};

BlooperObject.prototype.play = GameObject.prototype.play;

/* Register object class */
GameObject.REGISTER_OBJECT(BlooperObject);