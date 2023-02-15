package org.infpls.royale.server.home.controller;

import java.util.*;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import org.infpls.royale.server.game.dao.DaoContainer;
import org.infpls.royale.server.game.session.RoyaleAccount;
import org.infpls.royale.server.game.session.LeaderboardAccount;

@Controller
public class LeaderboardController {
  @Autowired
  private DaoContainer dao;
  
  @RequestMapping(value = "/leaderboards", method = RequestMethod.GET, produces = "application/json")
  public @ResponseBody ResponseEntity getLeaderboard() {
    final Gson gson = new GsonBuilder().create();
    final Map<String, List<LeaderboardAccount>> top = dao.getLobbyDao().getLeaderboards();

    return new ResponseEntity(gson.toJson(top), HttpStatus.OK);
  }
}