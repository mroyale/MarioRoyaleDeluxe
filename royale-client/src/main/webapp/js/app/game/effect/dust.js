"use strict";
/* global app */
/* global Effect */
/* global util, vec2 */

function DustEffect(pos) {
  Effect.call(this, pos);
  
  this.life = DustEffect.LIFE_TIME;
  this.sprite = 0;
  this.anim = 0;
  
  this.bits = [
    {
      pos: vec2.add(this.pos, vec2.make(0.,0.)),
      
      sp: vec2.make(0.,0.),   // Sprite Position
      ss: vec2.make(1.,1.),   // Sprite Size
      so: vec2.make(0.,0.)    // Sprite Offset [ NOTE: This is actually unused ]
    }
  ];
};

DustEffect.SPRITE = [0x000, 0x001];

DustEffect.ANIMATION_RATE = 8;
DustEffect.LIFE_TIME = 8;

DustEffect.prototype.step = function() {
  Effect.prototype.step.call(this);
  
  this.sprite = DustEffect.SPRITE[parseInt(this.anim++/DustEffect.ANIMATION_RATE) % DustEffect.SPRITE.length];
};

DustEffect.prototype.destroy = Effect.prototype.destroy;

DustEffect.prototype.draw = function(fxs) {
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