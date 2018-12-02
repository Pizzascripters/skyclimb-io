module.exports = function(ws, id){
  this.id = id;
  this.socket = ws;
  this.player = {};
}
