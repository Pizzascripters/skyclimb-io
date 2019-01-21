const economy = module.exports = {
  addGold: function(p, amt, GOLD_CAP) {
    p.gold += amt;
    p.score += amt;
    if(p.gold > GOLD_CAP) p.gold = GOLD_CAP;
    if(p.score > GOLD_CAP) p.score = GOLD_CAP;
  },

  update: function(players, map, delta, MAX_HEIGHT, MIN_HEIGHT, GOLD_CAP) {
    for(var i in players) {
      var p = players[i];
      if(p.inGame() && p.shield === 0) {
        const bgr = 1; // Base gold rate
        const tgr = 5; // Top gold rate
        var goldRate = (tgr - bgr) * (MAX_HEIGHT - p.body.position.y) / (MAX_HEIGHT - MIN_HEIGHT) + bgr;
        if(p.body.position.y < MIN_HEIGHT) {
          goldRate = tgr;
        } else if(p.body.position.y > MAX_HEIGHT) {
          goldRate = bgr;
        }
        economy.addGold(players[i], delta * goldRate / 1000, GOLD_CAP);
      }
    }
  }
}
