#!/usr/bin/env node

// this plugin replaces arbitrary text in arbitrary files
//
// Look for the string CONFIGURE HERE for areas that need configuration
//
require('shelljs/global');

var fs = require('fs');
var path = require('path');

var rootdir = process.argv[2];
var currentProfileFile = path.join(rootdir, "config", "current_profile.txt");
var target = fs.readFileSync(currentProfileFile, 'utf8')
console.log("il target è " + target);
if (rootdir) {
  //./config/profiles.json is the file that have all the placeholder value for each profile
  var profilesFile = path.join(rootdir, "config", "profiles.json");
  var configobj = JSON.parse(fs.readFileSync(profilesFile, 'utf8'));
  var REVERSED_CLIENT_ID = configobj[target]["REVERSED_CLIENT_ID"];
  console.log("replace key: REVERSED_CLIENT_ID with val: " + REVERSED_CLIENT_ID);
  var APP_ID = configobj[target]["APP_ID"];
  console.log("replace key: APP_ID with val: " + APP_ID);
  var APP_NAME = configobj[target]["APP_NAME"];
  console.log("replace key: APP_NAME with val: " + APP_NAME);

  exec('cordova plugin rm cordova-plugin-googleplus');
  exec('cordova plugin add https://github.com/EddyVerbruggen/cordova-plugin-googleplus --variable REVERSED_CLIENT_ID=' + REVERSED_CLIENT_ID);
  exec('cordova plugin rm cordova-plugin-facebook4');
  exec('cordova plugin add cordova-plugin-facebook4 --variable APP_ID=' + APP_ID + ' --variable APP_NAME=' + APP_NAME);
}
