#!/bin/sh
#cp -rv ~/workspaces/climb/DriverAppCordovaPlugin/src/* ~/Projects/CLIMB/sco.climb.driverapp/DriverAppCordovaPlugin/src/android/
cd /Users/admin/Documents/Projects/climb/sco.climb.driverapp/DriverApp
cordova plugin remove it.smartcommunitylab.climb.dap && cordova plugin add ../DriverAppCordovaPlugin --nofetch && ionic run android
