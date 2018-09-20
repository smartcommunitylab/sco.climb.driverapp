/* global cordova, module */
'use strict';
var argscheck = require('cordova/argscheck');
var exec = require('cordova/exec');
var serviceName = 'DriverAppPlugin'

module.exports = {
  'init': function (successCallback, errorCallback) {
     cordova.exec(successCallback, errorCallback, serviceName, 'initialize', [])
  },
  'deinit': function (successCallback, errorCallback) {
     cordova.exec(successCallback, errorCallback, serviceName, 'deinitialize', [])
  },
  'startListener': function (successCallback, errorCallback) {
    cordova.exec(successCallback, errorCallback, serviceName, 'startListener', [])
  },
  'stopListener': function (successCallback, errorCallback) {
    cordova.exec(successCallback, errorCallback, serviceName, 'stopListener', [])
  },
  'getNetworkState': function (successCallback, errorCallback) {
    cordova.exec(successCallback, errorCallback, serviceName, 'getNetworkState', [])
  },
  'getLogFiles': function (successCallback, errorCallback) {
    cordova.exec(successCallback, errorCallback, serviceName, 'getLogFiles', [])
  },
  'test': function (name, successCallback, errorCallback) {
    cordova.exec(successCallback, errorCallback, serviceName, 'test', [name])
  }
}
