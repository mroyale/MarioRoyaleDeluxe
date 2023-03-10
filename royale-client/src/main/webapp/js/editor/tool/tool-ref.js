"use strict";
/* global app */
/* global vec2 */

function ToolRef(editor) {
  this.editor = editor;
  
  this.element = document.getElementById("editor-tool-ref");
  
  this.valImg = document.getElementById("editor-tool-ref-img");
  this.valX = document.getElementById("editor-tool-ref-x");
  this.valY = document.getElementById("editor-tool-ref-y");
  this.valDepth = document.getElementById("editor-tool-ref-depth");
  
  var tmp = this;
  this.btnLoad = document.getElementById("editor-tool-ref-load");
  this.btnLoad.onclick = function() { tmp.image(); };

  this.btnApply = document.getElementById("editor-tool-ref-apply");
  this.btnApply.onclick = function() { tmp.reload(); };
}

ToolRef.prototype.image = function() {
  var id = "ref" + parseInt(Math.random()*4096);
  this.editor.display.resource.load([{id: id, src: this.valImg.value}]);
  this.editor.reference = id;
};

ToolRef.prototype.reload = function() {
  this.save();
  this.load();
};

ToolRef.prototype.load = function() {
  this.zone = this.editor.currentZone;
  this.valImg.value = "";
  this.valX.value = this.editor.offsetRef.x;
  this.valY.value = this.editor.offsetRef.y;
  this.valDepth.value = (this.editor.refDepth ? 1 : 0);
  this.element.style.display = "block";
};

ToolRef.prototype.save = function() {
  try {
    var x = parseInt(this.valX.value);
    var y = parseInt(this.valY.value);
    var d = Math.max(0, Math.min(1, parseInt(this.valDepth.value))) || 0;
    if(isNaN(x) || isNaN(y) || isNaN(d)) { throw "oof"; }
    this.editor.offsetRef = vec2.make(x, y);
    this.editor.refDepth = Boolean(d);
  }
  catch(ex) { app.menu.warn.show("Failed to parse value. Changes not applied."); }
};

ToolRef.prototype.destroy = function() {
  this.element.style.display = "none";
  this.save();
};