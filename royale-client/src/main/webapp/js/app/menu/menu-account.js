"use strict";
/* global app */
/* global Cookies */

function MenuAccount() {
  this.element = document.getElementById("mainMember");
  this.linkElement = document.getElementById("link");
  this.winElement = document.getElementById("win");
  this.launchBtn = document.getElementById("mainMember-launch");

  this.controlBtn = document.getElementById("mainMember-controls");
  this.changelogBtn = document.getElementById("mainMember-changelog");
  this.settingsBtn = document.getElementById("mainMember-settings");

  this.settingsMenu = document.getElementById("settings");
  this.settingsCloseBtn = document.getElementById("settingsClose");
  
  this.padLoop = undefined;
  
  var that = this;
  this.settingsCloseBtn.onclick = function() { that.settingsMenu.style.display = "none"; }

  this.launchBtn.onclick = function() { app.join(app.net.nickname, app.net.squad); };
  this.controlBtn.onclick = function() { window.open("control.html"); };
  this.changelogBtn.onclick = function() { window.open("patch.html"); };
  this.settingsBtn.onclick = function() { that.settingsMenu.style.display = ""; };
};

/* When the launch button is clicked. */
MenuAccount.prototype.launch = function() {
  app.menu.name.show();
};

/* When the login button is clicked. */
MenuAccount.prototype.login = function() {
  app.menu.login.show();
};

/* When the register button is clicked. */
MenuAccount.prototype.register = function() {
  app.menu.register.show();
};

MenuAccount.prototype.startPad = function() {
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

MenuAccount.prototype.show = function(stats) {
  app.menu.hideAll();
  app.menu.navigation("main", "main");
  app.menu.background("a");
  this.winElement.style.display = "block";
  if(stats) { this.winElement.innerHTML = "Wins×" + (stats.wins) + "</span> <span class='kill'>Deaths×" + (stats.deaths) + "</span> <span class='kill'>Kills×" + (stats.kills) + "</span> <span class='kill'>Coins×" + (stats.coins) + "</span>"; }
  this.startPad();
  this.linkElement.style.display = "block";
  this.element.style.display = "block";
};

MenuAccount.prototype.hide = function() {
  if(this.padLoop) { clearTimeout(this.padLoop); }
  this.linkElement.style.display = "none";
  this.element.style.display = "none";
};