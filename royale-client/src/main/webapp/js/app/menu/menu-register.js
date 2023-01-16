"use strict";
/* global app */

function MenuRegister() {
  this.element = document.getElementById("register");
  this.linkElement = document.getElementById("link");
};

MenuRegister.prototype.show = function(number) {
  app.menu.hideAll();
  app.menu.background("a");
  app.menu.navigation("register", "register");
  this.linkElement.style.display = "";
  this.element.style.display = "block";
};

MenuRegister.prototype.hide = function() {
  this.linkElement.style.display = "none";
  this.element.style.display = "none";
};