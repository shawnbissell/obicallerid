var ObiCallerID = require("../obicallerid.js");

describe('obicallerid', function() {

    var obi = new ObiCallerID();
    it('match cidRegex test', function() {
        var cidTest1 = "<7> [SLIC] CID to deliver: '' 5556011212";
        var cidMatch1 = obi.cidRegex.exec(cidTest1);
        expect(cidMatch1[2]).toEqual("5556011212");

        var cidTest2 = "<7> [SLIC] CID to deliver: 'some name' 1645845823";
        var cidMatch2 = obi.cidRegex.exec(cidTest2);

        expect(cidMatch2[2]).toEqual("1645845823");
    });
    it('match fromRegex test', function() {
        var test = "INVITE sip:16045551111@192.168.1.130:5063 SIP/2.0 \nFrom: \"test.?+$ name_1\"<sip:6045551212@208.65.240.165:5060>;tag=ecaasd4kr5vomv.o Call-ID: D547EAC6@28.73.12.66~o";
        var test2 = "INVITE sip:16045551111@192.168.1.130:5063 SIP/2.0 \nFrom: <sip:6045551212@208.65.240.165>;tag=ecaasd4kr5vomv.o Call-ID: D547EAC6@28.73.12.66~o";
        //var test3 = "INVITE asdasd \nFrom: \"Anonymous\"<sip:208.65.240.165:5060>;tag=gkvhwppdzniwszml.o";
        var test3 = "INVITE To: <sip:16045551212@208.65.240.165>\n                From: \"Anonymous\"<sip:208.65.240.165>;tag=2pqeabu2uswl2q32.o";

        var testmatches = obi.fromRegex.exec(test);
        expect(testmatches[3]).toEqual("6045551212");
        var testMatches2 = obi.fromRegex.exec(test2);
        expect(testMatches2[3]).toEqual("6045551212");
        var testMatches3 = obi.fromRegex.exec(test3);
        expect(testMatches3[4]).toEqual("208.65.240.165");

    });

    it('cleanNumber', function() {
        var testnum = obi.cleanNumber("0111(345) 898 9888 x123");
        expect(testnum).toEqual("3458989888");
    });

    it('checking contacts loaded from import', function() {

        obi.start(function() { });
        waitsFor(function() {
            return obi.importCompleted();
        }, "the spreadsheet calculation to complete", 90000);

        runs(function() {
            obi.lookupCnam("604 555 1234");
            expect(obi.lastGrowlNumber).toEqual("604 555 1234");
            obi.lookupCnam("604 555 4321");
            expect(obi.lastGrowlNumber).toEqual("604 555 1234");
            obi.lookupCnam("604 555 3214");
            expect(obi.lastGrowlNumber).toEqual("604 555 3214");
            obi.lookupCnam("604 555 2341");
            expect(obi.lastGrowlNumber).toEqual("604 555 2341");
            obi.lookupCnam("604(555)x1111x");
            expect(obi.lastGrowlNumber).toEqual("604 555 2341");
        });
    });
});
