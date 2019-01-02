function Particle(){
  this.hueRange = 20;
  this.rand = (min, max) => {
      return Math.floor( (Math.random() * (max - min + 1) ) + min);
  };

  this.reset = () => {
    this.startRadius = this.rand(1, 10);
    this.radius = this.startRadius;
    this.x = (this.rand(0, 6) - 3);
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.hue = (this.hueRange);
    this.saturation = this.rand(100, 10);
    this.lightness = this.rand(40, 40);
    this.startAlpha = this.rand(10, 10) / 100;
    this.alpha = this.startAlpha;
    this.decayRate = .15;
    this.startLife = 6;
    this.life = this.startLife;
    this.lineWidth = this.rand(2, 2);
  }

  this.update = () => {
    this.vx += (this.rand(0, 200) - 100) / 1500;
    this.vy -= this.life/-40;
    this.x += this.vx;
    this.y += this.vy;
    this.alpha = this.startAlpha * (this.life / this.startLife);
    this.radius = this.startRadius * (this.life / this.startLife);
    this.life -= this.decayRate;
    if(
      this.x > cvs.width + this.radius ||
      this.x < -this.radius ||
      this.y > cvs.height + this.radius ||
      this.y < -this.radius ||
      this.life <= this.decayRate
    ){
      this.reset();
    }
  }

  this.render = (ctx, x, y) => {
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    ctx.arc(this.x + x, this.y + y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = ctx.strokeStyle = 'hsla('+this.hue+', '+this.saturation+'%, '+this.lightness+'%, '+this.alpha+')';
    ctx.lineWidth = this.lineWidth;
    ctx.fill();
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  };

  this.reset();
};
