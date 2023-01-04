"use strict";
/* global app */
/* global Cookies */

function MenuName() {
  this.element = document.getElementById("name");
  this.linkElement = document.getElementById("link");
  this.nameInput = document.getElementById("name-input");
  this.teamInput = document.getElementById("team-input");
  this.launchBtn = document.getElementById("name-launch");
  this.privateBtn = document.getElementById("name-private");
  
  this.padLoop = undefined;
  
  var that = this;
  this.launchBtn.onclick = function() { that.launch(false, 0); };
  this.privateBtn.onclick = function() { that.launch(true, 0); };

  var worlds = document.getElementById("levels");
  var customLevel = document.getElementById("levelSelectInput");

  customLevel.addEventListener("change", (function () { return function (event) { uploadFile(false, event, function(data) { app.game.customLevelData = JSON.parse(data); document.getElementById("updone").style.color = "green"; }); }; })());

  for (var level of levelSelectors) {
    var elem = document.createElement("option");
    
    elem.innerText = level.name;
    elem.value = level.worldId;

    worlds.appendChild(elem);
  }

  $("#worlds").on('change', function() {
    var opt = $("#worlds option:selected").val();
    app.game.worldSelected = opt;
  });
};

/* When the launch button is clicked. */
MenuName.prototype.launch = function(priv, gameMode) {
  Cookies.set("name", this.nameInput.value, {expires: 30});
  Cookies.set("team", this.teamInput.value, {expires: 30});
  app.join(this.nameInput.value, this.teamInput.value, priv, gameMode);
  app.menu.main.menuMusic.pause();
};

MenuName.prototype.startPad = function() {
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

MenuName.prototype.show = function() {
  app.menu.hideAll();
  app.menu.navigation("name", "name");
  app.menu.background("a");
  var nam = Cookies.get("name");
  var tem = Cookies.get("team");
  this.nameInput.value = nam?nam:"";
  this.teamInput.value = tem?tem:"";
  this.startPad();
  this.linkElement.style.display = "block";
  this.element.style.display = "block";
};

MenuName.prototype.hide = function() {
  if(this.padLoop) { clearTimeout(this.padLoop); }
  this.linkElement.style.display = "none";
  this.element.style.display = "none";
};

/* Called when the back button is hit on this menu */
MenuName.prototype.onBack = function() {
  app.menu.main.show();
};