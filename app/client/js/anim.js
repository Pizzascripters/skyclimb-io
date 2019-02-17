var anim = {
  main: (delta, Game) => {
    if(Game.players.length > 0) {
      anim.inventory(delta, Game.inventory);
      anim.healthbar(delta, Game.players[0].healing);
      anim.snow(delta, Game.snow);
      anim.doVisibility(delta);
      Game.stars.update(delta);
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

  startVisiblityAnimation: (dest) => {
    anim.visibilityStart = anim.visibility;
    anim.visibilityDest = dest;
    anim.visibilityTransitionTime = 0;
  },

  doVisibility: (delta) => {
    // The function representing the transition
    var f = x => {
      var a = anim.visibilityStart;
      var b = anim.visibilityDest;
      var k = SCOPE_TRANSITION_TIME;
      if(x >= k) anim.visibilityStart = anim.visibilityDest; // Finish the animation
      return Math.pow(x-k,2)*(a-b)/(k*k)+b; // Parabolic transition
    }

    anim.visibilityTransitionTime += delta;
    anim.visibility = f(anim.visibilityTransitionTime);
  },

  visibility: 1000,
  visibilityStart: 1000,
  visibilityDest: 1000,
  visibilityTransitionTime: 0,

  healthbarglow: 0
}
