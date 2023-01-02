"use strict";
/* global util, vec2, squar */
/* global GameObject, BulletObject */
/* global NET011, NET020 */

function SpawnerObject(game, level, zone, pos, oid, type, delay, direction) {
  GameObject.call(this, game, level, zone, pos);
  
  this.oid = oid; // Unique Object ID, is the shor2 of the spawn location
  
  this.setState(SpawnerObject.STATE.IDLE);
  
  /* Var */
  this.objectType = parseInt(type);
  this.fireTimer = 0;
  this.delay = isNaN(parseInt(delay))?SpawnerObject.FIRE_DELAY_DEFAULT:parseInt(delay);
  this.direction = isNaN(parseInt(direction)) ? 0 : parseInt(direction);
  
  this.disable();
}


/* === STATIC =============================================================== */
SpawnerObject.ASYNC = false;
SpawnerObject.ID = 37;
SpawnerObject.NAME = "Object Spawner"; // Used by editor

SpawnerObject.ANIMATION_RATE = 3;

SpawnerObject.FIRE_DELAY_DEFAULT = 150;
SpawnerObject.ENABLE_DIST = 26;

SpawnerObject.SPRITE = {};
SpawnerObject.SPRITE_LIST = [
  {NAME: "IDLE", ID: 0x00, INDEX: 0x00FF}
];

/* Makes sprites easily referenceable by NAME. For sanity. */
for(var i=0;i<SpawnerObject.SPRITE_LIST.length;i++) {
  SpawnerObject.SPRITE[SpawnerObject.SPRITE_LIST[i].NAME] = SpawnerObject.SPRITE_LIST[i];
  SpawnerObject.SPRITE[SpawnerObject.SPRITE_LIST[i].ID] = SpawnerObject.SPRITE_LIST[i];
}

SpawnerObject.STATE = {};
SpawnerObject.STATE_LIST = [
  {NAME: "IDLE", ID: 0x00, SPRITE: [SpawnerObject.SPRITE.IDLE]}
];

/* Makes states easily referenceable by either ID or NAME. For sanity. */
for(var i=0;i<SpawnerObject.STATE_LIST.length;i++) {
  SpawnerObject.STATE[SpawnerObject.STATE_LIST[i].NAME] = SpawnerObject.STATE_LIST[i];
  SpawnerObject.STATE[SpawnerObject.STATE_LIST[i].ID] = SpawnerObject.STATE_LIST[i];
}


/* === INSTANCE ============================================================= */

SpawnerObject.prototype.update = function (event) {
    switch (event) {
        case 0xA0:
            this.enable();
            break;
    }
};
SpawnerObject.prototype.disable = function () {
    this.disabled = true;
};
SpawnerObject.prototype.enable = function () {
    this.disabled = false;
};
SpawnerObject.prototype.proximity = function () {
    var player = this.game.getPlayer();
    player && !player.dead && player.level === this.level && player.zone === this.zone && !this.proxHit && vec2.distance(player.pos, this.pos) < GoombaObject.ENABLE_DIST && (this.game.out.push(NET020.encode(this.level, this.zone, this.oid, 0xa0)), this.proxHit = true);
};

SpawnerObject.prototype.step = function () {
    if (this.disabled) return this.proximity();
    if (++this.fireTimer > this.delay) this.fire();

    this.sound();
};

SpawnerObject.prototype.sound = GameObject.prototype.sound;

SpawnerObject.prototype.fire = function () {
    this.fireTimer = 0;
    var obj = this.game.createObject(this.objectType, this.level, this.zone, vec2.copy(this.pos), [this.game.world.getZone(this.level, this.zone).maxOid += 1]);
    obj.enable && obj.enable();
    
    if (this.direction) {
        if (obj.dir) obj.dir = this.direction;
        if (obj.direction) obj.direction = this.direction;
    };

    //this.disable();
    this.proxHit = false;
};

SpawnerObject.prototype.kill = function() { };
SpawnerObject.prototype.isTangible = GameObject.prototype.isTangible;
SpawnerObject.prototype.destroy = GameObject.prototype.destroy;

SpawnerObject.prototype.setState = function(STATE) {
  if(STATE === this.state) { return; }
  this.state = STATE;
  this.sprite = STATE.SPRITE[0];
  this.anim = 0;
};

SpawnerObject.prototype.draw = function(sprites) { };

SpawnerObject.prototype.play = GameObject.prototype.play;

/* Register object class */
GameObject.REGISTER_OBJECT(SpawnerObject);