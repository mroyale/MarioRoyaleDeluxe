"use strict";
/* global app, Display */
/* global vec2, td32 */

function ToolBackground(editor) {
  this.editor = editor;
  
  this.element = document.getElementById("editor-tool-bg");

  this.valURL = document.getElementById("editor-tool-bg-url");
  this.valXOffset = document.getElementById("editor-tool-bg-offx");
  this.valYOffset = document.getElementById("editor-tool-bg-offy");
  this.valSpeed = document.getElementById("editor-tool-bg-speed");
  this.valLoop = document.getElementById("editor-tool-bg-loop");

  this.valURLS = document.getElementById("editor-tool-bg-urls");
  this.valXOffsetS = document.getElementById("editor-tool-bg-offxs");
  this.valYOffsetS = document.getElementById("editor-tool-bg-offys");
  this.valSpeedS = document.getElementById("editor-tool-bg-speeds");
  this.valLoopS = document.getElementById("editor-tool-bg-loops");
  
  var tmp = this;
  this.btnApply = document.getElementById("editor-tool-bg-apply");
  this.btnApply.onclick = function() { tmp.apply(); };
}

ToolBackground.prototype.apply = function() {
  this.zone.bg = { 'url': this.valURL.value, 'offset': vec2.make(parseInt(this.valXOffset.value), parseInt(this.valYOffset.value)), 'speed': parseFloat(this.valSpeed.value), 'loop': parseInt(this.valLoop.value) };
  this.zone.bgs = { 'url': this.valURLS.value, 'offset': vec2.make(parseInt(this.valXOffsetS.value), parseInt(this.valYOffsetS.value)), 'speed': parseFloat(this.valSpeedS.value), 'loop': parseInt(this.valLoopS.value) };;

  var id = "bg" + parseInt(Math.random()*4096);
  var ids = "bgs" + parseInt(Math.random()*4096);

  this.editor.display.resource.load([{id: id, src: this.valURL.value}]);
  this.editor.display.resource.load([{id: ids, src: this.valURLS.value}]);

  this.editor.bg = id;
  this.editor.bgs = ids;

  this.editor.dirty = true;
  this.save();
};

ToolBackground.prototype.reload = function() {
  this.save();
  this.load();
};

ToolBackground.prototype.load = function() {
  this.zone = this.editor.currentZone;

  this.valURL.value = this.zone.bg ? this.zone.bg.url : "";
  this.valXOffset.value = this.zone.bg ? this.zone.bg.offset.x : "0";
  this.valYOffset.value = this.zone.bg ? this.zone.bg.offset.y : "0";
  this.valSpeed.value = this.zone.bg ? this.zone.bg.speed : "0";
  this.valLoop.value = this.zone.bg ? this.zone.bg.loop : "0";

  this.valURLS.value = this.zone.bgs ? this.zone.bgs.url : "";
  this.valXOffsetS.value = this.zone.bgs ? this.zone.bgs.offset.x : "0";
  this.valYOffsetS.value = this.zone.bgs ? this.zone.bgs.offset.y : "0";
  this.valSpeedS.value = this.zone.bgs ? this.zone.bgs.speed : "0";
  this.valLoopS.value = this.zone.bgs ? this.zone.bgs.loop : "0";

  this.element.style.display = "block";
};

ToolBackground.prototype.save = function() {
  try {
    var x = parseInt(this.valXOffset.value);  // X Offset
    var y = parseInt(this.valYOffset.value);  // Y Offset
    var sp = parseFloat(this.valSpeed.value); // Speed
    var l = parseFloat(this.valSpeed.value);  // Loop

    var xs = parseInt(this.valXOffsetS.value);  // X Offset Secondary
    var ys = parseInt(this.valYOffsetS.value);  // Y Offset Secondary
    var sps = parseFloat(this.valSpeedS.value); // Speed Secondary
    var ls = parseInt(this.valLoopS.value);     // Loop Secondary

    if(isNaN(x) || isNaN(y) || isNaN(sp) || isNaN(l) || isNaN(xs) || isNaN(ys) || isNaN(sps) || isNaN(ls)) { throw "rip"; }

    this.editor.offsetBg = vec2.make(x, y);
  }
  catch(ex) { app.menu.warn.show("Failed to parse value. Changes not applied."); this.editor.offsetBg = vec2.make(0, 0); }
};

ToolBackground.prototype.destroy = function() {
  this.element.style.display = "none";
  this.save();
};