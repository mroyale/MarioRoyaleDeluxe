"use strict";
/* global app */
/* global Cookies */

function MenuAccount() {
  this.element = document.getElementById("mainMember");
  this.linkElement = document.getElementById("link");
  this.linkMemberElement = document.getElementById("linkMember");
  this.winElement = document.getElementById("win");

  this.controlsBtn = document.getElementById("mainMember-controls");
  this.changelogBtn = document.getElementById("mainMember-changelog");
  this.settingsBtn = document.getElementById("mainMember-settings");

  this.playBtn = document.getElementById("mainMember-play");
  this.profileBtn = document.getElementById("mainMember-profile");
  this.leaderboardBtn = document.getElementById("mainMember-leaderboard");
  this.passwordBtn = document.getElementById("mainMember-password");
  this.logoutBtn = document.getElementById("mainMember-logout");

  this.settingsMenu = document.getElementById("settings");
  this.settingsCloseBtn = document.getElementById("settingsClose");

  this.controlsMenu = document.getElementById("controls");
  this.controlsCloseBtn = document.getElementById("controls-close");

  this.changelogMenu = document.getElementById("changelog");
  this.changelogCloseBtn = document.getElementById("changelog-close");

  this.playMenu = document.getElementById("playMember");
  this.playCloseBtn = document.getElementById("playMember-close");
  this.playGo = document.getElementById("playMember-go");
  this.playPriv = document.getElementById("playMember-priv");

  this.playVanilla = document.getElementById("playMember-royale");
  this.playPVP = document.getElementById("playMember-pvp");
  
  this.profileMenu = document.getElementById("profile");
  this.profileSaveBtn = document.getElementById("profile-save");
  this.profileCloseBtn = document.getElementById("profile-close");

  this.leaderboardMenu = document.getElementById("leaderboard");
  this.leaderboardCloseBtn = document.getElementById("leaderboard-close");

  this.leaderboardWins = document.getElementById("leaderboard-wins");
  this.leaderboardKills = document.getElementById("leaderboard-kills");
  this.leaderboardCoins = document.getElementById("leaderboard-coins");

  this.leaderboardWinsBtn = document.getElementById("leaderboard-winsBtn");
  this.leaderboardCoinsBtn = document.getElementById("leaderboard-coinsBtn");
  this.leaderboardKillsBtn = document.getElementById("leaderboard-killsBtn");
  
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
  this.controlsCloseBtn.onclick = function() { that.hideControlsMenu(); };
  this.changelogCloseBtn.onclick = function() { that.hideChangelogMenu(); };
  this.playCloseBtn.onclick = function() { that.hidePlayMenu(); };
  this.profileCloseBtn.onclick = function() { that.hideProfileMenu(); };
  this.passwordCloseBtn.onclick = function() { that.hidePasswordMenu(); };
  this.leaderboardCloseBtn.onclick = function() { that.hideLeaderboards(); };

  this.playGo.onclick = function() { that.launch(false); };
  this.playPriv.onclick = function() { that.launch(true); };
  this.profileSaveBtn.onclick = function() { that.saveProfile(); };
  this.passwordSaveBtn.onclick = function() { that.savePassword(); };

  this.playBtn.onclick = function() { that.showPlayMenu(); };
  this.controlsBtn.onclick = function() { that.showControlsMenu(); };
  this.changelogBtn.onclick = function() { that.showChangelogMenu(); };
  this.settingsBtn.onclick = function() { that.showSettingsMenu(); };
  this.profileBtn.onclick = function() { that.showProfileMenu(); };
  this.leaderboardBtn.onclick = function() { that.showLeaderboards(); };
  this.passwordBtn.onclick = function() { that.showPasswordMenu(); };
  this.logoutBtn.onclick = function() { app.net.send({'type': 'llo', 'session': Cookies.get("session")}); }

  this.profileUsername = document.getElementById("profile-username");
  this.profileNickname = document.getElementById("profile-nickname");
  this.profileError = document.getElementById("profile-error");

  this.marioHead = document.getElementById("profile-selectMario");
  this.luigiHead = document.getElementById("profile-selectLuigi");
  this.infringioHead = document.getElementById("profile-selectInfringio");
  this.warioHead = document.getElementById("profile-selectWario");

  this.marioHead.addEventListener("click", (function () { return function (event) { that.selectCharacter(0); }; })());
  this.luigiHead.addEventListener("click", (function () { return function (event) { that.selectCharacter(1); }; })());
  this.infringioHead.addEventListener("click", (function () { return function (event) { that.selectCharacter(2); }; })());
  this.warioHead.addEventListener("click", (function () { return function (event) { that.selectCharacter(3); }; })());

  this.pendingChar = null;

  var serverResponse = function(data) {
    var wins = data.wins;
    var coins = data.coins;
    var kills = data.kills;

    that.updateLeaderboards("wins", wins);
    that.updateLeaderboards("coins", coins);
    that.updateLeaderboards("kills", kills);

  };
  
  $.ajax({
    url: /royale/ + "leaderboards",
    type: 'GET',
    timeout: 3000,
    success: function(data) { serverResponse(data); },
  });
  

  that.setLeaderboard("wins");
};

/* Menus */

/* Controls Menu */
MenuAccount.prototype.showControlsMenu = function() {
  if (!app.ingame()) {
    this.darkBackground.style.display = "";
  }
  this.controlsMenu.style.display = "";
};

MenuAccount.prototype.hideControlsMenu = function() {
  this.darkBackground.style.display = "none";
  this.controlsMenu.style.display = "none";
};

/* Changelog Menu */
MenuAccount.prototype.showChangelogMenu = function() {
  this.darkBackground.style.display = "";
  this.changelogMenu.style.display = "";
};

MenuAccount.prototype.hideChangelogMenu = function() {
  this.darkBackground.style.display = "none";
  this.changelogMenu.style.display = "none";
};

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
  this.hideLeaderboards();
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
  clearInterval(this.scienceInterval);
  Cookies.set("priv", priv, {'expires': 14});
  app.join(app.net.nickname, app.net.squad, Cookies.get("priv") === 'true', parseInt(Cookies.get("mode")));
};

MenuAccount.prototype.quickLaunch = function() {
  clearInterval(this.scienceInterval);
  app.join(app.net.nickname, app.net.squad, Cookies.get("priv") === 'true', parseInt(Cookies.get("mode")));
};

/* Change Password Menu */
MenuAccount.prototype.showPasswordMenu = function() {
  this.hideProfileMenu();
  this.hidePlayMenu();
  this.hideLeaderboards();
  this.darkBackground.style.display = "";
  this.passwordMenu.style.display = "";
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

MenuAccount.prototype.hidePasswordMenu = function() {
  this.darkBackground.style.display = "none";
  this.passwordMenu.style.display = "none";
  this.passwordNew.value = "";
  this.passwordVerify.value = "";
  this.passwordError.innerText = "";
};

/* Leaderboards */
MenuAccount.prototype.showLeaderboards = function() {
  this.hideProfileMenu();
  this.hidePasswordMenu();
  this.hidePlayMenu();
  this.darkBackground.style.display = "";
  this.leaderboardMenu.style.display = "";
};

MenuAccount.prototype.setLeaderboard = function(type) {
  switch(type) {
    case "wins" : {
      this.leaderboardWins.style.display = "";
      this.leaderboardCoins.style.display = "none";
      this.leaderboardKills.style.display = "none";

      this.leaderboardWinsBtn.style.border = "2px solid";
      this.leaderboardCoinsBtn.style.border = "";
      this.leaderboardKillsBtn.style.border = "";
      break;
    }

    case "coins" : {
      this.leaderboardWins.style.display = "none";
      this.leaderboardCoins.style.display = "";
      this.leaderboardKills.style.display = "none";

      this.leaderboardWinsBtn.style.border = "";
      this.leaderboardCoinsBtn.style.border = "2px solid";
      this.leaderboardKillsBtn.style.border = "";
      break;
    }

    case "kills" : {
      this.leaderboardWins.style.display = "none";
      this.leaderboardCoins.style.display = "none";
      this.leaderboardKills.style.display = "";

      this.leaderboardWinsBtn.style.border = "";
      this.leaderboardCoinsBtn.style.border = "";
      this.leaderboardKillsBtn.style.border = "2px solid";
      break;
    }
  }
};

MenuAccount.prototype.updateLeaderboards = function(type, values) {
  var leaderboard = document.getElementById("leaderboard-" + type);
  leaderboard.innerHTML = "";

  var tab = document.createElement("table");
  tab.style.width = "100%";
  tab.style.textAlign = "center";
  tab.style.color = "white";

  var th = document.createElement("tr");
  th.innerHTML = "<th>#</th><th>name</th><th>"+type+"</th>";
  tab.appendChild(th);
  for (var player of values) {
    /* Position */
    var tr = document.createElement("tr");
    var td = document.createElement("td");
    td.innerText = "" + player.rank;
    switch(player.rank) {
      case 1 : { td.style.color = 'yellow'; break;}
      case 2 : { td.style.color = 'silver'; break;}
      case 3 : { td.style.color = '#CD7F32'; break;}
      default : { td.style.color = 'white'; break;}
    }
    tr.appendChild(td);

    /* Name */
    td = document.createElement("td");
    td.innerText = "" + player.nickname;
    td.style["padding-left"] = "10px";
    td.style["padding-right"] = "10px";
    switch(player.rank) {
      case 1 : { td.style.color = 'yellow'; break;}
      case 2 : { td.style.color = 'silver'; break;}
      case 3 : { td.style.color = '#CD7F32'; break;}
      default : { td.style.color = 'white'; break;}
    }
    tr.appendChild(td);

    /* Type */
    td = document.createElement("td");
    td.innerText = "" + player["count"];
    switch(player.rank) {
      case 1 : { td.style.color = 'yellow'; break;}
      case 2 : { td.style.color = 'silver'; break;}
      case 3 : { td.style.color = '#CD7F32'; break;}
      default : { td.style.color = 'white'; break;}
    }
    tr.appendChild(td);
    tab.appendChild(tr);
  }
  leaderboard.appendChild(tab);
};

MenuAccount.prototype.hideLeaderboards = function() {
  this.darkBackground.style.display = "none";
  this.leaderboardMenu.style.display = "none";
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
    case 0 : { this.marioHead.src = "img/home/marselect.png"; this.luigiHead.src = "img/home/luihead.png"; this.infringioHead.src = "img/home/infhead.png"; this.warioHead.src = "img/home/warhead.png"; break; }
    case 1 : { this.marioHead.src = "img/home/marhead.png"; this.luigiHead.src = "img/home/luiselect.png"; this.infringioHead.src = "img/home/infhead.png"; this.warioHead.src = "img/home/warhead.png"; break; }
    case 2 : { this.marioHead.src = "img/home/marhead.png"; this.luigiHead.src = "img/home/luihead.png"; this.infringioHead.src = "img/home/infselect.png"; this.warioHead.src = "img/home/warhead.png"; break; }
    case 3 : { this.marioHead.src = "img/home/marhead.png"; this.luigiHead.src = "img/home/luihead.png"; this.infringioHead.src = "img/home/infhead.png"; this.warioHead.src = "img/home/warselect.png"; break; }
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
    case 0 : { this.marioHead.src = "img/home/marselect.png"; this.luigiHead.src = "img/home/luihead.png"; this.infringioHead.src = "img/home/infhead.png"; this.warioHead.src = "img/home/warhead.png"; break; }
    case 1 : { this.marioHead.src = "img/home/marhead.png"; this.luigiHead.src = "img/home/luiselect.png"; this.infringioHead.src = "img/home/infhead.png"; this.warioHead.src = "img/home/warhead.png"; break; }
    case 2 : { this.marioHead.src = "img/home/marhead.png"; this.luigiHead.src = "img/home/luihead.png"; this.infringioHead.src = "img/home/infselect.png"; this.warioHead.src = "img/home/warhead.png"; break; }
    case 3 : { this.marioHead.src = "img/home/marhead.png"; this.luigiHead.src = "img/home/luihead.png"; this.infringioHead.src = "img/home/infhead.png"; this.warioHead.src = "img/home/warselect.png"; break; }
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
  this.linkMemberElement.style.display = "block";
  this.linkElement.style.display = "block";
  this.element.style.display = "block";
  if(app.goToLobby) { this.quickLaunch(); }
};

MenuAccount.prototype.hide = function() {
  if(this.padLoop) { clearTimeout(this.padLoop); }
  this.linkElement.style.display = "none";
  this.linkMemberElement.style.display = "none";
  this.element.style.display = "none";
};