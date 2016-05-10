angular.module('driverapp.controllers.home', [])

.controller('AppCtrl', function ($scope, $rootScope, $state, $ionicPlatform, $q, $ionicPopup, $ionicModal, Config, StorageSrv, APISrv, WSNSrv, Utils, GeoSrv) {
    $rootScope.pedibusEnabled = true;
    /*
     * FIXME dev purpose only!
     */
    StorageSrv.reset();

    /*
     * LOGIN
     */
    $scope.login = {
        identities: [],
        identity: null,
        identityIndex: null,
        identityPwd: ''
    };

    $ionicModal.fromTemplateUrl('templates/wizard_modal_login.html', {
        scope: $scope,
        animation: 'slide-in-up',
        backdropClickToClose: false,
        hardwareBackButtonClose: false
    }).then(function (modal) {
        $rootScope.modalLogin = modal;

        // FIXME dev purpose only!
        //StorageSrv.saveIdentityIndex(0);

        if (StorageSrv.getIdentityIndex() == null) {
            $rootScope.modalLogin.show();
        } else {
            $scope.identity = Config.IDENTITIES[StorageSrv.getIdentityIndex()];
        }
    });

    $scope.selectIdentityPopup = function () {
        $scope.login.identities = Config.IDENTITIES;

        var identityPopup = $ionicPopup.show({
            templateUrl: 'templates/wizard_popup_identity.html',
            title: 'Seleziona identità',
            scope: $scope,
            buttons: [{
                text: 'Annulla',
                type: 'button-stable'
            }]
        });

        $scope.selectIdentity = function (index) {
            $scope.login.identityIndex = index;
            $scope.login.identity = $scope.login.identities[index];
            identityPopup.close();
        };
    };

    $scope.checkIdentityPwd = function () {
        if (!!$scope.login.identity && $scope.login.identityPwd === $scope.login.identity.PWD) {
            console.log('+++ Right password +++');
            StorageSrv.saveIdentityIndex($scope.login.identityIndex);
            $rootScope.identity = $scope.login.identity;
            $rootScope.modalLogin.hide();

            $state.go($state.current, {}, {
                reload: true
            });
        } else {
            console.log('--- Wrong password ---');
            Utils.toast('La password non è corretta!');
        }
    };

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

                                                            if (Utils.isConnectionFastEnough()) {
                                                                // download children images
                                                                var counter = 0;
                                                                var downloaded = 0;
                                                                angular.forEach(children, function (child) {
                                                                    APISrv.getChildImage(child.objectId).then(
                                                                        function () {
                                                                            downloaded++;
                                                                            counter++;
                                                                            console.log('Downloaded images: ' + downloaded + ' (Total: ' + counter + '/' + children.length + ')');
                                                                            if (counter == children.length) {
                                                                                deferred.resolve();
                                                                            }
                                                                        },
                                                                        function () {
                                                                            counter++;
                                                                            if (counter == children.length) {
                                                                                deferred.resolve();
                                                                            }
                                                                        }
                                                                    );
                                                                });
                                                            } else {
                                                                deferred.resolve();
                                                            }
                                                        }
                                                    );
                                                    //deferred.resolve();
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
                            StorageSrv.saveSchool(CONF.DEV_SCHOOL)
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
