var prevTime = 0;     // Time of last frame
var pingStart;        // The time we sent out the ping

window.addEventListener("load", init);

function init(e){
  let Game = {};
  Game.players = [];
  Game.map = [];
  Game.bullets = [];

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
    shoot: false
  }
  Game.hand = 0;         // Angle of the hand

  Game.inventory = {
    select: 5,
    anim: [0, 0, 0, 80, 80, 90, 0, 0, 0],
    items: [0, 0, 0, 64, 0, 1, 0, 0, 0]
  }
  Game.items = {};
  initItems(Game.items, Game.images);

  Game.cvs = document.getElementById("cvs");
  Game.ctx = Game.cvs.getContext("2d");
  Game.cam = {x:0, y:0}; // Position of the camera

  window.addEventListener("mousemove", (e) => {Game.hand = mousemove(e)});
  window.addEventListener("mousedown", (e) => {mousedown(e, Game.keyboard)});
  window.addEventListener("mouseup", (e) => {mouseup(e, Game.keyboard)});
  window.addEventListener("keydown", (e) => {keydown(e, Game.keyboard, Game.inventory)});
  window.addEventListener("keyup", (e) => {keyup(e, Game.keyboard)});

  Game.ws = createWebsocket(Game);

  fullscreen(Game.cvs);
  window.addEventListener("resize", () => {fullscreen(Game.cvs)});
}

function fullscreen(cvs){
  cvs.width = window.innerWidth;
  cvs.height = window.innerHeight;
}

// Runs constantly
function update(Game, time){
  let delta = time - prevTime;  // Time since last frame
  prevTime = time;

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
  images.shotgun = loadImage("shotgun.png", onload);
  images.bullet = loadImage("bullet.png", onload);
  images.healthbar = loadImage("healthbar.png", onload);
  images.energybar = loadImage("energybar.png", onload);
}

function loadImage(src, callback) {
  let img = new Image();
  img.src = "img/" + src;
  img.onload = callback;
  return img;
}
