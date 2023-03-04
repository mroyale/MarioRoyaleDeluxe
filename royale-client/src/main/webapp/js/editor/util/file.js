"use strict";
/* global app, URL */

/* Class that reads, parses, and writes map files for Noxio Mapper */
function File() {
  this.lastFileName = "untitled.game";
}

File.prototype.new = function () {
  app.load({"type":"game","mode":"royale","assets":"assets.json","resource":[{"id":"map","src":"img/game/smb_map.png"},{"id":"obj","src":"img/game/smb_obj.png"},{"id":"effects","src":"img/game/smb_effects.png"}],"initial":0,"world":[{"id":0,"name":"New Level","initial":0,"zone":[{"id":0,"initial":196611,"color":"#6B8CFF","music":"ground.mp3","data":[[[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0]],[[5,0,0,2,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[5,0,0,2,0]],[[5,0,0,2,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[5,0,0,2,0]],[[5,0,0,2,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[5,0,0,2,0]],[[5,0,0,2,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[5,0,0,2,0]],[[5,0,0,2,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[5,0,0,2,0]],[[5,0,0,2,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[30,0,0,0,0],[5,0,0,2,0]],[[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0],[5,0,0,2,0]]],"obj":[],"warp":[],"spawnpoint":[]}]}]});
};

File.prototype.open = function (e) {
  var file = e.target.files[0];
  var tmp = this; // Fucking javascript ugh...
  this.lastFileName = file.name;
  document.title = "Editor - " + this.lastFileName;
  if (!file) {
    return;
  }
  this.file = undefined;
  var reader = new FileReader();
  reader.onload = function (e) {
    var r = e.target.result;
    tmp.file = r;
  };
  reader.readAsText(file);

  //Wait until map is fully loaded then parse...
  var opened = function () {
    if (tmp.file === undefined) {
      setTimeout(function () { opened(); }, 500);
    }
    else {
      //GOTCHA!
      tmp.parse(tmp.file);
    }
  };

  opened();
};

File.prototype.parse = function (raw) {
  var game = JSON.parse(raw);
  app.load(game);
};

File.prototype.save = function (data) {
  var type = "TEXT";
  var filename = this.lastFileName;
  app.editor.dirty = false;

  var file = new Blob([data], { type: type });
  if (window.navigator.msSaveOrOpenBlob) // IE10+
    window.navigator.msSaveOrOpenBlob(file, filename);
  else { // Others
    var a = document.createElement("a"),
      url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }
};