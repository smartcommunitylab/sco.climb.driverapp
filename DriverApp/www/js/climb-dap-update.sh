#!/bin/sh
#cp -rv ~/workspaces/climb/DriverAppCordovaPlugin/src/* ~/Projects/CLIMB/sco.climb.driverapp/DriverAppCordovaPlugin/src/android/
cd ~/Projects/CLIMB/sco.climb.driverapp/DriverApp
ionic platform remove android && ionic platform add android
cordova plugin remove it.smartcommunitylab.climb.dap && cordova plugin add ../DriverAppCordovaPlugin && ionic build android
