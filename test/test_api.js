var apieasy = require('api-easy');
var assert = require('assert');
var suite = apieasy.describe('Test API:');
require('../app.js');


suite.use('localhost', 8000)
.setHeader('Accept', 'application/json, */*')
.discuss('When fetching root url')
.get('/')
.expect(200, 'sould return some basic html', function (err, res, body) {
		assert.match(body, /^<html>/);
		
	})
.undiscuss()
.discuss('When Publishing some message')
.post('/fire/test')
.expect(200, 'should return OK', function (err, res, body) {
		assert.match(body, /^Fired/);
	})
   
// Export tests for Vows
.export(module);
