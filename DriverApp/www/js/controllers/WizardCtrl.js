angular.module('driverapp.controllers.wizard', [])

.controller('WizardCtrl', function ($scope, $state, Config, Utils, StorageSrv, APISrv) {
    $scope.swiperOptions = Config.getWizardSliderOptions();

    var serverVolunteers = null;
    $scope.volunteers = null;
    var calendars = [];
    $scope.routes = null;

    $scope.wizard = {
        routes: [],
        driver: null,
        route: null,
        helpers: []
    };

    APISrv.getRoutesBySchool(StorageSrv.getSchool(), moment().format(Config.getDateFormat())).then(
        function (routes) {
            $scope.routes = routes;
        },
        function (error) {
            // TODO handle error
            console.log(error);
        }
    );

    APISrv.getVolunteersBySchool(StorageSrv.getSchool()).then(
        function (volunteers) {
            serverVolunteers = volunteers;
            $scope.volunteers = angular.copy(serverVolunteers);
        },
        function (error) {
            // TODO handle error
            console.log(error);
        }
    );

    var dateFrom = moment().format(Config.getDateFormat());
    var dateTo = moment().format(Config.getDateFormat());
    // FIXME remove hardcoded dates!
    dateFrom = '2016-02-20';
    dateTo = '2016-02-22';

    APISrv.getVolunteersCalendarsBySchool(StorageSrv.getSchool(), dateFrom, dateTo).then(
        function (cals) {
            calendars = cals;
        }
    );

    // sort volunteers only if route exists but not a driver
    $scope.$on("wizard:Next", function () {
        if (!$scope.wizard.route || !!$scope.wizard.driver || calendars.length == 0) {
            return;
        }

        var route = $scope.wizard.route;
        var sortedVolunteers = angular.copy(serverVolunteers);
        // TODO sort using calendars
        for (var j = 0; j < calendars.length; j++) {
            var cal = calendars[j]
            if (cal.schoolId == StorageSrv.getSchool() && cal.routeId == route.objectId) {
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
    });

    $scope.saveWizardChoices = function () {
        // TODO save volunteer in storage after password verification
        StorageSrv.saveRoutes($scope.wizard.route).then(
            function () {
                $scope.volunteers.forEach(function (vol) {
                    if (vol.checked) {
                        $scope.wizard.helpers.push(vol);
                    }
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
            }
        );
    };
});
