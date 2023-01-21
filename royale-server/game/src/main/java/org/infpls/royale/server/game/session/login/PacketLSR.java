package org.infpls.royale.server.game.session.login;

import org.infpls.royale.server.game.session.Packet;

/* Only for decoding the "resume session" packet the client sends us */
public class PacketLSR extends Packet {
  String session;
  public PacketLSR(String session) {
    super("lrs");
    this.session = session;
  }
}