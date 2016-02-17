angular.module('driverapp.services.config', [])

.factory('Config', function ($http, $q) {
    var SERVER_URL = CONF.SERVER_URL;
    var EVENTS_SERVER_URL = CONF.EVENTS_SERVER_URL;
    var OWNER_ID = CONF.OWNER_ID;
    var X_ACCESS_TOKEN = CONF.X_ACCESS_TOKEN;
    var GPS_DELAY = CONF.GPS_DELAY;

    var HTTP_CONFIG = {
        timeout: 5000,
        headers: {
            'Content-Type': 'application/json',
            'X-ACCESS-TOKEN': X_ACCESS_TOKEN
        }
    };

    var DATE_FORMAT = 'YYYY-MM-DD';

    var WIZARD_SLIDER_OPTIONS = {};

    return {
        getServerURL: function () {
            return SERVER_URL;
        },
        getEventsServerURL: function () {
            return EVENTS_SERVER_URL;
        },
        getOwnerId: function () {
            return OWNER_ID;
        },
        getGPSDelay: function () {
            return GPS_DELAY;
        },
        getHTTPConfig: function () {
            return HTTP_CONFIG;
        },
        getDateFormat: function () {
            return DATE_FORMAT;
        },
        getWizardSliderOptions: function () {
            return WIZARD_SLIDER_OPTIONS;
        }
    };
});
