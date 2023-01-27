"use strict";
/* global util, vec2, squar */
/* global GameObject, ItemObject */
/* global NET011, NET020 */

function LeafObject(game, level, zone, pos, oid) {
  ItemObject.call(this, game, level, zone, pos, oid);
  
  this.state = LeafObject.STATE.IDLE;
  this.sprite = this.state.SPRITE[0];
}

/* === STATIC =============================================================== */
LeafObject.ASYNC = false;
LeafObject.ID = 0x57;
LeafObject.NAME = "Tanooki Leaf"; // Used by editor

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

LeafObject.prototype.control = function() { };

LeafObject.prototype.physics = ItemObject.prototype.physics;

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