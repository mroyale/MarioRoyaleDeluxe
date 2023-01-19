package org.infpls.royale.server.game.session.login;

import org.infpls.royale.server.game.session.Packet;

/* Only for decoding the login packet that the client sends us. */
public class PacketLLR extends Packet {
  String username, password;
  public PacketLLR(String username, String password) {
    super("llg");
    this.username = username;
    this.password = password;
  }
}