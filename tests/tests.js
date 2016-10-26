var expect = require('chai').expect;
var request = require('supertest');
var app = require('../server/index.js');

describe('Server', function() {
  describe('Repo/Storage Server', function() {
    it('Should connect to the repo server on startup', function(done) {
      request(app)
        .get('/api/users/test/track/test')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });
    it('Should add new recordings', function(done) {
      request(app)
        .get('/api/users/test/track/test/create')
        .set('Accept', 'application/json')
        .expect(function(res) {
          res.body.id;
        })
        .expect(200, done);
    });
  });
});
