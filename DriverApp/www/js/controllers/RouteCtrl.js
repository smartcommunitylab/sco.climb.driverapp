angular.module('driverapp.controllers.route', [])

.controller('RouteCtrl', function ($scope, $rootScope, $stateParams, $ionicHistory, $ionicNavBarDelegate, $ionicPopup, $ionicModal, $interval, $ionicScrollDelegate, Config, Utils, StorageSrv, GeoSrv, AESrv, APISrv, WSNSrv) {
    $scope.fromWizard = false;
    var aesInstance = {};

    $scope.children = null;
    $scope.driver = null;
    $scope.helpers = null;

    $scope.route = {};
    $scope.stops = [];
    $scope.onBoardTemp = [];
    $scope.onBoard = [];

    $scope.enRoute = false;
    $scope.enRoutePos = 0;
    $scope.enRouteArrived = false;

    /* INIT */
    if (!!$stateParams['fromWizard']) {
        $scope.fromWizard = $stateParams['fromWizard'];
    }

    if ($scope.fromWizard) {
        if (!!$stateParams['route']) {
            $scope.route = $stateParams['route'];

            aesInstance = AESrv.startInstance($scope.route.objectId);
            WSNSrv.updateNodeList(StorageSrv.getChildren(), 'child', true);

            if (!!$stateParams['driver']) {
                $scope.driver = $stateParams['driver'];
                AESrv.setDriver($scope.driver);
            }

            if (!!$stateParams['helpers']) {
                $scope.helpers = $stateParams['helpers'];
                $scope.helpers.forEach(function (helper) {
                    AESrv.setHelper(helper);
                });
            }

            $scope.$watch(
                function () {
                    return WSNSrv.networkState;
                },
                function (newNs, oldNs) {
                    var ns = angular.copy(newNs);
                    var somethingChanged = false;

                    Object.keys(ns).forEach(function (nodeId) {
                        if (WSNSrv.isNodeByType(nodeId, 'child')) {
                            if (ns[nodeId].status == WSNSrv.STATUS_NEW) {
                                var child = $scope.isChildOfThisStop(nodeId);
                                if (child !== null) {
                                    $scope.takeOnBoard(child.objectId);
                                    ns[nodeId].status = WSNSrv.STATUS_BOARDED_ALREADY;
                                    somethingChanged = true;
                                }
                            }

                            if ($scope.isOnBoard(ns[nodeId].object.objectId)) {
                                var overTimeout = (moment().valueOf() - ns[nodeId].timestamp) > Config.NODESTATE_TIMEOUT;

                                if (overTimeout && ns[nodeId].status !== WSNSrv.STATUS_OUT_OF_RANGE) {
                                    ns[nodeId].status = WSNSrv.STATUS_OUT_OF_RANGE;
                                    somethingChanged = true;
                                    AESrv.nodeOutOfRange(nodeId, ns[nodeId].timestamp);
                                    var errorString = 'Attenzione! ';
                                    errorString += ns[nodeId].object.surname + ' ' + ns[nodeId].object.name + ' (' + nodeId + ') fuori portata!';
                                    console.log('nodeOutOfRange: ' + nodeId + ' (last seen ', +ns[nodeId].timestamp + ')');
                                    Utils.toast(errorString, 5000, 'center');
                                } else if (!overTimeout && ns[nodeId].status === WSNSrv.STATUS_OUT_OF_RANGE) {
                                    ns[nodeId].status = WSNSrv.STATUS_BOARDED_ALREADY;
                                    somethingChanged = true;
                                    console.log('nodeBackInRange: ' + nodeId);
                                }
                            }
                        }
                    });

                    if (somethingChanged) {
                        WSNSrv.networkState = ns;
                    }
                }
            );
        }
    } else {
        if (!!$stateParams['route']) {
            $scope.route = $stateParams['route'];
        } else if (!!$stateParams['routeId']) {
            $scope.route = StorageSrv.getRouteById($stateParams['routeId']);
        }
    }

    APISrv.getStopsByRoute($stateParams['routeId']).then(
        function (stops) {
            $scope.stops = stops;
            // Select the first automatically
            $scope.sel.stop = $scope.stops[0];
            $scope.getChildrenForStop($scope.sel.stop);

            if ($scope.fromWizard) {
                AESrv.stopReached($scope.sel.stop);
            }
        },
        function (error) {
            // TODO handle error
            console.log(error);
        }
    );

    $scope.toggleEnRoute = function () {
        $ionicScrollDelegate.scrollTop(true);

        // if has next
        if (!!$scope.stops[$scope.enRoutePos + 1]) {
            $scope.enRoute = !$scope.enRoute;

            if ($scope.enRoute) {
                $scope.sel.stop = $scope.stops[$scope.enRoutePos];

                // NODE_CHECKIN
                $scope.onBoardTemp.forEach(function (passengerId) {
                    var child = $scope.getChild(passengerId);
                    AESrv.nodeCheckin(child);
                    if (!!child.wsnId) {
                        WSNSrv.checkinChild(child.wsnId);
                    }
                });

                $scope.onBoard = $scope.onBoard.concat($scope.onBoardTemp);
                $scope.onBoardTemp = [];

                // Riparti
                if ($scope.enRoutePos == 0) {
                    // Parti
                    AESrv.startRoute($scope.stops[$scope.enRoutePos]);

                    GeoSrv.startWatchingPosition(function (position) {
                        AESrv.driverPosition($scope.driver, position.coords.latitude, position.coords.longitude);
                    }, null, Config.GPS_DELAY);
                }
            } else {
                // Fermati
                $scope.enRoutePos++;
                $scope.sel.stop = $scope.stops[$scope.enRoutePos];
                AESrv.stopReached($scope.sel.stop);
                $scope.getChildrenForStop($scope.sel.stop);
            }

            // if has no next
            if (!$scope.stops[$scope.enRoutePos + 1]) {
                // Arriva
                $scope.onBoard.forEach(function (passengerId) {
                    var child = $scope.getChild(passengerId);
                    AESrv.nodeCheckout(child);
                    if (!!child.wsnId) {
                        WSNSrv.checkoutChild(child.wsnId);
                    }
                });
                AESrv.endRoute($scope.stops[$scope.enRoutePos]);
                GeoSrv.stopWatchingPosition();
                $scope.enRouteArrived = true;
            }
        }
    };

    $scope.sel = {
        stop: null
    };

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
        if ($scope.children == null || $scope.children.length == 0) {
            $scope.children = StorageSrv.getChildren();
        }
        if ($scope.children != null) {
            $scope.children.forEach(function (child) {
                if (stop.passengerList.indexOf(child.objectId) != -1) {
                    passengers.push(child);
                }
            });
        }
        stop.passengers = passengers;
    };

    $scope.isChildOfThisStop = function (childWsnId) {
        var child = null;
        if (!!$scope.sel.stop && !!$scope.sel.stop.passengers) {
            for (var i = 0; i < $scope.sel.stop.passengers.length; i++) {
                var passenger = $scope.sel.stop.passengers[i];
                if (passenger.wsnId === childWsnId) {
                    child = passenger;
                    i = $scope.sel.stop.passengers.length;
                }
            }
        }
        return child;
    };

    $scope.takeOnBoard = function (passengerId) {
        if ($scope.onBoardTemp.indexOf(passengerId) === -1) {
            $scope.onBoardTemp.push(passengerId);
        }
    };

    $scope.dropOff = function (passengerId) {
        var index = $scope.onBoardTemp.indexOf(passengerId)
        if (index !== -1) {
            $scope.onBoardTemp.splice(index, 1);
        }
    };

    $scope.toBeTaken = [];
    $scope.setToBeTaken = function (child) {
        var tbtIndex = $scope.toBeTaken.indexOf(child.objectId);
        if (!!child.checked && tbtIndex === -1) {
            $scope.toBeTaken.push(child.objectId);
        } else if (!child.checked && tbtIndex !== -1) {
            $scope.toBeTaken.splice(tbtIndex, 1);
        }
    };

    $scope.isOnBoard = function (childId) {
        if ($scope.onBoard.indexOf(childId) != -1 || $scope.onBoardTemp.indexOf(childId) != -1) {
            return true;
        }
        return false;
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
            $scope.onBoardTemp = $scope.onBoardTemp.concat($scope.toBeTaken);
        }

        // reset
        $scope.toBeTaken.forEach(function (childId) {
            $scope.getChild(childId).checked = false;
        });
        $scope.toBeTaken = [];
    });

    // Execute action on remove modal
    $scope.$on('modal.removed', function () {});

    /*
     * Child details popup
     */
    $scope.showChildDetails = function (child) {
        var detailsPopup = $ionicPopup.alert({
            title: child.surname + ' ' + child.name,
            template: (!!child.parentName ? child.parentName + ': ' + child.phone : child.phone),
            okText: 'OK',
            okType: 'button'
        });
    };
});
