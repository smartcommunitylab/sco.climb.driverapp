// Copyright 2016 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package com.github.google.beaconfig;

import android.Manifest;
import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothManager;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.support.design.widget.FloatingActionButton;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.support.v4.widget.SwipeRefreshLayout;
import android.support.v7.app.AlertDialog;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.support.v7.widget.Toolbar;
import android.util.Log;
import android.view.MotionEvent;
import android.view.View;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.SeekBar;
import android.widget.TextView;

import java.io.File;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import com.github.google.beaconfig.utils.UiUtils;

/**
 * This is the main activity in Beaconfig. It asks for location permissions, turns on bluetooth and
 * initialises the BLE Scanner. Then it scans for nearby beacons and displays the results in a list.
 *
 * Each entry in the list represents a unique beacon with information from several scan results
 * whose information is saved in a BeaconScanData object.
 *
 * On click of any of the list entries, a new activity starts - BeaconConfigActivity. It connects
 * to the beacon and allows per slot configuration of the beacon.
 */
public class ScanningActivity extends AppCompatActivity {
    private static final int LOCATION_PERMISSIONS_REQUEST = 2;
    private static final int STORAGE_PERMISSIONS_REQUEST = 3;

    private static final String TAG = ScanningActivity.class.getSimpleName();

    private BeaconListAdapter beaconsListAdapter;
    private BluetoothAdapter btAdapter;
    private BeaconScanner scanner;

    private SwipeRefreshLayout swipeRefreshLayout;

    private ExecutorService executor;

    private int mAmountOfProgrammedBeacons = 1;

    private Button mMinusOneButton = null, mPlusOneButton = null, mFileButton = null;
    private TextView mAmountOfBeaconsView = null, mRSSISliderView = null, mFilenameTextview = null;
    private SeekBar rssiBar = null;
    private String filePath = null;
    private CheckBox mAutoStopCheckBox = null;

    public int getAmountOfProgrammedBeacon(){
        return mAmountOfProgrammedBeacons;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.i(TAG, "onCreate() called.");

        setContentView(R.layout.activity_main);
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        new SavedConfigurationsManager(this).initialiseConfigurationSaving();
        executor = Executors.newSingleThreadExecutor();

        beaconsListAdapter
                = new BeaconListAdapter(new ArrayList<BeaconScanData>(), getApplication(), this);
        RecyclerView beaconsRecyclerView = (RecyclerView) findViewById(R.id.rv);
        beaconsRecyclerView.setAdapter(beaconsListAdapter);
        beaconsRecyclerView.setLayoutManager(new LinearLayoutManager(getApplicationContext()));

        final FloatingActionButton refresh = (FloatingActionButton) findViewById(R.id.fab);
        refresh.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                scan();
            }
        });

        beaconsRecyclerView.setOnTouchListener(new View.OnTouchListener() {
            @Override
            public boolean onTouch(View view, MotionEvent motionEvent) {
                return swipeRefreshLayout.isRefreshing();
            }
        });

        beaconsRecyclerView.addOnItemTouchListener(new RecyclerView.OnItemTouchListener() {
            @Override
            public boolean onInterceptTouchEvent(RecyclerView rv, MotionEvent e) {
                Log.d(TAG, "On interception touch listener " + swipeRefreshLayout.isRefreshing());
                return swipeRefreshLayout.isRefreshing();
            }

            @Override
            public void onTouchEvent(RecyclerView rv, MotionEvent e) {

            }

            @Override
            public void onRequestDisallowInterceptTouchEvent(boolean disallowIntercept) {

            }
        });

        mAutoStopCheckBox = (CheckBox)findViewById(R.id.autoStopCheckBox);
        mRSSISliderView = (TextView) findViewById(R.id.rssiSliderLabel);
        mAmountOfBeaconsView = (TextView) findViewById(R.id.beaconNumberTextView);

        mFilenameTextview = (TextView) findViewById(R.id.filenameTextview);
        mMinusOneButton = (Button) findViewById(R.id.minusOneButton);
        mMinusOneButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                if(mAmountOfProgrammedBeacons > 1) {
                    mAmountOfProgrammedBeacons--;
                    Context context = getApplicationContext();
                    SharedPreferences sharedPref = context.getSharedPreferences("com.example.myapp.PREFERENCE_FILE_KEY", Context.MODE_PRIVATE);
                    SharedPreferences.Editor editor = sharedPref.edit();
                    editor.putInt("com.github.google.beaconfig.AmountOfProgrammedBeacons", mAmountOfProgrammedBeacons);
                    editor.commit();
                    mAmountOfBeaconsView.setText("" + mAmountOfProgrammedBeacons);
                }
            }
        });

        mPlusOneButton = (Button) findViewById(R.id.plusOneButton);
        mPlusOneButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                mAmountOfProgrammedBeacons++;
                Context context = getApplicationContext();
                SharedPreferences sharedPref = context.getSharedPreferences( "com.example.myapp.PREFERENCE_FILE_KEY" , Context.MODE_PRIVATE);
                SharedPreferences.Editor editor = sharedPref.edit();
                editor.putInt("com.github.google.beaconfig.AmountOfProgrammedBeacons", mAmountOfProgrammedBeacons);
                editor.commit();
                mAmountOfBeaconsView.setText(""+mAmountOfProgrammedBeacons);
            }
        });

        rssiBar = (SeekBar) findViewById(R.id.rssiSeekBar);
        rssiBar.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar rssiBar, int progresValuePercent, boolean fromUser) {
                int mRssiThresholddBm = Constants.RSSI_THRESHOLD_MIN + progresValuePercent*(Constants.RSSI_THRESHOLD_MAX - Constants.RSSI_THRESHOLD_MIN)/rssiBar.getMax();

                Context context = getApplicationContext();
                SharedPreferences sharedPref = context.getSharedPreferences( "com.example.myapp.PREFERENCE_FILE_KEY" , Context.MODE_PRIVATE);
                SharedPreferences.Editor editor = sharedPref.edit();
                editor.putInt("com.github.google.beaconfig.RssiThresholddBm", mRssiThresholddBm);
                editor.commit();
                if(scanner != null) {
                    scanner.setRSSIThreshold(mRssiThresholddBm);
                }
                mRSSISliderView.setText("RSSI Threshold: " + mRssiThresholddBm + "dBm");
            }

            @Override
            public void onStartTrackingTouch(SeekBar rssiBar) {

            }

            @Override
            public void onStopTrackingTouch(SeekBar rssiBar) {

            }
        });

        mFileButton = (Button) findViewById(R.id.fileButton);
        mFileButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                requestFile();
            }
        });

        setUpThrobber();
    }
    @Override
    protected void onStart() {
        super.onStart();

        Log.i(TAG, "onStart() called.");
    }

    @Override
    protected void onPause(){
        super.onPause();

        Log.i(TAG, "onPause() called.");
    }

    @Override
    protected void onResume(){
        super.onResume();

        checkRequiredPermissions();

        Context context = this.getApplicationContext();
        SharedPreferences sharedPref = context.getSharedPreferences( "com.example.myapp.PREFERENCE_FILE_KEY" , Context.MODE_PRIVATE);
        mAmountOfProgrammedBeacons = sharedPref.getInt("com.github.google.beaconfig.AmountOfProgrammedBeacons",1);

        mAmountOfBeaconsView.setText(""+mAmountOfProgrammedBeacons); //the same initial value is hardcoded in BeaconScanner.java

        int mRssiThresholddBm =  sharedPref.getInt("com.github.google.beaconfig.RssiThresholddBm",Constants.RSSI_THRESHOLD_DEFAULT);
        if(mRssiThresholddBm > Constants.RSSI_THRESHOLD_MAX || mRssiThresholddBm < Constants.RSSI_THRESHOLD_MIN){
            mRssiThresholddBm = Constants.RSSI_THRESHOLD_DEFAULT;
            SharedPreferences.Editor editor = sharedPref.edit();
            editor.putInt("com.github.google.beaconfig.RssiThresholddBm", mRssiThresholddBm);
            editor.commit();
        }
        mRSSISliderView.setText("RSSI Threshold: "+ mRssiThresholddBm + "dBm");

        filePath = sharedPref.getString("com.github.google.beaconfig.FilePath", null);

        if(!checkConfFile(filePath)) {
            filePath = null;
        }

        try{
            int start_char = filePath.lastIndexOf('/');

            if(filePath.length() > 150) {
                String title_label = filePath.substring(start_char + 1, start_char + 1 + Math.min(filePath.length() - start_char - 1, 20));
                mFilenameTextview.setText("File: " + title_label);
            }else{
                mFilenameTextview.setText("File: " + filePath);
            }
        }catch (Exception e){
            mFilenameTextview.setText("File: ND");
        }

        try {
            int start_char = filePath.lastIndexOf('/');
            String title_label = filePath.substring(start_char+1, start_char+1+Math.min(filePath.length()-start_char, 15));
            mFileButton.setText("FILE:\n"+title_label);
        }catch (Exception e){
            mFileButton.setText("File Select");
        }

        int progress = (int)( (mRssiThresholddBm - Constants.RSSI_THRESHOLD_MIN)/(((float)(Constants.RSSI_THRESHOLD_MAX - Constants.RSSI_THRESHOLD_MIN))/rssiBar.getMax()));
        rssiBar.setProgress(progress);

        Log.i(TAG, "onResume() called.");
    }
    /**
     * Attempts to scan for beacons. First checks whether bluetooth is turned on and deals with
     * the case when it is not. During this, the screen is disabled and the swipeRefreshLayout is
     * refreshing.
     */
    private void scan() {
        Log.d(TAG, "Scanning...");
        if (btAdapter == null || !btAdapter.isEnabled()) {
            requestBluetoothOn();
        } else {
            swipeRefreshLayout.post(new Runnable() {
                @Override
                public void run() {
                    swipeRefreshLayout.setRefreshing(true);
                }
            });
            findViewById(R.id.grey_out_slot).setVisibility(View.VISIBLE);
            UiUtils.showToast(this, "Scanning...");

            executor.submit(new Runnable() {
                @Override
                public void run() {
                    if(mAutoStopCheckBox.isChecked()) {
                        scanner.scan(1);
                    }else{
                        scanner.scan(-1);
                    }
                }
            });
        }
    }

    /**
     * Callback for when the scan has finished. This enables the screen again and informs the
     * RecyclerViewAdapter that new data is available to be displayed.
     *
     * @param scanDataList the information gathered about each beacon over the whole time of the
     *                     scan.
     */
    public void scanComplete(final List<BeaconScanData> scanDataList) {
        Log.d(TAG, "Scanning complete.");
        Collections.sort(scanDataList, new Comparator<BeaconScanData>() {
            @Override
            public int compare(BeaconScanData b1, BeaconScanData b2) {
                return (b2.rssi - b1.rssi);
            }
        });


        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                beaconsListAdapter.setData(scanDataList);
                swipeRefreshLayout.post(new Runnable() {
                    @Override
                    public void run() {
                        swipeRefreshLayout.setRefreshing(false);
                        findViewById(R.id.grey_out_slot).setVisibility(View.GONE);
                        String message = scanDataList.size() + " results were found";
                        UiUtils.showToast(ScanningActivity.this,message);
                    }
                });
            }
        });
    }

    private void setupScanner() {
        Log.d(TAG, "Setting up scanner...");
        BluetoothManager manager = (BluetoothManager) getApplicationContext()
                .getSystemService(Context.BLUETOOTH_SERVICE);
        btAdapter = manager.getAdapter();

        requestBluetoothOn();
    }

    private void requestBluetoothOn() {
        if (btAdapter == null || !btAdapter.isEnabled()) {
            Log.d(TAG, "Bluetooth not enabled, requesting permission.");
            Intent enableBtIntent = new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE);
            this.startActivityForResult(enableBtIntent, Constants.REQUEST_ENABLE_BLUETOOTH);
        } else if (scanner == null) {
            scanner = new BeaconScanner(this, btAdapter);
            scanner.setRSSIThreshold(Constants.RSSI_THRESHOLD_DEFAULT);
            mRSSISliderView.setText("RSSI Threshold: "+scanner.getRSSIThreshold() + "dBm");
            scan();
        }
    }

    private void checkRequiredPermissions() {
        boolean permissions_ok = true;
        String[] permissionsReq = null;
        Log.d(TAG, "Getting Permissions...");

        if( ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED ) { //if the storage permission have been removed clear filepath locally and in the permanent storage
            filePath = null;

            Context context = getApplicationContext();
            SharedPreferences sharedPref = context.getSharedPreferences( "com.example.myapp.PREFERENCE_FILE_KEY" , Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = sharedPref.edit();
            editor.remove("com.github.google.beaconfig.FilePath");

            mAmountOfProgrammedBeacons = 1;
            editor.putInt("com.github.google.beaconfig.AmountOfProgrammedBeacons", mAmountOfProgrammedBeacons);
            editor.commit();
            mAmountOfBeaconsView.setText(""+mAmountOfProgrammedBeacons);
        }

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED ) {
            permissionsReq = new String[]{Manifest.permission.ACCESS_COARSE_LOCATION};

            permissions_ok = false;
        }

        if(permissions_ok) { //both permissions are already ok!
            setupScanner();
        }else{
            ActivityCompat.requestPermissions(this, permissionsReq, LOCATION_PERMISSIONS_REQUEST);
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        Log.i(TAG, "onActivityResult() called with request code: " + requestCode);
        if (requestCode == Constants.REQUEST_ENABLE_BLUETOOTH) {
            if (resultCode == Activity.RESULT_OK) {
                Log.d(TAG, "Bluetooth enable permission granted.");
                scanner = new BeaconScanner(this, btAdapter);
                scanner.setRSSIThreshold(Constants.RSSI_THRESHOLD_DEFAULT);
                mRSSISliderView.setText("RSSI Threshold: "+scanner.getRSSIThreshold() + "dBm");
                scan();
            } else {
                Log.d(TAG, "Bluetooth enable permission denied. Closing...");
                showFinishingAlertDialog("Bluetooth is required",
                        "App will close since the permission was denied");
            }
        }

        if (requestCode == Constants.REQUEST_FILE) {
            if (resultCode == Activity.RESULT_OK) {
                if (data != null) {
                    filePath = data.getData().getPath();

                    if(!checkConfFile(filePath)) {
                        filePath = null;
                        Log.w(TAG, "the log file didn't pass the check! It may be in the wrong format or the path may be not compatible");
                        UiUtils.showToast(this, "File not valid!");
                    }

                    Context context = getApplicationContext();
                    SharedPreferences sharedPref = context.getSharedPreferences( "com.example.myapp.PREFERENCE_FILE_KEY" , Context.MODE_PRIVATE);
                    SharedPreferences.Editor editor = sharedPref.edit();
                    editor.putString("com.github.google.beaconfig.FilePath", filePath);

                    mAmountOfProgrammedBeacons = 1;
                    editor.putInt("com.github.google.beaconfig.AmountOfProgrammedBeacons", mAmountOfProgrammedBeacons);
                    editor.commit();
                    mAmountOfBeaconsView.setText(""+mAmountOfProgrammedBeacons);
                }
            }
        }

        if (requestCode == Constants.REQUEST_PROGRAM_BEACON){
            Log.i(TAG, "REQUEST_PROGRAM_BEACON!!, resultCode: " + resultCode);
            if(resultCode == Activity.RESULT_OK){
                mAmountOfProgrammedBeacons++;
                Context context = getApplicationContext();
                SharedPreferences sharedPref = context.getSharedPreferences( "com.example.myapp.PREFERENCE_FILE_KEY" , Context.MODE_PRIVATE);
                SharedPreferences.Editor editor = sharedPref.edit();
                editor.putInt("com.github.google.beaconfig.AmountOfProgrammedBeacons", mAmountOfProgrammedBeacons);
                editor.commit();
            }else{

            }

            scan();
        }
    }

    @Override
    public void onRequestPermissionsResult(int code, String permissions[], int[] grantResults) {
        switch (code) {
            case LOCATION_PERMISSIONS_REQUEST:
                if (grantResults.length > 0
                        && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    setupScanner();
                    Log.d(TAG, "PERMISSION_REQUEST_COARSE_LOCATION granted");
                } else {
                    showFinishingAlertDialog("Coarse location access is required",
                            "App will close since the permission was denied");
                }
                break;
            case STORAGE_PERMISSIONS_REQUEST:
                if (grantResults.length > 0
                        && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    showFilePicker();
                    Log.d(TAG, "STORAGE_PERMISSIONS_REQUEST granted");
                } else {
                    new AlertDialog.Builder(this).setTitle("Storage access is required for configuration file").setMessage("App will work without configuration file since the permission was denied").setPositiveButton("OK", new DialogInterface.OnClickListener() {
                                @Override
                                public void onClick(DialogInterface dialogInterface, int i) {
                                    //finish();
                                }
                            }).show();
                }
        }
    }

    private void showFinishingAlertDialog(String title, String message) {
        new AlertDialog.Builder(this).setTitle(title).setMessage(message)
                .setPositiveButton("OK", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialogInterface, int i) {
                        finish();
                    }
                }).show();
    }

    private void setUpThrobber() {
        swipeRefreshLayout = (SwipeRefreshLayout) findViewById(R.id.throbber);
        swipeRefreshLayout.setOnRefreshListener(new SwipeRefreshLayout.OnRefreshListener() {
            @Override
            public void onRefresh() {
                scan();
            }
        });
        swipeRefreshLayout.setColorSchemeResources(android.R.color.holo_blue_bright,
                android.R.color.holo_green_light,
                android.R.color.holo_orange_light,
                android.R.color.holo_red_light);
    }

    private void requestFile() {

        if( ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED ){
            String[] permissionsReq = new String[]{Manifest.permission.READ_EXTERNAL_STORAGE};
            ActivityCompat.requestPermissions(this, permissionsReq, STORAGE_PERMISSIONS_REQUEST);
        }else{
            showFilePicker();
        }
    }

    private void showFilePicker(){
        Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("text/csv");

        startActivityForResult(intent, Constants.REQUEST_FILE );
    }

    public String getFilePath(){
        return filePath;
    }

    private boolean checkConfFile(String filePath){
        EddystoneConfigFileManager mEddystoneConfigFileManager = new EddystoneConfigFileManager(filePath);
        BeaconConfiguration firstBeacon = mEddystoneConfigFileManager.getConfig(1);

        if(firstBeacon != null){
            return true;
        }else{
            return false;
        }
    }
}
