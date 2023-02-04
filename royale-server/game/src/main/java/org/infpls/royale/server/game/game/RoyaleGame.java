package org.infpls.royale.server.game.game;

import java.io.IOException;
import java.util.List;
import org.infpls.royale.server.game.dao.lobby.GameLobby;
import org.infpls.royale.server.game.session.game.PacketG06;
import org.infpls.royale.server.game.session.game.PacketG13;
import org.infpls.royale.server.game.session.game.PacketG14;
import org.infpls.royale.server.game.session.game.PacketGWN;

public class RoyaleGame extends RoyaleCore {
  
  private final static int START_DELAY = 210;
  private final static int MAX_DM_AGE = 9000; // 5 minutes
  private final static int DM_EXTENDED_TIME = 1800; // 1 minute

  private boolean extendedDM;
  private boolean minuteLeft;
  
  protected byte place = 0x00;
  
  private int startTimer;
  private int age;
  private boolean deathmatch;
  
  public RoyaleGame(boolean deathMatch) {
    super();
    
    startTimer = 0;
    extendedDM = false;
    minuteLeft = false;
    deathmatch = deathMatch;
  }
  
  @Override
  public void input(List<GameLobby.InputData> inputs) {
    if(startTimer >= 0) {
      if(startTimer >= START_DELAY) { startTimer = -1; send(new PacketG13(0)); }
      else if(startTimer++ % 30 == 0) { send(new PacketG13(START_DELAY-startTimer)); }
      return;
    } else if(deathmatch) {
      
    }
    
    super.input(inputs);
  }

  @Override
  public void update() throws IOException {
    super.update();
  }
  
  @Override
  public byte winRequest(boolean inc) {
    if(!inc) { return (byte)(place+0x01); }
    place = (byte)Math.min(place+1, 99);
    return place;
  }
}
