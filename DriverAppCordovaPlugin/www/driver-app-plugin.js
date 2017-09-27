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
  'getMasters': function (successCallback, errorCallback) {
    cordova.exec(successCallback, errorCallback, serviceName, 'getMasters', [])
  },
  'connectMaster': function (masterId, successCallback, errorCallback) {
    cordova.exec(successCallback, errorCallback, serviceName, 'connectMaster', [masterId])
  },
  'setNodeList': function (nodeList, successCallback, errorCallback) {
    cordova.exec(successCallback, errorCallback, serviceName, 'setNodeList', [nodeList])
  },
  'getNetworkState': function (successCallback, errorCallback) {
    cordova.exec(successCallback, errorCallback, serviceName, 'getNetworkState', [])
  },
  'checkinChild': function (childId, successCallback, errorCallback) {
    cordova.exec(successCallback, errorCallback, serviceName, 'checkinChild', [childId])
  },
  'checkinChildren': function (childrenIds, successCallback, errorCallback) {
    cordova.exec(successCallback, errorCallback, serviceName, 'checkinChildren', [childrenIds])
  },
  'checkoutChild': function (childId, successCallback, errorCallback) {
    cordova.exec(successCallback, errorCallback, serviceName, 'checkoutChild', [childId])
  },
  'checkoutChildren': function (childrenIds, successCallback, errorCallback) {
    cordova.exec(successCallback, errorCallback, serviceName, 'checkoutChildren', [childrenIds])
  },
  'getLogFiles': function (successCallback, errorCallback) {
    cordova.exec(successCallback, errorCallback, serviceName, 'getLogFiles', [])
  },
  'enableMaintenanceProcedure': function (wakeUpYear, wakeUpMonth, wakeUpDay, wakeUpHour, wakeUpMinute, successCallback, errorCallback) {
    cordova.exec(successCallback, errorCallback, serviceName, 'enableMaintenanceProcedure', [wakeUpYear, wakeUpMonth, wakeUpDay, wakeUpHour, wakeUpMinute])
  },
  'disableMaintenanceProcedure': function (successCallback, errorCallback) {
    cordova.exec(successCallback, errorCallback, serviceName, 'disableMaintenanceProcedure', [])
  },
  'test': function (name, successCallback, errorCallback) {
    cordova.exec(successCallback, errorCallback, serviceName, 'test', [name])
  }
}
