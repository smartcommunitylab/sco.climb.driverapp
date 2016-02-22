package fbk.climblogger;

import java.util.ArrayList;

public interface ClimbServiceInterface {

    public final static String ACTION_DEVICE_ADDED_TO_LIST = "fbk.climblogger.ClimbService.ACTION_DEVICE_ADDED_TO_LIST";
    public final static String ACTION_DEVICE_REMOVED_FROM_LIST = "fbk.climblogger.ClimbService.ACTION_DEVICE_REMOVED_FROM_LIST";
    public final static String ACTION_METADATA_CHANGED ="fbk.climblogger.ClimbService.ACTION_METADATA_CHANGED";
    public final static String ACTION_DATALOG_ACTIVE ="fbk.climblogger.ClimbService.ACTION_DATALOG_ACTIVE";
    public final static String ACTION_DATALOG_INACTIVE ="fbk.climblogger.ClimbService.ACTION_DATALOG_INACTIVE";
    public final static String ACTION_NODE_ALERT ="fbk.climblogger.ClimbService.ACTION_NODE_ALERT";
    public final static String ACTION_DATA_AVAILABLE ="fbk.climblogger.ClimbService.ACTION_DATA_AVAILABLE";
    public final static String STATE_CONNECTED_TO_CLIMB_MASTER = "fbk.climblogger.ClimbService.STATE_CONNECTED_TO_CLIMB_MASTER";
    public final static String STATE_DISCONNECTED_FROM_CLIMB_MASTER = "fbk.climblogger.ClimbService.STATE_DISCONNECTED_FROM_CLIMB_MASTER";

    public final static String EXTRA_STRING ="fbk.climblogger.ClimbService.EXTRA_STRING";
    public final static String EXTRA_INT_ARRAY ="fbk.climblogger.ClimbService.EXTRA_INT_ARRAY";
    public final static String EXTRA_BYTE_ARRAY ="fbk.climblogger.ClimbService.EXTRA_BYTE_ARRAY";

    public ArrayList getNodeList();

    public boolean SendCheckInAllCmd() ;
    public boolean SendCheckOutAllCmd();
    public boolean ScheduleWakeUpCmd(int timeout_sec);
    public boolean SendReleaseAllCmd();

    public void onNodeClick(int groupPosition, int childPosition);
}
