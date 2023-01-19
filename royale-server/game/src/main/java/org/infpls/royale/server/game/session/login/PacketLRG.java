package org.infpls.royale.server.game.session.login;

import org.infpls.royale.server.game.session.Packet;

public class PacketLRG extends Packet {
  boolean status;
  Object msg;
  public PacketLRG(boolean status, Object msg) {
    super("lrg");
    this.status = status;
    this.msg = msg;
  }
}