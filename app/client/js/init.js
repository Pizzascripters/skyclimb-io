var restarting = false; // If the game is restarting
var prevTime = 0;       // Time of last frame
var pingStart;          // The time we sent out the ping
var visibility;
var Game = {};          // The entire game

// Add a random background image
window.addEventListener("load", e => {
  var rand = Math.floor(15*Math.random());
  console.log(rand);
  var url = "url('titlemenubg/"+rand+".png')";
  document.getElementsByClassName("bg")[0].style.backgroundImage = url;
});

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
      Game.snow = createSnow(Game.images.particles.snow);
      Game.stars = createStars();
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

  Game.lookup = [];      // A list of all player ids and their corresponding names
  Game.shopMenu = [];    // When the player opens a shop, this becomes an array of item ids
  Game.inventory = {
    select: 0,
    anim: [90, 80, 80, 80, 80, 80],
    items: [0, 0, 0, 0, 0, 0],
    magazine: [0, 0, 0],
    amt: [0, 0, 0, 0, 0, 0]
  }
  Game.items = {};
  initItems(Game.items, Game.images);

  Game.cvs = document.getElementById("cvs");
  Game.cvs.Game = Game;
  resize({target:cvs});
  window.addEventListener("resize", resize);
  Game.ctx = Game.cvs.getContext("2d");
  Game.cam = {x:0, y:0}; // Position of the camera

  Game.cvs.hidden = false;
  document.getElementById("startmenu").style.visibility = "hidden";

  Game.deathscreen = {};
  Game.deathscreen.show = () => {
    document.getElementById("deathscreen").style.visibility = "visible";
    document.getElementById("kills").innerText = Game.deathscreen.kills;
    document.getElementById("score").innerText = Game.deathscreen.score;

    // Clear event listeners
    window.removeEventListener("resize", resize);
    window.removeEventListener("mousemove", mousemoveEvent);
    window.removeEventListener("mousedown", mousedownEvent);
    window.removeEventListener("mouseup", mouseupEvent);
    window.removeEventListener("keydown", keydownEvent);
    window.removeEventListener("keyup", keyupEvent);
    window.removeEventListener("contextmenu", contextmenuEvent);
  }

  window.addEventListener("mousemove", mousemoveEvent);
  window.addEventListener("mousedown", mousedownEvent);
  window.addEventListener("mouseup", mouseupEvent);
  window.addEventListener("keydown", keydownEvent);
  window.addEventListener("keyup", keyupEvent);
  window.addEventListener("contextmenu", contextmenuEvent);

  Game.ws = createWebsocket(Game);
}

// Runs constantly
function update(Game, time){
  let delta = time - prevTime;  // Time since last frame
  prevTime = time;

  checkShopExit(Game);

  // Debug only shop menu
  /*Game.items[1].price = 100;
  Game.items[32].price = 250;
  Game.items[64].price = 400;
  Game.items[128].price = 20;
  Game.items[192].price = 50;
  Game.shopMenu = ["generic", Game.items[1], Game.items[32], Game.items[64], Game.items[128], Game.items[192]];*/

  cvs.style.cursor = "default";
  if(!isNaN(getScale())) draw(Game);
  anim.main(delta, Game);

  if(restarting) {
    restart(Game.ws);
  } else {
    requestAnimationFrame(time => {
      update(Game, time);
    });
  }
}

const mousemoveEvent = e => {
  Game.hand = mousemove(e);
}

const mousedownEvent = e => {
  mouse.down = true;

  // Handle buttons
  for(var i1 in Game.buttons) {
    for(var i2 in Game.buttons[i1]) {
      var button = Game.buttons[i1][i2];
      if(!button.enabled) continue;
      if(insideRect(mouse, button.rect())) {
        button.click();
        return false;
      }
    }
  }

  if(Game.shopMenu.length === 0) {
      mousedown(e, Game.keyboard);
  } else {
    shopMenuApply(Game.shopMenu, (item, rect, slot) => {
      if(insideRect(mouse, rect)) {
        if(Game.keyboard.buy100) {
          if(item.canBuy100) buyItem(Game.ws, slot, 100);
        } else if(Game.keyboard.buy10) {
          if(item.canBuy10) buyItem(Game.ws, slot, 10);
        } else {
          buyItem(Game.ws, slot, 1);
        }
      }
    })
  }
}

const mouseupEvent = e => {
  mouse.down = false;
  mouseup(e, Game.keyboard)
}

const keydownEvent = e => {
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
}

const keyupEvent = e => {
  if(Game === undefined) return;
  if(Game.shopMenu.length > 0) {
    if(e.keyCode === 16)
      Game.keyboard.buy10 = false;
    if(e.keyCode === 17)
      Game.keyboard.buy100 = false;
  } else {
    keyup(e, Game.keyboard);
  }
}

const contextmenuEvent = e => {
  e.preventDefault();
}
