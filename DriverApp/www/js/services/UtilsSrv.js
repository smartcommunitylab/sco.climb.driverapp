/* global Connection */
angular.module('driverapp.services.utils', [])
  .factory('Utils', function ($rootScope, $filter, $q, $http, $cordovaCamera, LoginService, $timeout, $ionicPopup, $ionicLoading, Config) {
      var Utils = {}
      var mapChildImage = {};
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
      Utils.loadingWithMessage = function (label) {
        $ionicLoading.show({
          template: '<ion-spinner></ion-spinner> <br/> ' + label
        });
      }
      Utils.showErrorAndExit = function () {
        var alertPopup = $ionicPopup.alert({
          title: $filter('translate')('error_exit_title'),
          template: $filter('translate')('error_exit_template')
        });
  
        alertPopup.then(function (res) {
          ionic.Platform.exitApp();
        });
      }

      Utils.setMenuDriverTitle = function (drivername) {
        // driver_names = drivername.split(' ');
        this.drivername = drivername // driver_names[1];
      }

      Utils.getMenuDriverTitle = function () {
        return this.drivername
      }

      Utils.isDST = function () {
        var now = new Date()
        var stdTimezoneOffset = function () {
          var jan = new Date(now.getFullYear(), 0, 1)
          var jul = new Date(now.getFullYear(), 6, 1)
          return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset())
        }
        return now.getTimezoneOffset() < stdTimezoneOffset()
      }

      Utils.isBLESupported = function (cbs, cbe) {
        if (ionic.Platform.isAndroid() && window.cordova) {
          cordova.plugins.diagnostic.hasBluetoothLESupport(cbs, cbe);
        } else if (ionic.Platform.isIOS()) {
          var version = ionic.Platform.version();
          console.log('Platform version: ' + version);
          cbs(version >= 8);
        } else {
          cbs(false);
        }
      }
      Utils.getImageTimestamp = function (ownerId, childId) {
        if (mapChildImage[ownerId + '_' + childId])
          return mapChildImage[ownerId + '_' + childId];
        else return "";
      }
      Utils.setImageTimestamp = function (ownerId, childId) {
        return mapChildImage[ownerId + '_' + childId] = new Date().getTime();;
      }

      Utils.isBluetoothEnabled = function (cbs, cbe, norepeat) {
        cordova.plugins.diagnostic.getBluetoothState(function (state) {
          if (state === cordova.plugins.diagnostic.bluetoothState.POWERED_ON) cbs(true);
          else {
            // wait couple of seconds, initialization is slow
            if (!norepeat) {
              $timeout(function () {
                Utils.isBluetoothEnabled(cbs, cbe, true);
              }, 2000);
            } else {
              cbs(false);
            }
          }
        }, function (error) {
          console.error('Error retrieving BT state', error);
          cbe(error);
        });
      }

      Utils.wsnPluginEnabled = function () {
        return true;
        // return window.DriverAppPlugin && (ionic.Platform.isAndroid() || ionic.Platform.isIOS());
      }

      Utils.chooseAndUploadPhoto = function (ownerId, objectId, photoLibrary, callback) {
        Utils.loading()
        //get the picture from library
        var optionLibrary = (photoLibrary ? navigator.camera.PictureSourceType.PHOTOLIBRARY : navigator.camera.PictureSourceType.CAMERA);
          var options = {
            quality: 90,
            destinationType: navigator.camera.DestinationType.FILE_URI,
            sourceType: optionLibrary,
            allowEdit: false, // here it allow to edit pic.
            targetWidth: 800, //what widht you want after capaturing
            targetHeight: 600
          };

          $cordovaCamera.getPicture(options).then(function (imageData) {
            var imgURI = imageData;
            window.localStorage.setItem('image', (imgURI));
            var optionsCrop = {
              quality: 75,
              widthRatio: 5,
              heightRatio: 5,
              targetWidth: 900,
              targetHeight: 600
            };
            
            //crop the picture in a square size
            plugins.crop.promise(imgURI, optionsCrop)
              .then(function success(newPath) {
                Utils.loaded();
                var getFileBlob = function (url, cb) {
                  var xhr = new XMLHttpRequest();
                  xhr.open("GET", url);
                  xhr.responseType = "blob";
                  xhr.addEventListener('load', function () {
                    cb(xhr.response);
                  });
                  xhr.send();
                };

                var blobToFile = function (blob, name) {
                  blob.lastModifiedDate = new Date();
                  blob.name = name;
                  return blob;
                };

                var getFileObject = function (filePathOrUrl, cb) {
                  getFileBlob(filePathOrUrl, function (blob) {
                    cb(blobToFile(blob, 'test.jpg'));
                  });
                };
                //send the file
                getFileObject(newPath, function (fileObject) {
                  callback(ownerId, objectId, fileObject)
                });

              })
              .catch(function fail(err) {
                Utils.loaded();
              })
          }, function (err) {
            // An error occured. Show a message to the user
            Utils.loaded();
          });
        }
        Utils.storeDataOnLocalStorage = function( ownerId, routeId, data) {
          localStorage.setItem(Config.APPID+ownerId+routeId+moment().startOf('day').format(),JSON.stringify(data));
       
        }
        Utils.checkDataOnLocalStorage = function( ownerId, routeId) {
          if (localStorage.getItem(Config.APPID+ownerId+routeId+moment().startOf('day').format()))
          return true
          return false
        }
        Utils.getDataOnLocalStorage = function( ownerId, routeId) {
          return localStorage.getItem(Config.APPID+ownerId+routeId+moment().startOf('day').format())

       }
        Utils.removeDataOnLocalStorage = function( ownerId, routeId) {
           localStorage.removeItem(Config.APPID+ownerId+routeId+moment().startOf('day').format());

        }
        Utils.popupSent = function() {
          $ionicPopup.show({
            templateUrl: 'templates/data_sent_popup.html',
            cssClass: 'data-sent-popup',
            scope: $rootScope,
            buttons: [{
              text: 'INIZIA',
              type: 'button-positive',
              onTap: function (e) {
                $rootScope.exitApp(true);
              }
            }]
          })
        }
        Utils.popupNotSent = function() {
          $ionicPopup.show({
            templateUrl: 'templates/data_not_sent_popup.html',
            scope: $rootScope,
            buttons: [{
              text: 'OK',
              type: 'button-positive',
              onTap: function (e) {
                $rootScope.exitApp(true);
              }
            }]
          })
        }
        Utils.checkDataOnServer = function(ownerId,routeId) {
          var deferred = $q.defer()
          LoginService.getValidAACtoken().then(
            function (token) {
              $http({
                method: 'GET',
                url: Config.SERVER_URL + '/event/' + ownerId +'/'+routeId+'?dateFrom='+moment().startOf('day').format()+
                '&dateTo='+moment().endOf('day').format(),
                headers: {
                  'Authorization': 'Bearer ' + token,
                  'appId': Config.APPID,
                },
                timeout: Config.getHttpConfig().timeout
              }) .success(
                function (response) {
                  if (response && response.length >0 )
                  deferred.resolve(true)
                  else deferred.resolve(false)
                }).error(
                  function (reason) {
                    deferred.reject(reason)
                  })
              },function (reason) {
                deferred.reject(false)
                  })
            return deferred.promise
                }
          
                Utils.alreadySent = function(exitFunction,goOn,ownerId, routeId,deferred){
                  $ionicPopup.confirm({
                    title: $filter('translate')("data_already_sent"),
                    template: $filter('translate')("data_already_sent_body"),
                    buttons: [{
                      text: $filter('translate')("btn_no"),
                      type: 'button-stable',
                      onTap: function () {
                        //exit app
                        exitFunction(true);
                      }
                    },
                    {
                      text: $filter('translate')("btn_yes"),
                      type: 'button-positive',
                      onTap: function () {
                        //check localstorage
                        goOn(ownerId, routeId,deferred);
                      }
                    }
                    ]
                  });
                }
          // https://climbdev.smartcommunitylab.it/v3/api/event/{ownerId}/{routeId}?dateFrom=2021-01-19T00:00:00&dateTo=2021-01-19T23:59:59&eventType[]=402
          // moment
        
        return Utils
      })
