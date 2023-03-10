package org.infpls.royale.server.game.game;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.*;
import org.infpls.royale.server.game.dao.lobby.GameLobby;
import org.infpls.royale.server.game.session.*;
import org.infpls.royale.server.game.session.game.*;

public abstract class RoyaleCore {
  public final List<Controller> controllers;
  
  protected int frame;
  
  public RoyaleCore() {
    controllers = new ArrayList();
  }
  
  /* Handle data from client about their current playstate */
  public void input(List<GameLobby.InputData> inputs) {
    for(int i=0;i<inputs.size();i++) {
      final GameLobby.InputData input = inputs.get(i);
      final Controller controller = getController(input.session);
      if(controller ==  null) { continue; }
      controller.input(input.data);
    }
  }
  
  /* Sends information to the client about the current gamestate */
  public void update() throws IOException {
    frame++;
    
    boolean regenList = false;
    
    List<ByteMe.NETX> local = new ArrayList();
    List<ByteMe.NETX> global = new ArrayList();
    for(int i=0;i<controllers.size();i++) {
      final Controller controller = controllers.get(i);
      if(controller.garbage) {
        controllers.remove(i--);
        if(!(controller.result > 0 && controller.result < 4)) { global.add(new ByteMe.NET011(controller.pid)); }
        regenList = true;
        continue;
      } 
      controller.update(local, global);
    }
    
    ByteBuffer lbb = ByteMe.encode(local);
    ByteBuffer gbb = ByteMe.encode(global);
    
    send(lbb);
    send(gbb);
    
    if(!regenList) { return; }
    
    // Regenerate player list
    final List<PacketG12.NamePair> players = new ArrayList();
    for(int i=0;i<controllers.size();i++) {
      final Controller c = controllers.get(i);
      if(c.session.getAccount() != null) {
        players.add(new PacketG12.NamePair(c.pid, c.session.getAccount().getUsername(), c.getName(), c.isDev()));
      } else {
        players.add(new PacketG12.NamePair(c.pid, "[ Guest ]", c.getName(), c.isDev()));
      }
    }
    send(new PacketG12(players));
  }
  
  /* Player Join */
  public void join(RoyaleSession session) throws IOException {
    final Controller controller = new Controller(this, session, createPid());
    controllers.add(controller);
    
    // Send inital packet
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    baos.write(new ByteMe.NET001(controller.pid).encode().array());
    for(int i=0;i<controllers.size();i++) {
      final Controller c = controllers.get(i);
      if(!c.dead) {
        baos.write(new ByteMe.NET010(c.pid, c.level, c.zone, Shor2.encode(c.position), c.character).encode().array());
      }
    }
    ByteBuffer bb = ByteBuffer.wrap(baos.toByteArray());
    baos.close();
    
    controller.send(bb.array());
    
    // Regenerate player list
    final List<PacketG12.NamePair> players = new ArrayList();
    for(int i=0;i<controllers.size();i++) {
      final Controller c = controllers.get(i);
      if(c.session.getAccount() != null) {
        players.add(new PacketG12.NamePair(c.pid, c.session.getAccount().getUsername(), c.getName(), c.isDev()));
      } else {
        players.add(new PacketG12.NamePair(c.pid, "[ Guest ]", c.getName(), c.isDev()));
      }
    }
    send(new PacketG12(players));
  }

  /* Regenerate Player List */
  public void regenList() {
    // Regenerate player list
    final List<PacketG12.NamePair> players = new ArrayList();
    for(int i=0;i<controllers.size();i++) {
      final Controller c = controllers.get(i);
      if(c.session.getAccount() != null) {
        players.add(new PacketG12.NamePair(c.pid, c.session.getAccount().getUsername(), c.getName(), c.isDev()));
      } else {
        players.add(new PacketG12.NamePair(c.pid, "[ Guest ]", c.getName(), c.isDev()));
      }
    }
    send(new PacketG12(players));
  }
  
  /* Player Leave */
  public void leave(RoyaleSession session) {
    final Controller controller = getController(session);
    if(controller == null) { return; }
    
    controller.destroy();
  }
  
  public Controller getController(RoyaleSession session) {
    for(int i=0;i<controllers.size();i++) {
      final Controller controller = controllers.get(i);
      if(controller.session == session) {
        return controller;
      }
    }
    return null;
  }
  
  public Controller getController(short pid) {
    for(int i=0;i<controllers.size();i++) {
      final Controller controller = controllers.get(i);
      if(controller.pid == pid) {
        return controller;
      }
    }
    return null;
  }
  
  public abstract byte winRequest(boolean inc);
  
  public void send(Packet p) {
    for(int i=0;i<controllers.size();i++) {
      final Controller controller = controllers.get(i);
      controller.send(p);
    }
  }
  
  public void send(ByteBuffer bb) {
    final byte[] bytez = bb.array().clone(); /* @TODO: Experimental performance improvement, use same byte array for all threads */
    for(int i=0;i<controllers.size();i++) {
      final Controller controller = controllers.get(i);
      controller.send(bytez);
    }
  }
  
  private short nxtPid;
  private short createPid() {
    return nxtPid++;
  }
  
  /* Called when game is over and lobby is closing */
  public void destroy() {
    
  }
}
