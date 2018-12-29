const Item = require('../constructors/Item');

module.exports = Game => {
  var stdin = process.openStdin();
  stdin.addListener("data", data => {
    let args = data.toString().trim().split(" ");
    const cmd = args[0];
    args.shift();
    switch(cmd){
      case "?":
        console.log('\x1b[36m%s\x1b[0m', 'cash <amount> [name]');
        console.log('\x1b[36m%s\x1b[0m', 'give <item> [amount] [name]');
        break;
      case "cash":
        if(!args[0]) {
          error('<amount> is a required parameter');
        } else if (isNaN(args[0])) {
          error('<amount> should be a number');
        } else {
          cash(Game, Number(args[0]), args[1]);
        }
        break;
      case "give":
        if(!args[0]) {
          error('<item> is a required parameter');
        } else if (args[1] && isNaN(args[1])) {
          error('[amount] should be a number');
        } else {
          give(Game, args[0], Number(args[1]), args[2]);
        }
        break;
      default:
        error(cmd + ' is not a command. For a list of commands type ?');
        break;
    }
  });
}

function cash(Game, amount, name) {
  if(name) {
    let found = false;
    for(var i in Game.players) {
      if(Game.players[i].spectating) continue;
      if(Game.players[i].name === name) {
        found = true;
        Game.players[i].gold += amount;
        Game.players[i].score += amount;
        break;
      }
    }
    if(found) {
      console.log('\x1b[35m%s\x1b[0m', 'Gave ' + name + ' ' + amount + ' gold');
    } else {
      error('Could not find a player named ' + name);
    }
  } else {
    for(var i in Game.players) {
      const p = Game.players[i];
      if(p.spectating) continue;
      p.gold += amount;
      p.score += amount;
    }
    console.log('\x1b[35m%s\x1b[0m', 'Gave each player ' + amount + ' gold');
  }
}

function give(Game, itemId, amount, name) {
  if(!isNaN(itemId)) itemId = Number(itemId);
  if(!amount) amount = 1;
  const item = new Item(itemId);

  if(name) {
    for(var i in Game.players) {
      const p = Game.players[i];
      if(p.spectating) continue;
      if(p.name === name) {
        if(p.acquire(item, amount)){
          if(amount === 1) {
            console.log('\x1b[35m%s\x1b[0m', 'Gave ' + name + ' ' + amount + ' ' + item.name);
          } else {
            console.log('\x1b[35m%s\x1b[0m', 'Gave ' + name + ' ' + amount + ' ' + item.plural);
          }
        } else {
          if(amount === 1) {
            console.log('\x1b[31m%s\x1b[0m', 'Failed to give ' + name + ' ' + amount + ' ' + item.name);
          } else {
            console.log('\x1b[31m%s\x1b[0m', 'Failed to give ' + name + ' ' + amount + ' ' + item.plural);
          }
        }
        break;
      }
    }
  } else {
    for(var i in Game.players) {
      const p = Game.players[i];
      if(p.spectating) continue;
      if(p.acquire(item, amount)){
        if(amount === 1) {
          console.log('\x1b[35m%s\x1b[0m', 'Gave ' + p.name + ' ' + amount + ' ' + item.name);
        } else {
          console.log('\x1b[35m%s\x1b[0m', 'Gave ' + p.name + ' ' + amount + ' ' + item.plural);
        }
      } else {
        if(amount === 1) {
          console.log('\x1b[31m%s\x1b[0m', 'Failed to give ' + p.name + ' ' + amount + ' ' + item.name);
        } else {
          console.log('\x1b[31m%s\x1b[0m', 'Failed to give ' + p.name + ' ' + amount + ' ' + item.plural);
        }
      }
    }
  }
}

function error(str) {
  console.log('\x1b[31m%s\x1b[0m', str);
}
