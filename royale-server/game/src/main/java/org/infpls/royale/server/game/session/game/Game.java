package org.infpls.royale.server.game.session.game;

import com.google.gson.*;
import java.io.IOException;
import java.nio.ByteBuffer;

import org.infpls.royale.server.game.dao.lobby.GameLobby;
import org.infpls.royale.server.game.session.Packet;
import org.infpls.royale.server.game.session.PacketS00;
import org.infpls.royale.server.game.session.RoyaleSession;
import org.infpls.royale.server.game.session.SessionState;
import org.infpls.royale.server.game.game.Controller;
import org.infpls.royale.server.util.Oak;

public class Game extends SessionState {
  
  private final GameLobby lobby;
  
  public Game(final RoyaleSession session, final GameLobby lobby) throws IOException {
    super(session);
    
    this.lobby = lobby;
    
    sendPacket(new PacketS00('g'));
  }
  
  /* Packet Info [ < outgoing | > incoming ]
    > g00 ready to join
    < g01 what to load (from lobby)
    > g03 loaddone, ready
    < g06 lobby global warning
    < g10 gamestate initial (on join)
    < g11 gamestate update
    < g12 player list update (when someone joins)
    < g13 game start countdown timer update
    = g21 ping
    > g50 vote ready
    > gbn kick/ban player (dev only)
    > gnm rename player (dev only)
    > gfs force start (dev only)
  */
  
  @Override
  public void handlePacket(final String data) throws IOException {
    try {
      final Gson gson = new GsonBuilder().create();
      Packet p = gson.fromJson(data, Packet.class);
      if(p.getType() == null) { close("Invalid data: NULL TYPE"); return; } //Switch statements throw NullPointer if this happens.
      switch(p.getType()) {
        /* Session Type Packets gxx */
        case "g00" : { clientJoin(gson.fromJson(data, PacketG01.class)); break; }
        case "g02" : { close(); break; }
        case "g03" : { clientReady(gson.fromJson(data, PacketG03.class)); break; }
        case "g21" : { ping(gson.fromJson(data, PacketG21.class)); break; }
        case "g50" : { voteReady(gson.fromJson(data, PacketG50.class)); break; }
        case "gbn" : { banPlayer(gson.fromJson(data, PacketGBN.class)); break; }
        case "gnm" : { renamePlayer(gson.fromJson(data, PacketGNM.class)); break; }
        case "gfs" : { forceStart(gson.fromJson(data, PacketGFS.class)); break; }
        
        /* Input Type Packets nxx */
        
        default : { close("Invalid data: " + p.getType()); break; }
      }
    } catch(Exception ex) { /* IOException | NullPointerException | JsonParseException */
      Oak.log(Oak.Level.WARN, "User: '" + session.getUser() + "' threw Unknown Exception", ex);
      close(ex);
    }
  }
  
  @Override
  public void handleBinary(final ByteBuffer data) throws IOException {
    lobby.pushInput(session, data);
  }
  
  private void clientJoin(PacketG01 p) throws IOException {
    lobby.pushEvent(new SessionEvent(session, SessionEvent.Type.JOIN));
  }
  
  private void clientReady(PacketG03 p) throws IOException {
    lobby.pushEvent(new SessionEvent(session, SessionEvent.Type.READY));
  }

  private void ping(PacketG21 p) throws IOException { sendPacket(p); }
  
  private void voteReady(PacketG50 p) throws IOException {
    lobby.pushEvent(new SessionEvent(session, SessionEvent.Type.VOTE));
  };

  private void banPlayer(PacketGBN p) throws IOException {
    if(session.getAccount() != null) {
      if(!session.isDev()) { return; }

      Controller controller = lobby.getController(p.pid);
      if(p.ban) {
        controller.strike((p.ban?"Banned":"Kicked") + " by developer " + session.getAccount().getUsername());
      }
      controller.session.close((p.ban?"Banned":"Kicked") + " by developer " + session.getAccount().getUsername());
    }
  };

  private void renamePlayer(PacketGNM p) throws IOException {
    if(session.getAccount() != null) {
      if(!session.isDev()) { return; }

      Controller controller = lobby.getController(p.pid);
      if(controller.session.getAccount() != null) {
        controller.session.getAccount().updateName(p.name);
      }
      controller.session.name = p.name;

      lobby.game.regenList();
    }
  }

  private void forceStart(PacketGFS p) throws IOException {
    lobby.pushEvent(new SessionEvent(session, SessionEvent.Type.START));
  };
  
  /* See RoyaleSession for details. Don't call this without good reason. */
  public void eject() {
    lobby.pushEvent(new SessionEvent(session, SessionEvent.Type.EJECT));
  }
  
  @Override
  public void destroy() throws IOException {
    lobby.pushEvent(new SessionEvent(session, SessionEvent.Type.DISCONNECT));
  }
}
