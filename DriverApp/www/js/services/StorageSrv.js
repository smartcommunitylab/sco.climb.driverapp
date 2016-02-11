angular.module('driverapp.services.storage', [])

.factory('StorageSrv', function ($q) {
    var storageService = {};

    var KEYS = {
        SCHOOL: 'da_school',
        VOLUNTEER: 'da_volunteer'
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

    storageService.saveVolunteer = function (volunteer) {
        var deferred = $q.defer();
        localStorage[KEYS.VOLUNTEER] = JSON.stringify(volunteer);
        deferred.resolve(volunteer);
        return deferred.promise;
    };

    storageService.getVolunteer = function () {
        if (!!localStorage[KEYS.VOLUNTEER]) {
            return JSON.parse(localStorage[KEYS.VOLUNTEER]);
        }
        return null;
    };

    storageService.getVolunteerId = function () {
        if (!!localStorage[KEYS.VOLUNTEER]) {
            return JSON.parse(localStorage[KEYS.VOLUNTEER])['objectId'];
        }
        return null;
    };

    storageService.reset = function () {
        var deferred = $q.defer();
        //localStorage.clear();
        localStorage.removeItem(KEYS.SCHOOL);
        localStorage.removeItem(KEYS.VOLUNTEER);
        deferred.resolve();
        return deferred.promise;
    };

    return storageService;
});
