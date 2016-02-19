angular.module('driverapp.controllers.wizard', [])

.controller('WizardCtrl', function ($scope, $state, $ionicHistory, $ionicSlideBoxDelegate, Config, Utils, StorageSrv, APISrv) {
    $scope.swiperOptions = Config.getWizardSliderOptions();

    $scope.routes = StorageSrv.getRoutes();
    $ionicSlideBoxDelegate.update();
    $scope.volunteers = null;
    var calendars = [];

    $scope.wizard = {
        routes: [],
        driver: null,
        route: null,
        helpers: []
    };

    if ($scope.routes == null) {
        APISrv.getRoutesBySchool(StorageSrv.getSchoolId(), moment().format(Config.getDateFormat())).then(
            function (routes) {
                StorageSrv.saveRoutes(routes).then(function (routes) {
                    $scope.routes = routes;
                    $ionicSlideBoxDelegate.update();
                });
            },
            function (error) {
                // TODO handle error
                console.log(error);
            }
        );
    }

    APISrv.getVolunteersBySchool(StorageSrv.getSchoolId()).then(
        function (volunteers) {
            StorageSrv.saveVolunteers(volunteers);
            $scope.volunteers = volunteers;
        },
        function (error) {
            // TODO handle error
            console.log(error);
        }
    );

    var dateFrom = moment().format(Config.getDateFormat());
    var dateTo = moment().format(Config.getDateFormat());
    // FIXME remove hardcoded dates!
    dateFrom = '2016-02-22';
    dateTo = '2016-02-24';

    APISrv.getVolunteersCalendarsBySchool(StorageSrv.getSchoolId(), dateFrom, dateTo).then(
        function (cals) {
            StorageSrv.saveVolunteersCalendars(cals);
            calendars = cals;
        }
    );

    $scope.$on("wizard:IndexChanged", function (e, wizardIndex, wizardCount) {
        if (wizardIndex == 1) {
            /*
             * sort volunteers only if route exists but not a driver
             */
            var route = $scope.wizard.route;
            var sortedVolunteers = StorageSrv.getVolunteers();
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
