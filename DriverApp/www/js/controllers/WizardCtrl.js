angular.module('driverapp.controllers.wizard', [])

.controller('WizardCtrl', function ($scope, $state, Config, Utils, StorageSrv, APISrv) {
    var DEV_schoolId = '70b96fe4-0f76-477c-8a09-49911aa5fee2';

    $scope.swiperOptions = Config.getWizardSliderOptions();

    $scope.volunteers = null;
    $scope.routes = null;

    $scope.wizard = {
        driver: null,
        children: null,
        route: null,
        helpers: null
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
        StorageSrv.saveDriver($scope.wizard.driver).then(
            function () {
                StorageSrv.saveChildren($scope.wizard.children).then(
                    function () {
                        // TODO save route
                        StorageSrv.saveRoute($scope.wizard.route).then(
                            function () {
                                // TODO save helpers
                                /*
                                for (var vol in $scope.volunteers) {
                                    if (vol.checked) {
                                        $scope.wizard.helpers.push(vol);
                                    }
                                }
                                */
                                /*
                                StorageSrv.saveHelpers($scope.wizard.helpers).then(
                                    function () {
                                */
                                $state.go('app.route', {}, {
                                    reload: true
                                });
                                /*
                                    }
                                );
                                */
                            }
                        );
                    }
                );
            }
        );
    };
});
