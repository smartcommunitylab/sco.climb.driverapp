angular.module('driverapp.services.config', [])

.factory('Config', function ($http, $q) {
    var config = {};

    config.SERVER_URL = CONF.SERVER_URL;
    config.EVENTS_SERVER_URL = CONF.EVENTS_SERVER_URL;
    config.OWNER_ID = CONF.OWNER_ID;
    config.X_ACCESS_TOKEN = CONF.X_ACCESS_TOKEN;

    config.GPS_DELAY = 4000;
    config.NETWORKSTATE_DELAY = 2000;
    config.NODESTATE_TIMEOUT = 10000;
    config.AUTOFINISH_DELAY = 2700000; // = 45min; 1800000 = 30 mins;

    config.HTTP_CONFIG = {
        timeout: 10000,
        headers: {
            'Content-Type': 'application/json',
            'X-ACCESS-TOKEN': config.X_ACCESS_TOKEN
        }
    };

    config.DATE_FORMAT = 'YYYY-MM-DD';
    config.WIZARD_SLIDER_OPTIONS = {};

    config.LOGFILE_PATH = '/CLIMB_log_data/aelog.txt';
    config.IMAGES_DIR = '/CLIMB_log_data/images/';

    return config;
});
