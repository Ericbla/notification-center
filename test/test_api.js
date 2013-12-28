var apieasy = require('api-easy');
var assert = require('assert');
var suite = apieasy.describe('Test API:');
var app = require('../app.js');


suite.use('localhost', 123456)
.addBatch({
	'Start the notification server': {
		topic: function () {
			app.start({'port':123456}, this.callback);
		},
		'ok' : function () {
		}
	}
})
.next()
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
.next()
.addBatch({
	'Shutdown the notification server': {
		topic: function () {
			app.stop(this.callback);
		},
		'ok' : function () {
		}
	}
})
   
// Export tests for Vows
.export(module);
