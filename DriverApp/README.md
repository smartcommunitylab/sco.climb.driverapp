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
- ionic cordova platform add ios@4.5.5

4. Compile/run
- ionic cordova run android
- ionic cordova run ios

#iOS Configuration
For iOS, GooglePlus Plugin uses Cocoapods.

- check cocoapods installed
- create the following Podfile in platform/ios

        # Uncomment the next line to define a global platform for your project
        platform :ios, '9.0'

        target 'CLIMB Driver App' do
        # Comment the next line if you don't want to use dynamic frameworks
        use_frameworks!

        # Pods for CLIMB Driver App
        pod 'GoogleSignIn', '~> 4.4'
        pod 'GoogleUtilities', '~> 6.2.3'
        pod 'FBSDKCoreKit', '~> 5.2.3'
        pod 'FBSDKLoginKit', '~> 5.2.3'
        pod 'FBSDKShareKit', '~> 5.2.3'
        end

- run the following command from platform/ios: pod install
- in XCode, in CLIMB Driver App -> PROJECT -> Info -> Configurations, make sure that Debug/CLIMB Driver App/CLIMB Driver App points to Pods-CLIMB Driver App.debug. Same for Release.