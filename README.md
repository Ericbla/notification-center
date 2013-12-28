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
  * GET /streams/{topic}
    * Subscribe a topic channel
  * POST /fire/{topic}
    * Publish a message on a given topic. The message is encoded in the body
  

## Dependencies ##
- [express](http://expressjs.com/)
- redis

## Development ##
- [Bugs](https://github.com/Ericbla/notification-center/issues)

