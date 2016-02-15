angular.module('driverapp', [
    'ionic',
    'ionic.wizard',
    'ngCordova',
    'driverapp.services.config',
    'driverapp.services.utils',
    'driverapp.services.storage',
    'driverapp.services.api',
    'driverapp.controllers.home',
    'driverapp.controllers.wizard',
    'driverapp.controllers.routes',
    'driverapp.controllers.route'
])

.run(function ($ionicPlatform, StorageSrv) {
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

        // FIXME dev purpose only!!!
        StorageSrv.reset();
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
        views: {
            'menuContent': {
                templateUrl: 'templates/routes.html',
                controller: 'RoutesCtrl'
            }
        }
    })

    .state('app.route', {
        url: '/routes/:routeId',
        views: {
            'menuContent': {
                templateUrl: 'templates/route.html',
                controller: 'RouteCtrl'
            }
        }
    });

    $urlRouterProvider.otherwise('/app/wizard');
});
