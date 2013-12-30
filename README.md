# Simple Notification center [![Build Status](https://travis-ci.org/Ericbla/notification-center.png?branch=master)](https://travis-ci.org/Ericbla/notification-center)

## Overview ##
This a simple notification center (similar to pushd) providing Server Side Events (SSE) 
## Description ##
Based on
  - express     For the web server
  - redis       For its Subscribe/Publish feature

## Installation ##

    git clone https://github.com/Ericbla/notification-center.git
    cd nofification-center
    npm install
    npm test


## Configuration ##


## API ##
  * GET /subscribe/{topic}
    * Subscribe a topic channel (may include wildcard `*` )
  * POST /publish/{topic}
    * Publish a message on a given topic. The message is encoded in JSON in the body
  

## Dependencies ##
- [express](http://expressjs.com/)
- [redis](https://github.com/mranney/node_redis)

## Development ##
- [Bugs](https://github.com/Ericbla/notification-center/issues)

