package org.infpls.royale.server.game.dao.lobby;

import java.io.IOException;
import java.util.*;
import java.lang.String;

import java.io.FileWriter;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileNotFoundException;

import com.google.gson.*;
import com.google.common.hash.Hashing;
import java.nio.charset.StandardCharsets;

import org.infpls.royale.server.util.Oak;
import org.infpls.royale.server.util.Key;
import org.infpls.royale.server.game.session.RoyaleAccount;

public class LobbyDao {
  private final List<GameLobby> lobbies;
  private GameLobby jail;

  private final List<RoyaleAccount> accounts; /* List of all accounts present in the Mario Royale Deluxe database */
  private final HashMap<String, String> loggedIn; /* Session tokens of players that have logged in */
  
  public LobbyDao() {
    lobbies = new ArrayList();
    try { jail = new JailLobby(); jail.start(); }
    catch(IOException ioex) {
      Oak.log(Oak.Level.CRIT, "Failed to start jail lobby!");
    }

    /* insert mongodb connecting shit and initializing the accounts */
    accounts = Collections.synchronizedList(new ArrayList());
    loggedIn = new HashMap<String, String>();
  }
  
  public RoyaleAccount findAccount(String username) {
    for(int i=0;i<accounts.size();i++) {
      final RoyaleAccount account = accounts.get(i);
      if (account.username.equals(username)) {
        return account;
      }
    }

    return null;
  }

  public String addToken(String username) {
    String newToken = Key.generate32();
    loggedIn.put(newToken, username);
    return newToken;
  }

  public void removeToken(String token) {
    loggedIn.remove(token);
  }

  public String findToken(String token) {
    return loggedIn.get(token);
  }

  public RoyaleAccount createAccount(String username, String password) {
    String hashedPassword = Hashing.sha256()
      .hashString(password, StandardCharsets.UTF_8)
      .toString();

    RoyaleAccount account = new RoyaleAccount(hashedPassword, username, username, "", 0, 0, 0, 0, 0);
    accounts.add(account);
    saveDatabase();
    return account;
  }

  /* Save database to file */
  public void saveDatabase() {
    try {
      // Create new file
      Gson gson = new GsonBuilder().create();
      File file = new File("database.txt");

      FileWriter fw = new FileWriter("database.txt");
      BufferedWriter bw = new BufferedWriter(fw);

      // Write in file
      bw.write(gson.toJson(accounts));
      System.out.println("Saved database " + gson.toJson(accounts));

      // Close connection
      bw.flush();
      bw.close();

      try {
        File myObj = new File("database.txt");
        Scanner myReader = new Scanner(myObj);
        while (myReader.hasNextLine()) {
          String data = myReader.nextLine();
          System.out.println(data);
        }
        myReader.close();
      } catch (FileNotFoundException e) {
        System.out.println("An error occurred.");
        e.printStackTrace();
      }
    }
    catch(Exception e){
      System.out.println(e);
    }
  }

  public GameLobby createLobby(boolean priv, String code) throws IOException {
    GameLobby lobby = new OfficialLobby(priv, code);
    lobbies.add(lobby);
    lobby.start();
    return lobby;
  }

  /* Returns a lobby with open space for a player to join. */
  public GameLobby findLobby(boolean priv, int mode) throws IOException {
    cleanUp();
    String[] GAMEMODES = { "vanilla", "pvp" };
    //if(mode < 0 || mode >= GAMEMODES.length) { mode = 0; }
    String gameMode = GAMEMODES[mode];

    if (priv) { return createLobby(true, gameMode); }

    for(int i=0;i<lobbies.size();i++) {
      final GameLobby lobby = lobbies.get(i);

      if(!lobby.isFull() && !lobby.isLocked() && lobby.getMode() == gameMode) {
        return lobby;
      }
    }
    final GameLobby lobby = createLobby(priv, gameMode);
    return lobby;
  }
  
  public GameLobby getJail() {
    return jail;
  }
 
  /* This method deletes any user created lobbies that are flagged as closed. */
  public void cleanUp() {
    for(int i=0;i<lobbies.size();i++) {
      if(lobbies.get(i).isClosed()) {
        lobbies.remove(i--);
      }
    }
  }

  public void destroy() {
    try {
      for(int i=0;i<lobbies.size();i++) {
        lobbies.get(i).close("Game server is shutting down...");
      }
    }
    catch(IOException ex) {
      Oak.log(Oak.Level.ERR, "Error during server shutdown.", ex);
    }
  }
}
