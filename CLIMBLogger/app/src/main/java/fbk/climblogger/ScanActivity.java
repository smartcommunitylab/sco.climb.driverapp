package fbk.climblogger;

import android.app.Activity;
import android.app.Dialog;
import android.app.DialogFragment;
import android.app.TimePickerDialog;
import android.bluetooth.BluetoothAdapter;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.ServiceConnection;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;
import android.os.SystemClock;
import android.os.Vibrator;
import android.util.Log;
import android.view.View;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.ExpandableListAdapter;
import android.widget.ExpandableListView;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.TimePicker;
import android.widget.Toast;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;

public class ScanActivity extends Activity {

    private final static String TAG = "ScanActivity_GIOVA";
    private Button mInitButton,mDeinitButton,mTagButton;
    private TextView mFilenameTextView;
    private CheckBox packetLogCheckBox;
    private Vibrator mVibrator;
    private fbk.climblogger.ClimbServiceInterface mClimbService;
    private Context mContext = null;
    private EditText mConsole = null;
    static final int BATTERY_CHECK_INTERVAL_MS = 50000;
    static final int UI_UPDATE_INTERVAL_MS = 100;
    static private boolean firstServiceConnection = true;
    private static ServiceConnection mServiceConnection = null;
    private static String fileName = null;
    ExpandableListView expandableListView;
    MyExpandableListAdapter expandableListAdapter;

    private final BroadcastReceiver mClimbUpdateReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            final String action = intent.getAction();

            if (fbk.climblogger.ClimbServiceInterface.ACTION_DEVICE_ADDED_TO_LIST.equals(action)) {

                updateDetailsExpandableListDetails();
                expandableListAdapter.notifyDataSetChanged();
                Log.i(TAG,"ACTION_DEVICE_ADDED_TO_LIST broadcast received");

            } else if (fbk.climblogger.ClimbServiceInterface.ACTION_DEVICE_REMOVED_FROM_LIST.equals(action)) {

                expandableListAdapter.notifyDataSetChanged();
                Log.i(TAG,"ACTION_DEVICE_REMOVED_FROM_LIST broadcast received");

            }else if (fbk.climblogger.ClimbServiceInterface.ACTION_METADATA_CHANGED.equals(action)) {

            }
            else if (fbk.climblogger.ClimbSimpleService.ACTION_DATALOG_ACTIVE.equals(action)) {
                fileName = intent.getStringExtra(fbk.climblogger.ClimbSimpleService.EXTRA_STRING);

                if(fileName != null && fileName.length() >= 1) {
                    mFilenameTextView.setText(fileName);
                }
                log("Datalog active on file: "+fileName);
            }else if (fbk.climblogger.ClimbSimpleService.ACTION_DATALOG_INACTIVE.equals(action)) {
                log("Datalog stopped");
            }
            else if (fbk.climblogger.ClimbServiceInterface.ACTION_NODE_ALERT.equals(action)) {
            }
            else if (action.equals(BluetoothAdapter.ACTION_STATE_CHANGED)) {
                final int state = intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR);
                Log.i(TAG,"Bluetooth_State_change, new state: " + state);
                switch (state) {
                    case BluetoothAdapter.STATE_OFF:
                        break;
                    case BluetoothAdapter.STATE_TURNING_OFF:
                        if(mClimbService != null) {
                            mClimbService.deinit();
                        }
                        break;
                    case BluetoothAdapter.STATE_ON:
                        if(mClimbService != null) {
                            //mClimbService.deinit(); //workaround. deinit() should be called on STATE_TURNING_OFF or STATE_OFF events, but stopScan on some devices throws 'IllegalStateException: BT Adapter is not turned ON'
                            if(mClimbService.init()){
                                Log.w(TAG,"init() failed");
                            }
                        }
                        break;
                    case BluetoothAdapter.STATE_TURNING_ON:
                        break;
                }
            }
        }
    };



    View.OnClickListener initButtonHandler = new View.OnClickListener(){
        public void onClick(View v) {
            if(mClimbService != null){
                if (mClimbService.init()) {
                    Log.w(TAG,"manual init() failed");
                    mVibrator.vibrate(fbk.climblogger.ConfigVals.vibrationTimeout);
                    Log.i(TAG, "Service, ble and logging initialized!");
                    log("Service, ble and logging initialized!");
                } else {
                    Log.i(TAG, "Failed to initialize Service, ble or logging!");
                    log("Failed to initialize Service, ble or logging!");
                }
            }else{
                Log.i(TAG, "Not initialized: service not available!");
                log("Not initialized: service not available!");
            }

        }
    };

    View.OnClickListener deinitButtonHandler = new View.OnClickListener(){
        public void onClick(View v) {

            if(mClimbService != null){
                mVibrator.vibrate(fbk.climblogger.ConfigVals.vibrationTimeout);
                if(mClimbService.deinit()){ //deinit() returns true if the deinitialization was successful
                    Log.w(TAG,"manual deinit() failed");
                }
                Log.i(TAG, "Stop scan!");
                log("Stop scan command sent!");
            }else{
                Log.i(TAG, "Stop scan not sent!");
                log("Stop scan not sent!");
            }


        }
    };

    View.OnClickListener tagButtonHandler = new View.OnClickListener(){
        public void onClick(View v) {
            if(mClimbService != null){
                if(((fbk.climblogger.ClimbSimpleService)mClimbService).insertTag("Manually_inserted_tag")){
                    mVibrator.vibrate(fbk.climblogger.ConfigVals.vibrationTimeout);
                    log("Tag Inserted!");
                }else{
                    log("Tag not inserted! Something went wrong in ClimbService!");
                }

            }else{
                Log.i(TAG, "Tag not inserted! mClimbService == null");
                log("Tag not inserted! mClimbService == null");
            }
        }
    };

    View.OnClickListener mPacketLogCheckBoxCheckBoxOnClickListener = new View.OnClickListener(){
        public void onClick(View v) {
            if (mClimbService != null) {
                if(packetLogCheckBox.isChecked()) {
                    ((fbk.climblogger.ClimbSimpleService)mClimbService).enablePacketLog();
                }else{
                    ((fbk.climblogger.ClimbSimpleService)mClimbService).disablePacketLog();
                }
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_scan);

        mContext = this.getApplicationContext();
        //mConsole = (EditText) findViewById(R.id.console_item);

        //listView = (ListView) findViewById(R.id.list);

        mInitButton = (Button) findViewById(R.id.buttonInit);
        mInitButton.setOnClickListener(initButtonHandler);


        mDeinitButton = (Button) findViewById(R.id.buttonDeinit);
        mDeinitButton.setOnClickListener(deinitButtonHandler);

        mTagButton = (Button) findViewById(R.id.buttonTag);
        mTagButton.setOnClickListener(tagButtonHandler);

        mVibrator = (Vibrator) this.getSystemService(VIBRATOR_SERVICE);

        expandableListView = (ExpandableListView) findViewById(R.id.list);

        Intent climbServiceIntent = new Intent(ScanActivity.this, fbk.climblogger.ClimbSimpleService.class); //capire come si comporta nel caso in qui il servizio sia ancora in esecuzione in background
        startService(climbServiceIntent);

        mFilenameTextView = (TextView)findViewById(R.id.filenameTextBox);

        packetLogCheckBox = (CheckBox)findViewById(R.id.pkt_log_ckbox);
        packetLogCheckBox.setOnClickListener(mPacketLogCheckBoxCheckBoxOnClickListener);

        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                updateUI(true); //start the UI update
            }
        });

        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                checkBatteries(); //start the batteries check
            }
        });
    }


    @Override
    protected void onStart() {
        super.onStart();


    }
    @Override
    protected void onResume() {
        super.onResume();
        Log.i(TAG, "ScanActivity.onResume() called.");
        log("ScanActivity.onResume() called.");

        // Code to manage Service lifecycle.
        mServiceConnection = new ServiceConnection() {
            @Override //Questa è usata per ritornare l'oggetto IBinder (c'è solo nei bound services)
            public void onServiceConnected(ComponentName componentName, IBinder service) {
                mClimbService = ((fbk.climblogger.ClimbSimpleService.LocalBinder) service).getService();
                mClimbService.setContext(mContext);
                //IN QUESTO PUNTO RICHIEDI LA LISTA DI DISPOSITIVI INIZIALI PER INSERIRLA NELLA LISTVIEW
                expandableListAdapter = new MyExpandableListAdapter(mContext, mClimbService);
                expandableListView.setAdapter(expandableListAdapter);

                if(expandableListAdapter.getGroupCount() > 0) { //automatically open the first group
                    expandableListView.expandGroup(0);
                }

                Log.i(TAG, "Service connected!");

                if(packetLogCheckBox.isChecked()) {
                    ((fbk.climblogger.ClimbSimpleService)mClimbService).enablePacketLog();
                }else{
                    ((fbk.climblogger.ClimbSimpleService)mClimbService).disablePacketLog();
                }

                if(firstServiceConnection) {
                    firstServiceConnection = false;
                    if (mClimbService != null) {
                        if (mClimbService.init()) {
                            Log.i(TAG, "Start scan with data logging!");
                            log("Start scan with data logging command sent!");
                        } else {
                            Log.i(TAG, "Failed to start scan!");
                            log("Failed to start scan!");
                        }
                    } else {
                        Log.i(TAG, "Start scan not sent: service not available!");
                        log("Start scan not sent!");
                    }
                }
            }

            @Override
            public void onServiceDisconnected(ComponentName componentName) {
                mClimbService = null;
                Log.i(TAG,"Service disconnected!");
            }
        };

        //INIZIALIZZA IL BIND
        Intent climbServiceIntent = new Intent(ScanActivity.this, fbk.climblogger.ClimbSimpleService.class); //capire come si comporta nel caso in qui il servizio sia ancora in esecuzione in background
        bindService(climbServiceIntent, mServiceConnection, BIND_AUTO_CREATE);

        registerReceiver(mClimbUpdateReceiver, makeClimbServiceIntentFilter());

        if(fileName != null && fileName.length() >= 1) {
            mFilenameTextView.setText(fileName);
        }

    }

    @Override
    protected void onPause() {
        Log.i(TAG, "ScanActivity.onPause() called.");
        log("ScanActivity.onPause() called.");
        unregisterReceiver(mClimbUpdateReceiver);
        unbindService(mServiceConnection);
        mServiceConnection = null;

        super.onPause();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        Log.i(TAG, "ScanActivity.onDestroy() called.");
        log("ScanActivity.onDestroy() called.");
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.menu_scan, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        // Handle action bar item clicks here. The action bar will
        // automatically handle clicks on the Home/Up button, so long
        // as you specify a parent activity in AndroidManifest.xml.
        int id = item.getItemId();

        //noinspection SimplifiableIfStatement
        if (id == R.id.action_settings) {
            return true;
        }

        return super.onOptionsItemSelected(item);
    }

    private void updateDetailsExpandableListDetails(){
    }

    private void updateUI(boolean autoSchedule){
        if(expandableListAdapter != null) {
            updateDetailsExpandableListDetails();
            expandableListAdapter.notifyDataSetChanged();
        }

        if(autoSchedule) {
            Handler h = new Handler();
            h.postDelayed(new Runnable() {
                @Override
                public void run() {
                    updateUI(true);
                }
            },UI_UPDATE_INTERVAL_MS);
        }
    }

    private void checkBatteries(){
        if(mClimbService != null) {
            fbk.climblogger.ClimbServiceInterface.NodeState[] nss = mClimbService.getNetworkState();
            String[] lowBatt_ids = new String[nss.length];
            int ids_idx = 0;
            for (int i = 0; i < nss.length; i++) {
                if (nss[i].batteryLevel == 1) {
                    lowBatt_ids[ids_idx] = nss[i].nodeID;
                    ids_idx++;
                }
            }

            if (ids_idx > 0) {
                String alertString = "Battery low on nodes: 0x";
                for (int i = 0; i < ids_idx; i++) {
                    alertString += lowBatt_ids[i];
                    if (i != ids_idx - 1) {
                        alertString += ", 0x";
                    }
                }
                Toast.makeText(getApplicationContext(),
                        alertString,
                        Toast.LENGTH_SHORT).show();
            }
        }

        Handler h = new Handler();
        h.postDelayed(new Runnable() {
            @Override
            public void run() {
                checkBatteries();
            }
        }, BATTERY_CHECK_INTERVAL_MS);
    }


    private void log(final String txt) {
        if(mConsole == null) return;

        final String timestamp = new SimpleDateFormat("HH:mm:ss.SSS").format(new Date());
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                mConsole.setText(timestamp + " : " + txt + "\n" + mConsole.getText());
            }
        });
    }

    private static IntentFilter makeClimbServiceIntentFilter() {
        final IntentFilter intentFilter = new IntentFilter();
        intentFilter.addAction(fbk.climblogger.ClimbSimpleService.ACTION_DATALOG_ACTIVE);
        intentFilter.addAction(fbk.climblogger.ClimbSimpleService.ACTION_DATALOG_INACTIVE);
        intentFilter.addAction(fbk.climblogger.ClimbServiceInterface.ACTION_METADATA_CHANGED);
        intentFilter.addAction(fbk.climblogger.ClimbServiceInterface.ACTION_DEVICE_ADDED_TO_LIST);
//        intentFilter.addAction(fbk.climblogger.ClimbServiceInterface.STATE_CONNECTED_TO_CLIMB_MASTER);
//        intentFilter.addAction(fbk.climblogger.ClimbServiceInterface.STATE_DISCONNECTED_FROM_CLIMB_MASTER);
        intentFilter.addAction(fbk.climblogger.ClimbServiceInterface.ACTION_DEVICE_REMOVED_FROM_LIST);
        intentFilter.addAction(fbk.climblogger.ClimbServiceInterface.ACTION_NODE_ALERT);
//        intentFilter.addAction(fbk.climblogger.ClimbServiceInterface.STATE_CHECKEDIN_CHILD);
//        intentFilter.addAction(fbk.climblogger.ClimbServiceInterface.STATE_CHECKEDOUT_CHILD);
        intentFilter.addAction(BluetoothAdapter.ACTION_STATE_CHANGED);
        return intentFilter;
    }



}
