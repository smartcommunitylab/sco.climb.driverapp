angular.module('driverapp', [
    'ionic',
    'ionic.wizard',
    'ngCordova',
    'driverapp.services.config',
    'driverapp.services.utils',
    'driverapp.services.storage',
    'driverapp.services.wsn',
    'driverapp.services.geo',
    'driverapp.services.ae',
    'driverapp.services.api',
    'driverapp.controllers.home',
    'driverapp.controllers.wizard',
    'driverapp.controllers.routes',
    'driverapp.controllers.route',
    'driverapp.controllers.volunteers'
])

.run(function ($ionicPlatform, $rootScope, Config, Utils, WSNSrv) {
    $ionicPlatform.ready(function () {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            cordova.plugins.Keyboard.disableScroll(true);

        }

        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }

        if (window.DriverAppPlugin && ionic.Platform.isAndroid()) {
            WSNSrv.init().then(
                function (response) {},
                function (reason) {}
            );

            WSNSrv.startListener().then(
                function (response) {},
                function (reason) {}
            );

            /*
             * WSN Functions!
             */
            $rootScope.WSNSrvGetMasters = function () {
                WSNSrv.getMasters().then(
                    function (masters) {},
                    function (reason) {}
                );
            };

            $rootScope.WSNSrvConnectMaster = function (masterId) {
                WSNSrv.connectMaster(masterId).then(
                    function (procedureStarted) {},
                    function (reason) {}
                );
            };

            $rootScope.WSNSrvSetNodeList = function () {
                var childrenWsnIds = WSNSrv.getNodeListByType('child');
                WSNSrv.setNodeList(childrenWsnIds).then(
                    function (procedureStarted) {},
                    function (reason) {}
                );
            };

            $rootScope.WSNSrvGetNetworkState = function () {
                WSNSrv.getNetworkState().then(
                    function (networkState) {},
                    function (reason) {}
                );
            };
        }
    });
})

.config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider.state('app', {
        url: '/app',
        abstract: true,
        templateUrl: 'templates/menu.html',
        controller: 'AppCtrl'
    })

    .state('app.wizard', {
        url: '/wizard',
        cache: false,
        views: {
            'menuContent': {
                templateUrl: 'templates/wizard.html',
                controller: 'WizardCtrl'
            }
        }
    })

    .state('app.home', {
        url: '/home',
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
    });

    $urlRouterProvider.otherwise('/app/wizard');
});
