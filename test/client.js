suite('client', function() {
  // setup marionette and launch a client
  var Marionette = require('marionette-client');
  var assert = require('assert');
  var static = require('node-static');

  // install the plugin
  marionette.plugin('logger', require('../'), {
    autoClose: true,
    port: 60150
  });

  // we need to use the async client
  var client = marionette.client(null, Marionette.Drivers.Tcp);

  // setup http static file server
  var http = require('http');
  var httpServer;
  var httpPort = 60044;

  // generate a local url
  function localUrl(path) {
    return 'http://localhost:' + httpPort + '/' + path;
  }

  setup(function() {
    var file = new static.Server(__dirname + '/public');
    httpServer = http.createServer(function(req, res) {
      req.on('end', function() {
        file.serve(req, res);
      }).resume();
    }).listen(httpPort);
  });

  teardown(function() {
    httpServer.close();
  });

  test('console', function(done) {
    client.logger.handleMessage = function(msg) {
      if (msg.message.indexOf('foobar!') !== -1) done();
    };
    client.executeScript(function() {
      console.log('foobar!', { 'muy thing': true });
    }, function() {});
  });

  test('going to a different url and logging', function(done) {
    var msgNo = 0;
    client.logger.handleMessage = function(msg) {
      msgNo++;
      if (msgNo === 1) {
        assert.equal(msg.message, '____I_AM_SO_UNIQUE___');
        assert.equal(msg.level, 'log');
      } else if (msgNo === 2) {
        assert.equal(msg.message, '___I_AM_SO_BROKEN___');
        assert.equal(msg.level, 'error');
        assert.equal(msg.stack.length, 1);
        return done();
      }
    };

    client.goUrl(localUrl('blank.html'), function() {});
    client.goUrl(localUrl('index.html'), function() {});
  });
});
