var anim = {
  main: (delta) => {
    anim.inventory(delta);
  },

  inventory: (delta) => {
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
  }
}
