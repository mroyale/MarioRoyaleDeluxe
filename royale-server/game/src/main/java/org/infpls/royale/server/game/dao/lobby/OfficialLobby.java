package org.infpls.royale.server.game.dao.lobby;

import java.io.IOException;

public class OfficialLobby extends GameLobby {
  public OfficialLobby(boolean priv, String gameMode) throws IOException {
    super(priv, gameMode);
  }
}
