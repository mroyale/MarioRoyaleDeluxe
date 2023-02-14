package org.infpls.royale.server.game.session;

/* Simplified account data when retrieving leaderboards */
public final class LeaderboardAccount {
    public int rank;
    public String nickname;
    public int count; // special data

    public LeaderboardAccount(int rank, String nickname, int count) {
        this.rank = rank;
        this.nickname = nickname;
        this.count = count;
    }
}