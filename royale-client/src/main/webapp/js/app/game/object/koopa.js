"use strict";
/* global util, vec2, squar */
/* global GameObject, PlayerObject */
/* global NET011, NET020 */

function KoopaObject(game, level, zone, pos, oid, fly) {
  GameObject.call(this, game, level, zone, pos);
  
  this.oid = oid; // Unique Object ID, is the shor2 of the spawn location
  
  this.setState(!parseInt(fly)?KoopaObject.STATE.RUN:KoopaObject.STATE.FLY);
  
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
KoopaObject.ASYNC = false;
KoopaObject.ID = 0x12;
KoopaObject.NAME = "Koopa Troopa Green"; // Used by editor
KoopaObject.PARAMS = [{'name': "Fly", 'type': "int", 'tooltip': "Whether the koopa should have wings. 0 is no and 1 is yes"}];

KoopaObject.ANIMATION_RATE = 6;
KoopaObject.VARIANT_OFFSET = 0x20; //2 rows down in the sprite sheet

KoopaObject.ENABLE_FADE_TIME = 15;
KoopaObject.ENABLE_DIST = 26;          // Distance to player needed for proximity to trigger and the enemy to be enabled

KoopaObject.BONK_TIME = 90;
KoopaObject.BONK_IMP = vec2.make(0.25, 0.4);
KoopaObject.BONK_DECEL = 0.925;
KoopaObject.BONK_FALL_SPEED = 0.25;

KoopaObject.PLAYER_IMMUNE_TIME = 12;  // Player is immune to damage for this many frames after bouncing off or kicking this enemy

KoopaObject.MOVE_SPEED_MAX = 0.0375;
KoopaObject.SHELL_MOVE_SPEED_MAX = 0.175;

KoopaObject.JUMP_SPEED_ACCEL = 0.1;
KoopaObject.JUMP_SPEED_MAX = 0.3;

KoopaObject.FALL_SPEED_MAX = 0.125;
KoopaObject.FALL_SPEED_ACCEL = 0.1;

KoopaObject.JUMP_LENGTH_MAX = 40;
KoopaObject.JUMP_DECEL = 0.01;

KoopaObject.TRANSFORM_TIME = 350;
KoopaObject.TRANSFORM_THRESHOLD = 150;

KoopaObject.SPRITE = {};
KoopaObject.SPRITE_LIST = [
  {NAME: "FLY0", ID: 0x0, INDEX: [[0x0066],[0x0056]]},
  {NAME: "FLY1", ID: 0x01, INDEX: [[0x0067],[0x0057]]},
  {NAME: "RUN0", ID: 0x02, INDEX: [[0x0065],[0x0055]]},
  {NAME: "RUN1", ID: 0x03, INDEX: [[0x0064],[0x0054]]},
  {NAME: "TRANSFORM", ID: 0x04, INDEX: 0x0074},
  {NAME: "SHELL", ID: 0x05, INDEX: 0x0073},
  {NAME: "SPIN0", ID: 0x06, INDEX: 0x0073},
  {NAME: "SPIN1", ID: 0x07, INDEX: 0x0072},
  {NAME: "SPIN2", ID: 0x08, INDEX: 0x0071},
  {NAME: "SPIN3", ID: 0x09, INDEX: 0x0070}
];

/* Makes sprites easily referenceable by NAME. For sanity. */
for(var i=0;i<KoopaObject.SPRITE_LIST.length;i++) {
  KoopaObject.SPRITE[KoopaObject.SPRITE_LIST[i].NAME] = KoopaObject.SPRITE_LIST[i];
  KoopaObject.SPRITE[KoopaObject.SPRITE_LIST[i].ID] = KoopaObject.SPRITE_LIST[i];
}

KoopaObject.STATE = {};
KoopaObject.STATE_LIST = [
  {NAME: "FLY", ID: 0x00, SPRITE: [KoopaObject.SPRITE.FLY0,KoopaObject.SPRITE.FLY1]},
  {NAME: "RUN", ID: 0x01, SPRITE: [KoopaObject.SPRITE.RUN0,KoopaObject.SPRITE.RUN1]},
  {NAME: "TRANSFORM", ID: 0x02, SPRITE: [KoopaObject.SPRITE.SHELL,KoopaObject.SPRITE.TRANSFORM]},
  {NAME: "SHELL", ID: 0x03, SPRITE: [KoopaObject.SPRITE.SHELL]},
  {NAME: "SPIN", ID: 0x04, SPRITE: [KoopaObject.SPRITE.SPIN0,KoopaObject.SPRITE.SPIN1,KoopaObject.SPRITE.SPIN2,KoopaObject.SPRITE.SPIN3]},
  {NAME: "BONK", ID: 0x51, SPRITE: []}
];

/* Makes states easily referenceable by either ID or NAME. For sanity. */
for(var i=0;i<KoopaObject.STATE_LIST.length;i++) {
  KoopaObject.STATE[KoopaObject.STATE_LIST[i].NAME] = KoopaObject.STATE_LIST[i];
  KoopaObject.STATE[KoopaObject.STATE_LIST[i].ID] = KoopaObject.STATE_LIST[i];
}


/* === INSTANCE ============================================================= */

KoopaObject.prototype.update = function(event) {
  /* Event trigger */
  switch(event) {
    case 0x01 : { this.bonk(); break; }
    case 0x10 : { this.stomped(true); break; }
    case 0x11 : { this.stomped(false); break; }
    case 0xA0 : { this.enable(); break; }
  }
};

KoopaObject.prototype.step = function() {
  /* Disabled */
  if(this.disabled) { this.proximity(); return; }
  else if(this.disabledTimer > 0) { this.disabledTimer--; }
  
  /* Bonked */
  if(this.state === KoopaObject.STATE.BONK) {
    if(this.bonkTimer++ > KoopaObject.BONK_TIME || this.pos.y+this.dim.y < 0) { this.destroy(); return; }
    
    this.pos = vec2.add(this.pos, vec2.make(this.moveSpeed, this.fallSpeed));
    this.moveSpeed *= KoopaObject.BONK_DECEL;
    this.fallSpeed = Math.max(this.fallSpeed - KoopaObject.FALL_SPEED_ACCEL, -KoopaObject.BONK_FALL_SPEED);
    return;
  }
  
  /* Anim */
  this.anim++;
  this.sprite = this.state.SPRITE[parseInt(this.anim/KoopaObject.ANIMATION_RATE) % this.state.SPRITE.length];
  
  if(this.state === KoopaObject.STATE.SHELL || this.state === KoopaObject.STATE.TRANSFORM) {
    if(--this.transformTimer < KoopaObject.TRANSFORM_THRESHOLD) { this.setState(KoopaObject.STATE.TRANSFORM); }
    if(this.transformTimer <= 0) { this.setState(KoopaObject.STATE.RUN); }
  }
  
  /* Normal Gameplay */
  if(this.immuneTimer > 0) { this.immuneTimer--; }
  
  this.control();
  this.physics();
  this.interaction();
  this.sound();
  
  if(this.pos.y < -2.) { this.destroy(); }
};

KoopaObject.prototype.control = function() {
  if(this.state === KoopaObject.STATE.FLY) {
    this.moveSpeed = this.dir ? -KoopaObject.MOVE_SPEED_MAX : KoopaObject.MOVE_SPEED_MAX;
    if(this.grounded) { this.jump = 0; }
  }
  else if(this.state === KoopaObject.STATE.RUN) { this.moveSpeed = this.dir ? -KoopaObject.MOVE_SPEED_MAX : KoopaObject.MOVE_SPEED_MAX; }
  else if(this.state === KoopaObject.STATE.SPIN) { this.moveSpeed = this.dir ? -KoopaObject.SHELL_MOVE_SPEED_MAX : KoopaObject.SHELL_MOVE_SPEED_MAX; }
  else if(this.state === KoopaObject.STATE.SHELL || this.state === KoopaObject.STATE.TRANSFORM) { this.moveSpeed = 0; }
  
  if(this.jump > KoopaObject.JUMP_LENGTH_MAX) { this.jump = -1; }
};

KoopaObject.prototype.physics = function() {
  if(this.jump !== -1) {
    this.fallSpeed = KoopaObject.JUMP_SPEED_MAX - (this.jump*KoopaObject.JUMP_DECEL);
    this.jump++;
    this.grounded = false;
  }
  else {
    if(this.grounded) { this.fallSpeed = 0; }
    this.fallSpeed = Math.max(this.fallSpeed - KoopaObject.JUMP_SPEED_ACCEL, -KoopaObject.JUMP_SPEED_MAX);
  }
  
  if(this.grounded) {
    this.fallSpeed = 0;
  }
  this.fallSpeed = Math.max(this.fallSpeed - KoopaObject.FALL_SPEED_ACCEL, Math.max(-0.2, -KoopaObject.JUMP_SPEED_MAX));
  
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

      if (this.state === KoopaObject.STATE.SPIN) tile.definition.TRIGGER(this.game, this.pid, tile, this.level, this.zone, tile.pos.x, tile.pos.y, td32.TRIGGER.TYPE.SHELL);
    }
  }
    
  for(var i=0;i<tiles.length;i++) {
    var tile = tiles[i];
    if(!tile.definition.COLLIDE || tile.definition.HIDDEN) { continue; }
    
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

KoopaObject.prototype.interaction = function() {
  if(this.state !== KoopaObject.STATE.SPIN) { return; }
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
KoopaObject.prototype.proximity = function() {
  var ply = this.game.getPlayer();
  if(ply && !ply.dead && ply.level === this.level && ply.zone === this.zone && !this.proxHit && vec2.distance(ply.pos, this.pos) < KoopaObject.ENABLE_DIST) {
    this.game.out.push(NET020.encode(this.level, this.zone, this.oid, 0xA0));
    this.proxHit = true;
  }
};

KoopaObject.prototype.sound = GameObject.prototype.sound;

KoopaObject.prototype.enable = function() {
  if(!this.disabled) { return; }
  this.disabled = false;
  this.disabledTimer = KoopaObject.ENABLE_FADE_TIME;
};

KoopaObject.prototype.disable = function() {
  this.disabled = true;
};

KoopaObject.prototype.damage = function(p) { if(!this.dead) { this.bonk(); this.game.out.push(NET020.encode(this.level, this.zone, this.oid, 0x01)); } };

/* 'Bonked' is the type of death where an enemy flips upside down and falls off screen */
/* Generally triggred by shells, fireballs, etc */
KoopaObject.prototype.bonk = function() {
  if(this.dead) { return; }
  this.setState(KoopaObject.STATE.BONK);
  this.moveSpeed = KoopaObject.BONK_IMP.x;
  this.fallSpeed = KoopaObject.BONK_IMP.y;
  this.dead = true;
  this.play("kick.mp3", 1., .04);
};

/* dir (true = left, false = right) */
KoopaObject.prototype.stomped = function(dir) {
  if(this.state === KoopaObject.STATE.FLY) { this.setState(KoopaObject.STATE.RUN); this.jump = -1; }
  else if(this.state === KoopaObject.STATE.RUN) { this.setState(KoopaObject.STATE.SHELL); this.transformTimer = KoopaObject.TRANSFORM_TIME; }
  else if(this.state === KoopaObject.STATE.SPIN) { this.setState(KoopaObject.STATE.SHELL); this.transformTimer = KoopaObject.TRANSFORM_TIME; }
  else if(this.state === KoopaObject.STATE.SHELL || this.state === KoopaObject.STATE.TRANSFORM) {
    this.setState(KoopaObject.STATE.SPIN);
    this.dir = dir;
    this.game.world.getZone(this.level, this.zone).effects.push(new DustEffect(this.pos));
    this.play("kick.mp3", 1., .04);
    return;
  }
  this.play("stomp.mp3", 1., .04);
};

KoopaObject.prototype.playerCollide = function(p) {
  if(this.dead || this.garbage) { return; }
  if(this.state === KoopaObject.STATE.SHELL || this.state === KoopaObject.STATE.TRANSFORM) {
    var dir = p.pos.x-this.pos.x > 0;
    this.stomped(dir);
    this.game.out.push(NET020.encode(this.level, this.zone, this.oid, dir?0x10:0x11));
    this.immuneTimer = KoopaObject.PLAYER_IMMUNE_TIME;
  }
  else if(this.immuneTimer <= 0) { p.damage(this); }
};

KoopaObject.prototype.playerStomp = function(p) {
  if(this.dead || this.garbage) { return; }
  var dir = p.pos.x-this.pos.x > 0;
  p.bounce();
  this.stomped(dir);
  this.immuneTimer = KoopaObject.PLAYER_IMMUNE_TIME;
  this.game.out.push(NET020.encode(this.level, this.zone, this.oid, dir?0x10:0x11));
};

KoopaObject.prototype.playerBump = function(p) {
  if(this.dead || this.garbage) { return; }
  p.damage(this);
};

KoopaObject.prototype.kill = function() { };
KoopaObject.prototype.destroy = GameObject.prototype.destroy;
KoopaObject.prototype.isTangible = GameObject.prototype.isTangible;

KoopaObject.prototype.setState = function(STATE) {
  if(STATE === this.state) { return; }
  this.state = STATE;
  if(STATE.SPRITE.length > 0) { this.sprite = STATE.SPRITE[0]; }
  this.anim = 0;
};

KoopaObject.prototype.draw = function(sprites) {
  /* Disabled */
  if(this.disabled) { return; }
  
  var mod;
  if(this.state === KoopaObject.STATE.BONK) { mod = 0x03; }
  else if(this.disabledTimer > 0) { mod = 0xA0 + parseInt((1.-(this.disabledTimer/KoopaObject.ENABLE_FADE_TIME))*32.); }
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

KoopaObject.prototype.play = GameObject.prototype.play;

/* Register object class */
GameObject.REGISTER_OBJECT(KoopaObject);