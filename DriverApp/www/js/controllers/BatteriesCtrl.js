angular.module('driverapp.controllers.batteries', [])
  .controller('BatteriesCtrl', function ($scope, $rootScope, APISrv, WSNSrv, StorageSrv) {
    $scope.children = StorageSrv.getChildren()

    $scope.almostOneVisible = false

    $scope.refresh = function() {
      console.log('WSNSrv.networkState ',WSNSrv.networkState);
      console.log('$scope.children ',$scope.children);
      angular.forEach($scope.children, function (child) {
        if (child.wsnId && WSNSrv.networkState[child.wsnId.toUpperCase()]) {
          var batteryLevel = WSNSrv.networkState[child.wsnId.toUpperCase()].batteryLevel
          if (batteryLevel != null) {
            child.batteryLevel = batteryLevel
          }
          if (child.batteryLevel != null && !$scope.almostOneVisible) {
            $scope.almostOneVisible = true
          }
        } else {
          console.log('Child withoud wsnId: ' + child.surname + ' ' + child.name)
        }
      })  
    }

    $scope.refresh();
    /*
    $scope.children = [
      {
        name: 'Mario',
        surname: 'Rossi',
        batteryLevel: 3
      }, {
        name: 'Giuseppe',
        surname: 'Verdi',
        batteryLevel: 2
      }, {
        name: 'Carlo',
        surname: 'Bianchi',
        batteryLevel: 1
      }, {
        name: 'Anna',
        surname: 'Lisa',
        batteryLevel: 1
      }, {
        name: 'Franco',
        surname: 'Azzurri',
        batteryLevel: 0
      }
    ]
    */
  })
