package org.infpls.royale.server.game.session.game;

import org.infpls.royale.server.game.session.Packet;

public class PacketGNM extends Packet {
  public final int pid;
  public final String name;
  public PacketGNM(int pid, String name) {
    super("gnm");
    this.pid = pid;
    this.name = name;
  }
}