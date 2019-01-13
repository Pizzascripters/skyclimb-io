function createStars() {
  var stars = {};

  function Star() {
    this.x = cvs.width * Math.random();
    this.y = cvs.height * Math.random();
    this.radius = Math.random() * 3;
    this.time = 0;
    this.period = Math.random() * 2000 + 1000;
    this.shift = Math.random() * this.period;

    this.getOpacity = () => {
      return 0.5 + Math.sin(Math.PI * (this.time - this.shift) / this.period) / 2;
    };
  }

  stars.update = (delta) => {
    for(var i = 0; i < STARS; i++) {
      var star = stars[i];
      star.time += delta;
    }
  }

  stars.render = (ctx) => {
    for(var i = 0; i < STARS; i++) {
      var star = stars[i];
      ctx.globalAlpha *= star.getOpacity();
      ctx.beginPath();
      ctx.fillStyle = "#fff";
      ctx.arc(star.x, star.y, star.radius, 0, 2*Math.PI);
      ctx.fill();
      ctx.globalAlpha /= star.getOpacity();
    }
  }

  for(var i = 0; i < STARS; i++) {
    stars[i] = new Star();
  }

  return stars;
}
