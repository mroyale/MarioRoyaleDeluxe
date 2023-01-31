"use strict";
/* global app */

function MenuDisclaim() {
  this.element = document.getElementById("disclaim");
  this.linkElement = document.getElementById("link");

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

MenuDisclaim.prototype.show = function(number) {
  app.menu.hideAll();
  app.menu.background("c");
  this.linkElement.style.display = "none";
  this.element.style.display = "block";
};

MenuDisclaim.prototype.hide = function() {
  this.linkElement.style.display = "none";
  this.element.style.display = "none";
};