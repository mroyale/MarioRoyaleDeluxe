package org.infpls.royale.server.game.session.game;

import org.infpls.royale.server.game.session.Packet;

public class PacketGBN extends Packet {
  public final int pid;
  public final boolean ban;
  public PacketGBN(int pid, boolean ban) {
    super("gbn");
    this.pid = pid;
    this.ban = ban;
  }
}