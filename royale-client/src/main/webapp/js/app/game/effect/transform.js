"use strict";
/* global app */
/* global Effect */
/* global util, vec2 */

/* We call this upon transforming into the super leaf */
function TransformEffect(pos) {
  Effect.call(this, pos);
  
  this.life = TransformEffect.LIFE_TIME;
  this.sprite = 0;
  this.anim = 0;
  
  this.bits = [
    {
      pos: vec2.add(this.pos, vec2.make(0.,0.)),
      
      sp: vec2.make(0.,0.),   // Sprite Position
      ss: vec2.make(1.,1.),   // Sprite Size
      so: vec2.make(0.,0.)    // Sprite Offset
    }
  ];
};

TransformEffect.SPRITE = [0x002, 0x003, 0x004, 0x005];

TransformEffect.ANIMATION_RATE = 6;
TransformEffect.LIFE_TIME = 8;

TransformEffect.prototype.step = function() {
  Effect.prototype.step.call(this);
  
  this.sprite = TransformEffect.SPRITE[parseInt(this.anim++/TransformEffect.ANIMATION_RATE) % TransformEffect.SPRITE.length];
};

TransformEffect.prototype.destroy = Effect.prototype.destroy;

TransformEffect.prototype.draw = function(fxs) {
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