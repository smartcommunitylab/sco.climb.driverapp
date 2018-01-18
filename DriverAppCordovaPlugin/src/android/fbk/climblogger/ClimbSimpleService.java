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
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.GregorianCalendar;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;
import java.util.UUID;

public class ClimbSimpleService extends Service implements fbk.climblogger.ClimbServiceInterface {
    public final static String ACTION_DATALOG_ACTIVE ="fbk.climblogger.ClimbSimpleService.ACTION_DATALOG_ACTIVE";
    public final static String ACTION_DATALOG_INACTIVE ="fbk.climblogger.ClimbSimpleService.ACTION_DATALOG_INACTIVE";
    public final static String EXTRA_STRING ="fbk.climblogger.ClimbSimpleService.EXTRA_STRING";

    private final static byte BLE_GAP_AD_TYPE_NULL                               = (byte)0x00; /**< Used to cut zeros.... */
    private final static byte BLE_GAP_AD_TYPE_FLAGS                              = (byte)0x01; /**< Flags for discoverability. */
    private final static byte BLE_GAP_AD_TYPE_16BIT_SERVICE_UUID_MORE_AVAILABLE  = (byte)0x02; /**< Partial list of 16 bit service UUIDs. */
    private final static byte BLE_GAP_AD_TYPE_16BIT_SERVICE_UUID_COMPLETE        = (byte)0x03; /**< Complete list of 16 bit service UUIDs. */
    private final static byte BLE_GAP_AD_TYPE_32BIT_SERVICE_UUID_MORE_AVAILABLE  = (byte)0x04; /**< Partial list of 32 bit service UUIDs. */
    private final static byte BLE_GAP_AD_TYPE_32BIT_SERVICE_UUID_COMPLETE        = (byte)0x05; /**< Complete list of 32 bit service UUIDs. */
    private final static byte BLE_GAP_AD_TYPE_128BIT_SERVICE_UUID_MORE_AVAILABLE = (byte)0x06; /**< Partial list of 128 bit service UUIDs. */
    private final static byte BLE_GAP_AD_TYPE_128BIT_SERVICE_UUID_COMPLETE       = (byte)0x07; /**< Complete list of 128 bit service UUIDs. */
    private final static byte BLE_GAP_AD_TYPE_SHORT_LOCAL_NAME                   = (byte)0x08; /**< Short local device name. */
    private final static byte BLE_GAP_AD_TYPE_COMPLETE_LOCAL_NAME                = (byte)0x09; /**< Complete local device name. */
    private final static byte BLE_GAP_AD_TYPE_TX_POWER_LEVEL                     = (byte)0x0A; /**< Transmit power level. */
    private final static byte BLE_GAP_AD_TYPE_CLASS_OF_DEVICE                    = (byte)0x0D; /**< Class of device. */
    private final static byte BLE_GAP_AD_TYPE_SIMPLE_PAIRING_HASH_C              = (byte)0x0E; /**< Simple Pairing Hash C. */
    private final static byte BLE_GAP_AD_TYPE_SIMPLE_PAIRING_RANDOMIZER_R        = (byte)0x0F; /**< Simple Pairing Randomizer R. */
    private final static byte BLE_GAP_AD_TYPE_SECURITY_MANAGER_TK_VALUE          = (byte)0x10; /**< Security Manager TK Value. */
    private final static byte BLE_GAP_AD_TYPE_SECURITY_MANAGER_OOB_FLAGS         = (byte)0x11; /**< Security Manager Out Of Band Flags. */
    private final static byte BLE_GAP_AD_TYPE_SLAVE_CONNECTION_INTERVAL_RANGE    = (byte)0x12; /**< Slave Connection Interval Range. */
    private final static byte BLE_GAP_AD_TYPE_SOLICITED_SERVICE_UUIDS_16BIT      = (byte)0x14; /**< List of 16-bit Service Solicitation UUIDs. */
    private final static byte BLE_GAP_AD_TYPE_SOLICITED_SERVICE_UUIDS_128BIT     = (byte)0x15; /**< List of 128-bit Service Solicitation UUIDs. */
    private final static byte BLE_GAP_AD_TYPE_SERVICE_DATA                       = (byte)0x16; /**< Service Data - 16-bit UUID. */
    private final static byte BLE_GAP_AD_TYPE_PUBLIC_TARGET_ADDRESS              = (byte)0x17; /**< Public Target Address. */
    private final static byte BLE_GAP_AD_TYPE_RANDOM_TARGET_ADDRESS              = (byte)0x18; /**< Random Target Address. */
    private final static byte BLE_GAP_AD_TYPE_APPEARANCE                         = (byte)0x19; /**< Appearance. */
    private final static byte BLE_GAP_AD_TYPE_ADVERTISING_INTERVAL               = (byte)0x1A; /**< Advertising Interval. */
    private final static byte BLE_GAP_AD_TYPE_LE_BLUETOOTH_DEVICE_ADDRESS        = (byte)0x1B; /**< LE Bluetooth Device Address. */
    private final static byte BLE_GAP_AD_TYPE_LE_ROLE                            = (byte)0x1C; /**< LE Role. */
    private final static byte BLE_GAP_AD_TYPE_SIMPLE_PAIRING_HASH_C256           = (byte)0x1D; /**< Simple Pairing Hash C-256. */
    private final static byte BLE_GAP_AD_TYPE_SIMPLE_PAIRING_RANDOMIZER_R256     = (byte)0x1E; /**< Simple Pairing Randomizer R-256. */
    private final static byte BLE_GAP_AD_TYPE_SERVICE_DATA_32BIT_UUID            = (byte)0x20; /**< Service Data - 32-bit UUID. */
    private final static byte BLE_GAP_AD_TYPE_SERVICE_DATA_128BIT_UUID           = (byte)0x21; /**< Service Data - 128-bit UUID. */
    private final static byte BLE_GAP_AD_TYPE_LESC_CONFIRMATION_VALUE            = (byte)0x22; /**< LE Secure Connections Confirmation Value */
    private final static byte BLE_GAP_AD_TYPE_LESC_RANDOM_VALUE                  = (byte)0x23; /**< LE Secure Connections Random Value */
    private final static byte BLE_GAP_AD_TYPE_URI                                = (byte)0x24; /**< URI */
    private final static byte BLE_GAP_AD_TYPE_3D_INFORMATION_DATA                = (byte)0x3D; /**< 3D Information Data. */
    private final static byte BLE_GAP_AD_TYPE_MANUFACTURER_SPECIFIC_DATA         = (byte)0xFF; /**< Manufacturer Specific Data. */

    public String dirName, file_name_log;
    File root;
    private File mFile = null;
    private FileWriter mFileWriter = null;
    private BufferedWriter mBufferedWriter = null;
    private boolean logEnabled;
    private boolean packetLogEnabled = false;
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
    public void onDestroy() { //not always called!!!
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
    private final static ParcelUuid EDDYSTONE_SERVICE_UUID = ParcelUuid.fromString("0000FEAA-0000-1000-8000-00805F9B34FB");
    private final static int APPLE_MANUFACTER_ID = 0x004c;
    private final static String CLIMB_NAMESPACE_EDDYSTONE = "3906bf230e2885338f44";

    private static String getNodeIdFromRawPacket(byte[] manufSpecField) {
        if(manufSpecField != null && manufSpecField.length > 1) {
            if(manufSpecField[0] == 0x00){ //0x00 is invalid as id
                return null;
            }
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
                //Prepara il filtro
                List<ScanFilter> mScanFilterList = new ArrayList<ScanFilter>();

                //Permette tutti i beacon con nome 'CLIMBM' o 'CLIMBC'
                mScanFilterList.add(new ScanFilter.Builder().setDeviceName(fbk.climblogger.ConfigVals.CLIMB_MASTER_DEVICE_NAME).build());
                mScanFilterList.add(new ScanFilter.Builder().setDeviceName(fbk.climblogger.ConfigVals.CLIMB_CHILD_DEVICE_NAME).build());
                //mScanFilterList.add(new ScanFilter.Builder().setDeviceAddress("B0:B4:48:BA:60:05").build());  //Climb child beacon 0x25

                //Permette tutti i beacon con Service UUID di EddyStone
                mScanFilterList.add(new ScanFilter.Builder().setServiceUuid(EDDYSTONE_SERVICE_UUID).build());

                /* Permette tutti i beacon EddyStone con namespace che inizia per 'ED',
                 * vedi https://developer.android.com/reference/android/bluetooth/le/ScanFilter.Builder.html#setServiceData(android.os.ParcelUuid, byte[])
                 * E' possibile filtrare per namespace o anche per instance
                 * Funziona SOLO con pacchetti Eddystone-UID, blocca il passaggio di tutti gli altri tipi (come EddyStone-TLM)
                */
/*
                byte[] serviceData = new byte[] {-19, -47}; //-19 == E; -27 == D
                mScanFilterList.add(new ScanFilter.Builder().setServiceData(EDDYSTONE_SERVICE_UUID, serviceData).build());
*/
                /* Permette tutti i beacon iBeacon (manufacturerId=0x004c; inizio pacchetto: 0x004c 0x02 0x15),
                 * vedi https://developer.android.com/reference/android/bluetooth/le/ScanFilter.Builder.html#setManufacturerData(android.os.ParcelUuid, byte[])
                 * E' possibile filtrare anche per UUID, per major o minor
                 */
                //0x004c == appleId; 2 == 0x02; 21 == 0x15
//                byte[] iBeaconServiceData = new byte[] {2, 21}; //See https://stackoverflow.com/questions/43301395/does-an-ibeacon-have-to-use-apples-company-id-if-not-how-to-identify-an-ibeac
//                mScanFilterList.add(new ScanFilter.Builder().setManufacturerData(APPLE_MANUFACTER_ID, iBeaconServiceData).build());

                //Imposta i settings di scan. Vedere dentro la clase ScanSettings le opzioni disponibili
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
                    //mBluetoothLeScanner.startScan(mScanCallback);     //Allow all bluetooth devices, skip filter
                    return 1;
                } else {
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
                if((bluetoothState == BluetoothAdapter.STATE_TURNING_OFF || bluetoothState == BluetoothAdapter.STATE_OFF) && maintenanceProcedureEnabled){
                    disableMaintenanceProcedure();
                }
            }
        }
    };

    private fbk.climblogger.ClimbServiceInterface.NodeState find_matching_bd_addr_node(String bd_address){
        Iterator it = seenChildren.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry pair = (Map.Entry)it.next();
            fbk.climblogger.ClimbServiceInterface.NodeState node = (fbk.climblogger.ClimbServiceInterface.NodeState)pair.getValue();
            if(node.bdAddress.equals(bd_address)){
                return node;
            }
            //it.remove(); // avoids a ConcurrentModificationException, but it breaks everything in ClimbSimpleService!
        }
        return null;
    }

    void updateChild(String id, String bd_address, String beacon_type) {
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
            s.firstSeen = nowMillis;
            s.bdAddress = bd_address;
            s.beaconType = beacon_type;
            s.batteryVoltage_mV = fbk.climblogger.ConfigVals.INVALID_BATTERY_VOLTAGE;
            s.batteryLevel = 0;
            seenChildren.put(id,s);
        } else {
            s.lastSeen = nowMillis;
            s.bdAddress = bd_address;
        }
        //broadcastUpdate(ACTION_METADATA_CHANGED,id);
    }

    void updateChild(String id, String bd_address, String beacon_type, int batteryVoltage) {
        updateChild(id, bd_address, beacon_type);
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


    private boolean logScanResult(long nowMillis, String db_address, int rssi, String packetType, String packet) {
        if(!packetLogEnabled){
            return false;
        }

        boolean ret = false;

        if (mBufferedWriter != null) { //Se il log è abilitato
            final String timestamp = new SimpleDateFormat("yyyy MM dd HH mm ss").format(new Date()); //Salva il timestamp per il log

            try {
                String logLine = "" + timestamp;
                    logLine += " " + nowMillis;
                    logLine += " " + db_address;
                    logLine += " " + packetType;
                    logLine += " ADV";
                    logLine += " " + rssi;
                    logLine += " " + packet;
                    logLine += "\n";

                if (packetType.startsWith("EDDYSTONE"))
                    packetType = "EDDYSTONE";

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

    //Scorre la lista dei beacon ed elimina quelli non più presenti dopo 'MaxTime' secondi
    private void node_timeout_check()
    {
        Iterator entries = seenChildren.entrySet().iterator();
        long MaxTime = fbk.climblogger.ConfigVals.MON_NODE_TIMEOUT;
        int checkTimeout = 1000;
        long nowmillis = System.currentTimeMillis();

        while (entries.hasNext())
        {
            Map.Entry entry = (Map.Entry) entries.next();
            NodeState node = (NodeState) entry.getValue();

            long lastSeen = node.lastSeen;

            if(nowmillis - lastSeen > MaxTime)
            {
                Log.i(TAG,"Node with ID: "+node.nodeID+" removed!");
                entries.remove();
            }
        }

        if(initialized) {
            Handler h = new Handler();
            h.postDelayed(new Runnable() {
                @Override
                public void run() {
                    node_timeout_check();
                }
            }, checkTimeout);
        }
    }

    private String toHexString(byte[] bytes) {
        final char[] HEX = "0123456789ABCDEF".toCharArray();
        if (bytes.length == 0) {
            return "";
        }
        char[] chars = new char[bytes.length * 2];
        for (int i = 0; i < bytes.length; i++) {
            int c = bytes[i] & 0xFF;
            chars[i * 2] = HEX[c >>> 4];
            chars[i * 2 + 1] = HEX[c & 0x0F];
        }
        return new String(chars).toUpperCase();
    }

    // --- Android 5+ specific code ---
    private ScanCallback mScanCallback;
    @TargetApi(21)
    class myScanCallback extends ScanCallback {

        @Override
        public void onBatchScanResults(List<ScanResult> results){}

        @Override
        public void onScanFailed(int errorCode){
            Log.e( TAG, "Error while starting the scan. ErrorCode: " + errorCode);
        }

        @Override
        public void onScanResult(int callbackType, ScanResult result)  //public for SO, not for upper layer!
        {
            if(callbackType == ScanSettings.CALLBACK_TYPE_ALL_MATCHES) {
                byte[] raw_packet = adv_report_parse(BLE_GAP_AD_TYPE_NULL, result.getScanRecord().getBytes());
                processNewAdvPacket(result.getDevice(), result.getRssi(), raw_packet);
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
            byte[] raw_packet = adv_report_parse(BLE_GAP_AD_TYPE_NULL, scanRecord);
            processNewAdvPacket(device, rssi, raw_packet);
        }
    };

    //--- Callbacks helpers -----------------------------------------------
    private enum PacketType {
        NOT_A_NODE,
        CLIMB_SENSORTAG,
        EDDYSTONE_UID,
        EDDYSTONE_EID,
        EDDYSTONE_URL,
        EDDYSTONE_TLM,
        IBEACON
    }

    private void processNewAdvPacket(BluetoothDevice device, int rssi, byte[] raw_packet){
        PacketType mPacketType = getFrameType(raw_packet);

        switch(mPacketType){
            case CLIMB_SENSORTAG:
                processClimbSensortagPkt(device, rssi, raw_packet);
                break;

            case EDDYSTONE_UID:
                processEddystoneUidPkt(device, rssi, raw_packet);
                break;

            case EDDYSTONE_TLM:
                processEddystoneTlmPkt(device, rssi, raw_packet);
                break;

            case IBEACON:
                processIbeaconPkt(device, rssi, raw_packet);    //not sure that the ibeacon adv is correctly detected....anyway the processIbeaconPkt(...) returns just for now
                break;
            case EDDYSTONE_URL:
            case EDDYSTONE_EID:
            case NOT_A_NODE:
                processUnknownPkt(device, rssi, raw_packet);
            default:
                return;
        }
    }

    private PacketType getFrameType(byte[] raw_packet){
        List<ParcelUuid> eddyStoneServiceUUID = new ArrayList<ParcelUuid>();  //Necessario per il controllo sottostante
        eddyStoneServiceUUID.add(EDDYSTONE_SERVICE_UUID);

        String deviceName = adv_get_name(raw_packet);
        List<ParcelUuid> ADV_UUIDS = adv_get_16bit_service_uuids(raw_packet);
        byte[] manuf_specific_data_apple = adv_get_manufacturer_specific_data(APPLE_MANUFACTER_ID,raw_packet);

        if (deviceName != null && deviceName.equals(fbk.climblogger.ConfigVals.CLIMB_CHILD_DEVICE_NAME))
        {
            if(adv_get_flags(raw_packet) == null) {
                return PacketType.CLIMB_SENSORTAG;
            }else{
                return PacketType.NOT_A_NODE; //in this case it is a CLIMBC in maintainance mode, do not add it to the list of kids!
            }
        }
        else if (ADV_UUIDS != null && ADV_UUIDS.equals(eddyStoneServiceUUID))
        {
            byte[] frameEdd = adv_get_16bit_uuid_service_data(EDDYSTONE_SERVICE_UUID,raw_packet);
            if (frameEdd[0] == 0x00)    //EddyStone-UID
            {
                return PacketType.EDDYSTONE_UID;
            }else if (frameEdd[0] == 0x10)   //EddyStone-URL
            {
                return PacketType.EDDYSTONE_URL;
            }
            else if (frameEdd[0] == 0x20)   //EddyStone-TLM
            {
                return PacketType.EDDYSTONE_TLM;
            }
            else if (frameEdd[0] == 0x30)   //EddyStone-EID. E' necessario essere connessi ad internet per decriptare il pacchetto.
            {
                return PacketType.EDDYSTONE_EID;
            }
        }
        else if (manuf_specific_data_apple != null)   //76 == 0x004c == appleID
        {
            return PacketType.IBEACON;
        }
        return PacketType.NOT_A_NODE;
    }

    private void processClimbSensortagPkt(BluetoothDevice device, int rssi, byte[] raw_packet){
        long nowMillis = System.currentTimeMillis();

        if (logEnabled && packetLogEnabled) {
            logScanResult(nowMillis, device.getAddress(), rssi, "CLIMBC", toHexString(raw_packet));
        }

        byte[] manufSpecDataPacket = adv_get_manufacturer_specific_data(TEXAS_INSTRUMENTS_MANUFACTER_ID, raw_packet);//result.getScanRecord().getManufacturerSpecificData(TEXAS_INSTRUMENTS_MANUFACTER_ID);
        String id = getNodeIdFromRawPacket(manufSpecDataPacket);
        if(id == null){
            return;
        }
        int batteryVoltage = getNodeBatteryVoltageFromRawPacket(manufSpecDataPacket);
        updateChild("0x" + id, device.getAddress(), "SENSORTAG", batteryVoltage); //Aggiorna la UI
    }
    private void processEddystoneUidPkt(BluetoothDevice device, int rssi, byte[] raw_packet){
        long nowMillis = System.currentTimeMillis();

        byte[] frameEdd = adv_get_16bit_uuid_service_data(EDDYSTONE_SERVICE_UUID,raw_packet);   //Frame EddyStone vero e proprio

        int txPower = (int) frameEdd[1];  //Potenza di trasmissione a 0 metri
        double distance = Math.pow(10, ((txPower - rssi) - 41) / 20.0);
        distance = Math.round(distance * 100.0) / 100.0;    //Arrotonda a 2 cifre decimali

        String hexValues = toHexString(Arrays.copyOfRange(frameEdd, 2, 18));
        String namespace = hexValues.substring(0, 20);
        String instance = hexValues.substring(20, 32);

        if(CLIMB_NAMESPACE_EDDYSTONE != null && !namespace.toUpperCase().equals(CLIMB_NAMESPACE_EDDYSTONE.toUpperCase())){ //discar all eddystone which are not climb nodes!
            return;
        }
        if (logEnabled && packetLogEnabled)
            logScanResult(nowMillis, device.getAddress(), rssi, "EDDYSTONE-UID",  toHexString(raw_packet));

        updateChild("0x" + namespace + instance, device.getAddress(), "EDDYSTONE"); //Aggiorna la UI

    }

    private void processEddystoneTlmPkt(BluetoothDevice device, int rssi, byte[] raw_packet){
        long nowMillis = System.currentTimeMillis();

        fbk.climblogger.ClimbServiceInterface.NodeState node = find_matching_bd_addr_node(device.getAddress());
        if(node == null)
            return;

        byte[] frameEdd = adv_get_16bit_uuid_service_data(EDDYSTONE_SERVICE_UUID,raw_packet);    //Frame EddyStone vero e proprio
        if(frameEdd == null)
            return;

        ByteBuffer buf = ByteBuffer.wrap(frameEdd);
        buf.get();  //Avanza di un byte
        buf.get();  //I primi due byte non ci interessano
        short voltage = buf.getShort(); //Avanza di 2 bytes
        //int temp = (int) (buf.get() + ((buf.get() & 0xff) / 256.0f));
        //int advCnt = buf.getInt();  //Avanza di 4 bytes
        //int upTime = buf.getInt();

        if (logEnabled && packetLogEnabled)
            logScanResult(nowMillis, device.getAddress(), rssi, "EDDYSTONE-TLM", toHexString(raw_packet));

        updateChild(node.nodeID, node.bdAddress, "EDDYSTONE",voltage); //Aggiorna la UI
    }

    private void processIbeaconPkt(BluetoothDevice device, int rssi, byte[] raw_packet){
        return;
//        return; //not defined how to use ibeacon in climb for now
//        long nowMillis = System.currentTimeMillis();
//
//        byte[] manufSpecDataPacket = adv_get_manufacturer_specific_data(APPLE_MANUFACTER_ID, raw_packet);
//
//        if (logEnabled && packetLogEnabled)
//            logScanResultRawPacket(nowMillis, device.getAddress(), rssi, "IBEACON", toHexString(raw_packet));
//
//        String uuid = toHexString(Arrays.copyOfRange(manufSpecDataPacket, 2, 18));
//
//        ByteBuffer buf = ByteBuffer.wrap(Arrays.copyOfRange(manufSpecDataPacket, 18, 23));
//        int major = buf.getShort() & 0xffff;
//        int minor = buf.getShort() & 0xffff;
//        byte txPower = buf.get();
//        updateChild(device.getAddress(), rssi, uuid, String.valueOf(major), String.valueOf(minor), String.valueOf(txPower), "IBEACON");
    }

    private void processUnknownPkt(BluetoothDevice device, int rssi, byte[] raw_packet) {
        return;
//            long nowMillis = System.currentTimeMillis();
//            String packetHex = toHexString(result.getScanRecord().getBytes());  //Pacchetto grezzo codificato in base 16
//
//            if (logEnabled && packetLogEnabled)
//                logScanResultRawPacket(nowMillis, result.getDevice(), result.getRssi(), "UNKNOWN!", packetHex);
//
//            updateChild(result.getDevice().getAddress(), result.getRssi(), "UNKNOWN!");
    }

    private byte[] adv_get_flags(byte[] raw_record){
        return adv_report_parse(BLE_GAP_AD_TYPE_FLAGS, raw_record);
    }

    private String adv_get_name(byte[] raw_record){
        byte[] name_raw_bytes = adv_report_parse(BLE_GAP_AD_TYPE_COMPLETE_LOCAL_NAME, raw_record);
        if(name_raw_bytes == null){
            return null;
        }
        try {
            return new String(name_raw_bytes, "UTF-8");
        }catch (Exception e){
            return null;
        }
    }

    private byte[] adv_get_manufacturer_specific_data(int manufacturer_id, byte[] raw_record){
        byte[] manuf_raw_bytes = adv_report_parse(BLE_GAP_AD_TYPE_MANUFACTURER_SPECIFIC_DATA, raw_record);
        if(manuf_raw_bytes != null && manuf_raw_bytes.length >= 2) {
            if (((manuf_raw_bytes[1] << 8) + manuf_raw_bytes[0]) == manufacturer_id){
                byte[] ret_array = new byte[manuf_raw_bytes.length - 2];
                System.arraycopy(manuf_raw_bytes, 2, ret_array, 0, manuf_raw_bytes.length - 2);
                return ret_array;
            }
        }
        return null;
    }

    private byte[] adv_get_16bit_uuid_service_data(ParcelUuid target_uuid, byte[] raw_record){
        List<ParcelUuid> uuid_list = adv_get_16bit_service_uuids(raw_record);
        boolean is_uuid_present = uuid_list.contains(target_uuid);
        if(is_uuid_present){
            byte[] data_raw_bytes = adv_report_parse(BLE_GAP_AD_TYPE_SERVICE_DATA, raw_record);

            long uuid_16bit = ((((data_raw_bytes[1]<<8)&0xFF00) + (data_raw_bytes[0]&0x00FF))&0xFFFF);
            long high = fbk.climblogger.ConfigVals.BLE_BASE_UUID.getMostSignificantBits() + (uuid_16bit<<32) ; //THIS DOESN'T WORK AS EXPECTED!!!
            long low = fbk.climblogger.ConfigVals.BLE_BASE_UUID.getLeastSignificantBits();


            ParcelUuid complete_uuid = new ParcelUuid(new UUID(high, low));
            if(complete_uuid.equals(target_uuid)) {
                byte[] ret_array = new byte[data_raw_bytes.length - 2];
                System.arraycopy( data_raw_bytes, 2, ret_array, 0, data_raw_bytes.length - 2 );
                return ret_array;
            }else{
                return null;
            }
        }
        return null;
    }

    private List<ParcelUuid> adv_get_16bit_service_uuids(byte[] raw_record){ //ATTENZIONE!! QUESTO CERCA SOLO IL PRIMO UUID!!!
        byte[] uuid_raw_bytes = adv_report_parse(BLE_GAP_AD_TYPE_16BIT_SERVICE_UUID_COMPLETE, raw_record);
        if(uuid_raw_bytes == null){
            return null;
        }

        long uuid_16bit = ((((uuid_raw_bytes[1]<<8)&0xFF00) + (uuid_raw_bytes[0]&0x00FF))&0xFFFF);
        long high = fbk.climblogger.ConfigVals.BLE_BASE_UUID.getMostSignificantBits() + (uuid_16bit<<32) ;
        long low = fbk.climblogger.ConfigVals.BLE_BASE_UUID.getLeastSignificantBits();
        List<ParcelUuid> UUIDS = new ArrayList<ParcelUuid>();
        UUIDS.add(new ParcelUuid(new UUID(high, low)));
        return UUIDS;
    }

    private byte[] adv_report_parse(byte taget_type, byte[] raw_record)
    {
        int index = 0;
        while (index + 1 < raw_record.length && raw_record[index] != 0)
        {
            byte field_length = raw_record[index];
            byte field_type   = raw_record[index + 1];

            if (field_type == taget_type && field_type != BLE_GAP_AD_TYPE_NULL)
            {
                byte[] ret_array = new byte[field_length - 1];
                System.arraycopy( raw_record, index + 2, ret_array, 0, field_length - 1 );
                return ret_array;
            }
            index += field_length + 1;
        }

        if(taget_type == BLE_GAP_AD_TYPE_NULL){
            byte[] ret_array = new byte[index];
            System.arraycopy( raw_record, 0, ret_array, 0, index );
            return ret_array;
        }
        return null;
    }

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
        boolean ret = (StartScanning(true) == 1);
        initialized = ret;
        insertTag("init: " + ret);
        Log.i(TAG, "Initializing: ret = " + ret);
        node_timeout_check();
        return ret;
    }

    public boolean deinit() {
        disableMaintenanceProcedure();
        boolean ret = (StopMonitoring() == 1);
        seenChildren = new HashMap<String, fbk.climblogger.ClimbServiceInterface.NodeState>(); //empty node list!
        broadcastUpdate(ACTION_METADATA_CHANGED);
        initialized = false;
        logEnabled = false;
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
        return seenChildren.values().toArray(new NodeState[0]);
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
        //TODO:se il file c'è già non crearlo, altrimenti creane un'altro
        if(mBufferedWriter == null){ // il file non � stato creato, quindi crealo
            if( get_log_num() == 1) {
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

    @TargetApi(21)
    public ErrorCode enableMaintenanceProcedure(int wakeUP_year, int wakeUP_month, int wakeUP_day, int wakeUP_hour, int wakeUP_minute) {
        if (Build.VERSION.SDK_INT < 21) {
            Log.w(TAG, "Build.VERSION.SDK_INT < 21");
            insertTag("Cannot_enable_advertise,Build.VERSION.SDK_INT<21");
            return ErrorCode.ANDROID_VERSION_NOT_COMPATIBLE_ERROR;
        }
        if (mBluetoothAdapter == null) {
            Log.w(TAG, "mBluetoothAdapter == null");
            insertTag("Cannot_enable_advertise,mBluetoothAdapter==null");
            return ErrorCode.INTERNAL_ERROR; //internal error
        }
        if(bluetoothState != BluetoothAdapter.STATE_ON){
            Log.w(TAG, "the bluetooth is not enabled");
            insertTag("Cannot_enable_advertise,bluetoothState!=BluetoothAdapter.STATE_ON");
            return ErrorCode.ADVERTISER_NOT_AVAILABLE_ERROR;
        }
        mBluetoothLeAdvertiser = mBluetoothAdapter.getBluetoothLeAdvertiser();

        if (mBluetoothLeAdvertiser == null ) {
            Log.w(TAG, "mBluetoothLeAdvertiser == null");
            insertTag("Cannot_enable_advertise,mBluetoothLeAdvertiser==null");
            return ErrorCode.ADVERTISER_NOT_AVAILABLE_ERROR;
        }

        if (!mBluetoothAdapter.isMultipleAdvertisementSupported()) {
            Log.w(TAG, "multiple advertisement not supported");
            //return ErrorCode.ADVERTISER_NOT_AVAILABLE_ERROR; //do not return for this. Try to change the name anyway, eventually it will return with WRONG_BLE_NAME_ERROR
        }

        if (!maintenanceProcedureEnabled){ //don't overwrite the originalDeviceName if successive calls to enableMaintenanceProcedure are performed without calling disableMaintenanceProcedure
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
