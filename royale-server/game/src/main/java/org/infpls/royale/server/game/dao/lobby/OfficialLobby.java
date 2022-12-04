package org.infpls.royale.server.game.dao.lobby;

import java.io.IOException;

public class OfficialLobby extends GameLobby {
  public OfficialLobby(boolean priv, String roomCode) throws IOException {
    super(priv, roomCode);
  }
}
