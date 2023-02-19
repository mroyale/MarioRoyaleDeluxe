package org.infpls.royale.server.game.session.login;

import com.google.gson.*;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.*;
import org.infpls.royale.server.game.dao.lobby.GameLobby;

import com.google.common.hash.Hashing;
import java.nio.charset.StandardCharsets;

import org.infpls.royale.server.game.dao.lobby.LobbyDao;
import org.infpls.royale.server.game.session.*;

import org.infpls.royale.server.util.Filter;

public class Login extends SessionState {
  
  private final LobbyDao lobbyDao;
  
  public Login(final RoyaleSession session, final LobbyDao lobbyDao) throws IOException {
    super(session);
    
    this.lobbyDao = lobbyDao;
    
    sendPacket(new PacketS00('l'));
  }
  
  /* Packet Info [ < outgoing | > incoming ]
     > l00 user ready (login)
     < l01 sid and name
     > l02 close
     > llg account login
  */
  
  @Override
  public void handlePacket(final String data) throws IOException {
    try {
      final Gson gson = new GsonBuilder().create();
      Packet p = gson.fromJson(data, Packet.class);
      if(p.getType() == null) { close("Invalid data: NULL TYPE"); return; } //Switch statements throw Null Pointer if this happens.
      switch(p.getType()) {
        case "l00" : { login(gson.fromJson(data, PacketL00.class)); break; }
        case "l02" : { close(); break; }
        case "llg" : { accountLogin(gson.fromJson(data, PacketLLR.class)); break; }
        case "lrg" : { accountRegister(gson.fromJson(data, PacketLRR.class)); break; }
        case "lrs" : { accountResume(gson.fromJson(data, PacketLSR.class)); break; }
        case "llo" : { accountLogout(gson.fromJson(data, PacketLOR.class)); break; }
        case "lpu" : { accountUpdate(gson.fromJson(data, PacketLPU.class)); break; }
        case "lcp" : { accountPassword(gson.fromJson(data, PacketLCP.class)); break; }
        case "lsc" : { /* This doesn't do anything. This is to keep the websocket alive. */ break; }
        default : { close("Invalid data: " + p.getType()); break; }
      }
    } catch(IOException | NullPointerException | JsonParseException ex) {
      close(ex);
    }
  }

  /* Handle player logging into their account. */
  private void accountLogin(final PacketLLR p) throws IOException {
    final Gson json = new GsonBuilder().create();
    String name = p.username.trim().toUpperCase();
    final RoyaleAccount acc = lobbyDao.findAccount(name);
    
    String hashedPassword = Hashing.sha256()
    .hashString(p.password, StandardCharsets.UTF_8)
    .toString();
    
    if (acc == null) {
      sendPacket(new PacketLLG(false, "Account does not exist"));
      return;
    }
    
    if (!acc.getHash().equals(hashedPassword)) {
      sendPacket(new PacketLLG(false, "Incorrect password"));
      return;
    }
    
    session.setAccount(acc);
    String session = lobbyDao.addToken(name);
    AccountData account = new AccountData(session, acc.getUsername(), acc.getNickname(), acc.getSquad(), acc.getWins(), acc.getCoins(), acc.getDeaths(), acc.getKills(), acc.getCharacter());

    sendPacket(new PacketLLG(true, json.toJson(account)));
  }

  /* Handle player registering a new account. */
  private void accountRegister(final PacketLRR p) throws IOException {
    final Gson json = new GsonBuilder().create();
    String name = p.username.toUpperCase().trim();
    if (lobbyDao.findAccount(name) == null) {
      if(!(name.matches("[a-zA-Z0-9 ]*"))) {
        sendPacket(new PacketLRG(false, "Invalid username"));
        return;
      }

      ArrayList<String> swearWords = Filter.badWordsFound(name);
      if(swearWords.size() > 0) {
        sendPacket(new PacketLRG(false, "Invalid username"));
        return;
      }

      if(name.length() < 4) {
        sendPacket(new PacketLRG(false, "Username is too short"));
        return;
      } else if(name.length() > 20) {
        sendPacket(new PacketLRG(false, "Username is too long"));
        return;
      } else if(p.password.length() < 4) {
        sendPacket(new PacketLRG(false, "Password is too short"));
        return;
      } else if(p.password.length() > 4096) {
        sendPacket(new PacketLRG(false, "Password is too long"));
        return;
      }

      RoyaleAccount newAcc = lobbyDao.createAccount(name, p.password);
      session.setAccount(newAcc);
      String session = lobbyDao.addToken(name);

      AccountData newAccount = new AccountData(session, newAcc.getUsername(), newAcc.getNickname(), "", 0, 0, 0, 0, 0);
      sendPacket(new PacketLRG(true, json.toJson(newAccount)));
    } else {
      sendPacket(new PacketLRG(false, "Username is taken"));
    }
  }

  /* Resume an existing session */
  private void accountResume(final PacketLSR p) throws IOException {
    final Gson json = new GsonBuilder().create();
    
    if (lobbyDao.findToken(p.session) == null) {
      sendPacket(new PacketLRS(false, "Session expired. Please login again."));
    } else {
      RoyaleAccount acc = lobbyDao.findAccount(lobbyDao.findToken(p.session));
      session.setAccount(acc);
      lobbyDao.saveDatabase();

      String session = lobbyDao.findToken(p.session);
      AccountData account = new AccountData(p.session, acc.getUsername(), acc.getNickname(), acc.getSquad(), acc.getWins(), acc.getCoins(), acc.getDeaths(), acc.getKills(), acc.getCharacter());
      sendPacket(new PacketLRS(true, json.toJson(account)));
    }
  }

  /* Logout of our account and delete the session */
  private void accountLogout(final PacketLOR p) throws IOException {
    lobbyDao.removeToken(p.session);
    lobbyDao.saveDatabase();
    sendPacket(new PacketLLO());
  }

  /* Update our profile settings */
  private void accountUpdate(final PacketLPU p) throws IOException {
    if (p.nickname == null) {
      sendPacket(new PacketLPU(p.character, p.nickname, "You must provide a nickname"));
      return;
    }

    String name = p.nickname.trim().toUpperCase();
    
    if (name.length() < 4) {
      sendPacket(new PacketLPU(p.character, p.nickname, "Nickname is too short"));
      return;
    }

    if (name.length() > 20) {
      sendPacket(new PacketLPU(p.character, p.nickname, "Nickname is too long"));
      return;
    }

    ArrayList<String> swearWords = Filter.badWordsFound(p.nickname);
    if(swearWords.size() > 0) {
      sendPacket(new PacketLPU(p.character, p.nickname, "Invalid nickname"));
      return;
    }

    if(!(p.nickname.matches("[a-zA-Z0-9 ]*"))) {
      sendPacket(new PacketLPU(p.character, p.nickname, "Invalid nickname"));
      return;
    }
    RoyaleAccount acc = session.getAccount();

    acc.changeCharacter(p.character);
    acc.updateName(name);
    lobbyDao.saveDatabase();

    sendPacket(new PacketLPU(p.character, name));
  }
  
  /* Change the account password */
  private void accountPassword(final PacketLCP p) throws IOException {
    RoyaleAccount acc = session.getAccount();
    String hashedPassword = Hashing.sha256()
      .hashString(p.password, StandardCharsets.UTF_8)
      .toString();

    if (p.password.length() < 4) {
      sendPacket(new PacketLCP("", "Password is too short"));
      return;
    } else if(p.password.length() > 4096) {
      sendPacket(new PacketLCP("", "Password is too long"));
      return;
    }

    acc.updatePassword(hashedPassword);
    lobbyDao.saveDatabase();
    sendPacket(new PacketLCP(""));
  }

  /* Validate username, login, return data, automatically choose and join a lobby */
  private void login(final PacketL00 p) throws IOException {
    /* Username */
    String name = p.name==null?"Infringio":p.name.trim();
    ArrayList<String> swearWords = Filter.badWordsFound(name);
    if(name.length() > 20) { name = name.substring(0, 20); }
    else if(name.length() < 1 || !(name.matches("[a-zA-Z0-9 ]*"))) { name = "Infringio"; }
    if(swearWords.size() > 0) { name = "Infringio"; }
    
    /* Team */
    String team = p.team==null?"":p.team.trim().toLowerCase();
    if(team.length() > 3) { team = team.substring(0, 3); }
    else if(team.length() < 1) { team = ""; }

    /* Private */
    boolean priv = p.priv==false?false:true;

    /* Gamemode */
    String[] GAMEMODES = new String[] { "vanilla", "pvp" };
    int mode = p.mode;
    System.err.println("Login.login :: Gamemode is " + mode);
    if(mode < 0 || mode >= GAMEMODES.length) { mode = 0; }
    
    /* Login */
    session.login(name, team, priv, mode);
    
    /* Return data */
    sendPacket(new PacketL01(session.getSessionId(), session.getUser(), session.getTeam(), session.getPrivate(), session.getMode()));
    
    /* Choose Lobby */
    final GameLobby lobby = lobbyDao.findLobby(session.getPrivate(), session.getMode());
    
    /* Join Lobby */
    session.join(lobby);
  }
  
  @Override
  public void handleBinary(final ByteBuffer data) throws IOException {
    throw new IOException("Recieved unknown binary data from client!");
  }
  
  public void eject() { }

  @Override
  public void destroy() throws IOException {
    
  }
  
}
