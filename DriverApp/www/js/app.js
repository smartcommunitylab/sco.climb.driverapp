angular.module('driverapp', [
  'ionic',
  'ionic.wizard',
  'ngCordova',
  'pascalprecht.translate',
  'driverapp.services.storage',
  'driverapp.services.config',
  'driverapp.services.utils',
  'driverapp.services.wsn',
  'driverapp.services.geo',
  'driverapp.services.ae',
  'driverapp.services.api',
  'driverapp.services.route',
  'driverapp.services.login',
  'driverapp.controllers.login',
  'driverapp.controllers.home',
  'driverapp.controllers.routes',
  'driverapp.controllers.route',
  'driverapp.controllers.volunteers',
  'driverapp.controllers.batteries'
])

  .run(function ($ionicPlatform, $rootScope, $state, $translate, $ionicHistory, $ionicPopup, $window, GeoSrv,Config, Utils, StorageSrv,  WSNSrv, APISrv, LoginService) {
    $ionicPlatform.ready(function () {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true)
        cordova.plugins.Keyboard.disableScroll(true)
      }

      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        window.StatusBar.styleDefault()
      }

      // if (window.logToFile && ionic.Platform.isAndroid()) {
      //   LogSrv.init()
      // }
      if (typeof navigator.globalization !== "undefined") {
        navigator.globalization.getPreferredLanguage(function (language) {
          $translate.use((language.value).split("-")[0]).then(function (data) {
            console.log("SUCCESS -> " + data);
          }, function (error) {
            console.log("ERROR -> " + error);
          });
        }, null);
      }
      // Config.init().then(function () {
        LoginService.init({
          loginType: LoginService.LOGIN_TYPE.AAC,
          googleWebClientId: Config.webclientid,
          clientId: Config.cliendID,
          clientSecret: Config.clientSecID,
          aacUrl: Config.AACURL
        });
      // });
      GeoSrv.geolocalize();
      /*
       * Check Internet connection
       */
      if (Utils.isConnectionDown()) {
        Utils.loaded()

        $ionicPopup.alert({
          title: 'Nessuna connessione',
          template: 'L\'applicazione non può funzionare se il terminale non è connesso a Internet',
          okText: 'Chiudi',
          okType: 'button-energized'
        })

          .then(function (result) {
            ionic.Platform.exitApp()
          })
      }

      if (window.DriverAppPlugin) {
        WSNSrv.init().then(
          function (response) { },
          function (reason) { }
        )

        WSNSrv.startListener().then(
          function (response) { },
          function (reason) { }
        )

        /*
         * WSN Functions!
         * 
         * NOT USED
         */
        $rootScope.WSNSrvGetMasters = function () {
          WSNSrv.getMasters().then(
            function (masters) { },
            function (reason) { }
          )
        }

        /**
         * NOT USED
         */
        $rootScope.WSNSrvConnectMaster = function (masterId) {
          WSNSrv.connectMaster(masterId).then(
            function (procedureStarted) { },
            function (reason) { }
          )
        }

        /**
         * NOT USED
         */
        $rootScope.WSNSrvSetNodeList = function () {
          var childrenWsnIds = WSNSrv.getNodeListByType('child')
          WSNSrv.setNodeList(childrenWsnIds).then(
            function (procedureStarted) { },
            function (reason) { }
          )
        }

        /**
         * NOT USED
         */
        $rootScope.WSNSrvGetNetworkState = function () {
          WSNSrv.getNetworkState().then(
            function (networkState) { },
            function (reason) { }
          )
        }

        $rootScope.WSNSrvCheckMaster = function () {
          WSNSrv.connectMaster($rootScope.driver.wsnId).then(
            function (procedureStarted) { },
            function (reason) { }
          )
        }

      }

      $rootScope.exitApp = function () {
        $ionicPopup.confirm({
          title: 'Chiusura app',
          template: 'Vuoi veramente uscire?',
          cancelText: 'No',
          cancelType: 'button-stable',
          okText: 'Si',
          okType: 'button-energized'
        })

          .then(function (result) {
            if (result) {
              Utils.setMenuDriverTitle(null) // clear driver name in menu
              ionic.Platform.exitApp()
            }
          })
      }

      $rootScope.logout = function () {
        $ionicPopup.confirm({
          title: 'Logout',
          template: 'Vuoi veramente fare logout?',
          cancelText: 'No',
          cancelType: 'button-stable',
          okText: 'Si',
          okType: 'button-energized'
        })

          .then(function (result) {
            if (result) {
              Config.resetIdentity()
              StorageSrv.clearIdentity()
              // if (ionic.Platform.isIOS()) {
                LoginService.logout();
                $state.go('app.login').then(function () {
                    // window.location.reload(true);
                });
              // } else {
              //   ionic.Platform.exitApp()
              // }
              /*
              $state.go('app.wizard').then(function () {
                  window.location.reload(true);
              });
              */

              /*
              window.location.hash = '/wizard';
              window.location.reload(true);
              */

              /*
              document.location.href = 'index.html';
              */

              /*
              $state.go('app.wizard');
              $ionicHistory.clearHistory();
              setTimeout(function () {
                  $window.location.reload(true);
              }, 100);
              */
            }
          })
      }

      $ionicPlatform.registerBackButtonAction(function (event) {
        // if (true) { // TODO need a condition?
        $rootScope.exitApp()
        // }
      }, 100)
    })
  })

  .config(function ($stateProvider, $urlRouterProvider, $translateProvider) {
    $stateProvider.state('app', {
      url: '/app',
      abstract: true,
      templateUrl: 'templates/menu.html',
      controller: 'AppCtrl'
    })
      .state('app.login', {
        cache: false,
        url: "/login",
        views: {
          'menuContent': {
            templateUrl: "templates/login.html",
            controller: 'LoginCtrl'
          }
        }
      })
      .state('app.signup', {
        url: '/signup',
        views: {
          'menuContent': {
            templateUrl: 'templates/signup.html',
            controller: 'RegisterCtrl'
          }
        }
      })
      .state('app.signupsuccess', {
        url: '/signupsuccess',
        views: {
          'menuContent': {
            templateUrl: 'templates/signupsuccess.html',
            controller: 'RegisterCtrl'
          }
        }
      })
      .state('app.home', {
        url: '/home',
        cache: false,
        views: {
          'menuContent': {
            templateUrl: 'templates/home.html',
            controller: 'HomeCtrl'
          }
        }
      })
      .state('app.routes', {
        url: '/routes',
        cache: false,
        views: {
          'menuContent': {
            templateUrl: 'templates/routes.html',
            controller: 'RoutesCtrl'
          }
        }
      })
      .state('app.route', {
        url: '/routes/:routeId',
        cache: false,
        params: {
          fromWizard: false,
          ownerId:"",
          route: {},
          driver: {},
          helpers: []
        },
        views: {
          'menuContent': {
            templateUrl: 'templates/route.html',
            controller: 'RouteCtrl'
          }
        }
      })
      .state('app.volunteers', {
        url: '/volunteers',
        cache: false,
        views: {
          'menuContent': {
            templateUrl: 'templates/volunteers.html',
            controller: 'VolunteersCtrl'
          }
        }
      })

    $urlRouterProvider.otherwise('/app/login')
    $translateProvider.translations('it', {
      login_title: 'CLIMB',
      login_signin: 'ENTRA',
      login_signup: 'REGISTRATI',
      signin_title: 'Accedi con le tue credenziali',
      signin_pwd_reset: 'Password dimenticata?',
      signup_name: 'Nome',
      signup_surname: 'Cognome',
      signup_email: 'Email',
      signup_pwd: 'Password',
      error_required_fields: 'Tutti i campi sono obbligatori',
      error_password_short: 'La lunghezza della password deve essere di almeno 6 caratteri',
      signup_success_title: 'Registrazione completata!',
      signup_success_text: 'Completa la registrazione cliccando sul link che trovi nella email che ti abbiamo inviato.',
      signup_resend: 'Re-inviare l\'email di conferma',
      error_signin: 'Username/password non validi',
      signup_signup: 'Registrati',
      signup_title: 'Registrati con',
      text_login_use: 'oppure accedi con',
      error_popup_title: 'Errore',
      error_generic: 'La registrazione non è andata a buon fine. Riprova più tardi.',
      error_email_inuse: 'L\'indirizzo email è già in uso.',
      home_get_profile:'Ottenendo il profilo',
      home_get_school:'Ottenendo la scuola',
      home_get_institute:'Ottenendo l\'istituto',
      home_get_route:'Ottenendo i percorsi',
      home_get_vol:'Ottenendo i volontari',
      home_get_children:'Ottenendo i bambini',
      user_check:'Verifica credenziali'


    });

    $translateProvider.preferredLanguage(DEFAULT_LANG);
    $translateProvider.fallbackLanguage(DEFAULT_LANG);
  })
