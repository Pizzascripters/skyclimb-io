function createJetpack(images, id) {
  var jetpack = {id};
  switch(id) {
    case 1:
    case "standard":
      jetpack.img = images.standard;
      break;
    case 2:
    case "lightning":
      jetpack.img = images.lightning;
      break;
    case 3:
    case "bull":
      jetpack.img = images.bull;
      break;
    case 4:
    case "laser":
      jetpack.img = images.laser;
      break;
    default:
      jetpack.img = null;
      break;
  }

  jetpack.on = () => {
    jetpack.flame = new Flame(id);
  }

  jetpack.off = () => {
    jetpack.flame = undefined;
  }

  return jetpack;
}
