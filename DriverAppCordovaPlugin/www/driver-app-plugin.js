/*global cordova, module*/
var serviceName = 'DriverAppPlugin';

module.exports = {
    test: function (name, successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, serviceName, 'test', [name]);
    }
};
