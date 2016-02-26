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

.run(function ($ionicPlatform, $rootScope, WSNSrv) {
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
            /*
            WSNSrv.test('PROVA').then(
                function (response) {
                    $rootScope.PLUGIN_TEST = response;
                },
                function (reason) {
                    console.log(reason);
                }
            );
            */

            WSNSrv.init().then(
                function (response) {
                    WSNSrv.getMasters().then(
                        function (masters) {
                            console.log('getMasters: ' + masters);
                        },
                        function (reason) {
                            console.log(reason);
                        }
                    );
                },
                function (reason) {
                    console.log(reason);
                }
            );

            /*
            WSNSrv.getNetworkState().then(
                function (networkState) {
                    console.log('getNetworkState: ' + networkState);
                },
                function (reason) {
                    console.log(reason);
                }
            );
            */

            $rootScope.WSNSrvGetNetworkState = function () {
                WSNSrv.getNetworkState().then(
                    function (networkState) {
                        console.log('getNetworkState: ' + networkState);
                    },
                    function (reason) {
                        console.log(reason);
                    }
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
