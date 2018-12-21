var prevTime = 0;     // Time of last frame
var pingStart;        // The time we sent out the ping
var Game = {};        // Only for debugging

window.addEventListener("load", init);

function init(e){
  Game.players = [];
  Game.map = [];
  Game.bullets = [];
  Game.throwables = [];

  Game.images = {};
  loadImages(Game.images, () => {
    requestAnimationFrame((time) => {
      update(Game, time);
    });
  });

  Game.keyboard = {
    left: false,
    right: false,
    jump: false,
    shoot: false,
    select: false,
    consume: false,
    cook: false,
    throw: false
  }
  Game.hand = 0;         // Angle of the hand

  Game.inventory = {
    select: 4,
    anim: [0, 0, 80, 80, 90, 0, 0],
    items: [0, 0, 0, 0, 0, 0, 0],
    amt: [0, 0]
  }
  Game.shopMenu = [];
  Game.items = {};
  initItems(Game.items, Game.images);

  Game.cvs = document.getElementById("cvs");
  Game.ctx = Game.cvs.getContext("2d");
  Game.cam = {x:0, y:0}; // Position of the camera

  window.addEventListener("mousemove", e => {Game.hand = mousemove(e)});
  window.addEventListener("mousedown", e => {
    if(Game.shopMenu.length === 0) {
        mousedown(e, Game.keyboard);
    }
  });
  window.addEventListener("mouseup", e => {mouseup(e, Game.keyboard)});
  window.addEventListener("keydown", e => {
    if(Game.shopMenu.length > 0) {
      if(e.keyCode === 27 || e.keyCode === 88) {
        Game.shopMenu = [];
      }
    } else {
      keydown(e, Game.keyboard, Game.inventory);
    }
  });
  window.addEventListener("keyup", e => {keyup(e, Game.keyboard)});

  Game.ws = createWebsocket(Game);

  fullscreen(Game.cvs);
  window.addEventListener("resize", () => {fullscreen(Game.cvs)});

}

function fullscreen(cvs){
  cvs.width = window.innerWidth;
  cvs.height = window.innerHeight;
}

// Adds a script to the html document
function loadScript(name){
  let script = document.createElement("script");
  script.src = "js/" + name + ".js";
  document.head.appendChild(script);
}
let scripts = ["anim", "constants", "draw", "input", "io", "Item"];
scripts.map(x => loadScript(x));

// Runs constantly
function update(Game, time){
  let delta = time - prevTime;  // Time since last frame
  prevTime = time;

  // Check if we have exited shop
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

  draw(Game);
  anim.main(delta, Game.inventory);

  requestAnimationFrame((time) => {
    update(Game, time);
  });
}

function loadImages(images, callback) {
  let count = 0;
  const onload = () => {
    count++;
    if(count === Object.keys(images).length) callback();
  }

  images.eyes = loadImage("eyes.png", onload);
  images.pistol = loadImage("pistol.png", onload);
  images.ak47 = loadImage("ak47.png", onload);
  images.shotgun = loadImage("shotgun.png", onload);
  images.nade = loadImage("nade.png", onload);
  images.bandage = loadImage("bandage.png", onload);
  images.bullet = loadImage("bullet.png", onload);
  images.healthbar = loadImage("healthbar.png", onload);
  images.energybar = loadImage("energybar.png", onload);

  images.shops = {};
  images.shops.generic = loadImage("shops/generic.png", onload);
}

function loadImage(src, callback) {
  let img = new Image();
  img.src = "img/" + src;
  img.onload = callback;
  return img;
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
