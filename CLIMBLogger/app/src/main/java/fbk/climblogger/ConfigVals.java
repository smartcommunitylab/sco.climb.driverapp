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

    private static File root = Environment.getExternalStorageDirectory();

    static TimeZone tz = TimeZone.getTimeZone("Europe/Rome");

    static Calendar rightNow = Calendar.getInstance(tz);// .getInstance();*/
    public static String folderName = root.getAbsolutePath()+	"/CLIMB_log_data/"+rightNow.get(Calendar.DAY_OF_MONTH)+"_"+ (rightNow.get(Calendar.MONTH) + 1) +"_"+ rightNow.get(Calendar.YEAR) +"/";

    static final int NODE_TIMEOUT = 10000;

    static final long MAX_WAKE_UP_DELAY_SEC = 259200;

    static final int vibrationTimeout = 15;

    static final int consecutiveBroadcastMessageTimeout_ms = 7000;

    public final static String CLIMB_CHILD_DEVICE_NAME = "CLIMBC";
    public final static String CLIMB_MASTER_DEVICE_NAME = "CLIMBM";

    public static class Service {
        final static public UUID CLIMB                = UUID.fromString("0000FFF0-0000-1000-8000-00805f9b34fb");
    };

    public static class Characteristic {
        final static public UUID CIPO			      = UUID.fromString("0000FFF1-0000-1000-8000-00805f9b34fb");
        final static public UUID PICO		      = UUID.fromString("0000FFF2-0000-1000-8000-00805f9b34fb");

    }

    public static class Descriptor {// questo non deve essere cambiato perch� � un UUID definito dal protocollo (cambiandolo non si riesce pi� a ottenere il CCC descriptor)
        final static public UUID CHAR_CLIENT_CONFIG       = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb");
    }

}
