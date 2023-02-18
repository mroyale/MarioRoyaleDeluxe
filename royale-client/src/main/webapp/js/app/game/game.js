"use strict";
/* global app */
/* global util, shor2, vec2, td32, squar, MERGE_BYTE, Cookies */
/* global NETX, NET001, NET010, NET011, NET012, NET015 */
/* global Function, requestAnimFrameFunc, cancelAnimFrameFunc */
/* global Display, GameObject, PlayerObject, GoombaObject, PlatformObject, BusObject, FlagObject, TextObject */

// Air 30 00000000000000000000000000011110
// Block 98306 00000000000000011000000000000010

function Game(data) {
  this.container = document.getElementById("game");
  this.canvas = document.getElementById("game-canvas");

  data.resource.push({ "id": "mario", "src": "img/game/smb_mario.png" });  // Add the Mario spritesheet
  data.resource.push({ "id": "luigi", "src": "img/game/smb_luigi.png" });  // Add the Luigi spritesheet
  data.resource.push({ "id": "infringio", "src": "img/game/smb_infringio.png" });  // Add the Infringio spritesheet
  data.resource.push({ "id": "ui", "src": "img/game/smb_ui.png" });        // Add UI that we see at the top of the screen
  
  this.input = new Input(this, this.canvas);
  this.display = new Display(this, this.container, this.canvas, data.resource);
  this.audio = new Audio(this);

  this.objects = [];
  this.pid = undefined; /* Unique player id for this client. Assigned during init packet. */
  this.team = undefined; /* Team this player is set to */
  this.players = []; /* List of player names and associated pids */
  this.sounds = []; /* Array of currently playing global sounds */
  
  this.load(data);
  
  this.frame = 0;
  this.lastDraw = 0;
  this.delta = util.time.now();
  this.buffer = [[],[]];  // Frame Delay Lag Compensation Buffer. 3 Blank frames to start.
  
  this.out = []; // Outgoing packets.
  
  this.ready = false;
  this.startTimer = -1;          // If > 0 we draw a timer to the screen in display
  
  this.touchMode = false;        // True when we are using touch controls
  this.touchFull = false;        // When we go into touch mode we try to go fullscreen
  this.thumbId = undefined;
  this.thumbOrigin = undefined;
  this.thumbPos = undefined;
  this.touchRun = false;
  this.cullSS = undefined;       // Anti cheat value that's disguised.
  this.fillSS = undefined;
  
  this.disableText = parseInt(Cookies.get("text"))===1;      // Disables game space text rendering
  
  this.remain = 0;               // Number of players still alive
  this.gameMode = (data.mode === "pvp") ? 1 : 0;
  
  this.lives = this.gameMode ? 0 : 1; // Game over if you die in PVP
  this.coins = 0;

  this.coinsCollected = 0;
  this.kills = 0;

  this.announceMessage = "";
  this.announceTimer = -1;

  this.gameTimerStopped = null;
  this.gameTimerStopTime = 0;
  this.poleTimes = 0;
  
  this.victory = 0;
  this.victoryMusic = false;
  this.rate = 0x00;            // This is an anti cheat value that's disguised slightly.
  this.gameOverTimer = 0;
  this.gameOver = false;
  
  /* Set inital camera position */
  var dim = this.getZone().dimensions();
  this.display.camera.position(vec2.scale(dim, .5));
  this.cameraLockedX = false;    // Don't update camera X position if this is true
  this.cameraLockedY = false;    // Don't update camera Y position if this is true
  
  /* Level Warp */
  this.levelWarpTimer = 0;      // How long to show level name/lives screen.
  this.levelWarpId = undefined; // Level to warp too
  
  var that = this;
  this.frameReq = requestAnimFrameFunc.call(window, function() { that.draw(); }); // Javascript 🙄
  this.loopReq = setTimeout(function( ){ that.loop(); }, 2);

  document.getElementById("wrldbtn").addEventListener("click", (function () { return function (event) { that.changePrivMenu("world"); }; })());
  document.getElementById("debgbtn").addEventListener("click", (function () { return function (event) { that.changePrivMenu("debug"); }; })());
};

Game.TICK_RATE = 1000/60;
Game.FDLC_TARGET = 3;
Game.FDLC_MAX = Game.FDLC_TARGET+2;

Game.LEVEL_WARP_TIME = 240;
Game.GAME_OVER_TIME = 360;

Game.COINS_TO_LIFE = 30;

Game.prototype.changePrivMenu = function(tab) {
  var wrldbtn = document.getElementById("wrldbtn");
  var debgbtn = document.getElementById("debgbtn");

  var world = document.getElementById("wrld");
  var debug = document.getElementById("debg");

  switch (tab) {
    case "world" : {
      wrldbtn.style["border"] = "2px solid white";
      debgbtn.style["border"] = "";

      world.style.display = "";
      debug.style.display = "none";
      break;
    }

    case "debug" : {
      wrldbtn.style["border"] = "";
      debgbtn.style["border"] = "2px solid white";

      world.style.display = "none";
      debug.style.display = "";
      break;
    }
  }
};

Game.prototype.getDebug = function(type) {
  if (!(app.net.prefLobby) || !(this.debugSettings)) return null;
  
  var out;
  switch(type) {
    case "level" : {
      if (!(this.debugSettings.initialLevel)) { break; }
      out = parseInt(this.debugSettings.initialLevel);
      break;
    }

    case "zone" : {
      if (!(this.debugSettings.initialZone)) { break; }
      out = parseInt(this.debugSettings.initialZone);
      break;
    }

    case "lives" : {
      if (!(this.debugSettings.infiniteLives)) { break; }
      out = this.debugSettings.infiniteLives;
      break;
    }

    case "god" : {
      if (!(this.debugSettings.godMode)) { break; }
      out = this.debugSettings.godMode;
      break;
    }
  }

  return out;
};

Game.prototype.load = function(data) {
  app.menu.load.show();

  if (this instanceof Lobby && app.net.prefLobby) { document.getElementById("worlds").style.display = ""; }
  else if (app.net.prefLobby) {
    document.getElementById("worlds").style.display = "none";

    var infLives = document.getElementById("infLives");
    var godMode = document.getElementById("godMode");
    var levelID = document.getElementById("levelID");
    var zoneID = document.getElementById("zoneID");

    this.debugSettings = {
      'infiniteLives': infLives.checked,
      'godMode': godMode.checked,
      'initialLevel': levelID.value || null,
      'initialZone': zoneID.value || null
    }
  }
  if (!(this instanceof Lobby) && app) {
    app.menu.main.menuMusic.pause();
  }
  
  /* Load world data */
  this.world = new World(this, data);

  var musicList = [];

  /* Collect music used in this world */
  this.world.levels.forEach(lvl => lvl.zones.forEach(zn => {
    if (zn.music) {
      musicList.push(zn.music);
      musicList.push(zn.music ? zn.music.replace(".mp3", "_fast.mp3") : "");
    }

    /* @TODO: There is definitely a better way of doing this, but the function is run only once so it should be OK */
    zn.mainLayer.data.forEach(row => row.forEach(tile => {
      if (tile[3] === 239 /* Music Block */) { if (tile[4] /* Extra Data */) {
        musicList.push(tile[4]);
        musicList.push(tile[4] ? tile[4].replace(".mp3", "_fast.mp3") : "");
      }
    }
    }));
  }));

  /* Remove duplicates */
  musicList = musicList.filter((item, index) => musicList.indexOf(item) === index);
  
  var isLink = function(string) {
    let url;
    
    try { url = new URL(string); }
    catch { return false; }

    return url.protocol === "http:" || url.protocol === "https:"
  };
  
  var filterByTileset = function(dict, tileset) {
    return Object.keys(dict).filter(x => dict[x].tilesets.length == 0 || dict[x].tilesets.includes(tileset))
        .reduce((res, key) => (res[key] = dict[key], res), {});
  };

  var reloadAudio;
  
  if (data.musicOverridePath && data.musicOverridePath !== "undefined") {
    this.audio.setMusicPrefix(data.musicOverridePath);
  }

  if (data.soundOverridePath && data.soundOverridePath !== "undefined") {
    this.audio.setSoundPrefix(data.soundOverridePath);
  }

  if (data.assets) {
    var link = isLink(data.assets);
    $.getJSON(link ? data.assets : /royale/ + 'assets/' + data.assets, function(dat) {
        if (dat.tileAnim) {
          TILE_ANIMATION = []
          TILE_ANIMATION_FILTERED = [];

          for (var anim of dat.tileAnim) {
            var obj = {};
            obj.tiles = anim.tiles;
            obj.delay = anim.delay;
            obj.tilesets = anim.tilesets || [];
            TILE_ANIMATION[anim.startTile] = obj;
          }

          TILE_ANIMATION_FILTERED = filterByTileset(TILE_ANIMATION, data.resource.filter(x => x.id == "map")[0].src);
        }
    });
  }


  TILE_ANIMATION_FILTERED = filterByTileset(TILE_ANIMATION, data.resource.filter(x => x.id == "map")[0].src);

  this.audio.initWebAudio(musicList);
  
  /* Spawn objects from world obj params */
  for(var i=0;i<this.world.levels.length;i++) {
    var lvl = this.world.levels[i];
    for(var j=0;j<lvl.zones.length;j++) {
      var zn = lvl.zones[j];
      for(var k=0;k<zn.obj.length;k++) {
        var obj = zn.obj[k];
        var oid = obj.pos;
        var pgen = [obj.pos]; // obj.pos here is a shor2, we use it as the oid for this object
        for(var l=0;l<obj.param.length;l++) { pgen.push(obj.param[l]); }
        if (zn.maxOid === undefined || oid > zn.maxOid) zn.maxOid = oid;
        this.createObject(obj.type, lvl.id, zn.id, shor2.decode(obj.pos), pgen);
      }
    }
  }

  /* Download backgrounds */
  for (var i=0;i<this.world.levels.length;i++) {
    var lvl = this.world.levels[i];
    for(var j=0;j<lvl.zones.length;j++) {
      var zn = lvl.zones[j];
      if (zn.background) {
        for (var k=0;k<zn.background.length;k++) {
          var layer = zn.background[k];
          var ext = layer.url.split(".").pop().toLowerCase();

          switch(ext) {
            case "png" : { this.display.resource.loadTexture({ 'id': 'bg' + layer.z + lvl.id + zn.id, 'src': layer.url }); break; }
            case "gif" : { this.display.resource.loadAnimatedTexture({ 'id': 'bg' + layer.z + lvl.id + zn.id, 'src': layer.url }); break; }
            default : { app.menu.warn.show("Failed to load resource with unknown extension: " + ext); break; }
          }
        }
      }
    }
  }
};

Game.prototype.getGameTimer = function (compact) {
  if (this.gameTimerStopped !== null) return this.gameTimerStopped;
  if (this.startDelta === undefined) return compact ? "00:00" : "00:00:000";
  var now = util.time.now() - this.poleTimes; // get the time now minus the poleTimes
  var diff = now - this.startDelta; // diff in seconds between now and start
  var m = Math.floor(diff / 60000); // get minutes value
  var s = Math.floor(diff / 1000) % 60; // get seconds value
  var ms = diff % 1000; // get milliseconds value
  if (m < 10) m = "0" + m; // add a leading zero if it's single digit
  if (s < 10) s = "0" + s; // add a leading zero if it's single digit
  if (ms < 10) ms = "00" + ms; // add two leadings zeros if it's single digit
  else if (ms < 100) ms = "0" + ms; // add a leading zero if it's double digit
  return m + ":" + s + (compact ? '' : (":" + ms));
};

Game.prototype.resumeGameTimer = function () {
  if (this.gameTimerStopped === null) return;
  this.gameTimerStopped = null;
  this.poleTimes += util.time.now() - this.gameTimerStopTime;
};

Game.prototype.stopGameTimer = function (touchMode = false) {
  if (this.gameTimerStopped !== null) return;
  this.gameTimerStopped = this.getGameTimer(app.compactMode ? app.compactMode : touchMode);
  this.gameTimerStopTime = util.time.now();
};

/* Immiedately sends a json packet */
Game.prototype.send = function(packet) {
  app.net.send(packet);
};

/* Returns false if the packet is not of a type that we know how to handle */
Game.prototype.handlePacket = function(packet) {
  /* Parse packet and apply */
  switch(packet.type) {
    /* Ingame Type Packets gxx */
    case "g12" : { this.updatePlayerList(packet); return true; }
    case "g13" : { this.gameStartTimer(packet); return true; }
    case "gwn" : { this.out.push(NET018.encode()); return true; }
    /* Input Type Packets ixx */
    default : { return false; }
  }
};

/* G12 */
Game.prototype.updatePlayerList = function(packet) {
  this.players = packet.players;
  if(this.pid === undefined) { return; }
  
  this.updateTeam();
};

/* G13 */
Game.prototype.gameStartTimer = function(packet) {
  if(this.startTimer < 0 && !app.settings.soundMuted) {
    var snd = document.createElement("audio");
    snd.src = "audio/" + this.audio.soundPrefix + "/alert.mp3";
    snd.volume = Audio.EFFECT_VOLUME;
    snd.play();
  }
  if(packet.time > 0) { this.startTimer = packet.time; this.remain = this.players.length; }
  else { this.doStart(); }
};

/* Checks all players for team */
Game.prototype.updateTeam = function() {
  for(var i=0;i<this.players.length;i++) {
    var ply = this.players[i];
    if(ply.id !== this.pid) {
      var obj = this.getGhost(ply.id);
      if(obj) { obj.name = ply.name; }
    }
  }
};

Game.prototype.handleBinary = function(data) {
  var de = NETX.decode(data);
  
  if(!this.ready) { this.doUpdate(de); return; }  
  this.updatePacket(de);
};

Game.prototype.updatePacket = function(data) { 
  this.buffer.push(data);
  while(this.buffer.length > Game.FDLC_MAX) {
    var d = this.buffer.shift();
    this.doUpdate(d);
  }
};

Game.prototype.doUpdate = function(data) {  
  for(var i=0;i<data.length;i++) {
    var n = data[i];
    switch(n.designation) {
      case 0x02 : { this.doNET001(n); break; }
      case 0x10 : { this.doNET010(n); break; }
      case 0x11 : { this.doNET011(n); break; }
      case 0x12 : { this.doNET012(n); break; }
      case 0x13 : { this.doNET013(n); break; }
      case 0x17 : { this.doNET017(n); break; }
      case 0x18 : { this.doNET018(n); break; }
      case 0x20 : { this.doNET020(n); break; }
      case 0x30 : { this.doNET030(n); break; }
    }
  }
};

/* ASSIGN_PID [0x01] */
Game.prototype.doNET001 = function(n) {
  this.pid = n.pid;
  this.ready = true;
  app.menu.game.show();
};

/* CREATE_PLAYER_OBJECT [0x10] */
Game.prototype.doNET010 = function(n) {
  if(n.pid === this.pid) { return; }
  var obj = this.createObject(PlayerObject.ID, n.level, n.zone, shor2.decode(n.pos), [n.pid, n.character]);
  obj.setState(PlayerObject.SNAME.GHOST);
  
  /* Check if we need to apply a team name to this new infringio */
  var ply = this.getPlayerInfo(n.pid);
  if(ply && ply.id !== this.pid) {
    var obj = this.getGhost(ply.id);
    if(obj) { obj.name = ply.name; }
  }
};

/* KILL_PLAYER_OBJECT [0x11] */
Game.prototype.doNET011 = function(n) {
  if(n.pid === this.pid) { return; }
  var obj = this.getGhost(n.pid);
  if(obj) { obj.kill(); }
  this.remain = this.getRemain();
};

/* UPDATE_PLAYER_OBJECT [0x12] */
Game.prototype.doNET012 = function(n) {
  if(n.pid === this.pid) { return; }
  var obj = this.getGhost(n.pid);
  if(!obj) { return; }
 
  obj.update(n);
};

/* PLAYER_OBJECT_EVENT [0x13] */
Game.prototype.doNET013 = function(n) {
  if(n.pid === this.pid) { return; }
  var obj = this.getGhost(n.pid);
  obj.trigger(n.type);
};

/* PLAYER_KILL_EVENT [0x17] */
Game.prototype.doNET017 = function(n) {
  this.kills += 1;
};

/* PLAYER_RESULT_REQUEST [0x18] */
Game.prototype.doNET018 = function(n) {
  if(n.result <= 0x00) { return; }
  if(n.pid === this.pid) { this.rate = n.extra; }
  else if(this.rate !== 0x00) { n.result++; }
  
  var obj = this.getGhost(n.pid);
  if(obj) { 
    var txt = this.getText(obj.level, obj.zone, n.result.toString());
    if(txt) {
      var nam = this.getPlayerInfo(n.pid).name; /* @TODO: unsafe, may return null rarely */
      this.createObject(TextObject.ID, txt.level, txt.zone, vec2.add(txt.pos, vec2.make(0, -3)), [undefined, -0.1, 0.25, "#FFFFFF", nam]);
    }
  }
  
  if(n.pid !== this.pid) { return; }
  var ply = this.getPlayer();
  if(ply) { ply.axe(n.result); }
  this.victory = n.result;
  this.stopGameTimer();
  setTimeout(function () {
    document.getElementById('return').style.display = "block";    // Show 'return to main' and 'return to lobby'
  }, 3000);
};

/* OBJECT_EVENT_TRIGGER [0x20] */
Game.prototype.doNET020 = function(n) {
  if(n.pid === this.pid && n.type < 0xA0) { return; }                  // Don't repeat events that we reported, unless they fall into the 'explicit sync' category.
  var obj = this.getObject(n.level, n.zone, n.oid);
  if(obj) {
    obj.update(n.type);
  }
};

/* TILE_EVENT_TRIGGER [0x30] */
Game.prototype.doNET030 = function(n) {
  if(n.pid === this.pid) { return; } // Toss out event if we were the ones who created it originally
  this.world.getZone(n.level, n.zone).update(this, n.pid, n.level, n.zone, n.pos.x, n.pos.y, n.type);
};

/* Starts the game */
Game.prototype.doStart = function() {
  this.startTimer = -1;
  this.startDelta = util.time.now();
  this.doSpawn();
};

/* Determine input method then process */
Game.prototype.doDetermine = function() {
  var imp = this.input.pop(); // Pops Impulse inputs for this frame
  
  if(imp.touch.length > 0) { this.touchMode = true; }
  else if(imp.keyboard.length > 0) { this.touchMode = false; }
  
  if(!this.touchMode) { this.doInput(imp); }
  else { this.doTouch(imp); }
};

/* Handle player input on touch screens */
Game.prototype.doTouch = function(imp) {
  var inp = this.input;
  var ply = this.getPlayer();
  //this.display.camera.scale = 2.; /* Phones need a smaller draw size to fit stuff in */
  
  /* Attempt to go full screen */
  if(!this.touchFull) {
    var body = document.documentElement;
    if (body.requestFullscreen) {
      this.container.requestFullscreen();
    } else if (body.mozRequestFullScreen) { /* Firefox */
      body.mozRequestFullScreen();
    } else if (body.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
      body.webkitRequestFullscreen();
    } else if (body.msRequestFullscreen) { /* IE/Edge */
      body.msRequestFullscreen();
    }
    this.touchFull = true;
  }
  
  var tmp = this;
  var W = this.display.canvas.width;
  var H = this.display.canvas.height;
  var S = 85;
  var a = false;
  var b = false;
  var btns = [
    {pos: vec2.make(W-S, H-S), dim: vec2.make(S, S), press: function() { a = true; }},
    {pos: vec2.make(W-S, H-(S*2)), dim: vec2.make(S, S), press: function() { b = true; }},
    {pos: vec2.make(W-S, H-(S*3)), dim: vec2.make(S, S), click: function() { tmp.touchRun = !tmp.touchRun; }},
    {pos: vec2.make(W-48, 40), dim: vec2.make(36, 36), click: function() { tmp.audio.muteMusic = !tmp.audio.muteMusic; tmp.audio.saveSettings(); }},
    {pos: vec2.make(W-92, 40), dim: vec2.make(36, 36), click: function() { tmp.audio.muteSound = !tmp.audio.muteSound; tmp.audio.saveSettings(); }},
    {pos: vec2.make(W-136, 40), dim: vec2.make(36, 36), click: function() { tmp.disableText = !tmp.disableText; Cookies.set("text", tmp.disableText?1:0, {expires: 30}); }},
    {pos: vec2.make(W-180, 40), dim: vec2.make(36, 36), click: function() { var stg = document.getElementById("settings"); stg.style.display = (stg.style.display === "" ? "none": ""); }}
  ];
  
  /* Check to see if we touched any of the on screen buttons */
  /* Any touches that hit a button are removed, otherwise they pass through to thumbstick test */
  /* If we have a thumbstick the thumb touch is picked out */
  var thmb;
  for(var i=0;i<inp.touch.pos.length;i++) {
    var tch = inp.touch.pos[i];
    if(this.thumbId === tch.id) {
      thmb = tch;
      this.thumbId = tch.id;
      this.thumbPos = tch;
    }
    else {
      for(var i=0;i<btns.length;i++) {
        var btn = btns[i];
        if(squar.inside(tch, btn.pos, btn.dim) && btn.press) { btn.press(); }
      }
    }
  }
  
  for(var i=0;i<imp.touch.length;i++) {
    var tch = imp.touch[i];
    var hit = false;
    for(var i=0;i<btns.length;i++) {
      var btn = btns[i];
      if(squar.inside(tch, btn.pos, btn.dim)) { hit = true; if(btn.click) { btn.click(); } break; }
    }
    if(!thmb && !hit) {
      thmb = tch;
      this.thumbId = tch.id;
      this.thumbOrigin = tch;
      this.thumbPos = tch;
    }
  }
  
  var lim;
  if(!thmb) { this.thumbId = undefined; this.thumbOrigin = undefined; this.thumbPos = undefined; }
  else {
    var dist = Math.min(64., vec2.distance(this.thumbPos, this.thumbOrigin));
    var dir = vec2.normalize(vec2.subtract(this.thumbPos, this.thumbOrigin));
    lim = vec2.scale(dir, dist/64);
    this.thumbPos = vec2.add(this.thumbOrigin, vec2.scale(dir, dist));
  }
  
  if(ply && dir) {
    var mov = [0,0];
    if(lim.x > 0.33) { mov[0]++; }
    if(lim.x < -0.33) { mov[0]--; }
    if(lim.y > 0.33) { mov[1]--; }
    if(lim.y < -0.33) { mov[1]++; }

    ply.input(mov, a, this.touchRun?!b:b, mov[1]);
  }
  else if(ply) { ply.input([0,0], a, this.touchRun?!b:b, false); }
};

/* Handle player input on mouse/keyboard/controller */
Game.prototype.doInput = function(imp) {
  this.input.pad.update();
  
  var inp = this.input;
  var mous = this.input.mouse;
  var keys = this.input.keyboard.keys;
  var pad = this.input.pad;
  
  if(!this.inx27 && keys[27]) { app.menu.main.settingsMenu.style.display = (app.menu.main.settingsMenu.style.display === "" ? "none" : ""); } this.inx27 = keys[27]; // ESC
  
  /* @TODO: Hacky last second additions */
  /* Check if client has clicked on the button to mute sound */
  var tmp = this;
  var W = this.display.canvas.width;
  var btns = [
    {pos: vec2.make(W-48, 40), dim: vec2.make(36, 36), click: function() { tmp.audio.muteMusic = !tmp.audio.muteMusic; tmp.audio.saveSettings(); }},
    {pos: vec2.make(W-92, 40), dim: vec2.make(36, 36), click: function() { tmp.audio.muteSound = !tmp.audio.muteSound; tmp.audio.saveSettings(); }},
    {pos: vec2.make(W-136, 40), dim: vec2.make(36, 36), click: function() { tmp.disableText = !tmp.disableText; Cookies.set("text", tmp.disableText?1:0, {expires: 30}); }},
    {pos: vec2.make(W-180, 40), dim: vec2.make(36, 36), click: function() { var stg = document.getElementById("settings"); stg.style.display = (stg.style.display === "" ? "none": ""); }}
  ];
  for(var i=0;i<imp.mouse.length;i++) {
    var m = imp.mouse[i];
    for(var j=0;j<btns.length;j++) {
      var b = btns[j];
      if(m.btn === 0 && squar.inside(m.pos, b.pos, b.dim)) { b.click(); }
    }
  }
  
  var obj = this.getPlayer();
  if(!obj) { return; }

  var dir = [0,0];
  if(keys[inp.assignK.up] || pad.button(inp.assignG.up) || pad.ax.y < -.1) { dir[1]++; }
  if(keys[inp.assignK.down] || pad.button(inp.assignG.down) || pad.ax.y > .1) { dir[1]--; }
  if(keys[inp.assignK.left] || pad.button(inp.assignG.left) || pad.ax.x < -.1) { dir[0]--; }
  if(keys[inp.assignK.right] || pad.button(inp.assignG.right) || pad.ax.x > .1) { dir[0]++; }
  var a = keys[inp.assignK.a] || pad.button(inp.assignG.a);
  var b = keys[inp.assignK.b] || pad.button(inp.assignG.b);
  var u = keys[inp.assignK.up] || pad.button(inp.assignG.up);
  
  if(mous.spin && this.getZone().camera === 2 /* Free-Roam only */) { this.display.camera.zoom(mous.spin); } // Mouse wheel -> Camera zoom
  
  obj.input(dir, a, b, u);
  
};

/* Step game world */
Game.prototype.doStep = function() {
  var ply = this.getPlayer(); // Our player object
  
  /* Level Warp */
  if(ply && this.levelWarpId !== undefined && this.levelWarpTimer > 0) {
    if(--this.levelWarpTimer < 1) {
      var z = this.world.getLevel(this.levelWarpId).getInitial();
      ply.level = z.level;
      ply.zone = z.id;
      ply.pos = shor2.decode(z.initial);
      ply.autoTarget = undefined;
      ply.grounded = false;
      ply.show();
      ply.invuln();
      this.levelWarpId = undefined;
      this.cameraLockedX = false;
      this.cameraLockedY = false;
      ply.moveSpeed = 0;
      ply.fallSpeed = 0;
    }
  }
  
  /* Anti cheat check */
  if(ply && this.cullSS && !vec2.equals(ply.pos, this.cullSS)) { this.out.push(NET015.encode()); }
  if(ply && this.fillSS && this.fillSS !== ply.fallSpeed) { this.out.push(NET015.encode()); }
  
  /* Step & delete garbage */
  for(var i=0;i<this.objects.length;i++) {
    var obj = this.objects[i];
    if (obj instanceof HammerObject || obj instanceof HammerProj || obj instanceof FireHammerObject) {
      if (this.frame % 2 === 0) { obj.step(); }
    } else { obj.step(); }
    if(obj.garbage) { this.objects.splice(i--, 1); }
  }
  
  this.cullSS = ply?vec2.copy(ply.pos):undefined;
  this.fillSS = ply?ply.fallSpeed:undefined;
  
  /* Update Camera Position */
  var zone = this.getZone();
  if(ply && !ply.dead) {
    switch (zone.camera) {
      case 0 : { if(!this.cameraLockedX) { this.display.camera.position(vec2.make(Math.max(13.8, ply.pos.x), zone.dimensions().y * .5)); } break; } // Horizontal Scrolling
      case 1 : { this.display.camera.positionX(zone.dimensions().x*.5); if(!this.cameraLockedY) { this.display.camera.positionY(Math.min(zone.dimensions().y-7, -ply.pos.y + zone.dimensions().y)); } break; } // Vertical Scrolling (horizontal is always centered)
      case 2 : {
        if(!this.cameraLockedX) {
          this.display.camera.positionX(Math.max(13.8, ply.pos.x));
        }
        if(!this.cameraLockedY) {
          this.display.camera.positionY(Math.min(zone.dimensions().y-7, -ply.pos.y + zone.dimensions().y));
        }
        break;
      } // Free Roam (horizontal and vertical)
    }
  }
  
  /* Step world to update bumps & effects & etc */
  this.world.step();
  
  /* Step audio class and objects */
  for(var i=0;i<this.sounds.length;i++) {
    var snd = this.sounds[i];
    if(snd.done()) { this.sounds.splice(i--, 1); }
  }
  this.doMusic();
  this.audio.update();
  
  if (ply && this.getRemain() === 1 && this.gameMode && !ply.dead && this.victory === 0 && this.frame > 60 && this instanceof Game) {
    this.out.push(NET018.encode());
  }

  /* Triggers game over if player is dead for 45 frames and has zero lives. If we have a life we respawn instead. */
  if(this.startDelta !== undefined && !this.gameOver && !ply) {
    if((this.lives > 0 || this.getDebug("lives")) && this.victory <= 0) {
      var rsp = this.getZone().level;
      this.doSpawn(); 
      this.levelWarp(rsp);
      if (this.getDebug("lives")) {
        this.lives -= 0;
      } else { this.lives--; }

      if (zone.musicBlock) { zone.musicBlock = null; } }
    else if(++this.gameOverTimer > 45) { this.gameOver = true; this.gameOverTimer = 0; }
  }
  /* Triggers page refresh after 5 seconds of a game over. */
  else if(this.gameOver) { if(++this.gameOverTimer > Game.GAME_OVER_TIME) { Cookies.set("go_to_lobby", "1"); app.close(); } }
  else { this.gameOverTimer = 0; }
  
  this.lastDraw = this.frame;
  this.frame++;
};

/* Create a player object for this client to control */
Game.prototype.doSpawn = function() {
  var ply = this.getPlayer();
  
  if(!ply) {
    var zon = this.world.getZone(this.getDebug("level"), this.getDebug("zone")) || this.getZone();
    var pos;
    
    if (zon.spawnpoint.length > 0 && this.gameMode === 1 /* PVP exclusive */) {
      var spn = zon.spawnpoint;
      pos = spn[parseInt(Math.random() * spn.length)].pos;
    } else { pos = zon.initial; /* shor2 */ }

    var obj = this.createObject(PlayerObject.ID, this.getDebug("level") || zon.level, zon.id, shor2.decode(pos), [this.pid, app.net.character]);
    this.out.push(NET010.encode(this.getDebug("level") || zon.level, zon, pos, app.net.character));

    this.display.camera.positionX(shor2.decode(pos).x);

    if (this.gameMode && this instanceof Game) {
      obj.transform(2);
      obj.rate = 0x71;
    }
  }
  
  this.updateTeam();
};

/* Looks at game state and decides what music we should be playing */
/* @TODO: might be better to handle this with events instaed? */
Game.prototype.doMusic = function() {
  var ply = this.getPlayer();
  var zon = this.getZone();
  if(this.gameOver) { this.audio.setMusic("gameover.mp3", false); return; }
  if(ply && ply.dead) { this.audio.setMusic("dead.mp3", false); return; }
  if(ply && ply.autoTarget && this.victory <= 0) { this.audio.setMusic("level.mp3", false); return; }
  if(this.victory > 0 && !this.victoryMusic) { this.audio.setMusic("castlewin.mp3", false); this.victoryMusic = true; return; }
  if(this.victory > 0 && this.victory < 4 && this.victoryMusic && !this.audio.music.playing) { this.audio.setMusic("victory.mp3", false); return; }
  if(ply && this.levelWarpTimer <= 0 && this.startDelta !== undefined && !this.victoryMusic) {
    if(zon.music !== "" || zon.musicBlock !== null) { this.audio.setMusic(zon.musicBlock?zon.musicBlock:zon.music, true); }
    else { this.audio.stopMusic(); }
    return;
  }
};

/* Push players state to the server */
Game.prototype.doPush = function() {
  var obj = this.getPlayer(); // Our player object
  if(obj && !obj.dead) {
    this.out.push(NET012.encode(obj.level, obj.zone, obj.pos, obj.sprite.ID, obj.reverse, obj.character));
  }
  
  var merge = MERGE_BYTE(this.out); // Merge all binary messages into a single Uint8Array
  this.out = [];
  
  app.net.sendBinary(merge);
};

Game.prototype.createObject = function(id, level, zone, pos, param) {
  var pgen = [undefined, this, level, zone, pos];
  id = parseInt(id)
  for(var i=0;i<param.length;i++) { pgen.push(param[i]); }
  
  var type = GameObject.OBJECT(id);
  if(!type) { type = GoombaObject; }
  var obj = new (Function.prototype.bind.apply(GameObject.OBJECT(id), pgen));
  
  this.objects.push(obj);
  return obj;
};

Game.prototype.getObject = function(level, zone, oid) {
  for(var i=0;i<this.objects.length;i++) {
    var obj = this.objects[i];
    if(obj.oid !== undefined && obj.level === level && obj.zone === zone && obj.oid === oid) {
      return obj;
    }
  }
};

/* Returns first flag object found in the specific zone. Or undefined. */
Game.prototype.getFlag = function(level, zone) {
  for(var i=0;i<this.objects.length;i++) {
    var obj = this.objects[i];
    if(obj.level === level && obj.zone === zone && obj instanceof FlagObject) {
      return obj;
    }
  }
};

/* Returns first textobject in the given zone with the given text */
Game.prototype.getText = function(level, zone, text) {
  for(var i=0;i<this.objects.length;i++) {
    var obj = this.objects[i];
    if(obj && obj.level === level && obj.zone === zone && obj instanceof TextObject && obj.text === text.toString()) { return obj; }
  }
};

/* Returns all platform type objects. */
Game.prototype.getPlatforms = function() {
  var zon = this.getZone();
  
  var plts = [];
  for(var i=0;i<this.objects.length;i++) {
    var obj = this.objects[i];
    if((obj instanceof PlatformObject || obj instanceof BusObject) && obj.level === zon.level && obj.zone === zon.id) {
      plts.push(obj);
    }
  }
  
  return plts;
};

Game.prototype.getGhost = function(pid) {
  for(var i=0;i<this.objects.length;i++) {
    var p = this.objects[i];
    if(p.pid !== undefined && p.pid === pid) {
      return p;
    }
  }
};

/* Returns the player object that this client controls. Or undefined if one doesnt exist. */
Game.prototype.getPlayer = function() {
  for(var i=0;i<this.objects.length;i++) {
    var obj = this.objects[i];
    if(obj.pid !== undefined && obj.pid === this.pid) {
      return obj;
    }
  }
};

/* Returns the zone our character is in, or the last one we were in when we died, or the starting point. */
Game.prototype.getZone = function() {
  /* Where are character is */
  var player = this.getPlayer();
  if(player) { this.lastZone = this.world.getZone(player.level, player.zone); return this.lastZone; }
  
  /* Last valid location */
  if(this.lastZone) { return this.lastZone; }
  
  /* Starting location */
  return this.world.getInitialZone();
};

/* Return player info by given pid */
Game.prototype.getPlayerInfo = function(pid) {
  for(var i=0;i<this.players.length;i++) {
    var ply = this.players[i];
    if(ply.id === pid) { return ply; }
  }
};

/* Get number of players who are still alive */
Game.prototype.getRemain = function() {
  var rm = 0;
  for(var i=0;i<this.players.length;i++) {
    var ply = this.players[i];
    var obj = this.getGhost(ply.id);
    if(obj && !obj.dead) { rm++; }
  }
  return rm;
};

/* Plays sound effect as non spatial */
Game.prototype.play = function(path,gain,shift) {
  var sfx = this.audio.getAudio(path, gain, shift, "effect");
  sfx.play();
  this.sounds.push(sfx);
};

/* Shows lives/level name screen then warps player to start of specified level. */
/* Called when player reaches end of the level they are currently on. */
Game.prototype.levelWarp = function(lid) {
  this.levelWarpId = lid;
  this.levelWarpTimer = Game.LEVEL_WARP_TIME;
  this.getPlayer().hide();
};

/* When this client player collects a coin */
Game.prototype.coinage = function() {
  this.coins = Math.min(99, this.coins+1);
  this.coinsCollected += 1;
  if(this.coins >= Game.COINS_TO_LIFE) { this.lifeage(); this.coins = 0; }
  this.play("coin.mp3",.4,0.);
  this.out.push(NET021.encode());
};

/* When the client player collects a life */
Game.prototype.lifeage = function() {
  if (this.gameMode === 1) { return; }
  this.lives = Math.min(99, this.lives+1);
  this.play("life.mp3",1.,0.);
};

Game.prototype.loop = function() {
  try {
    if(this.ready && this.startDelta !== undefined) {
      var now = util.time.now();
      var target = parseInt((now-this.startDelta)/Game.TICK_RATE);  // Frame we should be on

      if(target > this.frame) {
        var initial = true;
        while(this.buffer.length > Game.FDLC_TARGET || (initial && this.buffer.length > 0)) {
          var data = this.buffer.shift();
          this.doUpdate(data);
          initial = false;
        }

        this.doDetermine();
        while(target > this.frame) { this.doStep(); }
        this.doPush();

        this.delta = now;
      }
    }
  }
  catch(error) { }
  var that = this;
  this.loopReq = setTimeout(function( ){ that.loop(); }, 2);
};

Game.prototype.draw = function() {
  if(this.lastDraw !== this.frame || this.startDelta === undefined) { this.display.draw(); }
  
  var that = this;
  this.frameReq = requestAnimFrameFunc.call(window, function() { that.draw(); }); // Javascript 🙄
};

Game.prototype.destroy = function() {
  cancelAnimFrameFunc.call(window, this.frameReq);
  clearTimeout(this.loopReq);
  this.input.destroy();
  this.display.destroy();
  this.audio.destroy();
};
