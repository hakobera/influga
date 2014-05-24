var request = require('supertest');
var app = require('../src/app');
var influx = require('influx');

var config = {
  "dashboardDbPath": "./test.db",
  "host": "localhost",
  "port": 8086,
  "database": "test",
  "username": "root",
  "password": "root"
};

var server = app.create(config);
var client = influx(config.host, config.port, config.username, config.password, config.database);

describe('app', function () {
  beforeEach(function (done) {
    client.createDatabase(config.database, done);
  });

  afterEach(function (done) {
    client.deleteDatabase(config.database, done);
  });

  describe('#ping', function () {
    it('should success', function (done) {
      request(server)
        .get('/')
        .end(done);
    });
  });
});
