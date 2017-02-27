angular.module('driverapp.services.ae', [])
  .factory('AESrv', function ($rootScope, $q, $interval, Config, Utils, StorageSrv, LogSrv, APISrv, GeoSrv, WSNSrv) {
    var AE = {
      NODE_IN_RANGE: 101,
      NODE_CHECKIN: 102,
      NODE_CHECKOUT: 103,
      NODE_AT_DESTINATION: 104,
      NODE_OUT_OF_RANGE: 105,
      STOP_LEAVING: 202,
      SET_DRIVER: 301,
      SET_HELPER: 302,
      DRIVER_POSITION: 303,
      START_ROUTE: 401,
      END_ROUTE: 402,
      BATTERY_STATE: 501
    }

    // FIXME dev purpose only!
    /*
    var AE = {
      NODE_CHECKIN: 'NODE_CHECKIN',
      NODE_CHECKOUT: 'NODE_CHECKOUT',
      NODE_AT_DESTINATION: 'NODE_AT_DESTINATION',
      NODE_OUT_OF_RANGE: 'NODE_OUT_OF_RANGE',
      STOP_LEAVING: 'STOP_LEAVING',
      SET_DRIVER: 'SET_DRIVER',
      SET_HELPER: 'SET_HELPER',
      DRIVER_POSITION: 'DRIVER_POSITION',
      START_ROUTE: 'START_ROUTE',
      END_ROUTE: 'END_ROUTE'
    };
    */

    var geolocalizeEvent = function (event) {
      var position = GeoSrv.getCurrentPosition()
      if (position) {
        event.payload['latitude'] = position.coords.latitude
        event.payload['longitude'] = position.coords.longitude
        event.payload['accuracy'] = position.coords.accuracy
      }
    }

    var aeService = {}

    var aeInstance = {
      routeId: null,
      driver: null,
      events: []
    }

    /*
    var isValidAEInstance = function (aeInstance) {
      return aeInstance.routeId != null && aeInstance.driver != null && aeInstance.events != null
    }
    */

    /* create a clean instance for a route */
    aeService.startInstance = function (routeId) {
      aeInstance.routeId = routeId
      aeInstance.driver = null
      aeInstance.events = []
      return aeInstance
    }

    /* close the instance and flush data */
    aeService.stopInstance = function (routeId) {
      StorageSrv.saveEAs(aeInstance.events)
    }

    /* set driver */
    aeService.setDriver = function (volunteer) {
      var event = {
        routeId: aeInstance.routeId,
        wsnNodeId: volunteer.wsnId,
        eventType: AE.SET_DRIVER,
        timestamp: moment().valueOf(),
        payload: {
          'volunteerId': volunteer.objectId
        }
      }

      geolocalizeEvent(event)
      aeInstance.driver = volunteer
      aeInstance.events.push(event)
      LogSrv.log(JSON.stringify(event))
      return event
    }

    /* set helper */
    aeService.setHelper = function (volunteer) {
      var event = {
        routeId: aeInstance.routeId,
        wsnNodeId: volunteer.wsnId,
        eventType: AE.SET_HELPER,
        timestamp: moment().valueOf(),
        payload: {
          'volunteerId': volunteer.objectId
        }
      }

      geolocalizeEvent(event)
      aeInstance.events.push(event)
      LogSrv.log(JSON.stringify(event))
      return event
    }

    /* stop leaving */
    aeService.stopLeaving = function (stop) {
      var event = {
        routeId: aeInstance.routeId,
        wsnNodeId: stop.wsnId,
        eventType: AE.STOP_LEAVING,
        timestamp: moment().valueOf(),
        payload: {
          'stopId': stop.objectId
        }
      }

      geolocalizeEvent(event)
      aeInstance.events.push(event)
      LogSrv.log(JSON.stringify(event))
      return event
    }

    /* node at destination */
    aeService.nodeAtDestination = function (passenger) {
      var event = {
        routeId: aeInstance.routeId,
        wsnNodeId: passenger.wsnId,
        eventType: AE.NODE_AT_DESTINATION,
        timestamp: moment().valueOf(),
        payload: {
          'passengerId': passenger.objectId
        }
      }

      geolocalizeEvent(event)
      aeInstance.events.push(event)
      LogSrv.log(JSON.stringify(event))
      return event
    }

    /* start route */
    aeService.startRoute = function (stop) {
      var event = {
        routeId: aeInstance.routeId,
        wsnNodeId: stop.wsnId,
        eventType: AE.START_ROUTE,
        timestamp: moment().valueOf(),
        payload: {
          'stopId': stop.objectId
        }
      }

      geolocalizeEvent(event)
      aeInstance.events.push(event)
      LogSrv.log(JSON.stringify(event))
      return event
    }

    /* end route */
    aeService.endRoute = function (stop) {
      var event = {
        routeId: aeInstance.routeId,
        wsnNodeId: stop.wsnId,
        eventType: AE.END_ROUTE,
        timestamp: moment().valueOf(),
        payload: {
          'stopId': stop.objectId
        }
      }

      geolocalizeEvent(event)
      aeInstance.events.push(event)
      LogSrv.log(JSON.stringify(event))

      var uploadWsnLogFiles = function () {
        APISrv.uploadWsnLogs(aeInstance.routeId).then(
          function () {
            Utils.loaded()
            console.log('[WSN Logs] Successfully uploaded to the server.')
          },
          function (error) {
            Utils.loaded()
            console.log('[WSN Logs] Error uploading to the server: ' + error)
          }
        )
      }

      StorageSrv.saveEAs(aeInstance.events).then(
        function (eas) {
          Utils.loading()
          APISrv.addEvents(eas).then(
            function (response) {
              console.log('[Events] Successfully uploaded to the server.')
              uploadWsnLogFiles()
            },
            function (reason) {
              console.log('[Events] Error uploading to the server!')
              uploadWsnLogFiles()
            }
          )
        }
      )

      return event
    }

    /* node checkin */
    aeService.nodeCheckin = function (passenger) {
      var event = {
        routeId: aeInstance.routeId,
        wsnNodeId: passenger.wsnId,
        eventType: AE.NODE_CHECKIN,
        timestamp: moment().valueOf(),
        payload: {
          'passengerId': passenger.objectId
        }
      }

      geolocalizeEvent(event)
      aeInstance.events.push(event)
      LogSrv.log(JSON.stringify(event))
      return event
    }

    aeService.nodeCheckinBatch = function (passengers) {
      var events = []
      passengers.forEach(function (passenger) {
        events.push(aeService.nodeCheckin(passenger))
      })
      return events
    }

    /* node checkout */
    aeService.nodeCheckout = function (passenger) {
      var event = {
        routeId: aeInstance.routeId,
        wsnNodeId: passenger.wsnId,
        eventType: AE.NODE_CHECKOUT,
        timestamp: moment().valueOf(),
        payload: {
          'passengerId': passenger.objectId
        }
      }

      geolocalizeEvent(event)
      aeInstance.events.push(event)
      LogSrv.log(JSON.stringify(event))
      return event
    }

    aeService.nodeCheckoutBatch = function (passengers) {
      var events = []
      passengers.forEach(function (passenger) {
        events.push(aeService.nodeCheckout(passenger))
      })
      return events
    }

    /* node in range */
    aeService.nodeInRange = function (passenger) {
      var event = {
        routeId: aeInstance.routeId,
        wsnNodeId: passenger.wsnId,
        eventType: AE.NODE_IN_RANGE,
        timestamp: moment().valueOf(),
        payload: {
          'passengerId': passenger.objectId
        }
      }

      geolocalizeEvent(event)
      aeInstance.events.push(event)
      LogSrv.log(JSON.stringify(event))
      return event
    }

    /* node out of range */
    aeService.nodeOutOfRange = function (passenger, lastCheck) {
      var event = {
        routeId: aeInstance.routeId,
        wsnNodeId: passenger.wsnId,
        eventType: AE.NODE_OUT_OF_RANGE,
        timestamp: moment().valueOf(),
        payload: {
          'passengerId': passenger.objectId,
          'lastCheck': lastCheck
        }
      }

      geolocalizeEvent(event)
      aeInstance.events.push(event)
      LogSrv.log(JSON.stringify(event))
      return event
    }

    /* driver position */
    aeService.driverPosition = function (volunteer, lat, lon, accuracy) {
      if (!lat) {
        lat = 0
      }
      if (!lon) {
        lon = 0
      }
      if (!accuracy) {
        accuracy = 0
      }

      var event = {
        routeId: aeInstance.routeId,
        wsnNodeId: volunteer.wsnId,
        eventType: AE.DRIVER_POSITION,
        timestamp: moment().valueOf(),
        payload: {
          'volunteerId': volunteer.objectId,
          'latitude': lat,
          'longitude': lon,
          'accuracy': accuracy
        }
      }

      aeInstance.events.push(event)
      LogSrv.log(JSON.stringify(event))
      return event
    }

    /* battery statuses */
    aeService.batteryStatus = function (passenger) {
      var event = {
        routeId: aeInstance.routeId,
        wsnNodeId: passenger.wsnId,
        eventType: AE.BATTERY_STATE,
        timestamp: moment().valueOf(),
        payload: {
          'passengerId': passenger.objectId,
          'batteryVoltage': WSNSrv.networkState[passenger.wsnId].batteryVoltage_mV,
          'batteryLevel': WSNSrv.networkState[passenger.wsnId].batteryLevel
        }
      }

      geolocalizeEvent(event)
      aeInstance.events.push(event)
      LogSrv.log(JSON.stringify(event))

      return event
    }

    aeService.batteryStatuses = function (passengers) {
      var events = []
      angular.forEach(passengers, function (passenger) {
        events.push(aeService.batteryStatus(passenger))
      })
      return events
    }

    return aeService
  })
