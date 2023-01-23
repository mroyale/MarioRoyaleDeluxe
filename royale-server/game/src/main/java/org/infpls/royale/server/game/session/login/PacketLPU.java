package org.infpls.royale.server.game.session.login;

import org.infpls.royale.server.game.session.Packet;

/* Only for decoding the register packet that the client sends us. */
public class PacketLPU extends Packet {
  int character;
  public PacketLPU(int character) {
    super("lpu");
    this.character = character;
  }
}