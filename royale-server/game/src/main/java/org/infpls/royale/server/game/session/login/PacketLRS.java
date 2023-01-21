package org.infpls.royale.server.game.session.login;

import org.infpls.royale.server.game.session.Packet;

public class PacketLRS extends Packet {
  boolean status;
  Object msg;
  public PacketLRS(boolean status, Object msg) {
    super("lrs");
    this.status = status;
    this.msg = msg;
  }
}