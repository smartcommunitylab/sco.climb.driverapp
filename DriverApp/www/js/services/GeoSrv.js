angular.module('driverapp.services.geo', [])

.factory('GeoSrv', function ($interval, Config) {
    var Geo = {};

    var geoInterval = null;

    Geo.startWatchingPosition = function (successCb, errorCb, delay) {
        if (geoInterval === null && typeof successCb === 'function') {
            if (typeof errorCb !== 'function') {
                errorCb = function () {};
            }

            geoInterval = $interval(function () {
                navigator.geolocation.getCurrentPosition(successCb, errorCb, {
                    enableHighAccuracy: true
                });
            }, delay);
        };
        return geoInterval;
    };

    Geo.stopWatchingPosition = function () {
        if (!!geoInterval) {
            var canceled = $interval.cancel(geoInterval);
            geoInterval = null;
        }
    };

    return Geo;
});
