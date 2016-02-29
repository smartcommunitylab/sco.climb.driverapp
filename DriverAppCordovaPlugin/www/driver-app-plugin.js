/*global cordova, module*/
var serviceName = 'DriverAppPlugin';

module.exports = {
    'init': function (successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, serviceName, 'init', []);
    },
    'startListener': function (successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, serviceName, 'startListener', []);
    },
    'stopListener': function (successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, serviceName, 'stopListener', []);
    },
    'getMasters': function (successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, serviceName, 'getMasters', []);
    },
    'connectMaster': function (masterId, successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, serviceName, 'connectMaster', [masterId]);
    },
    'getNetworkState': function (successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, serviceName, 'getNetworkState', []);
    },
    'setNodeList': function (nodeList, successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, serviceName, 'setNodeList', [nodeList]);
    },
    'test': function (name, successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, serviceName, 'test', [name]);
    }
};
