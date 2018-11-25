var yaml = require('js-yaml');
var parsers = require('./');

parsers.register('yaml', function(data) {
  return yaml.safeLoad(data);
});
