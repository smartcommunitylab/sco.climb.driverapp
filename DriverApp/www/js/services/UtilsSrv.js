/* global Connection */
angular.module('driverapp.services.utils', [])
  .factory('Utils', function ($rootScope, $filter, $timeout, $ionicPopup, $ionicLoading, $interval, Config) {
    var Utils = {}
    this.drivername = ''

    Utils.isConnectionDown = function () {
      if (window.Connection) {
        if (navigator.connection.type === Connection.NONE || navigator.connection.type === Connection.UNKNOWN) {
          return true
        }
      }
      return false
    }

    Utils.isConnectionFastEnough = function () {
      if (window.Connection) {
        if (navigator.connection.type === Connection.CELL_2G || navigator.connection.type === Connection.NONE || navigator.connection.type === Connection.UNKNOWN) {
          return false
        }
      }
      return true
    }

    Utils.isValidDate = function (dateString) {
      return moment(dateString, Config.DATE_FORMAT, true).isValid()
    }

    Utils.isValidDateRange = function (dateFromString, dateToString) {
      var dateFromValid = moment(dateFromString, Config.DATE_FORMAT, true).isValid()
      var dateToValid = moment(dateToString, Config.DATE_FORMAT, true).isValid()
      var rightOrder = moment(dateFromString).isSameOrBefore(dateToString)
      return (dateFromValid && dateToValid && rightOrder)
    }

    Utils.toast = function (message, duration, position) {
      message = message || $filter('translate')('toast_error_generic')
      duration = duration || 'short'
      position = position || 'bottom'

      if (window.cordova) {
        // Use the Cordova Toast plugin
        // $cordovaToast.show(message, duration, position);
        window.plugins.toast.show(message, duration, position)
      } else {
        if (duration === 'short') {
          duration = 2000
        } else {
          duration = 5000
        }

        var myPopup = $ionicPopup.show({
          template: '<div class="toast">' + message + '</div>',
          scope: $rootScope,
          buttons: []
        })

        $timeout(
          function () {
            myPopup.close()
          },
          duration
        )
      }
    }

    Utils.fastCompareObjects = function (obj1, obj2) {
      return JSON.stringify(obj1) === JSON.stringify(obj2)
    }

    Utils.moveInArray = function (array, oldIndex, newIndex) {
      if (newIndex >= array.length) {
        var k = newIndex - array.length
        while ((k--) + 1) {
          array.push(undefined)
        }
      }
      array.splice(newIndex, 0, array.splice(oldIndex, 1)[0])
      return array // for testing purposes
    }

    Utils.loading = function () {
      $ionicLoading.show()
    }

    Utils.loaded = function () {
      $ionicLoading.hide()
    }

    Utils.setMenuDriverTitle = function (drivername) {
      // driver_names = drivername.split(' ');
      this.drivername = drivername // driver_names[1];
    }

    Utils.getMenuDriverTitle = function () {
      return this.drivername
    }

    Utils.isDST = function () {
      var stdTimezoneOffset = function () {
        var jan = new Date(Date.getFullYear(), 0, 1)
        var jul = new Date(Date.getFullYear(), 6, 1)
        return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset())
      }
      return Date.getTimezoneOffset() < stdTimezoneOffset()
    }

    return Utils
  })
