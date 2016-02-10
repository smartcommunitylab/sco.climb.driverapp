angular.module('driverapp.controllers.home', [])

.controller('AppCtrl', function ($scope) {})

.controller('HomeCtrl', function ($scope, Utils, StorageSrv, APISrv) {
    StorageSrv.reset();

    $scope.schools = null;
    $scope.school = null;
    $scope.volunteers = null;
    $scope.volunteer = null;

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
        $scope.school = school;

        APISrv.getVolunteersBySchool($scope.school.objectId).then(
            function (volunteers) {
                $scope.volunteers = volunteers;
            },
            function (error) {
                console.log(error);
            }
        );
    }

    $scope.chooseVolunteer = function (volunteer) {
        // TODO save in storage school and volunteer
        $scope.volunteer = volunteer;

        StorageSrv.saveSchool($scope.school).then(
            function () {
                StorageSrv.saveVolunteer($scope.volunteer).then(
                    function () {
                        Utils.toast($scope.volunteer.name + ' @ ' + $scope.school.name);
                    }
                );
            }
        );
    }
});
