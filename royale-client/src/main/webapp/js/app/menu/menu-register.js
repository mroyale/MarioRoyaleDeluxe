"use strict";
/* global app */

function MenuRegister() {
  this.element = document.getElementById("register");
  this.backElement = document.getElementById("register-back");
  this.resultElement = document.getElementById("register-error");

  this.nameElement = document.getElementById("register-name");
  this.passElement = document.getElementById("register-pass");
  this.verifyElement = document.getElementById("register-verify");
  this.registerBtn = document.getElementById("register-signup");

  this.linkElement = document.getElementById("link");

  var that = this;
  this.backElement.onclick = function() { app.menu.main.show(); }
  this.registerBtn.onclick = function() { that.register(); }
};

MenuRegister.prototype.reportError = function(msg) {
  this.resultElement.innerText = msg;
};

MenuRegister.prototype.register = function() {
  var name = this.nameElement.value;
  var pass = this.passElement.value;
  var verify = this.verifyElement.value;

  if (name.length < 4) { this.reportError("Username is too short"); return; }
  if (name.length > 20) { this.reportError("Username is too long"); return; }
  if (pass.length < 4) { this.reportError("Password is too short"); return; }
  if (pass != verify) { this.reportError("Passwords don't match"); return; }
  
  app.register(name, pass);
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