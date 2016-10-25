var expect = require('chai').expect;
var request = require('supertest');
var app = require('../server/index.js');

describe('Server', function() {
  describe('Repo/Storage Server', function() {
    it('Should connect to the repo server on startup', function(done) {
      request(app)
        .get('/api/index')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });
  });
});
