module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.initConfig({
    jshint: {
      options: {jshintrc: '.jshintrc'},
      all: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.test.js']
    },
    mochaTest: {
      test: {
        src: ['test/**/*.test.js'],
        options: {
          reporter: 'spec',
          require: ['test/init.js']
        }
      }
    }
  });

  grunt.registerTask('test', [
    'mochaTest'
  ]);

  grunt.registerTask('default', [
    'jshint',
    'test'
  ]);
};
