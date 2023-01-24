angular.module('driverapp.controllers.login', [])
    .controller('LoginCtrl', function ($scope, $ionicSideMenuDelegate, $ionicLoading, ngOidcClient, $log,$ionicPlatform, $state, $ionicHistory, $ionicPopup, $timeout, $filter, Config, LoginService, Utils, StorageSrv) {
        $ionicSideMenuDelegate.canDragContent(false);

        $scope.isIOS = false;

        $scope.user = {
            email: '',
            password: ''
        };
        
        $scope.newAAC = function (provider) {
            $ionicLoading.show();
            var prov = provider ? this.getExtraIdp(provider) : undefined
            ngOidcClient.signinPopup({extraQueryParams:prov}).then(function (user) {
                $log.log("user:" + JSON.stringify(user));
                if (!!user) {
                    $log.log('Logged in so going to home state');
                    $state.go('app.home');
                    $ionicLoading.hide();
                } else {
                    Utils.toast("Errore di comunicazione con il server", "short", "bottom");
                    $ionicLoading.hide();
                }
            }, function (err) {
                Utils.toast("Errore di comunicazione con il server", "short", "bottom");
                $ionicLoading.hide();
            });
        }
        $scope.getExtraIdp= function(provider) {
            if (LoginService.IDPHINT[provider]) {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              return { idp_hint: LoginService.IDPHINT[provider] };
            }
            return undefined;
          }
        // This method is executed when the user press the "Sign in with Google" button
        $scope.googleSignIn = function () {
            // $ionicLoading.show({
            //     template: 'Logging in...'
            // });
            // $timeout(function () {
            //     $ionicLoading.hide(); //close the popup after 3 seconds for some reason
            // }, 3000);
            LoginService.login(LoginService.PROVIDER.GOOGLE).then(function (profile) {
                //                                       check if user is valid
                $ionicLoading.hide();
                $ionicLoading.show({
                    template: $filter('translate')('user_check')
                });
                StorageSrv.saveIdentity('a');
                $state.go('app.home');
                $ionicHistory.nextViewOptions({
                    disableBack: true,
                    historyRoot: true
                });
            }, function (err) {
                Utils.toast("Errore di comunicazione con il server", "short", "bottom");
                $ionicLoading.hide();
            });
        }
        $scope.appleSignIn = function () {
            $ionicLoading.show({
              template: 'Logging in...'
            });
            $timeout(function () {
              $ionicLoading.hide(); //close the popup after 3 seconds for some reason
            }, 3000);
            LoginService.login(LoginService.PROVIDER.APPLE).then(function (profile) {
              //                                       check if user is valid
              $ionicLoading.show({
                template: $filter('translate')('user_check')
              });
              $ionicLoading.hide();
              $ionicLoading.show({
                  template: $filter('translate')('user_check')
              });
              StorageSrv.saveIdentity('a');

              $state.go('app.home');
              $ionicHistory.nextViewOptions({
                  disableBack: true,
                  historyRoot: true
              });

            }, function (err) {
                Utils.toast("Errore di comunicazione con il server", "short", "bottom");
              $ionicLoading.hide();
            });
          }
        $scope.facebookSignIn = function () {
            $ionicLoading.show({
                template: 'Logging in...'
            });
            $timeout(function () {
                $ionicLoading.hide(); //close the popup after 3 seconds for some reason
            }, 3000);
            LoginService.login(LoginService.PROVIDER.FACEBOOK).then(function (profile) {
                //                                       check if user is valid
                $ionicLoading.hide();
                $ionicLoading.show({
                    template: $filter('translate')('user_check')
                });
                StorageSrv.saveIdentity('a');

                $state.go('app.home');
                $ionicHistory.nextViewOptions({
                    disableBack: true,
                    historyRoot: true
                });

            }, function (err) {
                Utils.toast("Errore di comunicazione con il server", "short", "bottom");
                $ionicLoading.hide();
            });


        }


        $scope.$on('$ionicView.leave', function () {
            $ionicSideMenuDelegate.canDragContent(true);
            if (window.cordova && window.cordova.plugins.screenorientation && screen.unlockOrientation) {
                screen.unlockOrientation()
            }
        });
        $scope.$on('$ionicView.beforeEnter', function () {
            
        });


        $ionicPlatform.ready(function () {
            //check platform 
            if (window.cordova.platformId==='ios' && window.cordova.plugins.SignInWithApple) {
                $scope.isIOS = true;
            }
            // Config.init().then(function () {
            if (window.cordova && window.cordova.plugins.screenorientation && screen.lockOrientation) {
                screen.lockOrientation('portrait');
            }
            if (StorageSrv.getIdentity()) {
                $ionicLoading.show();
                LoginService.getValidAACtoken().then(function (validToken) {
                    $ionicLoading.hide();
                    // var profile = LoginService.getUserProfile();
                    //StorageSrv.saveIdentity('a');
                    $state.go('app.home');
                    $ionicHistory.nextViewOptions({
                        disableBack: true,
                        historyRoot: true
                    });

                }, function (err) {
                    $ionicLoading.hide();
                    var profile = LoginService.getUserProfile();
                })
                // });
            }
        });

        $scope.goRegister = function () {
            $state.go('app.signup');
        }

        $scope.passwordRecover = function () {
            window.open(Config.AACURL + '/internal/reset?lang=en', '_system', 'location=no,toolbar=no')
        }
        $scope.signin = function () {
            Config.loading();
            LoginService.login(LoginService.PROVIDER.INTERNAL, $scope.user).then(
                function (profile) {
                    $ionicLoading.hide();
                    $ionicLoading.show({
                        template: $filter('translate')('user_check')
                    });
                    StorageSrv.saveIdentity('a');

                    $state.go('app.home');
                    $ionicHistory.nextViewOptions({
                        disableBack: true,
                        historyRoot: true
                    });
                },
                function (error) {
                    $ionicPopup.alert({
                        title: $filter('translate')('error_popup_title'),
                        template: $filter('translate')('error_signin')
                    });

                }
            ).finally(Config.loaded);
        };

    })


    .controller('RegisterCtrl', function ($scope, $rootScope, $state, $filter, $ionicHistory, $ionicPopup, $translate, LoginService, Config) {
        $scope.user = {
            lang: $translate.preferredLanguage(),
            name: '',
            surname: '',
            email: '',
            password: ''
        };

        var validate = function () {
            if (!$scope.user.name.trim() || !$scope.user.surname.trim() || !$scope.user.email.trim() || !$scope.user.password.trim()) {
                return 'error_required_fields';
            }
            if ($scope.user.password.trim().length < 6) {
                return 'error_password_short';
            }
            return null;
        };

        $scope.toLogin = function () {
            window.location.hash = '';
            window.location.reload(true);
        }

        $scope.resend = function () {
            window.open(Config.AACURL + '/internal/resend?lang=en', '_system', 'location=no,toolbar=no')
        }


        $scope.register = function () {
            var msg = validate();
            if (msg) {
                $ionicPopup.alert({
                    title: $filter('translate')('error_popup_title'),
                    template: $filter('translate')(msg)
                });
                return;
            }

            Config.loading();
            LoginService.register($scope.user).then(
                function (data) {
                    $state.go('app.signupsuccess');
                },
                function (error) {
                    var errorMsg = 'error_generic';
                    if (error.status == 409) {
                        errorMsg = 'error_email_inuse';
                    }
                    $ionicPopup.alert({
                        title: $filter('translate')('error_popup_title'),
                        template: $filter('translate')(errorMsg)
                    });
                }
            ).finally(Config.loaded);
        };
    });
