package org.infpls.royale.server.game.session.login;

import org.infpls.royale.server.game.session.Packet;

/* Only for decoding the register packet that the client sends us. */
public class PacketLCP extends Packet {
  String password;
  String error;
  public PacketLCP(String password) {
    super("lcp");
    this.password = password;
    this.error = null;
  }

  public PacketLCP(String password, String error) {
    super("lcp");
    this.password = password;
    this.error = error;
  }
}