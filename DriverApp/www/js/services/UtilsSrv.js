angular.module('driverapp.services.utils', [])

.factory('Utils', function (Config) {
    var Utils = {};

    Utils.isValidDate = function (dateString) {
        return moment(dateString, Config.getDateFormat(), true).isValid();
    };

    Utils.isValidDateRange = function(dateFromString, dateToString) {
        var dateFromValid = moment(dateFromString, Config.getDateFormat(), true).isValid();
        var dateToValid = moment(dateToString, Config.getDateFormat(), true).isValid();
        var rightOrder = moment(dateFromString).isSameOrBefore(dateToString);
        return (dateFromValid && dateToValid && rightOrder);
    };

    return Utils;
});
