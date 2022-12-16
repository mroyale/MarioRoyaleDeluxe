"use strict";
/* global app, Display */
/* global vec2, td32, shor2, GameObject */

function ToolSpawnpoint(editor) {
  this.editor = editor;
  
  this.element = document.getElementById("editor-tool-spawnpoint");

  this.valPos = document.getElementById("editor-tool-spawnpoint-pos");
  
  this.moveTimer = 0;
  this.mmbx = false;
  
  this.lore = "yes"; // Deluxe lore?
}

ToolSpawnpoint.prototype.input = function(imp, mous, keys) {
  
  /* Move selected object if we have one and press wasd/arrowkeys. */
  if(this.selected && (this.moveTimer--) < 1) {
    if(keys[87] || keys[38]) { this.move(0,1); return; } // W or UP
    if(keys[83] || keys[40]) { this.move(0,-1); return; } // S or DOWN
    if(keys[65] || keys[37]) { this.move(-1,0); return; } // A or LEFT
    if(keys[68] || keys[39]) { this.move(1,0); return; } // D or RIGHT
    if(keys[46]) { this.delete(); return; } // Delete
  }

  /* See if we are clicking on a object to select it. */
  var data = this.zone.data;
  
  var g = vec2.chop(this.editor.display.camera.unproject(mous.pos));
  g.y = data.length-g.y-1;
  //if(g.x < 0 || g.x > data[0].length-1 || g.y < 0) { return; }  // Don't need this for warps
  
  if(mous.lmb) {
    for(var i=0;i<this.zone.spawnpoint.length;i++) {
      var spn = this.zone.spawnpoint[i];
      if(vec2.distance(g, shor2.decode(spn.pos)) < 0.6) {
        this.select(spn);
        return;
      }
    }
  }
  
  /* See if we middle clicked to place an object */
  if(mous.mmb && !this.mmbx) {
    this.mmbx = true;
    var pos = shor2.encode(g.x, g.y);
    
    /* Have to do it this way for production sdk to still work */
    var spn = {};
    spn.pos = pos;
      
    this.zone.spawnpoint.push(spn);
    this.select(spn);
    return;
  }
  else if(!mous.mmb) { this.mmbx = false; }
};

ToolSpawnpoint.prototype.update = function() {
  try {
    if(this.selected) { this.selected.id = id; this.selected.data = data; }
  }
  catch(ex) { return; }
};

ToolSpawnpoint.prototype.select = function(spawn) {
  this.selected = spawn;
  
  var pos = shor2.decode(spawn.pos);
  this.valPos.innerHTML = pos.x+","+pos.y;
};

ToolSpawnpoint.prototype.move = function(x,y) {
  this.editor.dirty = true;

  var pos = shor2.decode(this.selected.pos);
  pos = vec2.add(pos, vec2.make(x,y));
  if(pos.x < 0 || pos.x > this.zone.data[0].length-1 || pos.y < 0 || pos.y > this.zone.data.length-1) { return; }
  this.selected.pos = shor2.encode(pos.x, pos.y);
  this.valPos.innerHTML = pos.x+","+pos.y;
  this.moveTimer=16;
};

ToolSpawnpoint.prototype.delete = function() {
  this.editor.dirty = true;

  for(var i=0;i<this.zone.spawnpoint.length;i++) {
    var spn = this.zone.spawnpoint[i];
    if(spn === this.selected) {
      this.zone.spawnpoint.splice(i, 1);
      return;
    }
  }
};

ToolSpawnpoint.prototype.reload = function() {
  this.save();
  this.load();
};

ToolSpawnpoint.prototype.load = function() {
  this.zone = this.editor.currentZone;
  this.selected = undefined;
  this.element.style.display = "block";
};

ToolSpawnpoint.prototype.save = function() {
  
};

ToolSpawnpoint.prototype.destroy = function() {
  this.element.style.display = "none";
  this.save();
};