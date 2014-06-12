var winston = require("winston");

module.exports = new(winston.Logger)( {
    transports: [
        new(winston.transports.Console)({
            level: "info",
            colorize: true
        }),
        new(winston.transports.File)({
            filename: "output.log",
            level: "verbose",
            json: false
        })
    ],
    exceptionHandlers: [
        new(winston.transports.Console)({
            level: "info",
            colorize: true
        }),
        new(winston.transports.File)({
            filename: 'exceptions.log'
        })
    ]
});
