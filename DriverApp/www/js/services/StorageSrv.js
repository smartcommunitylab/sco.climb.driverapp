angular.module('driverapp.services.storage', [])

.factory('StorageSrv', function ($q) {
    var storageService = {};

    var KEYS = {
        SCHOOL: 'da_school',
        CHILDREN: 'da_children',
        DRIVER: 'da_driver',
        ROUTES: 'da_routes',
        APPLICATION_EVENTS: 'da_eas'
    };

    storageService.saveSchool = function (school) {
        var deferred = $q.defer();
        localStorage[KEYS.SCHOOL] = JSON.stringify(school);
        deferred.resolve(school);
        return deferred.promise;
    };

    storageService.getSchool = function () {
        if (!!localStorage[KEYS.SCHOOL]) {
            return JSON.parse(localStorage[KEYS.SCHOOL]);
        }
        return null;
    };

    storageService.getSchoolId = function () {
        if (!!localStorage[KEYS.SCHOOL]) {
            return JSON.parse(localStorage[KEYS.SCHOOL])['objectId'];
        }
        return null;
    };

    storageService.saveChildren = function (children) {
        var deferred = $q.defer();
        localStorage[KEYS.CHILDREN] = JSON.stringify(children);
        deferred.resolve(children);
        return deferred.promise;
    };

    storageService.getChildren = function () {
        if (!!localStorage[KEYS.CHILDREN]) {
            return JSON.parse(localStorage[KEYS.CHILDREN]);
        }
        return null;
    };

    storageService.saveDriver = function (driver) {
        var deferred = $q.defer();
        localStorage[KEYS.DRIVER] = JSON.stringify(driver);
        deferred.resolve(driver);
        return deferred.promise;
    };

    storageService.getDriver = function () {
        if (!!localStorage[KEYS.DRIVER]) {
            return JSON.parse(localStorage[KEYS.DRIVER]);
        }
        return null;
    };

    storageService.getDriverId = function () {
        if (!!localStorage[KEYS.DRIVER]) {
            return JSON.parse(localStorage[KEYS.DRIVER])['objectId'];
        }
        return null;
    };

    storageService.saveRoutes = function (routes) {
        var deferred = $q.defer();
        localStorage[KEYS.ROUTES] = JSON.stringify(routes);
        deferred.resolve(routes);
        return deferred.promise;
    };

    storageService.getRoutes = function () {
        if (!!localStorage[KEYS.ROUTES]) {
            return JSON.parse(localStorage[KEYS.ROUTES]);
        }
        return null;
    };

    storageService.saveEAs = function (eas) {
        var deferred = $q.defer();
        localStorage[KEYS.APPLICATION_EVENTS] = JSON.stringify(eas);
        deferred.resolve(eas);
        return deferred.promise;
    };

    storageService.getEAs = function () {
        if (!!localStorage[KEYS.APPLICATION_EVENTS]) {
            return JSON.parse(localStorage[KEYS.APPLICATION_EVENTS]);
        }
        return null;
    };

    storageService.reset = function () {
        var deferred = $q.defer();
        //localStorage.clear();
        localStorage.removeItem(KEYS.SCHOOL);
        localStorage.removeItem(KEYS.ROUTES);
        deferred.resolve();
        return deferred.promise;
    };

    return storageService;
});
