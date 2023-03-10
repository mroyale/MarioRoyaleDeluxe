"use strict";
/* global app */

function MenuGame() {
  this.element = document.getElementById("game");

  this.devConsoleToggle = document.getElementById("devConsole-showHide");
  this.devConsoleMain = document.getElementById("devConsole-main");
  this.devConsolePlayerList = document.getElementById("devConsole-playerList");
  this.devConsoleOn = false;
  this.devConsoleRenameForm = document.getElementById("devConsole-renameForm");
  this.devConsoleRenameField = document.getElementById("devConsole-renameField");
  this.selectedPlayerId = null;
  this.renamingPlayerId = null;
  this.selectedPlayerTr = null;
  
  var that = this;
  this.devConsoleToggle.onclick = function (e) {
    if (that.devConsoleOn) {
      that.devConsoleOn = false;
      that.devConsoleMain.style.display = "none";
      e.target.innerText = "DEV>";
    } else {
      that.devConsoleOn = true;
      that.devConsoleMain.style.display = "";
      e.target.innerText = "DEV<";
    }
  }

  document.getElementById("devConsole-kick").onclick = function () { that.kickPlayer() };
  document.getElementById("devConsole-ban").onclick = function () { that.banPlayer() };
  document.getElementById("devConsole-rename").onclick = function () { that.startRenamePlayer() };
  document.getElementById("devConsole-renameDone").onclick = function () { that.finishRenamePlayer() };
  document.getElementById("devConsole-forceStart").onclick = function () { app.net.send({ 'type': 'gfs' }) }
};

MenuGame.prototype.show = function() {
  app.menu.hideAll();
  app.menu.navigation("game", "game");
  app.menu.background("c");
  this.element.style.display = "block";
};

MenuGame.prototype.updatePlayerList = function (playerList) {
  var stillSelected = false;
  this.selectedPlayerTr = null;
  this.devConsolePlayerList.innerHTML = "";
  var tbl = document.createElement("table");
  tbl.style.color = "white";
  this.devConsolePlayerList.appendChild(tbl);
  var trh = document.createElement("tr");
  tbl.appendChild(trh);
  ["id", "account", "nickname"].map(x => { var th = document.createElement("th"); th.innerText = x; trh.appendChild(th); });
  var that = this;
  for (var player of playerList) {
      var tr = document.createElement("tr");
      tbl.append(tr);
      [player.id, player.username, player.name].map(x => { var td = document.createElement("td"); td.innerText = "" + x; tr.appendChild(td); });
      tr.playerId = player.id;
      if (this.selectedPlayerId == player.id) {
          stillSelected = true;
          tr.style.color = "yellow";
          this.selectedPlayerTr = tr;
      }
      tr.onclick = (function (tr) {
          return function (e) {
              if (that.selectedPlayerTr) {
                  that.selectedPlayerTr.style.color = "";
              }
              tr.style.color = "yellow";
              that.selectedPlayerId = tr.playerId;
              that.selectedPlayerTr = tr;
          }
      })(tr);
  }
  if (!stillSelected) this.selectedPlayerId = null;
};

MenuGame.prototype.kickPlayer = function () {
  if (this.selectedPlayerId === null) return;
  app.game.send({
      'type': "gbn",
      'pid': this.selectedPlayerId,
      'ban': false
  });
};

MenuGame.prototype.banPlayer = function () {
  if (this.selectedPlayerId === null) return;
  app.game.send({
      'type': "gbn",
      'pid': this.selectedPlayerId,
      'ban': true
  });
};

MenuGame.prototype.startRenamePlayer = function () {
  if (this.selectedPlayerId === null) return;
  this.renamingPlayerId = this.selectedPlayerId;
  var playerInfo = app.game.getPlayerInfo(this.selectedPlayerId);
  this.devConsoleRenameField.value = playerInfo.name;
  this.devConsoleRenameForm.style.display = "";
};

MenuGame.prototype.finishRenamePlayer = function () {
  if (this.selectedPlayerId === null) return;
  var newName = this.devConsoleRenameField.value;
  if (newName === "") return;
  app.game.send({
      'type': "gnm",
      'pid': this.renamingPlayerId,
      'name': newName
  });
  this.renamingPlayerId = null;
  this.devConsoleRenameForm.style.display = "none";
};

MenuGame.prototype.hide = function() {
  this.element.style.display = "none";
};

/* Called when the back button is hit on this menu */
MenuGame.prototype.onBack = function() {
  app.close();
};