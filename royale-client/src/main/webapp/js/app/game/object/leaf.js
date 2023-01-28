"use strict";
/* global util, vec2, squar */
/* global GameObject, ItemObject */
/* global NET011, NET020 */

function LeafObject(game, level, zone, pos, oid) {
  ItemObject.call(this, game, level, zone, pos, oid);
  
  this.stage = 0; // 0: blast, 1: blasting, 2: blasted
  this.state = LeafObject.STATE.IDLE;
  this.sprite = this.state.SPRITE[0];
  this.impulse = 1;
  this.directionTimer = 0;
  this.dir = true; // true=right, false=left

  this.loc = vec2.copy(this.pos);
}

/* === STATIC =============================================================== */
LeafObject.ASYNC = false;
LeafObject.ID = 0x57;
LeafObject.NAME = "Tanooki Leaf"; // Used by editor

LeafObject.IMPULSE = 0.83;
LeafObject.DRAG = .95;
LeafObject.FALL_SPEED_ACCEL = .025;

LeafObject.SPRITE = {};
LeafObject.SPRITE_LIST = [
  {NAME: "IDLE", ID: 0x00, INDEX: 0x00DF}
];

/* Makes sprites easily referenceable by NAME. For sanity. */
for(var i=0;i<LeafObject.SPRITE_LIST.length;i++) {
  LeafObject.SPRITE[LeafObject.SPRITE_LIST[i].NAME] = LeafObject.SPRITE_LIST[i];
  LeafObject.SPRITE[LeafObject.SPRITE_LIST[i].ID] = LeafObject.SPRITE_LIST[i];
}

LeafObject.STATE = {};
LeafObject.STATE_LIST = [
  {NAME: "IDLE", ID: 0x00, SPRITE: [LeafObject.SPRITE.IDLE]}
];

/* Makes states easily referenceable by either ID or NAME. For sanity. */
for(var i=0;i<LeafObject.STATE_LIST.length;i++) {
  LeafObject.STATE[LeafObject.STATE_LIST[i].NAME] = LeafObject.STATE_LIST[i];
  LeafObject.STATE[LeafObject.STATE_LIST[i].ID] = LeafObject.STATE_LIST[i];
}

/* === INSTANCE ============================================================= */

LeafObject.prototype.update = ItemObject.prototype.update;
LeafObject.prototype.step = ItemObject.prototype.step;

LeafObject.prototype.control = function() {
  if (!this.stage) {
    this.blast();
    this.stage = 1;
  }
};

LeafObject.prototype.physics = function() {
  if(this.fallSpeed > 0) {
    this.fallSpeed = (this.fallSpeed-LeafObject.FALL_SPEED_ACCEL)*LeafObject.DRAG;
    this.pos.y += this.fallSpeed;
  } else {
    if (++this.directionTimer > 75) {
      this.dir = !this.dir;
      this.directionTimer = 0;
    } else {
      this.dir ? this.pos.x += 0.025 : this.pos.x -= 0.025;
      this.pos.y -= 0.01;
    }
  }
};

LeafObject.prototype.blast = function() {
  this.pos = vec2.copy(this.loc);
  this.fallSpeed = LeafObject.IMPULSE*this.impulse;
};

LeafObject.prototype.playerCollide = ItemObject.prototype.playerCollide;
LeafObject.prototype.playerStomp = ItemObject.prototype.playerStomp;
LeafObject.prototype.playerBump = ItemObject.prototype.playerBump;

LeafObject.prototype.kill = ItemObject.prototype.kill;
LeafObject.prototype.destroy = GameObject.prototype.destroy;
LeafObject.prototype.isTangible = GameObject.prototype.isTangible;

LeafObject.prototype.setState = ItemObject.prototype.setState;
LeafObject.prototype.draw = ItemObject.prototype.draw;

/* Register object class */
GameObject.REGISTER_OBJECT(LeafObject);