# notification-center

A Simple PUBLISH/SUBSCRIBE http front-end implementing the W3C Server Side Event protocol.

[![Build Status](https://travis-ci.org/Ericbla/notification-center.png?branch=master)](https://travis-ci.org/Ericbla/notification-center)
[![GitHub version](https://badge.fury.io/gh/Ericbla%2Fnotification-center.png)](http://badge.fury.io/gh/Ericbla%2Fnotification-center)

## Overview ##
This a simple notification center (similar to pushd) providing a Server Side Events
(SSE) implementation on top of a **redis** messaging system.

## Description ##
Based on
  - express     For the web server
  - redis       For its Subscribe/Publish feature

## Installation ##

```bash
git clone https://github.com/Ericbla/notification-center.git
cd nofification-center
npm install
npm test
```

## Configuration ##
The process can fork itself and run as a daemon. The PID of the process will be
written in this case in `/var/run/notification-center.pid` (or the file
specified by the `-p` option. The output log would aslo be redirected to
`/var/log/notification-center.log` file or the file specified with the `-l` option.

Here is the usage of this application:


    Usage: app.js [options] [port]

      Launches a notification-center process listening at <port> (default: 8000)

    Options:

      -h, --help            output usage information
      -V, --version         output the version number
      -d, --daemon          Turn the program into a daemon
      -l, --logfile [file]  (only for daemon) Log to this file
                            (default: /var/log/notification-center.log)
      -p, --pidfile [file]  (only for daemon) Write PID to this file
                            (default: /var/run/notification-center.pid)



## Web server API ##
- **GET /subscribe/{topic}**  
    Subscribe a topic channel (may include wildcard `*` )  
    This open a never ending stream of `text/event-stream` content (supposed
    to be consumed by an [**EventSource**](http://www.w3.org/TR/2012/WD-eventsource-20120426/) object from the Web browser. 
- **POST /publish/{topic}**  
    Publish a message on a given topic. 
    The message is encoded in the body of the POST request.   
    This API allow to remotly publish events through HTTP. The other *normal*
    way is to use the PUBLISH command on the local Redis database.
  

## Dependencies ##
- [express](http://expressjs.com/)
- [redis](https://github.com/mranney/node_redis)
- [daemon](https://github.com/indexzero/daemon.node)
- [commander](https://github.com/visionmedia/commander.js)

## Development ##
- Use [**vows**](http://vowsjs.org/) and [**api-easy**](https://github.com/flatiron/api-easy) for unit tests
- Please report bugs at this [tracker](https://github.com/Ericbla/notification-center/issues)

