#!/usr/bin/env node

'use strict';

/**
 * Module dependencies.
 */

const express = require('express');
const http = require('http');
const redis = require('redis');
const util = require('util');
const fs = require('fs');

let publisherClient = redis.createClient();
let app = express();
let http_server = null;

// Configuration

let allowCrossDomain = function(req, res, next) {
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

app.configure(function() {
	app.use(express.json());
	app.use(express.urlencoded());
	app.use(allowCrossDomain);
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
	app.use(function(req, res, next) {
		util.log(req.method + ' ' + req.url);
		next();
	});
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function() {
    app.use(express.errorHandler()); 
});


// Index of the app (Web)
app.get('/', function(req, res) {
	res.writeHead(200, {'Content-Type': 'text/html'});
  res.write('<html><body>Welcome to Notification center</body></html>');
  res.end();
});


// Subscribe to a topic (SSE protocol)
app.get('/subscribe/*', function(req, res) {
  // let request last as long as possible
  req.socket.setTimeout(0);

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
    let event = null;
    try {
      let obj = JSON.parse(message);
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
app.post('/publish/*', function(req, res) {
	let topic = req.params[0];
	let content = JSON.stringify(req.body);
	util.log('publish: ' + topic + ' body=' + content);
	publisherClient.publish(topic, content);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('<html><body>Published on topic: ' + topic + '<br>' + content + '</body></html>');
    res.end();
});

let start = module.exports.start = function(options, callback) {
	// Create the HTTP server that will serve this app
  http_server = http.createServer(app);
  let port;
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

let stop = module.exports.stop = function(callback) {
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
	let program = require('commander');
	let appName = 'notification-center';
	let defaultLogFile = '/var/log/' + appName + '.log';
  let defaultPidFile = '/var/run/' + appName + '.pid';
  program.version('1.1.0')
    .usage('[options] [port]\n\n    Launches a ' + appName + ' process listening at <port> (default: 8000)')
    .option('-d, --daemon', 'Turn the program into a daemon')
    .option('-l, --logfile [file]', '(only for daemon) Log to this file\n                      (default: ' + defaultLogFile + ')', defaultLogFile)
    .option('-p, --pidfile [file]', '(only for daemon) Write PID to this file\n                      (default: ' + defaultPidFile + ')', defaultPidFile)
    .parse(process.argv);
	let port = 8000;
	if (program.args.length >= 1) {
		port = program.args[0];
	}
	if (program.daemon) {
		let fd = fs.openSync(program.logfile, 'a');
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

