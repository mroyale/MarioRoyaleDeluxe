"use strict";
/* global app */
/* global shor2 */

function ToolZone(editor) {
  this.editor = editor;
  
  this.element = document.getElementById("editor-tool-zone");
  
  this.valId = document.getElementById("editor-tool-zone-id");
  this.valColor = document.getElementById("editor-tool-zone-color");
  this.valMusic = document.getElementById("editor-tool-zone-music");
  this.valCamera = document.getElementById("editor-tool-zone-camera");
  
  this.valInitialX = document.getElementById("editor-tool-zone-initial-x");
  this.valInitialY = document.getElementById("editor-tool-zone-initial-y");

  this.valWidth = document.getElementById("editor-tool-zone-width");
  this.valHeight = document.getElementById("editor-tool-zone-height");
  
  var tmp = this;
  this.btnApply = document.getElementById("editor-tool-zone-apply");
  this.btnApply.onclick = function() { tmp.reload(); };
  
  this.btnSize = document.getElementById("editor-tool-zone-resize");
  this.btnSize.onclick = function() { tmp.resize(); };
  
  this.btnShiftX = document.getElementById("editor-tool-zone-shiftx");
  this.btnShiftX.onclick = function() { tmp.shiftX(); };
  this.btnUnshiftX = document.getElementById("editor-tool-zone-unshiftx");
  this.btnUnshiftX.onclick = function() { tmp.unshiftX(); };
  this.btnShiftY = document.getElementById("editor-tool-zone-shifty");
  this.btnShiftY.onclick = function() { tmp.shiftY(); };
  this.btnUnshiftY = document.getElementById("editor-tool-zone-unshifty");
  this.btnUnshiftY.onclick = function() { tmp.unshiftY(); };

  document.getElementById("editor-tool-zone-addlayer").onclick = function() {
    tmp.addLayer();
  };
  document.getElementById("editor-tool-zone-dellayer").onclick = function() {
    tmp.deleteLayer();
  };
}

ToolZone.prototype.addLayer = function() {
  var z = parseInt(window.prompt("Choose Z [less than 0 is background, greater is 1]"));
  if (z === 0) return alert("Can't be the primary layer.");
  if (!z) return alert("Invalid value.");
  if (!this.zone.layers) this.zone.layers = [];
  var i=0;
  for (; i<this.zone.layers.length; ++i) {
      if (this.zone.layers[i].z == z) return alert("There is already a layer with this Z value ("+z+")");
      if (this.zone.layers[i].z > z) break;
  }
  var layer = {"z":z};
  var dims = this.zone.dimensions();

  layer.data = Array(dims.y).fill().map(()=>Array(dims.x).fill([30, 0, 0, 0, 0]));
  this.zone.layers.splice(i,0,layer);
  
  app.menu.list.updateLayerList();
  app.editor.setLayer(layer);
};

ToolZone.prototype.deleteLayer = function() {
  var z = app.editor.currentLayer.z;
  if (z == 0) return alert("You can't delete the primary layer.");
  if (!z) return alert("No layer wtf");
  var i=0;
  for(; i<this.zone.layers.length; ++i) {
      if (this.zone.layers[i].z == z) break;
  }

  if (i == this.zone.layers.length) return alert("Fake layer wtf");
  if(!window.confirm("Are you sure you want to delete layer "+z+"?")) return;
  this.zone.layers.splice(i,1)
  app.editor.setLayer(app.editor.currentZone.getLayer(0));
  app.menu.list.updateLayerList();
};

ToolZone.prototype.resize = function() {
  var newWidth = parseInt(this.valWidth.value);
  if (!newWidth || newWidth <= 0) return alert("Width must be greater than 0");
  var newHeight = parseInt(this.valHeight.value);
  if (!newHeight || newHeight <= 0) return alert("Height must be greater than 0");
  var oldHeight = this.zone.layers[0].data.length;
  
  for (var layer of this.zone.layers) {
    var oldData = layer.data;
    var oldWidth = oldData[0x0].length;
    var oldHeight = oldData.length;
    var newData = [];
    for (i = 0x0; i < newHeight; i++) {
      newData.push([]);
      for (var j = 0x0; j < newWidth; j++)
          newData[i][j] = i < oldHeight && j < oldWidth ? oldData[i][j] : [30, 0, 0, 0, 0];
      }
      layer.data = newData;
    }

  var obj = this.zone.obj;
  var wrp = this.zone.warp;
  var spn = this.zone.spawnpoint;

  for(var i=0;i<obj.length;i++) {
    var pos = shor2.decode(obj[i].pos);
    pos.y = pos.y + (newHeight-oldHeight);
    obj[i].pos = shor2.encode(pos.x, pos.y);
  }

  for(var i=0;i<wrp.length;i++) {
    var pos = shor2.decode(wrp[i].pos);
    pos.y = pos.y + (newHeight-oldHeight);
    wrp[i].pos = shor2.encode(pos.x, pos.y);
  }

  for (var i=0;i<spn.length;i++) {
    var pos = shor2.decode(spn[i].pos);
    pos.y = pos.y + (newHeight-oldHeight);
    spn[i].pos = shor2.encode(pos.x, pos.y);
  }

  this.editor.dirty = true;
};

ToolZone.prototype.shiftX = function() {
  var obj = this.zone.obj;
  var wrp = this.zone.warp;
  var spn = this.zone.spawnpoint;
  
  for (var layer of this.zone.layers) {
    var zoneData = layer.data;
    for (var i=0; i<zoneData.length;i++) zoneData[i].shift();
  }
  
  for(var i=0;i<obj.length;i++) {
    var pos = shor2.decode(obj[i].pos);
    pos.x--;
    obj[i].pos = shor2.encode(pos.x, pos.y);
  }
  
  for(var i=0;i<wrp.length;i++) {
    var pos = shor2.decode(wrp[i].pos);
    pos.x--;
    wrp[i].pos = shor2.encode(pos.x, pos.y);
  }

  for (var i=0;i<spn.length;i++) {
    var pos = shor2.decode(spn[i].pos);
    pos.x--;
    spn[i].pos = shor2.encode(pos.x, pos.y);
  }
};

ToolZone.prototype.unshiftX = function() {
  var dat = this.editor.currentLayer.data;
  var obj = this.zone.obj;
  var wrp = this.zone.warp;
  var spn = this.zone.spawnpoint;
  
  for (var layer of this.zone.layers) {
    var zoneData = layer.data;
    for (var i=0; i<zoneData.length;i++) zoneData[i].unshift([30, 0, 0, 0, 0]);
  }
  
  for(var i=0;i<obj.length;i++) {
    var pos = shor2.decode(obj[i].pos);
    pos.x++;
    obj[i].pos = shor2.encode(pos.x, pos.y);
  }
  
  for(var i=0;i<wrp.length;i++) {
    var pos = shor2.decode(wrp[i].pos);
    pos.x++;
    wrp[i].pos = shor2.encode(pos.x, pos.y);
  }

  for(var i=0;i<spn.length;i++) {
    var pos = shor2.decode(spn[i].pos);
    pos.x++;
    spn[i].pos = shor2.encode(pos.x, pos.y);
  }
};

ToolZone.prototype.shiftY = function() {
  if (1 == this.zone.dimensions().y) return alert("Can't remove the last row because it would make the level empty.");
  for (var layer of this.zone.layers) {
      layer.data.shift();
  }
};

ToolZone.prototype.unshiftY = function() {
  for (var layer of this.zone.layers) {
      var zoneData = layer.data;
      var newRow = Array(zoneData[0].length).fill([30, 0, 0, 0, 0]);
      zoneData.unshift(newRow);
  }
};

ToolZone.prototype.reload = function() {
  this.save();
  this.load();
};

ToolZone.prototype.load = function() {
  this.zone = this.editor.currentZone;
  var pos = shor2.decode(this.zone.initial);
  
  this.valId.value = this.zone.id;
  this.valInitialX.value = pos.x;
  this.valInitialY.value = pos.y;
  this.valColor.value = this.zone.color;
  this.valMusic.value = this.zone.music;
  this.valCamera.value = this.zone.camera || 0;
  this.valWidth.value = this.editor.currentLayer.data[0].length;
  this.valHeight.value = this.editor.currentLayer.data.length;
  
  this.element.style.display = "block";
};

ToolZone.prototype.save = function() {
  try {
    var i = parseInt(this.valId.value);
    var x = parseInt(this.valInitialX.value);
    var y = parseInt(this.valInitialY.value);
    var c = parseInt(this.valCamera.value);
    if(isNaN(i) || isNaN(x) || isNaN(y) || isNaN(c)) { throw "oof"; }
    this.zone.id = i;
    this.zone.initial = shor2.encode(x, y);
    this.zone.color = this.valColor.value;
    this.zone.music = this.valMusic.value;
    this.zone.camera = parseInt(this.valCamera.value);
  }
  catch(ex) { app.menu.warn.show("Failed to parse value. Changes not applied."); }
  
  app.menu.list.generate();
};

ToolZone.prototype.destroy = function() {
  this.element.style.display = "none";
  this.save();
};