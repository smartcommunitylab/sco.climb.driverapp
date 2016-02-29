package fbk.climblogger;

import android.app.Service;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCallback;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothProfile;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanFilter;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.content.Context;
import android.content.Intent;
import android.os.Binder;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.IBinder;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;
import android.os.SystemClock;
import android.util.Log;
import android.widget.Toast;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.TimeZone;
import java.util.UUID;

interface ClimbNodeTimeout {
    public void climbNodeTimedout(ClimbNode node);
}

public class ClimbService extends Service implements ClimbServiceInterface {

    private BluetoothDevice  mBTDevice = null;
    private BluetoothGattService mBTService = null;
    private BluetoothGattCharacteristic mCIPOCharacteristic = null, mPICOCharacteristic = null;
    final static private UUID mClimbServiceUuid = ConfigVals.Service.CLIMB;
    final static private UUID mCIPOCharacteristicUuid = ConfigVals.Characteristic.CIPO;
    final static private UUID mPICOCharacteristicUuid = ConfigVals.Characteristic.PICO;
    private String mBluetoothDeviceAddress;
    private BluetoothGatt mBluetoothGatt = null;

    private boolean nodeTimeOutEnabled = false;

    private final static int TEXAS_INSTRUMENTS_MANUFACTER_ID = 0x000D;

    private BluetoothManager mBluetoothManager;
    private BluetoothAdapter mBluetoothAdapter;
    private BluetoothLeScanner mBluetoothLeScanner;
    private boolean mScanning = false;
    private IBinder mBinder;
    private final String TAG = "ClimbService_GIOVA";
    private ArrayList<ClimbNode> nodeList;

    public String dirName, dirName2,update_name_log,file_name_log;
    File root;
    private File mFile = null;
    private FileWriter mFileWriter = null;
    private BufferedWriter mBufferedWriter = null;
    private boolean logEnabled;

    private int index = 0;

    private Context appContext = null;

    private Handler mHandler = null;
    private int masterNodeGATTConnectionState = BluetoothProfile.STATE_DISCONNECTED;

    private void broadcastUpdate(final String action) {
        final Intent intent = new Intent(action);
        Log.d(TAG, "Sending broadcast, action = " + action);

        sendBroadcast(intent);
    }

    private void broadcastUpdate(final String action, final String extra_type, final int[] extra_data) {
        final Intent intent = new Intent(action);

        intent.putExtra(extra_type,extra_data);

        Log.d(TAG, "Sending broadcast, action = " + action + ". extra_type = " + extra_type + ". extra dimensions = " + extra_data.length);
        sendBroadcast(intent);
    }

    private void broadcastUpdate(final String action, final String extra_type, final byte[] extra_data) {
        final Intent intent = new Intent(action);

        intent.putExtra(extra_type,extra_data);

        Log.d(TAG, "Sending broadcast, action = " + action + ". extra_type = " + extra_type + ". extra dimensions = " + extra_data.length);
        sendBroadcast(intent);
    }

    private void broadcastUpdate(final String action, final String extra_type, String extra_string) {
        final Intent intent = new Intent(action);

        intent.putExtra(extra_type,extra_string);
        Log.d(TAG, "Sending broadcast, action = " + action + ". extra_type = " + extra_type);
        sendBroadcast(intent);
    }

    @Override
    public IBinder onBind(Intent intent) {
        Log.i(TAG, "ClimbService bound");

        return mBinder;
    }


    public class LocalBinder extends Binder {
        public ClimbService getService() {
            return ClimbService.this;
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        Log.i(TAG, "ClimbService started");

        mBinder = new LocalBinder();
        mHandler = new Handler();

        if(nodeList == null)  nodeList = new ArrayList<ClimbNode>(); //crea la lista (vuota) che terrà conto dei dispositivi attualmente visibili
        //TODO: why the if above? could it be not empty on onCreate?
        if(mBluetoothManager == null) { //TODO: why this if?
            initialize(); //TODO: handle error somehow
        }

    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.i(TAG, "ClimbService Stopped.");

    }

    @Override
    public boolean onUnbind(Intent intent) {

        return super.onUnbind(intent);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.i(TAG, "Received start id " + startId + ": " + intent);

        return START_STICKY; // run until explicitly stopped.
    }

    public boolean initialize() {
        // For API level 18 and above, get a reference to BluetoothAdapter through
        // BluetoothManager.
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

        mBluetoothLeScanner = mBluetoothAdapter.getBluetoothLeScanner();
        if (mBluetoothLeScanner == null) {
            Log.e(TAG, "Unable to obtain a mBluetoothLeScanner.");
            return false;
        }



        return true;
    }


    public ArrayList getNodeList(){

        return nodeList;
    }

    public boolean setNodeList(String[] children) {
        ClimbNode master = nodeListGetConnectedMaster();
        if (master == null) {
            return false;
        }
        master.setAllowedChildrenList(children);
        //TODO: handle changes
        return true;
    }

    //DEBUG
    /*
    public ArrayList addNode(){
        String name = "Nome " + index;
        nodeList.add(index, new ClimbNode(name, null, index*10));
        index ++;

        broadcastUpdate(ACTION_DEVICE_ADDED_TO_LIST);

        return nodeList;
    }
    //DEBUG
    public ArrayList removeNode(){
        index--;
        nodeList.remove(index);

        broadcastUpdate(ACTION_DEVICE_ADDED_TO_LIST);

        return nodeList;
    }
*/
    public int StartMonitoring(boolean enableDatalog){ //TODO: not exposed in main API

        if(mBluetoothAdapter != null) {

            if(enableDatalog) {

                startDataLog();
                insertTag("Start_Monitoring");
                logEnabled = true;
                broadcastUpdate(ACTION_DATALOG_ACTIVE,EXTRA_STRING,file_name_log);
            }

            mScanning = true;
            //prepara il filtro che fa in modo di fare lo scan solo per device compatibili con climb (per ora filtra il nome)
            ScanFilter mScanFilter = new ScanFilter.Builder().setDeviceName(ConfigVals.CLIMB_MASTER_DEVICE_NAME).build();
            List<ScanFilter> mScanFilterList = new ArrayList<>();
            mScanFilterList.add(mScanFilter);
            mScanFilter = new ScanFilter.Builder().setDeviceName(ConfigVals.CLIMB_CHILD_DEVICE_NAME).build();
            mScanFilterList.add(mScanFilter);

            //imposta i settings di scan. vedere dentro la clase ScanSettings le opzioni disponibili
            ScanSettings mScanSettings = new ScanSettings.Builder()
                                             .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
                                             .build();

            mBluetoothLeScanner.startScan(mScanFilterList, mScanSettings, mScanCallback);
            //mBluetoothLeScanner.startScan(mScanCallback);
            enableNodeTimeout();
        }else{
            Log.w(TAG, "mBluetoothAdapter == NULL!!");
        }
        //TODO: iniziare la ricerca ble
        //TODO: avviare il log
        return 1;
    }

    public void init() {
        StartMonitoring(true);
    }

    public int StopMonitoring(){ //TODO: not exposed in main API
        if(mBluetoothAdapter != null) {
            mScanning = true;
            disableNodeTimeout();
            mBluetoothLeScanner.stopScan(mScanCallback);

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

    public boolean insertTag(String tagDescriptiveString){ //TODO: not exposed in main API

            if (logEnabled) {
                if (mBufferedWriter != null) {
                    long nowMillis = SystemClock.uptimeMillis();
                    final String timestamp = new SimpleDateFormat("yyyy MM dd HH mm ss").format(new Date()); // salva il timestamp per il log
                    try {

                        try {
                            String tagString = "" + timestamp +
                                    " " + nowMillis +
                                    " " + mBTDevice.getAddress() +
                                    " LOCAL_DEVICE " +
                                    "TAG data " +
                                    tagDescriptiveString +
                                    "\n";

                            mBufferedWriter.write(tagString);

                        /*
                        mBufferedWriter.write(timestamp + " " + nowMillis);
                        mBufferedWriter.write(" " + mBTDevice.getAddress());
                        mBufferedWriter.write(" LOCAL_DEVICE "); //NAME
                        mBufferedWriter.write("TAG" + " ");

                        mBufferedWriter.write("\n");
                        mBufferedWriter.flush();
*/
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

    public boolean SendCheckInAllCmd() { //TODO: not exposed in main API
        if (mBluetoothAdapter != null) {

            if (mBluetoothGatt == null) {
                Toast.makeText(appContext,
                        "Master NOT CONNECTED!",
                        Toast.LENGTH_SHORT).show();
                return false;
            }

            if(mPICOCharacteristic != null) {
                byte[] gattData = {(byte) 0xFF, (byte) 0x01,(byte) 0x02};
                String tempString = "Checking_in_all_nodes";
                insertTag(tempString);
                mPICOCharacteristic.setValue(gattData);
                mBluetoothGatt.writeCharacteristic(mPICOCharacteristic);
                return true;
            }else{
                Log.w(TAG, "mPICOCharacteristic not already discovered?");
                return false;
            }

        }
        return false;
    }

    public boolean SendCheckOutAllCmd(){ //TODO: not exposed in main API
        if (mBluetoothAdapter != null) {

            if (mBluetoothGatt == null) {
                Toast.makeText(appContext,
                        "Master NOT CONNECTED!",
                        Toast.LENGTH_SHORT).show();
                return false;
            }

            if(mPICOCharacteristic != null) {
                byte[] gattData = {(byte) 0xFF,(byte) 0x01, (byte) 0x00};
                String tempString = "Checking_out_all_nodes";
                insertTag(tempString);
                mPICOCharacteristic.setValue(gattData);
                mBluetoothGatt.writeCharacteristic(mPICOCharacteristic);
                return true;
            }else{
                Log.w(TAG, "mPICOCharacteristic not already discovered?");
                return false;
            }

        }
        return false;
    }

    public boolean ScheduleWakeUpCmd(int timeout_sec){
        if (mBluetoothAdapter != null) {

            if (mBluetoothGatt == null) {
                Toast.makeText(appContext,
                        "Master NOT CONNECTED!",
                        Toast.LENGTH_SHORT).show();
                return false;
            }

            if(mPICOCharacteristic != null) {

                byte[] gattData = {(byte) 0xFF,(byte) 0x02, (byte)((timeout_sec>>16)&0xFF), (byte)((timeout_sec>>8)&0xFF), (byte)(timeout_sec&0xFF)};
                String tempString = "Sending_wake_up_schedule";
                insertTag(tempString);
                mPICOCharacteristic.setValue(gattData);
                mBluetoothGatt.writeCharacteristic(mPICOCharacteristic);
                return true;
            }else{
                Log.w(TAG, "mPICOCharacteristic not already discovered?");
                return false;
            }

        }
        return false;
    }

    public boolean SendReleaseAllCmd(){
        if (mBluetoothAdapter != null) {

            if (mBluetoothGatt == null) {
                Toast.makeText(appContext,
                        "Master NOT CONNECTED!",
                        Toast.LENGTH_SHORT).show();
                return false;
            }

            if(mPICOCharacteristic != null) {
                byte[] gattData = {(byte) 0xFF, (byte) 0xFF};
                String tempString = "Accepting all nodes";
                insertTag(tempString);
                mPICOCharacteristic.setValue(gattData);
                mBluetoothGatt.writeCharacteristic(mPICOCharacteristic);
                return true;
            }else{
                Log.w(TAG, "mPICOCharacteristic not already discovered?");
            }

        }
        return false;
    }

    public boolean isMonitoring(){
        return mScanning;
    }

    public String[] getMasters() {
        ArrayList<String> ids = new ArrayList<>();
        for(ClimbNode n : nodeList) {
            if (n.isMasterNode()) {
                ids.add(n.getNodeID());
            }
        }
        return ids.toArray(new String[ids.size()]);
    }

    public NodeState getNodeState(String id){
        ClimbNode master = nodeListGetConnectedMaster();
        if (master == null) {
            // TODO
            return null;
        }
        ArrayList<MonitoredClimbNode> children = master.getMonitoredClimbNodeList();
        NodeState nodeState = null;
        for(int i = 0; i < children.size(); i++){
            MonitoredClimbNode n = children.get(i);
            if (n.getNodeIDString().equals(id)) {
                nodeState = new NodeState();
                nodeState.nodeID = n.getNodeIDString();
                nodeState.state = n.getNodeState();
                nodeState.lastSeen = n.getLastContactMillis();
                nodeState.lastStateChange = n.getLastStateChangeMillis();
                break;
            }
        }
        return nodeState; //null if not found
    }

    public NodeState[] getNetworkState() {
        ClimbNode master = nodeListGetConnectedMaster();
        if (master == null) {
            // TODO
            return null;
        }
        ArrayList<MonitoredClimbNode> children = master.getMonitoredClimbNodeList();
        NodeState[] nodeStates = new NodeState[children.size()];

        for(int i = 0; i < children.size(); i++){
            MonitoredClimbNode n = children.get(i);
            nodeStates[i] = new NodeState();
            nodeStates[i].nodeID = n.getNodeIDString();
            nodeStates[i].state = n.getNodeState();
            nodeStates[i].lastSeen = n.getLastContactMillis();
            nodeStates[i].lastStateChange = n.getLastStateChangeMillis();
        }

        return nodeStates;
    }


    private ClimbNode nodeListGet(String master) {  //TODO: include in nodeList
        for(int i = 0; i < nodeList.size(); i++){
            if (nodeList.get(i).getNodeID().equals(master)) {
                return nodeList.get(i);
            }
        }

        return null;
    }

    private ClimbNode nodeListGetConnectedMaster() {  //TODO: include in nodeList
        for(int i = 0; i < nodeList.size(); i++){
            if (nodeList.get(i).getConnectionState()) {
                return nodeList.get(i);
            }
        }

        return null;
    }

    public boolean connectMaster(String master) {
        ClimbNode node = nodeListGet(master);
        if (node != null && node.isMasterNode()) { //do something only if it is a master node

            if (mBluetoothGatt == null) {
                insertTag("Connecting_to_GATT");
                mBTDevice = node.getBleDevice();
                mBluetoothGatt = mBTDevice.connectGatt(appContext, false, mGattCallback); //TODO: check whu context is needed

                if (mBluetoothGatt == null) {
                    Log.w(TAG, "connectGatt returned null!");
                }

                masterNodeGATTConnectionState = BluetoothProfile.STATE_CONNECTING;

                Log.i(TAG, "Try to connect a CLIMB master node!");
                Toast.makeText(appContext,
                        "Connecting!",
                        Toast.LENGTH_SHORT).show();
            } // TODO: else handle error
        } else {
            return false;
        }
        return true;
    }

    public boolean disconnectMaster() { //TODO: handle several masters?
        if (mBluetoothGatt != null) {
            insertTag("Disconnecting_from_GATT");

            mBluetoothGatt.disconnect();
            //mBluetoothGatt.close(); //TODO: check if this is needed here, or should better be done when disconnected
            //mBluetoothGatt = null;
            //mBTService = null;
            //mCIPOCharacteristic = null;
            //mPICOCharacteristic = null;

            Log.i(TAG, "Climb master node disconnecting ...");
            Toast.makeText(appContext,
                    "Disconnecting...",
                    Toast.LENGTH_SHORT).show();

            if (mBTDevice != null) {
                int index = isAlreadyInList(mBTDevice);
                if (index >= 0) {
                    nodeList.get(index).setConnectionState(false);
                } else {
                    Log.d(TAG, "Master not found in the list, CHECK!!!!");
                }
            }
            broadcastUpdate(STATE_DISCONNECTED_FROM_CLIMB_MASTER);
        }
        return true; //TODO: handle errors
    }

    public void checkinChild(String child) {
        ClimbNode master = nodeListGetConnectedMaster();
        if (master == null) {
            return; //TODO: exception
        }
        MonitoredClimbNode monitoredChild = master.getChildByID(child);
        if(monitoredChild != null){
            byte[] clickedChildID = monitoredChild.getNodeID();
            byte clickedChildState = monitoredChild.getNodeState();

            if(clickedChildState == 1){ //se lo stato è CHECKING
                byte[] gattData = {clickedChildID[0],  2}; //assegna lo stato ON_BAORD e invia tutto al gatt
                String tempString = "Acceptiong_node_"+clickedChildID[0];
                insertTag(tempString);
                mPICOCharacteristic.setValue(gattData);
                mBluetoothGatt.writeCharacteristic(mPICOCharacteristic);
            } //TODO: error
        } //TODO: error
    }

    public void checkinChildren(String[] children) {
        for (String child : children) {
            checkinChild(child);
        }
    }

    public void checkoutChild(String child) {
        ClimbNode master = nodeListGetConnectedMaster();
        if (master == null) {
            return; //TODO: error
        }
        MonitoredClimbNode monitoredChild = master.getChildByID(child);
        if(monitoredChild != null){
            byte[] clickedChildID = monitoredChild.getNodeID();
            byte clickedChildState = monitoredChild.getNodeState();

            if(clickedChildState == 2) { //se lo stato è ON_BAORD
                byte[] gattData = {clickedChildID[0],  0}; //assegna lo stato BY_MYSELF e invia tutto al gatt
                String tempString = "Checking_out_node_"+clickedChildID[0];
                insertTag(tempString);
                mPICOCharacteristic.setValue(gattData);
                mBluetoothGatt.writeCharacteristic(mPICOCharacteristic);
            } //TODO: error
        } //TODO: error
    }

    public void checkoutChildren(String[] children) {
        for (String child : children) {
            checkoutChild(child);
        }
    }

    //-----------------------------------------------------

    public BluetoothDevice getBTDevice_ClimbMaster(){
        return mBTDevice;
    }
    ScanCallback mScanCallback = new ScanCallback() {

        boolean scanForAll = false;

        @Override
        public void onBatchScanResults(List<ScanResult> results){

        }

        @Override
        public void onScanFailed(int errorCode){

        }

        @Override
        public void onScanResult(int callbackType, ScanResult result){  //public for SO, not for upper layer!
            Log.d(TAG, "onScanResult called!");
            if(callbackType == ScanSettings.CALLBACK_TYPE_ALL_MATCHES) {
                long nowMillis = SystemClock.uptimeMillis();
                //PRIMA DI TUTTO SALVA IL LOG
                if (logEnabled) {
                    if (mBufferedWriter != null) { // questo significa che il log � stato abilitato
                        final String timestamp = new SimpleDateFormat("yyyy MM dd HH mm ss").format(new Date()); // salva il timestamp per il log
                        String manufString = "";

                        byte[] manufacterData = result.getScanRecord().getManufacturerSpecificData(TEXAS_INSTRUMENTS_MANUFACTER_ID);
                        if(manufacterData != null) {
                            for (int i = 0; i < manufacterData.length; i++) {
                                manufString = manufString + String.format("%02X", manufacterData[i]);
                            }
                        }


                        try {
                            String logLine =  ""+ timestamp +
                                            " " + nowMillis +
                                            " " + result.getDevice().getAddress() +
                                            " " + result.getDevice().getName() +
                                            " ADV data" +
                                            " " + manufString +
                                            "\n" ;
                            //TODO: AGGIUNGERE RSSI
                            //mBufferedWriter.write(timestamp + " " + nowMillis);
                            //mBufferedWriter.write(" " + result.getDevice().getAddress()); //MAC ADDRESS
                            //mBufferedWriter.write(" " + result.getDevice().getName() + " "); //NAME
                            //mBufferedWriter.write(" " + "ADV data" + " ");
                            mBufferedWriter.write(logLine);

                        } catch (IOException e) {
                            Log.w(TAG, "Exception throwed while writing data to file.");
                        }
                    }
                }

                if (scanForAll || result.getDevice().getName().equals(ConfigVals.CLIMB_MASTER_DEVICE_NAME)) {  //AGGIUNGI alla lista SOLO I NODI MASTER!!!!
                    //POI AVVIA IL PROCESSO PER AGGIORNARE LA UI
                    int index = isAlreadyInList(result.getDevice());
                    if (index >= 0) {
                        Log.d(TAG, "Found device is already in database and it is at index: " + index);
                        updateScnMetadata(index, result, nowMillis);
                    } else {
                        Log.d(TAG, "New device found, adding it to database!");
                        addToList(result, nowMillis);
                    }
                }
 /*               //se trovo il master connetilo!
                if(result.getDevice().getName().equals(ConfigVals.CLIMB_MASTER_DEVICE_NAME) && mBluetoothGatt == null){

                    mBluetoothGatt = result.getDevice().connectGatt(appContext, false, mGattCallback);
                    Log.i(TAG, "Climb master has been found, try to connect it!");
                }

   */
               // }
            }
        }

    };

    // Implements callback methods for GATT events that the app cares about.  For example,
    // connection change and services discovered.
    private final BluetoothGattCallback mGattCallback = new BluetoothGattCallback() {
        @Override
        public void onConnectionStateChange(BluetoothGatt gatt, int status, int newState) {
            String intentAction;
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                masterNodeGATTConnectionState = BluetoothProfile.STATE_CONNECTED;
                Log.i(TAG, "Connected to GATT server.");
                // Attempts to discover services after successful connection.
                Log.i(TAG, "Attempting to start service discovery:" + mBluetoothGatt.discoverServices());
                insertTag("Connected_to_GATT");

                //callback is called only after onServicesDiscovered()+getClimbService()

            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) { //TODO: check if this was intentional or not. If not, try to do something.

                Log.i(TAG, "Disconnected from GATT server. Status: " + status);
                if(mBTDevice != null) {
                    int index = isAlreadyInList(mBTDevice);
                    if (index >= 0) {
                        nodeList.get(index).setConnectionState(false);
                    } else {
                        Log.d(TAG, "Master not found in the list, CHECK!!!!");
                    }
                }
                masterNodeGATTConnectionState = BluetoothProfile.STATE_DISCONNECTED;
                broadcastUpdate(STATE_DISCONNECTED_FROM_CLIMB_MASTER);
                //mBluetoothGatt.disconnect();
                mBluetoothGatt.close();
                mBluetoothGatt = null;
                mBTDevice = null;
                mBTService = null;
                mCIPOCharacteristic = null;
                mPICOCharacteristic = null;

                insertTag("Disconnected_from_GATT");
                //broadcastUpdate(intentAction);


            }else if (newState == BluetoothProfile.STATE_CONNECTING) {
                masterNodeGATTConnectionState = BluetoothProfile.STATE_CONNECTING;
                Log.i(TAG, "Connecting to GATT server. Status: " + status);

            }else if (newState == BluetoothProfile.STATE_DISCONNECTING) {   //TODO: understand difference from DISCONNECTED
                masterNodeGATTConnectionState = BluetoothProfile.STATE_DISCONNECTING;
                Log.i(TAG, "Disconnecting from GATT server. Status: " + status);
                //mBluetoothGatt.disconnect();
                //mBluetoothGatt.close();
                //mBluetoothGatt = null;

            }
        }

        @Override
        public void onServicesDiscovered(BluetoothGatt gatt, int status) {
            if (status == BluetoothGatt.GATT_SUCCESS) {
                // cerca subito i servizi necessari (aggiorna il broadcast solo quando tutte le caratteristiche saranno salvate)
                Log.i(TAG, "onServicesDiscovered received: " + status);
                if(mBTService == null){
                    getClimbService();

//                    mHandler.postDelayed(new Runnable() {
//                        @Override
//                        public void run() {
//                            if(!mBluetoothGatt.requestMtu(35)){
//                                Log.w(TAG, "requestMtu returns FALSE!!!!");
//                            }
//                        }
//                    }, 1000);

                }else{

                }
            } else {
                Log.w(TAG, "onServicesDiscovered received: " + status);
            }
        }

        @Override
        public void onCharacteristicRead(BluetoothGatt gatt,
                                         BluetoothGattCharacteristic characteristic,
                                         int status) {
            if (status == BluetoothGatt.GATT_SUCCESS) {
            }
        }

        @Override
        public void onCharacteristicChanged(BluetoothGatt gatt,
                                            BluetoothGattCharacteristic characteristic) {

            Log.d(TAG, "onCharacteristicChanged called!");
            // if(callbackType == ScanSettings.CALLBACK_TYPE_ALL_MATCHES){
            long nowMillis = SystemClock.uptimeMillis();
            //PRIMA DI TUTTO SALVA IL LOG
            if (logEnabled) {
                if (mBufferedWriter != null) { // questo significa che il log � stato abilitato
                    final String timestamp = new SimpleDateFormat("yyyy MM dd HH mm ss").format(new Date()); // salva il timestamp per il log
                    String gattString = "";
                    byte[] gattData = characteristic.getValue();
                    for (int i = 0; i < gattData.length; i++) {
                        gattString = gattString + String.format("%02X", gattData[i]); //gatt DATA
                    }

                    try {
                        String logLine = "" + timestamp +
                                        " " + nowMillis +
                                        " " + mBTDevice.getAddress() +
                                        " " + mBTDevice.getName() +
                                        " GATT data " +
                                        " " + gattString +
                                        "\n";
                        mBufferedWriter.write(logLine);

                        //mBufferedWriter.write(timestamp + " " + nowMillis);
                        //mBufferedWriter.write(" " + mBTDevice.getAddress()); //MAC ADDRESS
                        //mBufferedWriter.write(" " + mBTDevice.getName() + " "); //NAME
                        //mBufferedWriter.write(" " + "GATT data ");



                        //mBufferedWriter.write("\n");
                        mBufferedWriter.flush();
                    } catch (IOException e) {
                        Log.w(TAG, "Exception throwed while writing data to file.");
                    }
                }
            }

            //POI AVVIA IL PROCESSO PER AGGIORNARE LA UI
            int index = isAlreadyInList(mBTDevice); // TODO: check multiple master case
            if (index >= 0) {
                Log.d(TAG, "Found device is already in database and it is at index: " + index);
                updateGATTMetadata(index, characteristic.getValue(), nowMillis);
            } else {
                Log.d(TAG, "New device found, it should be already in the list...verify!");
            }
            broadcastUpdate(ACTION_METADATA_CHANGED);
        }

        @Override
        public void onMtuChanged (BluetoothGatt gatt, int mtu, int status){

            if(status == 0){

                return;
            }
            return;
        }

    };

    public void getClimbService() {
        Log.i(TAG, "Getting CLIMB Service");
        mBTService = mBluetoothGatt.getService(mClimbServiceUuid); //QUI VIENE CONTROLLATO CHE IL SERVER SU CUI SI E' CONNESSI ABBIA IL SERVIZIO ADATTO

        if(mBTService == null) {
            Log.i(TAG, "Could not get CLIMB Service");
            return;
        }
        else {
            Log.i(TAG, "CLIMB Service successfully retrieved");
            if(getCIPOCharacteristic() && getPICOCharacteristic()){
                int index = isAlreadyInList(mBTDevice);
                if (index >= 0) {
                    nodeList.get(index).setConnectionState(true);
                    masterNodeGATTConnectionState = BluetoothProfile.STATE_CONNECTED;
                } else {
                    Log.d(TAG, "Master not found in the list, CHECK!!!!");
                }

                broadcastUpdate(STATE_CONNECTED_TO_CLIMB_MASTER); //TODO: add timeout on this


                return;
            }
        }
    }

    private boolean getCIPOCharacteristic() {
        Log.i(TAG, "Getting CIPO characteristic");
        mCIPOCharacteristic = mBTService.getCharacteristic(mCIPOCharacteristicUuid);

        if(mCIPOCharacteristic == null) {
            Log.i(TAG, "Could not find CIPO Characteristic");
            return false;
        }
        else {
            Log.i(TAG, "CIPO characteristic retrieved properly");
            enableNotificationForCIPO();
            return true;
        }
    }

    private boolean getPICOCharacteristic() {
        Log.i(TAG, "Getting PICO characteristic");
        mPICOCharacteristic = mBTService.getCharacteristic(mPICOCharacteristicUuid);

        if(mPICOCharacteristic == null) {
            Log.i(TAG, "Could not find PICO Characteristic");
            return false;
        }
        else {
            Log.i(TAG, "PICO characteristic retrieved properly");
            return true;
        }
    }

    private void enableNotificationForCIPO() {

        Log.i(TAG, "Enabling notification on Android API for CIPO");
        if(mCIPOCharacteristic == null){
            Log.w(TAG, "mCIPOCharacteristic == null !!");
            return;
        }
        boolean success = mBluetoothGatt.setCharacteristicNotification(mCIPOCharacteristic, true);
        if(!success) {
            Log.i(TAG, "Enabling Android API notification failed!");
            return;
        }
        else{
            Log.i(TAG, "Notification enabled on Android API!");
        }

        BluetoothGattDescriptor descriptor = mCIPOCharacteristic.getDescriptor(ConfigVals.Descriptor.CHAR_CLIENT_CONFIG);
        if(descriptor != null) {
            descriptor.setValue(BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE);
            mBluetoothGatt.writeDescriptor(descriptor);
            Log.i(TAG, "Notification on remote device (CCCD) enabled.");
        }
        else {
            Log.i(TAG, "Could not get descriptor for characteristic! CCCD Notification are not enabled.");
        }
    }

    private int isAlreadyInList(BluetoothDevice device){//ScanResult targetNode){

        for(int i = 0; i < nodeList.size(); i++){
            if( nodeList.get(i).getAddress().equals(device.getAddress()) ){
                return i;
            }
        }

        return -1;
    }

    private boolean updateScnMetadata(int recordIndex, ScanResult targetNode, long nowMillis){

        //if(targetNode.getScanRecord().getManufacturerSpecificData(TEXAS_INSTRUMENTS_MANUFACTER_ID) != null) {
            //if (targetNode.getScanRecord().getManufacturerSpecificData(TEXAS_INSTRUMENTS_MANUFACTER_ID).length > 0) {
        nodeList.get(recordIndex).updateScnMetadata((byte) targetNode.getRssi(), targetNode.getScanRecord().getManufacturerSpecificData(TEXAS_INSTRUMENTS_MANUFACTER_ID));//, nowMillis);

        //broadcastUpdate(ACTION_METADATA_CHANGED, EXTRA_INT_ARRAY, new int[]{recordIndex}); //questa allega  al broadcast l'indice che è cambiato, per ora non serve
                broadcastUpdate(ACTION_METADATA_CHANGED); //TODO: add nodeID
                return true;
            //}
        //}
       // return false;
    }

    private boolean updateGATTMetadata(int recordIndex, byte[] cipo_data, long nowMillis){

//TODO: L'rssi viene letto tramite un'altra callback, quindi per ora non ne tengo conto (in ClimbNode.updateGATTMetadata l'rssi non viene toccato)
                nodeList.get(recordIndex).updateGATTMetadata(0, cipo_data, nowMillis);

                //broadcastUpdate(ACTION_METADATA_CHANGED, EXTRA_INT_ARRAY, new int[]{recordIndex}); //questa allega  al broadcast l'indice che è cambiato, per ora non serve
                broadcastUpdate(ACTION_METADATA_CHANGED);
                return true;

    }

    private boolean addToList(ScanResult targetNode, long nowMillis){
        BluetoothDevice device = targetNode.getDevice();
        //nodeID id =
        boolean isMaster = device.getName().equals(ConfigVals.CLIMB_MASTER_DEVICE_NAME);
        ClimbNode newNode = new ClimbNode(device,
                //id,
                (byte) targetNode.getRssi(),
                targetNode.getScanRecord().getManufacturerSpecificData(TEXAS_INSTRUMENTS_MANUFACTER_ID),
                isMaster,
                new ClimbNodeTimeout() {
                    @Override
                    public void climbNodeTimedout(ClimbNode node) {
                        nodeList.remove(node);
                        broadcastUpdate(ACTION_DEVICE_REMOVED_FROM_LIST);
                        Log.d(TAG, "Timeout: node removed with index: " + nodeList.indexOf(node));
                    }
                });
                                //nowMillis);
        nodeList.add(newNode);
        broadcastUpdate(ACTION_DEVICE_ADDED_TO_LIST);
        Log.d(TAG, "Node added with index: " + nodeList.indexOf(newNode));
        return true;
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
        //dirName2="CUPID_data/"+rightNow.get(Calendar.DAY_OF_MONTH)+"_"+ (rightNow.get(Calendar.MONTH) + 1) +"_"+ rightNow.get(Calendar.YEAR) +"/";

        try{
//	    		    dirName = "/sdcard/"+dirName2;
//	    			//dirName = Environment.getExternalStorageDirectory().getPath()+dirName2;
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

            //mFile = new File(root,"log_data/"+file_name_log);
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

            //setOutFile(mBufferedWriter);
        }else{
            Log.w(TAG, "Can't write to file");
            return -1;
        }

        return 1;
    }

    private void enableNodeTimeout(){
        nodeTimeOutEnabled = true;
    }

    private void disableNodeTimeout(){
        nodeTimeOutEnabled = false;
    }

    private void nodeTimeoutCheck(){
        //controlla che il TimeoutCheck non sia stato disabilitato
        if(nodeTimeOutEnabled) {
            //CONTROLLA I NODI VISIBILI DAL NODO MASTER
            ClimbNode masterNode = null;
            //cerca il master
            for(int i = 0; i < nodeList.size(); i++) {
                if(nodeList.get(i).isMasterNode()){
                    masterNode = nodeList.get(i);
                    break; //una volta trovato il master interrompi, non gestisco più master...
                }
            }
            if(masterNode != null) {
                ArrayList<MonitoredClimbNode> childrenList = masterNode.getMonitoredClimbNodeList();
                byte[] gattData = new byte[20];
                int alertCounter = 0;
                int timedOutCounter = 0;
                for(int i = 0; i < childrenList.size(); i++) {
                    MonitoredClimbNode childNode = childrenList.get(i);

                    if(childNode.getNodeState() == 2 || childNode.getNodeState() == 3) { //dai l'allert solo se il nodo è monitorato (è nello stato ON_BOARD o ALERT)
                        //long millisSinceLastScan = nowMillis - childNode.getLastContactMillis();
                        if (childNode.getTimedOut()) {
                            childNode.setNodeState((byte) 3); //setta lo stato ALERT TODO: timestamp
                            byte [] childID = childNode.getNodeID();
                            broadcastUpdate(ACTION_NODE_ALERT, EXTRA_BYTE_ARRAY, childNode.getNodeID());

                            gattData[alertCounter*2] = childID[0];
                            //gattData[alertCounter*3 + 1] = childID[1];
                            gattData[alertCounter*2 + 1] = 3;

                            alertCounter++;
                        }
                        childNode.setTimedOut(true); //se al prossimo controllo è ancora true significa che non è mai stato visto nell'ultimo periodo, quindi eliminalo
                    }
                    if(childNode.getNodeState() == 0 || childNode.getNodeState() == 1) { //Se il nodo è in BY MYSELF o CHECKING controllalo e semmai rimuovilo semplicemente dalla lista
                        //long millisSinceLastScan = nowMillis - childNode.getLastContactMillis();
                        if (childNode.getTimedOut()) {
                            timedOutCounter++;
                            childrenList.remove(i);
                        }else {
                            childNode.setTimedOut(true); //se al prossimo controllo è ancora true significa che non è mai stato visto nell'ultimo periodo, quindi eliminalo
                        }
                    }
                }
                if(alertCounter > 0 && masterNodeGATTConnectionState == BluetoothProfile.STATE_CONNECTED){ //invia un pacchetto gatt solo se almeno un nodo è andato in timeout
                    if(mBluetoothGatt != null && mPICOCharacteristic != null) {
                        mPICOCharacteristic.setValue(gattData);
                        mBluetoothGatt.writeCharacteristic(mPICOCharacteristic);
                    }
                }

                if(timedOutCounter > 0){
                    broadcastUpdate(ACTION_DEVICE_REMOVED_FROM_LIST);
                }
            }
            // schedula un nuovo check
            mHandler.postDelayed(new Runnable() {
                @Override
                public void run() {
                    nodeTimeoutCheck();
                }
            }, ConfigVals.NODE_TIMEOUT);
        }
    }

    public void setContext(Context context)
    {
        appContext = context;
    }
}
