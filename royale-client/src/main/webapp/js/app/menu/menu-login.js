"use strict";
/* global app */

function MenuLogin() {
  this.element = document.getElementById("login");
  this.backElement = document.getElementById("login-back");

  this.linkElement = document.getElementById("link");

  this.backElement.onclick = function() {
      app.loggedIn() ? app.menu.main.show() : app.menu.main.show(); // no accounts yet so it doesn't matter
  }
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