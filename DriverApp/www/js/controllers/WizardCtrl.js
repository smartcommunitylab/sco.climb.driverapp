angular.module('driverapp.controllers.wizard', [])

.controller('WizardCtrl', function ($scope, $rootScope, $state, $window, $ionicPopup, $ionicModal, $ionicHistory, $ionicSlideBoxDelegate, $timeout, $filter, Config, Utils, StorageSrv, APISrv, WSNSrv) {
	$scope.swiperOptions = Config.WIZARD_SLIDER_OPTIONS;

	var INDEXES = {
		'schools': 0,
		'volunteers': 1,
		'helpers': 2
	};

	$scope.schools = [];
	$scope.routes = [];
	$scope.volunteers = null;

	var calendars = [];

	$scope.wizard = {
		school: null,
		driver: null,
		route: null,
		helpers: []
	};

	$scope.resizeHelpersList = function () {
		$scope.helpersListStyle = {};
		/* 44 header, 60 helptext, 44 footer */
		var logoHeight = angular.element(document.querySelector('.dapp-logo'))[0].offsetHeight;
		var helpTextHeight = angular.element(document.querySelector('#helptext-helpers'))[0].offsetHeight;
		var height = $window.innerHeight - (44 + logoHeight + helpTextHeight + 44);
		$scope.helpersListStyle['height'] = height + 'px';
	};

	var loadDataBySchool = function (schoolId) {
		Utils.loading();
		$rootScope.loadAllBySchool(schoolId).then(
			function () {
				$scope.routes = StorageSrv.getRoutes();
				if ($scope.routes != null && $scope.routes.length == 1) {
					$scope.wizard.route = $scope.routes[0];
				}
				$scope.volunteers = StorageSrv.getVolunteers();
				calendars = StorageSrv.getVolunteersCalendars();
				$ionicSlideBoxDelegate.update();
				Utils.loaded();
			},
			function (error) {
				console.log(error);
			}
		);
	};

	if ((!Config.IDENTITY.OWNER_ID || !Config.IDENTITY.X_ACCESS_TOKEN) && StorageSrv.getIdentityIndex()) {
		Config.IDENTITY = Config.IDENTITIES[StorageSrv.getIdentityIndex()];
	}

	APISrv.getSchools().then(
		function (schools) {
			$scope.schools = schools;
			if ($scope.schools !== null && $scope.schools.length == 1) {
				$scope.wizard.school = $scope.schools[0];
			}
			if ($scope.wizard.school !== null) {
				loadDataBySchool($scope.wizard.school.objectId);
			}
		},
		function (error) {
			console.log(error);
		}
	);

	$scope.selectSchoolPopup = function () {
		var schoolPopup = $ionicPopup.show({
			templateUrl: 'templates/wizard_popup_school.html',
			title: 'Seleziona la scuola',
			scope: $scope,
			buttons: [{
				text: 'Annulla',
				type: 'button-stable'
            }]
		});

		$scope.selectSchool = function (school) {
			$scope.wizard.school = school;
			StorageSrv.saveSchool(school);
			schoolPopup.close();
			loadDataBySchool($scope.wizard.school.objectId);
		};
	};

	$scope.selectRoutePopup = function () {
		var routePopup = $ionicPopup.show({
			templateUrl: 'templates/wizard_popup_route.html',
			title: 'Seleziona il pedibus',
			scope: $scope,
			buttons: [{
				text: 'Annulla',
				type: 'button-stable'
            }]
		});

		$scope.selectRoute = function (route) {
			$scope.wizard.route = route;
			routePopup.close();
		};
	};

	$scope.selectDriverPopup = function () {
		var driverPopup = $ionicPopup.show({
			templateUrl: 'templates/wizard_popup_driver.html',
			title: 'Chi sei?',
			scope: $scope,
			buttons: [{
				text: 'Annulla',
				type: 'button-stable'
            }]
		});

		$scope.selectDriver = function (driver) {
			$scope.wizard.driver = driver;
			driverPopup.close();
		};
	};

	$scope.$on("wizard:IndexChanged", function (e, wizardIndex, wizardCount) {
		/*if (wizardIndex == INDEXES.schools) {
		    $scope.schools = [StorageSrv.getSchool()];

		    if ($scope.schools !== null && $scope.schools.length == 1) {
		        $scope.wizard.school = $scope.schools[0];
		    }

		    if ($scope.wizard.school !== null) {
		        loadDataBySchool($scope.wizard.school.objectId);
		    }
		}*/
		if (wizardIndex == INDEXES.volunteers) {
			/*
			 * sort volunteers only if route exists but not a driver
			 */
			var route = $scope.wizard.route;
			var sortedVolunteers = $filter('orderBy')(StorageSrv.getVolunteers(), ['checked', 'name']);
			// TODO sort using calendars
			for (var j = 0; j < calendars.length; j++) {
				var cal = calendars[j]
				if (cal.schoolId == StorageSrv.getSchoolId() && cal.routeId == route.objectId) {
					// driver
					var driverOnTop = false;
					if (!!cal.driverId) {
						for (var i = 0; i < sortedVolunteers.length; i++) {
							if (sortedVolunteers[i].objectId == cal.driverId) {
								Utils.moveInArray(sortedVolunteers, i, 0);
								//console.log('Driver ' + sortedVolunteers[counter].name + ' moved on top');
								driverOnTop = true;
								i = sortedVolunteers.length;
							}
						}
					}

					// helpers
					if (!!cal.helperList && cal.helperList.length > 0) {
						var counter = driverOnTop ? 1 : 0;
						cal.helperList.forEach(function (helperId) {
							for (var i = 0; i < sortedVolunteers.length; i++) {
								if (sortedVolunteers[i].objectId == helperId) {
									Utils.moveInArray(sortedVolunteers, i, counter);
									//console.log('Helper ' + sortedVolunteers[counter].name + ' moved to position ' + counter);
									counter++;
									i = sortedVolunteers.length;
								}
							}
						});
					}
					j = calendars.length;
				}
			}
			$scope.volunteers = sortedVolunteers;
		} else if (wizardIndex == INDEXES.helpers) {
			if (!$scope.wizard.driver.wsnId) {
				$scope.wizard.driver.wsnId = CONF.DEV_MASTER;
			}
			$rootScope.driver = $scope.wizard.driver;

			if ($scope.wizard.driver.wsnId !== null && $scope.wizard.driver.wsnId.length > 0) {
				WSNSrv.connectMaster($scope.wizard.driver.wsnId).then(
					function (procedureStarted) {},
					function (reason) {
						// TODO toast for failure
						//Utils.toast('Problema di connessione con il nodo Master!', 5000, 'center');
					}
				);
			}
			$scope.resizeHelpersList();
		}
	});

	$scope.saveWizardChoices = function () {
		// TODO save volunteer in storage after password verification
		$scope.volunteers.forEach(function (vol) {
			if (vol.checked) {
				$scope.wizard.helpers.push(vol);
			}
		});
		Utils.setMenuDriverTitle($scope.wizard.driver.name);

		$ionicHistory.nextViewOptions({
			historyRoot: true
		});
		$state.go('app.route', {
			routeId: $scope.wizard.route.objectId,
			fromWizard: true,
			driver: $scope.wizard.driver,
			route: $scope.wizard.route,
			helpers: $scope.wizard.helpers
		}, {
			reload: true
		});
	};
});
