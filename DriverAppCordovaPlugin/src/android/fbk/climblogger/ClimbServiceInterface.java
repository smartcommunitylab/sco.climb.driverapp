package fbk.climblogger;

import android.content.Context;

public interface ClimbServiceInterface {

    class NodeState{
        public String nodeID;
        public long firstSeen;
        public long lastSeen;           //local time in millisec
        public String bdAddress;        //To be removed? Used only in the logger, but it is usefull!
        public int batteryVoltage_mV;   //battery voltage
        public int batteryLevel;        //battery level (0: not applicable, 1: very low, 2: mid, 3: good)
        public int rssi;
    }

    //events
    String ACTION_DEVICE_ADDED_TO_LIST = "fbk.climblogger.ClimbService.ACTION_DEVICE_ADDED_TO_LIST";
    String ACTION_DEVICE_REMOVED_FROM_LIST = "fbk.climblogger.ClimbService.ACTION_DEVICE_REMOVED_FROM_LIST";
    String ACTION_METADATA_CHANGED ="fbk.climblogger.ClimbService.ACTION_METADATA_CHANGED";
    String ACTION_NODE_ALERT ="fbk.climblogger.ClimbService.ACTION_NODE_ALERT";
//    public final static String ACTION_DATA_AVAILABLE ="fbk.climblogger.ClimbService.ACTION_DATA_AVAILABLE";

    /*
     * NodeID in string format
     */
    String INTENT_EXTRA_ID ="fbk.climblogger.ClimbService.INTENT_EXTRA_ID";
    /*
     * Success/failure as boolean
     */
    String INTENT_EXTRA_SUCCESS ="fbk.climblogger.ClimbService.INTENT_EXTRA_SUCCESS";
    /*
     * Message describing failure reason in case of failure
     */
    String INTENT_EXTRA_MSG ="fbk.climblogger.ClimbService.INTENT_EXTRA_MSG";

    /**
     * Initialize the service.
     *
     * @return whether initialization wa successful. If false, other functions of the service should
     * not be used.
     */
    boolean init();

    /**
     *  deinitialize the service.
     *
     * @return whether deinitialization was successful.
     */
    boolean deinit();

    /**
     * Pass on the application context to the service, required for initializing the underlying
     * Bluetooth GATT. Its utilization is not documented in the Android API.
     */
    void setContext(Context context);


    /**
     * Get state of every child node seen by the master.
     *
     * @return Array of node states.
     */
    NodeState[] getNetworkState();

}
