"use strict";
/* global util, vec2, squar */
/* global GameObject, BulletObject */
/* global NET011, NET020 */

function LauncherObject(game, level, zone, pos, oid, delay, direction) {
  GameObject.call(this, game, level, zone, pos);
  
  this.oid = oid; // Unique Object ID, is the shor2 of the spawn location
  
  this.setState(LauncherObject.STATE.IDLE);
  
  /* Var */
  this.fireTimer = 0;
  this.delay = isNaN(parseInt(delay))?LauncherObject.FIRE_DELAY_DEFAULT:parseInt(delay);
  this.direction = isNaN(parseInt(direction)) ? 0 : parseInt(direction);
}


/* === STATIC =============================================================== */
LauncherObject.ASYNC = true;
LauncherObject.ID = 0x23;
LauncherObject.NAME = "Bullet Bill Blaster"; // Used by editor
LauncherObject.PARAMS = [{'name': "Delay", 'type': "int", 'tooltip': "How long until another bullet is fired"}, {'name': "Direction", 'type': "int", 'tooltip': "The direction of the bullet fired. 0 is left and 1 is right"}];

LauncherObject.ANIMATION_RATE = 3;

LauncherObject.FIRE_DELAY_DEFAULT = 150;

LauncherObject.SPRITE = {};
LauncherObject.SPRITE_LIST = [
  {NAME: "IDLE", ID: 0x00, INDEX: 0x00FF}
];

/* Makes sprites easily referenceable by NAME. For sanity. */
for(var i=0;i<LauncherObject.SPRITE_LIST.length;i++) {
  LauncherObject.SPRITE[LauncherObject.SPRITE_LIST[i].NAME] = LauncherObject.SPRITE_LIST[i];
  LauncherObject.SPRITE[LauncherObject.SPRITE_LIST[i].ID] = LauncherObject.SPRITE_LIST[i];
}

LauncherObject.STATE = {};
LauncherObject.STATE_LIST = [
  {NAME: "IDLE", ID: 0x00, SPRITE: [LauncherObject.SPRITE.IDLE]}
];

/* Makes states easily referenceable by either ID or NAME. For sanity. */
for(var i=0;i<LauncherObject.STATE_LIST.length;i++) {
  LauncherObject.STATE[LauncherObject.STATE_LIST[i].NAME] = LauncherObject.STATE_LIST[i];
  LauncherObject.STATE[LauncherObject.STATE_LIST[i].ID] = LauncherObject.STATE_LIST[i];
}


/* === INSTANCE ============================================================= */

LauncherObject.prototype.update = function(event) { /* ASYNC */ };

LauncherObject.prototype.step = function() {
  if(++this.fireTimer > this.delay) { this.fire(); }
  
  this.sound();
};

LauncherObject.prototype.sound = GameObject.prototype.sound;

LauncherObject.prototype.fire = function() {
    this.fireTimer = 0;
  this.game.createObject(BulletObject.ID, this.level, this.zone, vec2.copy(this.pos), [shor2.encode(this.pos.x, this.pos.y), this.direction]);
  this.play("firework.mp3", 1., .04);
};

LauncherObject.prototype.kill = function() { };
LauncherObject.prototype.isTangible = GameObject.prototype.isTangible;
LauncherObject.prototype.destroy = GameObject.prototype.destroy;

LauncherObject.prototype.setState = function(STATE) {
  if(STATE === this.state) { return; }
  this.state = STATE;
  this.sprite = STATE.SPRITE[0];
  this.anim = 0;
};

LauncherObject.prototype.draw = function(sprites) { };

LauncherObject.prototype.play = GameObject.prototype.play;

/* Register object class */
GameObject.REGISTER_OBJECT(LauncherObject);