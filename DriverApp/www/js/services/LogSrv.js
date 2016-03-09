angular.module('driverapp.services.log', [])

.factory('LogSrv', function ($q, Config) {
    var logService = {};

    logService.init = function () {
        if (!!window.logToFile) {
            window.logToFile.getLogfilePath(
                function (logfilePath) {},
                function (err) {
                    window.logToFile.setLogfilePath(
                        Config.LOGFILE_PATH,
                        function () {},
                        function (err) {}
                    );
                }
            );
        }
    };

    logService.log = function (text, level) {
        if (!level) {
            level = 'debug';
        }

        if (level != 'debug' || level != 'info' || level != 'warn' | level != 'error' || !text || text.length == 0) {
            return;
        }

        if (!!window.logToFile) {
            window.logToFile.getLogfilePath(
                function (logfilePath) {
                    window.logToFile[level](text);
                },
                function (err) {}
            );
        }
    }

    logService.init();

    return logService;
});
