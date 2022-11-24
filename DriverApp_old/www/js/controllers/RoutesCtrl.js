angular.module('driverapp.controllers.routes', [])

.controller('RoutesCtrl', function ($scope, $state, Config, StorageSrv, APISrv) {
    $scope.routes = StorageSrv.getRoutes();

    $scope.loadAllRouteInfo = function (routes){
        var passengersNum = 0;
        var routeInfo = "";
        $scope.routeComplex = [];
        for(var r = 0; r < routes.length; r++){
            $scope.actualRoute = routes[r];
            APISrv.getStopsByRoute(routes[r].objectId).then(
                function (stops) {
                    for(var i = 0; i < stops.length; i++){
                        if(stops[i].passengerList != null && stops[i].passengerList.length > 0){
                            passengersNum += stops[i].passengerList.length;
                        }
                        if(i == 0){
                            routeInfo = "Partenza " + stops[i].name + " ad ore " + stops[i].departureTime;
                        }
                    }
                    var routesComplexData = {
                        route: $scope.actualRoute,
                        passengers: (passengersNum > 1) ? passengersNum + " bambini" : passengersNum + " bambino",
                        title: routeInfo
                    };
                    $scope.routeComplex.push(routesComplexData);

                    //for test
                    /*var routesComplexData1 = {
                        route: {name:"Linea Verde"},
                        passengers: "23 bambini",
                        title: "Partenza via di Prova alle ore 7:45"
                    };
                    var routesComplexData2= {
                       route: {name:"Linea Rossa"},
                        passengers: "29 bambini",
                        title: "Partenza via di Prova2 alle ore 7:35"
                    };
                    $scope.routeComplex.push(routesComplexData1);
                    $scope.routeComplex.push(routesComplexData2);*/

                },
                function (error) {
                    // TODO handle error
                    console.log(error);
                }
            );
        }
    };

    $scope.manageLineColor = function(name){
        var style_class = "";
        if(name){
            var desc = name.split("Linea ");
            var color = desc[desc.length-1];
            switch(color){
                case 'Blu':
                    style_class = "color-bus blue";
                    break;
                case 'Gialla':
                    style_class = "color-bus yellow";
                    break;
                case 'Verde':
                    style_class = "color-bus green";
                    break;
                case 'Rossa':
                    style_class = "color-bus red";
                    break;
                case 'Viola':
                    style_class = "color-bus violet";
                    break;
                default: break;
            }
        }
        return style_class;
    };

    if ($scope.routes == null) {
        APISrv.getRoutesBySchool(StorageSrv.getSchoolId(), moment().format(Config.DATE_FORMAT)).then(
            function (routes) {
                StorageSrv.saveRoutes(routes);
                for(var i = 0; i < routes.length; i++){
                    //var numAndTitle = $scope.loadRouteInfoById(routes[i].objectId);
                }
                $scope.loadAllRouteInfo(routes);
                $scope.routes = routes;
            },
            function (error) {
                // TODO handle error
                console.log(error);
            }
        );
    } else {
        $scope.loadAllRouteInfo($scope.routes);
    }

    $scope.viewRoute = function (route) {
        $state.go('app.route', {
            routeId: route.objectId,
            fromWizard: false,
            route: route
        });
    };
});
