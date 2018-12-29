const economy = module.exports = {
  addGold: function(p, amt) {
    p.gold += amt;
    p.score += amt;
  },

  update: function(players) {
    for(var i in players) {
      if(players[i].state === players[i].PLAYING || players[i].state === players[i].DISCONNECTED)
        economy.addGold(players[i], 1);
    }
  }
}
