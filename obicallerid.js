#!/usr/bin/env node

/*
 * obicallerid
 * https://github.com/shawnbissell/obicallerid
 *
 * Copyright (c) 2012 Shawn Bissell
 * Licensed under the MIT license.
 */

var command = "none";
var userArgs = process.argv.slice(2);
if (userArgs.length > 0){
    command = userArgs[0];
}

var winston = require('winston');
var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({ level: 'info', colorize: true }),
        new (winston.transports.File)({ filename: 'output.log', level: 'verbose', json: false })
      ],
    exceptionHandlers: [
        new (winston.transports.File)({ filename: 'exceptions.log' })
    ]
});

var growl = require('growl');
var opencnam = require('opencnam');
var dgram = require("dgram");
var applescript = require("applescript");
var fromRegex = /^INVITE[\S\s]*From:\s*"?([\w\s\.\+\?\$]*?)"?<sip:((.*)@)?(.*)>;.*/;
var cidRegex = /<7> \[SLIC\] CID to deliver: '([\w\s\.\+\?\$]*?)' (\d*).*/;

function cleanNumber(num)
{
    num = num.replace(/\D/g,'');

    if(num.length > 4 && num.indexOf("011") == 0){
        num = num.substr(3);
    }
    if(num.length > 1 && num.charAt(0)=='1'){
        num = num.substr(1);
    }
    if (num.length > 10) {
        num = num.substr(0, 10);
    }
    return num;
}

var cnams = {};
function importScript(script)
{
    try {
        logger.info("Importing cnams from " + script);
        applescript.execFile(__dirname + "/" + script, [ ], function(err, rtn) {
            if (err) {
                logger.error("Could not import " + script + " " + err);
            } else if(Array.isArray(rtn) && rtn.length > 0) {
                logger.info(script + " Importing " + rtn.length + " numbers...");
                for (var i=0; i<rtn.length; i=i+2) {
                    var num = cleanNumber(rtn[i]);

                    if(cnams[num] == undefined)
                    {
                        cnams[num] = rtn[i+1];
                        //logger.info("Imported " + cnams[num] + " " + num);
                    }
                }
                logger.info(script + " Import completed successfully!");

            } else {
                logger.info("no cnams found for " + script);
            }
        });
    } catch (ex) {
        logger.error("Could not import script " + ex);
    }
}
importScript("outlookimport.scpt");
importScript("addressbookimport.scpt");


function lookupOpenCnam(number, retry)
{
    opencnam.lookup(number, function (err, cnam) {
        if (!err) {
            logger.info("Cnam found " + cnam);
            growl('Call from ' + cnam + ' ' + number, { title: 'Obi Caller ID'} );
        } else if(retry) {
            logger.info("Cnam not found for number " + number + " ... retrying ... ");
            growl('Call from ' + number, { title: 'Obi Caller ID'} );
            setTimeout(function(){lookupOpenCnam(number, false)},2000);
        } else {
            logger.error("retry lookup failed for " + number + " " + err);
        }
    });
}

function lookupCnam(number)
{
    var cachedName = cnams[cleanNumber(number)];
    if(cachedName != undefined){
        logger.info("Cached cnam found  " + cachedName );
        growl('Call from ' + cachedName + ' ' + number, { title: 'Obi Caller ID'} );
    } else {
        lookupOpenCnam(number, true);
    }
}

var lastSentTime = new Date();

function sendCallerIDInfo(name, number, ipAddress)
{
    logger.info("Caller ID Number found! " + number );
    var currentTime = new Date();
    if(currentTime.getTime() - lastSentTime.getTime() < 1000){
        logger.info("Preventing duplicate messages for " + number );
        return;
    }
    lastSentTime = currentTime;


    if (name != "" && cleanNumber(name) != number) {
        logger.info("Caller ID Name found! " + name );
        if(number != undefined){
            logger.info("Sending name and number  " + name + " " + number);
            growl('Call from ' + name + ' ' + number,  { title: 'Obi Caller ID'} );
        } else {
            logger.info("Sending name and ipAddress  " + name + " " + ipAddress);
            growl('Call from ' + name + ' <' + ipAddress + ">", { title: 'Obi Caller ID'} );
        }
    } else {
        lookupCnam(number)
    }
}


try {


    var server = dgram.createSocket("udp4");

    server.on("message", function (msg) {
        try {
            if(msg) {
                var logMessage = new String(msg);
                if(logMessage.indexOf("<7> [SLIC] Command:") == -1 && logMessage.indexOf("<7> XMPP:") == -1 ) {
                    logger.verbose(logMessage);
                } else {
                    return;
                }

                var cidMatches = cidRegex.exec(logMessage);
                if (cidMatches) {
                    sendCallerIDInfo(cidMatches[1], cidMatches[2]);
                }
                var fromMatches = fromRegex.exec(logMessage);
                if (fromMatches) {
                    sendCallerIDInfo(fromMatches[1], fromMatches[3], fromMatches[4]);
                }
            }
        }
        catch(ex){
            logger.error("Error OnMessage! " + ex);
        }

    });

    server.on("listening", function () {
        var address = server.address();
        logger.info("server listening " + address.address + ":" + address.port);
        growl('Obi Caller Id Started! Listening on Port 7000', { title: 'Obi Caller ID'} );
    });

    server.bind(7000);



    /* unit tests */
    if(command == "test"){
        var cidTest1 = "<7> [SLIC] CID to deliver: '' 5556011212";
        var cidMatch1 = cidRegex.exec(cidTest1);
        logger.info("cidMatch1 " + cidMatch1[1] + " " + cidMatch1[2]);
        var cidTest2 = "<7> [SLIC] CID to deliver: 'some name' 1645845823";
        var cidMatch2 = cidRegex.exec(cidTest2);
        logger.info("cidMatch2 " + cidMatch2[1] + " " + cidMatch2[2]);

        var test = "INVITE sip:16045551111@192.168.1.130:5063 SIP/2.0 \nFrom: \"test.?+$ name_1\"<sip:6045551212@208.65.240.165:5060>;tag=ecaasd4kr5vomv.o Call-ID: D547EAC6@28.73.12.66~o";
        var test2 = "INVITE sip:16045551111@192.168.1.130:5063 SIP/2.0 \nFrom: <sip:6045551212@208.65.240.165>;tag=ecaasd4kr5vomv.o Call-ID: D547EAC6@28.73.12.66~o";
        //var test3 = "INVITE asdasd \nFrom: \"Anonymous\"<sip:208.65.240.165:5060>;tag=gkvhwppdzniwszml.o";
        var test3 = "INVITE To: <sip:16045551212@208.65.240.165>\n                From: \"Anonymous\"<sip:208.65.240.165>;tag=2pqeabu2uswl2q32.o";

        var testmatches = fromRegex.exec(test);
        logger.info("test regex 1 " + testmatches[1] + " " + testmatches[3]);
        var testmatches2 = fromRegex.exec(test2);
        logger.info("test regex 2 " + testmatches2[1] + " " + testmatches2[3]);
        var testmatches3 = fromRegex.exec(test3);
        logger.info("test regex 3 " + testmatches3[1] + " " + testmatches3[3]);
        var testnum = cleanNumber("0111(345) 898 9888 x123");
        logger.info("test cleanNumber " + testnum);

        lookupOpenCnam("6045551234abc");
        setTimeout(function() {
            lookupCnam("604 555 1234");
            lookupCnam("604 555 4321");
            lookupCnam("604 555 3214");
            lookupCnam("604 555 2341");
            lookupCnam("604(555)x1111x");
            lookupCnam("604 638 1744");

        }, 30000);

    }
}
catch(ex)
{
    logger.error("Fatal Error occurred! " + ex + "\n" + ex);
}

