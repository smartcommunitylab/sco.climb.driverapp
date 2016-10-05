package fbk.climblogger;

import android.annotation.TargetApi;
import android.app.Service;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanFilter;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.content.Context;
import android.content.Intent;
import android.os.Binder;
import android.os.Build;
import android.os.Environment;
import android.os.IBinder;
import android.support.annotation.Nullable;
import android.util.Log;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.TimeZone;

public class ClimbSimpleService extends Service implements ClimbServiceInterface{
    public final static String ACTION_DATALOG_ACTIVE ="fbk.climblogger.ClimbSimpleService.ACTION_DATALOG_ACTIVE";
    public final static String ACTION_DATALOG_INACTIVE ="fbk.climblogger.ClimbSimpleService.ACTION_DATALOG_INACTIVE";
    public final static String EXTRA_STRING ="fbk.climblogger.ClimbSimpleService.EXTRA_STRING";

    public String dirName, file_name_log;
    File root;
    private File mFile = null;
    private FileWriter mFileWriter = null;
    private BufferedWriter mBufferedWriter = null;
    private boolean logEnabled;
    private ArrayList<ClimbNode> nodeList;
    private boolean initialized = false;

    //--- Service -----------------------------------------------

    private final String TAG = "ClimbSimpleService";

    private IBinder mBinder;

    public class LocalBinder extends Binder {
        public ClimbServiceInterface getService() {
            return ClimbSimpleService.this;
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        Log.i(TAG, "ClimbService created");

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

        StopMonitoring();

        if (mBufferedWriter != null) {
            try {
                mBufferedWriter.flush();
            } catch (IOException e) {
            }
        }
    }

    //--- BlueTooth -----------------------------------------------

    private BluetoothManager mBluetoothManager;
    private BluetoothAdapter mBluetoothAdapter;
    private BluetoothLeScanner mBluetoothLeScanner;

    private final static int TEXAS_INSTRUMENTS_MANUFACTER_ID = 0x000D;
    private static String nodeID2String(byte[] id) {
        return String.format("%02X", id[0]);
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
                insertTag("Start_Monitoring " + ConfigVals.libVersion);
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
            }
            if (Build.VERSION.SDK_INT < 18) {
                Log.e(TAG, "API level " + Build.VERSION.SDK_INT + " not supported!");
                return 0;
            } else if (Build.VERSION.SDK_INT < 21) {
                mLeScanCallback = new myLeScanCallback();
                if (!mBluetoothAdapter.startLeScan(mLeScanCallback)) {
                    return 0;
                }
                ;
            } else {
                //prepare filter
                List<ScanFilter> mScanFilterList = new ArrayList<ScanFilter>();
                mScanFilterList.add(new ScanFilter.Builder().setDeviceName(ConfigVals.CLIMB_MASTER_DEVICE_NAME).build());
                mScanFilterList.add(new ScanFilter.Builder().setDeviceName(ConfigVals.CLIMB_CHILD_DEVICE_NAME).build());

                //imposta i settings di scan. vedere dentro la clase ScanSettings le opzioni disponibili
                ScanSettings mScanSettings = new ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build();

                mScanCallback = new myScanCallback();
                mBluetoothLeScanner = mBluetoothAdapter.getBluetoothLeScanner();
                if (mBluetoothLeScanner == null) {
                    Log.e(TAG, "Unable to obtain a mBluetoothLeScanner.");
                    return 0;
                }
                mBluetoothLeScanner.startScan(mScanFilterList, mScanSettings, mScanCallback);
            }
        }
        return 1;
    }

    public int StopMonitoring(){ //TODO: not exposed in main API
        if(mBluetoothAdapter != null) {
            if (Build.VERSION.SDK_INT < 21) {
                if (mBluetoothAdapter != null) {
                    mBluetoothAdapter.stopLeScan(mLeScanCallback);
                }
            } else {
                if (mBluetoothLeScanner != null) {
                    mBluetoothLeScanner.stopScan(mScanCallback);
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
        //TODO: spegnere la ricerca ble
        //TODO: fermare il log
        return 1;
    }

    void updateChild(String id) {
        long nowMillis = System.currentTimeMillis();
        NodeState s = seenChildren.get(id);
        if (s == null) {
            s = new NodeState();
            s.nodeID = id;
            s.state = State.CHECKING.getValue();
            s.lastStateChange = nowMillis;
            s.lastSeen = nowMillis;
            seenChildren.put(id,s);
        } else {
            s.lastSeen = nowMillis;
        }
        broadcastUpdate(ACTION_DATALOG_ACTIVE, ACTION_METADATA_CHANGED,id);
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
            //TODO: AGGIUNGERE RSSI
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
        public void onScanFailed(int errorCode){}

        @Override
        public void onScanResult(int callbackType, ScanResult result){  //public for SO, not for upper layer!
            if(callbackType == ScanSettings.CALLBACK_TYPE_ALL_MATCHES) {
                long nowMillis = System.currentTimeMillis();
                String id;
                if (logEnabled) {
                    logScanResult(result.getDevice(),
                            result.getRssi(),
                            result.getScanRecord().getManufacturerSpecificData(TEXAS_INSTRUMENTS_MANUFACTER_ID),
                            nowMillis);
                }
                if (result.getDevice().getName().equals(ConfigVals.CLIMB_CHILD_DEVICE_NAME)) {
                    id = nodeID2String(result.getScanRecord().getManufacturerSpecificData(TEXAS_INSTRUMENTS_MANUFACTER_ID));
                } else {
                    id = result.getDevice().getAddress();
                }

                updateChild(id);
            }
        }
    };

    // --- Android 4.x specific code ---
    private myLeScanCallback mLeScanCallback;
    class myLeScanCallback implements BluetoothAdapter.LeScanCallback {
        @Override
        public void onLeScan(final BluetoothDevice device, int rssi, byte[] scanRecord) {
            String id;
            long nowMillis = System.currentTimeMillis();
            if (device != null) {
                if (logEnabled && device.getName().equals(ConfigVals.CLIMB_CHILD_DEVICE_NAME)) {
                    logScanResult(device,
                        rssi,
                        scanRecord,
                        nowMillis);
                }
                if (device.getName() != null && device.getName().equals(ConfigVals.CLIMB_CHILD_DEVICE_NAME)) {
                    //id = nodeID2String(scanRecord);
                    id = nodeID2String(Arrays.copyOfRange(scanRecord,12,scanRecord.length));
                } else {
                    id = device.getAddress();
                }

                updateChild(id);
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

    //--- CLIMB API -----------------------------------------------

    private String[] allowedChildren = new String[0];
    private HashMap<String,NodeState> seenChildren = new HashMap<String,NodeState>();

    public boolean init() {
        Log.i(TAG, "Initializing");
       // insertTag("Initializing");
       // return StartScanning();

        boolean ret = (StartScanning(true) == 1);
        initialized = ret;
        insertTag("init: " + ret);
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
                mFile = null;
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
        dirName=ConfigVals.folderName;
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


}
