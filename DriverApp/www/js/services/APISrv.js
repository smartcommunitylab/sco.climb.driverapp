/* global FileUploadOptions, FileTransfer */
angular.module('driverapp.services.api', [])
  .factory('APISrv', function ($rootScope, $http, $q, Config, LoginService, Utils, WSNSrv,$cordovaFile) {
    var ERROR_TYPE = 'errorType'
    var ERROR_MSG = 'errorMsg'
   var OLDER_THAN_DAYS = 30;
    var APIService = {}

    APIService.getProfile = function () {
      var deferred = $q.defer()
      LoginService.getValidAACtoken().then(
        function (token) {
          $http({
            method: 'GET',
            url: Config.SERVER_URL + '/profile',
            headers: {
              'Authorization': 'Bearer ' + token,
              'appId': Config.APPID,
            },
            timeout: Config.getHttpConfig().timeout
          })
            // $http.get(Config.SERVER_URL + '/profile', Config.getHttpConfig()).then(
            .success(
            function (response) {
              if (!response) response = {};
              if (!response.ownerIds) {
                response.ownerIds = [];
                if (response.roles) {
                  for (var key in response.roles) {
                    var r = response.roles[key];
                    if (response.ownerIds.indexOf(r[0].ownerId) < 0) {
                      response.ownerIds.push(r[0].ownerId);
                    }  
                  }
                }
                if (response.ownerIds.length == 0) deferred.reject('INSUFFICIENT_RIGHTS');
                else deferred.resolve(response)
              } else {
                deferred.resolve(response)
              }
            }).error(
            function (reason) {
              deferred.reject(reason)
            })
        },function (reason) {
              deferred.reject(reason)
            })
      return deferred.promise
    }
    APIService.setProfileImage = function (ownerId,objectId,file) {
      var deferred = $q.defer();
      var fd = new FormData();
      //Take the first selected file
      fd.append("data", file);
      LoginService.getValidAACtoken().then(
        function (token) {
          $http.post( Config.SERVER_URL + '/child/image/upload/'+ownerId+'/'+objectId, fd, {
            withCredentials: true,
            headers: {
              'Content-Type': undefined,
              'Authorization': 'Bearer ' + token,
              'appId': Config.APPID,
            },
            transformRequest: angular.identity
          }).success(function () {
            Utils.setImageTimestamp(ownerId,objectId);
            deferred.resolve();
          }).error(function (error) {
            deferred.reject(error);
          })
        });
      return deferred.promise;
    }

    APIService.uploadFileImage = function (ownerId,objectId,files) {
      Config.loading();
      APIService.setProfileImage(ownerId,objectId,files).then(function () {
        localStorage.setItem(Config.APPID + '_timestampImg', new Date().getTime());
        //update image
        //changeProfileImage();
      }, function (error) {
        if (error == 413)
          console.log("Payload too large");
        return;
        if (error == 415)
          console.log("Unsupported media type");
        return;
        console.log("network error");
      }).finally(Config.loaded)
    };

    APIService.getInstituteByOwnerId = function (ownerId) {
      var deferred = $q.defer()
      LoginService.getValidAACtoken().then(
        function (token) {
          $http({
            method: 'GET',
            url: Config.SERVER_URL + '/institute/' + ownerId,
            headers: {
              'Authorization': 'Bearer ' + token,
              'appId': Config.APPID,
            },
            timeout: Config.getHttpConfig().timeout
          })
            // $http.get(Config.SERVER_URL + '/profile', Config.getHttpConfig()).then(
            .success(
            function (response) {
              deferred.resolve(response)
            }).error(
            function (reason) {
              deferred.reject(reason)
            })
        },function (reason) {
          deferred.reject(reason)
        })
      return deferred.promise
    }


    APIService.getSchooldById = function (ownerId, instituteId) {
      var deferred = $q.defer()
      LoginService.getValidAACtoken().then(
        function (token) {
          $http({
            method: 'GET',
            url: Config.SERVER_URL + '/school/' + ownerId + '/' + instituteId,
            headers: {
              'Authorization': 'Bearer ' + token,
              'appId': Config.APPID,
            },
            timeout: Config.getHttpConfig().timeout
          })
            // $http.get(Config.SERVER_URL + '/profile', Config.getHttpConfig()).then(
            .success(
            function (response) {
              deferred.resolve(response)
            }).error(
            function (reason) {
              deferred.reject(reason)
            })
        },function (reason) {
          deferred.reject(reason)
        })
      return deferred.promise
    }



    APIService.getRoute = function (ownerId, instituteId, schoolId) {
      var deferred = $q.defer()
      LoginService.getValidAACtoken().then(
        function (token) {
          $http({
            method: 'GET',
            url: Config.SERVER_URL + '/route/' + ownerId + '/' + instituteId + '/' + schoolId,
            headers: {
              'Authorization': 'Bearer ' + token,
              'appId': Config.APPID,
            },
            timeout: Config.getHttpConfig().timeout
          })
            .success(
            function (response) {
              deferred.resolve(response)
            }).error(
            function (reason) {
              deferred.reject(reason)
            })
        },function (reason) {
              deferred.reject(reason)
            })
      return deferred.promise
    }
    APIService.getAnchors = function () {
      var deferred = $q.defer()

      $http.get(Config.SERVER_URL + '/anchor/' + Config.IDENTITY.OWNER_ID, Config.getHttpConfig()).then(
        function (response) {
          deferred.resolve(response.data)
        },
        function (reason) {
          deferred.reject('[' + reason.headers(ERROR_TYPE) + '] ' + reason.headers(ERROR_MSG))
        }
      )

      return deferred.promise
    }


    // APIService.getVolunteersBySchool = function (ownerId, instituteId, schoolId) {
    //   var deferred = $q.defer()

    //   if (!schoolId) {
    //     deferred.reject('Invalid schoolId')
    //     return deferred.promise
    //   }
    //   LoginService.getValidAACtoken().then(
    //     function (token) {
    //       $http({
    //         method: 'GET',
    //         url: Config.SERVER_URL + '/volunteer/' + ownerId + '/' + instituteId + '/' + schoolId,
    //         headers: {
    //           'Authorization': 'Bearer ' + token,
    //           'appId': Config.APPID,
    //         },
    //         timeout: Config.getHttpConfig().timeout
    //       })
    //         .success(
    //         function (response) {
    //           deferred.resolve(response)
    //         }).error(
    //         function (reason) {
    //           deferred.reject(reason)
    //         })
    //     },function (reason) {
    //       deferred.reject(reason)
    //     })


    //   return deferred.promise
    // }
    
    APIService.getVolunteersBySchool = function (ownerId, instituteId, schoolId, routeId) {
      var deferred = $q.defer()

      if (!schoolId) {
        deferred.reject('Invalid schoolId')
        return deferred.promise
      }
      LoginService.getValidAACtoken().then(
        function (token) {
          $http({
            method: 'GET',
            url: Config.SERVER_URL + '/volunteer/' + ownerId + '/' + instituteId + '/' + schoolId+(routeId?'?routeId='+routeId:''),
            headers: {
              'Authorization': 'Bearer ' + token,
              'appId': Config.APPID,
            },
            timeout: Config.getHttpConfig().timeout
          })
            .success(
            function (response) {
              deferred.resolve(response)
            }).error(
            function (reason) {
              deferred.reject(reason)
            })
        },function (reason) {
          deferred.reject(reason)
        })


      return deferred.promise
    }
    


    APIService.getChildrenBySchool = function (ownerId, instituteId, schoolId) {
      var deferred = $q.defer()


      if (!schoolId) {
        deferred.reject('Invalid schoolId')
        return deferred.promise
      }
      LoginService.getValidAACtoken().then(
        function (token) {

          $http({
            method: 'GET',
            url: Config.SERVER_URL + '/child/' + ownerId + '/' + instituteId + '/' + schoolId,
            headers: {
              'Authorization': 'Bearer ' + token,
              'appId': Config.APPID,
            },
            timeout: Config.getHttpConfig().timeout
          })
            .success(
            function (response) {
              deferred.resolve(response)
            }).error(
            function (reason) {
              deferred.reject(reason)
            })
        },function (reason) {
          deferred.reject(reason)
        })
      return deferred.promise

    }
    APIService.getStopsByRoute = function (ownerId, routeId) {
      var deferred = $q.defer()


      if (!routeId) {
        deferred.reject('Invalid routeId')
        return deferred.promise
      }
      LoginService.getValidAACtoken().then(
        function (token) {

          $http({
            method: 'GET',
            url: Config.SERVER_URL + '/stop/' + ownerId + '/' + routeId,
            headers: {
              'Authorization': 'Bearer ' + token,
              'appId': Config.APPID,
            },
            timeout: Config.getHttpConfig().timeout
          })
            .success(
            function (response) {
              deferred.resolve(response)
            }).error(
            function (reason) {
              deferred.reject(reason)
            })
        },function (reason) {
          deferred.reject(reason)
        })
      return deferred.promise

    }



    APIService.addEvents = function (events, ownerId, routeId) {
      var deferred = $q.defer()

      if (!events || events.length === 0) {
        deferred.reject('Invalid events')
      }
      LoginService.getValidAACtoken().then(
        function (token) {

          $http({
            method: 'POST',
            url: Config.SERVER_URL + '/event/' + ownerId + '/' + routeId,
            headers: {
              'Authorization': 'Bearer ' + token,
              'appId': Config.APPID,
            },
            data: events,
            timeout: Config.getHttpConfig().timeout
          })
            .success(
            function (response) {
              deferred.resolve(response)
            }).error(
            function (reason) {
              deferred.reject(reason)
            })
        },function (reason) {
          deferred.reject(reason)
        })
      return deferred.promise
    }

    APIService.uploadLog = function (fileURL, routeId, ownerId) {
      var deferred = $q.defer()

      if (ionic.Platform.isWebView()) {
        if (!fileURL || fileURL.length === 0) {
          deferred.reject('Invalid fileURL')
        }
        LoginService.getValidAACtoken().then(
          function (token) {
            // fileURL = cordova.file.externalRootDirectory + fileURL;
            fileURL = 'file://' + fileURL

            var options = new FileUploadOptions()
            options.fileKey = 'file'
            options.fileName = fileURL.substr(fileURL.lastIndexOf('/') + 1)
            if (routeId) {
              options.fileName = routeId + '_' + options.fileName
            }

            options.mimeType = 'text/plain'
            options.headers = {
              'Authorization': 'Bearer ' + token,
              'appId': Config.APPID,
            }
            options.params = {
              name: options.fileName
            }

            var serverURL = Config.SERVER_URL + '/event/log/upload/' + ownerId + '/' + routeId

            var ft = new FileTransfer()
            ft.upload(
              fileURL,
              encodeURI(serverURL),
              function (r) {
                deferred.resolve(r.response)
              },
              function (error) {
                deferred.reject(error)
              },
              options
            )
          },function (reason) {
            deferred.reject(reason)
          })
      } else {
        deferred.reject('cordova is not defined')
      }

      return deferred.promise
    }

    function deleteFileAndroid(longName){
      longName = 'file://'+longName;
      var ext = new String(cordova.file.externalRootDirectory);
      var index = ext.length;
      var filename = longName.substr(index,longName.length);
      var directory = longName.substr(0,index);

      console.log('filename'+filename);
      console.log('directory'+directory);
      $cordovaFile.removeFile(cordova.file.externalRootDirectory, filename)
      .then(function (success) {
        // success
        console.log('ok');
      }, function (error) {
        // error
        console.log('err');
      });
    }

    function listAndRemoveDirAndroid(path){ 

    window.resolveLocalFileSystemURL(path,
      function (fileSystem) {
        var entries = [];
        var dirReader = fileSystem.createReader();
        function toArray(list) {
          return Array.prototype.slice.call(list || [], 0);
        }
        
        function listResults(entries) {
          var fragment = document.createDocumentFragment();
        
          entries.forEach(function(entry, i) {
            console.log(entry.name);
            entry.getMetadata(function(metadata){
              console.log("Last Modified: " + metadata.modificationTime);
              //check if it is one month old
               if (moment(metadata.modificationTime).isAfter(moment().subtract(OLDER_THAN_DAYS,'days').startOf('day')))
              {
                //it is newer 
              }
              else {
                //it is older  
                entry.removeRecursively(function() {
                  console.log('Directory removed.');
                }, function(err){
                  console.log(err);
                });
              }
            },function(err){
              console.log(err);
            })
          });
        
        }

          // Call the reader.readEntries() until no more results are returned.
  var readEntries = function() {
    dirReader.readEntries (function(results) {
     if (!results.length) {
       listResults(entries.sort());
     } else {
       entries = entries.concat(toArray(results));
       readEntries();
     }
   }, function(err){
     console.log(err);
   });
 };

 readEntries(); // Start reading dirs.
      });
    }
   
    function deleteFileiOS(longName){
      longName = longName;
      var ext = new String(cordova.file.documentsDirectory);
      var index = ext.length;
      var filename = longName.substr(index+1,longName.length);
      var directory = longName.substr(0,index);

      console.log('filename'+filename);
      console.log('directory'+directory);
      $cordovaFile.removeFile(cordova.file.documentsDirectory, filename)
      .then(function (success) {
        // success
        console.log('ok');
        $cordovaFile.checkFile(cordova.file.documentsDirectory, filename)
        .then(function (success) {
          // success
          console.log("kml file found");
        }, function (error) {
           // error
           console.log("kml file NOT found");
        });

      }, function (error) {
        // error
        console.log('err');
      });
    }
    function listAndRemoveDiriOS(path){ 

      window.resolveLocalFileSystemURL(path,
        function (fileSystem) {
          var entries = [];
          var dirReader = fileSystem.createReader();
          function toArray(list) {
            return Array.prototype.slice.call(list || [], 0);
          }
          
          function listResults(entries) {
            var fragment = document.createDocumentFragment();
          
            entries.forEach(function(entry, i) {
              console.log(entry.name);
              if (entry.name.endsWith('log')){
              entry.getMetadata(function(metadata){
                console.log("Last Modified: " + metadata.modificationTime);
                //check if it is one month old
                 if (moment(metadata.modificationTime).isAfter(moment().subtract(OLDER_THAN_DAYS,'days').startOf('day')))
                {
                  //it is newer 
                }
                else {
                  //it is older  
                  entry.remove(function() {
                    console.log('Directory removed.');
                  }, function(err){
                    console.log(err);
                  });
                }
              },function(err){
                console.log(err);
              })
            }
            });
          
          }
  
            // Call the reader.readEntries() until no more results are returned.
    var readEntries = function() {
      dirReader.readEntries (function(results) {
       if (!results.length) {
         listResults(entries.sort());
       } else {
         entries = entries.concat(toArray(results));
         readEntries();
       }
     }, function(err){
       console.log(err);
     });
   };
  
   readEntries(); // Start reading dirs.
        });
      }

    function deleteOldFilesAndroid(){
      listAndRemoveDirAndroid(cordova.file.externalRootDirectory+'CLIMB_log_data/')
    }
    function deleteOldFilesiOS(){
      listAndRemoveDiriOS(cordova.file.documentsDirectory)

    }
    function deleteFiles(logFilePath) {
      if (ionic.Platform.isAndroid()) {
        deleteFileAndroid(logFilePath);
        deleteOldFilesAndroid();
        }
        if (ionic.Platform.isIOS()) {
          deleteFileiOS(logFilePath);
          deleteOldFilesiOS();
          }
    }
    APIService.uploadWsnLogs = function (routeId, ownerId) {
      var deferred = $q.defer()
      if (ionic.Platform.isWebView()) {
        WSNSrv.getLogFiles().then(
          function (logFilesPaths) {
            angular.forEach(logFilesPaths, function (logFilePath) {
              APIService.uploadLog(logFilePath, routeId, ownerId).then(
                function (r) {
                  deleteFiles(logFilePath);
                  deferred.resolve(r)

                },
                function (error) {
                  deferred.resolve(error)
                }
              )
            })
          },
          function (reason) {
            deferred.resolve(reason)
          }
        )
      } else {
        deferred.reject('cordova is not defined')
      }

      return deferred.promise
    }



    APIService.getChildImage = function (childId, ownerId) {
      var deferred = $q.defer()
      deferred.resolve();
      // if (!childId) {
      //   deferred.reject('Invalid childId')
      //   return deferred.promise
      // }

      // if (ionic.Platform.isWebView()) {
      //   LoginService.getValidAACtoken().then(
      //     function (token) {
      //       var sourceUrl = Config.SERVER_URL + '/image/download/jpg/' + ownerId + '/' + childId
      //       var targetFile = cordova.file.externalRootDirectory + Config.IMAGES_DIR + childId + '.jpg'

      //       var ft = new FileTransfer()
      //       ft.download(
      //         encodeURI(sourceUrl),
      //         targetFile,
      //         function (entry) {
      //           console.log('download complete: ' + entry.toURL())
      //           deferred.resolve(entry.toURL())
      //         },
      //         function (error) {
      //           /*
      //           console.log('download error source ' + error.source)
      //           console.log('download error target ' + error.target)
      //           console.log('upload error code' + error.code)
      //           */
      //           deferred.reject(error)
      //         },
      //         false, {
      //           headers: {
      //             'Authorization': 'Bearer ' + token,
      //             'appId': Config.APPID,
      //           }
      //         }
      //       )
      //     },function (reason) {
      //       deferred.reject(reason)
      //     })
      // } else {
      //   deferred.reject()
      // }

      return deferred.promise
    }

/*not used*/ 

    APIService.getChildrenBySchoolAndClass = function (schoolId, classRoom) {
      var deferred = $q.defer()

      if (!schoolId) {
        deferred.reject('Invalid schoolId')
        return deferred.promise
      } else if (!classRoom) {
        deferred.reject('Invalid classRoom')
        return deferred.promise
      }

      var httpConfigWithParams = angular.copy(Config.getHttpConfig())
      httpConfigWithParams.params = {
        'classRoom': classRoom
      }

      $http.get(Config.SERVER_URL + '/child/' + Config.IDENTITY.OWNER_ID + '/' + schoolId + '/classroom', httpConfigWithParams).then(
        function (response) {
          deferred.resolve(response.data)
        },
        function (reason) {
          deferred.reject('[' + reason.headers(ERROR_TYPE) + '] ' + reason.headers(ERROR_MSG))
        }
      )

      return deferred.promise
    }

   

/*not used*/ 

    APIService.getVolunteersCalendarsBySchoolAndVolunteer = function (schoolId, volunteerId, dateFrom, dateTo) {
      var deferred = $q.defer()

      if (!schoolId) {
        deferred.reject('Invalid schoolId')
        return deferred.promise
      } else if (!volunteerId) {
        deferred.reject('Invalid volunteerId')
        return deferred.promise
      } else if (!Utils.isValidDateRange(dateFrom, dateTo)) {
        deferred.reject('Invalid date range')
        return deferred.promise
      }

      var httpConfigWithParams = angular.copy(Config.getHttpConfig())
      httpConfigWithParams.params = {
        'dateFrom': dateFrom,
        'dateTo': dateTo
      }

      $http.get(Config.SERVER_URL + '/volunteercal/' + Config.IDENTITY.OWNER_ID + '/' + schoolId + '/' + volunteerId, httpConfigWithParams).then(
        function (response) {
          deferred.resolve(response.data)
        },
        function (reason) {
          deferred.reject('[' + reason.headers(ERROR_TYPE) + '] ' + reason.headers(ERROR_MSG))
        }
      )

      return deferred.promise
    }


    return APIService
  })
