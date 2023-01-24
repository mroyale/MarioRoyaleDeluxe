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

  this.registerMenu = document.getElementById("register");
  this.registerCloseBtn = document.getElementById("signup-close");
  this.signupName = document.getElementById("signup-name");
  this.signupPassword = document.getElementById("signup-password");
  this.signupVerify = document.getElementById("signup-verify");
  this.signupBtn = document.getElementById("signup-register");
  this.signupError = document.getElementById("signup-error");

  
  var menuMusic = ["audio/music/title1.mp3", "audio/music/title2.mp3"];
  this.menuMusic = document.createElement('audio');
  this.menuMusic.src = menuMusic[parseInt(Math.random() * menuMusic.length)];
  this.menuMusic.volume = Cookies.get("music") === '1' ? 0 : 0.5;
  this.menuMusic.loop = true;
  this.menuMusic.load();
  
  this.padLoop = undefined;
  
  var that = this;
  this.settingsCloseBtn.onclick = function() { that.settingsMenu.style.display = "none"; }

  this.launchBtn.onclick = function() { that.launch(); };
  this.controlBtn.onclick = function() { window.open("control.html"); };
  this.changelogBtn.onclick = function() { window.open("patch.html"); };
  this.settingsBtn.onclick = function() { that.settingsMenu.style.display = ""; };
  this.loginBtn.onclick = function() { that.login(); };
  this.registerBtn.onclick = function() { that.showRegisterMenu(); };
};

/* When the launch button is clicked. */
MenuMain.prototype.launch = function() {
  app.menu.name.show();
};

/* When the login button is clicked. */
MenuMain.prototype.login = function() {
  app.menu.login.show();
};

/* Register Menu */
MenuMain.prototype.showRegisterMenu = function() {
  this.registerMenu.style.display = "";
};

MenuMain.prototype.hideRegisterMenu = function() {
  this.registerMenu.style.display = "none";
  this.signupName.value = "";
  this.signupPassword.value = "";
  this.signupVerify.value = "";
  this.signupError.value = "";
};

MenuMain.prototype.register = function() {
  app.menu.register.show();
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
  this.winElement.innerHTML = "Login to track statistics and play as Luigi!";
  this.startPad();
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