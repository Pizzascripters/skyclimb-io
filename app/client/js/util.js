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

  let imageNames = ["eyes", "pistol", "ak47", "shotgun", "nade", "bandage", "bullet", "healthbar", "energybar"];
  for(var i in imageNames) {
    images[imageNames[i]] = loadImage(imageNames[i], onload);
  }

  images.shops = {};
  images.shops.generic = loadImage("shops/generic", onload);

  images.textures = {};
  imageNames = ["rock"];
  for(var i in imageNames) {
    images.textures[imageNames[i]] = loadImage("textures/" + imageNames[i], onload);
  }
}

// Load a specific image for the game
function loadImage(src, callback) {
  let img = new Image();
  img.src = "img/" + src + ".png";
  img.onload = callback;
  return img;
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
