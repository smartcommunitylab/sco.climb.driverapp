package fbk.climblogger;

import java.util.ArrayList;

public interface ClimbServiceInterface {

    public class NodeState{
        public String nodeID;
        public int state;
        public long lastSeen;
        public long lastStateChange;
    }

    public final static String ACTION_DEVICE_ADDED_TO_LIST = "fbk.climblogger.ClimbService.ACTION_DEVICE_ADDED_TO_LIST";
    public final static String ACTION_DEVICE_REMOVED_FROM_LIST = "fbk.climblogger.ClimbService.ACTION_DEVICE_REMOVED_FROM_LIST";
    public final static String ACTION_METADATA_CHANGED ="fbk.climblogger.ClimbService.ACTION_METADATA_CHANGED";
    public final static String ACTION_DATALOG_ACTIVE ="fbk.climblogger.ClimbService.ACTION_DATALOG_ACTIVE";
    public final static String ACTION_DATALOG_INACTIVE ="fbk.climblogger.ClimbService.ACTION_DATALOG_INACTIVE";
    public final static String ACTION_NODE_ALERT ="fbk.climblogger.ClimbService.ACTION_NODE_ALERT";
    public final static String ACTION_DATA_AVAILABLE ="fbk.climblogger.ClimbService.ACTION_DATA_AVAILABLE";

    public final static String STATE_CONNECTED_TO_CLIMB_MASTER = "fbk.climblogger.ClimbService.STATE_CONNECTED_TO_CLIMB_MASTER";
    public final static String STATE_DISCONNECTED_FROM_CLIMB_MASTER = "fbk.climblogger.ClimbService.STATE_DISCONNECTED_FROM_CLIMB_MASTER";
    public final static String STATE_CHECKEDIN_CHILD = "fbk.climblogger.ClimbService.STATE_CHECKEDIN_CHILD";
    public final static String STATE_CHECKEDOUT_CHILD = "fbk.climblogger.ClimbService.STATE_CHECKEDOUT_CHILD";

    public final static String EXTRA_STRING ="fbk.climblogger.ClimbService.EXTRA_STRING";
    public final static String EXTRA_INT_ARRAY ="fbk.climblogger.ClimbService.EXTRA_INT_ARRAY";
    public final static String EXTRA_BYTE_ARRAY ="fbk.climblogger.ClimbService.EXTRA_BYTE_ARRAY";

    public void init();
    public String[] getMasters();
    public boolean connectMaster(String master);
    public boolean disconnectMaster();

    /**
     * Set the list all nodes that might belong to this master, i.e. nodes for which the master can change state.
     *
     * @param children List of node IDs.
     * @return false if master is not connected or other error occurs
     */
    public boolean setNodeList(String[] children);

    /**
     * Get state of a single child node.
     *
     * @param id Id of node.
     * @return State if the node, if available, null otherwise.
     */
    public NodeState getNodeState(String id);

    /**
     * Get state of every child node seen by the master.
     * @return Array of node states.
     */
    public NodeState[] getNetworkState();

    public boolean checkinChild(String child);
    public boolean checkinChildren(String[] children);
    public boolean checkoutChild(String child);
    public boolean checkoutChildren(String[] children);

    ////public boolean ScheduleWakeUpCmd(int timeout_sec);
}
