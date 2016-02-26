package fbk.climblogger;

import java.util.Arrays;

/**
 * Created by user on 24/11/2015.
 */
public class MonitoredClimbNode{

    private byte[] nodeID = {};
    private byte   nodeState = 5; //5 = INVALID_STATE
    private boolean stateChangeRequested = false; //questo è necessario per evitare di richiere continuamente un cambio di stato automatico (i.e. da BY_MYSELF a CHECKING)
    private long lastContactMillis = 0;
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

    public void setTimedOut(boolean value){
        timedOut = value;
    }

    public boolean getTimedOut(){
        return timedOut;
    }

    public byte[] getNodeID(){
        return nodeID;
    }

    public byte getNodeState(){
        return nodeState;
    }

    public byte getNodeRssi() {return RSSI;}

    public long getLastContactMillis(){
        return lastContactMillis;
    }

    public void setNodeState(byte newState){
        nodeState = newState;
    }

    public void setAutomaticStateChangeRequested(boolean requested){ //questo è necessario per evitare di richiere continuamente un cambio di stato automatico (i.e. da BY_MYSELF a CHECKING)
        stateChangeRequested = requested;
    }

    public boolean getAutomaticStateChangeRequest(){ //questo è necessario per evitare di richiere continuamente un cambio di stato automatico (i.e. da BY_MYSELF a CHECKING)
        return stateChangeRequested;
    }
/*
    public void setLastContactMillis(long newLastContactMillis){
        lastContactMillis = newLastContactMillis;
    }
*/
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