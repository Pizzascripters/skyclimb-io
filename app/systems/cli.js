const Item = require('../constructors/Item');

module.exports = (Game) => {
  var stdin = process.openStdin();
  stdin.addListener("data", data => {
    let args = data.toString().trim().split(" ");
    const cmd = args[0];
    args.shift();
    switch(cmd){
      case "?":
        console.log('\x1b[36m%s\x1b[0m', 'cash <amount>');
        console.log('\x1b[36m%s\x1b[0m', 'give <item> [amount]');
        break;
      case "cash":
        if(!args[0]) {
          error('<amount> is a required parameter');
        } else if (isNaN(args[0])) {
          error('<amount> should be a number');
        } else {
          cash(Game, Number(args[0]));
        }
        break;
      case "give":
        if(!args[0]) {
          error('<item> is a required parameter');
        } else if (args[1] && isNaN(args[1])) {
          error('[amount] should be a number');
        } else {
          give(Game, args[0], Number(args[1]));
        }
        break;
      default:
        error(cmd + ' is not a command. For a list of commands type ?');
        break;
    }
  });
}

function cash(Game, amount) {
  for(var i in Game.players) {
    const p = Game.players[i];
    p.gold += amount;
    p.score += amount;
  }
  console.log('\x1b[35m%s\x1b[0m', 'Gave each player ' + amount + ' gold');
}

function give(Game, itemId, amount) {
  if(!isNaN(itemId)) itemId = Number(itemId);
  if(!amount) amount = 1;

  const item = new Item(itemId);
  for(var i in Game.players) {
    const p = Game.players[i];
    p.acquire(item, amount);
  }
  if(amount === 1) {
    console.log('\x1b[35m%s\x1b[0m', 'Gave each player ' + amount + ' ' + item.name);
  } else {
    console.log('\x1b[35m%s\x1b[0m', 'Gave each player ' + amount + ' ' + item.plural);
  }
}

function error(str) {
  console.log('\x1b[31m%s\x1b[0m', str);
}
