var anim = {
  main: (delta, Game) => {
    if(Game.players.length > 0) {
      anim.inventory(delta, Game.inventory);
      anim.healthbar(delta, Game.players[0].healing);
      anim.snow(delta, Game.snow);
    }
  },

  inventory: (delta, inventory) => {
    for(var i in inventory.anim) {
      if(inventory.select === Number(i)) {
        if(inventory.anim[i] < INVENTORY_SELECTED_HEIGHT)
          inventory.anim[i] += INVENTORY_ANIMATION_SPEED / 1000 * delta;
        else if(inventory.anim[i] > INVENTORY_SELECTED_HEIGHT)
          inventory.anim[i] = INVENTORY_SELECTED_HEIGHT;
      }
      else if(inventory.anim[i] > INVENTORY_COLLAPSED_HEIGHT)
        inventory.anim[i] -= INVENTORY_ANIMATION_SPEED / 1000 * delta;
      else if(inventory.anim[i] < INVENTORY_COLLAPSED_HEIGHT)
        inventory.anim[i] = INVENTORY_COLLAPSED_HEIGHT;
    }
  },

  healthbar: (delta, healing) => {
    if(healing) {
      anim.healthbarglow += delta / 20;
      if(anim.healthbarglow > 30) {
        anim.healthbarglow = 30;
      }
    } else {
      anim.healthbarglow -= delta / 20;
      if(anim.healthbarglow < 0) {
        anim.healthbarglow = 0;
      }
    }
  },

  snow: (delta, snow) => {
    snow.forEach(element => {
      element.update(delta);
    });
  },

  healthbarglow: 0
}
