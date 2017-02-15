angular.module('driverapp.controllers.batteries', [])
  .controller('BatteriesCtrl', function ($scope, $rootScope, APISrv, WSNSrv, StorageSrv) {
    $scope.children = StorageSrv.getChildren()

    $scope.almostOneVisible = false

    $scope.isVisible = function (child) {
      if (WSNSrv.networkState[child.wsnId]) {
        if (!$scope.almostOneVisible) {
          $scope.almostOneVisible = true
        }
        return true
      }
      return false
      // return true
    }

    $scope.getBatteryLevel = function (child) {
      // WSNSrv.networkState[child.wsnId].batteryVoltage_mV
      return WSNSrv.networkState[child.wsnId].batteryLevel
      // return child.batteryLevel
    }

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
