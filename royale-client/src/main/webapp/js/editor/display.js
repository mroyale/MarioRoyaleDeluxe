"use strict";
/* global util, td32 */
/* global Display, GameObject, shor2, vec2 */

/* !!! Extends regular game display.js !!! */
function EditorDisplay(game, container, canvas, resource) {
  Display.call(this, game, container, canvas, resource);
}

EditorDisplay.prototype.clear = Display.prototype.clear;

EditorDisplay.prototype.draw = function() {
  var context = this.context; // Sanity
  
  this.container.style.height = this.game.middle.clientHeight; // Hack for window layout of editor
  
  this.clear();
  
  /* Background color */
  context.fillStyle = this.game.getZone().color;
  context.fillRect(0,0,this.canvas.width,this.canvas.height);
  
  /* Loading Check */
  if(!this.resource.ready()) {
    this.drawLoad();
    return;
  }
  
  /* Camera Transform */
  var zone = this.game.getZone();
  var dim = zone.dimensions();
  
  context.save();
  context.translate(this.canvas.width*.5, this.canvas.height*.5);
  context.scale(this.camera.scale, this.camera.scale);
  context.translate(-this.camera.pos.x*Display.TEXRES, -this.camera.pos.y*Display.TEXRES);
  
  /* Draw Game */
  this.drawBackground();
  this.drawReference();
  
  for (var i=0; i<zone.layers.length; i++) {
    this.drawMapTool(zone.layers[i].data, false); // Render background
    if (zone.layers[i].z == 0) {
        this.drawMapTool(zone.layers[i].data, true); // Render foreground
    }
  }
  //this.drawEffect();
  //this.drawUI();
  this.drawBorder();
  this.drawCursor();
  this.drawCopyBlock();
  this.drawObjectTool();
  this.drawSpawnpoint();
  this.drawWarp();
  this.drawLevelStart();
  
  /* Draw UI */
  context.restore();
  this.drawPallete();
};

EditorDisplay.prototype.drawReference = function() {
  var context = this.context; // Sanity
  
  if(!this.game.reference || !this.game.showRef) { return; }
  
  var tex = this.resource.getTexture(this.game.reference);
  
  if(!tex) { return; }
  
  context.drawImage(tex, 0, 0, tex.width, tex.height, this.game.offsetRef.x, this.game.offsetRef.y, tex.width, tex.height);
};

EditorDisplay.prototype.drawBackground = function() {
  var context = this.context; // Sanity
  var zone = this.game.getZone();

  var dim = zone.dimensions();
  var tex = this.resource.getTexture(this.game.bg);
  var texas = this.resource.getTexture(this.game.bgs);

  if (zone.bgs && texas) {
    var bg = zone.bgs;
    var loopCount = bg.loop || parseInt(dim.x*16/texas.width)+1 //Maybe should be Math.round instead of parseInt
  
    if (loopCount <= 1) {
      /* Draw once */
      context.drawImage(texas, this.camera.pos.x * bg.speed + bg.offset.x, bg.offset.y, texas.width, texas.height);
    } else {
      for (var i=0; i<loopCount; i++) {
        var len = tex.width*i;
        context.drawImage(texas, this.camera.pos.x * bg.speed + bg.offset.x + len, bg.offset.y, texas.width, texas.height);
      }
    }
  };
  
  if (zone.bg && tex) {
    var bg = zone.bg;
    var loopCount = bg.loop || parseInt(dim.x*16/tex.width)+1 //Maybe should be Math.round instead of parseInt
  
    if (loopCount <= 1) {
      /* Draw once */
      context.drawImage(tex, this.camera.pos.x * bg.speed + bg.offset.x, bg.offset.y, tex.width, tex.height);
    } else {
      for (var i=0; i<loopCount; i++) {
        var len = tex.width*i;
        context.drawImage(tex, this.camera.pos.x * bg.speed + bg.offset.x + len, bg.offset.y, tex.width, tex.height);
      }
    }
  };

  /*if(!this.game.bg || !zone.bg) { return; }

  var tex = this.resource.getTexture(this.game.bg);

  if (!tex) { return; }
  var bg = zone.bg;
  var dim = zone.dimensions();
  var loopCount = parseInt(dim.x*16/tex.width);

  if (loopCount <= 1) {
    context.drawImage(tex, this.camera.pos.x*bg.speed+bg.offset.x, bg.offset.y, tex.width, tex.height);
  } else {
    for (var i=0; i<loopCount; i++) {
      var len = tex.width*i
      context.drawImage(tex, this.camera.pos.x*bg.speed+bg.offset.x+len, bg.offset.y, tex.width, tex.height);
    }
  };*/

  //context.drawImage(tex, this.camera.pos.x*bg.speed+bg.offset.x, 0, tex.width, tex.height, this.game.offsetBg.x, this.game.offsetBg.y, tex.width, tex.height);
  //context.drawImage(tex, this.camera.pos.x*bg.speed+bg.offset.x, bg.offset.y, tex.width, tex.height);
};

EditorDisplay.prototype.drawMap = Display.prototype.drawMap;

EditorDisplay.prototype.drawObject = Display.prototype.drawObject;

EditorDisplay.prototype.drawEffect = Display.prototype.drawEffect;

EditorDisplay.prototype.drawUI = Display.prototype.drawUI;

EditorDisplay.prototype.drawBorder = function() {
  var context = this.context;
  
  var dim = vec2.scale(this.game.getZone().dimensions(), Display.TEXRES);
  context.lineWidth = 1;
  context.strokeStyle = '#FFFFFF';
  context.beginPath(); 
  context.moveTo(-(Display.TEXRES*0.1),-(Display.TEXRES*0.1));
  context.lineTo(dim.x+(Display.TEXRES*0.1),-(Display.TEXRES*0.1));
  context.lineTo(dim.x+(Display.TEXRES*0.1),dim.y+(Display.TEXRES*0.1));
  context.lineTo(-(Display.TEXRES*0.1),dim.y+(Display.TEXRES*0.1));
  context.lineTo(-(Display.TEXRES*0.1),-(Display.TEXRES*0.1));
  context.stroke();
};

EditorDisplay.prototype.drawCursor = function() {
  if(!this.game.tool || this.game.tool.brush === undefined) { return; }
  
  var context = this.context;
  
  var dim = this.game.getZone().dimensions();
  var mous = this.game.input.mouse;

  var g = vec2.chop(this.camera.unproject(mous.pos));
  if(g.x < 0 || g.x >= dim.x || g.y < 0 || g.y >= dim.y) { return; }
  
  context.fillStyle = "rgba(255,255,255,0.5)";
  context.fillRect(g.x*Display.TEXRES,g.y*Display.TEXRES,Display.TEXRES,Display.TEXRES);
};

EditorDisplay.prototype.drawCopyBlock = function() {
  if(!this.game.tool || !this.game.tool.dim) { return; }
  
  var context = this.context;
  
  var dim = this.game.getZone().dimensions();
  var mous = this.game.input.mouse;

  var g = vec2.chop(this.camera.unproject(mous.pos));
  if(g.x < 0 || g.x >= dim.x || g.y < 0 || g.y >= dim.y) { return; }
  
  context.fillStyle = "rgba(255,255,255,0.5)";
  context.fillRect(g.x*Display.TEXRES,g.y*Display.TEXRES,Display.TEXRES*this.game.tool.dim.x,Display.TEXRES*this.game.tool.dim.y);
};

EditorDisplay.prototype.drawPallete = function() {
  
  if(!this.game.tool || this.game.tool.brush === undefined) { return; }
  
  var context = this.context;
  var tex = this.resource.getTexture("map");
  
  var num = (tex.width/Display.TEXRES)*(tex.height/Display.TEXRES);
  var uplim = this.canvas.height-(parseInt(num/parseInt(this.canvas.width/Display.TEXRES))+1)*Display.TEXRES;

  context.fillStyle = "rgba(0,0,0,0.5)";
  context.fillRect(0,uplim,this.canvas.width,this.canvas.height);
  
  var x = 0, y = Display.TEXRES;
  for(var i=0;i<num;i++) {
    var st = util.sprite.getSprite(tex, i);
    context.drawImage(tex, st[0], st[1], Display.TEXRES, Display.TEXRES, x, this.canvas.height-y, Display.TEXRES, Display.TEXRES);
    x+=Display.TEXRES;
    if(x >= this.canvas.width-Display.TEXRES) {
      x=0; y+=Display.TEXRES;
    }
  }
  
  context.fillStyle = "black";
  context.fillRect(0,this.canvas.height-(y+Display.TEXRES),this.canvas.width,Display.TEXRES);
  
  context.font = Display.TEXRES + "px Arial";
  context.fillStyle = "white";
  context.textAlign = "left";
  context.fillText("  SPRITE SHEET  ", 2, this.canvas.height-(y+2));
  

  var td = td32.decode(this.game.tool.brush);
  var st = util.sprite.getSprite(tex, td.index);
  for(var xx=144;xx<this.canvas.width;xx+=Display.TEXRES) {
    context.drawImage(tex, st[0], st[1], Display.TEXRES, Display.TEXRES, xx, this.canvas.height-(y+Display.TEXRES), Display.TEXRES, Display.TEXRES);
  }
};

EditorDisplay.prototype.drawMapTool = function(data, depth) {
  var context = this.context; // Sanity
  
  var tex = this.resource.getTexture("map");
  var objTex = this.resource.getTexture("obj");
  var zone = this.game.getZone();
  var dim = zone.dimensions();
  
  /* Culling */
  var w = ((this.canvas.width/Display.TEXRES)*.55)/this.camera.scale;
  var cx0 = Math.max(0, Math.min(dim.x, parseInt(this.camera.pos.x - w)));
  var cx1 = Math.max(0, Math.min(dim.x, parseInt(this.camera.pos.x + w)));
  
  for(var i=0;i<data.length;i++) {
    var row = data[i];
    for(var j=cx0;j<cx1;j++) {
      var t = row[j];
      var td = td32.decode(t);
      if(Boolean(td.depth) !== depth) { continue; }
      var st;
      var ind = td.index;

      if (ind === 30) { continue; } // Do not render tile 30

      if (ind in TILE_ANIMATION_FILTERED) {
        var anim = TILE_ANIMATION_FILTERED[ind];
        var delay = anim.delay;
        var frame = Math.floor(this.game.frame % (anim.tiles.length * delay) / delay);
        st = util.sprite.getSprite(tex, anim.tiles[frame], true);
      } else {
        st = util.sprite.getSprite(tex, ind);
      }

      var bmp = 0;
      var adj = Math.max(0, td.bump-7);
      if(adj > 0) {
        bmp = Math.sin((1.-((adj-2)/8.))*Math.PI)*0.22;
      }
      context.drawImage(tex, st[0], st[1], Display.TEXRES, Display.TEXRES, Display.TEXRES*j, Display.TEXRES*(i-bmp), Display.TEXRES, Display.TEXRES);

      if (td.definition.NAME.includes("ITEM") || td.definition.NAME.includes("OBJECT")) {
        var obj = GameObject.OBJECT(parseInt(td.data) || 81);
        if(obj && obj.SPRITE && obj.SPRITE[0x0]) {
          var sprite = util.sprite.getSprite(objTex, obj.SPRITE[0x0].INDEX);
          context.drawImage(objTex, sprite[0x0], sprite[0x1], Display.TEXRES, Display.TEXRES, Display.TEXRES*j, Display.TEXRES*(i-bmp), Display.TEXRES, Display.TEXRES);
        }
      }

      if (td.definition.NAME.includes("COIN")) {
        var obj = GameObject.OBJECT(97);
        if(obj && obj.SPRITE && obj.SPRITE[0x0]) {
          var sprite = util.sprite.getSprite(objTex, obj.SPRITE[0x0].INDEX);
          context.drawImage(objTex, sprite[0x0], sprite[0x1], Display.TEXRES, Display.TEXRES, Display.TEXRES*j, Display.TEXRES*(i-bmp), Display.TEXRES, Display.TEXRES);
        }
      }

      if (td.definition.NAME.includes("WARP")) {
        context.fillStyle = "rgba(255,255,0,0.5)";
        context.fillRect(Display.TEXRES*j, Display.TEXRES * (i-bmp), Display.TEXRES, Display.TEXRES);

        context.font = Display.TEXRES + "px SmbWeb";
        context.fillStyle = "white";
        context.fillText(td.data, Display.TEXRES*j, Display.TEXRES*(i-bmp)+Display.TEXRES, Display.TEXRES, Display.TEXRES);
      }
    }
  }
};

EditorDisplay.prototype.drawObjectTool = function() {
  if(!this.game.tool || this.game.tool.objct === undefined) { return; }
  
  var context = this.context;
  
  var tex = this.resource.getTexture("obj");
  var zone = this.game.getZone();
  
  for(var i=0;i<zone.obj.length;i++) {
    var obj = zone.obj[i];
    var cls = GameObject.OBJECT(obj.type);
    var pos = shor2.decode(obj.pos);
        
    context.fillStyle = obj === this.game.tool.selected ? "rgba(0,255,0,0.5)" : "rgba(255,0,0,0.5)";
    context.fillRect(pos.x*Display.TEXRES,(zone.data.length-pos.y-1)*Display.TEXRES,Display.TEXRES,Display.TEXRES);
    
    if(cls && cls.SPRITE && cls.SPRITE[0]) {
      var st = util.sprite.getSprite(tex, cls.SPRITE[0].INDEX);
      context.drawImage(tex, st[0], st[1], Display.TEXRES, Display.TEXRES, pos.x*Display.TEXRES,(zone.data.length-pos.y-1)*Display.TEXRES, Display.TEXRES, Display.TEXRES);
    }
  }
};

EditorDisplay.prototype.drawSpawnpoint = function() {
  if(!this.game.tool || this.game.tool.lore === undefined) { return; }
  
  var context = this.context;

  var zone = this.game.getZone();
  
  for(var i=0;i<zone.spawnpoint.length;i++) {
    var spn = zone.spawnpoint[i];
    var pos = shor2.decode(spn.pos);
        
    context.fillStyle = spn === this.game.tool.selected ? "rgba(0,0,255,0.5)" : "rgba(255,0,0,0.5)";
    context.fillRect(pos.x*Display.TEXRES,(zone.data.length-pos.y-1)*Display.TEXRES,Display.TEXRES,Display.TEXRES);
  }
};

EditorDisplay.prototype.drawWarp = function() {
  if(!this.game.tool || this.game.tool.vore === undefined) { return; }
  
  var context = this.context;

  var zone = this.game.getZone();
  
  for(var i=0;i<zone.warp.length;i++) {
    var wrp = zone.warp[i];
    var id = wrp.id;
    var pos = shor2.decode(wrp.pos);
        
    context.font = Display.TEXRES + "px SmbWeb";
    context.fillStyle = "white";
    context.fillText(id, pos.x*Display.TEXRES, (zone.data.length-pos.y-1)*Display.TEXRES, Display.TEXRES, Display.TEXRES);

    context.fillStyle = wrp === this.game.tool.selected ? "rgba(0,0,255,0.5)" : "rgba(255,0,0,0.5)";
    context.fillRect(pos.x*Display.TEXRES,(zone.data.length-pos.y-1)*Display.TEXRES,Display.TEXRES,Display.TEXRES);
  }
};

EditorDisplay.prototype.drawLevelStart = function() {
  if(!this.game.tool) { return; }

  var context = this.context;

  var zone = this.game.getZone();
  var pos = shor2.decode(zone.initial);

  context.fillStyle = "rgba(0,255,0,0.5)";
  context.fillRect(pos.x * Display.TEXRES, (zone.dimensions().y - pos.y - 0x1) * Display.TEXRES, Display.TEXRES, Display.TEXRES);
}

EditorDisplay.prototype.drawLoad = Display.prototype.drawLoad;