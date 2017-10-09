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
      var date = new Date()
      date.setSeconds(0)
      date.setMinutes(0)
      date.setHours(Utils.isDST() ? 7 : 6) // just to handle DST
      if (date.getTime() < new Date().getTime()) {
        date.setDate(date.getDate() + 1)
      }
      $scope.modalBatteries.hide();
          $scope.modalMaintenance.show();
      // WSNSrv.enableMaintenanceProcedure(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 0).then(
      //   function () {
      //     $scope.modalBatteries.hide();
      //     $scope.modalMaintenance.show();
      //   },
      //   function (error) {
      //     Utils.toast('Non è possibile avviare la procedura di manutenzione')
      //     console.log(error)
      //   }
      // )

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
      date.setHours(Utils.isDST() ? 7 : 6) // just to handle DST
      if (date.getTime() < new Date().getTime()) {
        date.setDate(date.getDate() + 1)
      }

      // TODO
      $scope.modalMaintenance.show()

      // WSNSrv.enableMaintenanceProcedure(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 0).then(
      //   function () {
      //     $scope.modalMaintenance.show()
      //   },
      //   function (error) {
      //     Utils.toast('Non è possibile avviare la procedura di manutenzione')
      //     console.log(error)
      //   }
      // )
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

  .controller('HomeCtrl', function ($ionicPlatform, $scope, $ionicLoading, $q, $rootScope, $state, $window, $ionicPopup, $ionicModal, $ionicHistory, $ionicSlideBoxDelegate, $timeout, $filter, Utils, StorageSrv, Config, APISrv, WSNSrv) {
    StorageSrv.reset()

    $scope.schools = null
    $scope.school = null

    $scope.swiperOptions = Config.WIZARD_SLIDER_OPTIONS;
    $ionicPlatform.ready(function () {
      if ($scope.checkHardwarePopup) {
        $scope.checkHardwarePopup();
      }
      
    });

    var INDEXES = {
      'schools': 0,
      'volunteers': 1,
      'helpers': 2
    };

    $scope.schools = [];
    $scope.routes = [];
    $scope.volunteers = null;

    var calendars = [];

    $scope.wizard = {
      school: null,
      driver: null,
      route: null,
      helpers: []
    };

    $scope.resizeHelpersList = function () {
      $scope.helpersListStyle = {};
      /* 44 header, 60 helptext, 44 footer */
      var logoHeight = angular.element(document.querySelector('.dapp-logo'))[0].offsetHeight;
      var helpTextHeight = angular.element(document.querySelector('#helptext-helpers'))[0].offsetHeight;
      var height = $window.innerHeight - (44 + logoHeight + helpTextHeight + 44);
      $scope.helpersListStyle['height'] = height + 'px';
    };




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
            }, function (error) {
              console.error("The following error occurred: " + error);
            });
          }, function (error) {
            console.error("The following error occurred: " + error);
          });
        }
      }, function (error) {
        console.error("The following error occurred: " + error);
      });
    }

    loadingWithMessage = function (label) {
      $ionicLoading.show({
        template: '<ion-spinner></ion-spinner> <br/> ' + label
      });
    }
    hideLoading = function () {
      $ionicLoading.hide();
    }

    $scope.showErrorAndExit = function () {
      var alertPopup = $ionicPopup.alert({
        title: $filter('translate')('error_exit_title'),
        template: $filter('translate')('error_exit_template')
      });

      alertPopup.then(function (res) {
        ionic.Platform.exitApp();
      });
    }
    goWithChildren = function () {
      loadingWithMessage($filter('translate')('home_get_children'));
      APISrv.getChildrenBySchool($scope.ownerId, $scope.institute.objectId, $scope.school.objectId).then(
        function (children) {
          hideLoading();
          StorageSrv.saveChildren(children).then(
            function (children) {
              WSNSrv.updateNodeList(children, 'child')
              //deferred.resolve()

              // $scope.routes = StorageSrv.getRoutes();
              // if ($scope.routes != null && $scope.routes.length == 1) {
              //   $scope.wizard.route = $scope.routes[0];
              // }
              // $scope.volunteers = StorageSrv.getVolunteers();
              // calendars = StorageSrv.getVolunteersCalendars();
              $ionicSlideBoxDelegate.update();
              Utils.loaded();
              // Utils.setMenuDriverTitle($scope.wizard.driver.name);

              $ionicHistory.nextViewOptions({
                historyRoot: true
              });
              $scope.deregisterBackButton();
              $state.go('app.route', {
                ownerId: $scope.ownerId,
                routeId: $scope.route.objectId,
                fromWizard: true,
                driver: $scope.driver,
                route: $scope.route,
                helpers: $scope.helpers
              }, {
                  reload: true
                });
            }, function (err) {
              $scope.showErrorAndExit();
            })
        }, function (err) {
          hideLoading();
          $scope.showErrorAndExit();

        }
      )
    }
    selectedHelpers = function () {
      if (!$scope.driver.wsnId) {
        $scope.driver.wsnId = CONF.DEV_MASTER;
      }
      $rootScope.driver = $scope.driver;

      if ($scope.driver.wsnId !== null && $scope.driver.wsnId.length > 0) {
        WSNSrv.connectMaster($scope.driver.wsnId).then(
          function (procedureStarted) { },
          function (reason) {
            // TODO toast for failure
            //Utils.toast('Problema di connessione con il nodo Master!', 5000, 'center');
          }
        );
      }
      //$scope.resizeHelpersList();
    }

    selectHelpers = function () {
      //show popup of selection and go on after selection
      var deferred = $q.defer();
      var volunteerPopup = $ionicPopup.show({
        templateUrl: 'templates/home_popup_helpers.html',
        title: 'Seleziona con chi vai',
        scope: $scope,
        buttons: [{
          text: 'ok',
          type: 'button-stable',
          onTap: function (e) {
            $scope.helpers = [];
            var items = 0;
            $scope.volunteers.forEach(function (vol, index, array) {
              if (vol.checked) {
                $scope.helpers.push(vol);
              }
              items++;
              if (items == array.length) {
                deferred.resolve();
                volunteerPopup.close();
              }
            });
          }
        }]
      });

      return deferred.promise;
    }
    goWithHelpers = function () {
      selectHelpers().then(
        function () {
          selectedHelpers();
          goWithChildren();
        }
      )
    }


    sortedVolunteers = function () {
      /*
       * sort volunteers only if route exists but not a driver
       */
      var route = $scope.wizard.route;
      var sortedVolunteers = $filter('orderBy')(StorageSrv.getVolunteers(), ['checked', 'name']);
      // TODO sort using calendars
      for (var j = 0; j < calendars.length; j++) {
        var cal = calendars[j]
        if (cal.schoolId == StorageSrv.getSchoolId() && cal.routeId == route.objectId) {
          // driver
          var driverOnTop = false;
          if (!!cal.driverId) {
            for (var i = 0; i < sortedVolunteers.length; i++) {
              if (sortedVolunteers[i].objectId == cal.driverId) {
                Utils.moveInArray(sortedVolunteers, i, 0);
                //console.log('Driver ' + sortedVolunteers[counter].name + ' moved on top');
                driverOnTop = true;
                i = sortedVolunteers.length;
              }
            }
          }

          // helpers
          if (!!cal.helperList && cal.helperList.length > 0) {
            var counter = driverOnTop ? 1 : 0;
            cal.helperList.forEach(function (helperId) {
              for (var i = 0; i < sortedVolunteers.length; i++) {
                if (sortedVolunteers[i].objectId == helperId) {
                  Utils.moveInArray(sortedVolunteers, i, counter);
                  //console.log('Helper ' + sortedVolunteers[counter].name + ' moved to position ' + counter);
                  counter++;
                  i = sortedVolunteers.length;
                }
              }
            });
          }
          j = calendars.length;
        }
      }
      $scope.volunteers = sortedVolunteers;
    }


    selectDriver = function () {
      //show popup of selection and go on after selection
      var deferred = $q.defer();
      var volunteerPopup = $ionicPopup.show({
        templateUrl: 'templates/home_popup_driver.html',
        title: 'Seleziona chi sei',
        scope: $scope,
        buttons: []
      });

      $scope.selectVolunteer = function (volunteer) {
        $scope.driver = volunteer;
        deferred.resolve();
        volunteerPopup.close();
      };
      return deferred.promise;
    }
    goWithDriver = function () {
      loadingWithMessage($filter('translate')('home_get_vol'));
      APISrv.getVolunteersBySchool($scope.ownerId, $scope.institute.objectId, $scope.school.objectId).then(
        function (volunteers) {
          console.log(volunteers);
          hideLoading();
          $scope.volunteers = volunteers;
          //sortedVolunteers();
          StorageSrv.saveVolunteers(volunteers).then(function (volunteers) {
            if ($scope.volunteers.length == 1) {
              $scope.driver = $scope.volunteers[0];
              goWithChildren()
            } else {
              selectDriver().then(
                function () {
                  goWithHelpers();
                }
              )
            }
          }, function (err) {
            $scope.showErrorAndExit();

          })
        },
        function (err) {
          console.log(err);
          hideLoading();
          $scope.showErrorAndExit();

        });
    }

    selectRoute = function () {
      //show popup of selection and go on after selection
      var deferred = $q.defer();
      var institutePopup = $ionicPopup.show({
        templateUrl: 'templates/home_popup_routes.html',
        title: 'Seleziona la linea',
        scope: $scope,
        buttons: []
      });

      $scope.selectRoute = function (route) {
        $scope.route = route;
        deferred.resolve(route);
        institutePopup.close();
      };
      return deferred.promise;
    }
    goWithRoutes = function (instituteId) {
      loadingWithMessage($filter('translate')('home_get_route'));
      APISrv.getRoute($scope.ownerId, $scope.institute.objectId, $scope.school.objectId).then(
        function (routes) {
          console.log(routes);
          hideLoading();
          $scope.routes = routes;
          StorageSrv.saveRoutes(routes).then(function (routes) {
            // get institute by ownerId
            if ($scope.routes.length == 1) {
              $scope.route = $scope.routes[0];
              goWithDriver();
            } else {
              selectRoute().then(
                function (route) {
                  goWithDriver()
                }
              )
            }
          }, function (err) {
            $scope.showErrorAndExit();
          })
        },
        function (err) {
          console.log(err);
          hideLoading();
          $scope.showErrorAndExit()
        });
    }


    selectSchool = function () {
      //show popup of selection and go on after selection
      var deferred = $q.defer();
      var institutePopup = $ionicPopup.show({
        templateUrl: 'templates/home_popup_schools.html',
        title: 'Seleziona la scuola',
        scope: $scope,
        buttons: []
      });

      $scope.selectSchool = function (school) {
        $scope.school = school;
        deferred.resolve(school.objectId);
        institutePopup.close();
      };
      return deferred.promise;
    }
    goWithSchool = function (instituteId) {
      loadingWithMessage($filter('translate')('home_get_school'));
      APISrv.getSchooldById($scope.ownerId, $scope.institute.objectId).then(
        function (schools) {
          console.log(schools);
          hideLoading();
          $scope.schools = schools;
          // get institute by ownerId
          if ($scope.schools.length == 1) {
            $scope.school = $scope.schools[0];
            goWithRoutes($scope.schools[0].objectId)
          } else {
            selectSchool().then(
              function (schoolId) {
                goWithRoutes(schoolId);
              }
            )
          }
        },
        function (err) {
          console.log(err);
          hideLoading();
          $scope.showErrorAndExit();
        });
    }

    selectInstitute = function () {
      //show popup of selection and go on after selection
      var deferred = $q.defer();
      var institutePopup = $ionicPopup.show({
        templateUrl: 'templates/home_popup_institute.html',
        title: 'Seleziona l\'istituto',
        scope: $scope,
        buttons: []
      });

      $scope.selectInstitute = function (institute) {
        $scope.institute = institute;
        deferred.resolve(instituteId.objectId);
        institutePopup.close();
      };
      return deferred.promise;
    }
    goWithInstitute = function (ownerId) {
      loadingWithMessage($filter('translate')('home_get_institute'));
      APISrv.getInstituteByOwnerId(ownerId).then(
        function (institutes) {
          hideLoading();
          console.log(institutes);
          $scope.institutes = institutes;
          // get institute by ownerId
          if ($scope.institutes.length == 1) {
            $scope.institute = $scope.institutes[0];
            goWithSchool($scope.institutes[0].objectId)
          } else {
            selectInstitute().then(
              function (schoolId) {
                goWithSchool(schoolId);
              }
            )
          }
        },
        function (err) {
          console.log(err);
          hideLoading();
          $scope.showErrorAndExit();
        });
    }
    selectOwnerId = function () {
      //show popup of selection and go on after selection
      var deferred = $q.defer();
      var ownerPopup = $ionicPopup.show({
        templateUrl: 'templates/home_popup_owner.html',
        title: 'Seleziona il profile',
        scope: $scope,
        buttons: []
      });

      $scope.selectOwner = function (ownerId) {
        $scope.ownerId = ownerId;
        deferred.resolve(ownerId);
        ownerPopup.close();
      };
      return deferred.promise;
    }
    $scope.initProfile = function () {
      //get profile
      $scope.deregisterBackButton = $ionicPlatform.registerBackButtonAction(function(e){}, 401);
      loadingWithMessage($filter('translate')('home_get_profile'));
      APISrv.getProfile().then(function (profile) {
        console.log(profile);
        hideLoading();
        $scope.ownerIds = profile.ownerIds;
        // get institute by ownerId
        if ($scope.ownerIds.length == 1) {
          $scope.ownerId = $scope.ownerIds[0];
          goWithInstitute($scope.ownerIds[0])
        } else {
          selectOwnerId().then(
            function (instituteId) {
              goWithInstitute(instituteId);
            }
          )
        }
      }, function (err) {
        hideLoading();
        $scope.showErrorAndExit();
      })
    }

    $scope.initProfile();

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
        text: 'Il Led rosso lampeggerà per 30 secondi, dopodiché il dispositivo è pronto. Riassembla i componenti, reinserendoli nella busta trasparente e di seguito nel case plastico.'
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
