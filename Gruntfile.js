module.exports = function(grunt) {
  'use strict';

  // Project configuration.
  grunt.initConfig({
    jasmine : {
      src : 'js/*.js',
      options : {
        specs : 'js_tests/**/*.js'
      }
    },
    jshint: {
      all: [
        'Gruntfile.js',
        'js/**/*.js',
        'specs/**/*.js'
      ] 
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('test', ['jshint', 'jasmine']);

  grunt.registerTask('default', ['test']);

};
