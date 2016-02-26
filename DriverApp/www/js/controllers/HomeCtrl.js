angular.module('driverapp.controllers.home', [])

.controller('AppCtrl', function ($scope, $rootScope, $ionicPlatform, Config, StorageSrv, APISrv) {
    /*
     * FIXME dev purpose only!
     */
    StorageSrv.reset();

    StorageSrv.saveSchool(CONF.DEV_SCHOOL).then(function (school) {
        /*
         * INIT!
         */
        APISrv.getChildrenBySchool(StorageSrv.getSchoolId()).then(
            function (children) {
                StorageSrv.saveChildren(children);
            }
        );
    });
})

.controller('HomeCtrl', function ($scope, Utils, StorageSrv, APISrv) {
    StorageSrv.reset();

    $scope.schools = null;
    $scope.school = null;

    APISrv.getSchools().then(
        function (schools) {
            $scope.schools = schools;
        },
        function (error) {
            console.log(error);
        }
    );

    $scope.chooseSchool = function (school) {
        // retrieve volunteers
    };
});
