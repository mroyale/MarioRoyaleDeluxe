"use strict";
/* global util, vec2, squar */
/* global GameObject, FireBreathProj */
/* global NET011, NET020 */

function BowserObject(game, level, zone, pos, oid) {
  GameObject.call(this, game, level, zone, pos);
  
  this.oid = oid; // Unique Object ID, is the shor2 of the spawn location
  
  this.state = BowserObject.STATE.RUN;
  this.sprite = this.state.SPRITE[0];
  
  /* Animation */
  this.anim = 0;
  
  /* Dead */
  this.health = BowserObject.HEALTH;
  this.bonkTimer = 0;
  
  /* Physics */
  this.dim = vec2.make(2., 2.);
  this.moveSpeed = 0;
  this.fallSpeed = 0;
  this.grounded = false;
  
  /* Control */
  this.loc = [this.pos.x, this.pos.x - BowserObject.MOVE_AREA];
  this.attackTimer = 0;
  this.attackAnimTimer = 0;
  this.groundTimer = 0;
  this.jumpTimer = -1;
  this.reverse = false; /* direction bowser is moving */
  this.dir = true; /* false = facing left, true = facing right */
}

/* === STATIC =============================================================== */
BowserObject.ASYNC = true;
BowserObject.ID = 0x19;
BowserObject.NAME = "Bowser"; // Used by editor

BowserObject.ANIMATION_RATE = 10;

BowserObject.HEALTH = 5;

BowserObject.BONK_TIME = 90;
BowserObject.BONK_IMP = vec2.make(0.25, 0.4);
BowserObject.BONK_DECEL = 1.20;

BowserObject.MOVE_SPEED_MAX = 0.0475;
BowserObject.JUMP_DELAY = 90;        // Time between jumps
BowserObject.MOVE_AREA = 5;          // 7 Blocks horizontal area
BowserObject.JUMP_LENGTH = 50;        // Length of jump
BowserObject.JUMP_DECEL = 0.005;     // Jump deceleration
BowserObject.ATTACK_DELAY = 150;      // Time between attacks
BowserObject.ATTACK_ANIM_LENGTH = 30;
BowserObject.HURT_ANIM_LENGTH = 50;
BowserObject.PROJ_OFFSET = vec2.make(-.25, 0.25);
    
BowserObject.FALL_SPEED_MAX = 0.15;
BowserObject.FALL_SPEED_ACCEL = 0.0425;

BowserObject.SPRITE = {};
BowserObject.SPRITE_LIST = [
  {NAME: "RUN0", ID: 0x00, INDEX: [[44, 45],[28, 29],[12, 13]]},
  {NAME: "RUN1", ID: 0x01, INDEX: [[42, 43],[26, 27],[10, 11]]},
  {NAME: "RUN2", ID: 0x02, INDEX: [[40, 41],[24, 25],[8, 9]]},
  {NAME: "PREPARE", ID: 0x03, INDEX: [[38, 39],[22, 23],[6, 7]]},
  {NAME: "ATTACK", ID: 0x04, INDEX: [[36, 37],[20, 21],[4, 5]]},
  {NAME: "HURT0", ID: 0x05, INDEX: [[34, 35],[18, 19],[2, 3]]},
  {NAME: "HURT1", ID: 0x06, INDEX: [[32, 33],[16, 17],[0, 1]]}
];

/* Makes sprites easily referenceable by NAME. For sanity. */
for(var i=0;i<BowserObject.SPRITE_LIST.length;i++) {
  BowserObject.SPRITE[BowserObject.SPRITE_LIST[i].NAME] = BowserObject.SPRITE_LIST[i];
  BowserObject.SPRITE[BowserObject.SPRITE_LIST[i].ID] = BowserObject.SPRITE_LIST[i];
}

BowserObject.STATE = {};
BowserObject.STATE_LIST = [
  {NAME: "RUN", ID: 0x00, SPRITE: [BowserObject.SPRITE.RUN0,BowserObject.SPRITE.RUN1,BowserObject.SPRITE.RUN2,BowserObject.SPRITE.RUN1]},
  {NAME: "PREPARE", ID: 0x01, SPRITE: [BowserObject.SPRITE.PREPARE]},
  {NAME: "ATTACK", ID: 0x02, SPRITE: [BowserObject.SPRITE.ATTACK]},
  {NAME: "HURT", ID: 0x03, SPRITE: [BowserObject.SPRITE.HURT0, BowserObject.SPRITE.HURT1]},
  {NAME: "BONK", ID: 0x51, SPRITE: [BowserObject.SPRITE.HURT0, BowserObject.SPRITE.HURT1]}
];

/* Makes states easily referenceable by either ID or NAME. For sanity. */
for(var i=0;i<BowserObject.STATE_LIST.length;i++) {
  BowserObject.STATE[BowserObject.STATE_LIST[i].NAME] = BowserObject.STATE_LIST[i];
  BowserObject.STATE[BowserObject.STATE_LIST[i].ID] = BowserObject.STATE_LIST[i];
}

/* === INSTANCE ============================================================= */

BowserObject.prototype.update = function(event) { /* ASYNC */ };

BowserObject.prototype.step = function() {
  /* Anim */
  this.anim++;
  this.sprite = this.state.SPRITE[parseInt(this.anim/BowserObject.ANIMATION_RATE) % this.state.SPRITE.length];
  
  /* Bonked */
  if(this.state === BowserObject.STATE.BONK) {
    if(this.bonkTimer++ > BowserObject.BONK_TIME || this.pos.y+this.dim.y < 0) { this.destroy(); return; }
    
    this.pos = vec2.add(this.pos, vec2.make(0, this.fallSpeed));
    this.moveSpeed *= BowserObject.BONK_DECEL;
    this.fallSpeed = BowserObject.FALL_SPEED_MAX - (this.bonkTimer*BowserObject.JUMP_DECEL);
    return;
  }
  
  /* Normal Gameplay */
  this.control();
  this.physics();
  this.sound();

  if(this.hurtAnimTimer > 0) { this.setState(BowserObject.STATE.HURT); this.hurtAnimTimer--; }
  else {
    this.setState(BowserObject.STATE.RUN);
    if(this.attackTimer++ > BowserObject.ATTACK_DELAY) { this.attack(); }
    else if ((BowserObject.ATTACK_DELAY - this.attackTimer) < 20) { this.setState(BowserObject.STATE.PREPARE); }
  
    if(this.attackAnimTimer > 0) { this.setState(BowserObject.STATE.ATTACK); this.attackAnimTimer--; }
  }

  if(this.pos.y < -2.) { this.destroy(); }
};

BowserObject.prototype.control = function() {
  if(this.grounded) {
    if(BowserObject.JUMP_DELAY < this.groundTimer++) { this.jumpTimer = 0; this.groundTimer = 0; }
    if(this.pos.x > this.loc[0]) { this.reverse = true; }
    else if(this.pos.x < this.loc[1]) { this.reverse = false; }
  }
  else if(this.jumpTimer > BowserObject.JUMP_LENGTH) {
    this.jumpTimer = -1;
  }

  this.moveSpeed = (this.moveSpeed * .75) + ((this.reverse ? -BowserObject.MOVE_SPEED_MAX : BowserObject.MOVE_SPEED_MAX) * .25);  // Rirp
};

BowserObject.prototype.physics = function() {
  if(this.jumpTimer !== -1) {
    this.fallSpeed = BowserObject.FALL_SPEED_MAX - (this.jumpTimer*BowserObject.JUMP_DECEL);
    this.jumpTimer++;
    this.grounded = false;
  }
  else {
    if(this.grounded) { this.fallSpeed = 0; }
    this.fallSpeed = Math.max(this.fallSpeed - BowserObject.FALL_SPEED_ACCEL, -BowserObject.FALL_SPEED_MAX);
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

BowserObject.prototype.sound = GameObject.prototype.sound;

BowserObject.prototype.attack = function() {
  this.attackAnimTimer = BowserObject.ATTACK_ANIM_LENGTH;
  this.attackTimer = 0;
  this.game.createObject(FireBreathProj.ID, this.level, this.zone, vec2.add(this.pos, BowserObject.PROJ_OFFSET), []);
  this.play("breath.mp3", 1.5, .04);
};

BowserObject.prototype.playerCollide = function(p) {
  if(this.dead || this.garbage) { return; }
  p.damage(this);
};

BowserObject.prototype.playerStomp = BowserObject.prototype.playerCollide;

BowserObject.prototype.playerBump = BowserObject.prototype.playerCollide;

BowserObject.prototype.damage = function(p) {
  if(this.dead) { return; }

  if(--this.health <= 0) { this.bonk(); } else { this.hurtAnimTimer = BowserObject.HURT_ANIM_LENGTH; }
};

/* 'Bonked' is the type of death where an enemy flips upside down and falls off screen */
/* Generally triggred by shells, fireballs, etc */
BowserObject.prototype.bonk = function() {
  if(this.dead) { return; }
  this.setState(BowserObject.STATE.BONK);
  this.pos.y -= 1;
  this.moveSpeed = BowserObject.BONK_IMP.x;
  this.fallSpeed = BowserObject.BONK_IMP.y;
  this.dead = true;
  this.play("fall.mp3", 1., .04);
};

BowserObject.prototype.kill = function() { /* No standard killstate */ };
BowserObject.prototype.isTangible = GameObject.prototype.isTangible;
BowserObject.prototype.destroy = GameObject.prototype.destroy;

BowserObject.prototype.setState = function(STATE) {
  if(STATE === this.state) { return; }
  this.state = STATE;
  if(STATE.SPRITE.length > 0) { this.sprite = STATE.SPRITE[0]; }
  this.anim = 0;
};

BowserObject.prototype.draw = function(sprites) {
  var mod;
  if(this.state === BowserObject.STATE.BONK) { mod = 0x03; }
  else { mod = 0x00; }
  
  if(this.sprite.INDEX instanceof Array) {
    var s = this.sprite.INDEX;
    for(var i=0;i<s.length;i++) {
      for(var j=0;j<s[i].length;j++) {
        sprites.push({pos: vec2.add(this.pos, vec2.make(j,i)), reverse: !this.dir, index: s[!mod?i:(s.length-1-i)][j], mode: mod});
      }
    }
  }
  else { sprites.push({pos: this.pos, reverse: !this.dir, index: this.sprite.INDEX, mode: mod}); }
};

BowserObject.prototype.play = GameObject.prototype.play;

/* Register object class */
GameObject.REGISTER_OBJECT(BowserObject);