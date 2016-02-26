angular.module('driverapp.services.api', [])

.factory('APISrv', function ($http, $q, Config, Utils) {
    var ERROR_TYPE = 'errorType';
    var ERROR_MSG = 'errorMsg';

    var APIService = {};

    APIService.getSchools = function () {
        var deferred = $q.defer();

        $http.get(Config.getServerURL() + '/school/' + Config.getOwnerId(), Config.getHTTPConfig())

        .then(
            function (response) {
                deferred.resolve(response.data);
            },
            function (reason) {
                deferred.reject('[' + reason.headers(ERROR_TYPE) + '] ' + reason.headers(ERROR_MSG));
            }
        );

        return deferred.promise;
    };

    APIService.getRouteById = function (routeId) {
        var deferred = $q.defer();

        if (!routeId) {
            deferred.reject('Invalid routeId');
            return deferred.promise;
        }

        $http.get(Config.getServerURL() + '/route/' + Config.getOwnerId() + '/' + routeId, Config.getHTTPConfig())

        .then(
            function (response) {
                deferred.resolve(response.data);
            },
            function (reason) {
                deferred.reject('[' + reason.headers(ERROR_TYPE) + '] ' + reason.headers(ERROR_MSG));
            }
        );

        return deferred.promise;
    };


    APIService.getRoutesBySchool = function (schoolId, date) {
        var deferred = $q.defer();

        if (!schoolId) {
            deferred.reject('Invalid schoolId');
            return deferred.promise;
        }

        var httpConfigWithParams = angular.copy(Config.getHTTPConfig());
        httpConfigWithParams.params = {};

        if (Utils.isValidDate(date)) {
            httpConfigWithParams.params['date'] = date;
        }

        $http.get(Config.getServerURL() + '/route/' + Config.getOwnerId() + '/school/' + schoolId, Config.getHTTPConfig())

        .then(
            function (response) {
                deferred.resolve(response.data);
            },
            function (reason) {
                deferred.reject('[' + reason.headers(ERROR_TYPE) + '] ' + reason.headers(ERROR_MSG));
            }
        );

        return deferred.promise;
    };

    APIService.getStopsByRoute = function (routeId) {
        var deferred = $q.defer();

        if (!routeId) {
            deferred.reject('Invalid routeId');
            return deferred.promise;
        }

        $http.get(Config.getServerURL() + '/stop/' + Config.getOwnerId() + '/' + routeId, Config.getHTTPConfig())

        .then(
            function (response) {
                deferred.resolve(response.data);
            },
            function (reason) {
                deferred.reject('[' + reason.headers(ERROR_TYPE) + '] ' + reason.headers(ERROR_MSG));
            }
        );

        return deferred.promise;
    };

    APIService.getChildrenBySchool = function (schoolId) {
        var deferred = $q.defer();

        if (!schoolId) {
            deferred.reject('Invalid schoolId');
            return deferred.promise;
        }

        $http.get(Config.getServerURL() + '/child/' + Config.getOwnerId() + '/' + schoolId, Config.getHTTPConfig())

        .then(
            function (response) {
                deferred.resolve(response.data);
            },
            function (reason) {
                deferred.reject('[' + reason.headers(ERROR_TYPE) + '] ' + reason.headers(ERROR_MSG));
            }
        );

        return deferred.promise;
    };

    APIService.getChildrenBySchoolAndClass = function (schoolId, classRoom) {
        var deferred = $q.defer();

        if (!schoolId) {
            deferred.reject('Invalid schoolId');
            return deferred.promise;
        } else if (!classRoom) {
            deferred.reject('Invalid classRoom');
            return deferred.promise;
        }

        var httpConfigWithParams = angular.copy(Config.getHTTPConfig());
        httpConfigWithParams.params = {
            'classRoom': classRoom
        };

        $http.get(Config.getServerURL() + '/child/' + Config.getOwnerId() + '/' + schoolId + '/classroom', httpConfigWithParams)

        .then(
            function (response) {
                deferred.resolve(response.data);
            },
            function (reason) {
                deferred.reject('[' + reason.headers(ERROR_TYPE) + '] ' + reason.headers(ERROR_MSG));
            }
        );

        return deferred.promise;
    };

    APIService.getAnchors = function () {
        var deferred = $q.defer();

        $http.get(Config.getServerURL() + '/anchor/' + Config.getOwnerId(), Config.getHTTPConfig())

        .then(
            function (response) {
                deferred.resolve(response.data);
            },
            function (reason) {
                deferred.reject('[' + reason.headers(ERROR_TYPE) + '] ' + reason.headers(ERROR_MSG));
            }
        );

        return deferred.promise;
    };

    APIService.getVolunteersBySchool = function (schoolId) {
        var deferred = $q.defer();

        if (!schoolId) {
            deferred.reject('Invalid schoolId');
            return deferred.promise;
        }

        $http.get(Config.getServerURL() + '/volunteer/' + Config.getOwnerId() + '/' + schoolId, Config.getHTTPConfig())

        .then(
            function (response) {
                deferred.resolve(response.data);
            },
            function (reason) {
                deferred.reject('[' + reason.headers(ERROR_TYPE) + '] ' + reason.headers(ERROR_MSG));
            }
        );

        return deferred.promise;
    };

    APIService.getVolunteersCalendarsBySchool = function (schoolId, dateFrom, dateTo) {
        var deferred = $q.defer();

        if (!schoolId) {
            deferred.reject('Invalid schoolId');
            return deferred.promise;
        } else if (!Utils.isValidDateRange(dateFrom, dateTo)) {
            deferred.reject('Invalid date range');
            return deferred.promise;
        }

        var httpConfigWithParams = angular.copy(Config.getHTTPConfig());
        httpConfigWithParams.params = {
            'dateFrom': dateFrom,
            'dateTo': dateTo
        };

        $http.get(Config.getServerURL() + '/volunteercal/' + Config.getOwnerId() + '/' + schoolId, httpConfigWithParams)

        .then(
            function (response) {
                deferred.resolve(response.data);
            },
            function (reason) {
                deferred.reject('[' + reason.headers(ERROR_TYPE) + '] ' + reason.headers(ERROR_MSG));
            }
        );

        return deferred.promise;
    };

    APIService.getVolunteersCalendarsBySchoolAndVolunteer = function (schoolId, volunteerId, dateFrom, dateTo) {
        var deferred = $q.defer();

        if (!schoolId) {
            deferred.reject('Invalid schoolId');
            return deferred.promise;
        } else if (!volunteerId) {
            deferred.reject('Invalid volunteerId');
            return deferred.promise;
        } else if (!Utils.isValidDateRange(dateFrom, dateTo)) {
            deferred.reject('Invalid date range');
            return deferred.promise;
        }

        var httpConfigWithParams = angular.copy(Config.getHTTPConfig());
        httpConfigWithParams.params = {
            'dateFrom': dateFrom,
            'dateTo': dateTo
        };

        $http.get(Config.getServerURL() + '/volunteercal/' + Config.getOwnerId() + '/' + schoolId + '/' + volunteerId, httpConfigWithParams)

        .then(
            function (response) {
                deferred.resolve(response.data);
            },
            function (reason) {
                deferred.reject('[' + reason.headers(ERROR_TYPE) + '] ' + reason.headers(ERROR_MSG));
            }
        );

        return deferred.promise;
    };

    APIService.addEvents = function (events) {
        var deferred = $q.defer();

        if (!events || events.length === 0) {
            deferred.reject('Invalid events');
        }

        $http.post(Config.getEventsServerURL() + '/event/' + Config.getOwnerId(), events, Config.getHTTPConfig())

        .then(
            function (response) {
                deferred.resolve(response.data);
            },
            function (reason) {
                deferred.reject('[' + reason.headers(ERROR_TYPE) + '] ' + reason.headers(ERROR_MSG));
            }
        );

        return deferred.promise;
    };

    return APIService;
});
