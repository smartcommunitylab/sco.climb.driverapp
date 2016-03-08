angular.module('driverapp.services.ae', [])

.factory('AESrv', function ($q, $interval, Config, Utils, StorageSrv, APISrv) {
    var AE = {
        NODE_IN_RANGE: 101,
        NODE_CHECKIN: 102,
        NODE_CHECKOUT: 103,
        NODE_AT_DESTINATION: 104,
        NODE_OUT_OF_RANGE: 105,
        STOP_REACHED: 202,
        SET_DRIVER: 301,
        SET_HELPER: 302,
        DRIVER_POSITION: 303,
        START_ROUTE: 401,
        END_ROUTE: 402
    };

    // FIXME dev purpose only!
    /*
    var AE = {
        NODE_CHECKIN: 'NODE_CHECKIN',
        NODE_CHECKOUT: 'NODE_CHECKOUT',
        NODE_AT_DESTINATION: 'NODE_AT_DESTINATION',
        NODE_OUT_OF_RANGE: 'NODE_OUT_OF_RANGE',
        STOP_REACHED: 'STOP_REACHED',
        SET_DRIVER: 'SET_DRIVER',
        SET_HELPER: 'SET_HELPER',
        DRIVER_POSITION: 'DRIVER_POSITION',
        START_ROUTE: 'START_ROUTE',
        END_ROUTE: 'END_ROUTE'
    };
    */

    var aeService = {};

    var aeInstance = {
        routeId: null,
        driver: null,
        events: []
    };

    var isValidAEInstance = function (aeInstance) {
        return (aeInstance.routeId != null && aeInstance.driver != null && aeInstance.events != null);
    };

    /* create a clean instance for a route */
    aeService.startInstance = function (routeId) {
        aeInstance.routeId = routeId;
        aeInstance.driver = null;
        aeInstance.events = [];
        return aeInstance;
    };

    /* close the instance and flush data */
    aeService.stopInstance = function (routeId) {
        StorageSrv.saveEAs(aeInstance.events);
    };

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
        };

        aeInstance.driver = volunteer;
        aeInstance.events.push(event);
        return event;
    };

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
        };

        aeInstance.events.push(event);
        return event;
    };

    /* stop reached */
    aeService.stopReached = function (stop) {
        var event = {
            routeId: aeInstance.routeId,
            wsnNodeId: stop.wsnId,
            eventType: AE.STOP_REACHED,
            timestamp: moment().valueOf(),
            payload: {
                'stopId': stop.objectId
            }
        };

        aeInstance.events.push(event);
        return event;
    };

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
        };
        aeInstance.events.push(event);
        return event;
    };

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
        };

        aeInstance.events.push(event);
        return event;
    };

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
        };

        aeInstance.events.push(event);

        StorageSrv.saveEAs(aeInstance.events).then(
            function (eas) {
                Utils.loading();
                APISrv.addEvents(eas).then(
                    function(response) {
                        Utils.loaded();
                        console.log('Events successfully uploaded on the server.');
                    },
                    function(reason) {
                        Utils.loaded();
                        console.log('Error uploading events on the server!');
                    }
                );
            }
        );

        return event;
    };

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
        };
        aeInstance.events.push(event);
        return event;
    };

    aeService.nodeCheckinBatch = function (passengers) {
        var events = [];
        passengers.forEach(function (passenger) {
            events.push(aeService.nodeCheckin(passenger));
        });
        return events;
    };

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
        };
        aeInstance.events.push(event);
        return event;
    };

    aeService.nodeCheckoutBatch = function (passengers) {
        var events = [];
        passengers.forEach(function (passenger) {
            events.push(aeService.nodeCheckout(passenger));
        });
        return events;
    };

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
        };

        aeInstance.events.push(event);
        return event;
    };

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
        };

        aeInstance.events.push(event);
        return event;
    };

    /* driver position */
    aeService.driverPosition = function (volunteer, lat, lon) {
        var event = {
            routeId: aeInstance.routeId,
            wsnNodeId: volunteer.wsnId,
            eventType: AE.DRIVER_POSITION,
            timestamp: moment().valueOf(),
            payload: {
                'volunteerId': volunteer.objectId,
                'latitude': !!lat ? lat : 0,
                'longitude': !!lon ? lon : 0
            }
        };

        aeInstance.events.push(event);
        return event;
    };

    return aeService;
});
