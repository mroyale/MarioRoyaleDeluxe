"use strict";
/* global app */

function MenuRegister() {
  this.element = document.getElementById("register");
  this.backElement = document.getElementById("register-back");
  this.linkElement = document.getElementById("link");

  this.backElement.onclick = function() {
      app.loggedIn() ? app.menu.main.show() : app.menu.main.show(); // no accounts yet so it doesn't matter
  }
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