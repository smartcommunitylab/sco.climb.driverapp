package fbk.climblogger;

import android.os.Handler;

import java.util.Arrays;

/**
 * Created by user on 24/11/2015.
 */

interface MonitoredClimbNodeTimeout {
    public void monitoredClimbNodeChangeSuccess(MonitoredClimbNode node, byte state);
    public void monitoredClimbNodeChangeTimedout(MonitoredClimbNode node, byte imposedState, byte state);
}

public class MonitoredClimbNode{

    private byte[] nodeID = {};

    private byte imposedState = 5;
    private byte nodeState = 5; //5 = INVALID_STATE
    private long lastContactMillis = 0;
    private long lastStateChangeMillis = 0;
    private boolean timedOut = false;
    private byte RSSI;
    private MonitoredClimbNodeTimeout timedoutCallback = null;
    private Runnable timedoutTimer = null;
    private Handler mHandler = null;

    public MonitoredClimbNode(byte[] newNodeID, byte newNodeState, byte newRSSI, long newLastContactMillis, MonitoredClimbNodeTimeout cb, Handler handler){
        nodeID = newNodeID;
        nodeState = newNodeState;
        timedOut = false;
        RSSI = newRSSI;
        lastContactMillis = newLastContactMillis;
        lastStateChangeMillis = lastContactMillis;
        timedoutCallback = cb;
        //mHandler = new Handler(); // cannot create handler when this one is called from GATT
        mHandler = handler;
    }

    public void setTimedOut(boolean value){
        timedOut = value;
    }

    public boolean getTimedOut(){
        return timedOut;
    }

    public byte[] getNodeID(){
        return nodeID;
    }

    public String getNodeIDString() {
        //return Arrays.toString(nodeID);
        return String.format("%02X", nodeID[0]);
    }

    public byte getNodeState(){
        return nodeState;
    }

    public byte getImposedState() {
        return imposedState;
    }

    public byte getNodeRssi() {return RSSI;}

    public long getLastContactMillis(){
        return lastContactMillis;
    }

    public long getLastStateChangeMillis(){
        return lastStateChangeMillis;
    }

    public void setNodeState(byte newState){ // TODO: handle lastStateChangeMillis
        nodeState = newState;
    }

    private void timedout() {
        (timedoutCallback).monitoredClimbNodeChangeTimedout(this, imposedState, nodeState);
    }

    public void setNodeState(byte newState, long newLastContactMillis){
        if (newState == imposedState) {
            if (timedoutTimer != null) {
                mHandler.removeCallbacks(timedoutTimer);
                (timedoutCallback).monitoredClimbNodeChangeSuccess(this, imposedState);
            } //TODO: handle error
        }

        if (nodeState != newState) {
            nodeState = newState;
            lastStateChangeMillis = newLastContactMillis;
        }
        lastContactMillis = newLastContactMillis;
    }

    public boolean setImposedState(byte newImposedState) {
        if (timedoutTimer != null) {
            return false; //another state change is in progress
            //mHandler.removeCallbacks(timedoutTimer);
        }

        timedoutTimer = new Runnable() {
            @Override
            public void run() {
                timedout();
            }
        };
        mHandler.postDelayed(timedoutTimer, ConfigVals.MON_NODE_TIMEOUT);
        imposedState = newImposedState;
        return true;
    }

    public void setNodeRssi(byte newRssi) {
        RSSI = newRssi;
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == null) {
            return false;
        }
        MonitoredClimbNode node = (MonitoredClimbNode)obj;
        if(Arrays.equals(this.getNodeID(), node.getNodeID()) ){
            return true;
        }else{
            return false;
        }

    }
}