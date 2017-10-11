var apieasy = require('api-easy');
var assert = require('assert');
var suite = apieasy.describe('Test API:');
var app = require('../app.js');


suite.use('localhost', 12345)
.before('timeout', function(outgoing) {
	outgoing['timeout'] = 3000; // 3s timeout
	return outgoing;
})
.addBatch({
	'Start the notification server': {
		topic: function () {
			app.start({'port':12345}, this.callback);
		},
		'ok' : function () {
		}
	}
})
.next()
.setHeader('Accept', 'application/json, */*')
.discuss('When fetching root url')
.get('/')
.expect(200, 'should respond with text/html Content-Type', function (err, res, body) {
        assert.equal(res.headers['content-type'], 'text/html');
        assert.match(body, /^<html>/);
    })
.undiscuss()
.discuss('When Publishing some message')
.setHeader('Content-Type', 'application/json')
.post('/publish/channel.item', { message: 'test'})
.expect(200, 'should respond with text/html Content-Type', function (err, res, body) {
        assert.equal(res.headers['content-type'], 'text/html');
    })
.expect('should have published topic in response', function (err, res, body) {
		var re = new RegExp('channel\.item');
        assert.match(body, re);
    })
.next()
.undiscuss()
//.discuss('When Subscribing some channel')
//.get('/subscribe/channel.*')
//.expect(200, 'should respond with text/event-stream Content-Type', function (err, res, body) {
//        assert.equal(res.headers['content-type'], 'text/event-stream');
//    })
//.next()
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
