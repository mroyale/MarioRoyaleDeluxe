"use strict";
/* global app */
/* global WebSocket */
/* global ArrayBuffer */

function Network() {
  this.pendingArgs = [];
};

Network.TYPES = {};
Network.TYPES.PLAY = 0;
Network.TYPES.LOGIN = 1;
Network.TYPES.REGISTER = 2;
Network.TYPES.GET_CAPTCHA = 3;
Network.TYPES.RESUME = 4;

/* Returns true if connected to websocket */
Network.prototype.connected = function () {
  return this.webSocket !== undefined && this.webSocket.readyState !== WebSocket.CLOSED;
};

/* Connects to game server websocket */
Network.prototype.connectWS = function() {
  var address = window.location.host;
  var that = this;

  if(this.connected()) {
    app.menu.error.show("Connection already open. State error.");
    return;
  }
  
  this.webSocket = new WebSocket(`${ window.location.protocol == "https:" ? "wss" : "ws" }://` + address + `${window.location.pathname}ws`);
  this.webSocket.binaryType = 'arraybuffer';
  
  this.webSocket.onopen = function(event) {
    if(event.type !== "open") {
      app.menu.error.show("Error. WS open event has unexpected result.");
      return;
    }
  };
  
  this.webSocket.onmessage = function(event) {
    if(event.data instanceof ArrayBuffer) { that.handleBinary(new Uint8Array(event.data)); }
    else { that.handlePacket(JSON.parse(event.data)); }
  };
  
  this.webSocket.onclose = function(event) {
    that.webSocket = undefined;
    app.menu.error.show("Connection Interrupted");
  };
}

/* 0: Connection Type, 1: Name/Session, 2: Squad/Password, 3: Private/Captcha, 4: Gamemode */
Network.prototype.connect = function(args) {
  var that = this;
  
  this.pendingArgs = [];
  if (!this.connected()) {
    this.pendingArgs = args;
    this.connectWS(args);
    return;
  }
  
  var type = args[0];
  switch(type) {
    case Network.TYPES.PLAY : {
      this.prefName = args[1];
      this.prefTeam = args[2];
      this.prefLobby = args[3];
      this.prefMode = args[4];

      this.send({type: "l00", name: this.prefName, team: this.prefTeam, priv: this.prefLobby, mode: this.prefMode});
      break;
    }

    case Network.TYPES.LOGIN : {
      this.username = args[1];
      this.send({'type': "llg", 'username': this.username, 'password': args[2]});
      break;
    }

    case Network.TYPES.REGISTER : {
      this.username = args[1];
      this.send({'type': "lrg", 'username': this.username, 'password': args[2], 'captcha': args[3]});
      break;
    }

    case Network.TYPES.GET_CAPTCHA : {
      this.send({"type": "lrc"});
      break;
    }

    case Network.TYPES.RESUME : {
      this.session = args[1];
      this.send({'type': "lrs", 'session': this.session});
      break;
    }
  }
};

Network.prototype.handlePacket = function(packet) {
  /* Allow state to handle packet. If state returns false then packet was not handled and forward it to general handling. */
  if(this.state !== undefined) {
    if(this.state.handlePacket(packet)) {
      return;
    }
  }
  switch(packet.type) {
    case "s00" : { this.setState(packet.state); break; }
    case "s01" : { this.handleBlob(packet.packets); break; }
    case "s02" : { break; } /* Keep alive packet */
    case "x00" : { app.menu.error.show("Server Exception", packet.message); break; }
    case "x01" : { app.menu.error.show("Server Exception", packet.message, packet.trace); break; }
    default : { app.menu.error.show("Recieved invalid packet type: " + packet.type, JSON.stringify(packet)); break; }
  }
};

Network.prototype.handleBinary = function(data) {
  this.state.handleBinary(data);
};

Network.prototype.handleBlob = function(packets) {
  for(var i=0;i<packets.length;i++) {
    this.handlePacket(packets[i]);
  }
};

/*  State Ids
    - l = login
    - g = game
 */
Network.prototype.setState = function(state) {
  if(this.state !== undefined) { this.state.destroy(); }
  switch(state) {
    case "l" : { this.state = new StateLogin(this.pendingArgs); break; }
    case "g" : { this.state = new StateGame(); break; }
    default : { app.menu.error.show("Received invalid state ID: " + state); return; }
  }
  this.state.ready();
};

/* Sends JSON packet */
Network.prototype.send = function(packet){
  this.webSocket.send(JSON.stringify(packet));
};

/* Sends raw bytes */
Network.prototype.sendBinary = function(/* Uint8Array */ data){
  this.webSocket.send(data.buffer);
};

/* This should never be called directly, only network.js should call this. Use main.close() instead. */
Network.prototype.close = function(){
  if(this.webSocket !== undefined) { this.webSocket.close(); }
  if(app.ingame()) { app.game.destroy(); }
};