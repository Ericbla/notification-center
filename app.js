#!/usr/bin/env node

/**
 * Module dependencies.
 */

var express = require('express'),
    http = require('http'),
    redis = require('redis'),
    util = require("util"),
    fs = require('fs');



var publisherClient = redis.createClient();
var service = express();

// Configuration

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
    	util.log('OPTIONS ' + req.url + ' (Origin: ' + req.get('Origin') + ')');
        res.send(200);
    } else {
        next();
    }
};

service.configure(function() {
	service.use(express.json());
	service.use(express.urlencoded());
	service.use(allowCrossDomain);
    service.use(express.methodOverride());
    service.use(express.static(__dirname + '/public'));
});

service.configure('development', function() {
	service.use(function(req, res, next){
		  util.log(req.method + ' ' + req.url);
		  next();
		});
    service.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

service.configure('production', function() {
    service.use(express.errorHandler()); 
});


// Index of the service (Web)
service.get('/', function(req, res) {
	res.writeHead(200, {
	    'Content-Type': 'text/html'
	  });
    res.write('<html><body>Welcome to Notification center</body></html>');
    res.end();
});


// Subscribe to a topic (SSE protocol)
service.get('/subscribe/*', function(req, res) {
  // let request last as long as possible
  req.socket.setTimeout(Infinity);

  var messageCount = 0;
  var subscriber = redis.createClient();
  var topic = req.params[0];
  
  util.log('subscribe to topic: ' + topic);
  
  // In case we encounter an error...print it out to the console
  subscriber.on("error", function(err) {
    util.error("Redis Error: " + err);
  });

  // When we receive a pmessage from the redis connection
  subscriber.on("pmessage", function(pattern, channel, message) {
    messageCount++; // Increment our message count
    var event = null;
    try {
    	var obj = JSON.parse(message);
    	event = obj.event;
    	if (typeof event !== 'string') {
    		event = null;
    	} else {
    		event = event.trim();
    	}
    } catch(err) {
    	util.error('Bad JSON message: ' + message);
    }

    res.write('id: ' + messageCount + '\n');
    if (event && event != '' ) {
    	res.write('event: ' + event + '\n');
    }
    res.write("data: " + message + '\n\n'); // Note the extra newline
  });

  subscriber.psubscribe(topic);

  // send headers for event-stream connection
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.write('\n');
  
  // Emit a first fake event
  res.write('id: 0\n');
  res.write('event: fake\n');
  res.write('data: Welcome new sbubscriber to topic: ' + topic + '\n\n'); // Note the extra newline');
  

  // The 'close' event is fired when a user closes their browser window.
  // In that situation we want to make sure our redis channel subscription
  // is properly shut down to prevent memory leaks...and incorrect subscriber
  // counts to the channel.
  req.on("close", function() {
    subscriber.punsubscribe();
    subscriber.quit();
    res.end();
  });
});

// Publish some event/message on a topic (Web)
service.post('/publish/*', function(req, res) {
	var topic = req.params[0];
	var content = JSON.stringify(req.body);
	util.log('publish: ' + topic + ' body=' + content);
	publisherClient.publish(topic, content);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('<html><body>Published on topic: ' + topic + '<br>' + content + '</body></html>');
    res.end();
});

var start = module.exports.start = function(options, callback) {
	// Create the HTTP server that will serve this service
	http_server = http.createServer(service);
	if (options && options.port) {
		port = options.port;
	} else {
		port = 8000;
	}

	http_server.listen(port, function() { 
		util.log('HTTP server listening on port ' + port);
		if (callback && typeof callback === 'function') {
			callback();
		}
	});
};

var stop = module.exports.stop = function(callback) {
	http_server.unref();
	http_server.close(function() {
		util.log('HTTP server closed');
		if (callback && typeof callback === 'function') {
			callback();
		}
	});
};

// Standalone invocation -> start the server
if (require.main === module) {
	var program = require('commander'),
	    appName = 'notification-center';
	var defaultLogFile = '/var/log/' + appName + '.log',
    	defaultPidFile = '/var/run/' + appName + '.pid';
	program.version('1.1.0')
	    .usage('[options] [port]\n\n    Launches a ' + appName + ' process listening at <port> (default: 8000)')
    	.option('-d, --daemon', 'Turn the program into a daemon')
    	.option('-l, --logfile [file]', '(only for daemon) Log to this file\n                      (default: ' + defaultLogFile + ')', defaultLogFile)
    	.option('-p, --pidfile [file]', '(only for daemon) Write PID to this file\n                      (default: ' + defaultPidFile + ')', defaultPidFile)
    	.parse(process.argv);
	var port = 8000;
	if (program.args.length >= 1) {
		port = program.args[0];
	}
	if (program.daemon) {
		var fd = fs.openSync(program.logfile, 'a');
		require('daemon')({
			stdout: fd,
			stderr: fd
		});
		util.log('Running as a daemon (pid=' + process.pid + ')');
		fs.writeFile(program.pidfile, process.pid, function(err) {
			if (err) {
				util.error("Can't write pid file");
			}
		});
	}
    start({'port': port});
}

