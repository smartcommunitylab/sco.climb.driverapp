angular.module('driverapp.controllers.route', [])

.controller('RouteCtrl', function ($scope, StorageSrv, APISrv) {
    var children = StorageSrv.getChildren();

    $scope.route = StorageSrv.getRoute();
    $scope.stops = [];
    $scope.onBoard = [];

    $scope.sel = {
       stop: null
    };

    if (!!$scope.route) {
        APISrv.getStopsByRoute($scope.route.objectId).then(
            function (stops) {
                $scope.stops = stops;
            },
            function (error) {
                // TODO handle error
                console.log(error);
            }
        );
    }

    $scope.getChild = function (childId) {
        var childFound = null;
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (child.objectId === childId) {
                childFound = child;
                i = children.length;
            }
        }
        return childFound;
    };

    $scope.getChildrenForStop = function (stop) {
        var passengers = [];
        for (var i = 0; i < children.length; i++) {
            if (stop.passengerList.indexOf(children[i].objectId) != -1) {
                passengers.push(children[i]);
            }
        }
        stop.passengers = passengers;
    };

    $scope.takeOnBoard = function (passengerId) {
        if ($scope.onBoard.indexOf(passengerId) === -1) {
            $scope.onBoard.push(passengerId);
        }
    };

    $scope.dropOff = function (passengerId) {
        var index = $scope.onBoard.indexOf(passengerId)
        if (index !== -1) {
            $scope.onBoard.splice(index, 1);
        }
    };
});
