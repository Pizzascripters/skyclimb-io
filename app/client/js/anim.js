var anim = {
  main: (delta, inventory, snow) => {
    anim.inventory(delta, inventory);
    anim.snow(delta, snow);
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

  snow: (delta, snow) => {
    snow.forEach(element => {
      element.update(delta);
    });
  }
}
