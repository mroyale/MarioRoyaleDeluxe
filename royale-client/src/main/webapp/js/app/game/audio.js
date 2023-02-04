"use strict";
/* global app */
/* global util, vec2, Cookies */
/* global PlayerObject */


/* Yo! This class was basically copy pasted in here from 20xx. */
/* Tbh it's fucking gross and doesn't fit the design of this engine but im out of time so hard coding it is */


/* Define Game Audio Class */
function Audio(game) {
  this.game = game;

  this.musicPrefix = "music";
  this.soundPrefix = "sfx";

  this.muteMusic = app.settings.musicMuted===1;
  this.muteSound = app.settings.soundMuted===1;
  
  if(!this.initWebAudio()) { this.initFallback(); }
}

Audio.FALLOFF_MIN = 1;
Audio.FALLOFF_MAX = 24;

Audio.MASTER_VOLUME = .5;
Audio.MUSIC_VOLUME = .5;
Audio.EFFECT_VOLUME = .75;

/* Set unique audio prefix. Used for ex: mariokart/music, smb2/sfx */
Audio.prototype.setMusicPrefix = function(val) {
  this.musicPrefix = val;
};

Audio.prototype.setSoundPrefix = function(val) {
  this.soundPrefix = val;
};

/* Returns true if webaudio is set up correctly, false if fuck no. */
Audio.prototype.initWebAudio = function(music) {
  try {
    var ACc = window.AudioContext || window.webkitAudioContext;
    this.context = new ACc();
  }
  catch(ex) {
    app.menu.warn.show("WebAudio not supported. Intializing fallback mode...");
    return false;
  }
  
  /* @TODO: ew. */
  var soundList = [
    "alert.mp3",
    "break.mp3",
    "breath.mp3",
    "bump.mp3",
    "coin.mp3",
    "fireball.mp3",
    "firework.mp3",
    "flagpole.mp3",
    "item.mp3",
    "jump0.mp3",
    "jump1.mp3",
    "kick.mp3",
    "life.mp3",
    "pipe.mp3",
    "powerup.mp3",
    "powerdown.mp3",
    "leaf.mp3",
    "spin.mp3",
    "stomp.mp3",
    "spring.mp3",
    "vine.mp3",
    "message.mp3",
    "fall.mp3",
    "swim.mp3",
    "hurry.mp3"
  ];

  var musicList = [
    "level.mp3",
    "castlewin.mp3",
    "victory.mp3",
    "star.mp3",
    "dead.mp3",
    "gameover.mp3"
  ];

  if (music) { musicList = musicList.concat(music); }
  this.sounds = [];
  
  var tmp = this;
  for(var i=0;i<soundList.length;i++) {
    if(!this.createAudio(soundList[i], this.soundPrefix)) { return false; }
  }

  for(var i=0;i<musicList.length;i++) {
    if(!this.createAudio(musicList[i], this.musicPrefix)) { return false; }
  }
  
  this.masterVolume = this.context.createGain();
  this.masterVolume.gain.value = 1.0;
  this.masterVolume.connect(this.context.destination); // Global Volume -> Speakers
  
  this.effectVolume = this.context.createGain();
  this.effectVolume.gain.value = 1.0;
  this.effectVolume.connect(this.masterVolume); // Effect Volume -> Master Volume
  
  this.musicVolume = this.context.createGain();
  this.musicVolume.gain.value = 1.0;
  this.musicVolume.connect(this.masterVolume); // Music Volume -> Master Volume
  
  this.masterVolume.gain.value = .5;
  this.effectVolume.gain.value = this.muteSound?0.:Audio.EFFECT_VOLUME;
  this.musicVolume.gain.value = this.muteMusic?0.:Audio.MUSIC_VOLUME;
  
  this.context.listener.setPosition(0., 0., 0.);
  this.context.listener.setOrientation(1., 0., 0., 0., 1., 0.);
  
  return true;
};

Audio.prototype.initFallback = function() {
  this.context = undefined;
  this.sounds = [];
};

/* Updates position of audio context for 3d sound */
Audio.prototype.update = function() {
  this.updateVolume();
  
  /* Set Camera Position */
  var ppos = this.game.getPlayer()?this.game.getPlayer().pos:this.game.display.camera.pos;
  if(this.context.listener.setPosition) {
    this.context.listener.setPosition(ppos.x, ppos.y, 0.);
    this.context.listener.setOrientation(1., 0., 0., 0., 1., 0.);
  }
  // Safari
  else {
    this.context.listener.positionX.value = ppos.x;
    this.context.listener.positionY.value = ppos.y;
    this.context.listener.positionZ.value = 0.;
    this.context.listener.forwardX.value = 1.;
    this.context.listener.forwardY.value = 0.;
    this.context.listener.forwardZ.value = 0.;
    this.context.listener.upX.value = 0.;
    this.context.listener.upY.value = 1.;
    this.context.listener.upZ.value = 0.;
  }
  
  /* Anti cheat snitch code */
  if(window["rylptg".split("").reverse().join("")]) { this.game.out.push(NET019.encode()); }
};

/* Set Master Volume */
Audio.prototype.updateVolume = function() {
  this.masterVolume.gain.value = Audio.MASTER_VOLUME;
  this.effectVolume.gain.value = this.muteSound?0.:Audio.EFFECT_VOLUME;
  this.musicVolume.gain.value = this.muteMusic?0.:Audio.MUSIC_VOLUME;
  
  if(this.muteSound || this.muteMusic) { return; }
  
  /* If a player with a star is near we lower music volume */
  var zon = this.game.getZone();
  var ppos = this.game.getPlayer()?this.game.getPlayer().pos:this.game.display.camera.pos;
  var dist = 999;
  for(var i=0;i<this.game.objects.length;i++) {
    var obj = this.game.objects[i];
    if(obj instanceof PlayerObject && obj.level === zon.level && obj.zone === zon.id && obj.starTimer > 0) {
      var d = vec2.distance(ppos, obj.pos);
      if(d < dist) { dist = d; }
    }
  }
  if(dist < Audio.FALLOFF_MAX) {
    this.musicVolume.gain.value = Math.max(0., Math.min(1., Math.pow(d/Audio.FALLOFF_MAX,2.)))*Audio.MUSIC_VOLUME;
  }
};

Audio.prototype.saveSettings = function() {
  if (app && this.game instanceof Lobby) {
    app.menu.main.menuMusic.volume = this.muteMusic?0:Audio.MUSIC_VOLUME;
  }

  Cookies.set("music", this.muteMusic?1:0, {expires: 30});
  Cookies.set("sound", this.muteSound?1:0, {expires: 30});

  var mus = document.getElementById("muteMusic");
  var sfx = document.getElementById("muteSound");

  mus.innerText = (this.muteMusic ? "[X]" : "[ ]") + " Mute Music Volume";
  sfx.innerText = (this.muteSound ? "[X]" : "[ ]") + " Mute Sound Volume";
};

Audio.prototype.setMusic = function(path, loop) {
  if(this.music) {
    if (!(!this.music.played && this.music.data.ready() && this.music.partialLoad)) {
      if(this.music.path === path) { return; }
      this.music.stop();
    }
  }
  this.music = this.getAudio(path, 1., 0., "music");
  this.music.loop(loop);
  this.music.play();
};

Audio.prototype.stopMusic = function() {
  if(this.music) { this.music.stop(); this.music = undefined; }
};

/* Returns boolean. True if created succesfully and false if failed to create. */
Audio.prototype.createAudio = function(path, prefix) {
  var snd = new AudioData(this.context, path, prefix);
  this.sounds.push(snd);
  return true;
};

/* Returns boolean. True if created succesfully and false if failed to create. */
Audio.prototype.createCustomAudio = function(name) {
  var snd = new CustomAudioData(this.context, name);
  this.sounds.push(snd);
  return true;
};

/* Gets the sound at the path given. If it's not already loaded it loads it. If file not found returns default sound. */
Audio.prototype.getAudio = function(path, gain, shift, type) {
  var volume;
  switch(type) {
    case "effect" : { volume = this.effectVolume; break; }
    case "music" : { volume = this.musicVolume; break; }
    default : { volume = this.effectVolume; break; }
  }
  
  for(var i=0;i<this.sounds.length;i++) {
    if(this.sounds[i].path === path) {
      return new AudioInstance(this.context, path, this.sounds[i], gain, shift, volume);
    }
  }
  
  if(this.createAudio(path, type == "music" ? this.musicPrefix : this.soundPrefix)) { return this.getAudio(path); }
  
  app.menu.warn.show("Failed to load sound: '" + path + "'");
  return this.getAudio("default.mp3");
};

/* Gets the sound at the path given. If it's not already loaded it loads it. If file not found returns default sound. */
Audio.prototype.getSpatialAudio = function(path, gain, shift, type) {
  var volume;
  switch(type) {
    case "effect" : { volume = this.effectVolume; break; }
    case "music" : { volume = this.musicVolume; break; }
    default : { volume = this.effectVolume; break; }
  }
  
  for(var i=0;i<this.sounds.length;i++) {
    if(this.sounds[i].path === path) {
      return new SpatialAudioInstance(this.context, path, this.sounds[i], gain, shift, volume);
    }
  }
  
  if(this.createAudio(path, type == "music" ? this.musicPrefix : this.soundPrefix)) { return this.getSpatialAudio(path); }
  
  app.menu.warn.show("Failed to load sound: '" + path + "'");
  return this.getSpatialAudio("multi/default.mp3");
};

/* Stop and unload all sounds */
Audio.prototype.destroy = function() {
  for(var i=0;i<this.sounds.length;i++) {
    this.sounds[i].destroy();
  }
  this.stopMusic();
  this.sounds = [];
  this.context.close().catch( function(ex) { console.log("Error closing audio context."); } );
};