"use strict";
/* global Game, Lobby */

/* Define Main Class */
function App() {
  this.menu = new Menu();                // Handles HTML menus
  this.net = new Network();              // Handles websockets

  this.settings = {
    musicMuted: Cookies.get("music") === '1',
    soundMuted: Cookies.get("sound") === '1',
    hideNames: Cookies.get("text") === '1',
    hideTimer: Cookies.get("timer") === '1'
  }

  var that = this;
  var tmr = document.getElementById("hideTimer");
  var mus = document.getElementById("muteMusic");
  var sfx = document.getElementById("muteSound");

  mus.onclick = function() { that.toggleMusic(); };
  mus.innerText = (this.settings.musicMuted ? "[X]" : "[ ]") + " Mute Music Volume";

  sfx.onclick = function() { that.toggleSound(); };
  sfx.innerText = (this.settings.soundMuted ? "[X]" : "[ ]") + " Mute Sound Volume";

  tmr.onclick = function() { that.toggleTimer(); };
  tmr.innerText = (this.settings.hideTimer ? "[X]" : "[ ]") + " Hide In-Game Timer";
}

App.prototype.toggleMusic = function() {
  this.settings.musicMuted = !this.settings.musicMuted;
  Cookies.set("music", this.settings.musicMuted?1:0, {'expires': 30});
  document.getElementById("muteMusic").innerText = (this.settings.musicMuted ? "[X]" : "[ ]") + " Mute Music Volume";

  if (this.ingame()) {
    this.game.audio.muteMusic = this.settings.musicMuted;
  }
  this.menu.main.menuMusic.volume = this.settings.musicMuted ? 0 : 0.5;
};

App.prototype.toggleSound = function() {
  this.settings.soundMuted = !this.settings.soundMuted;
  Cookies.set("sound", this.settings.soundMuted?1:0, {'expires': 30});
  document.getElementById("muteSound").innerText = (this.settings.soundMuted ? "[X]" : "[ ]") + " Mute Sound Volume";

  if (this.ingame()) {
    this.game.audio.muteSound = this.settings.soundMuted;
  }
};

App.prototype.toggleTimer = function() {
  this.settings.hideTimer = !this.settings.hideTimer;
  Cookies.set("timer", this.settings.hideTimer?1:0, {'expires': 30});
  document.getElementById("hideTimer").innerText = (this.settings.hideTimer ? "[X]" : "[ ]") + " Hide In-Game Timer";
};

App.prototype.init = function() {
  var that = this;
  this.menu.disclaim.show();
  var next = function() {
    that.menu.load.show();
    var serverResponse = function(data) {
      fadeIn();

      if(data.result) { that.menu.error.show(data.result); return; }
      /* OK */
      that.menu.main.show(data.active);
    };

    var serverError = function() {
      fadeIn();
      that.menu.error.show("An unknown error occurred while connecting to the game server...");
    };

    $.ajax({
      url: "/royale/status",
      type: 'GET',
      timeout: 3000,
      success: function(data) { serverResponse(data); },
      error: function() { serverError(); }
    });
  }

  document.getElementById("next").onclick = function() {
    fadeOutCallback(next);
  }
};

/* Load a game from .game file */
App.prototype.load = function(data, dm) {
  if(this.game instanceof Game) { this.menu.error.show("State error. Game already loaded."); return; }
  if(this.game instanceof Lobby) { this.game.destroy(); }
  
  this.net.deathmatch = dm;
  switch(data.type) {
    case "game" : { this.game = new Game(data); break; }
    case "lobby": { this.game = new Lobby(data); break; }
    case "jail": { this.game = new Jail(data); break; }
    default : { this.menu.error.show("Critical error! Game file missing type!"); break; }
  }
};


/* Returns true if the player is currently connected to a game. */
App.prototype.ingame = function() {
  return !!this.game;
};

/* Returns true if we're currently logged into an account */
App.prototype.loggedIn = function() {
  return this.net.nickname !== undefined;
};

/* Connect to game server and join a game */
App.prototype.join = function(name, team, priv, gameMode) {
  if(this.ingame()) {
    this.menu.error.show("An error occurred while starting game..."); return;
  }
  this.menu.load.show();
  this.net.connect([Network.TYPES.PLAY, name, team, priv, gameMode]);
};

/* Login to our account */
App.prototype.login = function(name, password) {
  this.menu.load.show();
  this.net.connect([Network.TYPES.LOGIN, name, password]);
};

/* Register a new account */
App.prototype.register = function(name, password) {
  this.menu.load.show();
  this.net.connect([Network.TYPES.REGISTER, name, password]);
};

/* Resume active session */
App.prototype.resumeSession = function(session) {
  this.menu.load.show();
  this.net.connect([Network.TYPES.RESUME, session]);
}

/* Close active game and reload page */
App.prototype.close = function() {
  this.menu.load.show();
  if(this.ingame()) {
    this.net.close();
  }
  location.reload();
};

/* Starts the App */
var app = new App();
app.init();