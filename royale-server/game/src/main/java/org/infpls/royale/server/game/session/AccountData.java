package org.infpls.royale.server.game.session;

/* Sent to the player when they get into their account */
public final class AccountData {
    public String session;
    public String username, nickname, squad;
    public int wins, coins, deaths, kills;

    public AccountData(String session, String username, String nickname, String squad, int wins, int coins, int deaths, int kills) {
        this.session = session;
        this.username = username;
        this.nickname = nickname;
        this.squad = squad;
        this.wins = wins;
        this.coins = coins;
        this.deaths = deaths;
        this.kills = kills;
    }
}