const economy = module.exports = {
  addGold: function(p, amt) {
    p.gold += amt;
    p.score += amt;
  },

  update: function(players) {
    for(var i in players) {
      if(players[i].inGame())
        economy.addGold(players[i], 1);
    }
  }
}
