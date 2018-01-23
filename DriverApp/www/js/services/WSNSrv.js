angular.module('driverapp.services.wsn', [])
  .factory('WSNSrv', function ($rootScope, $q, $interval, Utils, Config) {
    var wsnService = {}

    wsnService.NODESTATE_NODEID = 'nodeID'
    wsnService.NODESTATE_STATE = 'state'
    wsnService.NODESTATE_LASTSEEN = 'lastSeen'
    wsnService.NODESTATE_LASTSTATECHANGE = 'lastStateChange'
    wsnService.NODESTATE_BATTERYLEVEL = 'batteryLevel'
    wsnService.NODESTATE_BATTERYVOLTAGE_MV = 'batteryVoltage_mV'

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
        window.DriverAppPlugin.init(
          function (response) {
            console.log('init: ' + response)
            deferred.resolve(response)
          },
          function (reason) {
            console.log('init: ' + reason)
            deferred.reject(reason)
          }
        )
      }

      return deferred.promise
    }

    wsnService.deinit = function () {
      var deferred = $q.defer()

      if (Utils.wsnPluginEnabled()) {
        window.DriverAppPlugin.deinit(
          function (response) {
            console.log('deinit: ' + response)
            deferred.resolve(response)
          },
          function (reason) {
            console.log('deinit: ' + reason)
            deferred.reject(reason)
          }
        )
      }

      return deferred.promise
    }

    wsnService.startListener = function () {
      var deferred = $q.defer()

      if (Utils.wsnPluginEnabled()) {
        window.DriverAppPlugin.startListener(
          function (response) {
            if (response.action === wsnService.STATE_CONNECTED_TO_CLIMB_MASTER) {
              if (response.errorMsg === null || response.errorMsg === undefined) {
                console.log('### Yippee-ki-yay! Welcome, Master! ###')
                $rootScope.masterError = false
                wsnService.setNodeList(wsnService.getNodeListByType('child'))
                wsnService.startNetworkStateInterval()
              } else {
                console.log('/// Master connection timeout! ///')
                $rootScope.masterError = true
                // TODO toast for failure
                // Utils.toast('Problema di connessione con il nodo Master!', 5000, 'center');
              }
            } else if (response.action === wsnService.STATE_DISCONNECTED_FROM_CLIMB_MASTER) {
              console.log('=== Where is my Master?!? ===')
              // TODO toast for failure
              // Utils.toast('Problema di connessione con il nodo Master!', 5000, 'center');

              // Retry
              wsnService.connectMaster(response.id)
            }
            /*
            else if (response.action === wsnService.STATE_CHECKEDIN_CHILD) {
                if (response.errorMsg === null || response.errorMsg === undefined) {
                    console.log('+++ Child ' + response.id + ' checked in! +++');
                } else {
                    console.log('/// Child ' + response.id + ' NOT checked in! ///');
                }
            } else if (response.action === wsnService.STATE_CHECKEDOUT_CHILD) {
                if (response.errorMsg === null || response.errorMsg === undefined) {
                    console.log('--- Child ' + response.id + ' checked out! ---');
                } else {
                    console.log('/// Child ' + response.id + ' NOT checked out! ///');
                }
            }
            */

            deferred.resolve(response)
          },
          function (reason) {
            deferred.reject(reason)
          }
        )
      }

      return deferred.promise
    }

    wsnService.stopListener = function () {
      var deferred = $q.defer()

      if (Utils.wsnPluginEnabled()) {
        window.DriverAppPlugin.getMasters(
          function (response) {
            wsnService.stopNetworkStateInterval()
            deferred.resolve(response)
          },
          function (reason) {
            console.log(reason)
            deferred.reject(reason)
          }
        )
      }

      return deferred.promise
    }

    /**
     * NOT EFFECTIVELY USED
     */
    wsnService.getMasters = function () {
      var deferred = $q.defer()

      if (Utils.wsnPluginEnabled()) {
        window.DriverAppPlugin.getMasters(
          function (masters) {
            console.log('getMasters: ' + masters)
            deferred.resolve(masters)
          },
          function (reason) {
            console.log('getMasters: ' + reason)
            deferred.reject(reason)
          }
        )
      }

      return deferred.promise
    }

    wsnService.connectMaster = function (masterId) {
      var deferred = $q.defer()

      if (Utils.wsnPluginEnabled()) {
        window.DriverAppPlugin.connectMaster(
          masterId,
          function (procedureStarted) {
            $rootScope.masterError = false
            console.log('connectMaster: ' + procedureStarted)
            deferred.resolve(procedureStarted)
          },
          function (reason) {
            $rootScope.masterError = true
            console.log('connectMaster: ' + reason)
            deferred.reject(reason)
          }
        )
      }

      return deferred.promise
    }

    wsnService.setNodeList = function (list) {
      var deferred = $q.defer()

      if (Utils.wsnPluginEnabled()) {
        window.DriverAppPlugin.setNodeList(
          list,
          function (procedureStarted) {
            console.log('setNodeList: ' + procedureStarted)
            deferred.resolve(procedureStarted)
          },
          function (reason) {
            console.log('setNodeList: ' + reason)
            deferred.reject(reason)
          }
        )
      }

      return deferred.promise
    }

    wsnService.getNetworkState = function () {
      var deferred = $q.defer()

      if (Utils.wsnPluginEnabled()) {
        window.DriverAppPlugin.getNetworkState(
          function (networkState) {
            var nsIds = []
            var ns = angular.copy(wsnService.networkState)
            networkState.forEach(function (nodeState) {
              nsIds.push(nodeState.nodeID)
              var upId=nodeState.nodeID.toUpperCase();
              if (!!nodeState.nodeID && ns[upId]) {
                if (ns[upId].status === '') {
                  ns[upId].status = wsnService.STATUS_NEW
                }
                ns[upId].timestamp = nodeState[wsnService.NODESTATE_LASTSEEN]
                ns[upId].batteryLevel = nodeState[wsnService.NODESTATE_BATTERYLEVEL]
                ns[upId].batteryVoltage_mV = nodeState[wsnService.NODESTATE_BATTERYVOLTAGE_MV]
              }
            })
            wsnService.networkState = ns

            console.log('getNetworkState: ' + nsIds)
            deferred.resolve(networkState)
          },
          function (reason) {
            console.log('getNetworkState: ' + reason)
            deferred.reject(reason)
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

    wsnService.checkinChild = function (childId) {
      var deferred = $q.defer()

      if (Utils.wsnPluginEnabled()) {
        window.DriverAppPlugin.checkinChild(
          childId,
          function (procedureStarted) {
            console.log('checkinChild: ' + procedureStarted + ' (' + childId + ')')
            deferred.resolve(procedureStarted)
          },
          function (reason) {
            console.log('checkinChild: ' + reason + ' (' + childId + ')')
            deferred.reject(reason)
          }
        )
      }

      return deferred.promise
    }

    wsnService.checkinChildren = function (childrenIds) {
      var deferred = $q.defer()

      if (Utils.wsnPluginEnabled()) {
        window.DriverAppPlugin.checkinChildren(
          childrenIds,
          function (procedureStarted) {
            console.log('checkinChildern: ' + procedureStarted + ' (' + childrenIds + ')')
            deferred.resolve(procedureStarted)
          },
          function (reason) {
            console.log('checkinChildern: ' + reason + ' (' + childrenIds + ')')
            deferred.reject(reason)
          }
        )
      }

      return deferred.promise
    }

    wsnService.checkoutChild = function (childId) {
      var deferred = $q.defer()

      if (Utils.wsnPluginEnabled()) {
        window.DriverAppPlugin.checkoutChild(
          childId,
          function (procedureStarted) {
            console.log('checkoutChild: ' + procedureStarted)
            deferred.resolve(procedureStarted)
          },
          function (reason) {
            console.log('checkoutChild: ' + reason)
            deferred.reject(reason)
          }
        )
      }

      return deferred.promise
    }

    wsnService.checkoutChildren = function (childrenIds) {
      var deferred = $q.defer()

      if (Utils.wsnPluginEnabled()) {
        window.DriverAppPlugin.checkoutChildren(
          childrenIds,
          function (procedureStarted) {
            console.log('checkoutChildren: ' + procedureStarted)
            deferred.resolve(procedureStarted)
          },
          function (reason) {
            console.log('checkoutChildren: ' + reason)
            deferred.reject(reason)
          }
        )
      }

      return deferred.promise
    }

    wsnService.getLogFiles = function () {
      var deferred = $q.defer()

      if (Utils.wsnPluginEnabled()) {
        window.DriverAppPlugin.getLogFiles(
          function (response) {
            console.log('getLogFiles: ' + response)
            deferred.resolve(response)
          },
          function (reason) {
            console.log('getLogFiles: ' + reason)
            deferred.reject(reason)
          }
        )
      } else {
        deferred.reject('log file not present')
      }
      return deferred.promise
    }

    wsnService.test = function (text) {
      var deferred = $q.defer()

      if (Utils.wsnPluginEnabled()) {
        window.DriverAppPlugin.test(
          text,
          function (response) {
            console.log('test: ' + response)
            deferred.resolve(response)
          },
          function (reason) {
            console.log('test: ' + reason)
            deferred.reject(reason)
          }
        )
      }

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

    /*
    NO_ERROR,
    WRONG_BLE_NAME_ERROR,
    ADVERTISER_NOT_AVAILABLE_ERROR,
    INTERNAL_ERROR,
    ANDROID_VERSION_NOT_COMPATIBLE_ERROR,
    INVALID_DATE_ERROR
    */

    wsnService.enableMaintenanceProcedure = function (wakeUpYear, wakeUpMonth, wakeUpDay, wakeUpHour, wakeUpMinutes) {
      var deferred = $q.defer()

      if (Utils.wsnPluginEnabled()) {
        window.DriverAppPlugin.enableMaintenanceProcedure(wakeUpYear, wakeUpMonth, wakeUpDay, wakeUpHour, wakeUpMinutes,
          function (response) {
            console.log('enableMaintenanceProcedure: ' + response)
            if (response === 'NO_ERROR') {
              deferred.resolve(response)
            } else {
              deferred.reject(response)
            }
          },
          function (reason) {
            console.log('enableMaintenanceProcedure: ' + reason)
            deferred.reject(reason)
          }
        )
      } else {
        deferred.reject('DriverAppPlugin not present')
      }

      return deferred.promise
    }

    wsnService.disableMaintenanceProcedure = function () {
      var deferred = $q.defer()

      if (Utils.wsnPluginEnabled()) {
        window.DriverAppPlugin.disableMaintenanceProcedure(
          function (response) {
            console.log('disableMaintenanceProcedure: ' + response)
            if (response === 'NO_ERROR') {
              deferred.resolve(response)
            } else {
              deferred.reject(response)
            }
          },
          function (reason) {
            console.log('disableMaintenanceProcedure: ' + reason)
            deferred.reject(reason)
          }
        )
      } else {
        deferred.reject('DriverAppPlugin not present')
      }

      return deferred.promise
    }

    return wsnService
  })
