describe("parsers", function() {
  var parsers = require(paths.src('./parsers'));

  function oddFormat(data) {
    var obj = {};

    data
      .split(',')
      .map(function(kv) {
        kv = kv.split('=');
        obj[kv[0]] = kv[1];
      });

    return obj;
  }

  describe(".register", function() {
    afterEach(function() {
      parsers.unregister('odd');
    });

    it("should register the parser", function() {
      assert(!('odd' in parsers.registry));
      parsers.register('odd', oddFormat);
      assert('odd' in parsers.registry);
    });

    it("should throw an error if the parser already exists", function() {
      parsers.register('odd', oddFormat);

      assert.throws(function() {
        parsers.register('odd', oddFormat);
      }, /Parser 'odd' already exists/);
    });
  });

  describe(".unregister", function() {
    beforeEach(function() {
      parsers.register('odd', oddFormat);
    });

    it("should unregister the parser", function() {
      assert('odd' in parsers.registry);
      parsers.unregister('odd');
      assert(!('odd' in parsers.registry));
    });
  });

  describe(".clean", function() {
    it("should ignore the configured ignore characters", function() {
      assert.equal(parsers.clean('!abc!', {ignore: /!/g}), 'abc');
    });

    it("should remove trailing whitespace", function() {
      assert.equal(parsers.clean([
        'abc    \n',
        'def  \n',
        'ghi\n '
      ].join('')), [
        'abc',
        'def',
        'ghi'
      ].join('\n'));
    });

    it("should unindent the data as much as safely possible", function() {
      assert.equal(parsers.clean([
        '    abc',
        '  def',
        '   ghi'
      ].join('\n')), [
        '  abc',
        'def',
        ' ghi'
      ].join('\n'));
    });
  });

  describe(".extract", function() {
    it("should extract the front matter chunk of the data", function() {
      assert.deepEqual(
        parsers.extract([
        '---',
        '{',
        '  foo: "bar",',
        '  baz: "qux"',
        '}',
        '---',
        ].join('\n')), [
        '{',
        '  foo: "bar",',
        '  baz: "qux"',
        '}'].join('\n'));
    });

    it("should extract embedded front matters", function() {
      assert.deepEqual(
        parsers.extract([
        '! ---',
        '! {',
        '!   foo: "bar",',
        '!   baz: "qux"',
        '! }',
        '! ---',
        ].join('\n'), {ignore: /!/g}),
        ['{',
        '  foo: "bar",',
        '  baz: "qux"',
        '}'].join('\n'));
    });

    it("should throw an error if the head indicator isn't found", function() {
      assert.throws(function() {
        parsers.extract('abcT', {
          indicators: {head: 'H', tail: 'T'}
        });
      }, /Head indicator not found/);
    });

    it("should throw an error if the head indicator isn't found", function() {
      assert.throws(function() {
        parsers.extract('Habc', {
          indicators: {head: 'H', tail: 'T'}
        });
      }, /Tail indicator not found/);
    });
  });

  describe(".make", function() {
    describe("the constructed parser", function() {
      var parser;

      beforeEach(function() {
        parser = parsers.make(oddFormat);
      });

      it("should parse a corresponding front matter", function() {
        assert.deepEqual(
          parser('---\nfoo=bar,baz=qux\n---\n'),
          {foo: 'bar', baz: 'qux'});
      });

      describe(".inFile", function() {
        it("should parse a corresponding front matter from a file", function(done) {
          parser.inFile('./test/fixtures/odd-format.md', function(err, metadata) {
            assert.deepEqual(metadata, {foo: 'bar', baz: 'qux'});
            done();
          });
        });

        it("should pass along the actual file data", function(done) {
          parser.inFile('./test/fixtures/odd-format.md', function(err, metadata, data) {
            assert.deepEqual(data, '---\nfoo=bar,baz=qux\n---\n');
            done();
          });
        });

        it("should pass along parsing errors", function(done) {
          parser.inFile('./test/fixtures/bad-matter.md', function(err) {
            assert.equal(
              err.toString(),
              'Error: Tail indicator not found.');
            done();
          });
        });

        it("should pass along file read errors", function(done) {
          parser.inFile('some/non-existent/path', function(err) {
            assert.equal(err.errno, 34);
            done();
          });
        });
      });
    });
  });
});
