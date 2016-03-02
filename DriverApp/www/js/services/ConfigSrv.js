angular.module('driverapp.services.config', [])

.factory('Config', function ($http, $q) {
    var config = {};

    config.SERVER_URL = CONF.SERVER_URL;
    config.EVENTS_SERVER_URL = CONF.EVENTS_SERVER_URL;
    config.OWNER_ID = CONF.OWNER_ID;
    config.X_ACCESS_TOKEN = CONF.X_ACCESS_TOKEN;
    config.GPS_DELAY = CONF.GPS_DELAY;
    config.NETWORKSTATE_DELAY = CONF.NETWORKSTATE_DELAY;
    config.NODESTATE_TIMEOUT = CONF.NODESTATE_TIMEOUT;

    config.HTTP_CONFIG = {
        timeout: 5000,
        headers: {
            'Content-Type': 'application/json',
            'X-ACCESS-TOKEN': config.X_ACCESS_TOKEN
        }
    };

    config.DATE_FORMAT = 'YYYY-MM-DD';
    config.WIZARD_SLIDER_OPTIONS = {};

    return config;
});
