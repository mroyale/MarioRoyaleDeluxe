"use strict";
/* global app */
/* global Cookies */

function MenuAccount() {
  this.element = document.getElementById("mainMember");
  this.linkElement = document.getElementById("link");
  this.linkMemberElement = document.getElementById("linkMember");
  this.winElement = document.getElementById("win");

  this.controlBtn = document.getElementById("mainMember-controls");
  this.changelogBtn = document.getElementById("mainMember-changelog");
  this.settingsBtn = document.getElementById("mainMember-settings");

  this.playBtn = document.getElementById("mainMember-play");
  this.profileBtn = document.getElementById("mainMember-profile");
  this.passwordBtn = document.getElementById("mainMember-password");
  this.logoutBtn = document.getElementById("mainMember-logout");

  this.settingsMenu = document.getElementById("settings");
  this.settingsCloseBtn = document.getElementById("settingsClose");

  this.playMenu = document.getElementById("playMember");
  this.playCloseBtn = document.getElementById("playMember-close");
  this.playGo = document.getElementById("playMember-go");
  this.playPriv = document.getElementById("playMember-priv");

  this.playVanilla = document.getElementById("playMember-royale");
  this.playPVP = document.getElementById("playMember-pvp");

  
  this.profileMenu = document.getElementById("profile");
  this.profileSaveBtn = document.getElementById("profile-save");
  this.profileCloseBtn = document.getElementById("profile-close");
  
  this.passwordMenu = document.getElementById("password");
  this.passwordSaveBtn = document.getElementById("password-save");
  this.passwordCloseBtn = document.getElementById("password-close");
  this.passwordError = document.getElementById("password-error");
  
  this.passwordNew = document.getElementById("password-new");
  this.passwordVerify = document.getElementById("password-verify");
  
  this.darkBackground = document.getElementById("dark-bg");
  
  var that = this;
  $(document).keyup(function(event) {
    if (event.which === 13) {
      if(that.playMenu.style.display === "") { that.launch(false); };
      if(that.profileMenu.style.display === "") { that.saveProfile(); };
      if(that.passwordMenu.style.display === "") { that.savePassword(); };
    }
  });
  
  this.playVanilla.onclick = function() { that.changeGamemode(0); };
  this.playPVP.onclick = function() { that.changeGamemode(1); };

  this.padLoop = undefined;
  
  this.settingsCloseBtn.onclick = function() { that.hideSettingsMenu(); };
  this.playCloseBtn.onclick = function() { that.hidePlayMenu(); };
  this.profileCloseBtn.onclick = function() { that.hideProfileMenu(); };
  this.passwordCloseBtn.onclick = function() { that.hidePasswordMenu(); };

  this.playGo.onclick = function() { that.launch(false); };
  this.playPriv.onclick = function() { that.launch(true); };
  this.profileSaveBtn.onclick = function() { that.saveProfile(); };
  this.passwordSaveBtn.onclick = function() { that.savePassword(); };

  this.playBtn.onclick = function() { that.showPlayMenu(); };
  this.controlBtn.onclick = function() { window.open("control.html"); };
  this.changelogBtn.onclick = function() { window.open("patch.html"); };
  this.settingsBtn.onclick = function() { that.showSettingsMenu(); };
  this.profileBtn.onclick = function() { that.showProfileMenu(); };
  this.passwordBtn.onclick = function() { that.showPasswordMenu(); };
  this.logoutBtn.onclick = function() { app.net.send({'type': 'llo', 'session': Cookies.get("session")}); }

  this.profileUsername = document.getElementById("profile-username");
  this.profileNickname = document.getElementById("profile-nickname");
  this.profileError = document.getElementById("profile-error");

  this.marioHead = document.getElementById("profile-selectMario");
  this.luigiHead = document.getElementById("profile-selectLuigi");
  this.infringioHead = document.getElementById("profile-selectInfringio");

  this.marioHead.addEventListener("click", (function () { return function (event) { that.selectCharacter(0); }; })());
  this.luigiHead.addEventListener("click", (function () { return function (event) { that.selectCharacter(1); }; })());
  this.infringioHead.addEventListener("click", (function () { return function (event) { that.selectCharacter(2); }; })());

  this.pendingChar = null;
};

/* Menus */

/* Settings Menu */
MenuAccount.prototype.showSettingsMenu = function() {
  if (!app.ingame()) {
    this.darkBackground.style.display = "";
  }
  this.settingsMenu.style.display = "";
};

MenuAccount.prototype.hideSettingsMenu = function() {
  this.darkBackground.style.display = "none";
  this.settingsMenu.style.display = "none";
};

MenuAccount.prototype.hidePrivateMenu = function() {
  document.getElementById("worlds").style.display = "none";
};

/* Play Menu */
MenuAccount.prototype.showPlayMenu = function() {
  this.hideProfileMenu();
  this.hidePasswordMenu();
  this.darkBackground.style.display = "";
  this.playMenu.style.display = "";

  var mode = Cookies.get("mode") === '1' ? 1 : 0;
  this.changeGamemode(mode);
};

MenuAccount.prototype.hidePlayMenu = function() {
  this.darkBackground.style.display = "none";
  this.playMenu.style.display = "none";
};

MenuAccount.prototype.changeGamemode = function(mode) {
  app.net.gm = mode;
  Cookies.set("mode", mode, {expires: 30});

  var that = this;
  switch(mode) {
    default:
    case 0 : { that.playVanilla.src = "img/home/vanilla-selected.png"; that.playPVP.src = "img/home/pvp.png"; break; }
    case 1 : { that.playVanilla.src = "img/home/vanilla.png"; that.playPVP.src = "img/home/pvp-selected.png"; break; }
  }
};

MenuAccount.prototype.launch = function(priv) {
  this.hidePlayMenu();
  app.join(app.net.nickname, app.net.squad, Boolean(priv), parseInt(app.net.gm));
  clearInterval(this.scienceInterval);
};

/* Change Password Menu */
MenuAccount.prototype.showPasswordMenu = function() {
  this.hideProfileMenu();
  this.hidePlayMenu();
  this.darkBackground.style.display = "";
  this.passwordMenu.style.display = "";
  this.passwordNew.value = "";
  this.passwordVerify.value = "";
  this.passwordError.innerText = "";
};

MenuAccount.prototype.hidePasswordMenu = function() {
  this.darkBackground.style.display = "none";
  this.passwordMenu.style.display = "none";
  this.passwordNew.value = "";
  this.passwordVerify.value = "";
  this.passwordError.innerText = "";
};

MenuAccount.prototype.savePassword = function() {
  var pass = this.passwordNew.value;
  var verify = this.passwordVerify.value;

  if (pass.length < 4) { this.passwordReport("Password is too short"); return; }
  if (pass != verify) { this.passwordReport("Passwords don't match"); return; }

  app.net.send({
    'type': 'lcp',
    'password': pass
  });
};

MenuAccount.prototype.passwordReport = function(msg) {
  this.passwordError.innerText = msg;
};

/* Profile Menu */
MenuAccount.prototype.showProfileMenu = function() {
  this.hidePasswordMenu();
  this.hidePlayMenu();
  this.darkBackground.style.display = "";
  this.profileMenu.style.display = "";
  this.profileUsername.innerText = app.net.username;
  this.profileNickname.value = app.net.nickname;
  switch (app.net.character) {
    default :
    case 0 : { this.marioHead.src = "img/home/marselect.png"; this.luigiHead.src = "img/home/luihead.png"; this.infringioHead.src = "img/home/infhead.png"; break; }
    case 1 : { this.marioHead.src = "img/home/marhead.png"; this.luigiHead.src = "img/home/luiselect.png"; this.infringioHead.src = "img/home/infhead.png"; break; }
    case 2 : { this.marioHead.src = "img/home/marhead.png"; this.luigiHead.src = "img/home/luihead.png"; this.infringioHead.src = "img/home/infselect.png"; break; }
  }
};

MenuAccount.prototype.hideProfileMenu = function() {
  this.darkBackground.style.display = "none";
  this.profileMenu.style.display = "none";
  this.profileError.innerText = "";
};

MenuAccount.prototype.profileReport = function(msg) {
  this.profileError.innerText = msg;
};

MenuAccount.prototype.selectCharacter = function(char) {
  switch (char) {
    default :
    case 0 : { this.marioHead.src = "img/home/marselect.png"; this.luigiHead.src = "img/home/luihead.png"; this.infringioHead.src = "img/home/infhead.png"; break; }
    case 1 : { this.marioHead.src = "img/home/marhead.png"; this.luigiHead.src = "img/home/luiselect.png"; this.infringioHead.src = "img/home/infhead.png"; break; }
    case 2 : { this.marioHead.src = "img/home/marhead.png"; this.luigiHead.src = "img/home/luihead.png"; this.infringioHead.src = "img/home/infselect.png"; break; }
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