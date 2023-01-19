package org.infpls.royale.server.game.session.login;

import org.infpls.royale.server.game.session.Packet;

/* Only for decoding the register packet that the client sends us. */
public class PacketLRR extends Packet {
  String username, password;
  public PacketLRR(String username, String password) {
    super("lrg");
    this.username = username;
    this.password = password;
  }
}