module.exports = function strToBytes(str){
  let bytes = [];
  for(var i = 0; i < str.length; i++){
    let code = str.charCodeAt(i);
    bytes = bytes.concat([code]);
  }
  return bytes;
}
