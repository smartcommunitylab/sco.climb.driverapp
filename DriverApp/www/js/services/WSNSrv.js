angular.module('driverapp.services.wsn', [])
  .factory('WSNSrv', function ($rootScope, $q, $interval, Utils, Config) {
    var wsnService = {}

    wsnService.NODESTATE_NODEID = 'nodeID'
    wsnService.NODESTATE_STATE = 'state'
    wsnService.NODESTATE_LASTSEEN = 'lastSeen'
    wsnService.NODESTATE_LASTSTATECHANGE = 'lastStateChange'
    wsnService.NODESTATE_BATTERYLEVEL = 'batteryLevel'
    wsnService.NODESTATE_BATTERYVOLTAGE_MV = 'batteryVoltage_mV'
    wsnService.NODESTATE_RSSI = 'rssi'

    wsnService.STATE_CONNECTED_TO_CLIMB_MASTER = 'fbk.climblogger.ClimbService.STATE_CONNECTED_TO_CLIMB_MASTER'
    wsnService.STATE_DISCONNECTED_FROM_CLIMB_MASTER = 'fbk.climblogger.ClimbService.STATE_DISCONNECTED_FROM_CLIMB_MASTER'
    wsnService.STATE_CHECKEDIN_CHILD = 'fbk.climblogger.ClimbService.STATE_CHECKEDIN_CHILD'
    wsnService.STATE_CHECKEDOUT_CHILD = 'fbk.climblogger.ClimbService.STATE_CHECKEDOUT_CHILD'

    wsnService.STATUS_NEW = 'NEW'
    wsnService.STATUS_BOARDED_ALREADY = 'BOARDED_ALREADY'
    wsnService.STATUS_OUT_OF_RANGE = 'OUT_OF_RANGE'

    wsnService.intervalGetNetworkState = null

    wsnService.init = function () {
      var deferred = $q.defer()

      if (Utils.wsnPluginEnabled()) {
        console.log('calling init');
        deferred.resolve(null)
        // window.DriverAppPlugin.init(
        //   function (response) {
        //     console.log('init: ' + response)
        //     deferred.resolve(response)
        //   },
        //   function (reason) {
        //     console.log('init: ' + reason)
        //     deferred.reject(reason)
        //   }
        // )
      }

      return deferred.promise
    }

    wsnService.deinit = function () {
      var deferred = $q.defer()
      deferred.resolve(null);
      // if (Utils.wsnPluginEnabled()) {
      //   console.log('calling deinit');
      //   window.DriverAppPlugin.deinit(
      //     function (response) {
      //       console.log('deinit: ' + response)
      //       deferred.resolve(response)
      //     },
      //     function (reason) {
      //       console.log('deinit: ' + reason)
      //       deferred.reject(reason)
      //     }
      //   )
      // } else {
      //   deferred.resolve(null);
      // }

      return deferred.promise
    }

    wsnService.startListener = function () {
      var deferred = $q.defer()

      if (Utils.wsnPluginEnabled()) {
        $rootScope.masterError = false
        wsnService.startNetworkStateInterval()
        deferred.resolve();
      } else {
        deferred.reject();
      } 
     // ble.startScanWithOptions(['feaa'],{reportDuplicates:false})
        // window.DriverAppPlugin.startListener(
        //   function (response) {
        //     if (response.action === wsnService.STATE_CONNECTED_TO_CLIMB_MASTER) {
        //       if (response.errorMsg === null || response.errorMsg === undefined) {
        //         console.log('### Yippee-ki-yay! Welcome, Master! ###')
        //         $rootScope.masterError = false
        //         wsnService.setNodeList(wsnService.getNodeListByType('child'))
        //         wsnService.startNetworkStateInterval()
        //       } else {
        //         console.log('/// Master connection timeout! ///')
        //         $rootScope.masterError = true
        //         // TODO toast for failure
        //         // Utils.toast('Problema di connessione con il nodo Master!', 5000, 'center');
        //       }
        //     } else if (response.action === wsnService.STATE_DISCONNECTED_FROM_CLIMB_MASTER) {
        //       console.log('=== Where is my Master?!? ===')
        //       // TODO toast for failure
        //       // Utils.toast('Problema di connessione con il nodo Master!', 5000, 'center');

        //       // Retry
        //       wsnService.connectMaster(response.id)
        //     }
        //     /*
        //     else if (response.action === wsnService.STATE_CHECKEDIN_CHILD) {
        //         if (response.errorMsg === null || response.errorMsg === undefined) {
        //             console.log('+++ Child ' + response.id + ' checked in! +++');
        //         } else {
        //             console.log('/// Child ' + response.id + ' NOT checked in! ///');
        //         }
        //     } else if (response.action === wsnService.STATE_CHECKEDOUT_CHILD) {
        //         if (response.errorMsg === null || response.errorMsg === undefined) {
        //             console.log('--- Child ' + response.id + ' checked out! ---');
        //         } else {
        //             console.log('/// Child ' + response.id + ' NOT checked out! ///');
        //         }
        //     }
        //     */

        //     deferred.resolve(response)
        //   },
        //   function (reason) {
        //     deferred.reject(reason)
        //   }
        // )
      // }

      return deferred.promise
    }

    wsnService.stopListener = function () {
      var deferred = $q.defer()

      if (Utils.wsnPluginEnabled()) {
        wsnService.stopNetworkStateInterval()
      }

      return deferred.promise
    }

    wsnService.getNetworkState = function () {
      var deferred = $q.defer()
      deferred.resolve(null);
       if (Utils.wsnPluginEnabled()) {
        
        ble.startScanWithOptions(['0000FEAA-0000-1000-8000-00805F9B34FB'],{reportDuplicates:false},

      //   window.DriverAppPlugin.getNetworkState(
          function (node) {
            console.log(node);
        //     var nsIds = []
        //     var ns = angular.copy(wsnService.networkState)
        //     networkState.forEach(function (nodeState) {
        //       nsIds.push(nodeState.nodeID)
        //       var upId=nodeState.nodeID.toUpperCase();
        //       if (!!nodeState.nodeID && ns[upId]) {
        //         if (ns[upId].status === '') {
        //           ns[upId].status = wsnService.STATUS_NEW
        //         }
        //         ns[upId].timestamp = nodeState[wsnService.NODESTATE_LASTSEEN]
        //         ns[upId].batteryLevel = nodeState[wsnService.NODESTATE_BATTERYLEVEL]
        //         ns[upId].batteryVoltage_mV = nodeState[wsnService.NODESTATE_BATTERYVOLTAGE_MV]
        //         ns[upId].rssi = nodeState[wsnService.NODESTATE_RSSI]
        //       }
        //     })
        //     wsnService.networkState = ns

        //     console.log('getNetworkState: ' + nsIds)
        //     deferred.resolve(networkState)
        //   },
        //   function (reason) {
        //     console.log('getNetworkState: ' + reason)
        //     deferred.reject(reason)
          },
          function(err){
            console.log(err);
          }
         )
        }

      return deferred.promise
    }

    wsnService.startNetworkStateInterval = function () {
      var deferred = $q.defer()
      if (Utils.wsnPluginEnabled()) {
        if (!wsnService.intervalGetNetworkState) {
          wsnService.intervalGetNetworkState = $interval(function () {
            wsnService.getNetworkState()
          }, Config.NETWORKSTATE_DELAY)
        }
      }
      return deferred.promise
    }

    wsnService.stopNetworkStateInterval = function () {
      var deferred = $q.defer()
      if (Utils.wsnPluginEnabled()) {
        if (wsnService.intervalGetNetworkState) {
          if ($interval.cancel(wsnService.intervalGetNetworkState)) {
            wsnService.intervalGetNetworkState = null
          }
        }
      }
      return deferred.promise
    }


    wsnService.getLogFiles = function () {
      var deferred = $q.defer()
      deferred.resolve(null);
      // if (Utils.wsnPluginEnabled()) {
      //   window.DriverAppPlugin.getLogFiles(
      //     function (response) {
      //       console.log('getLogFiles: ' + response)
      //       deferred.resolve(response)
      //     },
      //     function (reason) {
      //       console.log('getLogFiles: ' + reason)
      //       deferred.reject(reason)
      //     }
      //   )
      // } else {
      //   deferred.reject('log file not present')
      // }
      return deferred.promise
    }

    /*
     * Node list management
     */
    wsnService.networkState = {}

    wsnService.updateNodeList = function (nodes, type, reset) {
      if (!type || !nodes) {
        return
      }

      var nl = reset ? {} : angular.copy(wsnService.networkState)
      var changed = false
      nodes.forEach(function (node) {
        if (!!node.wsnId && !nl[node.wsnId.toUpperCase()]) {
          nl[node.wsnId.toUpperCase()] = {
            type: type,
            object: node,
            timestamp: -1,
            status: ''
          }
          if (!changed) {
            changed = true
          }
        }
      })

      if (changed) {
        wsnService.networkState = angular.copy(nl)
      }
    }

    wsnService.getNodeListByType = function (type) {
      var wsnIds = []

      Object.keys(wsnService.networkState).forEach(function (nodeId) {
        if (wsnService.networkState[nodeId].type === type) {
          wsnIds.push(nodeId)
        }
      })

      return wsnIds
    }

    wsnService.isNodeByType = function (nodeId, type) {
      return wsnService.networkState[nodeId].type === type
    }

    return wsnService
  })
