var parsers = require('./');

parsers.register('json', function(data) {
  return JSON.parse(data);
});
