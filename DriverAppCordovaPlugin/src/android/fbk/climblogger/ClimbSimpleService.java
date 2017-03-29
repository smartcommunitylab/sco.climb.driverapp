package fbk.climblogger;

import android.annotation.TargetApi;
import android.app.Service;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.le.AdvertiseCallback;
import android.bluetooth.le.AdvertiseData;
import android.bluetooth.le.AdvertiseSettings;
import android.bluetooth.le.BluetoothLeAdvertiser;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanFilter;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Binder;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.IBinder;
import android.os.ParcelUuid;
import android.support.annotation.Nullable;
import android.util.Log;

import java.io.IOException;
import java.lang.reflect.Array;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.GregorianCalendar;
import java.util.HashMap;
import java.util.List;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

public class ClimbSimpleService extends Service implements fbk.climblogger.ClimbServiceInterface {
    public final static String ACTION_DATALOG_ACTIVE ="fbk.climblogger.ClimbSimpleService.ACTION_DATALOG_ACTIVE";
    public final static String ACTION_DATALOG_INACTIVE ="fbk.climblogger.ClimbSimpleService.ACTION_DATALOG_INACTIVE";
    public final static String EXTRA_STRING ="fbk.climblogger.ClimbSimpleService.EXTRA_STRING";

    public String dirName, file_name_log;
    File root;
    private File mFile = null;
    private FileWriter mFileWriter = null;
    private BufferedWriter mBufferedWriter = null;
    private boolean logEnabled;
    //private ArrayList<ClimbNode> nodeList;
    private boolean initialized = false;
    private long lastMaintainaceCallTime_millis = 0;
    private long lastWakeUpTimeoutSet_sec = 0;
    private boolean maintenanceProcedureEnabled = false;
    private String originalDeviceName = null;
    //--- Service -----------------------------------------------

    private final String TAG = "ClimbSimpleService";

    private IBinder mBinder;

    public class LocalBinder extends Binder {
        public fbk.climblogger.ClimbServiceInterface getService() {
            return ClimbSimpleService.this;
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        Log.i(TAG, "ClimbService created");

        // Register broadcasts receiver for bluetooth state change
        IntentFilter filter = new IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED);
        registerReceiver(mBluetoothStateReceiver, filter);

        mBinder = new LocalBinder();

        initialize_bluetooth(); //TODO: handle error somehow
    }

    @Override
    public IBinder onBind(Intent intent) {
        Log.i(TAG, "ClimbService bound");

        return mBinder;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.i(TAG, "ClimbSimpleService onDestroy");
        insertTag("climb_simple_service_destroyed");

        deinit();

        if (mBufferedWriter != null) {
            try {
                mBufferedWriter.flush();
            } catch (IOException e) {
            }
        }
        unregisterReceiver(mBluetoothStateReceiver);
    }

    @Override
    public void onTaskRemoved(Intent rootIntent){
        super.onTaskRemoved(rootIntent);
        Log.i(TAG, "ClimbSimpleService onTaskRemoved");

        deinit();

        if (mBufferedWriter != null) {
            try {
                mBufferedWriter.flush();
            } catch (IOException e) {
            }
        }
        unregisterReceiver(mBluetoothStateReceiver);
    }

    @Override
    public boolean onUnbind(Intent intent) {
        Log.i(TAG, "ClimbService onUnbind");

        if (mBufferedWriter != null) {
            try {
                mBufferedWriter.flush();
            } catch (IOException e) {
            }
        }
        insertTag("climb_service_unbind");

        return super.onUnbind(intent);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.i(TAG, "Received start id " + startId + ": " + intent);
        return START_NOT_STICKY;
    }

    //--- BlueTooth -----------------------------------------------

    private BluetoothManager mBluetoothManager;
    private BluetoothAdapter mBluetoothAdapter;
    private BluetoothLeScanner mBluetoothLeScanner;
    private BluetoothLeAdvertiser mBluetoothLeAdvertiser;
    private int bluetoothState = BluetoothAdapter.STATE_OFF;

    private final static int TEXAS_INSTRUMENTS_MANUFACTER_ID = 0x000D;
    private static String getNodeIdFromRawPacket(byte[] manufSpecField) {
        if(manufSpecField != null && manufSpecField.length > 1) {
            return String.format("%02X", manufSpecField[0]);
        }else{
            return null;
        }
    }
    private static int getNodeBatteryVoltageFromRawPacket(byte[] manufSpecField){
        if(manufSpecField != null && manufSpecField.length > 4) {
            return (((((int) manufSpecField[manufSpecField.length - 3]) << 24) >>> 24) << 8) + ((((int) manufSpecField[manufSpecField.length - 2]) << 24) >>> 24);
        }else{
            return 0;
        }
    }

    private boolean initialize_bluetooth() {
        // For API level 18 and above, get a reference to BluetoothAdapter through
        // BluetoothManager.
        if (Build.VERSION.SDK_INT < 18) {
            Log.e(TAG, "API level " + Build.VERSION.SDK_INT + " not supported!");
            return false;
        }

        if (mBluetoothManager == null) {
            mBluetoothManager = (BluetoothManager) getSystemService(Context.BLUETOOTH_SERVICE); //qua era context.BLUETOOTH_SERVICE
            if (mBluetoothManager == null) {
                Log.e(TAG, "Unable to initialize BluetoothManager.");
                return false;
            }
        }

        mBluetoothAdapter = mBluetoothManager.getAdapter();
        if (mBluetoothAdapter == null) {
            Log.e(TAG, "Unable to obtain a BluetoothAdapter.");
            return false;
        }

        bluetoothState = mBluetoothAdapter.getState();
        if(bluetoothState != BluetoothAdapter.STATE_ON){
            Log.e(TAG, "The bluetooth seems to be not enabled.");
            return false;
        }

        return true;
    }

    private int StartScanning(boolean enableDatalog) {

       /* if(mBluetoothAdapter == null) {
            return false;
        }
*/
        if(mBluetoothAdapter != null) {
            if(enableDatalog) {
                startDataLog();
                logEnabled = true;
                insertTag("Start_Monitoring " + fbk.climblogger.ConfigVals.libVersion);
                insertTag("initializing" +
                        " API: " + Build.VERSION.SDK_INT +
                        " Release: " + Build.VERSION.RELEASE +
                        " Manuf: " + Build.MANUFACTURER +
                        " Product: " + Build.PRODUCT +
                        "");

                if (mBluetoothAdapter != null) {
                    insertTag("BTadapter" +
                            " state: " + mBluetoothAdapter.getState() +
                            " name: " + mBluetoothAdapter.getName() +
                            " address: " + mBluetoothAdapter.getAddress() +
                            "");
            }
                broadcastUpdate(ACTION_DATALOG_ACTIVE,EXTRA_STRING,file_name_log);
            }else{
                mFile = null;
            }
            if (Build.VERSION.SDK_INT < 18) {
                Log.e(TAG, "API level " + Build.VERSION.SDK_INT + " not supported!");
                return 0;
            } else if (Build.VERSION.SDK_INT < 21) {
                if(mScanCallback == null) {
                    mLeScanCallback = new myLeScanCallback();
                }
                bluetoothState = mBluetoothAdapter.getState();
                if (bluetoothState == BluetoothAdapter.STATE_ON) {
                    if (mBluetoothAdapter.startLeScan(mLeScanCallback)) {
                        return 1;
                    } else {
                        Log.e(TAG, "startLeScan returned false!.");
                        return 0;
                    }
                } else {
                    Log.w(TAG,"Bluetooth is not ON");
                    return 0;
                }
            } else {
                //prepare filter

                    List<ScanFilter> mScanFilterList = new ArrayList<ScanFilter>();
                    mScanFilterList.add(new ScanFilter.Builder().setDeviceName(fbk.climblogger.ConfigVals.CLIMB_MASTER_DEVICE_NAME).build());
                    mScanFilterList.add(new ScanFilter.Builder().setDeviceName(fbk.climblogger.ConfigVals.CLIMB_CHILD_DEVICE_NAME).build());

                    //imposta i settings di scan. vedere dentro la clase ScanSettings le opzioni disponibili
                    ScanSettings mScanSettings = new ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build();
                if(mScanCallback == null) {
                    mScanCallback = new myScanCallback();
                    mBluetoothLeScanner = mBluetoothAdapter.getBluetoothLeScanner();
                    if (mBluetoothLeScanner == null) {
                        mScanCallback = null;
                        Log.e(TAG, "Unable to obtain a mBluetoothLeScanner.");
                        return 0;
                    }
                }
                bluetoothState = mBluetoothAdapter.getState();
                if(bluetoothState == BluetoothAdapter.STATE_ON) {
                    mBluetoothLeScanner.startScan(mScanFilterList, mScanSettings, mScanCallback);
                    return 1;
                }else{
                    return 0;
                }

            }
        }
        return 1;
    }

    private int StopMonitoring(){
        if(mBluetoothAdapter != null) {
            if (Build.VERSION.SDK_INT < 21) {
                bluetoothState = mBluetoothAdapter.getState();
                if (mBluetoothAdapter != null && bluetoothState == BluetoothAdapter.STATE_ON ) { //if the stopLeScan doesn't throw IllegalStateException on API < 21, the second check can be removed. Now I don't have a smartphone to check
                    mBluetoothAdapter.stopLeScan(mLeScanCallback);
                }
            } else {
                bluetoothState = mBluetoothAdapter.getState();
                if (mBluetoothLeScanner != null && bluetoothState == BluetoothAdapter.STATE_ON) {
                    mBluetoothLeScanner.stopScan(mScanCallback); // some devices throws IllegalStateException. Not documented
                }
            }

            if(logEnabled){
                logEnabled = false;
                insertTag("Stop_Monitoring");
                stopDataLog();
                broadcastUpdate(ACTION_DATALOG_INACTIVE);
            }
        }else{
            Log.w(TAG, "mBluetoothAdapter == NULL!!");
        }
        return 1;
    }

    private final BroadcastReceiver mBluetoothStateReceiver = new BroadcastReceiver() { //the app should subscribe to this, calling init() as soon it receives BluetoothAdapter.STATE_ON
        @Override
        public void onReceive(Context context, Intent intent) {
            final String action = intent.getAction();

            if (action.equals(BluetoothAdapter.ACTION_STATE_CHANGED)) {
                final int state = intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR);
                insertTag("Bluetooth_State_change, new state: " + state);
                Log.i(TAG,"Bluetooth_State_change, new state: " + state);
                bluetoothState = state;
            }
        }
    };

    void updateChild(String id) {
        long nowMillis = System.currentTimeMillis();
        fbk.climblogger.ClimbServiceInterface.NodeState s = seenChildren.get(id);
        if (s == null) {
            s = new fbk.climblogger.ClimbServiceInterface.NodeState();
            s.nodeID = id;
            s.state = fbk.climblogger.ClimbServiceInterface.State.CHECKING.getValue();
            s.lastStateChange = nowMillis;
            s.lastSeen = nowMillis;
            s.batteryVoltage_mV = 0;
            s.batteryLevel = 0;
            seenChildren.put(id,s);
        } else {
            s.lastSeen = nowMillis;
            s.batteryVoltage_mV = 0;
            s.batteryLevel = 0;
        }
        //broadcastUpdate(ACTION_METADATA_CHANGED,id);
    }

    void updateChild(String id, int batteryVoltage) {
        updateChild(id);
        NodeState s = seenChildren.get(id);
        //only update battery voltage, the other stuff is updated in updateChild(String id)
        s.batteryVoltage_mV = batteryVoltage;
        if(batteryVoltage == 0){
            s.batteryLevel = 0;
        }else if(batteryVoltage < 2000 & batteryVoltage != 0) { //TODO: parametrize levels boundaries in function of the type of battery
            s.batteryLevel = 1;
        }else if(batteryVoltage >= 2000 & batteryVoltage < 2500){ //TODO: parametrize levels boundaries in function of the type of battery
            s.batteryLevel = 2;
        }else if(batteryVoltage >= 2500){ //TODO: parametrize levels boundaries in function of the type of battery
            s.batteryLevel = 3;
        }

        //broadcastUpdate(ACTION_METADATA_CHANGED,id);
    }

    
private boolean logScanResult(final BluetoothDevice device, int rssi, byte[] manufacterData, long nowMillis) {
    boolean ret = false;
    if (mBufferedWriter != null) { // questo significa che il log � stato abilitato
        final String timestamp = new SimpleDateFormat("yyyy MM dd HH mm ss").format(new Date()); // salva il timestamp per il log
        String manufString = "";

        if (manufacterData != null) {
            for (int i = 0; i < manufacterData.length; i++) {
                manufString = manufString + String.format("%02X", manufacterData[i]);
                
            }
        }

        try {
            String logLine = "" + timestamp +
                    " " + nowMillis +
                    " " + device.getAddress() +
                    " " + device.getName() +
                    " ADV " +
                    rssi +
                    " " + manufString +
                    "\n";

            //mBufferedWriter.write(timestamp + " " + nowMillis);
            //mBufferedWriter.write(" " + result.getDevice().getAddress()); //MAC ADDRESS
            //mBufferedWriter.write(" " + result.getDevice().getName() + " "); //NAME
            //mBufferedWriter.write(" " + "ADV data" + " ");
            Log.i(TAG, logLine);
            mBufferedWriter.write(logLine);
            mBufferedWriter.flush();
            ret = true;

        } catch (IOException e) {
            Log.w(TAG, "Exception throwed while writing data to file.");
        }
    }
    return ret;
}


    // --- Android 5.x specific code ---
    private ScanCallback mScanCallback;
    @TargetApi(21)
    class myScanCallback extends ScanCallback {

        @Override
        public void onBatchScanResults(List<ScanResult> results){}

        @Override
        public void onScanFailed(int errorCode){
            Log.e( TAG, "Error while starting the scan. ErrorCode: " + errorCode );
        }

        @Override
        public void onScanResult(int callbackType, ScanResult result){  //public for SO, not for upper layer!
            if(callbackType == ScanSettings.CALLBACK_TYPE_ALL_MATCHES) {
                long nowMillis = System.currentTimeMillis();
                String id;
                byte[] manufSpecDataPacket;
                int batteryVoltage = 0;
                if (logEnabled) {
                    logScanResult(result.getDevice(),
                            result.getRssi(),
                            result.getScanRecord().getManufacturerSpecificData(TEXAS_INSTRUMENTS_MANUFACTER_ID),
                            nowMillis);
                }
                if (result.getDevice().getName().equals(fbk.climblogger.ConfigVals.CLIMB_CHILD_DEVICE_NAME)) {
                    manufSpecDataPacket = result.getScanRecord().getManufacturerSpecificData(TEXAS_INSTRUMENTS_MANUFACTER_ID);
                    id = getNodeIdFromRawPacket(manufSpecDataPacket);
                    if(id != null) {
                        batteryVoltage = getNodeBatteryVoltageFromRawPacket(manufSpecDataPacket);
                        updateChild(id, batteryVoltage);
                    }else{
                        id = result.getDevice().getAddress();
                        updateChild(id);
                    }
                } else {
                    id = result.getDevice().getAddress();
                    updateChild(id);
                }
            }
        }
    };

    private AdvertiseCallback mAdvCallback;
    @TargetApi(21)
    class myAdvCallback extends AdvertiseCallback {
        @Override
        public void onStartSuccess(AdvertiseSettings settingsInEffect) {
            super.onStartSuccess(settingsInEffect);
        }

        @Override
        public void onStartFailure(int errorCode) {
            Log.e( TAG, "Advertising onStartFailure: " + errorCode );
            super.onStartFailure(errorCode);
            disableMaintenanceProcedure(); //if the advertising fails disable maintenance so that the name keeps correct
        }
    };

    // --- Android 4.x specific code ---
    private myLeScanCallback mLeScanCallback;
    class myLeScanCallback implements BluetoothAdapter.LeScanCallback {
        @Override
        public void onLeScan(final BluetoothDevice device, int rssi, byte[] scanRecord) {
            String id;
            long nowMillis = System.currentTimeMillis();
            byte[] manufSpecDataPacket = extractManufacturerSpecificData(scanRecord, TEXAS_INSTRUMENTS_MANUFACTER_ID);
            int batteryVoltage = 0;

            if (device != null) {
                if (logEnabled && device.getName().equals(fbk.climblogger.ConfigVals.CLIMB_CHILD_DEVICE_NAME)) {
                    logScanResult(device,
                            rssi,
                            manufSpecDataPacket,
                            nowMillis);
                }
                if (device.getName() != null && device.getName().equals(fbk.climblogger.ConfigVals.CLIMB_CHILD_DEVICE_NAME)) {
                    id = getNodeIdFromRawPacket(manufSpecDataPacket);
                    //id = getNodeIdFromRawPacket(Arrays.copyOfRange(scanRecord,12,scanRecord.length));  //not sure if this works, scanRecord in android 4.x does ot support getManufacturerSpecificData
                    if(id != null) {
                        batteryVoltage = getNodeBatteryVoltageFromRawPacket(manufSpecDataPacket);
                        updateChild(id, batteryVoltage);
                    }else{
                        id = device.getAddress();
                        updateChild(id);
                    }
                } else {
                    id = device.getAddress();
                    updateChild(id);
                }
            }
        }

        private byte[] extractManufacturerSpecificData(byte[] scanRecord, int manufacturer_id){

            if(scanRecord != null) {
                int ptr = 0;
                while (ptr < scanRecord.length && scanRecord[ptr] != 0) {
                    int field_length = scanRecord[ptr];
                    if (scanRecord[ptr + 1] == (byte) (0xFF)) { //this is true when the manufacturer specific data field has been found
                        if (((scanRecord[ptr + 3] << 8) + scanRecord[ptr + 2]) == manufacturer_id) {
                            byte[] manufacturerSpecificData = new byte[field_length - 3];
                            System.arraycopy(scanRecord, ptr + 4, manufacturerSpecificData, 0, field_length - 3);
                            return manufacturerSpecificData;
                        }
                    }
                    ptr += (field_length + 1);
                }
                return null;
            }else{
                return null;
            }
        }
    };


    //--- Callbacks helpers -----------------------------------------------
    private void broadcastUpdate(final String action) {
        final Intent intent = new Intent(action);
        //Log.v(TAG, "Sending broadcast, action = " + action);
        sendBroadcast(intent);
    }

    private void broadcastUpdate(final String action, final String id) {
        final Intent intent = new Intent(action);
        if (id != null) {
            intent.putExtra(INTENT_EXTRA_ID, id);
        }
        sendBroadcast(intent);
    }

    private void broadcastUpdate(final String action, final String id, final boolean success, final String msg) {
        final Intent intent = new Intent(action);
        if (id != null) {
            intent.putExtra(INTENT_EXTRA_ID, id);
        }
        intent.putExtra(INTENT_EXTRA_SUCCESS, success);
        if (msg != null) {
            intent.putExtra(INTENT_EXTRA_MSG, msg);
        }
        sendBroadcast(intent);
    }

    private void broadcastUpdate(final String action, final String extra_type, String extra_string) {
        final Intent intent = new Intent(action);

        intent.putExtra(extra_type,extra_string);
        //Log.d(TAG, "Sending broadcast, action = " + action + ". extra_type = " + extra_type);
        sendBroadcast(intent);
    }

    public boolean insertTag(String tagDescriptiveString){ //TODO: not exposed in main API
        if (logEnabled) {
            if (mBufferedWriter != null) {
                long nowMillis = System.currentTimeMillis();
                final String timestamp = new SimpleDateFormat("yyyy MM dd HH mm ss").format(new Date()); // salva il timestamp per il log
                try {

                    try {
                        String tagString = "" + timestamp +
                                " " + nowMillis +
                                " PHONE" +
                                " LOCAL_DEVICE " +
                                "TAG data " +
                                tagDescriptiveString +
                                "\n";
                        Log.i(TAG, tagDescriptiveString);
                        mBufferedWriter.write(tagString);
                        mBufferedWriter.flush();
                        return true;
                    } catch (NullPointerException e){
                        String tagString = "" + timestamp +
                                " " + nowMillis +
                                " NO_ADDRESS" +
                                " LOCAL_DEVICE " +
                                "TAG data " +
                                tagDescriptiveString +
                                "\n";

                        mBufferedWriter.write(tagString);
                        return true;
                    }
                } catch (IOException e) {
                    Log.w(TAG, "Exception throwed while writing data to file.");
                    return false;
                }
            }else{
                return false;
            }
        }else{
            return false;
        }
    }

    private void updateMaintenancePacket(){
        if(Build.VERSION.SDK_INT >= 21){
            if(maintenanceProcedureEnabled) {
                if(mAdvCallback != null) {
                    mBluetoothLeAdvertiser.stopAdvertising(mAdvCallback); //when the maintenance packet is configured for the first time the call back is null
                }

                AdvertiseSettings settings = new AdvertiseSettings.Builder()
                        .setAdvertiseMode( AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY )
                        .setTxPowerLevel( AdvertiseSettings.ADVERTISE_TX_POWER_HIGH )
                        .setConnectable( false )
                        .build();

                //ParcelUuid pUuid = new ParcelUuid( ConfigVals.Service.CLIMB );
                GregorianCalendar nowDate = new GregorianCalendar(Locale.ITALY);
                long nowMillis =  nowDate.getTimeInMillis();
                long lastMaintainaceCallElapse_sec = (nowMillis - lastMaintainaceCallTime_millis)/1000;

                long timeoutSec = lastWakeUpTimeoutSet_sec - lastMaintainaceCallElapse_sec;

                if(timeoutSec > 0) {

                    byte[] manufacturerData = {(byte) 0xFF, (byte) 0x02, (byte) (timeoutSec >> 16), (byte) (timeoutSec >> 8), (byte) (timeoutSec)};

                    AdvertiseData advertiseData = new AdvertiseData.Builder()
                            .setIncludeDeviceName(true)
                            //.addServiceUuid( pUuid )
                            //.addServiceData( pUuid, "Data".getBytes( Charset.forName( "UTF-8" ) ) )
                            .addManufacturerData(TEXAS_INSTRUMENTS_MANUFACTER_ID, manufacturerData)
                            .build();

                    mAdvCallback = new myAdvCallback();
                    insertTag("enabling_advertise");
                    mBluetoothLeAdvertiser.startAdvertising(settings, advertiseData, mAdvCallback);


                    Handler h = new Handler();
                    h.postDelayed(new Runnable() {
                        @Override
                        public void run() {
                            updateMaintenancePacket();
                        }
                    }, fbk.climblogger.ConfigVals.MAINTENANCE_PACKET_UPDATE_INTERVAL_MS);
                }else{ //(timeoutSec > 0), when the timeout goes negative disable the maintenance packet
                    maintenanceProcedureEnabled = false;
                }
            }
        } // (Build.VERSION.SDK_INT >= 21)
        return;
    }

    //--- CLIMB API -----------------------------------------------

    private String[] allowedChildren = new String[0];
    private HashMap<String, fbk.climblogger.ClimbServiceInterface.NodeState> seenChildren = new HashMap<String, fbk.climblogger.ClimbServiceInterface.NodeState>();

    public boolean init() {

       // insertTag("Initializing");
       // return StartScanning();

        boolean ret = (StartScanning(true) == 1);
        initialized = ret;
        insertTag("init: " + ret);
        Log.i(TAG, "Initializing: ret = " + ret);
        return ret;

    }

    public boolean deinit() {
        disableMaintenanceProcedure();
        boolean ret = (StopMonitoring() == 1);
        seenChildren = new HashMap<String, fbk.climblogger.ClimbServiceInterface.NodeState>(); //empty node list!
        broadcastUpdate(ACTION_METADATA_CHANGED);
        initialized = false;
        insertTag("deinit: " + ret);
        Log.i(TAG, "deInitializing: ret = " + ret);
        return ret;
    }

    private Context mContext;
    public void setContext(Context context) {
        mContext = context;
    }

    public String[] getMasters() {
        String[] masters = new String[1];
        masters[0] = mBluetoothAdapter.getAddress();
        return masters;
    }

    String mMaster;
    public boolean connectMaster(String master) {
        mMaster = master;
        broadcastUpdate(STATE_CONNECTED_TO_CLIMB_MASTER, master, true, null); //TODO: might need to delay this to avoid race conditions in caller
        return true;
    }

    public boolean disconnectMaster() {
        broadcastUpdate(ACTION_DATALOG_ACTIVE, STATE_DISCONNECTED_FROM_CLIMB_MASTER, mMaster); //TODO: might need to delay this to avoid race conditions in caller
        return true;
    }

    public String[] getLogFiles() {
        //return new String[0];
        String[] r;
        if (mFile != null) {
            if (mBufferedWriter != null) {
                try {
                    mBufferedWriter.flush();
                } catch (IOException e) {
                }
            }
            r = new String[1];
            r[0] = mFile.getAbsolutePath();
        } else {
            r = new String[0];
        }

        return r;
    }

    public boolean setNodeList(String[] children) {
        allowedChildren = children.clone(); //Strings are immutable, so no need to deep clone
        return true;
    }

    @Nullable
    public NodeState getNodeState(String id) {
        return seenChildren.get(id); //TODO: clone
    }

    public NodeState[] getNetworkState() {
        return seenChildren.values().toArray(new NodeState[0]); //TODO: deep clone
    }

    public boolean checkinChild(String child) {
        NodeState s = seenChildren.get(child);
        if (s != null) {
            s.state = State.ONBOARD.getValue();
            //TODO: call callback
            return true;
        } else {
            return false;
        }
    }

    public boolean checkinChildren(String[] children) {
        boolean ret = true;
        for (String child : children) {
            ret &= checkinChild(child);
        }
        return ret;
    }

    public boolean checkoutChild(String child) {
        NodeState s = seenChildren.get(child);
        if (s != null) {
            s.state = State.CHECKING.getValue();
            //TODO: call callback
            return true;
        } else {
            return false;
        }
    }

    public boolean checkoutChildren(String[] children) {
        boolean ret = true;
        for (String child : children) {
            ret &= checkoutChild(child);
        }
        return ret;
    }

    private String startDataLog(){
        //TODO:se il file c'� gi� non crearlo, altrimenti creane un'altro
        if(mBufferedWriter == null){ // il file non � stato creato, quindi crealo
            if( get_log_num() == 1 ){
                return file_name_log;
            }
        } else{
            return null;
        }

        return null;
    }
    private String stopDataLog(){
        //TODO:chiudi il file
        if(mBufferedWriter != null){ // il file � presente
            try {
                mBufferedWriter.close();
                //mFile = null; //this is not nulled so that the filename remains available even after the call to deinit()
                mBufferedWriter = null;
                file_name_log = null;
            }catch (IOException e) {
                e.printStackTrace();
            }
            return null;
        }
        return null;
    }

    private int get_log_num(){
        Log.i(TAG, "Initializing log file.");
        root = Environment.getExternalStorageDirectory();
        TimeZone tz = TimeZone.getTimeZone("Europe/Rome");

        Calendar rightNow = Calendar.getInstance(tz);// .getInstance();
        dirName= fbk.climblogger.ConfigVals.folderName;
        try{

            File newFile = new File(dirName);
            newFile.mkdirs();
            Log.i(TAG, "Directory \""+ dirName + "\" created.");

        }
        catch(Exception e)
        {
            Log.w(TAG, "Exception creating folder");
            return -1;
        }

        if (root.canRead()) {

        }
        if (root.canWrite()){

            file_name_log = "log_"+rightNow.get(Calendar.DAY_OF_YEAR)+"_"+rightNow.get(Calendar.HOUR_OF_DAY)+"."+rightNow.get(Calendar.MINUTE)+"."+rightNow.get(Calendar.SECOND)+".txt";

            mFile = new File(dirName,file_name_log);


            try {
                mFileWriter = new FileWriter(mFile);
                mBufferedWriter = new BufferedWriter(mFileWriter);
                Log.i(TAG, "Log file \""+ file_name_log + "\"created!");

            } catch (IOException e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
                Log.w(TAG, "IOException in creating file");
            }

        }else{
            Log.w(TAG, "Can't write to file");
            return -1;
        }

        return 1;
    }

    public ErrorCode enableMaintenanceProcedure(int wakeUP_year, int wakeUP_month, int wakeUP_day, int wakeUP_hour, int wakeUP_minute) {
        if (Build.VERSION.SDK_INT < 21) {
            Log.w(TAG, "Build.VERSION.SDK_INT < 21");
            insertTag("Cannot_enable_advertise,Build.VERSION.SDK_INT<21");
            return ErrorCode.ANDROID_VERSION_NOT_COMPATIBLE_ERROR;
        }
        if (mBluetoothAdapter == null) {
            Log.w(TAG, "mBluetoothAdapter == null");
            insertTag("Cannot_enable_advertise,mBluetoothAdapter==null");
            disableMaintenanceProcedure();
            return ErrorCode.INTERNAL_ERROR; //internal error
        }
        if(bluetoothState != BluetoothAdapter.STATE_ON){
            Log.w(TAG, "the bluetooth is not enabled");
            insertTag("Cannot_enable_advertise,bluetoothState!=BluetoothAdapter.STATE_ON");
            return ErrorCode.ADVERTISER_NOT_AVAILABLE_ERROR; //wrong BLE name, the  setName can't update it!
        }
        mBluetoothLeAdvertiser = mBluetoothAdapter.getBluetoothLeAdvertiser();

        if (mBluetoothLeAdvertiser == null ) {
            Log.w(TAG, "mBluetoothLeAdvertiser == null");
            insertTag("Cannot_enable_advertise,mBluetoothLeAdvertiser==null");
            disableMaintenanceProcedure();
            return ErrorCode.ADVERTISER_NOT_AVAILABLE_ERROR;
        }

        if (!mBluetoothAdapter.isMultipleAdvertisementSupported()) { //it seems we need multiple advertising to make it work.
            Log.w(TAG, "multiple advertisement not supported");
            insertTag("Cannot_enable_advertise,multiple_advertisement_not_supported");
            disableMaintenanceProcedure();
            //return ErrorCode.ADVERTISER_NOT_AVAILABLE_ERROR;
        }

        if (!maintenanceProcedureEnabled){ //don't overwrite the original device name if successive calls to enableMaintenanceProcedure are performed without calling disableMaintenanceProcedure
            disableMaintenanceProcedure();
            originalDeviceName = mBluetoothAdapter.getName();
        }else{
            Log.i(TAG, "maintenance procedure already enabled");
        }

        String deviceName = mBluetoothAdapter.getName();

        if(deviceName != null && !deviceName.equals(fbk.climblogger.ConfigVals.CLIMB_MASTER_DEVICE_NAME)) {
            if(!mBluetoothAdapter.setName(fbk.climblogger.ConfigVals.CLIMB_MASTER_DEVICE_NAME)) {
                Log.w(TAG, "the method setName returned false");
                insertTag("Cannot_set_name_advertise_not_enabled");
                return ErrorCode.WRONG_BLE_NAME_ERROR; //wrong BLE name, the  setName can't update it!
            }
            //check the name string after the setting it....not strictly needed.
            deviceName = mBluetoothAdapter.getName();
            if(deviceName != null && !deviceName.equals(fbk.climblogger.ConfigVals.CLIMB_MASTER_DEVICE_NAME)) {
                Log.w(TAG, "BLE name check failed! Name not changed");
                insertTag("Cannot_set_name_advertise_not_enabled");
                mBluetoothAdapter.setName(originalDeviceName);
                return ErrorCode.WRONG_BLE_NAME_ERROR;
            }
        }

        GregorianCalendar wakeUpDate = new GregorianCalendar(wakeUP_year, wakeUP_month, wakeUP_day, wakeUP_hour, wakeUP_minute);
        GregorianCalendar nowDate = new GregorianCalendar(Locale.ITALY);

        long wakeUpDate_millis = wakeUpDate.getTimeInMillis();
        long nowDate_millis = nowDate.getTimeInMillis();

        if (wakeUpDate_millis > nowDate_millis) {
            lastWakeUpTimeoutSet_sec = (wakeUpDate_millis - nowDate_millis) / 1000;
            if (lastWakeUpTimeoutSet_sec < fbk.climblogger.ConfigVals.MAX_WAKE_UP_DELAY_SEC && lastWakeUpTimeoutSet_sec == (int) lastWakeUpTimeoutSet_sec) {

                lastMaintainaceCallTime_millis = nowDate_millis;

                if(!maintenanceProcedureEnabled) { //if the maintenance was already enabled, don't call updateMaintenancePacket() twice (just update the wake up date/hour)!
                    maintenanceProcedureEnabled = true;
                    updateMaintenancePacket();
                }
            }else{
                disableMaintenanceProcedure();
                Log.w(TAG, "Wake up date is too far from now or an overflow has been detected");
                insertTag("Cannot_enable_advertise,WakeUpDate_too_far");
                return ErrorCode.INVALID_DATE_ERROR;
            }
        }else{
            Log.w(TAG, "Wake up date is before now");
            insertTag("Cannot_enable_advertise,invalid_WakeUpDate");
            disableMaintenanceProcedure();
            return ErrorCode.INVALID_DATE_ERROR;
        }
        return ErrorCode.NO_ERROR; //no error
    }

    public ErrorCode disableMaintenanceProcedure(){
        if(Build.VERSION.SDK_INT >= 21){
            if(maintenanceProcedureEnabled) {
                insertTag("disabling_advertise");
                maintenanceProcedureEnabled = false;
                mBluetoothLeAdvertiser.stopAdvertising(mAdvCallback);
                if(originalDeviceName != null) {
                    if(!mBluetoothAdapter.setName(originalDeviceName)){
                        Log.w(TAG, "Not able to restored the original BLE name");
                        insertTag("Cannot_restore_the_original_name");
                    }else{
                        Log.i(TAG, "Original name restored");
                    }
                    originalDeviceName = null;
                }
                mAdvCallback = null;
                return ErrorCode.NO_ERROR;
            }else{ //maintenance non enabled, don't react but do not generate errors
                Log.i(TAG, "maintenance procedure not enabled, cannot disable it");
                return ErrorCode.NO_ERROR;
            }
        }else { // (Build.VERSION.SDK_INT >= 21)
            Log.i(TAG, "Build.VERSION.SDK_INT < 21");
            return ErrorCode.ANDROID_VERSION_NOT_COMPATIBLE_ERROR;
        }
    }
}
