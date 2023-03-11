"use strict";
/* global Game, Lobby */

/* Define Main Class */
function App() {
  this.menu = new Menu();                // Handles HTML menus
  this.net = new Network();              // Handles websockets

  var music = Cookies.get("music");
  var sound = Cookies.get("sound");
  this.settings = {
    'musicVolume': isNaN(parseInt(music)) ? Audio.MUSIC_VOLUME*100 : parseInt(music),
    'soundVolume': isNaN(parseInt(sound)) ? Audio.EFFECT_VOLUME*100 : parseInt(sound),
    'hideNames': Cookies.get("text") === '1',
    'hideTimer': Cookies.get("timer") === '1',
    'disableBg': Cookies.get("background") === '1'
  }

  this.statusUpdate = null;
  this.session = Cookies.get("session");

  this.goToLobby = Cookies.get("go_to_lobby") === '1';
  if(this.goToLobby) {
    Cookies.remove("go_to_lobby");
  }

  this.skipDisclaimer = Cookies.get("skip_disclaimer") === '1';
  if(this.skipDisclaimer) {
    Cookies.remove("skip_disclaimer");
  }

  var that = this;
  var tmr = document.getElementById("hideTimer");
  var bg = document.getElementById("disableBackground");
  var mus = document.getElementById("musicSlider");
  var sfx = document.getElementById("soundSlider");

  mus.oninput = function() { that.updateVolume("music"); };
  sfx.oninput = function() { that.updateVolume("sfx"); }

  mus.value = this.settings.musicVolume;
  sfx.value = this.settings.soundVolume;

  Audio.MUSIC_VOLUME = this.settings.musicVolume/100;
  Audio.EFFECT_VOLUME = this.settings.soundVolume/100;

  document.getElementById("mus_vol").innerHTML=parseInt(mus.value);
  document.getElementById("sfx_vol").innerHTML=parseInt(sfx.value);

  this.menu.main.menuMusic.volume = mus.value === 0 ? 0 : Audio.MUSIC_VOLUME;

  tmr.onclick = function() { that.toggleTimer(); };
  tmr.innerText = (this.settings.hideTimer ? "[*]" : "[ ]") + " Hide In-Game Timer";

  bg.onclick = function() { that.toggleBackground(); };
  bg.innerText = (this.settings.disableBg ? "[*]": "[ ]") + " Disable Backgrounds";
}

App.prototype.updateVolume = function(type) {
  var mus = document.getElementById("musicSlider");
  var sfx = document.getElementById("soundSlider");

  switch(type) {
    case "music" : {
      Cookies.set("music", mus.value, {'expires': 30});
      Audio.MUSIC_VOLUME = parseInt(mus.value)/100;
      this.menu.main.menuMusic.volume = parseInt(mus.value)/100;
      this.settings.musicVolume = parseInt(mus.value);
      document.getElementById("mus_vol").innerHTML=parseInt(mus.value);
      break;
    }

    case "sfx" : {
      Cookies.set("sfx", sfx.value, {'expires': 30});
      Audio.EFFECT_VOLUME = parseInt(sfx.value)/100;
      this.settings.soundVolume = parseInt(sfx.value);
      document.getElementById("sfx_vol").innerHTML=parseInt(sfx.value);
      break;
    }
  }
};

App.prototype.toggleTimer = function() {
  this.settings.hideTimer = !this.settings.hideTimer;
  Cookies.set("timer", this.settings.hideTimer?1:0, {'expires': 30});
  document.getElementById("hideTimer").innerText = (this.settings.hideTimer ? "[*]" : "[ ]") + " Hide In-Game Timer";
};

App.prototype.toggleBackground = function() {
  this.settings.disableBg = !this.settings.disableBg;
  Cookies.set("background", this.settings.disableBg?1:0, {'expires': 30});
  document.getElementById("disableBackground").innerText = (this.settings.disableBg ? "[*]" : "[ ]") + " Disable Backgrounds";
};

App.prototype.init = function() {
  var that = this;
  this.menu.disclaim.show();
  var next = function() {
    that.menu.load.show();
    var serverResponse = function(data) {
      fadeIn();

      if (that.goToLobby && !that.session) {
        var nam = Cookies.get("name");
        var priv = Cookies.get("priv");
        var gm = Cookies.get("mode");
        that.join(nam?nam.slice(0,20):"", "", priv?Boolean(parseInt(priv)):false, gm?parseInt(gm):0);
        return;
      }

      if(data.result) { that.menu.error.show(data.result); return; }
      /* OK */
      that.menu.main.show(data.active);

      document.getElementById("players-royale").innerText = data.playersVanilla;
      document.getElementById("players-pvp").innerText = data.playersPVP;

      document.getElementById("playersMember-royale").innerText = data.playersVanilla;
      document.getElementById("playersMember-pvp").innerText = data.playersPVP;

      that.statusUpdate = setInterval(function() { that.updateStatus(); }, 1000);
    };

    var serverError = function() {
      fadeIn();
      that.menu.error.show("An unknown error occurred while connecting to the game server...");
    };

    $.ajax({
      url: /royale/ + "status",
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

App.prototype.updateStatus = function() {
  var that = this;
  var serverResponse = function(data) {
    if(data.result) { that.menu.error.show(data.result); return; }

    /* OK */
    document.getElementById("players-royale").innerText = data.playersVanilla;
    document.getElementById("players-pvp").innerText = data.playersPVP;

    document.getElementById("playersMember-royale").innerText = data.playersVanilla;
    document.getElementById("playersMember-pvp").innerText = data.playersPVP;
  };

  $.ajax({
    url: /royale/ + "status",
    type: 'GET',
    timeout: 3000,
    success: function(data) { serverResponse(data); },
  });
};

/* Load a game from .game file */
App.prototype.load = function(data, dm) {
  if(this.game instanceof Game) { this.menu.error.show("State error. Game already loaded."); return; }
  if(this.game instanceof Lobby) { this.game.destroy(); }
  
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