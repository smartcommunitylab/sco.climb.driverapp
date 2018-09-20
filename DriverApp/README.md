# Smart Community CLIMB Piedibus Smart App

## Installation / Recovery

Requires:
- Cordova 8+
- Android SDK 27+

1. Remove platforms
- ionic cordova platform rm android
- ionic cordova platform rm ios

2. Clean the plugins directory (delete everything inside the DriverApp\plugins folder). Synchronize packages (npm install)

3. Add platforms
- ionic cordova platform add android@6.4.0
- ionic cordova platform add ios@4.5.4

4. Compile/run
- ionic cordova run android
- ionic cordova run ios



