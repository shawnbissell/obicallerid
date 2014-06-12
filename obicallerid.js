/*
 * obicallerid
 * https://github.com/shawnbissell/obicallerid
 *
 * Copyright (c) 2012 Shawn Bissell
 * Licensed under the MIT license.
 */
"use strict";

var logger = require("./obicallerid-logger.js");

var growl = require('growl');
var opencnam = require('opencnam');
var applescript = require("applescript");
var os = require('os');

/**
 * An ObiCallerID object
 * @constructor
 */
function ObiCallerID() {
    this.fromRegex = /^INVITE[\S\s]*From:\s*"?([\w\s\.\+\?\$]*?)"?<sip:((.*)@)?(.*)>;.*/;
    this.cidRegex = /<7> \[SLIC\] CID to deliver: '([\w\s\.\+\?\$]*?)' (\d*).*/;
    this.cnams = {};
    this.lastSentTime = new Date();
    this.outlookImported = false;
    this.addressbookImported = false;
    this.lastGrowlName = "";
    this.lastGrowlNumber = "";
}

/**
 * module exports
 * @type {ObiCallerID}
 */
module.exports = ObiCallerID;

/**
 * Cleans the given phone number
 * @param {string} num the input phone number
 * @return {string} the cleaned phone number
 */
ObiCallerID.prototype.cleanNumber = function cleanNumber(num) {
    num = num.replace(/\D/g, '');

    if (num.length > 4 && num.indexOf("011") === 0) {
        num = num.substr(3);
    }
    if (num.length > 1 && num.charAt(0) == '1') {
        num = num.substr(1);
    }
    if (num.length > 10) {
        num = num.substr(0, 10);
    }
    return num;
}

ObiCallerID.prototype.importScript = function importScript(script, callback) {
    try {
        logger.info("Importing cnams from " + script);
        var self = this;
        applescript.execFile(__dirname + "/" + script, [], function(err, rtn) {
            if (err) {
                logger.error("Could not import " + script + " " + err);
            } else if (Array.isArray(rtn) && rtn.length > 0) {
                logger.info(script + " Importing " + rtn.length + " numbers...");
                for (var i = 0; i < rtn.length; i = i + 2) {
                    var num = self.cleanNumber(rtn[i]);

                    if (self.cnams[num] === undefined) {
                        self.cnams[num] = rtn[i + 1];
                        //logger.info("Imported " + cnams[num] + " " + num);
                    }
                }
                logger.info(script + " Import completed successfully!");

            } else {
                logger.info("no cnams found for " + script);
                if (script == "outlookimport.scpt") {
                    logger.info("Outlook must be running in order to import its contacts!");
                }
            }
            callback();
        });
    } catch (ex) {
        logger.error("Could not import script " + ex);
    }
}

ObiCallerID.prototype.sendGrowl = function sendGrowl(name, number){
    this.lastGrowlName = name;
    this.lastGrowlNumber = number;

    growl('Call from ' + name + ' ' + number, {
        title: 'Obi Caller ID'
    });
}

ObiCallerID.prototype.lookupOpenCnam = function lookupOpenCnam(number, retry) {
    var self = this;
    opencnam.lookup(number, function(err, cnam) {
        if (!err) {
            logger.info("Cnam found " + cnam);
            self.sendGrowl(cnam, number);
        } else if (retry) {
            logger.info("Cnam not found for number " + number + " ... retrying ... ");
            self.sendGrowl("", number);
            setTimeout(function() {
                self.lookupOpenCnam(number, false);
            }, 2000);
        } else {
            logger.error("lookup failed for " + number + " " + err);
        }
    });
}

ObiCallerID.prototype.lookupCnam = function lookupCnam(number) {
    var cachedName = this.cnams[this.cleanNumber(number)];
    if (cachedName !== undefined) {
        logger.info("Cached cnam found  " + cachedName);
        this.sendGrowl(cachedName, number);
    } else {
        this.lookupOpenCnam(number, true);
    }
}



ObiCallerID.prototype.sendCallerIDInfo = function sendCallerIDInfo(name, number, ipAddress) {
    logger.info("Caller ID Number found! " + number);
    var currentTime = new Date();
    if (currentTime.getTime() - this.lastSentTime.getTime() < 1000) {
        logger.info("Preventing duplicate messages for " + number);
        return;
    }
    this.lastSentTime = currentTime;


    if (name != "" && this.cleanNumber(name) != number) {
        logger.info("Caller ID Name found! " + name);
        if (number !== undefined) {
            logger.info("Sending name and number  " + name + " " + number);
            growl('Call from ' + name + ' ' + number, {
                title: 'Obi Caller ID'
            });
        } else {
            logger.info("Sending name and ipAddress  " + name + " " + ipAddress);
            growl('Call from ' + name + ' <' + ipAddress + ">", {
                title: 'Obi Caller ID'
            });
        }
    } else {
        this.lookupCnam(number);
    }
}

ObiCallerID.prototype.processMessage = function processMessage(msg) {
    var logMessage = String(msg);
    if (logMessage.indexOf("<7> [SLIC] Command:") == -1 && logMessage.indexOf("<7> XMPP:") == -1) {
        logger.verbose(logMessage);
    } else {
        return;
    }

    var cidMatches = this.cidRegex.exec(logMessage);
    if (cidMatches) {
        this.sendCallerIDInfo(cidMatches[1], cidMatches[2]);
    }
    var fromMatches = this.fromRegex.exec(logMessage);
    if (fromMatches) {
        this.sendCallerIDInfo(fromMatches[1], fromMatches[3], fromMatches[4]);
    }
}

ObiCallerID.prototype.importCompleted = function importCompleted() {
    return this.outlookImported && this.addressbookImported;
}

ObiCallerID.prototype.start = function start(callback) {
    var self = this;
    var completed = function() {
        if (self.importCompleted()) {
           callback();
        }
    };
    logger.info("Platform=" + os.platform());
    if (os.platform() == "darwin") {

        this.importScript("outlookimport.scpt", function() { self.outlookImported = true; completed(); });
        this.importScript("addressbookimport.scpt", function() { self.addressbookImported = true; completed(); });
    }
}


