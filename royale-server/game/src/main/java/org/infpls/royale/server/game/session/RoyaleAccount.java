package org.infpls.royale.server.game.session;

public final class RoyaleAccount {
    private String salt, hash;
    public String username, nickname, squad;
    public int wins, coins, deaths, kills;

    public RoyaleAccount(String salt, String hash, String username, String nickname, String squad, int wins, int coins, int deaths, int kills) {
        this.salt = salt;
        this.hash = hash;
        this.username = username;
        this.nickname = nickname;
        this.squad = squad;
        this.wins = wins;
        this.coins = coins;
        this.deaths = deaths;
        this.kills = kills;
    }

    public void updatePassword(String newSalt, String newHash) {
        this.salt = newSalt;
        this.hash = newHash;
    }

    public void updateName(String newName) {
        this.nickname = newName;
    }

    public void updateSquad(String newSquad) {
        this.squad = newSquad;
    }

    public void updateWins(int wins) {
        this.wins += wins;
    }

    public void updateCoins(int coins) {
        this.coins += coins;
    }

    public void updateDeaths(int deaths) {
        this.deaths += deaths;
    }

    public void updateKills(int kills) {
        this.kills += kills;
    }

    public String getSalt() { return salt; }
    public String getHash() { return hash; }
    public String getUsername() { return username; }
    public String getNickname() { return nickname; }
    public String getSquad() { return squad; }

    public int getCoins() { return coins; }
    public int getWins() { return wins; }
    public int getDeaths() { return deaths; }
    public int getKills() { return kills; }
}