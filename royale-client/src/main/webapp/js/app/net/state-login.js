"use strict";
/* global app */

function StateLogin() {
  
};

StateLogin.prototype.handlePacket = function(packet) {
  switch(packet.type) {
    case "l01" : { this.loggedIn(packet); return true; }
    case "llg" : { this.handleLogin(packet); return true; }
    case "lrs" : { this.handleLogin(packet); return true; }
    case "lrg" : { this.handleRegister(packet); return true; }
    case "llo" : { this.handleLogout(packet); return true; }
    case "lpu" : { this.handleUpdate(packet); return true; }
    case "lcp" : { this.handlePassword(packet); return true; }
    case "lsc" : { this.updateLeaderboards(packet); return true; }
    default : { return false; }
  }
};

StateLogin.prototype.handleBinary = function(packet) {
  app.menu.warn.show("Recieved unexpected binary data!");
};

StateLogin.prototype.ready = function() {
  app.net.connect(app.net.pendingArgs);
};

// L01
StateLogin.prototype.loggedIn = function(p) {
  app.net.name = p.name;
  app.net.sid = p.sid;
};

// LLG, LRS
StateLogin.prototype.handleLogin = function(p) {
  if (p.status) {
    app.menu.main.hideLoginMenu();

    var data = JSON.parse(p.msg);
    app.net.username = data.username;
    app.net.nickname = data.nickname;
    app.net.squad = data.squad;
    app.net.character = data.character;

    Cookies.set("session", data.session, {'expires': 14});
    
    var stats = {'wins': data.wins, 'deaths': data.deaths, 'kills': data.kills, 'coins': data.coins};
    app.menu.mainMember.show(stats);
    if(!app.goToLobby) { app.menu.mainMember.scienceInterval = setInterval(function() { app.net.send({'type': 'lsc'}); }, 5000); }
  } else {
    Cookies.remove("session");
    app.menu.main.show();
    app.menu.main.showLoginMenu();
    app.menu.main.loginError(p.msg);
  }
};

// LRG
StateLogin.prototype.handleRegister = function(p) {
  if (p.status) {
    app.menu.main.hideRegisterMenu();

    var data = JSON.parse(p.msg);
    app.net.username = data.username;
    app.net.nickname = data.nickname;
    app.net.squad = data.squad;
    app.net.character = data.character;

    Cookies.set("session", data.session, {'expires': 14});
    
    var stats = {'wins': data.wins, 'deaths': data.deaths, 'kills': data.kills, 'coins': data.coins};
    app.menu.mainMember.show(stats);
    app.menu.mainMember.scienceInterval = setInterval(function() { app.net.send({'type': 'lsc'}); }, 5000);
  } else {
    Cookies.remove("session");
    app.menu.main.show();
    app.menu.main.showRegisterMenu();
    app.menu.main.registerError(p.msg);
  }
};

// LLO
StateLogin.prototype.handleLogout = function(p) {
  Cookies.remove("session");
  app.close();
};

// LPU
StateLogin.prototype.handleUpdate = function(p) {
  if (p.error) {
    app.menu.mainMember.profileReport(p.error);
    return;
  }

  app.net.character = p.character;
  app.net.nickname = p.nickname;
  app.menu.mainMember.hideProfileMenu();
};

// LCP
StateLogin.prototype.handlePassword = function(p) {
  if (p.error) {
    app.menu.mainMember.profileReport(p.error);
    return;
  }

  app.menu.mainMember.hidePasswordMenu();
};

// LSC
StateLogin.prototype.updateLeaderboards = function(p) {
  var that = app.menu.mainMember;
  that.updateLeaderboards("wins", p.leaderboards.wins);
  that.updateLeaderboards("coins", p.leaderboards.coins);
  that.updateLeaderboards("kills", p.leaderboards.kills);
};

StateLogin.prototype.send = function(data) {
  app.net.send(data);
};

StateLogin.prototype.type = function() {
  return "l";
};

StateLogin.prototype.destroy = function() {
  
};