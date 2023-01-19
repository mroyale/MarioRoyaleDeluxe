package org.infpls.royale.server.game.session.login;

import org.infpls.royale.server.game.session.Packet;

public class PacketLLG extends Packet {
  boolean status;
  Object msg;
  public PacketLLG(boolean status, Object msg) {
    super("llg");
    this.status = status;
    this.msg = msg;
  }
}
