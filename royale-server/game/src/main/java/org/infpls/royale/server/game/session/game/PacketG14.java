package org.infpls.royale.server.game.session.game;

import org.infpls.royale.server.game.session.Packet;

public class PacketG14 extends Packet {
  public final String message;
  public final boolean hurry;
  public PacketG14(String message, boolean hurry) {
    super("g14");
    this.message = message;
    this.hurry = hurry;
  }
}