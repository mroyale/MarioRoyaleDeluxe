package org.infpls.royale.server.home.controller;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import org.infpls.royale.server.game.dao.DaoContainer;

@Controller
public class StatusController {
  @Autowired
  private DaoContainer dao;
  
  @RequestMapping(value = "/status", method = RequestMethod.GET, produces = "application/json")
  public @ResponseBody ResponseEntity getStatus() {
    final Gson gson = new GsonBuilder().create();
    final Status status = new Status(dao.getUserDao().getOnlineUserCount(0), dao.getUserDao().getOnlineUserCount(1));
    return new ResponseEntity(gson.toJson(status), HttpStatus.OK);
  }
  
  public class Status {
    public final String result;
    public final int playersVanilla, playersPVP;
    public Status(int van, int pvp) {
      result = null;
      playersVanilla = van;
      playersPVP = pvp;
    }
    
    public Status(int van, int pvp, String errorMessage) {
      result = errorMessage;
      playersVanilla = van;
      playersPVP = pvp;
    }
  }
}
