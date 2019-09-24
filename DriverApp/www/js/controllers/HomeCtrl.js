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


    $scope.showModalVolunteers = function () {
      if (!$scope.modalVolunteers) {
        $ionicModal.fromTemplateUrl('templates/app_modal_volunteers.html', {
          scope: $scope,
          animation: 'slide-in-up'
        }).then(function (modal) {
          $scope.modalVolunteers = modal
          $scope.modalVolunteers.show();

        })
      } else {
        $scope.modalVolunteers.show();
      }
    }
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
    }
    $scope.getImageBattery = function (child) {
      return Config.SERVER_URL + '/child/image/download/' + child.ownerId + '/' + child.objectId + '?timestamp=' + Utils.getImageTimestamp(child.ownerId, child.objectId);
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
    }

    $scope.stopMaintenanceMode = function () {
      // TODO
      $scope.modalMaintenance.hide();
      $rootScope.showTutorial = false;
    }


  })

  .controller('HomeCtrl', function ($ionicPlatform, $scope, $ionicLoading, $q, $rootScope, $state, $window, $ionicPopup, $ionicModal, $ionicHistory, $ionicSlideBoxDelegate, $timeout, $filter, Utils, StorageSrv, Config, LoginService, APISrv, WSNSrv) {
    StorageSrv.reset()

    $scope.schools = null
    $scope.school = null

    $scope.swiperOptions = Config.WIZARD_SLIDER_OPTIONS;

    $scope.schools = [];
    $scope.routes = [];
    $scope.volunteers = null;
    $scope.lineVolunteers = null;
    
    /**
     * A generic wizard list selection popup. 
     * Optional 'mapping' function to transform list item in object with 'name' attribute. Default 'identity' function.
     * Optional 'loadAllFn' function to be used to load all possible values. Should return promise that resolves to the list of objects. Default null.
     */
    selectionPopup = function(title, list, mapping, loadAllFn) {
      var deferred = $q.defer();
      var mapped = mapping ? list.map(mapping) : list;
      mapped.sort(function(a,b) {
        return a.name.localeCompare(b.name);
      });
      $scope.selectionPopupList = mapped;
      if (loadAllFn) {
        $scope.loadAll = function() {
          Utils.loading();
          loadAllFn().then(function(list) {
            var mapped = mapping ? list.map(mapping) : list;
            mapped.sort(function(a,b) {
              return a.name.localeCompare(b.name);
            });
            $scope.selectionPopupList = mapped;
            $scope.loadMore = false;
            Utils.loaded();
          }, function(err) {
            console.error(err);
            Utils.loaded();
          });
        };
      }  
      if (!list || list.length == 0) {
        if ($scope.loadAll) {
          $scope.loadAll();
        }
      } else {
        $scope.loadMore = !!$scope.loadAll;
      }

      var popup = $ionicPopup.show({
        templateUrl: 'templates/home_popup_selection.html',
        title: title,
        scope: $scope,
        buttons: []
      });

      $scope.selected = function (item) {
        deferred.resolve(item);
        popup.close();
      };
      return deferred.promise;
    }

    /** 
     * Error handler for wizard
     */
    wizardError = function(err) {
        console.log(err);
        Utils.loaded();
        Utils.showErrorAndExit();
    }

    /**
     * Wizzard 6: populate list of children for the selected school
     */
    goWithChildren = function () {
      if (!$scope.driver.wsnId) {
        $scope.driver.wsnId = CONF.DEV_MASTER;
      }
      $rootScope.driver = $scope.driver;

      Utils.loadingWithMessage($filter('translate')('home_get_children'));
      APISrv.getChildrenBySchool($scope.ownerId, $scope.institute.objectId, $scope.school.objectId).then(
        function (children) {
          Utils.loaded();
          StorageSrv.saveChildren(children).then(
            function (children) {
              WSNSrv.updateNodeList(children, 'child')
              $ionicSlideBoxDelegate.update();
              Utils.loaded();

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
            }, wizardError
          )
        }, wizardError
      )
    }

    /**
     * Wizard step 5: selecte volunteer assistants
     */
    goWithHelpers = function () {
      showPopup = function() {
        var volunteerPopup = $ionicPopup.show({
          templateUrl: 'templates/home_popup_helpers.html',
          title: 'Seleziona con chi vai',
          scope: $scope,
          buttons: [{
            text: 'OK',
            type: 'button-stable',
            onTap: function (e) {
              $scope.helpers = [];
              $scope.volunteers.forEach(function (vol, index, array) {
                if (vol.checked) {
                  $scope.helpers.push(vol);
                }
              });
              volunteerPopup.close();
              goWithChildren();
            }
          }]
        });      
      }

      $scope.volunteers = $scope.lineVolunteers.filter(element => element.objectId != $scope.driver.objectId);
      if ($scope.volunteers.length == 0) {
        APISrv.getVolunteersBySchool($scope.ownerId, $scope.institute.objectId, $scope.school.objectId).then(function(all) {
          $scope.volunteers = all.filter(function(element) { return element.objectId != $scope.driver.objectId});
          $scope.allhelpers = true;
          showPopup();
        });
      } else {
        $scope.allhelpers = false;
        $scope.loadAllVolunteers = function() {
          APISrv.getVolunteersBySchool($scope.ownerId, $scope.institute.objectId, $scope.school.objectId).then(function(all) {
            all.forEach(function(e) {
              $scope.volunteers.forEach(function(v) {
                if (v.checked && v.objectId === e.objectId) e.checked = true;
              });  
            });
            $scope.volunteers = all;
            $scope.allhelpers = true;
          });

        }
        showPopup();
      }
    }

    /**
     * Wizard step 4: select driver, or bypass if known
     */
    goWithDriver = function () {
      Utils.loadingWithMessage($filter('translate')('home_get_vol'));
      // select all
      APISrv.getVolunteersBySchool($scope.ownerId, $scope.institute.objectId, $scope.school.objectId).then(function(all) {
        APISrv.getVolunteersBySchool($scope.ownerId, $scope.institute.objectId, $scope.school.objectId, $scope.route.objectId).then(
          function (volunteers) {
            Utils.loaded();
            $scope.lineVolunteers = volunteers;
            $scope.volunteers = volunteers;
            StorageSrv.saveVolunteers(all).then(function (volunteers) {
              var matching = all.find(function(e) {return e.email == $scope.profile.email});
              if (!!matching) {
                $scope.driver = matching;
                if (all.length > 1) {
                  goWithHelpers()
                } else {
                  goWithChildren()
                }
              } else {
                selectionPopup('Seleziona chi sei', $scope.volunteers, null, function(){
                  return APISrv.getVolunteersBySchool($scope.ownerId, $scope.institute.objectId, $scope.school.objectId);
                }).then(function(driver) {
                  $scope.driver = driver;
                  goWithHelpers();
                });
              }
            }, wizardError);
        }, wizardError);
      }, wizardError);
    }

    /**
     * Wizard step 3: select route, or bypass if single
     */
    goWithRoutes = function () {
      Utils.loadingWithMessage($filter('translate')('home_get_route'));
      APISrv.getRoute($scope.ownerId, $scope.institute.objectId, $scope.school.objectId).then(
        function (routes) {
          Utils.loaded();
          $scope.routes = routes;
          StorageSrv.saveRoutes(routes).then(function (routes) {
            if ($scope.routes.length == 1) {
              // single route, proceed with driver
              $scope.route = $scope.routes[0];
              goWithDriver();
            } else {
              // multiple routes, ask the user to select
              selectionPopup('Seleziona la linea', $scope.routes).then(
                function (route) {
                  $scope.route = route;
                  goWithDriver()
                }
              )
            }
          }, wizardError)
        }, wizardError);
    }

    /**
     * Wizard step 2: select school or bypass if single
     */
    goWithSchool = function () {
      Utils.loadingWithMessage($filter('translate')('home_get_school'));
      // get school for owner and institute
      APISrv.getSchooldById($scope.ownerId, $scope.institute.objectId).then(
        function (schools) {
          Utils.loaded();
          $scope.schools = schools;

          if ($scope.schools.length == 1) {
            // single school, proceed with routes
            $scope.school = $scope.schools[0];
            goWithRoutes()
          } else {
            // multiple schools, ask the user to select one
            selectionPopup('Seleziona la scuola', $scope.schools).then(
              function (school) {
                $scope.school = school;
                goWithRoutes();
              }
            )
          }
        }, wizardError);
    }
    /**
     * Wizzard step 1: select institute or bypass if single
     */
    goWithInstitute = function (ownerId) {
      Utils.loadingWithMessage($filter('translate')('home_get_institute'));
      // get institute by ownerId
      APISrv.getInstituteByOwnerId(ownerId).then(
        function (institutes) {
          Utils.loaded();
          $scope.institutes = institutes;
          if ($scope.institutes.length == 1) {
            // single instittue, proceed with school selection
            $scope.institute = $scope.institutes[0];
            goWithSchool()
          } else {
            // multiple institutes, ask the user to select
            selectionPopup('Seleziona l\'istituto', $scope.institutes).then(
              function (selection) {
                $scope.institute = selection;
                goWithSchool();
              }
            )
          }
        }, wizardError);
    }

    /**
     * Initialize the user and profile data
     */
    $scope.initProfile = function () {
      $scope.deregisterBackButton = $ionicPlatform.registerBackButtonAction(function (e) {}, 401);
      Utils.loadingWithMessage($filter('translate')('home_get_profile'));
      // read profile 
      APISrv.getProfile().then(function (profile) {
        console.log(profile);
        Utils.loaded();
        $scope.profile = profile;
        $scope.ownerIds = profile.ownerIds;
        if ($scope.ownerIds.length == 1) {
          // single owner, proceed with institute
          $scope.ownerId = $scope.ownerIds[0];
          goWithInstitute($scope.ownerId)
        } else {
          // multiple owners, ask the user to specify one
          selectionPopup('Seleziona il profile', $scope.ownerIds, function(i) {return {name: i}}).then(
            function (owner) {
              $scope.ownerId = owner.name;
              goWithInstitute($scope.ownerId);
            }
          )
        }
      }, function (err) {
        Utils.loaded();
        if ('INSUFFICIENT_RIGHTS' === err) {
          var alertPopup = $ionicPopup.alert({
            title: $filter('translate')('error_right_title'),
            template: $filter('translate')('error_right_template'),
            okText: 'Logout'
          });

          alertPopup.then(function (res) {
            Config.resetIdentity()
            StorageSrv.clearIdentity()
            // if (ionic.Platform.isIOS()) {
            LoginService.logout();
            $state.go('app.login');
          });
        } else {
          Utils.showErrorAndExit();
        }
      })
    }

    $scope.initProfile();
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
    $scope.tutorialSlides = [{
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
    }]
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
