# Cordova CLIMB Driver App plugin
Remember to create a file ```platforms/android/build-extras.gradle``` with these options:
```
ext.postBuildExtras = {
    android {
        compileOptions {
            sourceCompatibility JavaVersion.VERSION_1_7
            targetCompatibility JavaVersion.VERSION_1_7
        }
    }
}
```