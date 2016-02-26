angular.module('driverapp.services.wsn', [])

.factory('WSNSrv', function ($q) {
    var wsnService = {};

    wsnService.init = function () {
        var deferred = $q.defer();

        window.DriverAppPlugin.init(
            function (response) {
                deferred.resolve(response);
            },
            function (reason) {
                console.log(reason);
                deferred.reject(reason);
            }
        );

        return deferred.promise;
    };

    wsnService.startListener = function () {
        var deferred = $q.defer();

        window.DriverAppPlugin.startListener(
            function (response) {
                deferred.resolve(response);
            },
            function (reason) {
                console.log(reason);
                deferred.reject(reason);
            }
        );

        return deferred.promise;
    };

    wsnService.stopListener = function () {
        var deferred = $q.defer();

        window.DriverAppPlugin.getMasters(
            function (response) {
                deferred.resolve(response);
            },
            function (reason) {
                console.log(reason);
                deferred.reject(reason);
            }
        );

        return deferred.promise;
    };

    wsnService.getMasters = function () {
        var deferred = $q.defer();

        window.DriverAppPlugin.getMasters(
            function (masters) {
                deferred.resolve(masters);
            },
            function (reason) {
                console.log(reason);
                deferred.reject(reason);
            }
        );

        return deferred.promise;
    };

    wsnService.connectMaster = function (masterId) {
        var deferred = $q.defer();

        window.DriverAppPlugin.connectMaster(
            masterId,
            function (response) {
                deferred.resolve(response);
            },
            function (reason) {
                console.log(reason);
                deferred.reject(reason);
            }
        );

        return deferred.promise;
    };

    wsnService.getNetworkState = function () {
        var deferred = $q.defer();

        window.DriverAppPlugin.getNetworkState(
            function (networkState) {
                deferred.resolve(networkState);
            },
            function (reason) {
                console.log(reason);
                deferred.reject(reason);
            }
        );

        return deferred.promise;
    };

    wsnService.test = function (text) {
        var deferred = $q.defer();

        window.DriverAppPlugin.test(
            text,
            function (response) {
                deferred.resolve(response);
            },
            function (reason) {
                console.log(reason);
                deferred.reject(reason);
            }
        );

        return deferred.promise;
    };

    return wsnService;
});
