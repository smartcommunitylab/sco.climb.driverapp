/* global FileUploadOptions, FileTransfer */
angular.module('driverapp.services.api', [])
  .factory('APISrv', function ($rootScope, $http, $q, Config, LoginService, Utils, WSNSrv) {
    var ERROR_TYPE = 'errorType'
    var ERROR_MSG = 'errorMsg'

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


    APIService.getVolunteersBySchool = function (ownerId, instituteId, schoolId) {
      var deferred = $q.defer()

      if (!schoolId) {
        deferred.reject('Invalid schoolId')
        return deferred.promise
      }
      LoginService.getValidAACtoken().then(
        function (token) {
          $http({
            method: 'GET',
            url: Config.SERVER_URL + '/volunteer/' + ownerId + '/' + instituteId + '/' + schoolId,
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
    APIService.getVolunteersBySchool = function (ownerId, instituteId, schoolId) {
      var deferred = $q.defer()

      if (!schoolId) {
        deferred.reject('Invalid schoolId')
        return deferred.promise
      }
      LoginService.getValidAACtoken().then(
        function (token) {
          $http({
            method: 'GET',
            url: Config.SERVER_URL + '/volunteer/' + ownerId + '/' + instituteId + '/' + schoolId,
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

    APIService.uploadWsnLogs = function (routeId, ownerId) {
      var deferred = $q.defer()

      if (ionic.Platform.isWebView()) {
        WSNSrv.getLogFiles().then(
          function (logFilesPaths) {
            angular.forEach(logFilesPaths, function (logFilePath) {
              APIService.uploadLog(logFilePath, routeId, ownerId).then(
                function (r) {
                  deferred.resolve(r)
                },
                function (error) {
                  deferred.reject(error)
                }
              )
            })
          },
          function (reason) {
            deferred.reject(reason)
          }
        )
      } else {
        deferred.reject('cordova is not defined')
      }

      return deferred.promise
    }



    APIService.getChildImage = function (childId, ownerId) {
      var deferred = $q.defer()

      if (!childId) {
        deferred.reject('Invalid childId')
        return deferred.promise
      }

      if (ionic.Platform.isWebView()) {
        LoginService.getValidAACtoken().then(
          function (token) {
            var sourceUrl = Config.SERVER_URL + '/image/download/jpg/' + ownerId + '/' + childId
            var targetFile = cordova.file.externalRootDirectory + Config.IMAGES_DIR + childId + '.jpg'

            var ft = new FileTransfer()
            ft.download(
              encodeURI(sourceUrl),
              targetFile,
              function (entry) {
                console.log('download complete: ' + entry.toURL())
                deferred.resolve(entry.toURL())
              },
              function (error) {
                /*
                console.log('download error source ' + error.source)
                console.log('download error target ' + error.target)
                console.log('upload error code' + error.code)
                */
                deferred.reject(error)
              },
              false, {
                headers: {
                  'Authorization': 'Bearer ' + token,
                  'appId': Config.APPID,
                }
              }
            )
          },function (reason) {
            deferred.reject(reason)
          })
      } else {
        deferred.reject()
      }

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
