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
import android.os.Handler;
import android.os.IBinder;
import android.support.annotation.Nullable;
import android.util.Log;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

public class ClimbSimpleService extends Service implements ClimbServiceInterface{

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

    private boolean StartScanning() {

        if(mBluetoothAdapter == null) {
            return false;
        }

        if (Build.VERSION.SDK_INT < 18) {
            Log.e(TAG, "API level " + Build.VERSION.SDK_INT + " not supported!");
            return false;
        } else if (Build.VERSION.SDK_INT < 21) {
            mLeScanCallback = new myLeScanCallback();
            if (! mBluetoothAdapter.startLeScan(mLeScanCallback)) {
                return false;
            };
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
                return false;
            }
            mBluetoothLeScanner.startScan(mScanFilterList, mScanSettings, mScanCallback);
        }
        return true;
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
        broadcastUpdate(ACTION_METADATA_CHANGED,id);
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
                String id;
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

    //--- CLIMB API -----------------------------------------------

    private String[] allowedChildren = new String[0];
    private HashMap<String,NodeState> seenChildren = new HashMap<String,NodeState>();

    public boolean init() {
        Log.i(TAG, "Initializing");
        return StartScanning();
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
        broadcastUpdate(STATE_DISCONNECTED_FROM_CLIMB_MASTER, mMaster); //TODO: might need to delay this to avoid race conditions in caller
        return true;
    }

    public String[] getLogFiles() {
        return new String[0];
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
}
