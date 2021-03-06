function restart(ws) {
  ws.close();
  restarting = false;
}

// Gets the biome that a point is in
function getBiome(v) {
  const range = GREATEST_Y_VALUE - LEAST_Y_VALUE;
  const scale = (GREATEST_Y_VALUE - v.y) / range;
  if(scale > BIOME_STARRY) {
    return "starry";
  }
  if(scale > BIOME_SNOWY) {
    return "snowy";
  }
  return "sunset";
}

// Check if we have exited the shop and leave if we have
function checkShopExit(Game) {
  let exited = true;
  if(Game.shopMenu.length > 0 && Game.players.length > 0) {
    const p = Game.players[0];
    for(var i in Game.map.shops) {
      const shop = Game.map.shops[i];
      const rect = {
        x: shop.x - p.radius,
        y: shop.y - p.radius,
        width: shop.width + p.radius * 2,
        height: shop.height + p.radius * 2
      }
      if(insideRect(p, rect)) {
        exited = false;
      }
    }
  }
  if(exited) {
    Game.shopMenu = [];
  }
}

// Applys a function to each item in the shop menu
function shopMenuApply(shopMenu, f) {
  const width = cvs.width / 2;
  const height = 9 * width / 16;

  for(var i = 1; i < shopMenu.length; i++) {
    const item = shopMenu[i];
    const size = width / 8;
    const margin = SHOP_MENU_MARGIN;
    const padding = SHOP_MENU_PADDING;
    const textHeight = SHOP_MENU_TEXT_HEIGHT;
    const pos = {
      x: width + ((i-1) % 4) * size,
      y: (cvs.height / 2 - height / 2) + Math.floor((i-1) / 4) * size
    }

    f(item, {
      x: pos.x + margin,
      y: pos.y + margin,
      width: size - margin * 2,
      height: size - margin * 2
    }, i-1);
  }
}

// Check if point p is inside a rectangle
function insideRect(p, rect) {
  if(
    p.x < rect.x ||
    p.x > rect.x + rect.width ||
    p.y < rect.y ||
    p.y > rect.y + rect.height
  ) {
    return false;
  } else {
    return true;
  }
}

// Load all images for the game, and call callback once they all are loaded
function loadImages(images, callback) {
  let count = 0;
  const onload = () => {
    count++;
    if(count === Object.keys(images).length) callback();
  }

  // Misc Images
  let imageNames = ["energybar", "flash", "healthbar", "pellet"];
  for(var i in imageNames) {
    images[imageNames[i]] = loadImage(imageNames[i], onload);
  }

  // Bullets
  images.bullets = {};
  imageNames = ["bullet", "pellet"];
  for(var i in imageNames) {
    images.bullets[imageNames[i]] = loadImage("bullets/" + imageNames[i], onload);
  }

  // Decoration
  images.decoration = {};
  let decorNames = {
    "flowers": ["1", "2", "3"],
    "grass": ["1", "2"],
    "bush": ["1"],
    "icicle": ["1", "2"]
  };
  for(var i1 in decorNames) {
    images.decoration[i1] = [];
    for(var i2 in decorNames[i1]) {
      const img = loadImage("decoration/" + i1 + "/" + decorNames[i1][i2], onload);
      images.decoration[i1].push(img);
    }
  }

  // Clouds
  images.clouds = {};
  imageNames = ["1", "2"];
  for(var i in imageNames) {
    images.clouds[Number(imageNames[i])] = loadImage("clouds/" + imageNames[i], onload);
  }

  // Shrapnel
  images.shrapnel = {};
  imageNames = ["1", "2", "3"];
  for(var i in imageNames) {
    images.shrapnel[Number(imageNames[i])] = loadImage("shrapnel/" + imageNames[i], onload);
  }

  // Particles
  images.particles = {};
  let particleNames = {
    "snow": ["1", "2", "3"]
  };
  for(var i1 in particleNames) {
    images.particles[i1] = [];
    for(var i2 in particleNames[i1]) {
      const img = loadImage("particles/" + i1 + "/" + particleNames[i1][i2], onload);
      images.particles[i1].push(img);
    }
  }

  // Backgrounds
  images.backgrounds = {};
  imageNames = ["moon", "stars", "sunset"];
  for(var i in imageNames) {
    images.backgrounds[imageNames[i]] = loadImage("backgrounds/" + imageNames[i], onload)
  }

  // Jetpack
  images.jetpacks = {};
  jetpackNames = ["standard", "lightning", "bull", "laser"];
  for(var i in jetpackNames) {
    images.jetpacks[jetpackNames[i]] = loadImage("jetpacks/" + jetpackNames[i], onload)
  }

  // Eyes
  images.eyes = {};
  imageNames = ["generic", "sans"];
  for(var i in imageNames) {
    images.eyes[imageNames[i]] = loadImage("eyes/" + imageNames[i], onload);
  }

  // Items
  images.items = {};
  let itemNames = ["bandage", "nade"];
  for(var i in itemNames) {
    images.items[itemNames[i]] = loadImage("items/" + itemNames[i], onload);
  }

  // Weapons
  images.weapons = {};
  let weaponNames = ["ak47", "glock", "pump", "sniper"];
  let weaponImageNames = ["fire", "l", "ul"];
  for(var i1 in weaponNames) {
    images.weapons[weaponNames[i1]] = {};
    for(var i2 in weaponImageNames) {
      images.weapons[weaponNames[i1]][weaponImageNames[i2]] = loadImage("weapons/" + weaponNames[i1] + "/" + weaponImageNames[i2], onload);
    }
  }

  // Shops
  images.shops = {};
  let shopNames = ["generic", "golden"];
  imageNames = ["inside", "outside", "shelf"];
  for(var i1 in shopNames) {
    images.shops[shopNames[i1]] = {};
    for(var i2 in imageNames) {
      images.shops[shopNames[i1]][imageNames[i2]] = loadImage("shops/" + shopNames[i1] + "/" + imageNames[i2], onload);
    }
  }
  images.shops.close = loadImage("shops/close", onload);

  // Textures
  images.textures = {};
  imageNames = ["rock", "grass", "water"];
  for(var i in imageNames) {
    images.textures[imageNames[i]] = loadImage("textures/" + imageNames[i], onload);
  }

  // Stats
  images.stats = {};
  imageNames = ["bullets", "gold", "kills", "score", "shells"];
  for(var i in imageNames) {
    images.stats[imageNames[i]] = loadImage("stats/" + imageNames[i], onload);
  }

  // Scopes
  images.scopes = {};
  imageNames = ["1", "2", "3", "4", "5"];
  for(var i in imageNames) {
    images.scopes[Number(imageNames[i])] = loadImage("scopes/" + imageNames[i], onload);
  }
}

// Load a specific image for the game
function loadImage(path, callback) {
  let img = new Image();
  let src = "img/" + path + ".png";
  img.src = src;
  img.onload = callback;
  return img;
}

// Check if an image exists
function imageExists(url){
    var http = new XMLHttpRequest();
    http.open('HEAD', url, false);
    http.send();
    return http.status != 404;
}

// Adds a script to the html document
function loadScript(name){
  let script = document.createElement("script");
  script.src = "js/" + name + ".js";
  document.head.appendChild(script);
}
let scripts = ["anim", "buttons", "constants", "Decoration", "draw", "Flame", "input", "io", "jetpack", "Item", "Particle", "Snow", "Stars", "Surface"];
scripts.map(x => loadScript(x));

function resize(e){
  Game = e.target.Game;

  cvs.width = window.innerWidth;
  cvs.height = window.innerHeight;

  Game.snow = createSnow(Game.images.particles.snow);
  Game.stars = createStars();
  Game.buttons = createButtons(Game);
  Game.inventory.buttons = Game.buttons.inventory;
}

function getScale() {
  return 0.5 * cvs.width / anim.visibility;
}

// Finds the distance between two points
function distance(p1, p2){
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) +
    Math.pow(p1.y - p2.y, 2)
  );
}
