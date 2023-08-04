/* global performance */
angular.module('driverapp.controllers.route', [])
  .controller('RouteCtrl', function ($scope, $ionicPlatform, $rootScope, $stateParams, $ionicHistory, $ionicNavBarDelegate, $ionicPopup, $ionicModal, $interval, $ionicScrollDelegate, $filter, $timeout, $cordovaFile, $window, Config, Utils, StorageSrv, GeoSrv, AESrv, APISrv, WSNSrv) {
    $scope.fromWizard = false
    $rootScope.pedibusEnabled = true

    // to prevent double click
    $scope.nextClicked = 0;
    $scope.order = {
      value: 'arrive'
    };
    var BATTERYLEVEL_LOW = 1

    var passengersScrollDelegate = $ionicScrollDelegate.$getByHandle('passengersHandle')
    $scope.mergedOnBoard = []
    $rootScope.threshold=localStorage.getItem('threshold');
    $rootScope.thresholdOn=(localStorage.getItem('thresholdOn')=='true');
    /*
     * Passengers panel size calculator
     */
    $scope.resizePassengersPanel = function () {
      $scope.passengersPanelStyle = {}
      var height = $window.innerHeight - (44 * 3)
      var onBoardHeight = 100 * ($scope.mergedOnBoard.length > 2 ? 2 : $scope.mergedOnBoard.length)
      height = height - onBoardHeight - (onBoardHeight > 0 ? 28 : 0)
      $scope.passengersPanelStyle['height'] = height + 'px'
    }

    var aesInstance = {}

    $scope.children = null
    $scope.driver = null
    $scope.helpers = []
    $scope.helpersTemp = []
    $scope.allhelpers = false;
    $rootScope.route = {}
    $scope.stops = []
    $scope.onBoardTemp = []
    $scope.onBoard = []

    $scope.viewPos = 0
    $scope.enRoutePos = 0
    $scope.enRouteArrived = false

    $scope.sel = {
      stop: null
    }

    /* INIT */
    if ($stateParams['fromWizard']) {
      $scope.fromWizard = $stateParams['fromWizard']
    }
    $scope.order['value'] = localStorage.getItem('order') ? localStorage.getItem('order') : 'arrive'

    if ($scope.fromWizard) {
      $rootScope.pedibusEnabled = false

      if ($stateParams['route']) {
        $rootScope.route = $stateParams['route']
        $scope.routeId = $rootScope.route.objectId;
        aesInstance = AESrv.startInstance($rootScope.route.objectId)
        WSNSrv.updateNodeList(StorageSrv.getChildren(), 'child', true)

        if ($stateParams['driver']) {
          $scope.driver = $stateParams['driver']
          AESrv.setDriver($scope.driver)
        }
        if ($stateParams['ownerId']) {
          $scope.ownerId = $stateParams['ownerId']
          StorageSrv.setOwnerId($scope.ownerId);
        }
        if ($stateParams['helpers']) {
          $scope.helpersTemp = $stateParams['helpers']
          /*
          $scope.helpers.forEach(function (helper) {
              AESrv.setHelper(helper);
          });
          */
        }

        if ($scope.enRoutePos == 0) {
          GeoSrv.startWatchingPosition(function (position) {
            if (!!position && !!position.coords) {
              var lat = position.coords.latitude
              var lon = position.coords.longitude
              var acc = position.coords.accuracy
              AESrv.driverPosition($scope.driver, lat, lon, acc)
            }
          }, null, Config.GPS_DELAY)
        }

        underRSSILevel = function(levelNode) {
          // const threshold=-55
          const threshold = $rootScope.thresholdOn?$rootScope.threshold:null;
          console.log("RSSI of the node= "+levelNode);
          console.log("Threshold= "+threshold);
          if (threshold)
          return levelNode<threshold;
          else true;
        }
        /*
         * WSN watch
         */
        $scope.$watch(
          function () {
            return WSNSrv.networkState
          },
          function (newNs, oldNs) {
            var ns = angular.copy(newNs)
            var somethingChanged = false
            $rootScope.batteryAlarm = false

            Object.keys(ns).forEach(function (nodeId) {
              if (WSNSrv.isNodeByType(nodeId, 'child')) {

                if ((!ns[nodeId].rssi || ($rootScope.thresholdOn&&underRSSILevel(ns[nodeId].rssi)))){
                  return;
                }
                if (ns[nodeId].batteryLevel === BATTERYLEVEL_LOW && $rootScope.batteryAlarm === false) {
                  $rootScope.batteryAlarm = true
                }

                if (ns[nodeId].status === WSNSrv.STATUS_NEW) {
                  // new node?
                  if (!oldNs[nodeId].status) {
                    AESrv.nodeInRange(ns[nodeId].object)
                  }

                  var child = $scope.isChildOfThisStop(nodeId)
                  if (child !== null) {
                    $scope.takeOnBoard(child.objectId)
                    ns[nodeId].status = WSNSrv.STATUS_BOARDED_ALREADY
                    somethingChanged = true
                  }
                }

                if ($scope.isOnBoard(ns[nodeId].object.objectId)) {
                  if (ns[nodeId].timestamp === -1) {
                    return
                  }

                  var overTimeout = (moment().valueOf() - ns[nodeId].timestamp) > Config.NODESTATE_TIMEOUT

                  if (overTimeout && ns[nodeId].status !== WSNSrv.STATUS_OUT_OF_RANGE) {
                    ns[nodeId].status = WSNSrv.STATUS_OUT_OF_RANGE
                    somethingChanged = true
                    AESrv.nodeOutOfRange(ns[nodeId].object, ns[nodeId].timestamp)
                    console.log('nodeOutOfRange: ' + nodeId + ' (last seen ', +ns[nodeId].timestamp + ')')
                    /*
                    var errorString = 'Attenzione! '
                    errorString += ns[nodeId].object.surname + ' ' + ns[nodeId].object.name + ' (' + nodeId + ') fuori portata!'
                    // TODO toast for failure
                    Utils.toast(errorString, 5000, 'center');
                    */
                  } else if (!overTimeout && ns[nodeId].status === WSNSrv.STATUS_OUT_OF_RANGE) {
                    ns[nodeId].status = WSNSrv.STATUS_BOARDED_ALREADY
                    somethingChanged = true
                    AESrv.nodeInRange(ns[nodeId].object)
                    console.log('nodeBackInRange: ' + nodeId)
                    /*
                    var toastString = ns[nodeId].object.surname + ' ' + ns[nodeId].object.name + ' (' + nodeId + ') di nuovo in portata!'
                    // TODO toast for failure
                    Utils.toast(toastString, 5000, 'center');
                    */
                  }
                }
              }
            })

            if (somethingChanged) {
              WSNSrv.networkState = ns
            }
          }
        )
      }

      $scope.resizePassengersPanel()
    } else {
      if ($stateParams['route']) {
        $rootScope.route = $stateParams['route']
      } else if ($stateParams['routeId']) {
        $rootScope.route = StorageSrv.getRouteById($stateParams['routeId'])

      }
      $scope.routeId = $rootScope.route.objectId;
    }




    /*
     * populate stops
     */
    $scope.populateStops = function () {
      Utils.loading()
      APISrv.getStopsByRoute($stateParams['ownerId'], $stateParams['routeId']).then(
        function (stops) {
          $scope.stops = stops
          // get children images
          if (Utils.isConnectionFastEnough()) {
            // download children images
            var counter = 0
            var downloaded = 0
            var children = StorageSrv.getChildren()
            var childrenByRoute = []
            angular.forEach($scope.stops, function (stop) {
              angular.forEach(children, function (child) {
                if (stop.passengerList.indexOf(child.objectId) !== -1) {
                  childrenByRoute.push(child)
                }
              })
            })
            if (childrenByRoute.length == 0) {
              $scope.sel.stop = $scope.stops[0]
              Utils.loaded();
            }

            angular.forEach(childrenByRoute, function (child) {
              APISrv.getChildImage(child.objectId, $scope.ownerId).then(
                function () {
                  downloaded++
                  counter++
                  console.log('Downloaded images: ' + downloaded + ' (Total: ' + counter + '/' + children.length + ')')
                  if (counter === childrenByRoute.length) {
                    // Select the first automatically
                    $scope.sel.stop = $scope.stops[0]
                    $scope.getChildrenForStop($scope.sel.stop)
                    Utils.loaded()
                  }
                },
                function () {
                  counter++
                  if (counter === childrenByRoute.length) {
                    // Select the first automatically
                    $scope.sel.stop = $scope.stops[0]
                    $scope.getChildrenForStop($scope.sel.stop)
                    Utils.loaded()
                  }
                }
              )
            })
          } else {
            // Select the first automatically
            $scope.sel.stop = $scope.stops[0]
            $scope.getChildrenForStop($scope.sel.stop)
            Utils.loaded()
          }
        },
        function (error) {
          Utils.loaded()
          console.log(error)
        }
      )
    }


    $scope.viewPrevious = function () {
      if (($scope.viewPos - 1) >= 0) {
        $scope.viewPos--
        $scope.sel.stop = $scope.stops[$scope.viewPos]
        $scope.getChildrenForStop($scope.sel.stop)
      }
    }

    $scope.viewNext = function () {
      if (($scope.viewPos + 1) <= $scope.enRoutePos) {
        $scope.viewPos++
        $scope.sel.stop = $scope.stops[$scope.viewPos]
        $scope.getChildrenForStop($scope.sel.stop)
      }
    }

    var handleChildrenAndHelpers = function () {
      // update onBoard
      $scope.onBoard = $scope.onBoard.concat($scope.onBoardTemp)
      $scope.onBoardTemp = []
      $scope.updateMergedOnBoard()

      // add new helpers
      $scope.helpersTemp.forEach(function (helper) {
        AESrv.setHelper(helper)
      })
      $scope.helpers = $scope.helpers.concat($scope.helpersTemp)
      $scope.helpersTemp = []
    }

    var _rootScope = $rootScope;

    var handleNext = function () {
      console.log('NEXT STEP', new Date().getTime());
      $ionicScrollDelegate.scrollTop(true)

      // if has next
      if ($scope.stops[$scope.enRoutePos + 1]) {
        Utils.loading();
        // first leave
        if ($scope.enRoutePos == 0) {
          AESrv.startRoute($scope.stops[$scope.enRoutePos]);
        }

        handleChildrenAndHelpers()

        // move to the next
        AESrv.stopLeaving($scope.sel.stop)
        $scope.enRoutePos++
        $scope.viewPos++
        $scope.sel.stop = $scope.stops[$scope.enRoutePos]
        $scope.getChildrenForStop($scope.sel.stop)
        $scope.nextClicked = 0;
        setTimeout(Utils.loaded, 200);
      } else {
        // Arriva
        $ionicPopup.confirm({
          title: 'INVIA DATI',
          template: 'Cliccando su INVIA i dati verranno mandati al server e, per questa sessione, non potrai più modificare lo stato dei passeggeri. Confermi di aver concluso la corsa del pedibus e di voler inviare i dati?',
          cssClass: 'route-popup',
          cancelText: 'Annulla',
          cancelType: 'button-stable',
          okText: 'INVIA',
          okType: 'button-positive'
        }).then(function (ok) {
          if (ok) {
            Utils.loading();
            handleChildrenAndHelpers();
            var childrenWsnIds = []
            $scope.onBoard.forEach(function (passengerId) {
              var child = $scope.getChild(passengerId)
              AESrv.nodeAtDestination(child)
              AESrv.nodeCheckout(child)

              if (child.wsnId && WSNSrv.networkState[child.wsnId]) {
                if (WSNSrv.networkState[child.wsnId].batteryLevel != null) {
                  AESrv.batteryStatus(child)
                }

                if (WSNSrv.networkState[child.wsnId].status === WSNSrv.STATUS_BOARDED_ALREADY) {
                  childrenWsnIds.push(child.wsnId)
                }
              }
            })
            // store data in localstorage
            AESrv.endRoute($scope.stops[$scope.enRoutePos], $scope.ownerId, $scope.routeId).then(function (res) {
              GeoSrv.stopWatchingPosition()
              WSNSrv.stopListener()
              $scope.enRouteArrived = true
              $rootScope.pedibusEnabled = true
              $scope.nextClicked = 0;
              Utils.loaded();
              // $ionicPopup.alert({
              //   title: $filter('translate')('upload_success_popup_title'),
              //   template: $filter('translate')('upload_success_popup_text')
              // }).then(function (res) {
              //   $rootScope.exitApp(true);
              // });
            }, function (err) {
              $scope.nextClicked = 0;
              Utils.loaded();
              $ionicPopup.alert({
                title: $filter('translate')('upload_error_popup_title'),
                template: $filter('translate')('upload_error_popup_text')
              });
            });
          } else {
            $scope.nextClicked = 0;
          }
        })
      }
    }

    $scope.goNext = function () {
      console.log('NEXT CLICK', new Date().getTime());
      if ($scope.nextClicked++) {
        return;
      }
      setTimeout(handleNext);
    }

    $scope.getChild = function (childId) {
      var foundChild = null
      for (var i = 0; i < $scope.children.length; i++) {
        var child = $scope.children[i]
        if (child.objectId === childId) {
          foundChild = child
          i = $scope.children.length
        }
      }
      return foundChild
    }

    $scope.getChildBg = function (child) {
      if (child.imageUrl) {
        return {
          'background-image': 'url(\'' + child.imageUrl + '\')'
        }
      }
      return {}
    }

    $scope.getChildrenForStop = function (stop) {
      // $scope.sel.stop = stop;
      var passengers = []
      if ($scope.children == null || !$scope.children.length) {
        $scope.children = StorageSrv.getChildren()
      }
      if ($scope.children != null) {
        $scope.children.forEach(function (child) {
          // set image path
          if (ionic.Platform.isWebView()) {
            var imagePath = Config.imagesDir() + child.objectId + '.jpg'
            $cordovaFile.checkFile(Config.imagesDir(), child.objectId + '.jpg').then(
              function (success) {
                child.imageUrl = imagePath
              }
            )
          }

          if (stop.passengerList.indexOf(child.objectId) !== -1) {
            passengers.push(child)
          }
        })
      }
      stop.passengers = passengers
    }

    $scope.isChildOfThisStop = function (childWsnId) {
      var child = null
      if (!!$scope.sel.stop && !!$scope.sel.stop.passengers) {
        for (var i = 0; i < $scope.sel.stop.passengers.length; i++) {
          var passenger = $scope.sel.stop.passengers[i]
          if (passenger.wsnId && passenger.wsnId.toUpperCase() === childWsnId.toUpperCase()) {
            child = passenger
            i = $scope.sel.stop.passengers.length
          }
        }
      }
      return child
    }

    $scope.takeOnBoard = function (passengerId) {
      if ($scope.onBoardTemp.indexOf(passengerId) === -1) {
        $scope.onBoardTemp.push(passengerId)
        var child = $scope.getChild(passengerId)
        AESrv.nodeCheckin(child)
        // REMOVED AS NO USAGE IN PLUGIN 2018
        // if (child.wsnId) {
        //   WSNSrv.checkinChild(child.wsnId)
        // }
      }

      $scope.updateMergedOnBoard()
      passengersScrollDelegate.resize()
    }

    $scope.dropOff = function (passenger, event) {
      event.stopPropagation()

      var child = $scope.getChild(passenger.id)
      if (passenger.tmp) {
        var index = $scope.onBoardTemp.indexOf(passenger.id)
        if (index !== -1) {
          $scope.onBoardTemp.splice(index, 1)
          AESrv.nodeCheckout(child)
          $scope.updateMergedOnBoard()
          passengersScrollDelegate.resize()
        }
      } else {
        $ionicPopup.confirm({
          title: 'Rimuovi ' + child.name + ' ' + child.surname  ,
          template: child.name + ' ' + child.surname + ' è stato aggiunto in una fermata precedente. Vuoi confermare la rimozione?',
          cssClass: 'route-popup',
          cancelText: 'Annulla',
          cancelType: 'button-stable',
          okText: 'RIMUOVI',
          okType: 'button-positive'
        }).then(function (ok) {
          if (ok) {
            var index = $scope.onBoard.indexOf(passenger.id)
            if (index !== -1) {
              $scope.onBoard.splice(index, 1)
              AESrv.nodeCheckout(child)
              $scope.updateMergedOnBoard()
              passengersScrollDelegate.resize()
            }
          }
        })
      }
    }

    $scope.toBeTaken = []
    $scope.setToBeTaken = function (child) {
      var tbtIndex = $scope.toBeTaken.indexOf(child.objectId)
      if (!!child.checked && tbtIndex === -1) {
        $scope.toBeTaken.push(child.objectId)
      } else if (!child.checked && tbtIndex !== -1) {
        $scope.toBeTaken.splice(tbtIndex, 1)
      }
    }

    $scope.isOnBoard = function (childId) {
      if ($scope.onBoard.indexOf(childId) !== -1 || $scope.onBoardTemp.indexOf(childId) !== -1) {
        return true
      }
      return false
    }
    $scope.alreadySent = function () {
      //show popup already sent
      Utils.alreadySent($rootScope.exitApp,$scope.goWithLocalStorage);
    }

    $scope.presentLocalData = function () {
      //show popup already sent
      $ionicPopup.confirm({
        title: $filter('translate')("local_data_present"),
        template: $filter('translate')("local_data_present_body"),
        buttons: [{
          text: $filter('translate')("btn_no"),
          type: 'button-stable',
          onTap: function () {
            //go on (delete old data)
            Utils.removeDataOnLocalStorage($scope.ownerId, $scope.routeId);
          }
        },
        {
          text: $filter('translate')("btn_yes"),
          type: 'button-positive',
          onTap: function () {
            //TODO try to send the local Data
            var eas = JSON.parse(Utils.getDataOnLocalStorage($scope.ownerId, $scope.routeId));
            APISrv.addEvents(eas, $scope.ownerId, $scope.routeId).then(function (res) {
              Utils.loaded();
              Utils.popupSent();
              APISrv.uploadWsnLogs($scope.routeId, $scope.ownerId).then(
                function () {
                  Utils.loaded()
                  console.log('[WSN Logs] Successfully uploaded to the server.')
                },
                function (error) {
                  Utils.loaded()
                  console.log('[WSN Logs] Error uploading to the server: ' + error)
                })
              //if ok sent wsn log
              // delete  local data for events
              Utils.removeDataOnLocalStorage($scope.ownerId, $scope.routeId);

              //   show message 
            }, function (err) {
              Utils.loaded()
              Utils.popupNotSent();
            })
          }
        }]
      })
    }

    $scope.checkDataOnServer = function () {
      // check data on server with ownerID and routeID from midnight to midnight
      if ($scope.ownerId && $scope.routeId)
        return Utils.checkDataOnServer($scope.ownerId, $scope.routeId)

      else return Promise.resolve(false)
    }
    $scope.checkDataOnLocalStorage = function () {
      // check data in localStorage
      return Utils.checkDataOnLocalStorage($scope.ownerId, $scope.routeId)
    }
    $scope.storeLocalData = function () {
      // store data in localStorage as JSON
    }
    $scope.deleteLocalData = function () {
      // store data in localStorage as JSON
    }
    $scope.goWithLocalStorage = function () {
      if ($scope.checkDataOnLocalStorage()) {
        $scope.presentLocalData();
      }
      else {
        //go on
      }
    }
    /*
     * "Add others" Popup
     */
    $scope.selectChildrenPopup = function () {
      // var childrenPopup =
      $ionicPopup.show({
        templateUrl: 'templates/route_popup_children.html',
        cssClass: 'route-popup',
        title: 'BAMBINI',
        subTitle: $rootScope.route.name,
        scope: $scope,
        buttons: [{
          text: 'CHIUDI',
          type: 'button-stable',
          onTap: function () {
            // reset
            $scope.toBeTaken.forEach(function (childId) {
              $scope.getChild(childId).checked = false
            })
            $scope.toBeTaken = []

            $scope.updateMergedOnBoard()
            passengersScrollDelegate.resize()
          }
        }, {
          text: 'SALVA',
          type: 'button-positive',
          onTap: function (e) {
            if ($scope.toBeTaken.length > 0) {
              var wsnIds = []
              $scope.toBeTaken.forEach(function (passengerId) {
                var child = $scope.getChild(passengerId)
                AESrv.nodeCheckin(child)
                if (child.wsnId) {
                  wsnIds.push(child.wsnId)
                }
              })
              // REMOVED AS NO USAGE IN PLUGIN 2018
              // if (wsnIds.length > 0) {
              //   WSNSrv.checkinChildren(wsnIds)
              // }

              $scope.onBoardTemp = $scope.onBoardTemp.concat($scope.toBeTaken)
            }

            // reset
            $scope.toBeTaken.forEach(function (childId) {
              $scope.getChild(childId).checked = false
            })
            $scope.toBeTaken = []

            $scope.updateMergedOnBoard()
            passengersScrollDelegate.resize()
          }
        }]
      })
    }


    $scope.changeProfile = function (fromLibrary) {

      var template = fromLibrary ? $filter('translate')("change_image_template_library") : $filter('translate')("change_image_template_camera")
      $ionicPopup.confirm({
        title: $filter('translate')("change_image_title"),
        template: template,
        buttons: [{
          text: $filter('translate')("btn_close"),
          type: 'button-cancel'
        },
        {
          text: $filter('translate')("change_image_confirm"),
          type: 'button-custom',
          onTap: function () {
            $scope.choosePhoto(fromLibrary);

          }
        }
        ]
      });
    }
    $scope.callNumber = function(number) {
      cordova.InAppBrowser.open('tel:'+number,'_self', 'hidden=yes, location=yes');
        // window.plugins.CallNumber.callNumber(null, null, number, false);
    }
    $scope.getImageUrl = function () {
      return Config.SERVER_URL + '/child/image/download/' + $scope.singlechild.ownerId + '/' + $scope.singlechild.objectId + '?timestamp=' + Utils.getImageTimestamp($scope.singlechild.ownerId, $scope.singlechild.objectId);
    }
    $scope.getImageFooter = function (child) {
      return Config.SERVER_URL + '/child/image/download/' + child.ownerId + '/' + child.objectId + '?timestamp=' + Utils.getImageTimestamp(child.ownerId, child.objectId);
    }
    $scope.getImageList = function (child) {
      return Config.SERVER_URL + '/child/image/download/' + child.ownerId + '/' + child.objectId + '?timestamp=' + Utils.getImageTimestamp(child.ownerId, child.objectId);
    }
    $scope.choosePhoto = function (fromLibrary) {
      Utils.chooseAndUploadPhoto($scope.singlechild.ownerId, $scope.singlechild.objectId, fromLibrary, APISrv.uploadFileImage);
    }
    /*
     * Child details popup
     */
    $scope.showChildDetails = function (child) {
      $scope.parentDisplayName = child.parentName;
      $scope.phone = child.phone;
      $scope.singlechild = child;
      // var detailsPopup =
      $ionicPopup.alert({
        title: child.name + ' ' + child.surname,
        // template: (!!child.parentName ? child.parentName + ': ' + child.phone : child.phone),
        templateUrl: 'templates/phone_popup_person.html',
        scope: $scope,
        okText: 'OK',
        okType: 'button'
      })
    }

    /*
     * Merge lists method: used to merge the two lists (onBoard and onBoardTmp) and generate a matrix with rows of 3 cols
     */
    $scope.updateMergedOnBoard = function () {
      var onBoardMerged = []
      var onBoardMatrix = []
      var cols = 3
      for (var i = 0; i < $scope.onBoard.length; i++) {
        onBoardMerged.push({
          id: $scope.onBoard[i],
          tmp: false
        })
      }
      var tmpArray = [];
      for (var j = 0; j < $scope.onBoardTemp.length; j++) {
        var tmpData = {
          id: $scope.onBoardTemp[j],
          tmp: true
        }
        if ($scope.isNewValue(onBoardMerged, tmpData)) {
          //check order, in case put it in alphabeticalli
          // if ($scope.order['value'] == 'alpha') {
          //   console.log('put in order')
          //   var child = $scope.getChild(tmpData.id);
          //   tmpArray.push(child);
          // }
          console.log(JSON.stringify(tmpData))
          onBoardMerged.push(tmpData)
        }
      }

      if ($scope.order['value'] == 'alpha' && onBoardMerged.length > 0) {
        onBoardMerged = onBoardMerged.map(function (x) {
          return $scope.getChild(x.id);
        })
        onBoardMerged.sort(function (a, b) {
          if (a.name === b.name) {
            // surname is only important when name are the same
            return b.surname - a.surname;
          }
          return a.name > b.name ? 1 : -1;
        });
        onBoardMerged = onBoardMerged.map(function (x) {
          return { id: x.objectId, tmp: true }
        })
      }
      // here I have to convert in matrix
      for (var k = 0; k < onBoardMerged.length; k += cols) {
        var rowArr = []
        var actualCols = (k + cols)
        if ((actualCols) <= onBoardMerged.length) {
          for (var c = 0; c < cols; c++) {
            rowArr.push(onBoardMerged[k + c])
          }
        } else {
          for (var d = k; d < onBoardMerged.length; d++) {
            rowArr.push(onBoardMerged[d])
          }
        }
        onBoardMatrix.push(rowArr)
      }

      $scope.mergedOnBoard = onBoardMatrix
      $scope.resizePassengersPanel()
      passengersScrollDelegate.resize()
    }

    /*
     * Check lists method: used to check if a value is already present in a list or not
     */
    $scope.isNewValue = function (arr, val) {
      var present = false
      for (var i = 0; i < arr.length; i++) {
        if (Utils.fastCompareObjects(arr[i], val)) {
          present = true
          i = arr.length
        }
      }
      return !present
    }

    $scope.isRoutePanelOpen = false // initial state of the route panel (closed)
    $scope.openRouteView = function () {
      $scope.isRoutePanelOpen = true
    }

    $scope.closeRouteView = function () {
      $scope.isRoutePanelOpen = false
    }
    $scope.selectOrderPopUp = function () {
      // $scope.order = localStorage.getItem('order')?localStorage.getItem('order'):'arrive'
      var orderPopup = $ionicPopup.show({
        template: `<ion-list>
                      <ion-radio ng-model="order.value" ng-value="'arrive'">Arrivo</ion-radio>
                      <ion-radio ng-model="order.value" ng-value="'alpha'">Alfabetico</ion-radio>
                  </ion-list>`,
        cssClass: 'route-popup',
        title: 'ORDINE A BORDO',
        subTitle: 'Seleziona l`ordine di visualizzazione a bordo',
        scope: $scope,
        buttons: [{
          text: 'CHIUDI',
          type: 'button-stable'
        }, {
          text: 'SALVA',
          type: 'button-positive',
          onTap: function (e) {
            $scope.selectOrders()
          }
        }]
      })
      $scope.selectOrders = function () {
        //cambia orderine e salva
        localStorage.setItem('order', $scope.order['value'])
        this.updateMergedOnBoard();
        orderPopup.close()
      }
    }
    $scope.selectHelpersPopup = function () {
      // var calendars = StorageSrv.getVolunteersCalendars()
      // var sortedVolunteers = $filter('orderBy')(StorageSrv.getVolunteers(), ['checked', 'name'])
      // // sort using calendars
      // for (var j = 0; j < calendars.length; j++) {
      //   var cal = calendars[j]
      //   if (cal.schoolId === StorageSrv.getSchoolId() && cal.routeId === $rootScope.route.objectId) {
      //     // helpers
      //     if (!!cal.helperList && cal.helperList.length > 0) {
      //       var counter = 0
      //       cal.helperList.forEach(function (helperId) {
      //         for (var i = 0; i < sortedVolunteers.length; i++) {
      //           if (sortedVolunteers[i].objectId === helperId) {
      //             Utils.moveInArray(sortedVolunteers, i, counter)
      //             // console.log('Helper ' + sortedVolunteers[counter].name + ' moved to position ' + counter);
      //             counter++
      //             i = sortedVolunteers.length
      //           }
      //         }
      //       })
      //     }
      //     j = calendars.length
      //   }
      // }
      // $scope.volunteers = sortedVolunteers
      $scope.volunteers = StorageSrv.getVolunteers();
      $scope.helpers = $filter('orderBy')($scope.helpers, ['checked', 'name'])
      $scope.helpersTemp = $filter('orderBy')($scope.helpersTemp, ['checked', 'name'])
      var hs = $scope.helpers.concat($scope.helpersTemp)

      var oldHelpersIds = []
      $scope.helpers.forEach(function (h) {
        oldHelpersIds.push(h.objectId)
      })

      var volunteersCounter = 0
      hs.forEach(function (h) {
        for (var i = 0; i < $scope.volunteers.length; i++) {
          if ($scope.volunteers[i].objectId === h.objectId) {
            $scope.volunteers[i].checked = true
            if (oldHelpersIds.indexOf($scope.volunteers[i].objectId) !== -1) {
              $scope.volunteers[i].disabled = true
            }
            Utils.moveInArray($scope.volunteers, i, volunteersCounter)
            // console.log('Helper ' + $scope.volunteers[countesendDataPopupr].name + ' moved to position ' + volunteersCounter);
            volunteersCounter++
            i = $scope.volunteers.length
          }
        }
      })
      $scope.openVolunteer = function () {
        var link = checkPrefix();
        cordova.InAppBrowser.open(link, '_system', 'location=yes');
      }
      var checkPrefix = function () {
        var returnLink = '';
        var prefix = 'http://';
        if ($rootScope.volunteerShiftsLink.substr(0, prefix.length) !== prefix && $rootScope.volunteerShiftsLink.substr(0, 'https://'.length) !== 'https://') {
          returnLink = prefix + $rootScope.volunteerShiftsLink;
        }
        else returnLink = $rootScope.volunteerShiftsLink;
        return returnLink;
      }
      var helpersPopup = $ionicPopup.show({
        templateUrl: 'templates/route_popup_helpers.html',
        cssClass: 'route-popup',
        title: 'ACCOMPAGNATORI',
        subTitle: $rootScope.route.name,
        scope: $scope,
        buttons: [{
          text: 'CHIUDI',
          type: 'button-stable'
        }, {
          text: 'SALVA',
          type: 'button-positive',
          onTap: function (e) {
            $scope.selectHelpers($scope.volunteers)
          }
        }]
      })

      $scope.selectHelpers = function (volunteers) {
        $scope.helpersTemp = []
        for (var i = 0; i < volunteers.length; i++) {
          if (volunteers[i].checked && !volunteers[i].disabled) {
            $scope.helpersTemp.push(volunteers[i])
          }
        }
        // $scope.helpers = $scope.helpersTemp; // here I align the helpers
        helpersPopup.close()
      }
    }

    function showHardwarePopup() {
      var hardwarePopup = $ionicPopup.show({
        templateUrl: 'templates/hardwarePopup.html',
        cssClass: 'hwPopup',
        title: 'ATTENZIONE',
        scope: $scope,
        buttons: [{
          text: 'HO CAPITO',
          type: 'button-stable'
        }]
      });
    }
    $scope.checkHardwarePopup = function () {
      var errCb = function (error) {
        console.error("The following error occurred: " + error);
      }
      Utils.isBLESupported(function (supported) {
        //if supported check, else don't care
        if (supported) {
          Utils.isBluetoothEnabled(function (BTenabled) {
            if (BTenabled) {
              $scope.bluetoothEnabled = true;
            } else {
              $scope.bluetoothEnabled = false;
            }
            cordova.plugins.diagnostic.isLocationEnabled(function (LocationEnabled) {
              if (LocationEnabled) {
                $scope.locationEnabled = true;
              } else {
                $scope.locationEnabled = false;
              }
              if (!$scope.bluetoothEnabled || !$scope.locationEnabled) {
                console.log('---- BT enabled: ' + $scope.bluetoothEnabled);
                console.log('---- LOCATION enabled: ' + $scope.locationEnabled);
                showHardwarePopup();
              }
            }, errCb);
          }, errCb);
        }
      }, errCb);
    }
    $scope.checkDataOnServer().then(function (res) {
      if (res)
      //popup data already sent, 
      {
        $scope.alreadySent();
      }
      else {
        $scope.goWithLocalStorage();
      }
    })



    $ionicPlatform.ready(function () {
      if ($scope.checkHardwarePopup) {
        $scope.checkHardwarePopup();
      }
    });
    $scope.populateStops();
  })
