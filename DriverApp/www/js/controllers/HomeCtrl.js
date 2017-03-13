angular.module('driverapp.controllers.home', [])
  .controller('AppCtrl', function ($scope, $rootScope, $state, $ionicPlatform, $ionicSlideBoxDelegate, $q, $ionicPopup, $ionicModal, Config, StorageSrv, APISrv, WSNSrv, Utils, GeoSrv) {
    $rootScope.pedibusEnabled = true

    /*
     * FIXME dev purpose only!
     */
    StorageSrv.reset()

    /*
     * LOGIN
     */
    $scope.login = {
      identities: [],
      identity: null,
      identityIndex: null,
      identityPwd: ''
    }

    if (StorageSrv.getIdentityIndex() != null) {
      Config.setIdentity(StorageSrv.getIdentityIndex())
    }
    $ionicModal.fromTemplateUrl('templates/wizard_modal_login.html', {
      scope: $scope,
      animation: 'slide-in-up',
      backdropClickToClose: false,
      hardwareBackButtonClose: false
    }).then(function (modal) {
      $rootScope.modalLogin = modal

      // FIXME dev purpose only!
      // StorageSrv.saveIdentityIndex(0);

      if (StorageSrv.getIdentityIndex() == null) {
        $rootScope.modalLogin.show()
      } else {
        Config.setIdentity(StorageSrv.getIdentityIndex())
      }
    })

    $scope.selectIdentityPopup = function () {
      $scope.login.identities = Config.IDENTITIES

      var identityPopup = $ionicPopup.show({
        templateUrl: 'templates/wizard_popup_identity.html',
        title: 'Seleziona identità',
        scope: $scope,
        buttons: [{
          text: 'Annulla',
          type: 'button-stable'
        }]
      })

      $scope.selectIdentity = function (index) {
        $scope.login.identityIndex = index
        $scope.login.identity = $scope.login.identities[index]
        identityPopup.close()
      }
    }

    $scope.checkIdentityPwd = function () {
      if (!!$scope.login.identity && $scope.login.identityPwd === $scope.login.identity.PWD) {
        console.log('+++ Right password +++')
        StorageSrv.saveIdentityIndex($scope.login.identityIndex)
        Config.setIdentity($scope.login.identityIndex)
        $rootScope.modalLogin.hide()

        $state.go($state.current, {}, {
          reload: true
        })
      } else {
        console.log('--- Wrong password ---')
        Utils.toast('La password non è corretta!')
      }
    }

    $rootScope.loadAllBySchool = function (schoolId) {
      var deferred = $q.defer()

      APISrv.getRoutesBySchool(schoolId, moment().format(Config.DATE_FORMAT)).then(
        function (routes) {
          StorageSrv.saveRoutes(routes).then(function (routes) {
            APISrv.getVolunteersBySchool(schoolId).then(
              function (volunteers) {
                StorageSrv.saveVolunteers(volunteers).then(function (volunteers) {
                  var dateFrom = moment().format(Config.DATE_FORMAT)
                  var dateTo = moment().format(Config.DATE_FORMAT)
                    // FIXME remove hardcoded dates!
                    // dateFrom = '2016-03-22';
                    // dateTo = '2016-03-22';
                  APISrv.getVolunteersCalendarsBySchool(schoolId, dateFrom, dateTo).then(
                    function (cals) {
                      StorageSrv.saveVolunteersCalendars(cals).then(function (calendars) {
                        APISrv.getChildrenBySchool(schoolId).then(
                          function (children) {
                            StorageSrv.saveChildren(children).then(
                                function (children) {
                                  WSNSrv.updateNodeList(children, 'child')
                                  deferred.resolve()

                                  /* if (Utils.isConnectionFastEnough()) {
                                      // download children images
                                      var counter = 0;
                                      var downloaded = 0;
                                      angular.forEach(children, function (child) {
                                          APISrv.getChildImage(child.objectId).then(
                                              function () {
                                                  downloaded++;
                                                  counter++;
                                                  console.log('Downloaded images: ' + downloaded + ' (Total: ' + counter + '/' + children.length + ')');
                                                  if (counter == children.length) {
                                                      deferred.resolve();
                                                  }
                                              },
                                              function () {
                                                  counter++;
                                                  if (counter == children.length) {
                                                      deferred.resolve();
                                                  }
                                              }
                                          );
                                      });
                                  } else {
                                      deferred.resolve();
                                  } */
                                }
                              )
                              // deferred.resolve();
                          },
                          function (error) {
                            // TODO handle error
                            console.log(error)
                            deferred.reject(error)
                          }
                        )
                      })
                    },
                    function (error) {
                      // TODO handle error
                      console.log(error)
                      deferred.reject(error)
                    }
                  )
                })
              },
              function (error) {
                // StorageSrv.saveSchool(CONF.DEV_SCHOOL)
                // TODO handle error
                console.log(error)
                deferred.reject(error)
              }
            )
          })
        },
        function (error) {
          // TODO handle error
          console.log(error)
          deferred.reject(error)
        }
      )

      return deferred.promise
    }

    // FIXME load schools
    // StorageSrv.saveSchool(CONF.DEV_SCHOOL);

    $scope.getDriverName = function () {
      $scope.driverName = Utils.getMenuDriverTitle()
      return $scope.driverName
    }

    $ionicModal.fromTemplateUrl('templates/app_modal_volunteers.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modalVolunteers = modal
    })

    $ionicModal.fromTemplateUrl('templates/app_modal_maintenance.html', {
      scope: $scope,
      animation: 'slide-in-up',
      backdropClickToClose: false,
      hardwareBackButtonClose: false
    }).then(function (modal) {
      $scope.modalMaintenance = modal
    })

    $rootScope.batteryAlarm = false
    $scope.changeBattery = function () {
      $scope.modalBatteries.hide();
      $scope.modalMaintenance.show();
    }
    $scope.openBatteryMonitor = function () {
      $ionicModal.fromTemplateUrl('templates/app_modal_batteries.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.modalBatteries = modal
        $scope.modalBatteries.show()
      })
    }

    $scope.startMaintenanceMode = function () {
      var date = new Date()
      date.setSeconds(0)
      date.setMinutes(0)
      date.setHours(Utils.isDST() ? 6 : 7) // just to handle DST
      if (date.getTime() < new Date().getTime()) {
        date.setDate(date.getDate() + 1)
      }

      // TODO
      // $scope.modalMaintenance.show()

      WSNSrv.enableMaintenanceProcedure(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 0).then(
        function () {
          $scope.modalMaintenance.show()
        },
        function (error) {
          Utils.toast('Non è possibile avviare la procedura di manutenzione')
          console.log(error)
        }
      )
    }

    $scope.stopMaintenanceMode = function () {
      // TODO
      // $scope.modalMaintenance.hide()

      WSNSrv.disableMaintenanceProcedure().then(
        function () {
          $scope.modalMaintenance.hide();
          $rootScope.showTutorial = false;
        },
        function (error) {
          Utils.toast('Non è possibile fermare la procedura di manutenzione')
          console.log(error)
        }
      )
    }


  })

.controller('HomeCtrl', function ($scope, Utils, StorageSrv, APISrv) {
  StorageSrv.reset()

  $scope.schools = null
  $scope.school = null

  APISrv.getSchools().then(
    function (schools) {
      $scope.schools = schools
    },
    function (error) {
      console.log(error)
    }
  )

  $scope.chooseSchool = function (school) {
    // retrieve volunteers
  }
})

.controller('MaintenanceCtrl', function ($scope, $rootScope, $ionicSlideBoxDelegate) {
  $rootScope.showTutorial = false;
  $scope.pager = {
    total: 5,
    current: 0
  }

  $scope.getCount = function (num) {
    return new Array(num);
  };
  $scope.tutorialSlides = [
    {
      image: 'img/1.png',
      text: 'Segui la procedura per cambíare in modo corretto la batteria del gadget.'
    }, {
      image: 'img/2.png',
      text: 'Apri il gadget servendoti di un cacciavite.'
    }, {
      image: 'img/3.png',
      text: 'Togli la scheda e il cuscinetto di protezione dalla busta trasparente.'
    }, {
      image: 'img/4.png',
      text: 'Estrai la batteria dalla scheda e sostituiscila con la nuova, controlla che i segni \'+\' delle batteria e dell\'alloggiamento batteria combacino.'
    }, {
      image: 'img/5.png',
      text: 'Quando il led rosso smette di lampeggiare il nodo è pronto (potrebbe lampeggiare solo una volta). Riassembla i componenti, reinserendoli nella busta trasparente e di seguito nel gadget.'
    }
  ]
  $scope.currentText = $scope.tutorialSlides[0].text;

  function changeCurrentText(index) {
    $scope.currentText = $scope.tutorialSlides[index].text;
  }
  $scope.visualizeTutorial = function () {
    $rootScope.showTutorial = true;
    $scope.startTutorial = true;

  }
  $scope.getCurrentText = function () {
    return $scope.tutorialSlide[$ionicSlideBoxDelegate.currentIndex()];
  }
  $scope.nextSlide = function () {
    if ($ionicSlideBoxDelegate.currentIndex() == $ionicSlideBoxDelegate.slidesCount() - 2) {
      //end reached
      $scope.endTutorial = true;
    }
    $ionicSlideBoxDelegate.next();
    $scope.startTutorial = false;
    changeCurrentText($ionicSlideBoxDelegate.currentIndex());
    $scope.pager.current = $ionicSlideBoxDelegate.currentIndex();

  }
  $scope.prevSlide = function () {
    $ionicSlideBoxDelegate.previous();
    $scope.endTutorial = false;
    if ($ionicSlideBoxDelegate.currentIndex() == 0) {
      //start reached
      $scope.startTutorial = true;
    }
    changeCurrentText($ionicSlideBoxDelegate.currentIndex());
    $scope.pager.current = $ionicSlideBoxDelegate.currentIndex();
  }
  $scope.startSlide = function () {
    $ionicSlideBoxDelegate.slide(0);
    changeCurrentText(0);
    $scope.pager.current = 0;
    $scope.startTutorial = true;
    $scope.endTutorial = false;
  }

  $scope.slideHasChanged = function ($index) {
    if ($index == $ionicSlideBoxDelegate.slidesCount() - 1) {
      //end reached
      $scope.endTutorial = true;
    } else {
      $scope.endTutorial = false;
    }
    if ($index == 0) {
      //start reached
      $scope.startTutorial = true;
    } else {
      $scope.startTutorial = false;
    }
    $scope.pager.current = $ionicSlideBoxDelegate.currentIndex();
    changeCurrentText($ionicSlideBoxDelegate.currentIndex());
  };



})
