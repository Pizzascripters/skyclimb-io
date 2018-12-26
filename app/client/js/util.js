// Check if we have exited the shop and leave if we have
function checkShopExit(shopMenu) {
  let exited = true;
  if(shopMenu.length > 0) {
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
  let imageNames = ["bullet", "energybar", "flash", "healthbar", "pellet"];
  for(var i in imageNames) {
    images[imageNames[i]] = loadImage(imageNames[i], onload);
  }

  // Shrapnel
  imageNames = ["1", "2", "3"];
  images.shrapnel = {};
  for(var i in imageNames) {
    images.shrapnel[Number(imageNames[i])] = loadImage("shrapnel/" + imageNames[i], onload);
  }

  // Eyes
  imageNames = ["generic", "sans"];
  images.eyes = {};
  for(var i in imageNames) {
    images.eyes[imageNames[i]] = loadImage("eyes/" + imageNames[i], onload);
  }

  // Items
  let itemNames = ["bandage", "nade"];
  images.items = {};
  for(var i in itemNames) {
    images.items[itemNames[i]] = loadImage("items/" + itemNames[i], onload);
  }

  // Weapons
  let weaponNames = ["ak47", "glock", "pump", "sniper"];
  let weaponImageNames = ["fire", "l", "ul"];
  images.weapons = {};
  for(var i1 in weaponNames) {
    images.weapons[weaponNames[i1]] = {};
    for(var i2 in weaponImageNames) {
      images.weapons[weaponNames[i1]][weaponImageNames[i2]] = loadImage("weapons/" + weaponNames[i1] + "/" + weaponImageNames[i2], onload);
    }
  }

  // Shops
  images.shops = {};
  let shopNames = ["generic"];
  imageNames = ["inside", "outside", "shelf"];
  for(var i1 in shopNames) {
    images.shops[shopNames[i1]] = {};
    for(var i2 in imageNames) {
      images.shops[shopNames[i1]][imageNames[i2]] = loadImage("shops/" + shopNames[i1] + "/" + imageNames[i2], onload);
    }
  }

  // Textures
  images.textures = {};
  imageNames = ["rock"];
  for(var i in imageNames) {
    images.textures[imageNames[i]] = loadImage("textures/" + imageNames[i], onload);
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
let scripts = ["anim", "constants", "draw", "input", "io", "Item"];
scripts.map(x => loadScript(x));

function fullscreen(cvs){
  cvs.width = window.innerWidth;
  cvs.height = window.innerHeight;
}
