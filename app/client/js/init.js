var restarting = false; // If the game is restarting
var prevTime = 0;       // Time of last frame
var pingStart;          // The time we sent out the ping
var Game = {};          // The entire game, only used fro debugging

function init(e){
  Game.players = [];
  Game.map = [];
  Game.bullets = [];
  Game.throwables = [];
  Game.loot = [];
  Game.leaderboard = [];
  Game.flames = {};

  Game.images = {};
  loadImages(Game.images, () => {
    requestAnimationFrame(time => {
      update(Game, time);
    });
  });

  // A virtual keyboard to represent which actions the user is doing
  Game.keyboard = {
    left: false,
    right: false,
    jump: false,
    shoot: false,
    select: false,
    loot: false,
    shift: false,
    ctrl: false
  }
  Game.hand = 0;         // Angle of the hand

  Game.shopMenu = [];    // When the player opens a shop, this becomes an array of item ids
  Game.inventory = {
    select: 0,
    anim: [90, 80, 80, 80, 80, 80],
    items: [0, 0, 0, 0, 0, 0, 0],
    amt: [0, 0]
  }
  Game.items = {};
  initItems(Game.items, Game.images);

  Game.cvs = document.getElementById("cvs");
  fullscreen(Game.cvs);
  window.addEventListener("resize", () => {
    fullscreen(Game.cvs);
  });
  Game.ctx = Game.cvs.getContext("2d");
  Game.cam = {x:0, y:0}; // Position of the camera

  Game.cvs.hidden = false;
  document.getElementById("startmenu").style.visibility = "hidden";

  Game.deathscreen = {};
  Game.deathscreen.show = () => {
    document.getElementById("deathscreen").style.visibility = "visible";
    document.getElementById("kills").innerText = Game.deathscreen.kills;
    document.getElementById("score").innerText = Game.deathscreen.score;
  }

  window.addEventListener("mousemove", e => {
    Game.hand = mousemove(e);
  });
  window.addEventListener("mousedown", e => {
    mouse.down = true;
    if(Game.shopMenu.length === 0) {
        mousedown(e, Game.keyboard);
    } else {
      shopMenuApply(Game.shopMenu, (item, rect, slot) => {
        if(insideRect(mouse, rect)) {
          if(Game.keyboard.buy100) {
            if(item.id >= 128) buyItem(Game.ws, slot, 100);
          } else if(Game.keyboard.buy10) {
            if(item.id >= 128) buyItem(Game.ws, slot, 10);
          } else {
            buyItem(Game.ws, slot, 1);
          }
        }
      })
    }
  });
  window.addEventListener("mouseup", e => {
    mouse.down = false;
    mouseup(e, Game.keyboard)
  });
  window.addEventListener("keydown", e => {
    if(Game.shopMenu.length > 0) {
      if(e.keyCode === 27 || e.keyCode === 88) {
        Game.shopMenu = [];
      }
      if(e.keyCode === 16)
        Game.keyboard.buy10 = true;
      if(e.keyCode === 17)
        Game.keyboard.buy100 = true;
    } else {
      keydown(e, Game.keyboard, Game.inventory);
    }
  });
  window.addEventListener("keyup", e => {
    if(Game.shopMenu.length > 0) {
      if(e.keyCode === 16)
        Game.keyboard.buy10 = false;
      if(e.keyCode === 17)
        Game.keyboard.buy100 = false;
    } else {
      keyup(e, Game.keyboard);
    }
  });
  window.addEventListener("contextmenu", e => {
    e.preventDefault();
  });

  Game.ws = createWebsocket(Game);
}

// Runs constantly
function update(Game, time){
  let delta = time - prevTime;  // Time since last frame
  prevTime = time;

  checkShopExit(Game.shopMenu);

  // Debug only shop menu
  /*Game.items[1].price = 100;
  Game.items[32].price = 250;
  Game.items[64].price = 400;
  Game.items[128].price = 20;
  Game.items[192].price = 50;
  Game.shopMenu = ["generic", Game.items[1], Game.items[32], Game.items[64], Game.items[128], Game.items[192]];*/

  cvs.style.cursor = "default";
  draw(Game);
  anim.main(delta, Game.inventory);

  if(restarting) {
    restart(Game.ws);
  } else {
    requestAnimationFrame(time => {
      update(Game, time);
    });
  }
}
