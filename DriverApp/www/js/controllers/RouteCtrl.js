angular.module('driverapp.controllers.route', [])

.controller('RouteCtrl', function ($scope, $ionicModal, StorageSrv, APISrv) {
    $scope.children = StorageSrv.getChildren();

    $scope.route = StorageSrv.getRoute();
    $scope.stops = [];
    $scope.onBoard = [];

    $scope.enRoute = false;
    $scope.enRoutePos = 0;
    $scope.enRouteArrived = false;

    $scope.toggleEnRoute = function () {
        // if has next
        if (!!$scope.stops[$scope.enRoutePos + 1]) {
            $scope.enRoute = !$scope.enRoute;

            if (!$scope.enRoute) {
                $scope.enRoutePos++;
                $scope.sel.stop = $scope.stops[$scope.enRoutePos];
                $scope.getChildrenForStop($scope.sel.stop);
            }

            // if has no next
            if (!$scope.stops[$scope.enRoutePos + 1]) {
                $scope.enRouteArrived = true;
            }
        }
        //console.log('enRoute: ' + $scope.enRoute + ', enRoutePos: ' + $scope.enRoutePos);
    };

    $scope.sel = {
        stop: null
    };

    if (!!$scope.route) {
        APISrv.getStopsByRoute($scope.route.objectId).then(
            function (stops) {
                $scope.stops = stops;
                // Select the first automatically
                $scope.sel.stop = $scope.stops[0];
                $scope.getChildrenForStop($scope.sel.stop);
            },
            function (error) {
                // TODO handle error
                console.log(error);
            }
        );
    }

    $scope.getChild = function (childId) {
        var foundChild = null;
        for (var i = 0; i < $scope.children.length; i++) {
            var child = $scope.children[i];
            if (child.objectId === childId) {
                foundChild = child;
                i = $scope.children.length;
            }
        }
        return foundChild;
    };

    $scope.getChildrenForStop = function (stop) {
        var passengers = [];
        $scope.children.forEach(function (child) {
            if (stop.passengerList.indexOf(child.objectId) != -1) {
                passengers.push(child);
            }
        });
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

    $scope.toBeTaken = [];
    $scope.setToBeTaken = function (child) {
        if (!!child.checked && $scope.toBeTaken.indexOf(child.objectId) === -1) {
            $scope.toBeTaken.push(child.objectId);
        }
    };

    /*
     * "Add others" Modal
     */
    $ionicModal.fromTemplateUrl('templates/route_modal_add.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modal = modal;
    });

    $scope.openModal = function () {
        $scope.modal.show();
    };

    $scope.closeModal = function () {
        $scope.modal.hide();
    };

    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function () {
        $scope.modal.remove();
    });

    // Execute action on hide modal
    $scope.$on('modal.hidden', function () {
        if ($scope.toBeTaken.length > 0) {
            $scope.onBoard = $scope.onBoard.concat($scope.toBeTaken);
        }

        // reset
        $scope.toBeTaken.forEach(function (childId) {
            $scope.getChild(childId).checked = false;
        });
        $scope.toBeTaken = [];
    });

    // Execute action on remove modal
    $scope.$on('modal.removed', function () {});
});
