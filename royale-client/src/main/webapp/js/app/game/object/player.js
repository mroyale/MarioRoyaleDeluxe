"use strict";
/* global util, vec2, squar, td32 */
/* global GameObject, MushroomObject, PoisonObject, FlowerObject, StarObject, LifeObject, CoinObject, AxeObject, FireballProj, PlantObject */
/* global NET011, NET013, NET017, NET018, NET020 */

function PlayerObject(game, level, zone, pos, pid, character) {
  GameObject.call(this, game, level, zone, pos);
  
  this.pid = pid; // Unique Player ID
  this.character = character; // 0: Mario, 1: Luigi
  
  /* Animation */
  this.anim = 0;
  this.reverse = false;
  this.arrowFade = 0.;
  
  /* Dead */
  this.deadFreezeTimer = 0;
  this.deadTimer = 0;
  
  /* Physics */
  this.lastPos = this.pos;   // Position of infringio on previous frame
  this.dim = vec2.make(1., 1.);
  this.moveSpeed = 0;
  this.fallSpeed = 0;
  this.jumping = -1;
  this.isBounce = false;  // True if the jump we are doing was a bounce
  this.isSpring = false;  // True if the jump we are doing was a spring launch
  this.grounded = false;
  this.underWater = false; // false: no, true: yes
  this.icePhysics = false; // false: no, true: yes
  this.conveyor = -1; // -1: nothing, 0: left, 1: right
  
  /* Var */
  this.name = undefined;     // If this is set for whatever reason, it will display a name tag over this player.
  
  this.power = 0;            // Powerup Index
  this.starTimer = 0;        // Star powerup active timer
  this.starMusic = undefined;
  this.damageTimer = 0;      // Post damage invincibility timer
  this.spinTimer = 0;

  this.glideTimer = 0;
  this.glideCooldown = 0;
  
  this.transformTimer = 0;
  this.transformTarget = -1;
  
  this.pipeWarp = undefined; // Warp point that the pipe we are using is linked to
  this.pipeTimer = 0;        // Timer for warp pipe animation
  this.pipeDir = -1;  // Direction of current anim.  null up down left right = -1 0 1 2 3
  this.pipeExt = -1;  // Direction of the exit pipe. null up down left right = -1 0 1 2 3
  this.pipeDelay = 0;
  this.pipeDelayLength = 0;  // Set by the last pipe we went in.
  
  this.poleTimer = 0; // Timer used for flag pole
  this.poleWait = false;  // True when waiting for flag to come all the way down
  this.poleSound = false; // True after it plays. Resets after pole slide done;
  
  this.vineWarp = undefined; // The warp id that we are going to warp to when we climb up this vine
  
  this.attackCharge = PlayerObject.MAX_CHARGE;
  this.attackTimer = 0;
  this.spinCharge = PlayerObject.MAX_CHARGE;
  
  this.autoTarget = undefined; // Vec2 target for automatic movement.
  
  /* Control */
  this.btnD = [0,0]; // D-Pad
  this.btnA = false;
  this.btnAHot = false;
  this.btnB = false;
  this.btnBg = false; // More hacky stuff. last b state while grounded
  this.btnBde = false; // Pressed
  this.btnU = false; // Taunt
  
  /* State */
  this.setState(PlayerObject.SNAME.STAND);
}


/* === STATIC =============================================================== */
PlayerObject.ASYNC = false;
PlayerObject.ID = 0x01;
PlayerObject.NAME = "Player [Do not use!]"; // Used by editor

PlayerObject.ANIMATION_RATE = 6;
PlayerObject.DIM_OFFSET = vec2.make(-.05, 0.);

PlayerObject.OFFSET_32X_LEFT = vec2.make(.50, 0.);
PlayerObject.OFFSET_32X_RIGHT = vec2.make(-.48, 0.);

PlayerObject.DEAD_FREEZE_TIME = 28;
PlayerObject.DEAD_TIME = 140;
PlayerObject.DEAD_UP_FORCE = 1;

PlayerObject.WATER_SPEED_MAX = 0.250;
PlayerObject.RUN_SPEED_MAX = 0.465;
PlayerObject.STAR_SPEED_MAX = 0.485;
PlayerObject.MOVE_SPEED_MAX = 0.250;
PlayerObject.AUTO_SPEED_MAX = 0.150;
PlayerObject.MOVE_SPEED_ACCEL = 0.013;
PlayerObject.MOVE_ICE_ACCEL = 0.0065;
PlayerObject.MOVE_SPEED_DECEL = 0.0180;
PlayerObject.MOVE_ICE_DECEL = 0.009;
PlayerObject.MOVE_SPEED_ACCEL_AIR = 0.0025;
PlayerObject.STUCK_SLIDE_SPEED = 0.08;

PlayerObject.FALL_SPEED_SPIN = -0.01;
PlayerObject.WATER_FALL_SPEED = 0.45;
PlayerObject.WATER_FALL_ACCEL = 0.025;
PlayerObject.FALL_SPEED_MAX = 0.65;
PlayerObject.FALL_SPEED_ACCEL = 0.06;
PlayerObject.BOUNCE_LENGTH_MIN = 1;
PlayerObject.SPRING_LENGTH_MIN = 5;
PlayerObject.SPRING_LENGTH_MAX = 35;
PlayerObject.JUMP_LENGTH_MIN = 0.01;
PlayerObject.JUMP_LENGTH_MAX = 30;
PlayerObject.JUMP_SPEED_INC_THRESHOLD = [0.01, 0.02, 0.025];
PlayerObject.JUMP_DECEL = 0.013;
PlayerObject.SPRING_DECEL = 0.003;
PlayerObject.BLOCK_BUMP_THRESHOLD = 0.12;

PlayerObject.POWER_INDEX_SIZE = 0x20;
PlayerObject.GENERIC_INDEX = 0x90;

PlayerObject.DAMAGE_TIME = 90;
PlayerObject.TRANSFORM_TIME = 36;
PlayerObject.LEAF_TRANSFORM_TIME = 16;
PlayerObject.TRANSFORM_ANIMATION_RATE = 4;
PlayerObject.STAR_LENGTH = 720;
PlayerObject.SPIN_LENGTH = 10;
PlayerObject.SPIN_COOLDOWN = 8;
PlayerObject.PROJ_OFFSET = vec2.make(0.7, 1.1);
PlayerObject.MAX_CHARGE = 60;
PlayerObject.ATTACK_DELAY = 14;
PlayerObject.ATTACK_CHARGE = 40;
PlayerObject.ATTACK_ANIM_LENGTH = 6;

PlayerObject.PIPE_TIME = 60;
PlayerObject.PIPE_SPEED = 0.03;
PlayerObject.PIPE_EXT_OFFSET = vec2.make(.5,0.); // Horizontal offset from warp point when exiting warp pipe.
PlayerObject.WEED_EAT_RADIUS = 3;

PlayerObject.POLE_DELAY = 30;
PlayerObject.POLE_SLIDE_SPEED = 0.125;
PlayerObject.LEVEL_END_MOVE_OFF = vec2.make(10, 0); // Position offset for where auto walk to at the end of a level.

PlayerObject.CLIMB_SPEED = 0.0625;

PlayerObject.PLATFORM_SNAP_DIST = 0.15;

PlayerObject.ARROW_SPRITE = 0x0FD;
PlayerObject.ARROW_TEXT = "YOU";
PlayerObject.ARROW_OFFSET = vec2.make(0., 0.1);
PlayerObject.TEXT_OFFSET = vec2.make(0., 0.55);
PlayerObject.TEXT_SIZE = .65;
PlayerObject.TEXT_COLOR = "#FFFFFF";
PlayerObject.ARROW_RAD_IN = 3;
PlayerObject.ARROW_RAD_OUT = 7;
PlayerObject.ARROW_THRESHOLD_MIN = 4;
PlayerObject.ARROW_THRESHOLD_MAX = 6;

PlayerObject.TEAM_OFFSET = vec2.make(0., 0.);
PlayerObject.TEAM_SIZE = .3;
PlayerObject.TEAM_COLOR = "rgba(255,255,255,0.75)";
PlayerObject.DEV_TEAM_COLOR = "rgba(255,255,0,1)";

PlayerObject.SPRITE = {};
PlayerObject.SPRITE_LIST = [
  /* [S]mall Mario */
  {NAME: "S_STAND", ID: 0x00, INDEX: [[31], [15]]},
  {NAME: "S_RUN0", ID: 0x01, INDEX: [[30], [14]]},
  {NAME: "S_RUN1", ID: 0x02, INDEX: [[29], [13]]},
  {NAME: "S_RUN2", ID: 0x03, INDEX: [[28], [12]]},
  {NAME: "S_SLIDE", ID: 0x04, INDEX: [[27], [11]]},
  {NAME: "S_FALL", ID: 0x05, INDEX: [[26], [10]]},
  {NAME: "S_CLIMB0", ID: 0x06, INDEX: [[25], [9]]},
  {NAME: "S_CLIMB1", ID: 0x07, INDEX: [[24], [8]]},
  {NAME: "S_TAUNT", ID: 0x08, INDEX: [[19], [3]]},
  {NAME: "S_SWIM0", ID: 0x09, INDEX: [[23], [7]]},
  {NAME: "S_SWIM1", ID: 0x0A, INDEX: [[22], [6]]},
  {NAME: "S_SWIM2", ID: 0x0B, INDEX: [[21], [5]]},
  /* [B]ig Mario */
  {NAME: "B_STAND", ID: 0x20, INDEX: [[63, 62], [47, 46]]}, 
  {NAME: "B_DOWN", ID: 0x21, INDEX: [[55, 54], [39, 38]]},
  {NAME: "B_RUN0", ID: 0x22, INDEX: [[61, 60], [45, 44]]},
  {NAME: "B_RUN1", ID: 0x23, INDEX: [[59, 58], [43, 42]]},
  {NAME: "B_RUN2", ID: 0x24, INDEX: [[57, 56], [41, 40]]},
  {NAME: "B_SLIDE", ID: 0x25, INDEX: [[53, 52], [37, 36]]},
  {NAME: "B_FALL", ID: 0x26, INDEX: [[51, 50], [35, 34]]},
  {NAME: "B_CLIMB0", ID: 0x27, INDEX: [[49, 48], [33, 32]]},
  {NAME: "B_CLIMB1", ID: 0x28, INDEX: [[95, 94], [79, 78]]},
  {NAME: "B_TRANSFORM", ID:0x29, INDEX:[[81, 80], [65, 64]]},
  {NAME: "B_TAUNT", ID: 0x30, INDEX: [[89, 88], [73, 72]]},
  {NAME: "B_SWIM0", ID: 0x31, INDEX: [[87, 86], [71, 70]]},
  {NAME: "B_SWIM1", ID: 0x32, INDEX: [[85, 84], [69, 68]]},
  {NAME: "B_SWIM2", ID: 0x33, INDEX: [[83, 82], [67, 66]]},
  /* [F]ire flower Mario */
  {NAME: "F_STAND", ID: 0x40, INDEX: [[159, 158], [143, 142]]}, 
  {NAME: "F_DOWN", ID: 0x41, INDEX: [[151, 150], [135, 134]]},
  {NAME: "F_RUN0", ID: 0x42, INDEX: [[157, 156], [141, 140]]},
  {NAME: "F_RUN1", ID: 0x43, INDEX: [[155, 154], [139, 138]]},
  {NAME: "F_RUN2", ID: 0x44, INDEX: [[153, 152], [137, 136]]},
  {NAME: "F_SLIDE", ID: 0x45, INDEX: [[149, 148], [133, 132]]},
  {NAME: "F_FALL", ID: 0x46, INDEX: [[147, 146], [131, 130]]},
  {NAME: "F_CLIMB0", ID: 0x47, INDEX: [[191, 190], [175, 174]]},
  {NAME: "F_CLIMB1", ID: 0x48, INDEX: [[145, 144], [129, 128]]},
  {NAME: "F_ATTACK", ID: 0x49, INDEX: [[177, 176], [161, 160]]},
  {NAME: "F_TRANSFORM", ID:0x50, INDEX:[[223, 222], [207, 206]]},
  {NAME: "F_TAUNT", ID: 0x51, INDEX: [[185, 184], [169, 168]]},
  {NAME: "F_SWIM0", ID: 0x52, INDEX: [[183, 182], [167, 166]]},
  {NAME: "F_SWIM1", ID: 0x53, INDEX: [[181, 180], [165, 164]]},
  {NAME: "F_SWIM2", ID: 0x54, INDEX: [[179, 178], [163, 162]]},
  /* [L]eaf Mario */
  {NAME: "L_STAND", ID: 0x60, INDEX: [[255, 254], [239, 238]]},
  {NAME: "L_DOWN", ID: 0x61, INDEX: [[247, 246], [231, 230]]},
  {NAME: "L_RUN0", ID: 0x62, INDEX: [[253, 252], [237, 236]]},
  {NAME: "L_RUN1", ID: 0x63, INDEX: [[251, 250], [235, 234]]},
  {NAME: "L_RUN2", ID: 0x64, INDEX: [[249, 248], [233, 232]]},
  {NAME: "L_SLIDE", ID: 0x65, INDEX: [[245, 244], [229, 228]]},
  {NAME: "L_FALL", ID: 0x66, INDEX: [[243, 242], [227, 226]]},
  {NAME: "L_CLIMB0", ID: 0x67, INDEX: [[241, 240], [225, 224]]},
  {NAME: "L_CLIMB1", ID: 0x68, INDEX: [[287, 286], [271, 270]]},
  {NAME: "L_TRANSFORM", ID: 0x69, INDEX: [[0, 0], [0, 0]]},
  {NAME: "L_TAUNT", ID: 0x70, INDEX: [[281, 280], [265, 264]]},
  {NAME: "L_ATTACK0", ID: 0x71, INDEX: [[315, 314], [299, 298]]},
  {NAME: "L_ATTACK1", ID: 0x72, INDEX: [[313, 312], [297, 296]]},
  {NAME: "L_ATTACK2", ID: 0x73, INDEX: [[311, 310], [295, 294]]},
  {NAME: "L_ATTACK3", ID: 0x74, INDEX: [[309, 308], [293, 292]]},
  {NAME: "L_SWIM0", ID: 0x75, INDEX: [[279, 278], [263, 262]]},
  {NAME: "L_SWIM1", ID: 0x76, INDEX: [[277, 276], [261, 260]]},
  {NAME: "L_SWIM2", ID: 0x77, INDEX: [[275, 274], [259, 258]]},
  {NAME: "L_GLIDE0", ID: 0x78, INDEX: [[273, 272], [257, 256]]},
  {NAME: "L_GLIDE1", ID: 0x79, INDEX: [[319, 318], [303, 302]]},
  {NAME: "L_GLIDE2", ID: 0x80, INDEX: [[317, 316], [301, 300]]},
  /* [G]eneric */
  {NAME: "G_DEAD", ID: 0x90, INDEX: [[18], [2]]},
  {NAME: "G_HIDE", ID: 0x9A, INDEX: 0x0001}
];

/* Makes sprites easily referenceable by NAME. For sanity. */
for(var i=0;i<PlayerObject.SPRITE_LIST.length;i++) {
  PlayerObject.SPRITE[PlayerObject.SPRITE_LIST[i].NAME] = PlayerObject.SPRITE_LIST[i];
  PlayerObject.SPRITE[PlayerObject.SPRITE_LIST[i].ID] = PlayerObject.SPRITE_LIST[i];
}

/* State Name */
PlayerObject.SNAME = {
  STAND: "STAND",
  DOWN: "DOWN",
  RUN: "RUN",
  SLIDE: "SLIDE",
  FALL: "FALL",
  POLE: "POLE",
  CLIMB: "CLIMB",
  ATTACK: "ATTACK",
  TRANSFORM: "TRANSFORM",
  TAUNT: "TAUNT",
  SWIM: "SWIM",
  GLIDE: "GLIDE",
  DEAD: "DEAD",
  HIDE: "HIDE",
  GHOST: "GHOST",
  DEADGHOST: "DEADGHOST"
};

let DIM0 = vec2.make(0.9,0.95);  // Temp vars
let DIM1 = vec2.make(0.9,1.9);
let DIM2 = vec2.make(0.9,0.75);
PlayerObject.STATE = [
  /* Small Mario -> 0x00*/
  {NAME: PlayerObject.SNAME.STAND, ID: 0x00, DIM: DIM0, SPRITE: [PlayerObject.SPRITE.S_STAND]},
  {NAME: PlayerObject.SNAME.DOWN, ID: 0x01, DIM: DIM0, SPRITE: [PlayerObject.SPRITE.S_STAND]},
  {NAME: PlayerObject.SNAME.RUN, ID: 0x02, DIM: DIM0, SPRITE: [PlayerObject.SPRITE.S_RUN2,PlayerObject.SPRITE.S_RUN1,PlayerObject.SPRITE.S_RUN0]},
  {NAME: PlayerObject.SNAME.SLIDE, ID: 0x03, DIM: DIM0, SPRITE: [PlayerObject.SPRITE.S_SLIDE]},
  {NAME: PlayerObject.SNAME.FALL, ID: 0x04, DIM: DIM0, SPRITE: [PlayerObject.SPRITE.S_FALL]},
  {NAME: PlayerObject.SNAME.TRANSFORM, ID: 0x05, DIM: DIM0, SPRITE: [PlayerObject.SPRITE.S_STAND]},
  {NAME: PlayerObject.SNAME.POLE, ID: 0x06, DIM: DIM0, SPRITE: [PlayerObject.SPRITE.S_CLIMB1]},
  {NAME: PlayerObject.SNAME.CLIMB, ID: 0x07, DIM: DIM0, SPRITE: [PlayerObject.SPRITE.S_CLIMB0,PlayerObject.SPRITE.S_CLIMB1]},
  {NAME: PlayerObject.SNAME.TAUNT, ID: 0x08, DIM: DIM0, SPRITE: [PlayerObject.SPRITE.S_TAUNT]},
  {NAME: PlayerObject.SNAME.SWIM, ID: 0x09, DIM: DIM0, SPRITE: [PlayerObject.SPRITE.S_SWIM0, PlayerObject.SPRITE.S_SWIM1, PlayerObject.SPRITE.S_SWIM2]},
  /* Big Mario -> 0x20 */
  {NAME: PlayerObject.SNAME.STAND, ID: 0x20, DIM: DIM1, SPRITE: [PlayerObject.SPRITE.B_STAND]},
  {NAME: PlayerObject.SNAME.DOWN, ID: 0x21, DIM: DIM2, SPRITE: [PlayerObject.SPRITE.B_DOWN]},
  {NAME: PlayerObject.SNAME.RUN, ID: 0x22, DIM: DIM1, SPRITE: [PlayerObject.SPRITE.B_RUN2,PlayerObject.SPRITE.B_RUN1,PlayerObject.SPRITE.B_RUN0]},
  {NAME: PlayerObject.SNAME.SLIDE, ID: 0x23, DIM: DIM1, SPRITE: [PlayerObject.SPRITE.B_SLIDE]},
  {NAME: PlayerObject.SNAME.FALL, ID: 0x24, DIM: DIM1, SPRITE: [PlayerObject.SPRITE.B_FALL]},
  {NAME: PlayerObject.SNAME.TRANSFORM, ID: 0x25, DIM: DIM0, SPRITE: [PlayerObject.SPRITE.B_TRANSFORM]},
  {NAME: PlayerObject.SNAME.POLE, ID: 0x26, DIM: DIM1, SPRITE: [PlayerObject.SPRITE.B_CLIMB0]},
  {NAME: PlayerObject.SNAME.CLIMB, ID: 0x27, DIM: DIM1, SPRITE: [PlayerObject.SPRITE.B_CLIMB0,PlayerObject.SPRITE.B_CLIMB1]},
  {NAME: PlayerObject.SNAME.TAUNT, ID: 0x28, DIM: DIM1, SPRITE: [PlayerObject.SPRITE.B_TAUNT]},
  {NAME: PlayerObject.SNAME.SWIM, ID: 0x29, DIM: DIM1, SPRITE: [PlayerObject.SPRITE.B_SWIM0, PlayerObject.SPRITE.B_SWIM1, PlayerObject.SPRITE.B_SWIM2]},
  /* Fire Mario -> 0x40 */
  {NAME: PlayerObject.SNAME.STAND, ID: 0x40, DIM: DIM1, SPRITE: [PlayerObject.SPRITE.F_STAND]},
  {NAME: PlayerObject.SNAME.DOWN, ID: 0x41, DIM: DIM2, SPRITE: [PlayerObject.SPRITE.F_DOWN]},
  {NAME: PlayerObject.SNAME.RUN, ID: 0x42, DIM: DIM1, SPRITE: [PlayerObject.SPRITE.F_RUN2,PlayerObject.SPRITE.F_RUN1,PlayerObject.SPRITE.F_RUN0]},
  {NAME: PlayerObject.SNAME.SLIDE, ID: 0x43, DIM: DIM1, SPRITE: [PlayerObject.SPRITE.F_SLIDE]},
  {NAME: PlayerObject.SNAME.FALL, ID: 0x44, DIM: DIM1, SPRITE: [PlayerObject.SPRITE.F_FALL]},
  {NAME: PlayerObject.SNAME.ATTACK, ID: 0x45, DIM: DIM1, SPRITE: [PlayerObject.SPRITE.F_ATTACK]},
  {NAME: PlayerObject.SNAME.TRANSFORM, ID: 0x46, DIM: DIM0, SPRITE: [PlayerObject.SPRITE.F_TRANSFORM]},
  {NAME: PlayerObject.SNAME.POLE, ID: 0x47, DIM: DIM1, SPRITE: [PlayerObject.SPRITE.F_CLIMB0]},
  {NAME: PlayerObject.SNAME.CLIMB, ID: 0x48, DIM: DIM1, SPRITE: [PlayerObject.SPRITE.F_CLIMB0,PlayerObject.SPRITE.F_CLIMB1]},
  {NAME: PlayerObject.SNAME.TAUNT, ID: 0x49, DIM: DIM1, SPRITE: [PlayerObject.SPRITE.F_TAUNT]},
  {NAME: PlayerObject.SNAME.SWIM, ID: 0x50, DIM: DIM1, SPRITE: [PlayerObject.SPRITE.F_SWIM0, PlayerObject.SPRITE.F_SWIM1, PlayerObject.SPRITE.F_SWIM2]},
  /* Leaf Mario -> 0x60 */
  {NAME: PlayerObject.SNAME.STAND, ID: 0x60, DIM: DIM1, SPRITE: [PlayerObject.SPRITE.L_STAND]},
  {NAME: PlayerObject.SNAME.DOWN, ID: 0x61, DIM: DIM2, SPRITE: [PlayerObject.SPRITE.L_DOWN]},
  {NAME: PlayerObject.SNAME.RUN, ID: 0x62, DIM: DIM1, SPRITE: [PlayerObject.SPRITE.L_RUN2,PlayerObject.SPRITE.L_RUN1,PlayerObject.SPRITE.L_RUN0]},
  {NAME: PlayerObject.SNAME.SLIDE, ID: 0x63, DIM: DIM1, SPRITE: [PlayerObject.SPRITE.L_SLIDE]},
  {NAME: PlayerObject.SNAME.FALL, ID: 0x64, DIM: DIM1, SPRITE: [PlayerObject.SPRITE.L_FALL]},
  {NAME: PlayerObject.SNAME.ATTACK, ID: 0x65, DIM: DIM1, SPRITE: [PlayerObject.SPRITE.L_ATTACK0,PlayerObject.SPRITE.L_ATTACK1,PlayerObject.SPRITE.L_ATTACK2,PlayerObject.SPRITE.L_ATTACK3]},
  {NAME: PlayerObject.SNAME.TRANSFORM, ID: 0x66, DIM: DIM0, SPRITE: [PlayerObject.SPRITE.L_TRANSFORM]},
  {NAME: PlayerObject.SNAME.POLE, ID: 0x67, DIM: DIM1, SPRITE: [PlayerObject.SPRITE.L_CLIMB0]},
  {NAME: PlayerObject.SNAME.CLIMB, ID: 0x68, DIM: DIM1, SPRITE: [PlayerObject.SPRITE.L_CLIMB0,PlayerObject.SPRITE.L_CLIMB1]},
  {NAME: PlayerObject.SNAME.TAUNT, ID: 0x69, DIM: DIM1, SPRITE: [PlayerObject.SPRITE.L_TAUNT]},
  {NAME: PlayerObject.SNAME.SWIM, ID: 0x70, DIM: DIM1, SPRITE: [PlayerObject.SPRITE.L_SWIM0, PlayerObject.SPRITE.L_SWIM1, PlayerObject.SPRITE.L_SWIM2]},
  {NAME: PlayerObject.SNAME.GLIDE, ID: 0x71, DIM: DIM1, SPRITE: [PlayerObject.SPRITE.L_GLIDE0, PlayerObject.SPRITE.L_GLIDE1, PlayerObject.SPRITE.L_GLIDE2]},
  /* Generic -> 0x90 */
  {NAME: PlayerObject.SNAME.DEAD, DIM: DIM0, ID: 0x90, SPRITE: [PlayerObject.SPRITE.G_DEAD]},
  {NAME: PlayerObject.SNAME.HIDE, DIM: DIM0, ID: 0x9A, SPRITE: [PlayerObject.SPRITE.G_HIDE]},
  {NAME: PlayerObject.SNAME.GHOST, DIM: DIM0, ID: 0xFFF, SPRITE: []},
  {NAME: PlayerObject.SNAME.DEADGHOST, DIM: DIM0, ID: 0xFFE, SPRITE: [PlayerObject.SPRITE.G_DEAD]}
];

/* === INSTANCE ============================================================= */

PlayerObject.prototype.update = function(data) {
  if(this.dead || this.garbage) { return; } // Don't do ghost playback if character is dead
  
  /* Ghost playback update */
  this.setState(PlayerObject.SNAME.GHOST);
  this.level = data.level;
  this.zone = data.zone;
  this.pos = data.pos;
  this.sprite = PlayerObject.SPRITE[data.sprite];
  this.reverse = data.reverse;
  this.character = data.character;
  if (this.damageTimer) this.damageTimer--;
  if (this.spinTimer) this.spinTimer--;
};

PlayerObject.prototype.trigger = function(type) {
  switch(type) {
    case 0x01 : { this.attack(); break; }
    case 0x02 : { this.star(); break; }
    case 0x03 : { this.invuln(); break; }
    case 0x04 : { this.spin(); break; }
  }
};

PlayerObject.prototype.step = function() {
  if(this.starTimer > 0) { this.starTimer--; }
  else if(this.starMusic) { this.starMusic.stop(); this.starMusic = undefined; }
  
  /* Ghost playback */
  if(this.isState(PlayerObject.SNAME.GHOST)) { this.sound(); return; }
  
  /* Player Hidden */
  if(this.isState(PlayerObject.SNAME.HIDE)) { return; }
    
  /* Flagpole Slide */
  if(this.isState(PlayerObject.SNAME.POLE)) {
    if(this.poleTimer > 0 && !this.poleWait) { this.poleTimer--; return; }
    else if(!this.poleSound) { this.poleSound = true; this.play("flagpole.mp3", 1., 0.); }
        
    if(this.poleWait) { }
    else if(this.poleTimer <= 0 && this.autoTarget) { this.setState(PlayerObject.SNAME.STAND); }
    else {
      var mov = vec2.add(this.pos, vec2.make(0., -PlayerObject.POLE_SLIDE_SPEED));
      var ext1 = vec2.make(this.pos.x, this.pos.y-PlayerObject.POLE_SLIDE_SPEED);
      var ext2 = vec2.make(this.dim.x, this.dim.y+PlayerObject.POLE_SLIDE_SPEED);

      var tiles = this.game.world.getZone(this.level, this.zone).getTiles(ext1, ext2);
      var tdim = vec2.make(1., 1.);

      var hit = false;
      for(var i=0;i<tiles.length;i++) {
        var tile = tiles[i];
        if(squar.intersection(tile.pos, tdim, mov, this.dim) && tile.definition.COLLIDE) { hit = true; break; }
      }
      
      if(hit) {
        this.poleTimer = PlayerObject.POLE_DELAY;
        this.autoTarget = vec2.add(mov, PlayerObject.LEVEL_END_MOVE_OFF);
        this.poleWait = true;
      }
      else { this.pos = mov; }
    }
    
    var flag = this.game.getFlag(this.level, this.zone);
    if(flag.pos.y - PlayerObject.POLE_SLIDE_SPEED >= this.pos.y) { flag.pos.y -= PlayerObject.POLE_SLIDE_SPEED; }
    else { flag.pos.y = this.pos.y; this.poleWait = false; }
    
    return;
  }
  
  /* Anim */
  if(this.isState(PlayerObject.SNAME.RUN)) { this.anim += Math.max(.5, Math.abs(this.moveSpeed*5)); }
  else { this.anim++; }
  this.sprite = this.state.SPRITE[parseInt(parseInt(this.anim)/PlayerObject.ANIMATION_RATE) % this.state.SPRITE.length];
  
  /* Climb a vine */
  if(this.isState(PlayerObject.SNAME.CLIMB)) {
    this.pos.y += PlayerObject.CLIMB_SPEED;
    if(this.pos.y >= this.game.world.getZone(this.level, this.zone).dimensions().y) {
      this.warp(this.vineWarp);
      this.setState(PlayerObject.SNAME.FALL);
    }
    return;
  }
  
  /* Dead */
  if(this.isState(PlayerObject.SNAME.DEAD) || this.isState(PlayerObject.SNAME.DEADGHOST)) {
    if(this.deadFreezeTimer > 0) { this.deadFreezeTimer--; }
    else if(this.deadTimer > 0) {
      this.deadTimer--;
      this.pos.y += this.fallSpeed / 3;
      this.fallSpeed = Math.max(this.fallSpeed - PlayerObject.FALL_SPEED_ACCEL, -0.8);
    }
    else { this.destroy(); }
    return;
  }
  
  /* Transform */
  if(this.isState(PlayerObject.SNAME.TRANSFORM)) {
    if(--this.transformTimer > 0) {
      var target = this.transformTarget;
      if (this.transformTimer === 14 && (target === 3 || this.power === 3)) { this.game.world.getZone(this.level, this.zone).effects.push(new TransformEffect(vec2.make(this.pos.x, this.pos.y+.5))); }
      var ind = parseInt(this.anim/PlayerObject.TRANSFORM_ANIMATION_RATE) % 3;
      var high = this.power>this.transformTarget?this.power:this.transformTarget;
      switch(ind) {
        case 0 : { this.sprite = this.getStateByPowerIndex(PlayerObject.SNAME.STAND, this.power).SPRITE[0]; break; }
        case 1 : { this.sprite = this.getStateByPowerIndex(PlayerObject.SNAME.TRANSFORM, high).SPRITE[0]; break; }
        case 2 : { this.sprite = this.getStateByPowerIndex(PlayerObject.SNAME.STAND, this.transformTarget).SPRITE[0]; break; }
      }
    }
    else {
      this.power = this.transformTarget;
      this.transformTarget = -1;
      this.setState(PlayerObject.SNAME.STAND);
      if(this.collisionTest(this.pos, this.dim)) { this.setState(PlayerObject.SNAME.DOWN); }
      this.damageTimer = PlayerObject.DAMAGE_TIME;
      this.game.out.push(NET013.encode(0x03));
    }
    return;
  }
  
  /* Warp Pipe */
  if(this.pipeDelay > 0) { this.pipeDelay--; return; }
  if(this.pipeTimer > 0 && this.pipeDelay <= 0) {
    if(this.pipeTimer >= PlayerObject.PIPE_TIME) { this.play("pipe.mp3", 1., .04); }
    switch(this.pipeDir) {
      case 1 : { this.pos.y += PlayerObject.PIPE_SPEED; break; }
      case 2 : { this.pos.y -= PlayerObject.PIPE_SPEED; break; }
      case 3 : { this.pos.x -= PlayerObject.PIPE_SPEED; break; }
      case 4 : { this.pos.x += PlayerObject.PIPE_SPEED; break; }
    }
    if(--this.pipeTimer === 1 && this.pipeWarp) { this.pipeDelay = this.pipeDelayLength; }
    if(this.pipeTimer <= 0 && this.pipeWarp) {
      this.warp(this.pipeWarp);
      this.weedeat();
      this.pipeWarp = undefined;
      switch(this.pipeExt) {
        case 1 : { this.pos.y -= ((PlayerObject.PIPE_TIME-1)*PlayerObject.PIPE_SPEED); this.setState(PlayerObject.SNAME.STAND); this.pos = vec2.add(this.pos, PlayerObject.PIPE_EXT_OFFSET); break; }
        case 2 : { this.pos.y += ((PlayerObject.PIPE_TIME-1)*PlayerObject.PIPE_SPEED); this.setState(PlayerObject.SNAME.STAND); this.pos = vec2.add(this.pos, PlayerObject.PIPE_EXT_OFFSET); break; }
        case 3 : { this.pos.x -= ((PlayerObject.PIPE_TIME-1)*PlayerObject.PIPE_SPEED); this.setState(PlayerObject.SNAME.RUN); this.reverse = false; break; }
        case 4 : { this.pos.x += ((PlayerObject.PIPE_TIME-1)*PlayerObject.PIPE_SPEED); this.setState(PlayerObject.SNAME.RUN); this.reverse = true; break; }
        default : { return; }
      };
      this.game.cameraLockedX = false;
      this.game.cameraLockedY = false;
      this.pipeTimer = PlayerObject.PIPE_TIME;
      this.pipeDir = this.pipeExt;
      this.pipeDelay = this.pipeDelayLength;
    }
    return;
  }
  this.pipeExt = -1;
  
  /* Normal Gameplay */
  this.lastPos = this.pos;
  
  if(this.damageTimer > 0) { this.damageTimer--; }
  if(this.attackCharge < PlayerObject.MAX_CHARGE) { this.attackCharge++; }
  if(this.attackTimer > 0) { this.attackTimer--; }
  if(this.spinCharge < PlayerObject.MAX_CHARGE) { this.spinCharge++; }
  if(this.spinTimer > 0) { this.spinTimer--; }
  if(this.glideTimer > 0) { this.glideTimer--; }
  
  if(this.autoTarget) { this.autoMove(); }  
  this.control();
  this.physics();
  this.interaction();
  this.arrow();
  this.sound();
  
  if(this.pos.y < 0.) { this.kill(); }
};

/* Handles player input */
PlayerObject.prototype.input = function(dir, a, b, u) {
  this.btnD = dir;
  this.btnA = a;
  this.btnB = b;
  this.btnU = u;
};

/* Handles auto input */
PlayerObject.prototype.autoMove = function() {
  this.btnD = [0,0];
  this.btnA = false; this.btnB = false;
  
  if(Math.abs(this.pos.x-this.autoTarget.x) >= 0.1) {
    this.btnD = [this.pos.x-this.autoTarget.x<=0?1:-1,0];
  }
  else if(Math.abs(this.moveSpeed) < 0.01){
    this.btnA = this.pos.y-this.autoTarget.y<-.5;
  }
};

PlayerObject.prototype.control = function() {
  if(this.grounded) { this.btnBg = this.btnB; this.glideTimer = 0; }
  
  if(this.isState(PlayerObject.SNAME.DOWN) && !this.crouchJump && this.grounded && this.collisionTest(this.pos, this.getStateByPowerIndex(PlayerObject.SNAME.STAND, this.power).DIM)) {
    if (this.btnA) {
      if ((this.grounded || this.underWater) && !this.btnAHot) {
          this.jumping = 0x0;
          this.play(this.underWater ? "swim.mp3" : 0x0 < this.power ? "jump1.mp3" : "jump0.mp3", 0.7, 0.04);
          this.btnAHot = true;
          this.crouchJump = true;
      }
    } else { this.btnAHot = false; }

    if(!this.grounded) {
      this.moveSpeed = PlayerObject.STUCK_SLIDE_SPEED * this.btnD[0];
    }
    this.moveSpeed = Math.sign(this.moveSpeed) * Math.max(Math.abs(this.moveSpeed)-(this.icePhysics ? PlayerObject.MOVE_ICE_DECEL : PlayerObject.MOVE_SPEED_DECEL), 0);
    return;
  }
  
  if(this.btnD[0] !== 0) {
    if(Math.abs(this.moveSpeed) > 0.01 && !(this.btnD[0] >= 0 ^ this.moveSpeed < 0)) {
      this.moveSpeed += (this.icePhysics ? PlayerObject.MOVE_ICE_DECEL : PlayerObject.MOVE_SPEED_DECEL) * this.btnD[0];
      this.spinTimer > 0 && this.power === 3 ? this.setState(PlayerObject.SNAME.ATTACK) : this.setState(PlayerObject.SNAME.SLIDE);

      if (!this.skidEffect && this.grounded) { this.game.world.getZone(this.level, this.zone).effects.push(new DustEffect(this.pos)); this.skidEffect = true; }
    }
    else {
      this.moveSpeed = this.btnD[0] * Math.min(Math.abs(this.moveSpeed) + (this.icePhysics ? PlayerObject.MOVE_ICE_ACCEL : PlayerObject.MOVE_SPEED_ACCEL), this.underWater ? PlayerObject.WATER_SPEED_MAX : this.btnBg?(this.starTimer > 0 ? PlayerObject.STAR_SPEED_MAX : PlayerObject.RUN_SPEED_MAX):this.autoTarget?PlayerObject.AUTO_SPEED_MAX:PlayerObject.MOVE_SPEED_MAX);
      if (this.grounded /* We need to check for this. Otherwise the water animation is bugged for some reason. */) {
        this.spinTimer > 0 && this.power === 3 ? this.setState(PlayerObject.SNAME.ATTACK) : this.setState(PlayerObject.SNAME.RUN);
      }
      this.skidEffect = false;
    }
    if(this.grounded || this.underWater) { this.reverse = this.btnD[0] >= 0; }
  }
  else {
    if (!this.underWater || this.grounded) {
        if(Math.abs(this.moveSpeed) > 0.01) {
          this.moveSpeed = Math.sign(this.moveSpeed) * Math.max(Math.abs(this.moveSpeed) - (this.icePhysics ? PlayerObject.MOVE_ICE_DECEL : PlayerObject.MOVE_SPEED_DECEL), 0);
          this.spinTimer > 0 && this.power === 3 ? this.setState(PlayerObject.SNAME.ATTACK) : this.setState(PlayerObject.SNAME.RUN);
        }
        else {
          this.moveSpeed = 0;
          this.spinTimer > 0 && this.power === 3 ? this.setState(PlayerObject.SNAME.ATTACK) : this.setState(PlayerObject.SNAME.STAND);
        }
        if(this.btnD[1] === -1) {
          this.spinTimer > 0 && this.power === 3 ? this.setState(PlayerObject.SNAME.ATTACK) : this.setState(PlayerObject.SNAME.DOWN);
        }
    }
  }
  
  var jumpMax = this.isSpring?PlayerObject.SPRING_LENGTH_MAX:this.underWater?0.1:PlayerObject.JUMP_LENGTH_MAX;
  var jumpMin = this.isSpring?PlayerObject.SPRING_LENGTH_MIN:(this.isBounce?PlayerObject.BOUNCE_LENGTH_MIN:PlayerObject.JUMP_LENGTH_MIN);
  
  for(var i=0;i<PlayerObject.JUMP_SPEED_INC_THRESHOLD.length&&Math.abs(this.moveSpeed)>=PlayerObject.JUMP_SPEED_INC_THRESHOLD[i];i++) { jumpMax++; }
  
  if(this.btnA) {
    if((this.grounded || this.underWater) && !this.btnAHot) {
      this.jumping = 0;
      this.play(this.underWater ? "swim.mp3" : this.power>0?"jump1.mp3":"jump0.mp3", .7, .04);
      this.btnAHot = true;
      this.crouchJump = (this.power > 0 && this.btnD[1] === -1) ? true : false;
    } else {
      if (this.glideTimer === 0 && !this.btnAHot && !this.spring && !this.isSpring && !this.isBounce && this.power === 3 && !this.crouchJump) {
        this.glideTimer = 20;
        this.play("spin.mp3", .7, .04);
        this.btnAHot = true;
      }
    }
    if(this.jumping > jumpMax) {
      this.jumping = -1;
    }
    if(this.glideTimer < 0) {
      this.glideTimer = 0;
    }
  }
  else {
    this.btnAHot = false;
    if(this.jumping > jumpMin) {
      this.jumping = -1;
    }
  }

  if (this.btnU && this.grounded && !this.moveSpeed && !this.isState(PlayerObject.SNAME.DOWN)) { this.setState(PlayerObject.SNAME.TAUNT); }
  
  /* Run across 1-block gaps */
  if (this.moveSpeed > 0.400 || this.moveSpeed < -0.400) {
    if (DIM0.x || DIM1.x == 1)  {
      DIM0.x = 1; // increase small hitbox
      DIM1.x = 1; // increase big hitbox
    }
  } else {
    if (DIM0.x || DIM1.x !== 1) {
      DIM0.x = 0.9; // reset small hitbox
      DIM1.x = 0.9; // reset big hitbox
    }
  }
  
  if(this.underWater && !this.grounded) {
    this.spinTimer > 0 && this.power === 3 ? this.setState(PlayerObject.SNAME.ATTACK) : this.setState(PlayerObject.SNAME.SWIM);
  }

  if(!this.grounded && !this.underWater) {
    this.spinTimer > 0 && this.power === 3 ? this.setState(PlayerObject.SNAME.ATTACK) : this.glideTimer > 0 && this.power === 3 ? this.setState(PlayerObject.SNAME.GLIDE) : this.crouchJump === true ? this.setState(PlayerObject.SNAME.DOWN) : this.setState(PlayerObject.SNAME.FALL);
  }
  
  if(this.btnB && !this.btnBde && this.power === 2 && !this.isState(PlayerObject.SNAME.DOWN) && !this.isState(PlayerObject.SNAME.SLIDE) && !this.isState(PlayerObject.SNAME.TAUNT) && this.attackTimer < 1 && this.attackCharge >= PlayerObject.ATTACK_CHARGE) {
    this.attack();
    this.game.out.push(NET013.encode(0x01));
  }
  if(this.btnB && !this.btnBde && this.power === 3 && !this.isState(PlayerObject.SNAME.DOWN) && !this.isState(PlayerObject.SNAME.SLIDE) && !this.isState(PlayerObject.SNAME.TAUNT) && this.spinTimer < 1 && this.spinCharge >= PlayerObject.ATTACK_CHARGE) {
    this.spin();
    this.game.out.push(NET013.encode(0x04));
  }
  this.btnBde = this.btnB;
  
  if((this.attackTimer > 0 || this.spinTimer > 0) && (this.power === 2 || this.power === 3) && (this.isState(PlayerObject.SNAME.STAND) || this.isState(PlayerObject.SNAME.RUN)) && !this.isState(PlayerObject.SNAME.TAUNT)) {
    this.setState(PlayerObject.SNAME.ATTACK);
  }
};

PlayerObject.prototype.physics = function() {
  if(this.jumping !== -1) {
    this.fallSpeed = this.underWater ? PlayerObject.WATER_FALL_SPEED : PlayerObject.FALL_SPEED_MAX - (this.jumping*(this.isSpring?PlayerObject.SPRING_DECEL:PlayerObject.JUMP_DECEL));
    this.jumping++;
    this.grounded = false;
  }
  else {
    this.isBounce = false;
    this.isSpring = false;
    if(this.grounded) {
      this.crouchJump = false;
      if(this.conveyor !== -1) {
        this.pos.x += (this.conveyor === 0 ? -0.05 : 0.05);
      }
      this.fallSpeed = 0;
    }
    this.fallSpeed = Math.max(this.fallSpeed + (this.underWater?-PlayerObject.WATER_FALL_ACCEL:-PlayerObject.FALL_SPEED_ACCEL), this.glideTimer ? -0.2 : -PlayerObject.FALL_SPEED_MAX);
  }
  
  var mov = vec2.add(this.pos, vec2.make(this.moveSpeed / 3, this.fallSpeed / 3));
  
  var ext1 = vec2.make(this.pos.x+Math.min(0, this.moveSpeed), this.pos.y+Math.min(0, this.fallSpeed));
  var ext2 = vec2.make(this.dim.x+Math.max(0, this.moveSpeed), this.dim.y+Math.max(0, this.fallSpeed));
  
  var tiles = this.game.world.getZone(this.level, this.zone).getTiles(ext1, ext2);
  var plats = this.game.getPlatforms();
  var tdim = vec2.make(1., 1.);
  
  var grounded = false;
  var underwater = false;
  var ice = false;
  var conveyor = -1; // -1: none, 0: left, 1: right // Needs to be a variable otherwise speed fluctuates

  var hit = [];
  var on = [];              // Tiles we are directly standing on
  var psh = [];             // Tiles we are directly pushing against
  var bmp = [];             // Tiles we bumped from below when jumping
  var smsh = [];            // Tiles we.. smashed... by spinning  into them with the raccoon powerup
  var slopes = [];          // Tiles which are slopes
  var slopecollide = [];    // Slopes we collided with
  var semisolids = [];      // Tiles which are semisolids
  var semicollide = [];     // Semisolids that we collided with
  var platforms = [];       // All platforms we collided with
  var platform;             // The platform we are actually riding, if applicable.
  
  /* Collect likely hits & handle push */
  for(var i=0;i<tiles.length;i++) {
    var tile = tiles[i];
    
    if(tile.definition.SEMISOLID) {
      semisolids.push(tile);
    }
    else if(tile.definition.SLOPE) {
      slopes.push(tile);
    }
    else if(tile.definition.COLLIDE) {
      if(tile.definition.HIDDEN) { hit.push(tile); continue; }

      var dim = vec2.make(1., 1.85);
      var dimPos = this.reverse ? vec2.make(mov.x + 0.80, mov.y) : vec2.make(mov.x - 0.95, mov.y);
      if(squar.intersection(tile.pos, tdim, dimPos, dim)) {
        if(this.spinTimer === PlayerObject.ATTACK_DELAY-1 && this.pos.y <= tile.pos.y) { smsh.push(tile); }
      }
      
      if(squar.intersection(tile.pos, tdim, mov, this.dim) || squar.intersection(tile.pos, tdim, this.pos, this.dim)) {
        if(Math.abs(this.moveSpeed) > 0.01  && this.grounded && this.pos.y <= tile.pos.y) { psh.push(tile); }
        hit.push(tile);
      }
    }

    if (tile.definition.WATER && squar.intersection(tile.pos, tdim, this.pos, this.dim)) {
      underwater = true;
    }
  }

  this.underWater = underwater;
  
  /* Platforms */
  for(var i=0;i<plats.length;i++) {
    var plat = plats[i];
    if(squar.intersection(plat.pos, plat.dim, mov, this.dim)) { platforms.push(plat); }
  }

  /* Semisolids */
  for(var i=0;i<semisolids.length;i++) {
    var semisolid = semisolids[i];
    if(squar.intersection(semisolid.pos, tdim, mov, this.dim)) { semicollide.push(semisolid); }
  }

  /* Slopes */
  for(var i=0;i<slopes.length;i++) {
    var slope = slopes[i];
    if(squar.intersection(slope.pos, tdim, mov, this.dim)) { slopecollide.push(slope); }
  }
  
  /* Correct X collision */
  var mvx = vec2.make(mov.x, this.pos.y);
  for(var i=0;i<hit.length;i++) {
    var tile = hit[i];
    if(tile.definition.HIDDEN) { continue; }
    if(!squar.intersection(tile.pos, tdim, mvx, this.dim)) { continue; }
    
    /* +X */
    if(mvx.x + (this.dim.x*.5) < tile.pos.x + (tdim.x*.5)) {
      mvx.x = tile.pos.x - this.dim.x;
      this.moveSpeed *= 0.33;
    }
    /* -X */
    else {
      mvx.x = tile.pos.x + tdim.x;
      this.moveSpeed *= 0.33;
    }
  }
  
  mov.x = mvx.x;
  
  /* Handle bumps && grounding */
  for(var i=0;i<hit.length;i++) {
    var tile = hit[i];
    if(squar.intersection(tile.pos, tdim, mov, this.dim)) {
      if(this.fallSpeed > PlayerObject.BLOCK_BUMP_THRESHOLD) { bmp.push(tile); }
      if(this.fallSpeed < 0 && this.pos.y >= tile.pos.y) {
        if (tile.definition.ICE) { ice = true; }
        if (tile.definition.CONVEYOR !== undefined) { conveyor = tile.definition.CONVEYOR; }
        on.push(tile);
      }
    }
  }
  
  /* Correct Y collision */
  for(var i=0;i<hit.length;i++) {
    var tile = hit[i];
    if(!squar.intersection(tile.pos, tdim, mov, this.dim)) { continue; }
    
    /* -Y */
    if(this.pos.y >= mov.y) {
      if(tile.definition.HIDDEN) { continue; }
      mov.y = tile.pos.y + tdim.y;
      this.fallSpeed = 0;
      grounded = true;
    }
    /* +Y */
    else {
      if (tile.definition.HIDDEN) {
        var cpos = vec2.chop(mov);
        if (cpos.y === tile.pos.y) { continue; }
      }

      mov.y = tile.pos.y - this.dim.y;
      this.fallSpeed = 0;
    }
  }
  
  for(var i=0;i<platforms.length;i++) {
    var plat = platforms[i];
    if(this.pos.y >= mov.y && (plat.pos.y + plat.dim.y) - this.pos.y < PlayerObject.PLATFORM_SNAP_DIST) {
      mov.y = plat.pos.y + plat.dim.y;
      grounded = true;
      platform = plat;
      break;
    }
    else {
      /* Nothing, pass through bottom of platform when going up */
    }
  }

  /* We use DIM0 because otherwise it acts as Semisolid Weak */
  for(var i=0;i<semicollide.length;i++) {
    var semi = semicollide[i];
    if (squar.intersection(semi.pos, tdim, mov, DIM0)) {
      if (this.pos.y - DIM0.y >= semi.pos.y) {
        mov.y = semi.pos.y + tdim.y;
        this.fallSpeed = 0;
        grounded = true;
      }
    }
  }

  /* Handle slope collision. X pos is normal. Y pos = slope y+x decimal points */
  for(var i=0;i<slopecollide.length;i++) {
    var slope = slopecollide[i];
    if (squar.intersection(slope.pos, tdim, mov, DIM0)) {      
      mov.y = parseInt(mov.y) + ((mov.x - parseInt(mov.x)));
      grounded = true;
    }
  }
  
  this.icePhysics = ice;
  this.conveyor = conveyor;
  this.grounded = grounded;
  this.pos = mov;

  if(grounded || this.power === 0) { this.crouchJump = false; }
  
  /* On Platform */
  if(platform) {
    platform.riding(this);
  }

  
  /* Tile Touch events */
  for(var i=0;i<tiles.length;i++) {
    var tile = tiles[i];

    var add = this.reverse? vec2.make(0.01, 0) : vec2.make(-0.01, 0);
    if(squar.intersection(tile.pos, tdim, vec2.add(mov, add), this.dim)) {
      tile.definition.TRIGGER(this.game, this.pid, tile, this.level, this.zone, tile.pos.x, tile.pos.y, td32.TRIGGER.TYPE.TOUCH);
    }
  }
  
  /* On Tile */
  for(var i=0;i<on.length;i++) {
    var tile = on[i];
    tile.definition.TRIGGER(this.game, this.pid, tile, this.level, this.zone, tile.pos.x, tile.pos.y, td32.TRIGGER.TYPE.STAND);
  }

  /* Tile Down events */
  if(this.isState(PlayerObject.SNAME.DOWN) && this.moveSpeed < 0.05) {
    for(var i=0;i<on.length;i++) {
      var tile = on[i];
      tile.definition.TRIGGER(this.game, this.pid, tile, this.level, this.zone, tile.pos.x, tile.pos.y, td32.TRIGGER.TYPE.DOWN);
    }
  }
  
  /* Tile Push events */
  if(this.isState(PlayerObject.SNAME.RUN)) {
    for(var i=0;i<psh.length;i++) {
      var tile = psh[i];
      tile.definition.TRIGGER(this.game, this.pid, tile, this.level, this.zone, tile.pos.x, tile.pos.y, td32.TRIGGER.TYPE.PUSH);
    }
  }

  /* Tile Smash events */
  for(var i=0;i<smsh.length;i++) {
    var tile = smsh[i];
    tile.definition.TRIGGER(this.game, this.pid, tile, this.level, this.zone, tile.pos.x, tile.pos.y, td32.TRIGGER.TYPE.BIG_BUMP);
  }
  
  /* Tile Bump events */
  for(var i=0;i<bmp.length;i++) {
    var tile = bmp[i];
    var cpos = vec2.chop(this.pos); // Our position converted to an integer

    if (tile.definition.HIDDEN && cpos.y === tile.pos.y) { continue; }

    var bty = this.power>0?td32.TRIGGER.TYPE.BIG_BUMP:td32.TRIGGER.TYPE.SMALL_BUMP;
    tile.definition.TRIGGER(this.game, this.pid, tile, this.level, this.zone, tile.pos.x, tile.pos.y, bty);
    this.jumping = -1;
    this.fallSpeed = -PlayerObject.BLOCK_BUMP_THRESHOLD;
  }
};

/* Does a collision test in place, returns true if hits something */
/* Used to check if it's okay to standup as big infringio */
PlayerObject.prototype.collisionTest = function(pos, dim) {
  var tdim = vec2.make(1., 1.);
  var tiles = this.game.world.getZone(this.level, this.zone).getTiles(pos, dim);
  for(var i=0;i<tiles.length;i++) {
    var tile = tiles[i];
    if(!tile.definition.COLLIDE || tile.definition.SEMISOLID) { continue; }
    
    if(squar.intersection(tile.pos, tdim, pos, dim)) { return true; }
  }
  return false;
};

/* Checks if this object has touched or interacted with any other object */
PlayerObject.prototype.interaction = function() {
  for(var i=0;i<this.game.objects.length;i++) {
    var obj = this.game.objects[i];
    if(obj === this || this.dead) { continue; }
    if(obj.level === this.level && obj.zone === this.zone && obj.isTangible()) {
      var hit = squar.intersection(obj.pos, obj.dim, this.pos, this.dim);
      var fdim = vec2.make(2, this.dim.y);
      var fpos = vec2.make(this.pos.x-.5, this.pos.y);
      var fhit = squar.intersection(obj.pos, obj.dim, fpos, fdim);
      if(this.spinTimer) {
        if (fhit && obj.bonk) {
          obj.bonk();
          this.game.out.push(NET020.encode(obj.level, obj.zone, obj.oid, 0x01));
        }
      }
      if(hit) {
        if((this.starTimer > 0 || this.spinTimer > 0) && obj.bonk) {
          /* Touch something with Star */
          obj.bonk();
          this.game.out.push(NET020.encode(obj.level, obj.zone, obj.oid, 0x01));
        }
        if(obj instanceof PlayerObject && (obj.starTimer > 0 || (obj.spinTimer > 0 && this.game.gameMode === 1)) && !this.autoTarget) {
          /* Touch other player who has Star */
          this.damage(obj);
          if(this.dead) { this.game.out.push(NET017.encode(obj.pid)); }
        }
        if(this.lastPos.y > obj.pos.y + (obj.dim.y*.66) - Math.max(0., obj.fallSpeed)) {
          /* Stomped */
          if(obj.playerStomp) { obj.playerStomp(this); }
        }
        else if(this.lastPos.y < obj.pos.y) {
          /* Bumped */
          if(obj.playerBump) { obj.playerBump(this); }
        }
        else {
          /* Touched */
          if(obj.playerCollide) { obj.playerCollide(this); }
        }
      }
    }
  }
};

/* Shows or hides the YOU arrow over the player based on crowdedness */
PlayerObject.prototype.arrow = function() {
  var pts = 0;
  for(var i=0;i<this.game.objects.length;i++) {
    var obj = this.game.objects[i];
    if(obj !== this && obj instanceof PlayerObject && obj.level === this.level && obj.zone === this.zone) {
      pts += 1.-(Math.min(PlayerObject.ARROW_RAD_OUT, Math.max(0., vec2.distance(this.pos, obj.pos)-PlayerObject.ARROW_RAD_IN))/PlayerObject.ARROW_RAD_OUT);
    } 
  }
  this.arrowFade = Math.min(PlayerObject.ARROW_THRESHOLD_MAX, Math.max(0., pts-PlayerObject.ARROW_THRESHOLD_MIN))/PlayerObject.ARROW_THRESHOLD_MAX;
};

PlayerObject.prototype.sound = GameObject.prototype.sound;

PlayerObject.prototype.spin = function() {
  this.spinTimer = PlayerObject.ATTACK_DELAY;
  this.spinCharge -= PlayerObject.ATTACK_CHARGE;
  this.play("spin.mp3", 1., .04);
};

PlayerObject.prototype.attack = function() {
  this.attackTimer = PlayerObject.ATTACK_DELAY;
  this.attackCharge -= PlayerObject.ATTACK_CHARGE;
  var p = this.reverse?vec2.add(this.pos, PlayerObject.PROJ_OFFSET):vec2.add(vec2.add(this.pos, vec2.make(0.5, 0.)), vec2.multiply(PlayerObject.PROJ_OFFSET, vec2.make(-1., 1.)));
  this.game.createObject(FireballProj.ID, this.level, this.zone, p, [this.reverse, this.pid]);
  this.play("fireball.mp3", 1., .04);
};

PlayerObject.prototype.bounce = function() {
  this.glideTimer = 0;
  this.jumping = 0;
  this.isBounce = true;
};

PlayerObject.prototype.damage = function(obj) {
  if(
    this.damageTimer > 0 || this.starTimer > 0 ||
    this.isState(PlayerObject.SNAME.TRANSFORM) ||
    this.isState(PlayerObject.SNAME.CLIMB) ||
    this.isState(PlayerObject.SNAME.POLE) ||
    this.pipeWarp || this.pipeTimer > 0 || this.pipeDelay > 0 ||
    this.game.getDebug("god") || this.autoTarget
  ) { return; }
  if(this.power > 0) { this.transform(this.game.gameMode === 1 ? 0 : (this.power > 1 ? 1 : 0)); this.damageTimer = PlayerObject.DAMAGE_TIME; this.game.out.push(NET013.encode(0x03)); }
  else { this.kill(); }
};

/* Temp invuln. Called when player loads into a level to prevent instant spawn kill */
PlayerObject.prototype.invuln = function() {
  this.damageTimer = PlayerObject.DAMAGE_TIME;
};

PlayerObject.prototype.powerup = function(obj) {
  if(obj instanceof MushroomObject && this.power < 1) { this.transform(1); this.rate = 0x73; return; } /* this.rate is a disguised anti cheat value */
  if(obj instanceof FlowerObject && this.power <= 3 && !(this.power === 2)) { this.transform(2); this.rate = 0x71; return; }
  if(obj instanceof LeafObject && this.power <= 3 && (this.power !== 3)) { this.transform(3); this.rate = 0x72; return; }
  if(obj instanceof StarObject) { this.star(); this.game.out.push(NET013.encode(0x02)); this.rate = 0x43; return; }
  if(obj instanceof LifeObject) { this.game.lifeage(); return; }
  if(obj instanceof CoinObject) { this.game.coinage(); return; }
  if(obj instanceof AxeObject) { this.game.out.push(NET018.encode()); this.game.stopGameTimer(); return; }  // Asks server what result to get from picking up the axe and 'winning'
  if(obj instanceof PoisonObject) { this.damage(obj); return; }
};

/* This essentially is the win state. */
/* Result is the numerical place we came in. 1 being the best (first place) */
PlayerObject.prototype.axe = function(result) {
  var txt = this.game.getText(this.level, this.zone, result.toString());
  if(!txt) { txt = this.game.getText(this.level, this.zone, "too bad"); }
  
  if(txt) { this.autoTarget = vec2.add(txt.pos, vec2.make(0., -1.6)); }
};

PlayerObject.prototype.star = function() {
  if(this.starMusic) { this.starMusic.stop(); this.starMusic = undefined; }
  this.starTimer = PlayerObject.STAR_LENGTH;
  this.starMusic = this.play("star.mp3", 1., .04);
  if(this.starMusic) { this.starMusic.loop(true); }
};

PlayerObject.prototype.transform = function(to) {
  if (!this.isState(PlayerObject.STATE.TRANSFORM)) {
    if(this.power<=to) { this.play(to === 3 ? "leaf.mp3" : "powerup.mp3", 1., .04); }
    else { this.play(this.power === 3 ? "leaf.mp3" : "powerdown.mp3", 1., .04); }
  }
  
  if (to !== this.power) {
    this.spinTimer = 0;
  }

  this.transformTarget = to;
  this.transformTimer = (to === 3 || this.power === 3) ? PlayerObject.LEAF_TRANSFORM_TIME : PlayerObject.TRANSFORM_TIME;
  this.setState(PlayerObject.SNAME.TRANSFORM);
};

PlayerObject.prototype.warp = function(wid) {
  var wrp = this.game.world.getLevel(this.level).getWarp(wid);
  if(!wrp) { return; } /* Error */

  if(this.zone !== wrp.zone) {
    /* Unlock camera when warping zones */
    this.game.cameraLockedX = false;
    this.game.cameraLockedY = false;
  }
    
  this.level = wrp.level;
  this.zone = wrp.zone;
  this.pos = wrp.pos;

  /* Horizontal directions direct you 3 tiles away from the warp. This is a shotty fix. */
  switch(this.pipeExt) {
    case 3 : {
      this.pos.x += 2.50;
      break;
    }

    case 4 : {
      this.pos.x -= 2.50;
      break;
    }
  }

  /* Fix for getting stuck in pipes and then being able to clip out of bounds */
  if (this.power > 0 && this.pipeExt === 2) {
    this.pos.y -= 1;
  }
  
  this.autoTarget = undefined;
  this.grounded = false;
};

/* ent/ext = null, up, down, left, right [0,1,2,3,4] */
PlayerObject.prototype.pipe = function(ent, wid, delay) {
  if(ent === 1 || ent === 2) { this.setState(PlayerObject.SNAME.STAND); }
  var wrp = this.game.world.getLevel(this.level).getWarp(wid);
  this.pipeWarp = wid;
  this.pipeTimer = PlayerObject.PIPE_TIME;
  this.pipeDir = ent;
  this.pipeExt = wrp.data;
  this.pipeDelayLength = delay;
};

/* Kills any plants that would be in the pipe we are coming out of */
PlayerObject.prototype.weedeat = function() {
  for(var i=0;i<this.game.objects.length;i++) {
    var obj = this.game.objects[i];
    if(obj instanceof PlantObject && !obj.dead) {
      if(vec2.distance(this.pos, obj.pos) < PlayerObject.WEED_EAT_RADIUS) {
        obj.destroy();
      }
    }
  }
};

PlayerObject.prototype.pole = function(p) {
  if(this.autoTarget) { return; }
  this.starMusic && (this.starMusic.stop(), this.starMusic = undefined, this.starTimer = 0x0);
  this.setState(PlayerObject.SNAME.POLE);
  this.moveSpeed = 0;
  this.fallSpeed = 0;
  this.pos.x = p.x;
  this.poleTimer = PlayerObject.POLE_DELAY;
  this.poleSound = false;
};

PlayerObject.prototype.vine = function(p, wid) {
  this.setState(PlayerObject.SNAME.CLIMB);
  this.moveSpeed = 0;
  this.fallSpeed = 0;
  this.pos.x = p.x;
  this.vineWarp = wid;
};

/* Make the player invisible, intangible, and frozen until show() is called. */
PlayerObject.prototype.hide = function() {
  this.setState(PlayerObject.SNAME.HIDE);
};

PlayerObject.prototype.show = function() {
  this.setState(PlayerObject.SNAME.STAND);
};

PlayerObject.prototype.kill = function() {
  if(this.starMusic) { this.starMusic.stop(); this.starMusic = undefined; this.starTimer = 0; }
  if(this.isState(PlayerObject.SNAME.GHOST)) { this.setState(PlayerObject.SNAME.DEADGHOST); }
  else { this.setState(PlayerObject.SNAME.DEAD); }
  
  this.dead = true;
  this.deadTimer = PlayerObject.DEAD_TIME;
  this.deadFreezeTimer = PlayerObject.DEAD_FREEZE_TIME;
  this.fallSpeed = PlayerObject.DEAD_UP_FORCE;
  
  if(this.game.getPlayer() === this) { this.game.out.push(NET011.encode()); }
};

PlayerObject.prototype.destroy = function() {
  if(this.starMusic) { this.starMusic.stop(); this.starMusic = undefined; this.starTimer = 0; }
  GameObject.prototype.destroy.call(this);
};
PlayerObject.prototype.isTangible = function() {
  return GameObject.prototype.isTangible.call(this) && !this.isState(PlayerObject.SNAME.HIDE) && this.pipeDelay <= 0;
};

PlayerObject.prototype.setState = function(SNAME, KEEPANIM) {
  var STATE = this.getStateByPowerIndex(SNAME, this.power);
  if(STATE === this.state) { return; }
  this.state = STATE;
  if(SNAME === PlayerObject.SNAME.POLE) {
    if(STATE.SPRITE.length > 0) { this.sprite = STATE.SPRITE[0]; } // Ghost state special case
  } else if(this.power !== 3) {
    if(STATE.SPRITE.length > 0) { this.sprite = STATE.SPRITE[0]; } // Ghost state special case
  }
  this.dim = STATE.DIM;
};

/* Lmoa */
PlayerObject.prototype.getStateByPowerIndex = function(SNAME, pind) {
  for(var i=0;i<PlayerObject.STATE.length;i++) {
    var ste = PlayerObject.STATE[i];
    if(ste.NAME !== SNAME) { continue; }
    if(ste.ID >= PlayerObject.GENERIC_INDEX) { return ste; }
    if(ste.ID >= PlayerObject.POWER_INDEX_SIZE*pind && ste.ID < PlayerObject.POWER_INDEX_SIZE*(pind+1)) { return ste; }
  }
};

PlayerObject.prototype.isState = function(SNAME) {
  return SNAME === this.state.NAME;
};

PlayerObject.prototype.draw = function(sprites) {
  if(this.isState(PlayerObject.SNAME.HIDE) || this.pipeDelay > 0 || (this.transformTimer > 0 && (this.transformTarget === 3 || this.power === 3))) { return; } // Don't render when hidden, transforming into a tanooki or when in a pipe
  if(this.damageTimer > 0 && this.damageTimer % 3 > 1) { return; } // Post damage timer blinking
    
  var mod; // Special draw mode
  if(this.starTimer > 0) { mod = 0x02; }
  else if(this.isState(PlayerObject.SNAME.GHOST) || this.isState(PlayerObject.SNAME.DEADGHOST)) { mod = 0x01; }
  else { mod = 0x00; }

  if(this.sprite.INDEX instanceof Array) {
    var s = this.sprite.INDEX;
    for(var i=0;i<s.length;i++) {
      for(var j=0;j<s[i].length;j++) {
        if(this.sprite.INDEX[0].length > 1) {
          if(mod === 0x02) { sprites.push({pos: vec2.add(vec2.add(this.pos, vec2.add(this.reverse ? PlayerObject.OFFSET_32X_RIGHT : PlayerObject.OFFSET_32X_LEFT, PlayerObject.DIM_OFFSET)), vec2.make(this.reverse?j:-j,i)), reverse: this.reverse, index: s[i][j], mode: 0x00, player: true, character: this.character}); }
          sprites.push({pos: vec2.add(vec2.add(this.pos, vec2.add(this.reverse ? PlayerObject.OFFSET_32X_RIGHT : PlayerObject.OFFSET_32X_LEFT, PlayerObject.DIM_OFFSET)), vec2.make(this.reverse?j:-j,i)), reverse: this.reverse, index: s[i][j], mode: mod, player: true, character: this.character}); 
         } else {
          if(mod === 0x02) { sprites.push({pos: vec2.add(vec2.add(this.pos, PlayerObject.DIM_OFFSET), vec2.make(j,i)), reverse: this.reverse, index: s[i][j], mode: 0x00, player: true, character: this.character}); }
          sprites.push({pos: vec2.add(vec2.add(this.pos, PlayerObject.DIM_OFFSET), vec2.make(j,i)), reverse: this.reverse, index: s[i][j], mode: mod, player: true, character: this.character});
         }
      }
    }
  }
  else {
    if(mod === 0x02) { sprites.push({pos: vec2.add(this.pos, PlayerObject.DIM_OFFSET), reverse: this.reverse, index: this.sprite.INDEX, mode: 0x00, player: true, character: this.character}); }
    sprites.push({pos: vec2.add(this.pos, PlayerObject.DIM_OFFSET), reverse: this.reverse, index: this.sprite.INDEX, mode: mod, player: true, character: this.character});
  }
  
  var mod;
  if(this.arrowFade > 0.) {
    mod = 0xA0 + parseInt(this.arrowFade*32.);
    sprites.push({pos: vec2.add(vec2.add(this.pos, vec2.make(0., this.dim.y)), PlayerObject.ARROW_OFFSET), reverse: false, index: PlayerObject.ARROW_SPRITE, mode: mod});
  }
  else if(this.name) {
    
  }
};

PlayerObject.prototype.write = function(texts) {
  if(this.arrowFade > 0.) {
    texts.push({pos: vec2.add(vec2.add(this.pos, vec2.make(0., this.dim.y)), PlayerObject.TEXT_OFFSET), size: PlayerObject.TEXT_SIZE, color: "rgba(255,255,255,"+this.arrowFade+")", text: PlayerObject.ARROW_TEXT, noOutline: true});
  }
  else if(this.name) { /* Hacky thing for ghost dim @TODO: */
    var ply = this.game.getPlayerInfo(this.pid)
    var dev = ply ? ply.isDev : false;
    texts.push({pos: vec2.add(vec2.add(this.pos, vec2.make(0., this.sprite.INDEX instanceof Array?2.:1.)), PlayerObject.TEAM_OFFSET), size: PlayerObject.TEAM_SIZE, color: dev ? PlayerObject.DEV_TEAM_COLOR : PlayerObject.TEAM_COLOR, text: this.name, 'outline': dev ? "#FFF" : null});
  }
};

PlayerObject.prototype.play = GameObject.prototype.play;

/* Register object class */
GameObject.REGISTER_OBJECT(PlayerObject);
