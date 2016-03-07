angular.module('driverapp.controllers.wizard', [])

.controller('WizardCtrl', function ($scope, $rootScope, $state, $ionicPopup, $ionicHistory, $ionicSlideBoxDelegate, $timeout, $filter, Config, Utils, StorageSrv, APISrv, WSNSrv) {
    $scope.swiperOptions = Config.WIZARD_SLIDER_OPTIONS;

    $scope.schools = [];
    $scope.routes = [];
    $scope.volunteers = null;

    var calendars = [];

    $scope.wizard = {
        school: null,
        driver: null,
        route: null,
        helpers: []
    };

    var loadDataBySchool = function (schoolId) {
        Utils.loading();
        $rootScope.loadAllBySchool(schoolId).then(
            function () {
                $scope.routes = StorageSrv.getRoutes();
                if ($scope.routes != null && $scope.routes.length == 1) {
                    $scope.wizard.route = $scope.routes[0];
                }
                $scope.volunteers = StorageSrv.getVolunteers();
                calendars = StorageSrv.getVolunteersCalendars();
                $ionicSlideBoxDelegate.update();
                Utils.loaded();
            },
            function (error) {
                console.log(error);
            }
        );
    };

    $scope.schools = [StorageSrv.getSchool()];

    // FIXME dev
    if ($scope.schools !== null && $scope.schools.length == 1) {
        $scope.wizard.school = $scope.schools[0];
    }

    if ($scope.wizard.school !== null) {
        loadDataBySchool($scope.wizard.school.objectId);
    }

    $scope.selectSchoolPopup = function () {
        var schoolPopup = $ionicPopup.show({
            templateUrl: 'templates/wizard_popup_school.html',
            title: 'Seleziona la scuola',
            scope: $scope,
            buttons: [{
                text: 'Annulla',
            }]
        });

        $scope.selectSchool = function (school) {
            $scope.wizard.school = school;
            schoolPopup.close();
            loadDataBySchool($scope.wizard.school.objectId);
        };
    };

    $scope.selectRoutePopup = function () {
        var routePopup = $ionicPopup.show({
            templateUrl: 'templates/wizard_popup_route.html',
            title: 'Seleziona il pedibus',
            scope: $scope,
            buttons: [{
                text: 'Annulla',
            }]
        });

        $scope.selectRoute = function (route) {
            $scope.wizard.route = route;
            routePopup.close();
        };
    };

    $scope.selectDriverPopup = function () {
        var driverPopup = $ionicPopup.show({
            templateUrl: 'templates/wizard_popup_driver.html',
            title: 'Chi sei?',
            scope: $scope,
            buttons: [{
                text: 'Annulla',
            }]
        });

        $scope.selectDriver = function (driver) {
            $scope.wizard.driver = driver;
            driverPopup.close();
        };
    };

    $scope.$on("wizard:IndexChanged", function (e, wizardIndex, wizardCount) {
        if (wizardIndex == 1) {
            /*
             * sort volunteers only if route exists but not a driver
             */
            var route = $scope.wizard.route;
            var sortedVolunteers = $filter('orderBy')(StorageSrv.getVolunteers(), ['checked', 'name']);
            // TODO sort using calendars
            for (var j = 0; j < calendars.length; j++) {
                var cal = calendars[j]
                if (cal.schoolId == StorageSrv.getSchoolId() && cal.routeId == route.objectId) {
                    // driver
                    var driverOnTop = false;
                    if (!!cal.driverId) {
                        for (var i = 0; i < sortedVolunteers.length; i++) {
                            if (sortedVolunteers[i].objectId == cal.driverId) {
                                Utils.moveInArray(sortedVolunteers, i, 0);
                                //console.log('Driver ' + sortedVolunteers[counter].name + ' moved on top');
                                driverOnTop = true;
                                i = sortedVolunteers.length;
                            }
                        }
                    }

                    // helpers
                    if (!!cal.helperList && cal.helperList.length > 0) {
                        var counter = driverOnTop ? 1 : 0;
                        cal.helperList.forEach(function (helperId) {
                            for (var i = 0; i < sortedVolunteers.length; i++) {
                                if (sortedVolunteers[i].objectId == helperId) {
                                    Utils.moveInArray(sortedVolunteers, i, counter);
                                    //console.log('Helper ' + sortedVolunteers[counter].name + ' moved to position ' + counter);
                                    counter++;
                                    i = sortedVolunteers.length;
                                }
                            }
                        });
                    }
                    j = calendars.length;
                }
            }
            $scope.volunteers = sortedVolunteers;

            // FIXME dev only!!!
            $scope.wizard.driver = $scope.volunteers[0];
            // FIXME /dev only!!!

        } else if (wizardIndex == 2) {
            // FIXME dev only!!!
            $scope.wizard.driver.wsnId = CONF.DEV_MASTER;

            if ($scope.wizard.driver.wsnId !== null && $scope.wizard.driver.wsnId.length > 0) {
                WSNSrv.connectMaster($scope.wizard.driver.wsnId).then(
                    function (procedureStarted) {},
                    function (reason) {
                        // TODO toast for failure
                        //Utils.toast('Problema di connessione con il nodo Master!', 5000, 'center');
                    }
                );
            }
        }
    });

    $scope.saveWizardChoices = function () {
        // TODO save volunteer in storage after password verification
        $scope.volunteers.forEach(function (vol) {
            if (vol.checked) {
                $scope.wizard.helpers.push(vol);
            }
        });

        $ionicHistory.nextViewOptions({
            historyRoot: true
        });
        $state.go('app.route', {
            routeId: $scope.wizard.route.objectId,
            fromWizard: true,
            driver: $scope.wizard.driver,
            route: $scope.wizard.route,
            helpers: $scope.wizard.helpers
        }, {
            reload: true
        });
    };
});
