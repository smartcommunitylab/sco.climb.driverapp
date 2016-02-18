angular.module('driverapp.services.storage', [])

.factory('StorageSrv', function ($q) {
    var storageService = {};

    var KEYS = {
        SCHOOL: 'da_school',
        CHILDREN: 'da_children',
        VOLUNTEERS: 'da_volunteers',
        VOLUNTEERS_CALS: 'da_volunteers_cals',
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

    storageService.saveVolunteers = function (volunteers) {
        var deferred = $q.defer();
        localStorage[KEYS.VOLUNTEERS] = JSON.stringify(volunteers);
        deferred.resolve(volunteers);
        return deferred.promise;
    };

    storageService.getVolunteers = function () {
        if (!!localStorage[KEYS.VOLUNTEERS]) {
            return JSON.parse(localStorage[KEYS.VOLUNTEERS]);
        }
        return null;
    };

    storageService.saveVolunteersCalendars = function (volunteerscals) {
        var deferred = $q.defer();
        localStorage[KEYS.VOLUNTEERS_CALS] = JSON.stringify(volunteerscals);
        deferred.resolve(volunteerscals);
        return deferred.promise;
    };

    storageService.getVolunteersCalendars = function () {
        if (!!localStorage[KEYS.VOLUNTEERS_CALS]) {
            return JSON.parse(localStorage[KEYS.VOLUNTEERS_CALS]);
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

    storageService.getRouteById = function (routeId) {
        var route = null;
        if (!!localStorage[KEYS.ROUTES]) {
            var routes = JSON.parse(localStorage[KEYS.ROUTES]);
            for (var i = 0; i < routes.length; i++) {
                if (routes[i].objectId == routeId) {
                    route = routes[i];
                    i = routes.length;
                }
            }
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
        //localStorage.removeItem(KEYS.SCHOOL);
        localStorage.removeItem(KEYS.CHILDREN);
        localStorage.removeItem(KEYS.ROUTES);
        localStorage.removeItem(KEYS.APPLICATION_EVENTS);
        deferred.resolve();
        return deferred.promise;
    };

    return storageService;
});
