package org.infpls.royale.server.game.session.login;

import org.infpls.royale.server.game.session.Packet;

public class PacketL01 extends Packet {
  public final String sid, name, team;
  public final boolean priv;
  public PacketL01(String sid, String name, String team, boolean priv) {
    super("l01");
    this.sid = sid;
    this.name = name;
    this.team = team;
    this.priv = priv;
  }
}
