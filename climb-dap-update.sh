#!/bin/sh
cd ~.DriverApp
ionic platform remove ios && ionic platform add iOS
cordova plugin remove it.smartcommunitylab.climb.dap && cordova plugin add ../DriverAppCordovaPlugin && ionic build ios
