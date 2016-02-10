angular.module('driverapp.services.storage', [])

.factory('StorageSrv', function ($q) {
    var storageService = {};

    storageService.saveSchool = function (school) {
        var deferred = $q.defer();
        localStorage['school'] = JSON.stringify(school);
        deferred.resolve(school);
        return deferred.promise;
    };

    storageService.getSchool = function () {
        if (!!localStorage['school']) {
            return JSON.parse(localStorage['school']);
        }
        return null;
    };

    storageService.getSchoolId = function () {
        if (!!localStorage['school']) {
            return JSON.parse(localStorage['school'])['objectId'];
        }
        return null;
    };

    storageService.saveVolunteer = function (volunteer) {
        var deferred = $q.defer();
        localStorage['volunteer'] = JSON.stringify(volunteer);
        deferred.resolve(volunteer);
        return deferred.promise;
    };

    storageService.getVolunteer = function () {
        if (!!localStorage['volunteer']) {
            return JSON.parse(localStorage['volunteer']);
        }
        return null;
    };

    storageService.getVolunteerId = function () {
        if (!!localStorage['volunteer']) {
            return JSON.parse(localStorage['volunteer'])['objectId'];
        }
        return null;
    };

    storageService.reset = function () {
        var deferred = $q.defer();
        localStorage.removeItem('school');
        localStorage.removeItem('volunteer');
        deferred.resolve();
        return deferred.promise;
    };

    return storageService;
});
