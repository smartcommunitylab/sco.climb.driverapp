angular.module('driverapp.controllers.volunteers', [])
  .controller('VolunteersCtrl', function ($scope, $ionicPopup, Config, StorageSrv, APISrv) {
    $scope.volunteers = StorageSrv.getVolunteers()

    if ($scope.volunteers == null) {
      APISrv.getVolunteersBySchool(StorageSrv.getSchoolId()).then(
        function (volunteers) {
          StorageSrv.saveVolunteers(volunteers)
          $scope.volunteers = volunteers
        },
        function (error) {
          // TODO handle error
          console.log(error)
        }
      )
    }

    /*
     * Child details popup
     */
    $scope.showVolunteerDetails = function (volunteer) {
      if (volunteer.phone) {
        $scope.phone = volunteer.phone
        // var detailsPopup =
        $ionicPopup.alert({
          title: volunteer.name,
          templateUrl: 'templates/phone_popup_person.html', // volunteer.phone,
          scope: $scope,
          okText: 'OK',
          okType: 'button'
        })
      }
    }
  })
