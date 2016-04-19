angular.module('driverapp.services.api', [])

.factory('APISrv', function ($http, $q, Config, Utils, WSNSrv) {
    var ERROR_TYPE = 'errorType';
    var ERROR_MSG = 'errorMsg';

    var APIService = {};

    APIService.getSchools = function () {
        var deferred = $q.defer();

        $http.get(Config.SERVER_URL + '/school/' + Config.OWNER_ID, Config.HTTP_CONFIG)

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

        $http.get(Config.SERVER_URL + '/route/' + Config.OWNER_ID + '/' + routeId, Config.HTTP_CONFIG)

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

        var httpConfigWithParams = angular.copy(Config.HTTP_CONFIG);
        httpConfigWithParams.params = {};

        if (Utils.isValidDate(date)) {
            httpConfigWithParams.params['date'] = date;
        }

        $http.get(Config.SERVER_URL + '/route/' + Config.OWNER_ID + '/school/' + schoolId, Config.HTTP_CONFIG)

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

        $http.get(Config.SERVER_URL + '/stop/' + Config.OWNER_ID + '/' + routeId, Config.HTTP_CONFIG)

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

        $http.get(Config.SERVER_URL + '/child/' + Config.OWNER_ID + '/' + schoolId, Config.HTTP_CONFIG)

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

        var httpConfigWithParams = angular.copy(Config.HTTP_CONFIG);
        httpConfigWithParams.params = {
            'classRoom': classRoom
        };

        $http.get(Config.SERVER_URL + '/child/' + Config.OWNER_ID + '/' + schoolId + '/classroom', httpConfigWithParams)

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

    APIService.getChildImage = function (childId) {
        var deferred = $q.defer();

        if (!childId) {
            deferred.reject('Invalid childId');
            return deferred.promise;
        }

        var httpConfig = angular.copy(Config.HTTP_CONFIG);
        httpConfig.headers['Content-Type'] = 'application/octet-stream';

        $http.get(Config.SERVER_URL + '/image/download/png/' + Config.OWNER_ID + '/' + childId, httpConfig)

        .then(
            function (response) {
                // TODO handle image
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

        $http.get(Config.SERVER_URL + '/anchor/' + Config.OWNER_ID, Config.HTTP_CONFIG)

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

        $http.get(Config.SERVER_URL + '/volunteer/' + Config.OWNER_ID + '/' + schoolId, Config.HTTP_CONFIG)

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

        var httpConfigWithParams = angular.copy(Config.HTTP_CONFIG);
        httpConfigWithParams.params = {
            'dateFrom': dateFrom,
            'dateTo': dateTo
        };

        $http.get(Config.SERVER_URL + '/volunteercal/' + Config.OWNER_ID + '/' + schoolId, httpConfigWithParams)

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

        var httpConfigWithParams = angular.copy(Config.HTTP_CONFIG);
        httpConfigWithParams.params = {
            'dateFrom': dateFrom,
            'dateTo': dateTo
        };

        $http.get(Config.SERVER_URL + '/volunteercal/' + Config.OWNER_ID + '/' + schoolId + '/' + volunteerId, httpConfigWithParams)

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

        $http.post(Config.EVENTS_SERVER_URL + '/event/' + Config.OWNER_ID, events, Config.HTTP_CONFIG)

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

    APIService.uploadLog = function (fileURL, routeId) {
        var deferred = $q.defer();

        if (ionic.Platform.isWebView()) {
            if (!fileURL || fileURL.length === 0) {
                deferred.reject('Invalid fileURL');
            }

            //fileURL = cordova.file.externalRootDirectory + fileURL;
            fileURL = 'file://' + fileURL;

            var options = new FileUploadOptions();
            options.fileKey = 'file';
            options.fileName = fileURL.substr(fileURL.lastIndexOf('/') + 1);
            if (!!routeId) {
                options.fileName = routeId + '_' + options.fileName;
            }

            options.mimeType = 'text/plain';
            options.headers = {
                'X-ACCESS-TOKEN': Config.X_ACCESS_TOKEN
            };
            options.params = {
                name: options.fileName
            };

            var serverURL = Config.EVENTS_SERVER_URL + '/log/upload/' + Config.OWNER_ID;

            var ft = new FileTransfer();
            ft.upload(
                fileURL,
                encodeURI(serverURL),
                function (r) {
                    deferred.resolve(r.response);
                },
                function (error) {
                    deferred.reject(error);
                },
                options
            );
        } else {
            deferred.reject('cordova is not defined');
        }

        return deferred.promise;
    };

    APIService.uploadWsnLogs = function (routeId) {
        var deferred = $q.defer();

        if (ionic.Platform.isWebView()) {
            WSNSrv.getLogFiles().then(
                function (logFilesPaths) {
                    angular.forEach(logFilesPaths, function (logFilePath) {
                        APIService.uploadLog(logFilePath, routeId).then(
                            function (r) {
                                deferred.resolve(r);
                            },
                            function (error) {
                                deferred.error(error);
                            }
                        );
                    });
                },
                function (reason) {
                    // TODO toast for failure
                    //Utils.toast('Problema di connessione con il nodo Master!', 5000, 'center');
                }
            );
        } else {
            deferred.reject('cordova is not defined');
        }

        return deferred.promise;
    };

    return APIService;
});
