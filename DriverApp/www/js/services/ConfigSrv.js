angular.module('driverapp.services.config', [])

.factory('Config', function ($http) {
    var SERVER_URL = 'https://climbdev.smartcommunitylab.it/context-store/api';
    var OWNER_ID = null;
    var X_ACCESS_TOKEN = null;

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
