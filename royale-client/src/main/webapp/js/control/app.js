"user strict";
/* global Cookies */

/* App for control binding page */

var INPUTS = ["up","down","left","right","a","b"];
var K_DEFAULT = [38, 40, 37, 39, 88, 90];
var G_DEFAULT = [0, 1, 2, 3, 4, 5];

function App() {
  var that = this;
  
  this.keys = [];
  this.pad = undefined;
  
  this.settingK = undefined;
  this.settingG = undefined;
  
  this.elementK = undefined;
  this.elementG = undefined;
  
  document.onkeyup = function(event) { that.keyEvent(event, false); };
  document.onkeydown = function(event) { that.keyEvent(event, true); };
  
  /* Prevents keyup from triggering button clicks */
  document.querySelectorAll("button").forEach( function(item) {
      item.addEventListener('focus', function() {
          this.blur();
      });
  });
  
  this.kTitle = document.getElementById("k-title");
  this.gTitle = document.getElementById("g-title");
  
  this.testPadId = document.getElementById("test-pad-id");
  this.testAnalog = document.getElementById("test-analog");
  
  this.test = {};
  for(var i=0;i<INPUTS.length;i++) {
    this.test[INPUTS[i]] = document.getElementById("test-" + INPUTS[i]);
  }
  
  this.load();
};

App.prototype.load = function() {
  
  this.elementK = {};
  this.assignK = {};
  for(var i=0;i<INPUTS.length;i++) {
    var val = Cookies.get("k_" + INPUTS[i]);
    this.assignK[INPUTS[i]] = val?parseInt(val):K_DEFAULT[i];
    this.elementK[INPUTS[i]] = document.getElementById("key-" + INPUTS[i]);
  }
  

  this.elementG = {};
  this.assignG = {};
  for(var i=0;i<INPUTS.length;i++) {
    var val = Cookies.get("g_" + INPUTS[i]);
    this.assignG[INPUTS[i]] = val?parseInt(val):G_DEFAULT[i];
    this.elementG[INPUTS[i]] = document.getElementById("pad-" + INPUTS[i]);
  }
  
};

App.prototype.save = function() {
  for(var i=0;i<INPUTS.length;i++) {
    Cookies.set("k_"+INPUTS[i], this.assignK[INPUTS[i]], {expires: 120});
    Cookies.set("g_"+INPUTS[i], this.assignG[INPUTS[i]], {expires: 120});
  }
};

App.prototype.setK = function(inp) {
  this.settingG = undefined;
  this.settingK = inp;
};

App.prototype.setG = function(inp) {
  this.settingK = undefined;
  this.settingG = inp;
};

App.prototype.init = function() {
  this.step();
};

App.prototype.reset = function(type) {
  /* Keyboard Controls */
  if (type.toLowerCase() === "k") {
    for (var i=0;i<INPUTS.length;i++) {
      Cookies.remove("k_" + INPUTS[i]);
    }
  /* Gamepad Controls */
  } else if (type.toLowerCase() === "g") {
    for (var i=0;i<INPUTS.length;i++) {
      Cookies.remove("g_" + INPUTS[i]);
    }
  }

  app.load();
};

App.prototype.step = function() {
  this.updatePad();
  
  if(this.settingK) {
    for(var i=0;i<this.keys.length;i++) {
      if(this.keys[i]) {
        this.assignK[this.settingK] = i;
        this.settingK = undefined;
        this.save();
      }
    }
  }
  
  if(this.settingG && this.pad) {
    for(var i=0;i<this.pad.buttons.length;i++) {
      if(this.pad.buttons[i].pressed) {
        this.assignG[this.settingG] = i;
        this.settingG = undefined;
        this.save();
      }
    }
  }
  
  this.draw();
  
  var that = this;
  this.loopReq = setTimeout(function( ){ that.step(); }, 16);
};

App.prototype.keyEvent = function(evt, state) {
  this.keys[evt.keyCode] = state;
  //if(state) { this.inputs.push({key: evt.keyCode, char: evt.key.length!==1?"":evt.key}); }
};

App.prototype.updatePad = function() {
  if(navigator && navigator.getGamepads) { pads = navigator.getGamepads(); }
  else { pads = []; }
  
  var pick = 0;
  if(pick < pads.length) { this.pad = pads[pick]; }
  else { this.pad = undefined; }
  
  this.updateAnalog();
};

App.prototype.updateAnalog = function() {
  if(this.pad) {
    for(var i=0;i<this.pad.axes.length-1;i++) {
      var x = this.pad.axes[i];
      var y = this.pad.axes[i+1];
      if(Math.abs(x) < 0.25 && Math.abs(y) < 0.25) { continue; }
      else { this.analog = {x: x, y: y}; return; }
    }
  }
  this.analog = {x: 0., y: 0.};
};

App.prototype.draw = function() {
  this.testPadId.innerHTML = this.pad?this.pad.id:"No gamepad detected.";
  this.testAnalog.innerHTML = this.analog.x + ", " + this.analog.y;
  
  this.kTitle.style.color = this.settingK?"#00FF00":"#FFFFFF";
  this.gTitle.style.color = this.settingG?"#00FF00":"#FFFFFF";
  
  for(var i=0;i<INPUTS.length;i++) {
    var ktest = this.keys[this.assignK[INPUTS[i]]];
    if(this.pad) { var gtest = this.pad.buttons[this.assignG[INPUTS[i]]].pressed; }
    this.test[INPUTS[i]].style.color = ktest||gtest?"#00FF00":"#763E15";
  }
  
  for(var i=0;i<INPUTS.length;i++) {
    var code = this.assignK[INPUTS[i]];
    var char = "0x" + code.toString(16);

    this.elementK[INPUTS[i]].innerHTML = char;
    this.elementG[INPUTS[i]].innerHTML = "0x" + this.assignG[INPUTS[i]].toString(16).toUpperCase();
  }
  
  if(this.analog.x > 0.25) { this.test.right.style.color = "#00FF00"; }
  if(this.analog.x < -0.25) { this.test.left.style.color = "#00FF00"; }
  if(this.analog.y > 0.25) { this.test.down.style.color = "#00FF00"; }
  if(this.analog.y < -0.25) { this.test.up.style.color = "#00FF00"; }
};

var app = new App();
app.init();