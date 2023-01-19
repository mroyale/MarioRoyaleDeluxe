"use strict";
/* global app */

function MenuLogin() {
  this.element = document.getElementById("login");
  this.backElement = document.getElementById("login-back");
  this.resultElement = document.getElementById("login-error");

  this.nameElement = document.getElementById("login-name");
  this.passElement = document.getElementById("login-pass");
  this.loginElement = document.getElementById("login-signin");

  this.linkElement = document.getElementById("link");

  var that = this;
  this.backElement.onclick = function() { app.menu.main.show(); }
  this.loginElement.onclick = function() { that.login(); }
};

MenuLogin.prototype.reportError = function(msg) {
  this.resultElement.innerText = msg;
};

MenuLogin.prototype.login = function() {
  var name = this.nameElement.value;
  var pass = this.passElement.value;

  if (name.length < 4) { this.reportError("Username is too short"); return; }
  if (name.length > 20) { this.reportError("Username is too long"); return; }
  if (pass.length < 4) { this.reportError("Password is too short"); return; }
  
  app.login(name, pass);
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