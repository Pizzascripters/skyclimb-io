# matter
Flexible front matter parser.

```javascript
matter.yaml('---\nfoo: bar\n---');
// => {foo: 'bar'}

matter.yaml.inFile('./stuff.md', function(err, metadata) {
  // ...
});

matter.json('---\n{"foo": "bar"}\n---');
// => {foo: 'bar'}

matter.json.inFile('./stuff.md', function(err, metadata) {
  // ...
});
```

## What can it do?
- Parse front matters embedded in comments (or any configurable tokens)
- Allow custom parsers to be plugged in
- Keep the parsing as configurable as possible

## API

#### `matter.yaml(string, [options])`
Alias to `matter.parse.yaml`.

```javascript
console.log(matter.yaml('---\nfoo: bar\n---'));
// => {foo: 'bar'}
```

#### `matter.yaml.inFile(filepath, [options], callback)`
Alias to `matter.parse.yaml.inFile`.

```javascript
matter.yaml.inFile('./stuff.md', function(err, metadata, data) {
  if (!err) {
    console.log(metadata);
  };
});
```

#### `matter.json(string, [options])`
Alias to `matter.parse.json`.

```javascript
console.log(matter.json('---\n{"foo": "bar"}\n---'));
// => {foo: 'bar'}
```

#### `matter.json.inFile(filepath, [options], callback)`
Alias to `matter.parse.json.inFile`.

```javascript
matter.json.inFile('./stuff.md', function(err, metadata, data) {
  if (!err) {
    console.log(metadata);
  };
});
```

#### `matter.parse.<parserName>(string, [options])`
- `string`: A string containing the front matter to be parsed
- `options`: An object of options
  - `ignore`: A regex or string representing tokens to be ignored when extracting the front matter. Used to extract the front matter. The tokens ignored by default are `//`, `/*`, `*/`, `#`.
  - `indicator` (default=`/---/`): A regex or string to use as the front matter head and tail indicators
  - `indicators`: An object of options to use for the front matter head and tail indicators:
      - `head`: A regex or string to use as the front matter's head indicator. Defaults to `indicator`'s value.
      - `tail`: A regex or string to use as the front matter's tail indicator. Defaults to `indicators`'s value

Parses a string containing a front matter using the parser registered as `parserName`.

```javascript
console.log(matter.parse.yaml('---\nfoo: bar\n---'));
// => {foo: 'bar'}
```

#### `matter.parse.<parserName>.inFile(filepath, [options], callback)`
- `filename`: A relative or absolute path to the file with the front matter to be parsed
- `options`: An object of options:
  - `encoding` (default=`'utf8'`): The `encoding` to be used when reading the file
  - `ignore`: A regex or string representing tokens to be ignored when extracting the front matter. Used to extract the front matter. The tokens ignored by default are `//`, `/*`, `*/`, `#`.
  - `indicator` (default=`/---/`): A regex or string to use as the front matter head and tail indicators
  - `indicators`: An object of options to use for the front matter head and tail indicators:
      - `head`: A regex or string to use as the front matter's head indicator. Defaults to `indicator`'s value.
      - `tail`: A regex or string to use as the front matter's tail indicator. Defaults to `indicators`'s value
  - *[[`fs.readFile`](http://nodejs.org/api/fs.html#fs_fs_readfile_filename_options_callback) options]*
- `callback(err, metadata, data)`: A function to be called when the file has been read and the front matter has been parsed.
  - `err`: An error object for an error which may have occured while reading and parsing the file. `null` if no error occured.
  - `metadata`: An object containing the extracted and parsed front matter data
  - `data`: A string of the actual data contained in the file

Parses a file containing a front matter using the parser registered as `parserName`.

```javascript
matter.parse.yaml.inFile('./stuff.md', function(err, metadata, data) {
  if (!err) {
    console.log(metadata);
  };
});
```

#### `matter.parsers.register(name, fn)`
- `name`: The name of the parser. Once registered, the parser becomes a
property of `matter.parse`.
- `fn(data)`: The function to convert the extracted front matter string into
a JSON object.
  - `data`: A string containing the extracted front matter data. `matter`
  tries clean the data up as best it can without breaking the format.

Registers a new front matter parser.

```javascript
matter.parsers.register('odd', function(data) {
  var obj = {};

  data
    .split(',')
    .map(function(kv) {
      kv = kv.split('=');
      obj[kv[0]] = kv[1];
    });

  return obj;
});

console.log(matter.parse.odd('---\nfoo=bar,baz=qux\n---\n'));
// => {foo: 'bar', baz: 'qux'});
```

#### `matter.parsers.unregister(name)`
- `name`: The name of the parser to unregister.

Unregisters a parser.

```javascript
matter.parsers.unregister('odd');
```

#### `matter.parsers.defaults(overrides)`
- `overrides`: An object containing the new defaults. `matter` uses the
following defaults:
  - `encoding` (default=`'utf8'`): The `encoding` to be used when reading files
  - `ignore`: A regex or string representing tokens to be ignored when extracting the front matter. Used to extract the front matter. The tokens ignored by default are `//`, `/*`, `*/`, `#`.
  - `indicator` (default=`/---/`): A regex or string to use as the front matter head and tail indicators
  - `indicators`: An object of options to use for the front matter head and tail indicators:
      - `head`: A regex or string to use as the front matter's head indicator. Defaults to `indicator`'s value.
      - `tail`: A regex or string to use as the front matter's tail indicator. Defaults to `indicators`'s value

Sets new defaults for parsing. 

```javascript
matter.parsers.defaults({ignore: /!/g});
```

#### `matter.parsers.defaults()`
Returns a shallow copy of the parsing defaults.

```javascript
console.log(matter.parsers.defaults());
```
