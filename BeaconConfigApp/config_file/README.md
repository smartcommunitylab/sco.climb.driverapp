This folder contains the example of the configuration file for automatic Eddystone programming

The configuration file is a CSV file with ";" as separator
All the lines that do no start with a number are skipped. The name is only used to highlight which node has been programmed, no reference to the name string is written in the beacon.
The app automatically checks for known password (all x00s all xFFs, blueUp default password). However if it is provided in the config file, the app first tries the provided one and eventually the others.
