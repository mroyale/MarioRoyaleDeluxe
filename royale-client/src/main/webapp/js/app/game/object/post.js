"use strict";
/* global util, vec2, squar */
/* global GameObject */
/* global NET011, NET020 */

function PostObject(game, level, zone, pos, oid, movy) {
  GameObject.call(this, game, level, zone, pos);
  
  this.oid = oid; // Unique Object ID, is the shor2 of the spawn location
  
  this.setState(PostObject.STATE.IDLE);
  
  /* Animation */
  this.anim = 0;
  
  /* Physics */
  this.movy = isNaN(parseInt(movy))?10:parseInt(movy);

  /* Var */
  this.dir = true; // true: up, false: down
  this.dim = vec2.make(1.5, this.movy);
  this.postPos = vec2.copy(this.pos); // Position of the goal post and the hitbox of the post are independent

  this.startPos = vec2.copy(this.pos);
  this.endPos = vec2.add(this.pos, vec2.make(0, this.movy));
}


/* === STATIC =============================================================== */
PostObject.ASYNC = true;
PostObject.ID = 0xB2;
PostObject.NAME = "Goal Post"; // Used by editor
PostObject.PARAMS = [{'name': 'Move Y', 'type': 'int'}];

PostObject.ANIMATION_RATE = 12;

PostObject.SOFFSET = vec2.make(-.5, -.25); // Difference between position of sprite and hitbox.

PostObject.SPEED = 0.05375;

PostObject.SPRITE = {};
PostObject.SPRITE_LIST = [
  {NAME: "IDLE", ID: 0x00, INDEX: [[67, 68]]}
];

/* Makes sprites easily referenceable by NAME. For sanity. */
for(var i=0;i<PostObject.SPRITE_LIST.length;i++) {
  PostObject.SPRITE[PostObject.SPRITE_LIST[i].NAME] = PostObject.SPRITE_LIST[i];
  PostObject.SPRITE[PostObject.SPRITE_LIST[i].ID] = PostObject.SPRITE_LIST[i];
}

PostObject.STATE = {};
PostObject.STATE_LIST = [
  {NAME: "IDLE", ID: 0x00, SPRITE: [PostObject.SPRITE.IDLE]}
];

/* Makes states easily referenceable by either ID or NAME. For sanity. */
for(var i=0;i<PostObject.STATE_LIST.length;i++) {
  PostObject.STATE[PostObject.STATE_LIST[i].NAME] = PostObject.STATE_LIST[i];
  PostObject.STATE[PostObject.STATE_LIST[i].ID] = PostObject.STATE_LIST[i];
}


/* === INSTANCE ============================================================= */

PostObject.prototype.update = function(event) { /* ASYNC */ };

PostObject.prototype.step = function() {
  /* Anim */
  this.anim++;
  this.sprite = this.state.SPRITE[parseInt(this.anim/PostObject.ANIMATION_RATE) % this.state.SPRITE.length];

  /* Normal Gameplay */
  this.physics();
};

PostObject.prototype.physics = function() {
  if(this.dir) {
    if(this.postPos.y >= this.endPos.y) {
      this.dir = false;
    }
  } else {
    if(this.postPos.y <= this.startPos.y) {
      this.dir = true;
    }
  }

  this.postPos.y += (this.dir?PostObject.SPEED:-PostObject.SPEED);
};

PostObject.prototype.playerCollide = function(p) {
  this.destroy();
  p.autoTarget = vec2.add(p.pos, PlayerObject.LEVEL_END_MOVE_OFF);
};

PostObject.prototype.playerStomp = PostObject.prototype.playerCollide;
PostObject.prototype.playerBump = PostObject.prototype.playerCollide;

PostObject.prototype.kill = function() { };
PostObject.prototype.isTangible = GameObject.prototype.isTangible;
PostObject.prototype.destroy = GameObject.prototype.destroy;

PostObject.prototype.setState = function(STATE) {
  if(STATE === this.state) { return; }
  this.state = STATE;
  this.sprite = STATE.SPRITE[0];
  this.anim = 0;
};

PostObject.prototype.draw = function(sprites) {
  if(this.sprite.INDEX instanceof Array) {
    var s = this.sprite.INDEX;
    for(var i=0;i<s.length;i++) {
      for(var j=0;j<s[i].length;j++) {
        sprites.push({pos: vec2.add(vec2.add(this.postPos, PostObject.SOFFSET), vec2.make(j,i)), reverse: false, index: s[i][j]});
      }
    }
  }
  else { sprites.push({pos: vec2.add(this.postPos, PostObject.SOFFSET), reverse: false, index: this.sprite.INDEX, mode: 0x00}); }
};

/* Register object class */
GameObject.REGISTER_OBJECT(PostObject);