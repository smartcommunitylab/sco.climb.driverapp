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
    wsnService.networkState = {}

    wsnService.intervalGetNetworkState = null
    var CLIMB_NAMESPACE_EDDYSTONE = "3906bf230e2885338f44";
    var UID_FRAME_TYPE = 0x00;
    var URL_FRAME_TYPE = 0x10;
    var TLM_FRAME_TYPE = 0x20;
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
    var networkState = [];

    wsnService.scanNetwork = function() {
      ble.startScanWithOptions(['feaa'],
          { reportDuplicates: true },
          function (node) {
            if (node.rssi>-80){
            var parsedPacket=wsnService.parseBeacon(node.advertising);
              if (parsedPacket.namespace==='3906bf230e2885338f44'){
                var index= networkState.findIndex(x => x.nodeID === parsedPacket.namespace+parsedPacket.instance);
                if (index>=0){
                  //update values
                  networkState[index].rssi=node.rssi;
                }
                else {
                networkState.push({nodeID:parsedPacket.namespace+parsedPacket.instance,rssi:node.rssi});
                }
            }
            // })
            // wsnService.networkState = ns
            // console.log('getNetworkState: ' + nsIds)
            // deferred.resolve(networkState)
            }
          },
          function(err){
            console.log('getNetworkState: ' + err)
          }
         )
    }
    wsnService.getNetworkState = function () {
      var deferred = $q.defer()
      deferred.resolve(null);
       if (Utils.wsnPluginEnabled()) {
        var nsIds = [];
        var ns = angular.copy(wsnService.networkState);
        // ble.startScanWithOptions(['feaa'],
        //   { reportDuplicates: true },
        //   function (node) {
        //     if (node.rssi>-80){
        //     var parsedPacket=wsnService.parseBeacon(node.advertising);
        //       if (parsedPacket.namespace==='3906bf230e2885338f44'){
        //         var upId=parsedPacket.namespace+parsedPacket.instance;
            networkState.forEach(function (nodeState) {
              nsIds.push(nodeState.nodeID);
              var upId=nodeState.nodeID.toUpperCase();
              if (!!upId && ns[upId]) {
                if (ns[upId].status === '') {
                  ns[upId].status = wsnService.STATUS_NEW
                }
                // ns[upId].timestamp = nodeState[wsnService.NODESTATE_LASTSEEN]
                // ns[upId].batteryLevel = nodeState[wsnService.NODESTATE_BATTERYLEVEL]
                // ns[upId].batteryVoltage_mV = nodeState[wsnService.NODESTATE_BATTERYVOLTAGE_MV]
                ns[upId].rssi = nodeState.rssi;
              }
            }
            // })
            // wsnService.networkState = ns
            // console.log('getNetworkState: ' + nsIds)
            // deferred.resolve(networkState)
            
          // ,
          // function(err){
          //   console.log('getNetworkState: ' + err)
          //   deferred.reject(err)
          // }
         );
                     wsnService.networkState = ns
            //console.log('getNetworkState: ' + nsIds)
            deferred.resolve(networkState)
        //  setTimeout(function() { 
        //   wsnService.networkState = ns
        //   console.log('getNetworkState: ' + nsIds)
        //   deferred.resolve(wsnService.networkState)
        //  },
        //   5000);
        }

      return deferred.promise
    }

    wsnService.startNetworkStateInterval = function () {
      var deferred = $q.defer()
      if (Utils.wsnPluginEnabled()) {
        setTimeout(wsnService.scanNetwork(),5000);
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
    function asHexString(i) {
      var hex;
  
      hex = i.toString(16);
  
      // zero padding
      if (hex.length === 1) {
          hex = "0" + hex;
      }
  
      return "0x" + hex;
  }
  
    wsnService.parseAdvertisement = function(raw){
      var buffer = new Uint8Array(raw);
      console.log('raw'+buffer);
      var length, type, data, i = 0, advertisementData = {};
      var bytes = new Uint8Array(buffer);
  
      while (length !== 0) {
  
          length = bytes[i] & 0xFF;
          i++;
  
          // decode type constants from https://www.bluetooth.org/en-us/specification/assigned-numbers/generic-access-profile
          type = bytes[i] & 0xFF;
          i++;
  
          data = bytes.slice(i, i + length - 1).buffer; // length includes type byte, but not length byte
          i += length - 2;  // move to end of data
          i++;
  
          advertisementData[asHexString(type)] = data;
      }
  
      return advertisementData;
    }
    wsnService.parseBeacon = function(raw) {
      var adParsed = wsnService.parseAdvertisement(raw);
      //g(' adParsed',adParsed);

      // var TELEMETRY="0x20";
      var SERVICE_DATA_KEY = '0x16';
            serviceData = adParsed[SERVICE_DATA_KEY];
            if (serviceData) {
                // first 2 bytes are the 16 bit UUID
                var parsed = wsnService.parseUidData(serviceData);
                //console.log('parsed',parsed);
            } 
      return parsed;
      // var frameType = new Uint8Array(data)[0];
    
      // var beacon = {};
      // var type = 'unknown';
    
      // switch (frameType) {
      //   case UID_FRAME_TYPE:
      //     type = 'uid';
      //     beacon = this.parseUidData(data);
      //     break;
    
      //   case URL_FRAME_TYPE:
      //     type = 'url';
      //     beacon = this.parseUrlData(data);
      //     break;
    
      //   case TLM_FRAME_TYPE:
      //     type = 'tlm';
      //     beacon = this.parseTlmData(data);
      //     break;
    
      //   default:
      //     break;
      // }
    }

    
    wsnService.parseUrlData = function(data) {
      return {
        txPower:  new Uint8Array(data)[0],
        url: urlDecode( new Uint8Array(data)[2])
      };
    };
    
    wsnService.parseTlmData = function(data) {
      return {
        tlm: {
          version:  new Uint8Array(data)[1], 
          vbatt: new Uint16Array(data)[2],
          temp:  new Uint16Array(data)[4] / 256,
          advCnt: new Uint32Array(data)[6], 
          secCnt: new Uint32Array(data)[10]
        }
      };
    };
    function i2hex(i) {
      return ('0' + i.toString(16)).slice(-2);
    }
    wsnService.parseUidData = function(data) {
      return {
        // txPower: new Uint8Array(data),
        namespace: new Uint8Array(data).slice(4, 14).reduce(function(memo, i) {return memo + i2hex(i)}, ''),
        instance:  new Uint8Array(data).slice(14, 20).reduce(function(memo, i) {return memo + i2hex(i)}, '')
      };
    };
    return wsnService
  })
