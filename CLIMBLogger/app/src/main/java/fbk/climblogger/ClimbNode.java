        package fbk.climblogger;

        import android.bluetooth.BluetoothDevice;
        import android.bluetooth.le.ScanResult;
        import android.util.Log;
        import android.util.SparseArray;

        import java.util.ArrayList;
        import java.util.Arrays;
        import java.util.HashMap;
        import java.util.List;

        /**
         * Created by user on 05/10/2015.
         */
        public class ClimbNode {

            private BluetoothDevice bleDevice;
            private byte rssi;
            //private SparseArray<byte[]> scanResponseData;
            private byte[] scanResponseData = {};
            private byte[] lastReceivedGattData = {};
            private final String TAG = "ClimbNode_GIOVA";
            //private long lastContactMillis = 0;
            private ArrayList<MonitoredClimbNode> onBoardChildrenList;
            private boolean connectionState = false;
            private boolean isMasterNode = false;
            private boolean timedOut = false;

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
            public ClimbNode(BluetoothDevice dev, byte initRssi, byte[] newScanResponse, boolean masterNode) {//SparseArray<byte[]> newScanResponse){

                bleDevice = dev;
                rssi = initRssi;
                scanResponseData = newScanResponse;
                //lastContactMillis = millisNow;
                onBoardChildrenList = new ArrayList<MonitoredClimbNode>();
                isMasterNode = masterNode;
                timedOut = false;
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
                    mString = mString + ". Conn. " + onBoardChildrenList.size() +" C.";

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

            public String getAddress() {
                return bleDevice.getAddress();
            }

            public String getName() {
                return bleDevice.getName();
            }

            public BluetoothDevice getBleDevice() {
                return bleDevice;
            }


            public void setTimedOut(boolean value){
                timedOut = value;
            }

            public boolean getTimedOut(){
                return timedOut;
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

            public void updateScnMetadata(byte newRssi, byte[] newScanResponse){//, long millisNow) {//SparseArray<byte[]> newScanResponse){
                rssi = newRssi;
                scanResponseData = newScanResponse;
                timedOut = false;
                //lastContactMillis = millisNow;
            }

            public void updateGATTMetadata(int newRssi, byte[] cipo_metadata){//}, long millisNow) {//SparseArray<byte[]> newScanResponse){
                //rssi = newRssi;
                lastReceivedGattData = cipo_metadata;
                timedOut = false;
                //lastContactMillis = millisNow;

                //AGGIORNA LA LISTA DEI NODI ON_BOARD
                for (int i = 0; i < lastReceivedGattData.length-2; i = i + 3) {
                    if(lastReceivedGattData[i] != 0 ) { //se l'ID è 0x00 scartalo
                        //if (lastReceivedGattData[i + 2] == 2) { //ON_BOARD
                            byte[] tempNodeID = { lastReceivedGattData[i] };//, lastReceivedGattData[i+1]};
                            MonitoredClimbNode tempNode = new MonitoredClimbNode(tempNodeID,lastReceivedGattData[i+1],lastReceivedGattData[i+2]);//, millisNow);

                            int pos = onBoardChildrenList.indexOf(tempNode);
                            if(pos == -1){ //aggiungi il nodo
                                onBoardChildrenList.add(tempNode);
                            }else{  //aggiorna il nodo (sostituisci l'istanza)
                                MonitoredClimbNode tempNode2 = onBoardChildrenList.get(pos);

                                if(tempNode2.getNodeState() != tempNode.getNodeState()){
                                    tempNode.setAutomaticStateChangeRequested(false);
                                }

                                onBoardChildrenList.set(pos,tempNode);
                            }
                        //}
                    }
                }

            }

            public List<String> getClimbNeighbourList() {

                //if (scanResponseData != null) {
                    ArrayList<String> neighbourList = new ArrayList<String>();
                    String description = "";

                    if (bleDevice.getName().equals(ConfigVals.CLIMB_CHILD_DEVICE_NAME)) {
                        if (scanResponseData != null && scanResponseData.length > 1){
                            if (scanResponseData[1] == 0) {   //BY_MYSELF
                                description = "Node ID: 0x" + String.format("%02X",scanResponseData[0]) + "\nState: BY MYSELF";
                            } else if (scanResponseData[1] == 1) { //CHECKING
                                description = "Node ID: 0x" + String.format("%02X",scanResponseData[0]) + "\nState: CHECKING";
                            } else if (scanResponseData[1] == 2) { //ON_BOARD
                                description = "Node ID: 0x" + String.format("%02X",scanResponseData[0]) + "\nState: ON BOARD";
                            } else if (scanResponseData[1] == 3) { //ALERT
                                description = "Node ID: 0x" + String.format("%02X",scanResponseData[0]) + "\nState: ALERT";
                            } else if (scanResponseData[1] == 4) { //GOING TO SLEEP
                                description = "Node ID: 0x" + String.format("%02X", scanResponseData[0]) + "\nState: GOING TO SLEEP";
                            }else if (scanResponseData[1] == 5) { //ERROR
                                description = "Node ID: 0x" + String.format("%02X",scanResponseData[0]) + "\nState: ERROR";
                            } else { //INVALID STATE
                                description = "Node ID: 0x" + String.format("%02X",scanResponseData[0]) + "\nState: INVALID STATE";
                            }
                        }

                        if (scanResponseData.length > 3) {
                            description = description + "\nBattery Voltage = " + String.format("%d", (  ((((int) scanResponseData[scanResponseData.length-3]) << 24) >>> 24)<<8) + ( (((int) scanResponseData[scanResponseData.length-2]) << 24) >>> 24 ) ) + " mV";
                        }

                        neighbourList.add(description);
                        return neighbourList;

                    } else if (bleDevice.getName().equals(ConfigVals.CLIMB_MASTER_DEVICE_NAME)) {

                        if (connectionState) {
                            for (int i = 0; i < onBoardChildrenList.size(); i++) {
                                MonitoredClimbNode tempNode = onBoardChildrenList.get(i);
                                if (tempNode.getNodeState() == 0) {   //BY_MYSELF
                                    description = "Node ID: 0x" + String.format("%02X", tempNode.getNodeID()[0]) + ", State: BY MYSELF, RSSI: " + tempNode.getNodeRssi();
                                } else if (tempNode.getNodeState()  == 1) { //CHECKING
                                    description = "Node ID: 0x" + String.format("%02X", tempNode.getNodeID()[0]) + ", State: CHECKING, RSSI: " + tempNode.getNodeRssi();
                                } else if (tempNode.getNodeState()  == 2) { //ON_BOARD
                                    description = "Node ID: 0x" + String.format("%02X", tempNode.getNodeID()[0]) + ", State: ON BOARD, RSSI: " + tempNode.getNodeRssi();
                                } else if (tempNode.getNodeState()  == 3) { //ALERT
                                    description = "Node ID: 0x" + String.format("%02X", tempNode.getNodeID()[0]) + ", State: ALERT, RSSI: " + tempNode.getNodeRssi();
                                } else if (tempNode.getNodeState()  == 4) { //GOING TO SLEEP
                                    description = "Node ID: 0x" + String.format("%02X", tempNode.getNodeID()[0]) + ", State: GOING TO SLEEP, RSSI: " + tempNode.getNodeRssi();
                                } else if (tempNode.getNodeState()  == 5) { //ERROR
                                    description = "Node ID: 0x" + String.format("%02X", tempNode.getNodeID()[0]) + ", State: ERROR, RSSI: " + tempNode.getNodeRssi();
                                } else { //INVALID STATE
                                    description = "Node ID: 0x" + String.format("%02X", tempNode.getNodeID()[0]) + ", State: INVALID STATE, RSSI: " + tempNode.getNodeRssi();
                                }
                                neighbourList.add(description);
                            }

                            return neighbourList;
                        } else {//master not connected

                            return neighbourList;
                        }

                    }
                    return null;
            }

        }
