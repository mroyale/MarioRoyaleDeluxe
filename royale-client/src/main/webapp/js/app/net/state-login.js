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
    var data = JSON.parse(p.msg);
    app.net.nickname = data.nickname;
    app.net.squad = data.squad;
    app.net.character = data.character;

    Cookies.set("session", data.session, {'expires': 14});
    
    var stats = {'wins': data.wins, 'deaths': data.deaths, 'kills': data.kills, 'coins': data.coins};
    app.menu.mainMember.show(stats);
  } else {
    Cookies.remove("session");
    app.menu.login.show();
    app.menu.login.reportError(p.msg);
  }
};

// LRG
StateLogin.prototype.handleRegister = function(p) {
  if (p.status) {
    var data = JSON.parse(p.msg);
    app.net.nickname = data.nickname;
    app.net.squad = data.squad;
    app.net.character = data.character;

    Cookies.set("session", data.session, {'expires': 14});
    
    var stats = {'wins': data.wins, 'deaths': data.deaths, 'kills': data.kills, 'coins': data.coins};
    app.menu.mainMember.show(stats);
  } else {
    Cookies.remove("session");
    app.menu.register.show();
    app.menu.register.reportError(p.msg);
  }
};

// LLO
StateLogin.prototype.handleLogout = function(p) {
  Cookies.remove("session");
  app.close();
};

// LPU
StateLogin.prototype.handleUpdate = function(p) {
  app.net.character = p.character;
};

StateLogin.prototype.send = function(data) {
  app.net.send(data);
};

StateLogin.prototype.type = function() {
  return "l";
};

StateLogin.prototype.destroy = function() {
  
};