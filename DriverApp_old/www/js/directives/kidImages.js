angular.module('driverapp.controllers.img', [])
  .directive('httpSrc', function ($http, LoginService, Config) {
    return {
      // do not share scope with sibling img tags and parent
      // (prevent show same images on img tag)
      scope: {
        httpSrc: '@'
      },
      link: function ($scope, elem, attrs) {
        function revokeObjectURL() {
          if ($scope.objectURL) {
            URL.revokeObjectURL($scope.objectURL);
          }
        }

        $scope.$watch('objectURL', function (objectURL) {
          elem.attr('src', objectURL);
        });

        $scope.$on('$destroy', function () {
          revokeObjectURL();
        });

        function _arrayBufferToBase64(buffer) {
          var binary = '';
          var bytes = new Uint8Array(buffer);
          var len = bytes.byteLength;
          for (var i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          return window.btoa(binary);
        }
        attrs.$observe('httpSrc', function (url) {
          revokeObjectURL();

          if (url && url.indexOf('data:') === 0) {
            $scope.objectURL = url;
          } else if (url) {
            LoginService.getValidAACtoken().then(
              function (token) {
                $http.get(url, {
                    responseType: 'arraybuffer',
                    cache: true,
                    headers: {
                      'accept': 'image/webp,image/*,*/*;q=0.8',
                      'Authorization': 'Bearer ' + token,
                      'appId': Config.APPID,
                    }
                  })
                  .then(function (response) {
                    var str;
                    if (response.data) {
                      str = _arrayBufferToBase64(response.data);
                      $scope.objectURL = "data:image/png;base64," + str;
                    }
                    else {
                        $scope.objectURL ='img/placeholder_child.png';
                    }
                  }, function(err){
                    $scope.objectURL ='img/placeholder_child.png';
                  });
              })
          }
        });
      }
    };
  });
