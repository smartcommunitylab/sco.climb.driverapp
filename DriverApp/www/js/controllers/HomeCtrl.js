angular.module('driverapp.controllers.home', [])

.controller('AppCtrl', function ($scope, $rootScope, $ionicPlatform, $q, Config, StorageSrv, APISrv, WSNSrv, Utils) {
    /*
     * FIXME dev purpose only!
     */
    StorageSrv.reset();

    $rootScope.loadAllBySchool = function (schoolId) {
        var deferred = $q.defer();

        APISrv.getRoutesBySchool(schoolId, moment().format(Config.DATE_FORMAT)).then(
            function (routes) {
                StorageSrv.saveRoutes(routes).then(function (routes) {
                    APISrv.getVolunteersBySchool(schoolId).then(
                        function (volunteers) {
                            StorageSrv.saveVolunteers(volunteers).then(function (volunteers) {
                                var dateFrom = moment().format(Config.DATE_FORMAT);
                                var dateTo = moment().format(Config.DATE_FORMAT);
                                // FIXME remove hardcoded dates!
                                //dateFrom = '2016-02-22';
                                //dateTo = '2016-02-24';
                                APISrv.getVolunteersCalendarsBySchool(schoolId, dateFrom, dateTo).then(
                                    function (cals) {
                                        StorageSrv.saveVolunteersCalendars(cals).then(function (calendars) {
                                            APISrv.getChildrenBySchool(schoolId).then(
                                                function (children) {
                                                    StorageSrv.saveChildren(children).then(
                                                        function (children) {
                                                            WSNSrv.updateNodeList(children, 'child');
                                                        }
                                                    );
                                                    deferred.resolve();
                                                },
                                                function (error) {
                                                    // TODO handle error
                                                    console.log(error);
                                                    deferred.reject(error);
                                                }
                                            );
                                        });
                                    },
                                    function (error) {
                                        // TODO handle error
                                        console.log(error);
                                        deferred.reject(error);
                                    }
                                );
                            });
                        },
                        function (error) {
                            // TODO handle error
                            console.log(error);
                            deferred.reject(error);
                        }
                    );
                });
            },
            function (error) {
                // TODO handle error
                console.log(error);
                deferred.reject(error);
            }
        );

        return deferred.promise;
    };

    StorageSrv.saveSchool(CONF.DEV_SCHOOL).then(function (school) {
        /*
         * INIT!
         */
        Utils.loading();
        $rootScope.loadAllBySchool(StorageSrv.getSchoolId()).then(
            function () {
                Utils.loaded();
            }
        );
    });

    $scope.getDriverName = function() {
        $scope.driverName = Utils.getMenuDriverTitle();
        return $scope.driverName;
    }
})

.controller('HomeCtrl', function ($scope, Utils, StorageSrv, APISrv) {
    StorageSrv.reset();

    $scope.schools = null;
    $scope.school = null;

    APISrv.getSchools().then(
        function (schools) {
            $scope.schools = schools;
        },
        function (error) {
            console.log(error);
        }
    );

    $scope.chooseSchool = function (school) {
        // retrieve volunteers
    };
});
