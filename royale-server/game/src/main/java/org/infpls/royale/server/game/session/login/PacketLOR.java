package org.infpls.royale.server.game.session.login;

import org.infpls.royale.server.game.session.Packet;

/* Only for decoding the logout packet that the client sends us. */
public class PacketLOR extends Packet {
  String session;
  public PacketLOR(String session) {
    super("llo");
    this.session = session;
  }
}