package org.infpls.royale.server.game.session.login;

import org.infpls.royale.server.game.session.Packet;

/* Only for decoding the register packet that the client sends us. */
public class PacketLPU extends Packet {
  int character;
  String nickname;
  String error;
  public PacketLPU(int character, String nickname) {
    super("lpu");
    this.character = character;
    this.nickname = nickname;
    this.error = null;
  }

  public PacketLPU(int character, String nickname, String error) {
    super("lpu");
    this.character = character;
    this.nickname = nickname;
    this.error = error;
  }
}