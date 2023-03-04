"user strict";
/* global Cookies */

/* App for control binding page */

var INPUTS = ["up","down","left","right","a","b"];
var K_DEFAULT = [38, 40, 37, 39, 88, 90];
var G_DEFAULT = [12, 13, 14, 15, 0, 2];
var K_MAP = [
  "", // [0]
  "", // [1]
  "", // [2]
  "CANCEL", // [3]
  "", // [4]
  "", // [5]
  "HELP", // [6]
  "", // [7]
  "BACK_SPACE", // [8]
  "TAB", // [9]
  "", // [10]
  "", // [11]
  "CLEAR", // [12]
  "ENTER", // [13]
  "ENTER_SPECIAL", // [14]
  "", // [15]
  "SHIFT", // [16]
  "CONTROL", // [17]
  "ALT", // [18]
  "PAUSE", // [19]
  "CAPS_LOCK", // [20]
  "KANA", // [21]
  "EISU", // [22]
  "JUNJA", // [23]
  "FINAL", // [24]
  "HANJA", // [25]
  "", // [26]
  "ESCAPE", // [27]
  "CONVERT", // [28]
  "NONCONVERT", // [29]
  "ACCEPT", // [30]
  "MODECHANGE", // [31]
  "SPACE", // [32]
  "PAGE_UP", // [33]
  "PAGE_DOWN", // [34]
  "END", // [35]
  "HOME", // [36]
  "LEFT", // [37]
  "UP", // [38]
  "RIGHT", // [39]
  "DOWN", // [40]
  "SELECT", // [41]
  "PRINT", // [42]
  "EXECUTE", // [43]
  "PRINTSCREEN", // [44]
  "INSERT", // [45]
  "DELETE", // [46]
  "", // [47]
  "0", // [48]
  "1", // [49]
  "2", // [50]
  "3", // [51]
  "4", // [52]
  "5", // [53]
  "6", // [54]
  "7", // [55]
  "8", // [56]
  "9", // [57]
  "COLON", // [58]
  "SEMICOLON", // [59]
  "LESS_THAN", // [60]
  "EQUALS", // [61]
  "GREATER_THAN", // [62]
  "QUESTION_MARK", // [63]
  "AT", // [64]
  "A", // [65]
  "B", // [66]
  "C", // [67]
  "D", // [68]
  "E", // [69]
  "F", // [70]
  "G", // [71]
  "H", // [72]
  "I", // [73]
  "J", // [74]
  "K", // [75]
  "L", // [76]
  "M", // [77]
  "N", // [78]
  "O", // [79]
  "P", // [80]
  "Q", // [81]
  "R", // [82]
  "S", // [83]
  "T", // [84]
  "U", // [85]
  "V", // [86]
  "W", // [87]
  "X", // [88]
  "Y", // [89]
  "Z", // [90]
  "OS_KEY", // [91] Windows Key (Windows) or Command Key (Mac)
  "", // [92]
  "CONTEXT_MENU", // [93]
  "", // [94]
  "SLEEP", // [95]
  "NUMPAD0", // [96]
  "NUMPAD1", // [97]
  "NUMPAD2", // [98]
  "NUMPAD3", // [99]
  "NUMPAD4", // [100]
  "NUMPAD5", // [101]
  "NUMPAD6", // [102]
  "NUMPAD7", // [103]
  "NUMPAD8", // [104]
  "NUMPAD9", // [105]
  "MULTIPLY", // [106]
  "ADD", // [107]
  "SEPARATOR", // [108]
  "SUBTRACT", // [109]
  "DECIMAL", // [110]
  "DIVIDE", // [111]
  "F1", // [112]
  "F2", // [113]
  "F3", // [114]
  "F4", // [115]
  "F5", // [116]
  "F6", // [117]
  "F7", // [118]
  "F8", // [119]
  "F9", // [120]
  "F10", // [121]
  "F11", // [122]
  "F12", // [123]
  "F13", // [124]
  "F14", // [125]
  "F15", // [126]
  "F16", // [127]
  "F17", // [128]
  "F18", // [129]
  "F19", // [130]
  "F20", // [131]
  "F21", // [132]
  "F22", // [133]
  "F23", // [134]
  "F24", // [135]
  "", // [136]
  "", // [137]
  "", // [138]
  "", // [139]
  "", // [140]
  "", // [141]
  "", // [142]
  "", // [143]
  "NUM_LOCK", // [144]
  "SCROLL_LOCK", // [145]
  "WIN_OEM_FJ_JISHO", // [146]
  "WIN_OEM_FJ_MASSHOU", // [147]
  "WIN_OEM_FJ_TOUROKU", // [148]
  "WIN_OEM_FJ_LOYA", // [149]
  "WIN_OEM_FJ_ROYA", // [150]
  "", // [151]
  "", // [152]
  "", // [153]
  "", // [154]
  "", // [155]
  "", // [156]
  "", // [157]
  "", // [158]
  "", // [159]
  "CIRCUMFLEX", // [160]
  "EXCLAMATION", // [161]
  "DOUBLE_QUOTE", // [162]
  "HASH", // [163]
  "DOLLAR", // [164]
  "PERCENT", // [165]
  "AMPERSAND", // [166]
  "UNDERSCORE", // [167]
  "OPEN_PAREN", // [168]
  "CLOSE_PAREN", // [169]
  "ASTERISK", // [170]
  "PLUS", // [171]
  "PIPE", // [172]
  "HYPHEN_MINUS", // [173]
  "OPEN_CURLY_BRACKET", // [174]
  "CLOSE_CURLY_BRACKET", // [175]
  "TILDE", // [176]
  "", // [177]
  "", // [178]
  "", // [179]
  "", // [180]
  "VOLUME_MUTE", // [181]
  "VOLUME_DOWN", // [182]
  "VOLUME_UP", // [183]
  "", // [184]
  "", // [185]
  "SEMICOLON", // [186]
  "EQUALS", // [187]
  "COMMA", // [188]
  "MINUS", // [189]
  "PERIOD", // [190]
  "SLASH", // [191]
  "BACK_QUOTE", // [192]
  "", // [193]
  "", // [194]
  "", // [195]
  "", // [196]
  "", // [197]
  "", // [198]
  "", // [199]
  "", // [200]
  "", // [201]
  "", // [202]
  "", // [203]
  "", // [204]
  "", // [205]
  "", // [206]
  "", // [207]
  "", // [208]
  "", // [209]
  "", // [210]
  "", // [211]
  "", // [212]
  "", // [213]
  "", // [214]
  "", // [215]
  "", // [216]
  "", // [217]
  "", // [218]
  "OPEN_BRACKET", // [219]
  "BACK_SLASH", // [220]
  "CLOSE_BRACKET", // [221]
  "QUOTE", // [222]
  "", // [223]
  "META", // [224]
  "ALTGR", // [225]
  "", // [226]
  "WIN_ICO_HELP", // [227]
  "WIN_ICO_00", // [228]
  "", // [229]
  "WIN_ICO_CLEAR", // [230]
  "", // [231]
  "", // [232]
  "WIN_OEM_RESET", // [233]
  "WIN_OEM_JUMP", // [234]
  "WIN_OEM_PA1", // [235]
  "WIN_OEM_PA2", // [236]
  "WIN_OEM_PA3", // [237]
  "WIN_OEM_WSCTRL", // [238]
  "WIN_OEM_CUSEL", // [239]
  "WIN_OEM_ATTN", // [240]
  "WIN_OEM_FINISH", // [241]
  "WIN_OEM_COPY", // [242]
  "WIN_OEM_AUTO", // [243]
  "WIN_OEM_ENLW", // [244]
  "WIN_OEM_BACKTAB", // [245]
  "ATTN", // [246]
  "CRSEL", // [247]
  "EXSEL", // [248]
  "EREOF", // [249]
  "PLAY", // [250]
  "ZOOM", // [251]
  "", // [252]
  "PA1", // [253]
  "WIN_OEM_CLEAR", // [254]
  "" // [255]
];

function ControlApp() {
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

ControlApp.prototype.load = function() {
  
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

ControlApp.prototype.save = function() {
  for(var i=0;i<INPUTS.length;i++) {
    Cookies.set("k_"+INPUTS[i], this.assignK[INPUTS[i]], {expires: 120});
    Cookies.set("g_"+INPUTS[i], this.assignG[INPUTS[i]], {expires: 120});
  }
};

ControlApp.prototype.setK = function(inp) {
  this.settingG = undefined;
  this.settingK = inp;
};

ControlApp.prototype.setG = function(inp) {
  this.settingK = undefined;
  this.settingG = inp;
};

ControlApp.prototype.init = function() {
  this.step();
};

ControlApp.prototype.reset = function(type) {
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

  controlApp.load();
  if(app !== undefined & app.ingame()) {
    app.game.input.load();
  }
};

ControlApp.prototype.step = function() {
  this.updatePad();
  
  if(this.settingK) {
    for(var i=0;i<this.keys.length;i++) {
      if(this.keys[i]) {
        this.assignK[this.settingK] = i;
        this.settingK = undefined;
        this.save();

        if(app !== undefined & app.ingame()) {
          app.game.input.load();
        }
      }
    }
  }
  
  if(this.settingG && this.pad) {
    for(var i=0;i<this.pad.buttons.length;i++) {
      if(this.pad.buttons[i].pressed) {
        this.assignG[this.settingG] = i;
        this.settingG = undefined;
        this.save();

        if(app !== undefined & app.ingame()) {
          app.game.input.load();
        }
      }
    }
  }
  
  this.draw();
  
  var that = this;
  this.loopReq = setTimeout(function( ){ that.step(); }, 16);
};

ControlApp.prototype.keyEvent = function(evt, state) {
  this.keys[evt.keyCode] = state;
  //if(state) { this.inputs.push({key: evt.keyCode, char: evt.key.length!==1?"":evt.key}); }
};

ControlApp.prototype.updatePad = function() {
  if(navigator && navigator.getGamepads) { pads = navigator.getGamepads(); }
  else { pads = []; }
  
  var pick = 0;
  if(pick < pads.length) { this.pad = pads[pick]; }
  else { this.pad = undefined; }
  
  this.updateAnalog();
};

ControlApp.prototype.updateAnalog = function() {
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

ControlApp.prototype.draw = function() {
  this.testPadId.innerHTML = this.pad?this.pad.id:"Awaiting input...";
  this.testAnalog.innerHTML = roundTo((this.analog.x),-2) + ", " + roundTo((this.analog.y),-2);
  
  this.kTitle.style.color = this.settingK?"#80FF80":"#FFD700";
  this.gTitle.style.color = this.settingG?"#80FF80":"#FFD700";
  
  for(var i=0;i<INPUTS.length;i++) {
    var ktest = this.keys[this.assignK[INPUTS[i]]];
    if(this.pad) { var gtest = this.pad.buttons[this.assignG[INPUTS[i]]].pressed; }
    this.test[INPUTS[i]].style.color = ktest||gtest?"#80FF80":"#FFFFFF";
  }
  
  for(var i=0;i<INPUTS.length;i++) {
    var code = this.assignK[INPUTS[i]];
    var char = K_MAP[code];

    this.elementK[INPUTS[i]].innerHTML = char;
    this.elementG[INPUTS[i]].innerHTML = "0x" + this.assignG[INPUTS[i]].toString(16).toUpperCase();
  }
  
  if(this.analog.x > 0.25) { this.test.right.style.color = "#80FF80"; }
  if(this.analog.x < -0.25) { this.test.left.style.color = "#80FF80"; }
  if(this.analog.y > 0.25) { this.test.down.style.color = "#80FF80"; }
  if(this.analog.y < -0.25) { this.test.up.style.color = "#80FF80"; }
};

/* Round analog axes down to two decimal places
Condensed version of https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/floor#decimal_adjustment */
function round(value, exp) {
  const [magnitude, exponent = 0] = value.toString().split("e");
  const adjustedValue = Math["round"](`${magnitude}e${exponent - exp}`);
  const [newMagnitude, newExponent = 0] = adjustedValue.toString().split("e");
  return Number(`${newMagnitude}e${+newExponent + exp}`);
}
const roundTo = (value, exp) => round(value, exp);

var controlApp = new ControlApp();
controlApp.init();