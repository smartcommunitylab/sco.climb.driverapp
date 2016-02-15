angular.module('driverapp.services.storage', [])

.factory('StorageSrv', function ($q) {
    var storageService = {};

    var KEYS = {
        SCHOOL: 'da_school',
        CHILDREN: 'da_children',
        DRIVER: 'da_driver',
        ROUTE: 'da_route'
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

    storageService.saveRoute = function (route) {
        var deferred = $q.defer();
        localStorage[KEYS.ROUTE] = JSON.stringify(route);
        deferred.resolve(route);
        return deferred.promise;
    };

    storageService.getRoute = function () {
        if (!!localStorage[KEYS.ROUTE]) {
            return JSON.parse(localStorage[KEYS.ROUTE]);
        }
        return null;
    };

    storageService.reset = function () {
        var deferred = $q.defer();
        //localStorage.clear();
        localStorage.removeItem(KEYS.SCHOOL);
        localStorage.removeItem(KEYS.DRIVER);
        deferred.resolve();
        return deferred.promise;
    };

    return storageService;
});
