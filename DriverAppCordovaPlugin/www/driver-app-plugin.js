/*global cordova, module*/
var serviceName = 'DriverAppPlugin';

module.exports = {
	getNetworkState : function(successCallback, errorCallback) {
		cordova.exec(successCallback, errorCallback, serviceName, 'getNetworkState', []);
	},
	test : function(name, successCallback, errorCallback) {
		cordova.exec(successCallback, errorCallback, serviceName, 'test', [ name ]);
	}
};
