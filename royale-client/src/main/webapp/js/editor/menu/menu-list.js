"use strict";
/* global app */

function MenuList() {
  this.element = document.getElementById("editor-list");
}

MenuList.prototype.generate = function() {
  if(!app.editor) { return; }
  
  var world = app.editor.world;
  
  var html = "<div class='list-header'>World</div>";
  for(var i=0;i<world.levels.length;i++) {
    var level = world.levels[i];
    html += "<div class='list-world'>" + level.name + " :: " + level.id + "</div>";
    for(var j=0;j<level.zones.length;j++) {
      var zone = level.zones[j];
      var id = "list-gen-" + i + "-" + j;
      html += "<div class='list-zone' id='" + id + "'>" + zone.id + "</div>";
    }
  }
  
  this.element.innerHTML = html;

  /* Layers */
  var container = document.createElement("div");
  container.setAttribute("id", "layer-list-container");
  var header = document.createElement("div");
  header.setAttribute("class", "list-header");
  header.innerText = "Layers";
  var layerList = document.createElement("div");
  layerList.setAttribute("id", "layer-list");
  container.appendChild(header);
  container.appendChild(layerList);
  this.element.appendChild(container);

  /* Have to do it this way for production sdk to still work */
  for(var i=0;i<world.levels.length;i++) {
    var level = world.levels[i];
    for(var j=0;j<level.zones.length;j++) {
      var zone = level.zones[j];
      var id = "list-gen-" + i + "-" + j;
      var ele = document.getElementById(id);
      var that = this;
      ele.lid = level.id; ele.zid = zone.id;
      ele.onclick = function() { that.select(this.lid,this.zid); };
    }
  }

  if (app.editor.currentZone) { this.updateLayerList(); }
};

MenuList.prototype.updateLayerList = function() {
  var zone = app.editor.currentZone;
  var layerList = document.getElementById("layer-list");
  layerList.innerHTML = "";
  var addLayerItem = function(layer) {
      var item = document.createElement("div");
      item.setAttribute("class", app.editor.currentLayer && layer.z == app.editor.currentLayer.z ? "list-zone-current" : "list-zone");
      item.innerText = ""+layer.z;
      item.layer = layer;
      item.onclick = function() {
          app.editor.setLayer(this.layer);
      }
      layerList.appendChild(item);
  }
  for (var i=0; i<zone.layers.length; i++) {
      addLayerItem(zone.layers[i]);
  }
}

MenuList.prototype.select = function(level, zone) {
  if(!app.editor) { return; }
  
  var world = app.editor.world;
  
  app.editor.setZone(world.getZone(level, zone));
};

MenuList.prototype.show = function() {
  this.element.style.display = "block";
};

MenuList.prototype.hide = function() {
  this.element.style.display = "none";
};