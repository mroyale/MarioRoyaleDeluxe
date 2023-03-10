"use strict";
/* global app */
/* global util, shor2, vec2, td32, MERGE_BYTE */
/* global Game */

function Lobby(data) {
  Game.call(this, data);

  var pref = "audio/lobby/";

  if (app.menu.main) {
    var music = ["lobby-smb3w1.mp3", "lobby-smb3w4.mp3", "lobby-yi.mp3", "lobby-special.mp3"];
    app.menu.main.menuMusic.src = pref + music[parseInt(Math.random() * music.length)];
    app.menu.main.menuMusic.play();
  }

  this.lobbyTimer = 90;
};

Lobby.prototype.changePrivMenu = Game.prototype.changePrivMenu;
Lobby.prototype.getDebug = Game.prototype.getDebug;
Lobby.prototype.load = Game.prototype.load;

Lobby.prototype.getGameTimer = Game.prototype.getGameTimer;
Lobby.prototype.resumeGameTimer = Game.prototype.resumeGameTimer;
Lobby.prototype.stopGameTimer = Game.prototype.stopGameTimer;

Lobby.prototype.send = Game.prototype.send;
Lobby.prototype.handlePacket = Game.prototype.handlePacket;
Lobby.prototype.updatePlayerList = Game.prototype.updatePlayerList;
Lobby.prototype.gameStartTimer = function() { /* Null for lobby */ };
Lobby.prototype.updateTeam = Game.prototype.updateTeam;
Lobby.prototype.handleBinary = Game.prototype.handleBinary;
Lobby.prototype.updatePacket = Game.prototype.updatePacket;

Lobby.prototype.doUpdate = Game.prototype.doUpdate;

Lobby.prototype.doNET001 = Game.prototype.doNET001;
Lobby.prototype.doNET010 = Game.prototype.doNET010;
Lobby.prototype.doNET011 = Game.prototype.doNET011;
Lobby.prototype.doNET012 = Game.prototype.doNET012;
Lobby.prototype.doNET013 = Game.prototype.doNET013;
Lobby.prototype.doNET020 = Game.prototype.doNET020;
Lobby.prototype.doNET030 = Game.prototype.doNET030;

Lobby.prototype.doStart = Game.prototype.doStart;
Lobby.prototype.doDetermine = Game.prototype.doDetermine;
Lobby.prototype.doInput = Game.prototype.doInput;
Lobby.prototype.doTouch = Game.prototype.doTouch;
Lobby.prototype.doStep = function() {
  this.doSpawn(); // If we die in the lobby, just immiedately respawn.
  Game.prototype.doStep.call(this);
};
Lobby.prototype.doSpawn = Game.prototype.doSpawn;
Lobby.prototype.doMusic = function() {
  var ply = this.getPlayer();
  var zon = this.getZone();
  if(this instanceof Lobby) { return; }
  if(this.gameOver) { this.audio.setMusic("gameover.mp3", false); return; }
  if(ply && ply.dead) { this.audio.setMusic("dead.mp3", false); return; }
  if(ply && ply.autoTarget && this.victory <= 0) { this.audio.setMusic("level.mp3", false); return; }
  if(this.victory > 0 && !this.victoryMusic) { this.audio.setMusic("castlevictory.mp3", false); this.victoryMusic = true; return; }
  if(this.victory > 0 && this.victory < 4 && this.victoryMusic && !this.audio.music.playing) { this.audio.setMusic("victory.mp3", false); return; }
  if(ply && this.levelWarpTimer <= 0 && this.startDelta !== undefined && !this.victoryMusic) {
    if(zon.music !== "") { this.audio.setMusic(zon.music, true); }
    else { this.audio.stopMusic(); }
    return;
  }
};
Lobby.prototype.doPush = Game.prototype.doPush;

Lobby.prototype.createObject = Game.prototype.createObject;

Lobby.prototype.getObject = Game.prototype.getObject;
Lobby.prototype.getFlag = Game.prototype.getFlag;
Lobby.prototype.getPlatforms = Game.prototype.getPlatforms;
Lobby.prototype.getGhost = Game.prototype.getGhost;
Lobby.prototype.getPlayer = Game.prototype.getPlayer;
Lobby.prototype.getZone = Game.prototype.getZone;
Lobby.prototype.getPlayerInfo = Game.prototype.getPlayerInfo;
Lobby.prototype.getRemain = Game.prototype.getRemain;

Lobby.prototype.play = Game.prototype.play;
Lobby.prototype.levelWarp = Game.prototype.levelWarp;

Lobby.prototype.coinage = Game.prototype.coinage;
Lobby.prototype.lifeage = Game.prototype.lifeage;

Lobby.prototype.loop = function() {
  if(this.lobbyTimer > 0) { this.lobbyTimer--; }
  else if(this.startDelta === undefined) { this.doStart(); }
  Game.prototype.loop.call(this);
};

Lobby.prototype.draw = Game.prototype.draw;

Lobby.prototype.destroy = Game.prototype.destroy;