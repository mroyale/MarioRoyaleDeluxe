"use strict";
/* global app */
/* global Effect */
/* global util, vec2 */

function LifeEffect(pos) {
  Effect.call(this, pos);
  
  this.life = LifeEffect.LIFE_TIME;
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

LifeEffect.SPRITE = [0x010];

LifeEffect.ANIMATION_RATE = 1;
LifeEffect.LIFE_TIME = 48;

LifeEffect.prototype.step = function() {
  Effect.prototype.step.call(this);
  
  this.bits[0].pos.y += 0.03;
  this.sprite = LifeEffect.SPRITE[parseInt(this.anim++/LifeEffect.ANIMATION_RATE) % LifeEffect.SPRITE.length];
};

LifeEffect.prototype.destroy = Effect.prototype.destroy;

LifeEffect.prototype.draw = function(fxs) {
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