package fbk.climblogger;

import android.app.Activity;
import android.app.Dialog;
import android.app.DialogFragment;
import android.app.TimePickerDialog;
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
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;

public class ScanActivity extends Activity {

    private final static String TAG = "ScanActivity_GIOVA";
    private Button mInitButton,mDeinitButton,mTagButton,mCheckInAllButton,mCheckOutAllButton,mCheckInBcastButton,mCheckOutBcastButton,mScheduleWUButton;//,mReleaseCmdButton;
    private TextView mFilenameTextView;
    private CheckBox mMaintenanceCheckBox;
    private Vibrator mVibrator;
    private int index = 0;
    private List<String> allowedChidren = new ArrayList<String>();
    private ArrayAdapter<ListView> adapter;
    private fbk.climblogger.ClimbServiceInterface mClimbService;
    private Context mContext = null;
    private EditText mConsole = null;
    private long lastBroadcastMessageSentMillis = 0;
    private int wakeUP_year = 0, wakeUP_month = 0, wakeUP_day = 0, wakeUP_hour = 0, wakeUP_minute = 0;
    static final int BATTERY_CHECK_INTERVAL_MS = 5000;
    static final int UI_UPDATE_INTERVAL_MS = 100;
    static private boolean firstServiceConnection = true;
    private static ServiceConnection mServiceConnection = null;
    private static String fileName = null;
    ExpandableListView expandableListView;
    MyExpandableListAdapter expandableListAdapter;
    List<fbk.climblogger.ClimbNode> expandableListTitle;
    HashMap<fbk.climblogger.ClimbNode, List<String>> expandableListDetail;

    // Handles various events fired by the Service.
    // ACTION_GATT_CONNECTED: connected to a GATT server.
    // ACTION_GATT_DISCONNECTED: disconnected from a GATT server.
    // ACTION_GATT_SERVICES_DISCOVERED: discovered GATT services.
    // ACTION_DATA_AVAILABLE: received data from the device.  This can be a result of read
    //                        or notification operations.


    private void reconnectAfter(final String id, final int t){
        Handler h = new Handler();
        h.postDelayed(new Runnable() {
            @Override
            public void run() {
                if (!mClimbService.connectMaster(id)) {
                    Log.w(TAG, "reconnect failed immediately. retry after " + t);
                    reconnectAfter(id, t);
                }
            }
        }, t);
    };

    private final BroadcastReceiver mClimbUpdateReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            final String action = intent.getAction();

            if (fbk.climblogger.ClimbServiceInterface.ACTION_DEVICE_ADDED_TO_LIST.equals(action)) {

//                if(intent.hasExtra(fbk.climblogger.ClimbServiceInterface.EXTRA_INT_ARRAY)){
//                    updateDetailsExpandableListDetails(intent.getIntArrayExtra(fbk.climblogger.ClimbServiceInterface.EXTRA_INT_ARRAY));
//                }else{
                    updateDetailsExpandableListDetails();
//                }
                expandableListAdapter.notifyDataSetChanged();
                Log.i(TAG,"ACTION_DEVICE_ADDED_TO_LIST broadcast received");

            } else if (fbk.climblogger.ClimbServiceInterface.ACTION_DEVICE_REMOVED_FROM_LIST.equals(action)) {

                expandableListAdapter.notifyDataSetChanged();
                Log.i(TAG,"ACTION_DEVICE_REMOVED_FROM_LIST broadcast received");

            }else if (fbk.climblogger.ClimbServiceInterface.ACTION_METADATA_CHANGED.equals(action)) {

//                if(intent.hasExtra(fbk.climblogger.ClimbServiceInterface.INTENT_EXTRA_ID)){
//                    updateDetailsExpandableListDetails(intent.getIntArrayExtra(fbk.climblogger.ClimbServiceInterface.INTENT_EXTRA_ID));
//                }else{
                    //updateDetailsExpandableListDetails();
//                }
                //expandableListAdapter.notifyDataSetChanged();
                //log("ACTION_METADATA_CHANGED broadcast received");

            }
            else if (fbk.climblogger.ClimbSimpleService.ACTION_DATALOG_ACTIVE.equals(action)) {

                //String[] fileNames = mClimbService.getLogFiles();
                //String fileName = fileNames[0];

                fileName = intent.getStringExtra(fbk.climblogger.ClimbSimpleService.EXTRA_STRING);

                if(fileName != null && fileName.length() >= 1) {
                    mFilenameTextView.setText(fileName);
                }
                log("Datalog active on file: "+fileName);
            }else if (fbk.climblogger.ClimbSimpleService.ACTION_DATALOG_INACTIVE.equals(action)) {
                log("Datalog stopped");
            }
            else if (fbk.climblogger.ClimbServiceInterface.STATE_CONNECTED_TO_CLIMB_MASTER.equals(action)) {
                String id = intent.getStringExtra(fbk.climblogger.ClimbServiceInterface.INTENT_EXTRA_ID);
                Boolean success = intent.getBooleanExtra(fbk.climblogger.ClimbServiceInterface.INTENT_EXTRA_SUCCESS, true);

                Toast.makeText(getApplicationContext(),
                        "Connected with GATT? " + success,
                        Toast.LENGTH_SHORT).show();
                expandableListAdapter.notifyDataSetChanged();
                Log.i(TAG,"Connected with GATT? " + success);
                if (success) {
                    mClimbService.setNodeList(allowedChidren.toArray(new String[allowedChidren.size()]));
                } else {
                    if (!mClimbService.connectMaster(id)) {
                        Log.w(TAG, "reconnect failed immediately after connect failure. Retry in 5s");
                        reconnectAfter(id,5000);
                        // schedule a new connect try
                    };
                }
            }else if (fbk.climblogger.ClimbServiceInterface.STATE_DISCONNECTED_FROM_CLIMB_MASTER.equals(action)) {
                String id = intent.getStringExtra(fbk.climblogger.ClimbServiceInterface.INTENT_EXTRA_ID);
                Log.w(TAG,"Disconnected from GATT " + id);

                 Toast.makeText(getApplicationContext(),
                    "DISCONNECTED FROM GATT! " + id,
                    Toast.LENGTH_SHORT).show();
                expandableListAdapter.notifyDataSetChanged();

                if (!mClimbService.connectMaster(id)) {
                    Log.w(TAG, "Reconnect to " + id + " failed immediately. Retry in 5s");
                    reconnectAfter(id,5000);
                }
            }
            else if (fbk.climblogger.ClimbServiceInterface.ACTION_NODE_ALERT.equals(action)) {
//                if (intent.hasExtra(ClimbService.EXTRA_BYTE_ARRAY)) {
//                    byte[] nodeID = intent.getByteArrayExtra(ClimbService.EXTRA_BYTE_ARRAY);
//                    String alertString = "ALERT ON NODE :" + String.format("%02X", nodeID[0]);
//                    Toast.makeText(getApplicationContext(),
//                            alertString,
//                            Toast.LENGTH_LONG).show();
//
//                    log(alertString);
//                } else {
//
//                }
            } else if (fbk.climblogger.ClimbServiceInterface.STATE_CHECKEDIN_CHILD.equals(action)) {
                if(intent.hasExtra(fbk.climblogger.ClimbServiceInterface.INTENT_EXTRA_ID))   {
                        String nodeID = intent.getStringExtra(fbk.climblogger.ClimbServiceInterface.INTENT_EXTRA_ID);
                        boolean success = intent.getBooleanExtra(fbk.climblogger.ClimbServiceInterface.INTENT_EXTRA_SUCCESS, true);
                        String msg = intent.getStringExtra(fbk.climblogger.ClimbServiceInterface.INTENT_EXTRA_MSG);
                        String alertString = "CHECKIN " + nodeID + " " + success + " " + msg;
                        Toast.makeText(getApplicationContext(),
                                alertString,
                                Toast.LENGTH_LONG).show();

                        log( alertString );
                    }else{

                    }
            } else if (fbk.climblogger.ClimbServiceInterface.STATE_CHECKEDOUT_CHILD.equals(action)) {
                if(intent.hasExtra(fbk.climblogger.ClimbServiceInterface.INTENT_EXTRA_ID))   {
                    String nodeID = intent.getStringExtra(fbk.climblogger.ClimbServiceInterface.INTENT_EXTRA_ID);
                    boolean success = intent.getBooleanExtra(fbk.climblogger.ClimbServiceInterface.INTENT_EXTRA_SUCCESS, true);
                    String msg = intent.getStringExtra(fbk.climblogger.ClimbServiceInterface.INTENT_EXTRA_MSG);
                    String alertString = "CHECKOUT " + nodeID + " " + success + " " + msg;
                    Toast.makeText(getApplicationContext(),
                            alertString,
                            Toast.LENGTH_LONG).show();

                    log( alertString );
                }else{

                }
            }
        }
    };



    View.OnClickListener initButtonHandler = new View.OnClickListener(){
        public void onClick(View v) {
            if(mClimbService != null){
                if (mClimbService.init()) {
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
                Log.i(TAG, java.util.Arrays.toString(mClimbService.getLogFiles()));
                mClimbService.deinit();
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

    View.OnClickListener ckInAllButtonHandler = new View.OnClickListener(){
        public void onClick(View v) {

            //if( (SystemClock.uptimeMillis() - lastBroadcastMessageSentMillis) > fbk.climblogger.ConfigVals.consecutiveBroadcastMessageTimeout_ms) {
                if (mClimbService != null) {
                    fbk.climblogger.ClimbServiceInterface.NodeState[] nss =  mClimbService.getNetworkState();
                    String[] ids = new String[nss.length];
                    for (int i = 0; i < nss.length; i++) {
                        ids[i] = nss[i].nodeID;
                    }
                    if (mClimbService.checkinChildren(ids)) {
                        mVibrator.vibrate(fbk.climblogger.ConfigVals.vibrationTimeout);
                        lastBroadcastMessageSentMillis = SystemClock.uptimeMillis();
                    } else {
                        Log.i(TAG, "Check in all not sent!");
                        log("Check in all not sent!");
                    }
                } else {
                    Log.i(TAG, "Check in all not sent!");
                    log("Check in all not sent!");
                }
//            }else{
//                String alertString = "Wait a little";
//                Toast.makeText(getApplicationContext(),
//                        alertString,
//                        Toast.LENGTH_LONG).show();
//            }
        }
    };
    View.OnClickListener ckOutAllButtonHandler = new View.OnClickListener(){
        public void onClick(View v) {

            //if ((SystemClock.uptimeMillis() - lastBroadcastMessageSentMillis) > fbk.climblogger.ConfigVals.consecutiveBroadcastMessageTimeout_ms) {
                if (mClimbService != null) {
                    fbk.climblogger.ClimbServiceInterface.NodeState[] nss =  mClimbService.getNetworkState();
                    String[] ids = new String[nss.length];
                    for (int i = 0; i < nss.length; i++) {
                        ids[i] = nss[i].nodeID;
                    }
                    if (mClimbService.checkoutChildren(ids)) {
                        mVibrator.vibrate(fbk.climblogger.ConfigVals.vibrationTimeout);
                        lastBroadcastMessageSentMillis = SystemClock.uptimeMillis();
                    } else {
                        Log.i(TAG, "Check out all not sent!");
                        log("Check out all not sent!");
                    }
                } else {
                    Log.i(TAG, "Check out all not sent!");
                    log("Check out all not sent!");
                }

//            }else{
//                String alertString = "Wait a little";
//                Toast.makeText(getApplicationContext(),
//                        alertString,
//                        Toast.LENGTH_LONG).show();
//            }
        }
    };
    View.OnClickListener ckInBcastButtonHandler = new View.OnClickListener(){
        public void onClick(View v) {
            Toast.makeText(getApplicationContext(),
                    "Disabled button!!",
                    Toast.LENGTH_SHORT).show();
            /* NOT SUPPORTED through iface
            if( (SystemClock.uptimeMillis() - lastBroadcastMessageSentMillis) > ConfigVals.consecutiveBroadcastMessageTimeout_ms) {
                if (mClimbService != null) {
                    if (mClimbService.SendCheckInAllCmd()) {
                        mVibrator.vibrate(ConfigVals.vibrationTimeout);
                        lastBroadcastMessageSentMillis = SystemClock.uptimeMillis();
                    } else {
                        Log.i(TAG, "Check in all not sent!");
                        log("Check in all not sent!");
                    }
                } else {
                    Log.i(TAG, "Check in all not sent!");
                    log("Check in all not sent!");
                }
            }else{
                String alertString = "Wait a little";
                Toast.makeText(getApplicationContext(),
                        alertString,
                        Toast.LENGTH_LONG).show();
            }
            */
        }
    };
    View.OnClickListener ckOutBcastButtonHandler = new View.OnClickListener(){
        public void onClick(View v) {
            Toast.makeText(getApplicationContext(),
                    "Disabled button!!",
                    Toast.LENGTH_SHORT).show();
            /* NOT SUPPORTED through iface
            if ((SystemClock.uptimeMillis() - lastBroadcastMessageSentMillis) > ConfigVals.consecutiveBroadcastMessageTimeout_ms) {
                if (mClimbService != null) {
                    if (mClimbService.SendCheckOutAllCmd()) {
                        mVibrator.vibrate(ConfigVals.vibrationTimeout);
                        lastBroadcastMessageSentMillis = SystemClock.uptimeMillis();
                    } else {
                        Log.i(TAG, "Check out all not sent!");
                        log("Check out all not sent!");
                    }
                } else {
                    Log.i(TAG, "Check out all not sent!");
                    log("Check out all not sent!");
                }

            }else{
                String alertString = "Wait a little";
                Toast.makeText(getApplicationContext(),
                        alertString,
                        Toast.LENGTH_LONG).show();
            }
            */
        }
    };
    View.OnClickListener scheduleWUButtonHandler = new View.OnClickListener(){
        public void onClick(View v) {
            DialogFragment newFragment = new DatePickerFragment();
            newFragment.show(getFragmentManager(), "datePicker");
            //remaining part of the procedure is executed in sendWakeUpCMD()
        }
    };

    View.OnClickListener mMaintenanceCheckBoxOnClickListener = new View.OnClickListener(){
        public void onClick(View v) {

            if (mClimbService != null) {

                if(mMaintenanceCheckBox.isChecked()) {

                    GregorianCalendar wakeUpDate = new GregorianCalendar(wakeUP_year, wakeUP_month, wakeUP_day, wakeUP_hour, wakeUP_minute);
                    GregorianCalendar nowDate = new GregorianCalendar(Locale.ITALY);

                    long wakeUpDate_millis = wakeUpDate.getTimeInMillis();
                    long nowDate_millis = nowDate.getTimeInMillis();

                    if(wakeUpDate_millis > nowDate_millis){
                        sendWakeUpCMD(); //if the wake up hour is valid just enable maintenance with stored wake up data
                    }else {
                        DialogFragment newFragment = new DatePickerFragment();
                        newFragment.show(getFragmentManager(), "datePicker");
                        //remaining part of the procedure is executed in sendWakeUpCMD()
                        if(mMaintenanceCheckBox.isChecked()) {
                            mMaintenanceCheckBox.setChecked(false); //checkbox will be checked once the data and time picker return
                        }
                    }
                }else{
                    if(mClimbService.disableMaintenanceProcedure() == fbk.climblogger.ClimbServiceInterface.ErrorCode.NO_ERROR) {
                        mVibrator.vibrate(fbk.climblogger.ConfigVals.vibrationTimeout);
                        Log.i(TAG, "maintenance disabled!");
                        log("maintenance disabled!");
                    }else{
                        Log.i(TAG, "disable maintenance not set!");
                        log("disable maintenance not set!!");
                    }
                }
            }
        }
    };

    public void setWakeUpDate(int year, int month, int day){
        wakeUP_year = year;
        wakeUP_month = month;
        wakeUP_day = day;
    }

    public void setWakeUpHour(int hour, int minute){
        wakeUP_hour = hour;
        wakeUP_minute = minute;
    }

    public void sendWakeUpCMD(){ //CALLED FROM TIME PICKER ACTIVITY or directly from mMaintenanceCheckBoxOnClickListener (when a valid wake uo data is already available in memory)

          //if( (SystemClock.uptimeMillis() - lastBroadcastMessageSentMillis) > fbk.climblogger.ConfigVals.consecutiveBroadcastMessageTimeout_ms) {
            if (mClimbService != null) {

                fbk.climblogger.ClimbServiceInterface.ErrorCode retValue = mClimbService.enableMaintenanceProcedure(wakeUP_year, wakeUP_month, wakeUP_day, wakeUP_hour, wakeUP_minute);
                if (retValue == fbk.climblogger.ClimbServiceInterface.ErrorCode.NO_ERROR) { //no error
                    mVibrator.vibrate(fbk.climblogger.ConfigVals.vibrationTimeout);
                    if(!mMaintenanceCheckBox.isChecked()) {
                        mMaintenanceCheckBox.setChecked(true);
                    }
                    Log.i(TAG, "maintenance enabled!");
                    return;
                }else if(retValue == fbk.climblogger.ClimbServiceInterface.ErrorCode.WRONG_BLE_NAME_ERROR){  //wrong BLE name TODO: parametrize the error codes
                    mMaintenanceCheckBox.setChecked(false);
                    String alertString = "Maintenance non enabled - WRONG_BLE_NAME_ERROR!!!";
                    Toast.makeText(getApplicationContext(),
                            alertString,
                            Toast.LENGTH_LONG).show();
                    Log.i(TAG, "Maintenance non enabled - WRONG_BLE_NAME_ERROR!!!");
                    log("Maintenance non enabled - WRONG_BLE_NAME_ERROR!!!");
                }else if(retValue == fbk.climblogger.ClimbServiceInterface.ErrorCode.ADVERTISER_NOT_AVAILABLE_ERROR){ //mBluetoothLeAdvertiser = null, probably not compatible TODO: parametrize the error codes
                    mMaintenanceCheckBox.setChecked(false);
                    String alertString = "Maintenance non enabled - ADVERTISER_NOT_AVAILABLE_ERROR!!!";
                    Toast.makeText(getApplicationContext(),
                            alertString,
                            Toast.LENGTH_LONG).show();
                    Log.i(TAG, "Maintenance non enabled - ADVERTISER_NOT_AVAILABLE_ERROR!!!");
                    log("Maintenance non enabled - ADVERTISER_NOT_AVAILABLE_ERROR!!!");
                }else if(retValue == fbk.climblogger.ClimbServiceInterface.ErrorCode.INTERNAL_ERROR){ //internal error TODO: parametrize the error codes
                    mMaintenanceCheckBox.setChecked(false);
                    String alertString = "Maintenance non enabled - INTERNAL_ERROR!!!";
                    Toast.makeText(getApplicationContext(),
                            alertString,
                            Toast.LENGTH_LONG).show();
                    Log.i(TAG, "Maintenance non enabled - INTERNAL_ERROR!!!");
                    log("Maintenance non enabled - INTERNAL_ERROR!!!");
                }else if(retValue == fbk.climblogger.ClimbServiceInterface.ErrorCode.ANDROID_VERSION_NOT_COMPATIBLE_ERROR){ //not compatible TODO: parametrize the error codes
                    mMaintenanceCheckBox.setChecked(false);
                    String alertString = "Maintenance non enabled - ANDROID_VERSION_NOT_COMPATIBLE_ERROR!!!";
                    Toast.makeText(getApplicationContext(),
                            alertString,
                            Toast.LENGTH_LONG).show();
                    Log.i(TAG, "Maintenance non enabled - ANDROID_VERSION_NOT_COMPATIBLE_ERROR!!!");
                    log("Maintenance non enabled - ANDROID_VERSION_NOT_COMPATIBLE_ERROR!!!");
                }else if(retValue == fbk.climblogger.ClimbServiceInterface.ErrorCode.INVALID_DATE_ERROR){ //not compatible TODO: parametrize the error codes
                    mMaintenanceCheckBox.setChecked(false);
                    String alertString = "Maintenance non enabled - INVALID_DATE_ERROR!!!";
                    Toast.makeText(getApplicationContext(),
                            alertString,
                            Toast.LENGTH_LONG).show();
                    Log.i(TAG, "Maintenance non enabled - INVALID_DATE_ERROR!!!");
                    log("Maintenance non enabled - INVALID_DATE_ERROR!!!");
                }else{
                    mMaintenanceCheckBox.setChecked(false);
                    String alertString = "Maintenance non enabled - error unknown!!!";
                    Toast.makeText(getApplicationContext(),
                            alertString,
                            Toast.LENGTH_LONG).show();
                    Log.i(TAG, "Maintenance non enabled - error unknown!!!");
                    log("Maintenance non enabled - error unknown!!!");
                }
                if(mMaintenanceCheckBox.isChecked()) {
                    mMaintenanceCheckBox.setChecked(false);
                }

                Toast.makeText(getApplicationContext(),
                        "Date not accepted...",
                        Toast.LENGTH_SHORT).show();

            } else {
                Log.i(TAG, "schedule wake up not sent!");
                log("schedule wake up not sent!");
            }
//        }else{
//            String alertString = "Wait a little";
//            Toast.makeText(getApplicationContext(),
//                    alertString,
//                    Toast.LENGTH_LONG).show();
//        }

    }

/*    View.OnClickListener releaseCmdButtonHandler = new View.OnClickListener(){
        public void onClick(View v) {

            DialogFragment newFragment = new DatePickerFragment();
            newFragment.show(getFragmentManager(), "datePicker");
        }

    };*/

    ExpandableListView.OnGroupExpandListener mOnGroupExpandListener = new ExpandableListView.OnGroupExpandListener() {
        @Override
        public void onGroupExpand(int groupPosition) {
            Log.i(TAG, "Group expanded, position: " + groupPosition);
            String clickedNode = expandableListAdapter.getMasters()[groupPosition];
            if (! mClimbService.connectMaster(clickedNode)) {
                Log.w(TAG, "connect failed immediately to " + clickedNode);
            }
            mVibrator.vibrate(fbk.climblogger.ConfigVals.vibrationTimeout);
        }
    };

    ExpandableListView.OnGroupCollapseListener mOnGroupCollapseListener = new ExpandableListView.OnGroupCollapseListener() {
        @Override
        public void onGroupCollapse(int groupPosition) {
            mClimbService.disconnectMaster();
            mVibrator.vibrate(fbk.climblogger.ConfigVals.vibrationTimeout);
        }
    };

    ExpandableListView.OnChildClickListener mOnChildClickListener = new ExpandableListView.OnChildClickListener() {
        @Override
        public boolean onChildClick(ExpandableListView parent, View v,
                                    int groupPosition, int childPosition, long id) {

            fbk.climblogger.ClimbServiceInterface.NodeState monitoredChild = (fbk.climblogger.ClimbServiceInterface.NodeState) expandableListAdapter.getChild(groupPosition,childPosition);
            String actionString = "";
            String childID = monitoredChild.nodeID;
            switch (monitoredChild.state) {
                case 0:
                    if (!allowedChidren.contains(childID)) {
                        allowedChidren.add(childID);
                    }
                    mClimbService.setNodeList(allowedChidren.toArray(new String[allowedChidren.size()]));
                    actionString = "allowing " + childID;
                    break;
                case 1:
                    mClimbService.checkinChild(childID);
                    actionString = "checkin " + childID;
                    break;
                case 2:
                    mClimbService.checkoutChild(childID);
                    actionString = "checkout " + childID;
                    break;
                default:
            }
            mVibrator.vibrate(fbk.climblogger.ConfigVals.vibrationTimeout);
            //Toast.makeText(getApplicationContext(),
            //        actionString,
            //        Toast.LENGTH_LONG).show();

            return true;
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

        mCheckInAllButton = (Button) findViewById(R.id.buttonCheckInAll);
        mCheckInAllButton.setOnClickListener(ckInAllButtonHandler);

        mCheckOutAllButton = (Button) findViewById(R.id.buttonCheckOutAll);
        mCheckOutAllButton.setOnClickListener(ckOutAllButtonHandler);

//        mCheckInBcastButton = (Button) findViewById(R.id.buttonCheckInBcast);
//        mCheckInBcastButton.setOnClickListener(ckInBcastButtonHandler);
//
//        mCheckOutBcastButton = (Button) findViewById(R.id.buttonCheckOutBcast);
//        mCheckOutBcastButton.setOnClickListener(ckOutBcastButtonHandler);

        mScheduleWUButton = (Button) findViewById(R.id.scheduleWakeUpAll);
        mScheduleWUButton.setOnClickListener(scheduleWUButtonHandler);

       // mReleaseCmdButton = (Button) findViewById(R.id.test);
        //mReleaseCmdButton.setOnClickListener(releaseCmdButtonHandler);

        mVibrator = (Vibrator) this.getSystemService(VIBRATOR_SERVICE);

        expandableListView = (ExpandableListView) findViewById(R.id.list);

        Intent climbServiceIntent = new Intent(ScanActivity.this, fbk.climblogger.ClimbSimpleService.class); //capire come si comporta nel caso in qui il servizio sia ancora in esecuzione in background
        startService(climbServiceIntent);

        mFilenameTextView = (TextView)findViewById(R.id.filenameTextBox);

        expandableListView.setOnGroupExpandListener( mOnGroupExpandListener );

        expandableListView.setOnGroupCollapseListener( mOnGroupCollapseListener );

        expandableListView.setOnChildClickListener( mOnChildClickListener );

        mMaintenanceCheckBox = (CheckBox)findViewById(R.id.maintenance_ckbox);
        mMaintenanceCheckBox.setOnClickListener(mMaintenanceCheckBoxOnClickListener);

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
            @Override //Questa � usata per ritornare l'oggetto IBinder (c'� solo nei bound services)
            public void onServiceConnected(ComponentName componentName, IBinder service) {
                //la prossima istruzione ritorna l'oggetto BluetoothLeService
                //mClimbService = ((ClimbSimpleService.LocalBinder)service).getService();
                mClimbService = ((fbk.climblogger.ClimbSimpleService.LocalBinder) service).getService();
                mClimbService.setContext(getApplicationContext());
                //IN QUESTO PUNTO RICHIEDI LA LISTA DI DISPOSITIVI INIZIALI PER INSERIRLA NELLA LISTVIEW
                expandableListAdapter = new MyExpandableListAdapter(mContext, mClimbService);
                expandableListView.setAdapter(expandableListAdapter);

                if(expandableListAdapter.getGroupCount() > 0) { //automatically open the first group
                    expandableListView.expandGroup(0);
                }
/*
            //crea un adapter per gestire la listView
            adapter = new ArrayAdapter<ListView>(mContext, android.R.layout.simple_list_item_1, android.R.id.text1,climbNodeList);

            // Assign adapter to ListView
            listView.setAdapter(adapter);
            adapter.notifyDataSetChanged();
*/
                Log.i(TAG, "Service connected!");

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
        super.onPause();
        unregisterReceiver(mClimbUpdateReceiver);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        Log.i(TAG, "ScanActivity.onDestroy() called.");
        log("ScanActivity.onDestroy() called.");

        //stopService(new Intent(ScanActivity.this, ClimbService.class));
        //climbNodeList = null;
        unbindService(mServiceConnection);
        mServiceConnection = null;
        //mClimbService = null;
        //expandableListDetail = null;
        //expandableListAdapter = null;
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

    private void updateDetailsExpandableListDetails(final int[] changedClimbNodeIndex){
    }

    private void updateDetailsExpandableListDetails(){
    }

    private void updateUI(boolean autoSchedule){
        if(expandableListAdapter != null) {
            updateDetailsExpandableListDetails();
            expandableListAdapter.notifyDataSetChanged();
//            int[] nodesAmout = getNodesAmount();
//            mNodesAmountTextView.setText("("+nodesAmout[0]+" m "+nodesAmout[1]+" c)");
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
        intentFilter.addAction(fbk.climblogger.ClimbServiceInterface.STATE_CONNECTED_TO_CLIMB_MASTER);
        intentFilter.addAction(fbk.climblogger.ClimbServiceInterface.STATE_DISCONNECTED_FROM_CLIMB_MASTER);
        intentFilter.addAction(fbk.climblogger.ClimbServiceInterface.ACTION_DEVICE_REMOVED_FROM_LIST);
        intentFilter.addAction(fbk.climblogger.ClimbServiceInterface.ACTION_NODE_ALERT);
        intentFilter.addAction(fbk.climblogger.ClimbServiceInterface.STATE_CHECKEDIN_CHILD);
        intentFilter.addAction(fbk.climblogger.ClimbServiceInterface.STATE_CHECKEDOUT_CHILD);
        return intentFilter;
    }



}
