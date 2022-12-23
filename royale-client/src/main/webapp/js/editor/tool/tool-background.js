"use strict";
/* global app, Display */
/* global vec2, td32 */

function ToolBackground(editor) {
  this.editor = editor;
  
  this.element = document.getElementById("editor-tool-bg");
  this.container = document.getElementById("editor-tool-bg-container");
  this.listContainer = document.getElementById("background-list-container");

  this.valURL = document.getElementById("editor-tool-bg-url");
  this.valXOffset = document.getElementById("editor-tool-bg-offx");
  this.valYOffset = document.getElementById("editor-tool-bg-offy");
  this.valSpeed = document.getElementById("editor-tool-bg-speed");
  this.valLoop = document.getElementById("editor-tool-bg-loop");

  var tmp = this;

  document.getElementById("editor-tool-bg-addlayer").onclick = function() { tmp.addLayer(); };
  document.getElementById("editor-tool-bg-dellayer").onclick = function() { tmp.delLayer(); }
  
  this.btnApply = document.getElementById("editor-tool-bg-apply");
  this.btnApply.onclick = function() { tmp.apply(); };
}

ToolBackground.prototype.addLayer = function() {
  var z = parseInt(window.prompt("Choose Z [less than 1 will appear behind the zone, greater will appear infront of the zone]"));
  if (isNaN(z)) return alert("Invalid value.");
  if (!this.zone.background) this.zone.background = [];
  var i=0;
  for (; i<this.zone.background.length; ++i) {
      if (this.zone.background[i].z == z) return alert("There is already a layer with this Z value ("+z+")");
      if (this.zone.background[i].z > z) break;
  }

  var layer = {"z":z, "url": "", "offset": vec2.make(0, 0), "speed": 0, "loop": 0};
  this.zone.background.splice(i,0,layer);
  
  app.menu.list.updateBgLayerList();
  app.editor.setBgLayer(layer);
  this.setLayer(layer);
};

ToolBackground.prototype.setLayer = function(layer) {
  this.container.style.display = ""; // Assuming we have a full layer

  this.valURL.value = layer.url;
  this.valXOffset.value = layer.offset.x;
  this.valYOffset.value = layer.offset.y;
  this.valSpeed.value = layer.speed;
  this.valLoop.value = layer.loop;

  app.menu.list.updateBgLayerList();
};

ToolBackground.prototype.apply = function() {
  var zone = this.editor.currentZone;
  
  for (var i=0; i<zone.background.length; i++) {
    if (zone.background[i].z === this.editor.currentBgLayer.z) {
      zone.background[i] = { 'z': this.editor.currentBgLayer.z, 'url': this.valURL.value, 'offset': vec2.make(parseInt(this.valXOffset.value), parseInt(this.valYOffset.value)), 'speed': parseFloat(this.valSpeed.value), 'loop': parseInt(this.valLoop.value) };
    }
  }

  this.editor.display.resource.updateTexture({ id: "bg" + this.editor.currentBgLayer.z + zone.level + zone.id, src: this.valURL.value })

  this.editor.currentBgLayer = { 'z': this.editor.currentBgLayer.z, 'url': this.valURL.value, 'offset': vec2.make(parseInt(this.valXOffset.value), parseInt(this.valYOffset.value)), 'speed': parseFloat(this.valSpeed.value), 'loop': parseInt(this.valLoop.value) };

  app.menu.list.updateBgLayerList();
  this.editor.dirty = true;
  this.save();
};

ToolBackground.prototype.reload = function() {
  this.save();
  this.load();
};

ToolBackground.prototype.load = function() {
  this.zone = this.editor.currentZone;
  var layer = this.editor.currentBgLayer;

  if (layer) {
    this.valURL.value = layer.url || "";
    this.valXOffset.value = layer.offset.x || "0";
    this.valYOffset.value = layer.offset.y || "0";
    this.valSpeed.value = layer.speed || "0";
    this.valLoop.value = layer.loop || "0";
  }

  this.element.style.display = "block";
  this.listContainer.style.display = "";
};

ToolBackground.prototype.save = function() {
  try {
    var x = parseInt(this.valXOffset.value);  // X Offset
    var y = parseInt(this.valYOffset.value);  // Y Offset
    var sp = parseFloat(this.valSpeed.value); // Speed
    var l = parseFloat(this.valLoop.value);  // Loop


    if(isNaN(x) || isNaN(y) || isNaN(sp) || isNaN(l)) { throw "rip"; }
  }
  catch(ex) { app.menu.warn.show("Failed to parse value. Changes not applied."); }
};

ToolBackground.prototype.destroy = function() {
  this.element.style.display = "none";
  this.container.style.display = "none";
  this.listContainer.style.display = "none";
  this.save();
};