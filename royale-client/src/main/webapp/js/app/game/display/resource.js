"use strict";
/* global app */

/* Stores all texture data */

/* src param is structured as follows */
/* [{id: "map", src: <url>},{id: "m_jump", src: <url>}] */

function Resource(src) {
  this.texture = {
    cache: {},
    load: 0
  };  
  this.load(src);
}

Resource.prototype.load = function (src) {
  for(var i=0;i<src.length;i++) {
    var s = src[i];
    var ext = s.src.split(".").pop().toLowerCase();
    switch(ext) {
      case "png" : { this.loadTexture(s); break; }
      case "gif" : { this.loadTexture(s); break; }
      default : { app.menu.warn.show("Failed to load resource with unknown extension: " + ext); break; }
    }
  }
};

Resource.prototype.loadAnimatedTexture = function (src) {
  var tex = this.texture;
  if(tex.cache[src.id]) { return; }
  else {
    function imageDataToImageElement(imageData) {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      canvas.width = imageData.width;
      canvas.height = imageData.height;
    
      // Get a context for the canvas
      const context = canvas.getContext('2d');
    
      // Put the image data into the canvas
      context.putImageData(imageData, 0, 0);
    
      // Create an image element from the canvas
      const imageElement = new Image();
      imageElement.src = canvas.toDataURL();
      return imageElement;
    }

    var img = document.createElement("img");
    img.src = src.src;
    
    var frames = [];
    var delay = 10;
    var gif;

    function loadGif() {
      for (var i=0; i<gif.get_length(); i++) {
        var length = gif.get_length();
        var framers = gif.get_frames();
        var frame = framers[parseInt(Math.random()*length)];
    
        delay = frame.delay; // Just assign it to whatever the last one is
        var img = imageDataToImageElement(frame.data); // Convert to an image element so that it can be drawn with drawImage
        frames.push(img);
      }
    
      tex.cache[src.id] = {}
      tex.cache[src.id].animated = true;
      tex.cache[src.id].frames = frames;
      tex.cache[src.id].delay = delay;
      tex.cache[src.id].length = frames.length;
      tex.load--;
    };
  

    img.onload = function() {
      gif = new SuperGif({ gif: img });
      gif.load(loadGif);
    };
    
    tex.load++;
  }
};

Resource.prototype.loadTexture = function(src) {
  var tex = this.texture;
  if(tex.cache[src.id]) { return; }  // Skip if already loaded.
  else {
    var img = new Image();
    img.onload = function() {
      tex.cache[src.id] = img;
      tex.load--;
    };
    img.src = src.src;
    tex.load++;
  }
};

/* This function can make a new texture and update it at the same time. Truly cool */
Resource.prototype.updateTexture = function(src) {
  var tex = this.texture;

  var img = new Image();
  img.onload = function() {
    tex.cache[src.id] = img;
    tex.load--;
  };
  img.onerror = function(e) {
    console.error(e)
    tex.load--;
  };
  img.src = src.src;
  tex.load++;
}

/* Retrieves a texture by it's ID */
Resource.prototype.getTexture = function(id) {
  return this.texture.cache[id];
};

/* Returns true if all resources are done loading */
Resource.prototype.ready = function() {
  return this.texture.load === 0;
};