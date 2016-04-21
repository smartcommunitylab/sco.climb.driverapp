angular.module('driverapp.controllers.home', [])

.controller('AppCtrl', function ($scope, $rootScope, $ionicPlatform, $q, $ionicModal, Config, StorageSrv, APISrv, WSNSrv, Utils, GeoSrv) {
    $rootScope.pedibusEnabled = true;
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
                                //dateFrom = '2016-03-22';
                                //dateTo = '2016-03-22';
                                APISrv.getVolunteersCalendarsBySchool(schoolId, dateFrom, dateTo).then(
                                    function (cals) {
                                        StorageSrv.saveVolunteersCalendars(cals).then(function (calendars) {
                                            APISrv.getChildrenBySchool(schoolId).then(
                                                function (children) {
                                                    StorageSrv.saveChildren(children).then(
                                                        function (children) {
                                                            WSNSrv.updateNodeList(children, 'child');

                                                            // download children images
                                                            angular.forEach(children, function (child) {
                                                                APISrv.getChildImage(child.objectId);
                                                            });
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
                        function (error) {StorageSrv.saveSchool(CONF.DEV_SCHOOL)
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

    // FIXME load schools
    StorageSrv.saveSchool(CONF.DEV_SCHOOL);

    $scope.getDriverName = function () {
        $scope.driverName = Utils.getMenuDriverTitle();
        return $scope.driverName;
    };

    $ionicModal.fromTemplateUrl('templates/app_modal_volunteers.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modalVolunteers = modal;
    });
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
