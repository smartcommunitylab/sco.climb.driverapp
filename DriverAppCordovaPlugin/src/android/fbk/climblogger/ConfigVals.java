package fbk.climblogger;

import android.os.Environment;

import java.io.File;
import java.util.Calendar;
import java.util.TimeZone;
import java.util.UUID;

/**
 * Created by user on 06/10/2015.
 */
public class ConfigVals {

    static String libVersion = "0.4.0";

    private static File root = Environment.getExternalStorageDirectory();

    static TimeZone tz = TimeZone.getTimeZone("Europe/Rome");

    static Calendar rightNow = Calendar.getInstance(tz);// .getInstance();*/
    public static String folderName = root.getAbsolutePath()+	"/CLIMB_log_data/"+rightNow.get(Calendar.YEAR)+"_"+ (rightNow.get(Calendar.MONTH) + 1) +"_"+ rightNow.get(Calendar.DAY_OF_MONTH) +"/";

    static final int MON_NODE_TIMEOUT = 15 * 1000;

    static final int vibrationTimeout = 15;


    public final static String CLIMB_CHILD_DEVICE_NAME = "CLIMBC";
    public final static String CLIMB_MASTER_DEVICE_NAME = "CLIMBM";

    public final static int INVALID_BATTERY_VOLTAGE = 0xFFFFFFFF;

    public final static UUID BLE_BASE_UUID =  UUID.fromString("00000000-0000-1000-8000-00805F9B34FB");

}
