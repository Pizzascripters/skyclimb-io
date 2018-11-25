describe("matter", function() {
  var matter = require(paths.src('./'));

  describe(".json", function() {
    it("should parse a json front matter", function(done) {
      matter.json.inFile('./test/fixtures/json-simple.md', function(err, data) {
        assert.deepEqual(data, {
          foo: 'bar',
          baz: 'qux',
          racecar: [
            'lerp',
            'larp',
            'lorem'
          ]
        });

        done();
      });
    });

    it("should parse a json front matter embedded in comments", function(done) {
      matter.json.inFile('./test/fixtures/json-embedded.js', function(err, data) {
        assert.deepEqual(data, {
          foo: 'bar',
          baz: 'qux',
          racecar: [
            'lerp',
            'larp',
            'lorem'
          ]
        });

        done();
      });
    });
  });

  describe(".yaml", function() {
    it("should parse a yaml front matter", function(done) {
      matter.yaml.inFile('./test/fixtures/yaml-simple.md', function(err, data) {
        assert.deepEqual(data, {
          foo: 'bar',
          baz: 'qux',
          racecar: [
            'lerp',
            'larp',
            'lorem'
          ]
        });

        done();
      });
    });

    it("should parse a yaml front matter embedded in comments", function(done) {
      matter.yaml.inFile('./test/fixtures/yaml-embedded.js', function(err, data) {
        assert.deepEqual(data, {
          foo: 'bar',
          baz: 'qux',
          racecar: [
            'lerp',
            'larp',
            'lorem'
          ]
        });

        done();
      });
    });
  });
});
