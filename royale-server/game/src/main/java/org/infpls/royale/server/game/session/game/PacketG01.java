package org.infpls.royale.server.game.session.game;

import org.infpls.royale.server.game.session.Packet;

public class PacketG01 extends Packet {
  final String game;
  final boolean deathmatch;
  public PacketG01(String game, boolean deathMatch) {
    super("g01");
    this.game = game;
    this.deathmatch = deathMatch;
  }
}
