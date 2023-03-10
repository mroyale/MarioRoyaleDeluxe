"use strict";
/* global app, Display */
/* global vec2, td32, shor2, GameObject */

function ToolObject(editor) {
  this.editor = editor;
  
  this.element = document.getElementById("editor-tool-object");
  
  this.valName = document.getElementById("editor-tool-object-name");
  
  this.valType = document.getElementById("editor-tool-object-type");
  this.valPos = document.getElementById("editor-tool-object-pos");
  this.valPosVec = document.getElementById("editor-tool-object-pos-vec");
  
  var that = this;
  for(var i=0; i<this.editor.objParamLimit; ++i) {
    var valParam = document.getElementById("editor-tool-object-param-"+i);
    valParam.onchange = function() {
        that.update();
    };
  }
  
  var tmp = this;
  this.valType.onchange = function() { tmp.update(); };
  
  this.moveTimer = 0;
  this.mmbx = false;
  
  this.objct = {type: 1, param: []};
}

ToolObject.prototype.input = function(imp, mous, keys) {
  
  /* Move selected object if wasd/arrowkeys are pressed. */
  if(this.selected && --this.moveTimer < 1) {
    if(keys[87] || keys[38]) { this.move(0,1); return; } // W or UP
    if(keys[83] || keys[40]) { this.move(0,-1); return; } // S or DOWN
    if(keys[65] || keys[37]) { this.move(-1,0); return; } // A or LEFT
    if(keys[68] || keys[39]) { this.move(1,0); return; } // D or RIGHT
    if(keys[46]) { this.delete(); return; } // Delete
  }

  /* See if we are clicking on a object to select it. */
  var data = this.editor.currentLayer.data;
  
  var g = vec2.chop(this.editor.display.camera.unproject(mous.pos));
  g.y = data.length-g.y-1;
  //if(g.x < 0 || g.x > data[0].length-1 || g.y < 0) { return; }  // Don't need this for objects
  
  if(mous.lmb) {
    for(var i=0;i<this.zone.obj.length;i++) {
      var obj = this.zone.obj[i];
      if(vec2.distance(g, shor2.decode(obj.pos)) < 0.5) {
        this.select(obj);
        return;
      }
    }

    this.deselect();
  }
  
  /* See if we middle clicked to place an object */
  if(mous.mmb && !this.mmbx) {
    this.mmbx = true;
    var pos = shor2.encode(g.x, g.y);
    
    /* Have to do it this way for production sdk to still work */
    var obj = {};
    obj.type = this.objct.type;
    obj.pos = pos;
    obj.param = this.objct.param;
    
    this.zone.obj.push(obj);
    this.select(obj);
    this.editor.dirty = true;
    return;
  }
  else if(!mous.mmb) { this.mmbx = false; }
};

ToolObject.prototype.updParamTools = function() {
  var pdef = GameObject.OBJECT(this.objct.type).PARAMS;
  var currParamLimit = pdef ? pdef.length : 0;
  for (var i=0;i<this.editor.objParamLimit;++i) {
    var box = document.getElementById("editor-tool-object-param-box-"+i);
    box.style.display = (i<currParamLimit) ? "" : "none";
    if (i<currParamLimit) {
      if(pdef[i].tooltip) {
        var paramNameLabel = document.getElementById("editor-tool-object-param-name-"+i);
        paramNameLabel.innerHTML = pdef[i].name + '<span class="tooltip-text">' + pdef[i].tooltip + '</span>';
      } else {
        var paramNameLabel = document.getElementById("editor-tool-object-param-name-"+i);
        paramNameLabel.innerText = pdef[i].name;
      }

      var paramTypeLabel = document.getElementById("editor-tool-object-param-type-"+i);
      paramTypeLabel.innerText = pdef[i].type || "string";
    }
  }
}

ToolObject.prototype.update = function() {
  try {
    var type = Math.max(0, Math.min(65535, parseInt(this.valType.value)));
    
    var params = [];
    for (var i=0;i<this.editor.objParamLimit;++i) {
      var param = document.getElementById("editor-tool-object-param-"+i).value;
      if (param === "") param = undefined;
      params.push(param);
    }
    while (0<params.length && params[params.length-1] === undefined) params.pop();
    if (isNaN(type) || params === undefined) { throw "oof"; }
    
    if(this.selected) { this.selected.type = type; this.selected.param = params; }
    this.objct.type = type; this.objct.param = params;

    this.updParamTools();
    
    var cls = GameObject.OBJECT(type);
    if(cls && cls.NAME) { this.valName.innerHTML = cls.NAME; }
  }
  catch(ex) { return; }
};

ToolObject.prototype.select = function(object) {
  this.selected = object;
  this.objct.type = object.type;
  this.objct.param = object.param;
  
  this.valType.value = object.type;
  this.valPos.innerHTML = object.pos;
  var pos = shor2.decode(object.pos);
  this.valPosVec.innerHTML = pos.x + "," + pos.y;
  
  for (var i=0;i<this.editor.objParamLimit;++i) {
    var param = object.param[i];
    if (param === undefined) param = "";
    document.getElementById("editor-tool-object-param-"+i).value = param;
  }

  this.updParamTools();
  
  var cls = GameObject.OBJECT(object.type);
  if(cls && cls.NAME) { this.valName.innerHTML = cls.NAME; }
};

ToolObject.prototype.deselect = function() {
  this.selected = undefined;
  this.valName.innerHTML = "No object selected";
  this.valPos.innerHTML = "N/A";
  this.valPosVec.innerHTML = "N/A";
}

ToolObject.prototype.move = function(x,y) {
  if (document.activeElement.tagName === 'INPUT') { return; }

  var pos = shor2.decode(this.selected.pos);
  pos = vec2.add(pos, vec2.make(x,y));
  if(pos.x < 0 || pos.x > this.editor.currentLayer.data[0].length-1 || pos.y < 0) { return; }
  this.selected.pos = shor2.encode(pos.x, pos.y);
  this.moveTimer=16;

  var pos = shor2.decode(this.selected.pos);
  this.valPos.innerHTML = this.selected.pos;
  this.valPosVec.innerHTML = pos.x + "," + pos.y;
};


ToolObject.prototype.delete = function() {
  for(var i=0;i<this.zone.obj.length;i++) {
    var obj = this.zone.obj[i];
    if(obj === this.selected) {
      this.zone.obj.splice(i, 1);
      return;
    }
  }
};

ToolObject.prototype.reload = function() {
  this.save();
  this.load();
};

ToolObject.prototype.load = function() {
  this.zone = this.editor.currentZone;
  this.selected = undefined;
  this.element.style.display = "block";
  this.objct.type = parseInt(this.valType.value);
};

ToolObject.prototype.save = function() {
  
};

ToolObject.prototype.destroy = function() {
  this.element.style.display = "none";
  this.save();
  
  this.valType.onchange = undefined;

  for (var i=0; i<this.editor.objParamLimit; ++i) {
    var valParam = document.getElementById("editor-tool-object-param-"+i);
    valParam.onchange = undefined;
  }
};