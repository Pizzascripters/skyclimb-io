window.addEventListener("load", () => {
  var cvs = document.getElementById("icon");
  var ctx = cvs.getContext("2d");
  cvs.width = 50;
  cvs.height = 50;

  var mountain = new Image();
  mountain.src = "icon/mountain.png";
  mountain.onload = load;

  var sun = new Image();
  sun.src = "icon/sun.png";
  sun.onload = load;

  var imagesLoaded = 0;
  function load(){
    if(++imagesLoaded >= 2) {
      drawIconAnimation(0, cvs, ctx, mountain, sun);
    }
  }
});

function drawIconAnimation(time, cvs, ctx, mountain, sun){
  ctx.clearRect(0, 0, cvs.width, cvs.height);
  ctx.drawImage(sun, 0, Math.max(cvs.height - time / 800, 0), cvs.width, cvs.height);
  ctx.drawImage(mountain, 0, Math.max(cvs.height*0.5 - time / 400, 0), cvs.width, cvs.height);

  window.requestAnimationFrame(delta => {
    drawIconAnimation(time + delta, cvs, ctx, mountain, sun);
  });
}
