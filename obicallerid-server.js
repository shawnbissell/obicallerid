#!/usr/bin/env node
/*
 * obicallerid
 * https://github.com/shawnbissell/obicallerid
 *
 * Copyright (c) 2012 Shawn Bissell
 * Licensed under the MIT license.
 */
"use strict";
var logger = require("./obicallerid-logger.js");
var ObiCallerID = require("./obicallerid.js");
var dgram = require("dgram");
var growl = require("growl");

try {
    var server = dgram.createSocket("udp4");
    var obi = new ObiCallerID();

    server.on("message", function(msg) {
        try {
            if (msg) {
                obi.processMessage(msg);
            }
        } catch (ex) {
            logger.error("Error OnMessage! " + ex);
        }

    });

    server.on("listening", function() {
        var address = server.address();
        logger.info("server listening " + address.address + ":" + address.port);
        growl("Obi Caller Id Started! Listening on Port 7000", {
            title: "Obi Caller ID"
        });
    });
    obi.start(function() { });
    server.bind(7000);

} catch (ex) {
    logger.error("Fatal Error occurred! " + "\n" + ex);
}
