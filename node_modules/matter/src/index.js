var matter = exports;

matter.parsers = require('./parsers');
matter.parse = matter.parsers.registry;

// register the bundled parsers
require('./parsers/json');
require('./parsers/yaml');

matter.yaml = matter.parse.yaml;
matter.json = matter.parse.json;
