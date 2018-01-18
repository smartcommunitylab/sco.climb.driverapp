#!/bin/sh
cd ~/Projects/CLIMB/sco.climb.driverapp/DriverApp
ionic platform remove android && ionic platform add android
cordova plugin remove it.smartcommunitylab.climb.dap
cordova plugin add ../DriverAppCordovaPlugin
ionic build android --release
cp platforms/android/build/outputs/apk/android-armv7-release-unsigned.apk ~/dev/android/build
cd ~/dev/android/build
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore scoprod.keystore -storepass q8e@n-pj android-armv7-release-unsigned.apk riciclotn
jarsigner -verify -certs -verbose android-armv7-release-unsigned.apk
rm android-release.apk
../../android-sdk-linux/build-tools/23.0.3/zipalign -v 4 android-armv7-release-unsigned.apk android-release.apk
