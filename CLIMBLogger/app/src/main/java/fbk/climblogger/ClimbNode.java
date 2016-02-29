        package fbk.climblogger;

        import android.bluetooth.BluetoothDevice;
        import android.bluetooth.le.ScanResult;
        import android.os.Handler;
        import android.util.Log;
        import android.util.SparseArray;

        import java.util.ArrayList;
        import java.util.Arrays;
        import java.util.HashMap;
        import java.util.List;

        /**
         * Created by user on 05/10/2015.
         */

        interface ClimbNodeTimeout {
            public void climbNodeTimedout(ClimbNode node);
        }

        public class ClimbNode {

            private BluetoothDevice bleDevice;
            private byte rssi;
            //private SparseArray<byte[]> scanResponseData;
            private byte[] scanResponseData = {};
            private byte[] lastReceivedGattData = {};
            private final String TAG = "ClimbNode_GIOVA";
            //private long lastContactMillis = 0;
            private String[] allowedChildrenList;
            private ArrayList<MonitoredClimbNode> onBoardChildrenList;
            private boolean connectionState = false;
            private boolean isMasterNode = false;
            private ClimbNodeTimeout timedoutCallback = null;
            private MonitoredClimbNodeTimeout timedoutCallback2 = null;
            private Runnable timedoutTimer = null;
            private Handler mHandler = null;


            public ClimbNode() {
                return;
            }

            /*
                public ClimbNode(String initName, String initAddress , int initRssi, byte[] newScanResponse, long millisNow){//SparseArray<byte[]> newScanResponse){

                    bleDevice = null;
                    rssi = initRssi;
                    scanResponseData = newScanResponse;
                    lastContactMillis = millisNow;
                    return;
                }
            */
            public ClimbNode(BluetoothDevice dev, byte initRssi, byte[] newScanResponse, boolean masterNode, ClimbNodeTimeout cb, MonitoredClimbNodeTimeout cb2) {//SparseArray<byte[]> newScanResponse){

                bleDevice = dev;
                rssi = initRssi;
                scanResponseData = newScanResponse;
                //lastContactMillis = millisNow;
                onBoardChildrenList = new ArrayList<MonitoredClimbNode>();
                isMasterNode = masterNode;
                timedoutCallback = cb;
                timedoutCallback2 = cb2;
                mHandler = new Handler();
                return;
            }

            public void setConnectionState(boolean state) {
                connectionState = state;
                if(connectionState == false){
                    onBoardChildrenList.clear();
                    onBoardChildrenList = new ArrayList<MonitoredClimbNode>();
                    lastReceivedGattData = null;
                }
            }

            public boolean getConnectionState(){
                return connectionState;
            }

            public String toString() {
                String mString = "";
                if (bleDevice.getName() != null) mString = mString + bleDevice.getName() + ", ";
                else mString = mString + "Unknow device name, ";

                if (bleDevice.getAddress() != null)
                    mString = mString + "MAC: " + bleDevice.getAddress() + ", ";

                mString = mString + "RSSI: " + (rssi );

                if(connectionState){
                    mString = mString + ". Conn.";
                }
        /*
                if(scanResponseData != null){
                    for(int i = 0; i < scanResponseData.size();i++){
                        Log.d(TAG, "scanResponseData.size() = " + scanResponseData.size());
                        mString = mString + ", Scan Response Data: ";
                        byte[] manufacterData = scanResponseData.valueAt(i);
                        for(int j = 0; j < manufacterData.length; j++){
                            //Log.d(TAG, "manufacterData.length = " + manufacterData.length);
                            mString = mString + String.format("%02X",manufacterData[j]);
                        }
                    }
                }
        *//*
                int scanResponseDataLength = scanResponseData.length;
                if(scanResponseDataLength > 0){
                    mString = mString + ", Scan Response Data: ";
                    for(int i = 0; i < scanResponseDataLength; i++){
                        mString = mString + String.format("%02X",scanResponseData[i]);

                    }
                }*/
                return mString;
            }

            public String getAddress() { return bleDevice.getAddress(); }

            public String getName() {
                return bleDevice.getName();
            }

            public String getNodeID() { return getAddress(); }

            public BluetoothDevice getBleDevice() {
                return bleDevice;
            }

            public boolean isMasterNode(){
                return isMasterNode;
            }
            /*
            public long getLastContactMillis() {
                return lastContactMillis;
            }*/

            public byte[] getlastReceivedGattData(){
                return lastReceivedGattData;
            }

            public ArrayList<MonitoredClimbNode> getMonitoredClimbNodeList(){
                return onBoardChildrenList;
            }

            public void setAllowedChildrenList(String[] children){
                allowedChildrenList = children;
            }

            public String[] getAllowedChildrenList(){
                return allowedChildrenList;
            }

            public MonitoredClimbNode getChildByID(String id) {
                for(int i = 0; i < onBoardChildrenList.size(); i++){
                    if( onBoardChildrenList.get(i).getNodeIDString().equals(id) ){
                        return onBoardChildrenList.get(i);
                    }
                }

                return null;
            }

            private void timedout() {
                (timedoutCallback).climbNodeTimedout(this);
            }

            private void timeoutRestart() {
                if (timedoutTimer != null) {
                    mHandler.removeCallbacks(timedoutTimer);
                }
                timedoutTimer = new Runnable() {
                    @Override
                    public void run() {
                        timedout();
                    }
                };
                mHandler.postDelayed(timedoutTimer, ConfigVals.NODE_TIMEOUT);
            }

            public void updateScnMetadata(byte newRssi, byte[] newScanResponse){//, long millisNow) {//SparseArray<byte[]> newScanResponse){
                rssi = newRssi;
                scanResponseData = newScanResponse;
                //lastContactMillis = millisNow;
                timeoutRestart();
            }

            private MonitoredClimbNode findChildByID(byte[] id) {
                for (MonitoredClimbNode n : onBoardChildrenList) {
                    if (Arrays.equals(n.getNodeID(), id)) {
                        return n;
                    }
                }
                return null;
            }

            public void updateGATTMetadata(int newRssi, byte[] cipo_metadata, long millisNow) {//SparseArray<byte[]> newScanResponse){
                //rssi = newRssi;
                lastReceivedGattData = cipo_metadata;
                //lastContactMillis = millisNow;
                timeoutRestart();

                //AGGIORNA LA LISTA DEI NODI ON_BOARD
                for (int i = 0; i < lastReceivedGattData.length-2; i = i + 3) {
                    if(lastReceivedGattData[i] != 0 ) { //se l'ID è 0x00 scartalo
                        //if (lastReceivedGattData[i + 2] == 2) { //ON_BOARD
                            byte[] tempNodeID = { lastReceivedGattData[i] };//, lastReceivedGattData[i+1]};
                            byte state = lastReceivedGattData[i+1];
                            byte rssi = lastReceivedGattData[i+2];
                            MonitoredClimbNode n = findChildByID(tempNodeID);
                            if (n == null) {
                                onBoardChildrenList.add(new MonitoredClimbNode(tempNodeID, state, rssi, millisNow, timedoutCallback2, mHandler));
                            } else {
                                n.setNodeState(state, millisNow);
                                n.setNodeRssi(rssi);
                            }
                        //}
                    }
                }
            }

            private String stateToString(byte s) {
                switch (s) {
                    case 0: return "BY MYSELF";
                    case 1: return "CHECKING";
                    case 2: return "ON BOARD";
                    case 3: return "ALERT";
                    case 4: return "ERROR";
                    default: return "INVALID STATE";
                }
            }

            public List<String> getClimbNeighbourList() {

                //if (scanResponseData != null) {
                    ArrayList<String> neighbourList = new ArrayList<String>();
                    String description = "";

                    if (bleDevice.getName().equals(ConfigVals.CLIMB_CHILD_DEVICE_NAME)) {
                        if (scanResponseData != null && scanResponseData.length > 1){
                            description = "Node ID: 0x" + String.format("%02X",scanResponseData[0]) +"\nState: " + stateToString(scanResponseData[1]);
                        }

                        if (scanResponseData.length > 17) {
                            description = description + "\nBattery Voltage = " + String.format("%d", (  ((((int) scanResponseData[16]) << 24) >>> 24)<<8) + ( (((int) scanResponseData[17]) << 24) >>> 24 ) ) + " mV";
                        }

                        neighbourList.add(description);
                        return neighbourList;

                    } else if (bleDevice.getName().equals(ConfigVals.CLIMB_MASTER_DEVICE_NAME)) {

                        if (connectionState) {
                            for (int i = 0; i < onBoardChildrenList.size(); i++) {
                                MonitoredClimbNode tempNode = onBoardChildrenList.get(i);
                                description = "Node ID: " + tempNode.getNodeIDString();
                                description += "\nState: " + stateToString(tempNode.getNodeState());
                                neighbourList.add(description);
                            }
                            return neighbourList;
                        }

                    }
                    return null;
            }

        }