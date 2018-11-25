module.exports = function(client, body){
  this.id = client.id;
  this.body = body;
  this.client = client;
  client.player = this;

  this.keyboard = {
    left: false,
    right: false,
    jump: false
  }

  this.deleted = false;
}
