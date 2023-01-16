"use strict";
/* global app */
/* global vec2 */

function ToolResources(editor) {
  this.editor = editor;
  this.resources = this.editor.dataRaw.resource;
  
  this.element = document.getElementById("editor-tool-resources");

  this.maps = document.getElementById("editor-tool-resources-map");
  this.objs = document.getElementById("editor-tool-resources-obj");
  this.assets = document.getElementById("editor-tool-resources-assets");

  this.maps.onchange = () => { this.update(); };
  this.objs.onchange = () => { this.update(); };
  this.assets.onchange = () => { this.update(); };

  this.cmaps = document.getElementById("editor-tool-resources-cmap");
  this.cobjs = document.getElementById("editor-tool-resources-cobj");
  this.cassets = document.getElementById("editor-tool-resources-cassets");
  
  var tmp = this;

  this.btnApply = document.getElementById("editor-tool-resources-apply");
  this.btnApply.onclick = function() { tmp.reload(); };
};

ToolResources.prototype.update = function() {
  var maps = this.getAssets("map");
  var objs = this.getAssets("obj");
  var asts = this.getAssets("assets");

  (this.maps.value === "custom") ? this.cmaps.disabled = false : this.cmaps.disabled = true;
  (this.objs.value === "custom") ? this.cobjs.disabled = false : this.cobjs.disabled = true;
  (this.assets.value === "custom") ? this.cassets.disabled = false : this.cassets.disabled = true;

  if (!(this.maps.value) in maps) { this.cmaps.value = this.maps.value; this.maps.value = "custom"; this.cmaps.disabled = false; }
  if (!(this.objs.value) in objs) { this.cobjs.value = this.objs.value; this.objs.value = "custom"; this.cobjs.disabled = false; }
  if (!(this.assets.value) in asts) { this.cassets.value = this.assets.value; this.assets.value = "custom"; this.cassets.disabled = false; }
};

ToolResources.prototype.reload = function() {
  this.update();
  this.save();
  this.load();
};

ToolResources.prototype.getAssets = function(type) {
  switch (type) {
    case "map" : {
      var val = [];
      for (var map of mapsheets) { val.push(map.url); }
      return val;
    }

    case "obj": {
      var val = [];
      for (var obj of objsheets) { val.push(obj.url); }
      return val;
    }

    case "assets": {
      var val = [];
      for (var asset of assetsurl) { val.push(asset.url); }
      return val;
    }
  }
};

ToolResources.prototype.load = function() {
  this.zone = this.editor.currentZone;
  this.element.style.display = "block";

  var map = this.resources.find(x => x.id === "map").src;
  var obj = this.resources.find(x => x.id === "obj").src;
  var ast = this.editor.dataRaw.assets;

  this.maps.value = map;
  this.objs.value = obj;
  this.assets.value = ast;
};

ToolResources.prototype.save = function() {
  try {
    var map = this.maps.value === "custom" ? this.cmaps.value : this.maps.value;
    var obj = this.objs.value === "custom" ? this.cobjs.value : this.objs.value;
    var ast = this.assets.value === "custom" ? this.cassets.value : this.assets.value;

    this.editor.display.resource.updateTexture({"id": "map", "src": map});
    this.editor.display.resource.updateTexture({"id": "obj", "src": obj});

    this.editor.dataRaw.resource.find(x=>x.id==="map").src = map;
    this.editor.dataRaw.resource.find(x=>x.id==="obj").src = obj;
    this.editor.assets = ast;
  }
  catch(ex) { app.menu.warn.show("Failed to parse value. Changes not applied."); console.error(ex); }
};

ToolResources.prototype.destroy = function() {
  this.element.style.display = "none";
  this.save();
};