/* global CONF */
angular.module('driverapp.services.config', [])
  .factory('Config', function ($rootScope, $http, $ionicLoading, $timeout, $q, StorageSrv) {
    var config = {}
    var mapJsonConfig = null;

    config.SERVER_URL = CONF.SERVER_URL
    config.webclientid = CONF.webclientid
    config.cliendID = CONF.cliendID
    config.clientSecID = CONF.clientSecID
    config.AACURL = CONF.AACURL
    config.EVENTS_SERVER_URL = CONF.EVENTS_SERVER_URL
    config.IDENTITIES = CONF.IDENTITIES
    config.APPID = CONF.APPID
    config.IDENTITY = {
      'OWNER_ID': '',
      'X-ACCESS-TOKEN': '',
      'PWD': ''
    }

    config.GPS_DELAY = 4000
    config.NETWORKSTATE_DELAY = 2000
    config.NODESTATE_TIMEOUT = 10000
    config.AUTOFINISH_DELAY = 2700000 // = 45min; 1800000 = 30 mins;

    config.HTTP_CONFIG = {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
        // ,
        // 'X-ACCESS-TOKEN': config.IDENTITY.X_ACCESS_TOKEN
      }
    }

    config.DATE_FORMAT = 'YYYY-MM-DD'
    config.WIZARD_SLIDER_OPTIONS = {}

    config.IMAGES_DIR = '/CLIMB_log_data/images/'

    config.setIdentity = function (index) {
      config.IDENTITY = config.IDENTITIES[index]
    }

    config.resetIdentity = function () {
      config.IDENTITY = {
        'OWNER_ID': '',
        'X-ACCESS-TOKEN': '',
        'PWD': ''
      }
    }
    // config.init = function () {


    config.imagesDir = function() {
      if (ionic.Platform.isAndroid()) {
        return cordova.file.externalRootDirectory + config.IMAGES_DIR;
      } else {
        return cordova.file.cacheDirectory  + config.IMAGES_DIR;
      }
    }

    config.getHttpConfig = function () {
      var httpcfg = angular.copy(config.HTTP_CONFIG)
      // httpcfg.headers['X-ACCESS-TOKEN'] = config.IDENTITY.X_ACCESS_TOKEN
      return httpcfg
    }
    config.getAppId = function () {
      return mapJsonConfig["appid"];
    }
  // config.getAACURL = function () {
  //   return mapJsonConfig["AACURL"];
  // }

  // config.getRedirectUri = function () {
  //   return mapJsonConfig["redirectURL"];
  // }
  // config.getClientId = function () {
  //   return mapJsonConfig["cliendID"];
  // }
  // config.getClientSecKey = function () {
  //   return mapJsonConfig["clientSecID"];
  // }
  // config.getWebClientId = function () {
  //   return mapJsonConfig["webclientid"];
  // }

  config.loading = function () {
    $ionicLoading.show();
  }
            config.loaded = function () {
    $timeout($ionicLoading.hide);
  }
    return config
  })
