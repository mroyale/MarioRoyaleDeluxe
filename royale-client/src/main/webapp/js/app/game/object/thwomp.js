"use strict";
/* global util, vec2, squar */
/* global GameObject */
/* global NET011, NET020 */

function ThwompObject(game, level, zone, pos, oid, variant) {
  GameObject.call(this, game, level, zone, pos);
  
  this.oid = oid; // Unique Object ID, is the shor2 of the spawn location
  
  this.variant = isNaN(parseInt(variant))?0:parseInt(variant);
  this.variant = 0;
  this.setState(ThwompObject.STATE.RUN);
  
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
ThwompObject.ASYNC = false;
ThwompObject.ID = 0x0F;
ThwompObject.NAME = "Thwomp"; // Used by editor

ThwompObject.ANIMATION_RATE = 10;
ThwompObject.VARIANT_OFFSET = 0x70;   //5 rows down in the sprite sheet

ThwompObject.ENABLE_FADE_TIME = 15;
ThwompObject.ENABLE_DIST = 26;          // Distance to player needed for proximity to trigger and the enemy to be enabled

ThwompObject.DEAD_TIME = 60;
ThwompObject.BONK_TIME = 90;
ThwompObject.BONK_IMP = vec2.make(0.25, 0.4);
ThwompObject.BONK_DECEL = 0.925;
ThwompObject.BONK_FALL_SPEED = 0.25;

ThwompObject.MOVE_SPEED_MAX = 0.0375;

ThwompObject.FALL_SPEED_MAX = 0.175;
ThwompObject.FALL_SPEED_ACCEL = 0.085;

ThwompObject.SPRITE = {};
ThwompObject.SPRITE_LIST = [
  {NAME: "RUN0", ID: 0x00, INDEX: 0x000F},
  {NAME: "RUN1", ID: 0x01, INDEX: 0x001F},
  {NAME: "FALL", ID: 0x02, INDEX: 0x000E},
  {NAME: "DEAD", ID: 0x03, INDEX: 0x002F}
];

/* Makes sprites easily referenceable by NAME. For sanity. */
for(var i=0;i<ThwompObject.SPRITE_LIST.length;i++) {
  ThwompObject.SPRITE[ThwompObject.SPRITE_LIST[i].NAME] = ThwompObject.SPRITE_LIST[i];
  ThwompObject.SPRITE[ThwompObject.SPRITE_LIST[i].ID] = ThwompObject.SPRITE_LIST[i];
}

ThwompObject.STATE = {};
ThwompObject.STATE_LIST = [
  {NAME: "IDLE", ID: 0x00, SPRITE: [ThwompObject.SPRITE.RUN0]},
  {NAME: "ATTACK", ID: 0x01, SPRITE: [ThwompObject.SPRITE.FALL]},
  {NAME: "DEAD", ID: 0x50, SPRITE: [ThwompObject.SPRITE.DEAD]},
  {NAME: "BONK", ID: 0x51, SPRITE: []}
];

/* Makes states easily referenceable by either ID or NAME. For sanity. */
for(var i=0;i<ThwompObject.STATE_LIST.length;i++) {
  ThwompObject.STATE[ThwompObject.STATE_LIST[i].NAME] = ThwompObject.STATE_LIST[i];
  ThwompObject.STATE[ThwompObject.STATE_LIST[i].ID] = ThwompObject.STATE_LIST[i];
}


/* === INSTANCE ============================================================= */

ThwompObject.prototype.update = function(event) {
  /* Event trigger */
  switch(event) {
    case 0x00 : { this.kill(); break; }
    case 0x01 : { this.bonk(); break; }
    case 0xA0 : { this.enable(); break; }
  }
};

ThwompObject.prototype.step = function() {
  /* Disabled */
  if(this.disabled) { this.proximity(); return; }
  else if(this.disabledTimer > 0) { this.disabledTimer--; }
  
  /* Bonked */
  if(this.state === ThwompObject.STATE.BONK) {
    if(this.bonkTimer++ > ThwompObject.BONK_TIME || this.pos.y+this.dim.y < 0) { this.destroy(); return; }
    
    this.pos = vec2.add(this.pos, vec2.make(this.moveSpeed, this.fallSpeed));
    this.moveSpeed *= ThwompObject.BONK_DECEL;
    this.fallSpeed = Math.max(this.fallSpeed - ThwompObject.FALL_SPEED_ACCEL, -ThwompObject.BONK_FALL_SPEED);
    return;
  }
  
  /* Anim */
  this.anim++;
  this.sprite = this.state.SPRITE[parseInt(this.anim/ThwompObject.ANIMATION_RATE) % this.state.SPRITE.length];
  
  /* Dead */
  if(this.state === ThwompObject.STATE.DEAD) {
    if(this.deadTimer++ < ThwompObject.DEAD_TIME) { }
    else { this.destroy(); }
    return;
  }
  
  /* Normal Gameplay */
  this.control();
  this.physics();
  this.sound();
  
  if(this.pos.y < 0.) { this.destroy(); }
};

ThwompObject.prototype.control = function() {
  for (var i=0;i<this.game.objects.length; i++) {
    var obj = this.game.objects[i];
    if (obj instanceof PlayerObject && obj.level === this.level && obj.zone === this.zone) {
        var x2 = (obj.pos > this.pos) ? obj.pos : this.pos;
        var x1 = (obj.pos > this.pos) ? this.pos : obj.pos;
        var d = (x2-x1);

        if (d < 4) { this.setState(ThwompObject.STATE.ATTACK); }
    }
  }
};

ThwompObject.prototype.physics = function() {
    if (this.state === ThwompObject.STATE.ATTACK) {
        var tile = this.game.world.getZone(this.level, this.zone).getTile(vec2.chop(vec2.make(this.pos.x, this.pos.y-1)));
        if (!(tile.definition.COLLIDE)) { this.pos.y -= ThwompObject.FALL_SPEED_MAX; }
    }
};

ThwompObject.prototype.sound = GameObject.prototype.sound;

/* Tests against client player to see if they are near enough that we should enable this enemy. */
/* On a successful test we send a object event 0xA0 to the server to trigger this enemy being enabled for all players */
ThwompObject.prototype.proximity = function() {
  var ply = this.game.getPlayer();
  if(ply && !ply.dead && ply.level === this.level && ply.zone === this.zone && !this.proxHit && vec2.distance(ply.pos, this.pos) < ThwompObject.ENABLE_DIST) {
    this.game.out.push(NET020.encode(this.level, this.zone, this.oid, 0xA0));
    this.proxHit = true;
  }
};

ThwompObject.prototype.enable = function() {
  if(!this.disabled) { return; }
  this.disabled = false;
  this.disabledTimer = ThwompObject.ENABLE_FADE_TIME;
};

ThwompObject.prototype.disable = function() {
  this.disabled = true;
};

ThwompObject.prototype.damage = function(p) { if(!this.dead) { this.bonk(); this.game.out.push(NET020.encode(this.level, this.zone, this.oid, 0x01)); } };

/* 'Bonked' is the type of death where an enemy flips upside down and falls off screen */
/* Generally triggred by shells, fireballs, etc */
ThwompObject.prototype.bonk = function() {
  if(this.dead) { return; }
  this.setState(ThwompObject.STATE.BONK);
  this.moveSpeed = ThwompObject.BONK_IMP.x;
  this.fallSpeed = ThwompObject.BONK_IMP.y;
  this.dead = true;
  this.play("kick.mp3", 1., .04);
};

ThwompObject.prototype.playerCollide = function(p) {
  if(this.dead || this.garbage) { return; }
  p.damage(this);
};

ThwompObject.prototype.playerStomp = ThwompObject.prototype.playerCollide;

ThwompObject.prototype.playerBump = ThwompObject.prototype.playerCollide;

ThwompObject.prototype.kill = function() {
  this.dead = true;
  this.setState(ThwompObject.STATE.DEAD);
  this.play("stomp.mp3", 1., .04);
};

ThwompObject.prototype.destroy = GameObject.prototype.destroy;
ThwompObject.prototype.isTangible = GameObject.prototype.isTangible;

ThwompObject.prototype.setState = function(STATE) {
  if(STATE === this.state) { return; }
  this.state = STATE;
  if(STATE.SPRITE.length > 0) { this.sprite = STATE.SPRITE[0]; }
  this.anim = 0;
};

ThwompObject.prototype.draw = function(sprites) {
  /* Disabled */
  if(this.disabled) { return; }

  var mod;
  if(this.state === ThwompObject.STATE.BONK) { mod = 0x03; }
  else if(this.disabledTimer > 0) { mod = 0xA0 + parseInt((1.-(this.disabledTimer/ThwompObject.ENABLE_FADE_TIME))*32.); }
  else { mod = 0x00; }
  
  if(this.sprite.INDEX instanceof Array) {
    var s = this.sprite.INDEX;
    for(var i=0;i<s.length;i++) {
      for(var j=0;j<s[i].length;j++) {
        var sp = s[!mod?i:(s.length-1-i)][j];
        switch(this.variant) {
          case 1 : { sp += ThwompObject.VARIANT_OFFSET; break; }
          default : { break; }
        }
        sprites.push({pos: vec2.add(this.pos, vec2.make(j,i)), reverse: !this.dir, index: sp, mode: mod});
      }
    }
  }
  else {
    var sp = this.sprite.INDEX;
    switch(this.variant) {
      case 1 : { sp += ThwompObject.VARIANT_OFFSET; break; }
      default : { break; }
    }
    sprites.push({pos: this.pos, reverse: !this.dir, index: sp, mode: mod});
  }
};

ThwompObject.prototype.play = GameObject.prototype.play;

/* Register object class */
GameObject.REGISTER_OBJECT(ThwompObject);