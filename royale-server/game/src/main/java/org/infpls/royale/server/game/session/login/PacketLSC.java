package org.infpls.royale.server.game.session.login;

import org.infpls.royale.server.game.session.Packet;

/* Only for decoding the "resume session" packet the client sends us */
public class PacketLSC extends Packet {
  Object leaderboards;
  public PacketLSC(Object leaderboards) {
    super("lsc");
    this.leaderboards = leaderboards;
  }
}