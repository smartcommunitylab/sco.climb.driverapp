angular.module('driverapp.services.ae', [])

.factory('AESrv', function ($q, Config, Utils, StorageSrv) {
    var AE = {
        NODE_CHECKIN: 102,
        NODE_CHECKOUT: 103,
        STOP_REACHED: 202,
        SET_DRIVER: 301,
        SET_HELPER: 302,
        DRIVER_POSITION: 303,
        START_ROUTE: 401,
        END_ROUTE: 402
    };

    // FIXME only dev!
    /*
    var AE = {
        NODE_CHECKIN: 'NODE_CHECKIN',
        NODE_CHECKOUT: 'NODE_CHECKOUT',
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
        events: []
    };

    /* create a clean instance for a route */
    aeService.startInstance = function (routeId) {
        aeInstance.routeId = routeId;
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

    /* stop reached*/
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
        StorageSrv.saveEAs(aeInstance.events);

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

    /* driver position */
    aeService.driverPosition = function (volunteer) {
        var event = {
            routeId: aeInstance.routeId,
            wsnNodeId: volunteer.wsnId,
            eventType: AE.NODE_CHECKOUT,
            timestamp: moment().valueOf(),
            payload: {
                'volunteerId': volunteer.objectId,
                'latitude': 0,
                'longitude': 0
            }
        };

        aeInstance.events.push(event);
        return event;
    };

    return aeService;
});
