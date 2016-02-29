angular.module('driverapp.services.wsn', [])

.factory('WSNSrv', function ($rootScope, $q) {
    var wsnService = {};

    wsnService.STATE_CONNECTED_TO_CLIMB_MASTER = 'fbk.climblogger.ClimbService.STATE_CONNECTED_TO_CLIMB_MASTER';
    wsnService.STATE_DISCONNECTED_FROM_CLIMB_MASTER = 'fbk.climblogger.ClimbService.STATE_DISCONNECTED_FROM_CLIMB_MASTER';
    wsnService.STATE_CHECKEDIN_CHILD = 'fbk.climblogger.ClimbService.STATE_CHECKEDIN_CHILD';
    wsnService.STATE_CHECKEDOUT_CHILD = 'fbk.climblogger.ClimbService.STATE_CHECKEDOUT_CHILD';

    wsnService.init = function () {
        var deferred = $q.defer();

        window.DriverAppPlugin.init(
            function (response) {
                deferred.resolve(response);
            },
            function (reason) {
                console.log(reason);
                deferred.reject(reason);
            }
        );

        return deferred.promise;
    };

    wsnService.startListener = function () {
        var deferred = $q.defer();

        window.DriverAppPlugin.startListener(
            function (response) {
                deferred.resolve(response)
            },
            function (reason) {
                deferred.reject(reason);
            }
        );

        return deferred.promise;
    };

    wsnService.stopListener = function () {
        var deferred = $q.defer();

        window.DriverAppPlugin.getMasters(
            function (response) {
                deferred.resolve(response);
            },
            function (reason) {
                console.log(reason);
                deferred.reject(reason);
            }
        );

        return deferred.promise;
    };

    wsnService.getMasters = function () {
        var deferred = $q.defer();

        window.DriverAppPlugin.getMasters(
            function (masters) {
                deferred.resolve(masters);
            },
            function (reason) {
                console.log(reason);
                deferred.reject(reason);
            }
        );

        return deferred.promise;
    };

    wsnService.connectMaster = function (masterId) {
        var deferred = $q.defer();

        window.DriverAppPlugin.connectMaster(
            masterId,
            function (procedureStarted) {
                deferred.resolve(procedureStarted);
            },
            function (reason) {
                console.log(reason);
                deferred.reject(reason);
            }
        );

        return deferred.promise;
    };

    wsnService.getNetworkState = function () {
        var deferred = $q.defer();

        window.DriverAppPlugin.getNetworkState(
            function (networkState) {
                var ns = angular.copy(wsnService.networkState);
                networkState.forEach(function (nodeState) {
                    ns[nodeState.nodeID].timestamp = nodeState['lastSeen'];
                    //ns[nodeState.nodeID].status = nodeState['status'];
                });
                wsnService.networkState = ns;

                deferred.resolve(networkState);
            },
            function (reason) {
                console.log(reason);
                deferred.reject(reason);
            }
        );

        return deferred.promise;
    };

    wsnService.setNodeList = function (list) {
        var deferred = $q.defer();

        window.DriverAppPlugin.setNodeList(
            list,
            function (response) {
                deferred.resolve(response);
            },
            function (reason) {
                console.log(reason);
                deferred.reject(reason);
            }
        );

        return deferred.promise;
    };

    wsnService.test = function (text) {
        var deferred = $q.defer();

        window.DriverAppPlugin.test(
            text,
            function (response) {
                deferred.resolve(response);
            },
            function (reason) {
                console.log(reason);
                deferred.reject(reason);
            }
        );

        return deferred.promise;
    };

    /*
     * Node list management
     */
    wsnService.networkState = {};

    wsnService.updateNodeList = function (nodes, type) {
        if (!type || !nodes) {
            return;
        }

        var nl = angular.copy(wsnService.networkState);
        var changed = false;
        nodes.forEach(function (node) {
            if (!!node.wsnId && !nl[node.wsnId]) {
                nl[node.wsnId] = {
                    type: type,
                    object: node,
                    timestamp: -1,
                    status: ''
                };
                if (changed == false) {
                    changed = true;
                }
            }
        });

        if (changed) {
            wsnService.networkState = angular.copy(nl);
        }
    };

    wsnService.getNodeListByType = function (type) {
        var wsnIds = [];

        Object.keys(wsnService.networkState).forEach(function (nodeId) {
            if (wsnService.networkState[nodeId].type === 'child') {
                wsnIds.push(nodeId);
            }
        });

        return wsnIds;
    };

    wsnService.isNodeByType = function (nodeId, type) {
        return wsnService.networkState[nodeId].type === type;
    };

    return wsnService;
});
