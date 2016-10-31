var expect = require('chai').expect;
var request = require('supertest');
var app = require('../server/index.js');

describe('Server', function() {
  describe('Repo/Storage Server', function() {
    it('Should add new recordings', function(done) {
      request(app)
        .post('/api/recording')
        .set('Accept', 'application/json')
        .expect(function(res) {
          res.body;
        })
        .expect(200, done);
    });
    it('Should retrieve recordings', function(done) {
      request(app)
        .get('/api/recording/test')
        .expect(function(res) {
          typeof res.body === 'object';
        })
        .expect(200, done);
    });
    it('Should get a list of recordings', function(done) {
      request(app)
        .get('/api/recordings')
        .set('Accept', 'application/json')
        .expect(function(res) {
          Array.isArray(res.body);
        })
        .expect(200, done);
    });
    it('Should handle bad requests', function(done) {
      request(app)
        .get('error/error')
        .expect(400, done);
    });
  });
});
