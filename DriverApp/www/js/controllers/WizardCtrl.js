angular.module('driverapp.controllers.wizard', [])

.controller('WizardCtrl', function ($scope, $state, Config, Utils, StorageSrv, APISrv) {
    var DEV_schoolId = '70b96fe4-0f76-477c-8a09-49911aa5fee2';

    $scope.swiperOptions = Config.getWizardSliderOptions();

    $scope.volunteers = null;
    $scope.routes = null;

    $scope.wizard = {
        children: [],
        routes: [],
        driver: null,
        route: null,
        helpers: []
    };

    APISrv.getChildrenBySchool(DEV_schoolId).then(
        function (children) {
            $scope.wizard.children = children;
        }
    );

    APISrv.getVolunteersBySchool(DEV_schoolId).then(
        function (volunteers) {
            $scope.volunteers = volunteers;
        },
        function (error) {
            // TODO handle error
            console.log(error);
        }
    );

    APISrv.getRoutesBySchool(DEV_schoolId, moment().format(Config.getDateFormat())).then(
        function (routes) {
            $scope.routes = routes;
        },
        function (error) {
            // TODO handle error
            console.log(error);
        }
    );

    $scope.saveWizardChoices = function () {
        // TODO save volunteer in storage after password verification
        StorageSrv.saveChildren($scope.wizard.children).then(
            function () {
                // TODO save route
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
            }
        );
    };
});
