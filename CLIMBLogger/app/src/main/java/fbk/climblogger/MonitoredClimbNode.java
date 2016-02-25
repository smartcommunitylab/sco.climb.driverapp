package fbk.climblogger;

import java.util.Arrays;

/**
 * Created by user on 24/11/2015.
 */
public class MonitoredClimbNode{

    private byte[] nodeID = {};
    private byte   nodeState = 5; //5 = INVALID_STATE
    private long lastContactMillis = 0;
    private long lastStateChangeMillis = 0;
    private boolean timedOut = false;
    private byte RSSI;

    public MonitoredClimbNode(byte[] newNodeID, byte newNodeState){//}, long newLastContactMillis){
        nodeID = newNodeID;
        nodeState = newNodeState;
        timedOut = false;
        RSSI = 0;
    }

    public MonitoredClimbNode(byte[] newNodeID, byte newNodeState, byte newRSSI){//}, long newLastContactMillis){
        nodeID = newNodeID;
        nodeState = newNodeState;
        timedOut = false;
        RSSI = newRSSI;
    }

    public MonitoredClimbNode(byte[] newNodeID, byte newNodeState, byte newRSSI, long newLastContactMillis){
        nodeID = newNodeID;
        nodeState = newNodeState;
        timedOut = false;
        RSSI = newRSSI;
        lastContactMillis = newLastContactMillis;
        lastStateChangeMillis = lastContactMillis;
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

    public String getNodeIDString(){
        return Arrays.toString(nodeID);
    }

    public byte getNodeState(){
        return nodeState;
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

    public void setNodeState(byte newState, long newLastContactMillis){
        if (nodeState != newState) {
            nodeState = newState;
            lastStateChangeMillis = newLastContactMillis;
        }
        lastContactMillis = newLastContactMillis;
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