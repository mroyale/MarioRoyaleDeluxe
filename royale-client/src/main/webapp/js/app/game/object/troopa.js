"use strict";
/* global util, vec2, squar */
/* global GameObject, KoopaObject, PlayerObject */
/* global NET011, NET020 */

function TroopaObject(game, level, zone, pos, oid, fly, variant) {
  GameObject.call(this, game, level, zone, pos);
  
  this.oid = oid; // Unique Object ID, is the shor2 of the spawn location
  
  //this.variant = isNaN(parseInt(variant))?0:parseInt(variant);
  this.variant = 0;
  this.setState(!parseInt(fly)?TroopaObject.STATE.RUN:TroopaObject.STATE.FLY);
  
  /* Animation */
  this.anim = 0;
  
  /* Dead */
  this.bonkTimer = 0;
  
  /* Physics */
  this.loc = [this.pos.y + (TroopaObject.FLY_DISTANCE*.5), this.pos.y - (TroopaObject.FLY_DISTANCE*.5)];
  this.dim = vec2.make(1., 1.);
  this.moveSpeed = 0;
  this.fallSpeed = 0;
  this.grounded = false;
  
  /* Var */
  this.disabled = false;
  this.disabledTimer = 0;
  this.proxHit = false;    // So we don't send an enable event every single frame while waiting for server response.
  
  this.immuneTimer = 0;
  
  /* Control */
  this.rev = false; /* false -> loc[0], true -> loc[1] */
  this.dir = true; /* false = right, true = left */
  
  this.disable();
}


/* === STATIC =============================================================== */
TroopaObject.ASYNC = false;
TroopaObject.ID = 0x13;
TroopaObject.NAME = "Koopa Troopa Red"; // Used by editor
TroopaObject.PARAMS = [{'name': "Fly", 'type': 'int', 'tooltip': "Determines whether the koopa flies or not. 0 is no and 1 is yes"}];

TroopaObject.FLY_DISTANCE = 3;

TroopaObject.FLY_ACCEL = 0.0025;
TroopaObject.FLY_SPEED_MAX = 0.075;

TroopaObject.CHECK_DIST = 0.1;

TroopaObject.SPRITE = {};
TroopaObject.SPRITE_LIST = [
  {NAME: "FLY0", ID: 0x0, INDEX: [[0x0062],[0x0052]]},
  {NAME: "FLY1", ID: 0x01, INDEX: [[0x0063],[0x0053]]},
  {NAME: "RUN0", ID: 0x02, INDEX: [[0x0060],[0x0050]]},
  {NAME: "RUN1", ID: 0x03, INDEX: [[0x0061],[0x0051]]},
  {NAME: "TRANSFORM", ID: 0x04, INDEX: 0x0084},
  {NAME: "SHELL", ID: 0x05, INDEX: 0x0083},
  {NAME: "SPIN0", ID: 0x06, INDEX: 0x0083},
  {NAME: "SPIN1", ID: 0x07, INDEX: 0x0082},
  {NAME: "SPIN2", ID: 0x08, INDEX: 0x0081},
  {NAME: "SPIN3", ID: 0x09, INDEX: 0x0080}
];

/* Makes sprites easily referenceable by NAME. For sanity. */
for(var i=0;i<TroopaObject.SPRITE_LIST.length;i++) {
  TroopaObject.SPRITE[TroopaObject.SPRITE_LIST[i].NAME] = TroopaObject.SPRITE_LIST[i];
  TroopaObject.SPRITE[TroopaObject.SPRITE_LIST[i].ID] = TroopaObject.SPRITE_LIST[i];
}

TroopaObject.STATE = {};
TroopaObject.STATE_LIST = [
  {NAME: "FLY", ID: 0x00, SPRITE: [TroopaObject.SPRITE.FLY0,TroopaObject.SPRITE.FLY1]},
  {NAME: "RUN", ID: 0x01, SPRITE: [TroopaObject.SPRITE.RUN0,TroopaObject.SPRITE.RUN1]},
  {NAME: "TRANSFORM", ID: 0x02, SPRITE: [TroopaObject.SPRITE.SHELL,TroopaObject.SPRITE.TRANSFORM]},
  {NAME: "SHELL", ID: 0x03, SPRITE: [TroopaObject.SPRITE.SHELL]},
  {NAME: "SPIN", ID: 0x04, SPRITE: [TroopaObject.SPRITE.SPIN0,TroopaObject.SPRITE.SPIN1,TroopaObject.SPRITE.SPIN2,TroopaObject.SPRITE.SPIN3]},
  {NAME: "BONK", ID: 0x51, SPRITE: []}
];

/* Makes states easily referenceable by either ID or NAME. For sanity. */
for(var i=0;i<TroopaObject.STATE_LIST.length;i++) {
  TroopaObject.STATE[TroopaObject.STATE_LIST[i].NAME] = TroopaObject.STATE_LIST[i];
  TroopaObject.STATE[TroopaObject.STATE_LIST[i].ID] = TroopaObject.STATE_LIST[i];
}


/* === INSTANCE ============================================================= */

TroopaObject.prototype.update = KoopaObject.prototype.update;

TroopaObject.prototype.step = function() {
  /* Disabled */
  if(this.disabled) { this.proximity(); return; }
  else if(this.disabledTimer > 0) { this.disabledTimer--; }
  
  /* Bonked */
  if(this.state === TroopaObject.STATE.BONK) {
    if(this.bonkTimer++ > KoopaObject.BONK_TIME || this.pos.y+this.dim.y < 0) { this.destroy(); return; }
    
    this.pos = vec2.add(this.pos, vec2.make(this.moveSpeed, this.fallSpeed));
    this.moveSpeed *= KoopaObject.BONK_DECEL;
    this.fallSpeed = Math.max(this.fallSpeed - KoopaObject.FALL_SPEED_ACCEL, -KoopaObject.BONK_FALL_SPEED);
    return;
  }
  
  /* Anim */
  this.anim++;
  this.sprite = this.state.SPRITE[parseInt(this.anim/KoopaObject.ANIMATION_RATE) % this.state.SPRITE.length];
  
  if(this.state === TroopaObject.STATE.SHELL || this.state === TroopaObject.STATE.TRANSFORM) {
    if(--this.transformTimer < KoopaObject.TRANSFORM_THRESHOLD) { this.setState(TroopaObject.STATE.TRANSFORM); }
    if(this.transformTimer <= 0) { this.setState(TroopaObject.STATE.RUN); }
  }
  
  /* Normal Gameplay */
  if(this.immuneTimer > 0) { this.immuneTimer--; }
  
  this.control();
  this.physics();
  this.interaction();
  this.sound();
  
  if(this.pos.y < -2.) { this.destroy(); }
};

TroopaObject.prototype.control = function() {
  if(this.state === TroopaObject.STATE.FLY) { this.moveSpeed = this.dir ? -KoopaObject.MOVE_SPEED_MAX : KoopaObject.MOVE_SPEED_MAX; }
  if(this.state === TroopaObject.STATE.RUN) {
    if(this.grounded && !this.checkGround()) { this.dir = !this.dir; }
    this.moveSpeed = this.dir ? -KoopaObject.MOVE_SPEED_MAX : KoopaObject.MOVE_SPEED_MAX;
  }
  if(this.state === TroopaObject.STATE.SPIN) { this.moveSpeed = this.dir ? -KoopaObject.SHELL_MOVE_SPEED_MAX : KoopaObject.SHELL_MOVE_SPEED_MAX; }
  if(this.state === TroopaObject.STATE.SHELL || this.state === TroopaObject.STATE.TRANSFORM) { this.moveSpeed = 0; }
};

TroopaObject.prototype.physics = function() {
  if(this.state === TroopaObject.STATE.FLY) {
    if(this.rev) {
      this.fallSpeed = Math.min(TroopaObject.FLY_SPEED_MAX, this.fallSpeed+TroopaObject.FLY_ACCEL);
      this.pos.y += this.fallSpeed;
      if(this.pos.y >= this.loc[0]) { this.rev = false; }
    }
    else {
      this.fallSpeed = Math.max(-TroopaObject.FLY_SPEED_MAX, this.fallSpeed-TroopaObject.FLY_ACCEL);
      this.pos.y += this.fallSpeed;
      if(this.pos.y <= this.loc[1]) { this.rev = true; }
    }
    return;
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

      if (this.state === TroopaObject.STATE.SPIN) tile.definition.TRIGGER(this.game, this.pid, tile, this.level, this.zone, tile.pos.x, tile.pos.y, td32.TRIGGER.TYPE.SHELL);
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
        this.fallSpeed = 0;
      }
    }
  }
  this.pos = vec2.make(movx.x, movy.y);
  if(changeDir) { this.dir = !this.dir; }
};

TroopaObject.prototype.interaction = function() {
  if(this.state !== TroopaObject.STATE.SPIN) { return; }
  for(var i=0;i<this.game.objects.length;i++) {
    var obj = this.game.objects[i];
    if(obj === this || obj instanceof PlayerObject || !obj.isTangible() || !obj.damage) { continue; }  // Skip players and objects that lack a damage function to call
    if(obj.level === this.level && obj.zone === this.zone) {
      var hit = squar.intersection(obj.pos, obj.dim, this.pos, this.dim);
      if(hit) { obj.damage(); }  // We don't sync this event since it's not a direct player interaction. It *should* synchronize naturally though.
    }
  }
};

TroopaObject.prototype.sound = GameObject.prototype.sound;

/* Looks at the ground in front of this koopa troopa and checks if it's solid. */
TroopaObject.prototype.checkGround = function() {
  var inf = this.dir?vec2.add(this.pos, vec2.make(-TroopaObject.CHECK_DIST, 0)):vec2.add(this.pos, vec2.make(TroopaObject.CHECK_DIST+this.dim.x, 0));
  inf.y -= 1.5;
  
  var tile = this.game.world.getZone(this.level, this.zone).getTile(inf);
  
  return tile.definition.COLLIDE;
};

/* Tests against client player to see if they are near enough that we should enable this enemy. */
/* On a successful test we send a object event 0xA0 to the server to trigger this enemy being enabled for all players */
TroopaObject.prototype.proximity = KoopaObject.prototype.proximity;
TroopaObject.prototype.enable = KoopaObject.prototype.enable;
TroopaObject.prototype.disable = KoopaObject.prototype.disable;

TroopaObject.prototype.damage = KoopaObject.prototype.damage;

/* 'Bonked' is the type of death where an enemy flips upside down and falls off screen */
/* Generally triggred by shells, fireballs, etc */
TroopaObject.prototype.bonk = function() {
  if(this.dead) { return; }
  this.setState(TroopaObject.STATE.BONK);
  this.moveSpeed = KoopaObject.BONK_IMP.x;
  this.fallSpeed = KoopaObject.BONK_IMP.y;
  this.dead = true;
  this.play("kick.mp3", 1., .04);
};

/* dir (true = left, false = right) */
TroopaObject.prototype.stomped = function(dir) {
  if(this.state === TroopaObject.STATE.FLY) { this.setState(TroopaObject.STATE.RUN); }
  else if(this.state === TroopaObject.STATE.RUN) { this.setState(TroopaObject.STATE.SHELL); this.transformTimer = KoopaObject.TRANSFORM_TIME; }
  else if(this.state === TroopaObject.STATE.SPIN) { this.setState(TroopaObject.STATE.SHELL); this.transformTimer = KoopaObject.TRANSFORM_TIME; }
  else if(this.state === TroopaObject.STATE.SHELL || this.state === TroopaObject.STATE.TRANSFORM) {
    this.setState(TroopaObject.STATE.SPIN);
    this.dir = dir;
    this.game.world.getZone(this.level, this.zone).effects.push(new DustEffect(this.pos));
  }
  this.play("stomp.mp3", 1., .04);
};

TroopaObject.prototype.playerCollide = function(p) {
  if(this.dead || this.garbage) { return; }
  if(this.state === TroopaObject.STATE.SHELL || this.state === TroopaObject.STATE.TRANSFORM) {
    var dir = p.pos.x-this.pos.x > 0;
    this.stomped(dir);
    this.game.out.push(NET020.encode(this.level, this.zone, this.oid, dir?0x10:0x11));
    this.immuneTimer = KoopaObject.PLAYER_IMMUNE_TIME;
  }
  else if(this.immuneTimer <= 0) { p.damage(this); }
};
TroopaObject.prototype.playerStomp = KoopaObject.prototype.playerStomp;

TroopaObject.prototype.playerBump = KoopaObject.prototype.playerBump;

TroopaObject.prototype.kill = KoopaObject.prototype.kill;
TroopaObject.prototype.destroy = KoopaObject.prototype.destroy;
TroopaObject.prototype.isTangible = KoopaObject.prototype.isTangible;

TroopaObject.prototype.setState = KoopaObject.prototype.setState;

TroopaObject.prototype.draw = function(sprites) {
  /* Disabled */
  if(this.disabled) { return; }
  
  var mod;
  if(this.state === TroopaObject.STATE.BONK) { mod = 0x03; }
  else if(this.disabledTimer > 0) { mod = 0xA0 + parseInt((1.-(this.disabledTimer/KoopaObject.ENABLE_FADE_TIME))*32.); }
  else { mod = 0x00; }
  
  if(this.sprite.INDEX instanceof Array) {
    var s = this.sprite.INDEX;
    for(var i=0;i<s.length;i++) {
      for(var j=0;j<s[i].length;j++) {
        var sp = s[mod!==0x03?i:(s.length-1-i)][j];
        switch(this.variant) {
          case 1 : { sp += KoopaObject.VARIANT_OFFSET; break; }
          default : { break; }
        }
        sprites.push({pos: vec2.add(this.pos, vec2.make(j,i)), reverse: !this.dir, index: sp, mode: mod});
      }
    }
  }
  else {
    var sp = this.sprite.INDEX;
    switch(this.variant) {
      case 1 : { sp += KoopaObject.VARIANT_OFFSET; break; }
      default : { break; }
    }
    sprites.push({pos: this.pos, reverse: !this.dir, index: sp, mode: mod});
  }
};

TroopaObject.prototype.play = GameObject.prototype.play;

/* Register object class */
GameObject.REGISTER_OBJECT(TroopaObject);