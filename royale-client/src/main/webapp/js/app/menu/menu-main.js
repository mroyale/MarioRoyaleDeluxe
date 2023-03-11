"use strict";
/* global app */
/* global Cookies */

function MenuMain() {
  this.element = document.getElementById("main");
  this.linkElement = document.getElementById("link");
  this.winElement = document.getElementById("win");
  this.launchBtn = document.getElementById("main-launch");

  this.controlBtn = document.getElementById("main-controls");
  this.changelogBtn = document.getElementById("main-changelog");
  this.settingsBtn = document.getElementById("main-settings");
  this.loginBtn = document.getElementById("main-login");
  this.registerBtn = document.getElementById("main-register");

  this.settingsMenu = document.getElementById("settings");
  this.settingsCloseBtn = document.getElementById("settingsClose");

  this.controlsMenu = document.getElementById("controls");
  this.controlsCloseBtn = document.getElementById("controls-close");

  this.changelogMenu = document.getElementById("changelog");
  this.changelogCloseBtn = document.getElementById("changelog-close");

  this.darkBackground = document.getElementById("dark-bg");

  this.playMenu = document.getElementById("play");
  this.playCloseBtn = document.getElementById("play-close");
  this.playName = document.getElementById("play-name");
  this.playPriv = document.getElementById("play-priv");
  this.playGo = document.getElementById("play-go");

  this.playVanilla = document.getElementById("play-royale");
  this.playPVP = document.getElementById("play-pvp");

  this.registerMenu = document.getElementById("register");
  this.registerCloseBtn = document.getElementById("signup-close");
  this.signupName = document.getElementById("signup-name");
  this.signupPassword = document.getElementById("signup-password");
  this.signupVerify = document.getElementById("signup-verify");
  this.signupBtn = document.getElementById("signup-register");
  this.signupError = document.getElementById("signup-error");

  this.loginMenu = document.getElementById("login");
  this.loginCloseBtn = document.getElementById("login-close");
  this.signinName = document.getElementById("login-name");
  this.signinPassword = document.getElementById("login-password");
  this.signinBtn = document.getElementById("login-signin");
  this.signinError = document.getElementById("login-error");

  var that = this;
  $(document).keyup(function(event) {
    if (event.which === 13) {
        if (that.playMenu.style.display === "") { that.launch(false); }
        if (that.loginMenu.style.display === "") { that.login(); };
        if (that.registerMenu.style.display === "") { that.register(); };
    }
  });

  this.playVanilla.onclick = function() { that.changeGamemode(0); };
  this.playPVP.onclick = function() { that.changeGamemode(1); };
  
  this.menuMusic = document.createElement('audio');
  this.menuMusic.volume = Cookies.get("music") === '1' ? 0 : Audio.MUSIC_VOLUME;
  this.menuMusic.loop = true;
  this.menuMusic.load();
  
  this.padLoop = undefined;
  
  this.settingsCloseBtn.onclick = function() { that.settingsMenu.style.display = "none"; }
  this.controlsCloseBtn.onclick = function() { that.hideControlsMenu(); };
  this.changelogCloseBtn.onclick = function() { that.hideChangelogMenu(); };

  this.launchBtn.onclick = function() { that.showPlayMenu(); };
  this.playGo.onclick = function() { that.launch(false); };
  this.playPriv.onclick = function() { that.launch(true); };
  this.playCloseBtn.onclick = function() { that.hidePlayMenu(); };
  this.controlBtn.onclick = function() { that.showControlsMenu(); };
  this.changelogBtn.onclick = function() { that.showChangelogMenu(); };
  this.settingsBtn.onclick = function() { that.showSettingsMenu(); };
  this.loginBtn.onclick = function() { that.showLoginMenu(); };
  this.loginCloseBtn.onclick = function() { that.hideLoginMenu(); };
  this.signinBtn.onclick = function() { that.login(); };
  this.registerBtn.onclick = function() { that.showRegisterMenu(); };
  this.registerCloseBtn.onclick = function() { that.hideRegisterMenu(); };
  this.signupBtn.onclick = function() { that.register(); };

  var nam = Cookies.get("name");
  this.playName.value = nam?nam.slice(0,20):"";
};

/* Play Menu */
MenuMain.prototype.showPlayMenu = function() {
  this.hideRegisterMenu();
  this.hideLoginMenu();
  this.darkBackground.style.display = "";
  this.playMenu.style.display = "";

  var mode = Cookies.get("mode") === '1' ? 1 : 0;
  this.changeGamemode(mode);
};

MenuMain.prototype.hidePlayMenu = function() {
  this.darkBackground.style.display = "none";
  this.playMenu.style.display = "none";
};

MenuMain.prototype.changeGamemode = function(mode) {
  app.gm = mode;
  Cookies.set("mode", mode, {expires: 30});

  var that = this;
  switch(mode) {
    default:
    case 0 : { that.playVanilla.src = "img/home/vanilla-selected.png"; that.playPVP.src = "img/home/pvp.png"; break; }
    case 1 : { that.playVanilla.src = "img/home/vanilla.png"; that.playPVP.src = "img/home/pvp-selected.png"; break; }
  }
};

/* Controls Menu */
MenuMain.prototype.showControlsMenu = function() {
  this.darkBackground.style.display = "";
  this.controlsMenu.style.display = "";
};

MenuMain.prototype.hideControlsMenu = function() {
  this.darkBackground.style.display = "none";
  this.controlsMenu.style.display = "none";
};

/* Changelog Menu */
MenuMain.prototype.showChangelogMenu = function() {
  this.darkBackground.style.display = "";
  this.changelogMenu.style.display = "";
};

MenuMain.prototype.hideChangelogMenu = function() {
  this.darkBackground.style.display = "none";
  this.changelogMenu.style.display = "none";
};


/* Settings Menu */
MenuMain.prototype.showSettingsMenu = function() {
  this.darkBackground.style.display = "";
  this.settingsMenu.style.display = "";
};

MenuMain.prototype.hideSettingsMenu = function() {
  this.darkBackground.style.display = "none";
  this.settingsMenu.style.display = "none";
};

MenuMain.prototype.launch = function(priv) {
  this.hidePlayMenu();
  Cookies.set("name", this.playName.value, {expires: 30});
  Cookies.set("priv", priv, {'expires': 30});
  app.join(this.playName.value, "", Boolean(priv), parseInt(app.gm));
};

/* Login Menu */
MenuMain.prototype.showLoginMenu = function() {
  this.loginMenu.style.display = "";
  this.darkBackground.style.display = "";
};

MenuMain.prototype.hideLoginMenu = function() {
  this.loginMenu.style.display = "none";
  this.signupName.value = "";
  this.signupPassword.value = "";
  this.signupError.innerText = "";
  this.darkBackground.style.display = "none";
};

MenuMain.prototype.login = function() {
  var name = this.signinName.value;
  var pass = this.signinPassword.value;

  var that = this;
  if (name.length < 4) { that.loginError("Username is too short"); return; }
  if (name.length > 20) { that.loginError("Username is too long"); return; }
  if (pass.length < 4) { that.loginError("Password is too short"); return; }
  
  this.hideLoginMenu();
  app.login(name, pass);
};

MenuMain.prototype.loginError = function(msg) {
  this.signinError.innerText = msg;
};

/* Register Menu */
MenuMain.prototype.showRegisterMenu = function() {
  this.registerMenu.style.display = "";
  this.darkBackground.style.display = "";
};

MenuMain.prototype.hideRegisterMenu = function() {
  this.registerMenu.style.display = "none";
  this.signupName.value = "";
  this.signupPassword.value = "";
  this.signupVerify.value = "";
  this.signupError.innerText = "";
  this.darkBackground.style.display = "none";
};

MenuMain.prototype.register = function() {
  var name = this.signupName.value;
  var pass = this.signupPassword.value;
  var verify = this.signupVerify.value;

  var that = this;
  if (name.length < 4) { that.registerError("Username is too short"); return; }
  if (name.length > 20) { that.registerError("Username is too long"); return; }
  if (pass.length < 4) { that.registerError("Password is too short"); return; }
  if (pass != verify) { that.registerError("Passwords don't match"); return; }
  
  this.hideRegisterMenu();
  app.register(name, pass);
};

MenuMain.prototype.registerError = function(msg) {
  this.signupError.innerText = msg;
};

MenuMain.prototype.startPad = function() {
  var parent = this;
  var btn = isNaN(parseInt(Cookies.get("g_a")))?0:parseInt(Cookies.get("g_a"));
  var p = false;
  
  var padCheck = function() {
    var pad;
    if(navigator && navigator.getGamepads) { pad = navigator.getGamepads()[0]; }
    if(pad && !pad.buttons[btn].pressed && p) { parent.launch(); }
    if(pad) { p = pad.buttons[btn].pressed; }
    parent.padLoop = setTimeout(padCheck, 33);
  };

  padCheck();
};

MenuMain.prototype.show = function() {
  app.menu.hideAll();
  app.menu.navigation("main", "main");
  app.menu.background("a");
  this.winElement.style.display = "block";
  this.winElement.innerHTML = "Login to track statistics and play as other characters!";
  this.linkElement.style.display = "block";
  this.element.style.display = "block";

  this.menuMusic.play();

  var session = Cookies.get("session");
  if(session) {
    app.resumeSession(session);
  }
};

MenuMain.prototype.hide = function() {
  if(this.padLoop) { clearTimeout(this.padLoop); }
  this.linkElement.style.display = "none";
  this.element.style.display = "none";
};