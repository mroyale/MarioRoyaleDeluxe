"use strict";
/* global app */
/* global Effect */
/* global util, vec2 */

/* This isn't actually exploding but I don't know what else to call it */
/* Used when a koopa hits a solid block while in a shell */
function ExplodeEffect(pos) {
  Effect.call(this, pos);
  
  this.life = ExplodeEffect.LIFE_TIME;
  this.sprite = 0;
  this.anim = 0;
  
  this.bits = [
    {
      pos: vec2.add(this.pos, vec2.make(0.,0.)),
      
      sp: vec2.make(0.,0.),   // Sprite Position
      ss: vec2.make(2.,2.),   // Sprite Size [ 32x32 ]
      so: vec2.make(0.,0.)    // Sprite Offset [ NOTE: This is actually unused ]
    }
  ];
};

ExplodeEffect.SPRITE = [0x006, 0x008, 0x00A, 0x00C, 0x00E];

ExplodeEffect.ANIMATION_RATE = 2;
ExplodeEffect.LIFE_TIME = 8;

ExplodeEffect.prototype.step = function() {
  Effect.prototype.step.call(this);
  
  this.sprite = ExplodeEffect.SPRITE[parseInt(this.anim++/ExplodeEffect.ANIMATION_RATE) % ExplodeEffect.SPRITE.length];
};

ExplodeEffect.prototype.destroy = Effect.prototype.destroy;

ExplodeEffect.prototype.draw = function(fxs) {
  for(var i=0;i<this.bits.length;i++) {
    var bit = this.bits[i];
    
    fxs.push({
      tex: "effects",
      ind: this.sprite,
      
      pos: bit.pos,
      off: bit.so,
      rot: 0,
      
      sp: bit.sp,
      ss: bit.ss
    });
  }
  
};