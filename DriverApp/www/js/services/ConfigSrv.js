angular.module('driverapp.services.config', [])

.factory('Config', function ($http, $q) {
    var SERVER_URL = CONF.SERVER_URL;
    var OWNER_ID = CONF.OWNER_ID;
    var X_ACCESS_TOKEN = CONF.X_ACCESS_TOKEN;

    var HTTP_CONFIG = {
        timeout: 5000,
        headers: {
            'Content-Type': 'application/json',
            'X-ACCESS-TOKEN': X_ACCESS_TOKEN
        }
    };

    var DATE_FORMAT = 'YYYY-MM-DD';

    return {
        getServerURL: function () {
            return SERVER_URL;
        },
        getOwnerId: function () {
            return OWNER_ID;
        },
        getHTTPConfig: function () {
            return HTTP_CONFIG;
        },
        getDateFormat: function () {
            return DATE_FORMAT;
        }
    }
});
