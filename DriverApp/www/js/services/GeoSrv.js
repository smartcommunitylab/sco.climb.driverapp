angular.module('driverapp.services.geo', [])

.factory('GeoSrv', function ($interval, Config) {
    var Geo = {};

    var watchId = null;
    var position = null;

    var geolocalize = function () {
        watchId = navigator.geolocation.watchPosition(function (p) {
            position = p;
        }, function () {}, {
            enableHighAccuracy: true
        });
    };

    geolocalize();

    var geoInterval = null;

    Geo.startWatchingPosition = function (successCb, errorCb, delay) {
        if (!watchId) {
            geolocalize();
        }

        if (geoInterval === null && typeof successCb === 'function') {
            if (typeof errorCb !== 'function') {
                errorCb = function () {};
            }

            geoInterval = $interval(function () {
                successCb(position);
            }, delay);
        };
        return geoInterval;
    };

    Geo.stopWatchingPosition = function () {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;

        if (!!geoInterval) {
            var canceled = $interval.cancel(geoInterval);
            geoInterval = null;
        }
    };

    Geo.getCurrentPosition = function () {
        return position;
    };

    return Geo;
});
