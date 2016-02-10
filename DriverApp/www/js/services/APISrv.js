angular.module('driverapp.services.api', [])

.factory('APISrv', function ($http, $q, Config, Utils) {
    var APIService = {};

    APIService.getSchools = function () {
        var deferred = $q.defer();

        $http.get(Config.getServerURL() + '/school/' + Config.getOwnerId(), Config.getHTTPConfig())

        .then(
            function (response) {
                deferred.resolve(response.data);
            },
            function (responseError) {
                deferred.reject(responseError);
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
            function (responseError) {
                deferred.reject(responseError);
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
            function (responseError) {
                deferred.reject(responseError);
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
            function (responseError) {
                deferred.reject(responseError);
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
            function (responseError) {
                deferred.reject(responseError);
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
            function (responseError) {
                deferred.reject(responseError);
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
            function (responseError) {
                deferred.reject(responseError);
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
            function (responseError) {
                deferred.reject(responseError);
            }
        );

        return deferred.promise;
    };

    APIService.getVolunteersCalendarsBySchool = function (schoolId, dateFrom, dateTo) {
        var deferred = $q.defer();

        if (!schoolId) {
            deferred.reject('Invalid schoolId');
            return deferred.promise;
        }

        var httpConfigWithParams = angular.copy(Config.getHTTPConfig());
        httpConfigWithParams.params = {};

        if (Utils.isValidDateRange(dateFrom, dateTo)) {
            httpConfigWithParams.params['dateFrom'] = dateFrom;
            httpConfigWithParams.params['dateTo'] = dateTo;
        }

        $http.get(Config.getServerURL() + '/volunteercal/' + Config.getOwnerId() + '/' + schoolId, httpConfigWithParams)

        .then(
            function (response) {
                deferred.resolve(response.data);
            },
            function (responseError) {
                deferred.reject(responseError);
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
        }

        var httpConfigWithParams = angular.copy(Config.getHTTPConfig());
        httpConfigWithParams.params = {};

        if (Utils.isValidDateRange(dateFrom, dateTo)) {
            httpConfigWithParams.params['dateFrom'] = dateFrom;
            httpConfigWithParams.params['dateTo'] = dateTo;
        }

        $http.get(Config.getServerURL() + '/volunteercal/' + Config.getOwnerId() + '/' + schoolId + '/' + volunteerId, Config.getHTTPConfig())

        .then(
            function (response) {
                deferred.resolve(response.data);
            },
            function (responseError) {
                deferred.reject(responseError);
            }
        );

        return deferred.promise;
    };

    return APIService;
});
