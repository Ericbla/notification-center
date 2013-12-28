/**
 * Module dependencies.
 */

var express = require('express'),
    http = require('http'),
    redis   = require('redis'),
    util = require("util");


var publisherClient = redis.createClient();
var service = module.exports = express();
var myPort = 8000;

// Configuration

service.configure(function() {
	service.use(express.json());
	service.use(express.urlencoded());
    service.use(express.methodOverride());
    service.use(express.static(__dirname + '/public'));
});

service.configure('development', function() {
    service.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

service.configure('production', function() {
    service.use(express.errorHandler()); 
});

// Routes

service.get('/', function(req, res){
    res.send('<html><body>Welcome to Notification center</body></html>');
    res.end();
});

service.get('/streams/:topic', function(req, res) {
  // let request last as long as possible
  req.socket.setTimeout(Infinity);

  var messageCount = 0;
  var subscriber = redis.createClient();
  var topic = req.params.topic;

  subscriber.subscribe(topic);

  // send headers for event-stream connection
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.write('\n');
  
  // In case we encounter an error...print it out to the console
  subscriber.on("error", function(err) {
    console.log("Redis Error: " + err);
  });

  // When we receive a message from the redis connection
  subscriber.on("message", function(channel, message) {
    messageCount++; // Increment our message count

    res.write('id: ' + messageCount + '\n');
    res.write("data: " + message + '\n\n'); // Note the extra newline
  });

  // The 'close' event is fired when a user closes their browser window.
  // In that situation we want to make sure our redis channel subscription
  // is properly shut down to prevent memory leaks...and incorrect subscriber
  // counts to the channel.
  req.on("close", function() {
    subscriber.unsubscribe();
    subscriber.quit();
  });
});

service.post('/fire/:topic', function(req, res) {
	var topic = req.params.topic;
	console.log('fire: ' + topic + ' body=' + util.inspect(req.body));
	publisherClient.publish(topic, JSON.stringify(req.body));
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('Fired');
    res.end();
});

// Create the HTTP server that will serve this service
http_server = http.createServer(service);

http_server.listen(myPort, function() { 
    console.log('HTTP server listening on port ' + myPort);
});

