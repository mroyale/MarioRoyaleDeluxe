package org.infpls.royale.server.home.controller;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import org.infpls.royale.server.game.dao.DaoContainer;
import org.infpls.royale.server.game.session.RoyaleAccount;

@Controller
public class AccountController {
  @Autowired
  private DaoContainer dao;
  
  @RequestMapping(value = "/profile", method = RequestMethod.GET, produces = "application/json")
  public @ResponseBody ResponseEntity getStatus(@RequestParam String name) {
    final Gson gson = new GsonBuilder().create();
    final RoyaleAccount acc = dao.getLobbyDao().findAccount(name.toUpperCase());
    if (acc == null) {
        return new ResponseEntity(gson.toJson(new Account("Profile not found.")), HttpStatus.NOT_FOUND);
    }

    final Account account = new Account(acc.getNickname(), acc.getWins(), acc.getCoins(), acc.getDeaths(), acc.getKills(), acc.getCharacter());
    return new ResponseEntity(gson.toJson(account), HttpStatus.OK);
  }
  
  public class Account {
    public String nickname, squad, error;
    public int wins, coins, deaths, kills, character;
    public Account(String nickname, int wins, int coins, int deaths, int kills, int character) {
        this.nickname = nickname;
        this.wins = wins;
        this.coins = coins;
        this.deaths = deaths;
        this.kills = kills;
        this.character = character;
        error = null;
    }

    public Account(String result) {
        error = result;
    }
  }
}
