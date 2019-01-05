const economy = module.exports = {
  addGold: function(p, amt) {
    p.gold += amt;
    p.score += amt;
  },

  update: function(players, map) {
    for(var i in players) {
      if(players[i].inGame() && !players[i].inSafezone(map))
        economy.addGold(players[i], 1);
    }
  }
}
