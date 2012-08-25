#!/usr/bin/env node

/*
 * obicallerid
 * https://github.com/shawnbissell/obicallerid
 *
 * Copyright (c) 2012 Shawn Bissell
 * Licensed under the MIT license.
 */

var command = "none";
if (process.argv.length > 2){
    command = process.argv[2];
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
var fromRegex = /^INVITE[\S\s]*From:\s*"?([\w\s\.\+\?\$]*?)"?<sip:.*?(\d*)@?[\.\d]*:\d*>;.*/;

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
                }
            }
            logger.info(script + " Import completed successfully!");

        } else {
            logger.info("no cnams found for " + script);
        }
    });

}
importScript("outlookimport.scpt");
importScript("addressbookimport.scpt");


function lookupOpenCnam(number, retry)
{
    opencnam.lookup(number, function (err, cnam) {
        if (!err) {
            logger.info("Cnam found " + cnam);
            growl('Incoming call from \n' + cnam + ' ' + number, { title: 'Obi Caller ID'} );
        } else if(retry) {
            logger.info("Cnam not found for number " + number + " ... retrying ... ");
            growl('Incoming call from \n' + number, { title: 'Obi Caller ID'} );
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
        growl('Incoming call from \n' + cachedName + ' ' + number, { title: 'Obi Caller ID'} );
    } else {
        lookupOpenCnam(number, true);
    }
}

var server = dgram.createSocket("udp4");

server.on("message", function (msg, rinfo) {
    logger.verbose("server got: " + msg + " from " + rinfo.address + ":" + rinfo.port);
    if(msg) {
        var s = new String(msg);
        var matches = fromRegex.exec(s);
        if (matches) {
            var number = matches[2];
            var fromName  = matches[1];
            logger.info("Caller ID Number found! " + number );
            if (fromName != "") {
                logger.info("Caller ID Name found! " + fromName );
                growl('Incoming call from \n' + fromName + ' ' + number, { title: 'Obi Caller ID'} );
            } else {
                lookupCnam(number)
            }
        }
    }
});

server.on("listening", function () {
    var address = server.address();
    logger.info("server listening " + address.address + ":" + address.port);
});

server.bind(7000);
growl('Obi Caller Id Started!\nListening on Port 7000', { title: 'Obi Caller ID'} );


/* unit tests */
if(command == "test"){
    var test = "INVITE sip:16045551111@192.168.1.130:5063 SIP/2.0 \nFrom: \"test.?+$ name_1\"<sip:6045551212@208.65.240.165:5060>;tag=ecaasd4kr5vomv.o Call-ID: D547EAC6@28.73.12.66~o";
    var test2 = "INVITE sip:16045551111@192.168.1.130:5063 SIP/2.0 \nFrom: <sip:6045551212@208.65.240.165:5060>;tag=ecaasd4kr5vomv.o Call-ID: D547EAC6@28.73.12.66~o";
    var test3 = "INVITE asdasd \nFrom: \"Anonymous\"<sip:208.65.240.165:5060>;tag=gkvhwppdzniwszml.o";
    var testmatches = fromRegex.exec(test);
    logger.info("test regex 1 " + testmatches[1] + " " + testmatches[2]);
    var testmatches2 = fromRegex.exec(test2);
    logger.info("test regex 2 " + testmatches2[1] + " " + testmatches2[2]);
    var testmatches3 = fromRegex.exec(test3);
    logger.info("test regex 3 " + testmatches3[1] + " " + testmatches3[2]);
    var testnum = cleanNumber("0111(345) 898 9888 x123");
    logger.info("test cleanNumber " + testnum);
    lookupOpenCnam("6045551234abc");
    setTimeout(function() {
        lookupCnam("604 555 1234");
        lookupCnam("604 555 4321");
        lookupCnam("604 555 3214");
        lookupCnam("604 555 2341");
        lookupCnam("604(555)x1111x")

    }, 30000);
}
