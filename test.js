/**
 * Created with JetBrains WebStorm.
 * User: shawn
 * Date: 2014-06-11
 * Time: 11:32 PM
 * To change this template use File | Settings | File Templates.
 */
var jasmine = require('jasmine-node');

jasmine.executeSpecsInFolder({
    specFolders: ['spec'],
    isVerbose: true,
    showColors: true
});