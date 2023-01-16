"use strict";
/* global app */

function MenuLogin() {
  this.element = document.getElementById("login");
  this.linkElement = document.getElementById("link");
};

MenuLogin.prototype.show = function(number) {
  app.menu.hideAll();
  app.menu.background("a");
  app.menu.navigation("login", "login");
  this.linkElement.style.display = "";
  this.element.style.display = "block";
};

MenuLogin.prototype.hide = function() {
  this.linkElement.style.display = "none";
  this.element.style.display = "none";
};