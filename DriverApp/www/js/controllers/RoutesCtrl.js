angular.module('driverapp.controllers.routes', [])

.controller('RoutesCtrl', function ($scope, $state, Config, StorageSrv, APISrv) {
    $scope.routes = StorageSrv.getRoutes();

    if ($scope.routes == null) {
        APISrv.getRoutesBySchool(StorageSrv.getSchoolId(), moment().format(Config.getDateFormat())).then(
            function (routes) {
                StorageSrv.saveRoutes(routes);
                $scope.routes = routes;
            },
            function (error) {
                // TODO handle error
                console.log(error);
            }
        );
    }

    $scope.viewRoute = function (route) {
        $state.go('app.route', {
            routeId: route.objectId,
            fromWizard: false,
            route: route
        });
    };
});
