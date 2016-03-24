angular.module('driverapp.services.log', [])

.factory('LogSrv', function ($q, Config) {
    var logService = {};

    logService.init = function () {
        if (!!window.logToFile) {
            window.logToFile.getLogfilePath(
                function (logfilePath) {
                    window.logToFile.setLogfilePath(
                        Config.LOGFILE_PATH,
                        function () {
                            logService.log('+++ APPLICATION STARTED (resumed) +++');
                        },
                        function (err) {
                            console.log('getLogfilePath error: ' + err);
                        }
                    );
                },
                function (err) {
                    console.log('getLogfilePath error: ' + err);
                    window.logToFile.setLogfilePath(
                        Config.LOGFILE_PATH,
                        function () {
                            logService.log('+++ APPLICATION STARTED +++');
                        },
                        function (err) {
                            console.log('getLogfilePath error: ' + err);
                        }
                    );
                }
            );
        }
    };

    logService.log = function (text, level) {
        if (!level) {
            level = 'info';
        }

        if ((level != 'debug' && level != 'info' && level != 'warn' && level != 'error') || !text || text.length == 0) {
            return;
        }

        if (!!window.logToFile) {
            window.logToFile.getLogfilePath(
                function (logfilePath) {
                    window.logToFile[level](text);
                },
                function (err) {
                    console.log('LogToFile failed: ' + err);
                }
            );
        }
    }

    return logService;
});
