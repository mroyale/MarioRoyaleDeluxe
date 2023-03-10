package org.infpls.royale.server.game.session.game;

import java.util.*;
import org.infpls.royale.server.game.session.Packet;

public class PacketG12 extends Packet {
  public final List<NamePair> players;
  public PacketG12(List<NamePair> players) {
    super("g12");
    this.players = players;
  }
  
  public static class NamePair {
    public final short id;
    public final String username, name;
    public final boolean isDev;
    public NamePair(short id, String username, String name, boolean isDev) {
      this.id = id; this.username = username; this.name = name; this.isDev = isDev;
    }
  }
}
