"use strict";
/* global app */
/* global Cookies */

function MenuAccount() {
  this.element = document.getElementById("mainMember");
  this.linkElement = document.getElementById("link");
  this.linkMemberElement = document.getElementById("linkMember");
  this.winElement = document.getElementById("win");
  this.launchBtn = document.getElementById("mainMember-launch");

  this.controlBtn = document.getElementById("mainMember-controls");
  this.changelogBtn = document.getElementById("mainMember-changelog");
  this.settingsBtn = document.getElementById("mainMember-settings");

  this.profileBtn = document.getElementById("mainMember-profile");
  this.logoutBtn = document.getElementById("mainMember-logout");

  this.settingsMenu = document.getElementById("settings");
  this.settingsCloseBtn = document.getElementById("settingsClose");
  
  this.profileMenu = document.getElementById("profile");
  this.profileSaveBtn = document.getElementById("profile-save");
  this.profileCloseBtn = document.getElementById("profile-close");
  
  this.padLoop = undefined;
  
  var that = this;
  this.settingsCloseBtn.onclick = function() { that.settingsMenu.style.display = "none"; };
  this.profileCloseBtn.onclick = function() { that.hideProfileMenu(); };
  this.profileSaveBtn.onclick = function() { that.saveProfile(); };

  this.launchBtn.onclick = function() { app.join(app.net.nickname, app.net.squad); };
  this.controlBtn.onclick = function() { window.open("control.html"); };
  this.changelogBtn.onclick = function() { window.open("patch.html"); };
  this.settingsBtn.onclick = function() { that.settingsMenu.style.display = ""; };
  this.profileBtn.onclick = function() { that.showProfileMenu(); };
  this.logoutBtn.onclick = function() { app.net.send({'type': 'llo', 'session': Cookies.get("session")}); }

  this.profileUsername = document.getElementById("profile-username");
  this.profileNickname = document.getElementById("profile-nickname");
  this.profileError = document.getElementById("profile-error");

  this.marioHead = document.getElementById("profile-selectMario");
  this.luigiHead = document.getElementById("profile-selectLuigi");

  this.marioHead.addEventListener("click", (function () { return function (event) { that.selectCharacter(0); }; })());
  this.luigiHead.addEventListener("click", (function () { return function (event) { that.selectCharacter(1); }; })());

  this.pendingChar = null;
};

/* When the launch button is clicked. */
MenuAccount.prototype.launch = function() {
  app.menu.name.show();
};

/* Profile Menu */
MenuAccount.prototype.showProfileMenu = function() {
  this.profileMenu.style.display = "";
  this.profileUsername.innerText = app.net.username;
  this.profileNickname.value = app.net.nickname;
  switch (app.net.character) {
    default :
    case 0 : { this.marioHead.src = "img/home/marselect.png"; this.luigiHead.src = "img/home/luihead.png"; break; }
    case 1 : { this.marioHead.src = "img/home/marhead.png"; this.luigiHead.src = "img/home/luiselect.png"; break; }
  }
};

MenuAccount.prototype.hideProfileMenu = function() {
  this.profileMenu.style.display = "none";
  this.profileError.innerText = "";
};

MenuAccount.prototype.profileReport = function(msg) {
  this.profileError.innerText = msg;
};

MenuAccount.prototype.selectCharacter = function(char) {
  switch (char) {
    default :
    case 0 : { this.marioHead.src = "img/home/marselect.png"; this.luigiHead.src = "img/home/luihead.png"; break; }
    case 1 : { this.marioHead.src = "img/home/marhead.png"; this.luigiHead.src = "img/home/luiselect.png"; break; }
  }
  this.pendingChar = char;
};

MenuAccount.prototype.saveProfile = function() {
  app.net.send({
    'type': 'lpu',
    'nickname': this.profileNickname.value,
    'character': this.pendingChar !== null ? this.pendingChar : app.net.character
  })
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
  this.linkMemberElement.style.display = "block";
  this.linkElement.style.display = "block";
  this.element.style.display = "block";
};

MenuAccount.prototype.hide = function() {
  if(this.padLoop) { clearTimeout(this.padLoop); }
  this.linkElement.style.display = "none";
  this.linkMemberElement.style.display = "none";
  this.element.style.display = "none";
};