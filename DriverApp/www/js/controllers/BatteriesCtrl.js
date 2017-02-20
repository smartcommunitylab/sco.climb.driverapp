angular.module('driverapp.controllers.batteries', [])
  .controller('BatteriesCtrl', function ($scope, $rootScope, APISrv, WSNSrv, StorageSrv) {
    $scope.children = StorageSrv.getChildren()

    $scope.almostOneVisible = false

    angular.forEach($scope.children, function (child) {
      var batteryLevel = WSNSrv.networkState[child.wsnId].batteryLevel
      if (batteryLevel != null) {
        child.batteryLevel = batteryLevel
      }
      if (child.batteryLevel != null && !$scope.almostOneVisible) {
        $scope.almostOneVisible = true
      }
    })

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
