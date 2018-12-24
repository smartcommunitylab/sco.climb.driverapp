package com.github.google.beaconfig;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Handler;
import android.support.v4.view.ViewPager;
import android.support.v4.widget.SwipeRefreshLayout;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.support.v7.widget.Toolbar;
import android.util.Base64;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import com.github.google.beaconfig.dialogs.UnlockDialog;
import com.github.google.beaconfig.gatt.GattClient;
import com.github.google.beaconfig.gatt.GattClientException;
import com.github.google.beaconfig.gatt.GattConstants;
import com.github.google.beaconfig.gatt.GattOperationException;
import com.github.google.beaconfig.utils.BroadcastCapabilities;
import com.github.google.beaconfig.utils.UiUtils;
import com.github.google.beaconfig.utils.Utils;

import java.io.File;
import java.lang.reflect.Array;
import java.math.BigInteger;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;

public class BeaconAutoConfigActivity extends AppCompatActivity {

    private BroadcastCapabilities capabilities;
    private GattClient gattClient;
    private String unlockCode = null;
    private String address;
    private String name;

    private SlotsAdapter slotsAdapter;
    private ViewPager viewPager;
    private SwipeRefreshLayout swipeRefreshLayout;

    private boolean intendedDisconnection = false;

    private ExecutorService executor;
    private SavedConfigurationsManager configurationsManager;

    private Button mProgramConfigButton = null;
    //private TextView mDummyTextview = null;
    private EditText mConsole = null;
    private int beaconNo;
    private boolean isReadyToProgram = false;

    private static final String TAG = BeaconConfigActivity.class.getSimpleName();

    private Runnable returnToParentRunnable;
    private String filePath = null;
    private boolean returnToParent = false;
    EddystoneConfigFileManager mEddystoneConfigFileManager = null;

    Intent startingIntent = null;

    private static final boolean auto_return = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_beacon_auto_config);

        beaconNo = getIntent().getIntExtra(BeaconListAdapter.ViewHolder.BEACON_NUMBER, 1);
        name = getIntent().getStringExtra(BeaconListAdapter.ViewHolder.BEACON_NAME);
        address = getIntent().getStringExtra(BeaconListAdapter.ViewHolder.BEACON_ADDRESS);
        filePath = getIntent().getStringExtra(BeaconListAdapter.ViewHolder.CONFIG_FILE_PATH);
        mEddystoneConfigFileManager = new EddystoneConfigFileManager(filePath);

        setupToolbar(name, address);

        executor = Executors.newSingleThreadExecutor();

//        mDummyTextview = (TextView) findViewById(R.id.dummyTextview);
//        mDummyTextview.setText("Not Programmed");

        startingIntent = getIntent();
        mConsole = (EditText) findViewById(R.id.console);
        mConsole.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                returnToParent = false;
            }
        });


        mProgramConfigButton = (Button) findViewById(R.id.programConfigButton);
        mProgramConfigButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                if(isReadyToProgram) {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            //mDummyTextview.setText("Programming...");
                            mProgramConfigButton.setEnabled(false);
                        }
                    });

                    executor.execute(new Runnable() {
                        @Override
                        public void run() {
                            programBeacon(beaconNo);
                        }
                    });
                }else{
                    Toast.makeText(getApplicationContext(),
                            "Beacon still locked!",
                            Toast.LENGTH_SHORT).show();
                }
            }
        });
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                mProgramConfigButton.setEnabled(false);
            }
        });

        accessBeacon();

        //startingIntent.set
        setResult (RESULT_CANCELED);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        gattClient.disconnect();
    }

    /**
     * Starts the process of connecting to the beacon, discovering its services, unlocking it and
     * reading all available information from it.
     */
    private void accessBeacon() {
        //disableDisplay();
        executor.execute(new Runnable() {
            @Override
            public void run() {
                connectToGatt(address);
            }
        });
        //if connected, discovering devices takes place in onGattConnected() in the GattListener
    }

    private void setupToolbar(final String name, final String address) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
                setSupportActionBar(toolbar);
                getSupportActionBar().setDisplayHomeAsUpEnabled(true);
                toolbar.setSubtitle(address);
                getWindow().setStatusBarColor(getResources().getColor(R.color.colorPrimary));
                setTitle(name);
            }
        });
    }

    private void connectToGatt(String address) {
        Log.d(TAG, "Connecting...");
        UiUtils.showToast(this, "Connecting...");
        log("Connecting...");
        gattClient = new GattClient(getApplicationContext(), address, gattListener);
        if (gattClient == null) {
            return;
        }
        gattClient.connect();
    }

    private GattClient.GattListener gattListener = new GattClient.GattListener() {
        @Override
        public void onGattConnected() {
            Log.d(TAG, "Connected to GATT service.");
            log("Connected to GATT.");
            log("Discovering services...");
            gattClient.discoverServices();
        }

        @Override
        public void onGattServicesDiscovered() {
            Log.d(TAG, "Discovered GATT services.");
            log("Discovered GATT services.");
            if (gattClient.isEddystoneGattServicePresent()) {
                log("Eddystone service found.");
                try {
                    byte[] lockState = gattClient.readLockState();
                    if (lockState[0] == GattConstants.LOCK_STATE_LOCKED) {
                        log("The beacon is locked, trying to unlock...");
                        unlock();
                    } else {
                        log("The beacon was not locked.");
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                mProgramConfigButton.setEnabled(true);
                                isReadyToProgram = true;
                            }
                        });
                        log("The beacon is ready to be programmed.");
                    }

                } catch (GattClientException e) {
                    Log.e(TAG, "Gatt Client Error when discovering devices", e);
                    displayConnectionFailScreen("Something went wrong when discovering services "
                            + "of beacon");
                    log("Gatt Client Error when discovering devices. "+ e.toString());
                } catch (GattOperationException e) {
                    Log.e(TAG, "Gatt Operation Error when discovering devices", e);
                    displayConnectionFailScreen("Something went wrong when discovering services "
                            + "of beacon");
                    log("Gatt Operation Error when discovering devices. "+ e.toString());
                }
            } else {
                log("Eddystone service NOT found. Disconnecting...");
                gattClient.disconnect();
            }
        }

        @Override
        public void onGattDisconnected() {
            Log.d(TAG, "Beacon disconnected.");
            log("Beacon disconnected.");
            if (intendedDisconnection) {
                UiUtils.showToast(BeaconAutoConfigActivity.this, "Beacon disconnected.");
                intendedDisconnection = false;
            } else if (!gattClient.isEddystoneGattServicePresent()){
                displayConnectionFailScreen("This beacon does not support the GATT service "
                        + "and cannot be configured with this app. \n \n");
            } else {
                displayConnectionFailScreen("Connection to beacon was lost unexpectedly. \n \n"
                        + getResources().getString(R.string.connect_to_beacon_message));
                log("Connection to beacon was lost unexpectedly.");
            }
        }
    };

    /**
     * Starts the process of unlocking a beacon. First it tries to automatically unlock the beacon
     * by applying the most common lock codes like all "f"s or all "0"s. If this fails, it pops up
     * a dialog to ask the user for the lock code of the beacon.
     */
    private void unlock() {
        Runnable setupBeaconInformationDisplay = new Runnable() {
            @Override
            public void run() {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        mProgramConfigButton.setEnabled(true);
                    }
                });
                isReadyToProgram = true;
                log("Beacon ready to program!");
                //setupBeaconInformationDisplay();
                // READY TO BE PROGRAMMED!!!
            }
        };

        attemptAutomaticUnlock(setupBeaconInformationDisplay);
    }

    private void attemptAutomaticUnlock(final Runnable runnable) {
        executor.execute(new Runnable() {
            @Override
            public void run() {
                Log.d(TAG, "Attempt to automatically unlock");
                log("Attempt to automatically unlock");
                ArrayList<String> commonPasswords = new ArrayList<>();
                BeaconConfiguration conf = mEddystoneConfigFileManager.getConfig(beaconNo);
                if(conf == null){
                    Log.d(TAG, "No configuration found in the file with Beacon Number: "+beaconNo);
                    log("No configuration found in the file with Beacon Number: "+beaconNo);

                    return;
                }
                String unlock_password = conf.getUnlockPassword();
                if(unlock_password != null) {
                    commonPasswords.add(unlock_password);
                }
                commonPasswords.add("b2687b1cb09da0bffece543ae61ac2f5"); //blueup default
                commonPasswords.add("00000000000000000000000000000000");
                commonPasswords.add("ffffffffffffffffffffffffffffffff");
                commonPasswords.add("000102030405060708090A0B0C0D0E0F");


//                commonPasswords.add("00102030405060708090A0B0C0D0E0F0");
//                commonPasswords.add("F0E0D0C0B0A090807096050403020100");
//                commonPasswords.add("0F0E0D0C0B0A09080709605040302010");

                // If you mess up with password set (i.e. if you sent the set password command, without encripting the new password with the old one)
                // the next lines tries all possibility of encripting the new and old password, if it manage to unlock it stores the CORRECT UNENCRYPTED password in unlockCode variable
//                for(int i = 0; i < commonPasswords.size();i++){
//                    for(int j = 0; j < commonPasswords.size();j++){
//                        String password = Utils.byteArrayToHexString(Utils.aes128Dencrypt(Utils.toByteArray(commonPasswords.get(i)),Utils.toByteArray(commonPasswords.get(j))));
//                        if (gattClient.unlock(Utils.toByteArray(password))) {
//                            Log.d(TAG, "Beacon unlocked automatically");
//                            log("Beacon unlocked automatically!");
//                            unlockCode = password;
//                            runnable.run();
//                            return;
//                        }
//                    }
//                }

                for (String password : commonPasswords) {
                    if (gattClient.unlock(Utils.toByteArray(password))) {
                        unlockCode = password;
                        Log.d(TAG, "Beacon unlocked automatically");
                        log("Beacon unlocked automatically with password: " + unlockCode);
                        runnable.run();
                        return;
                    }
                }

                //if automatic unlock fails, a dialog pops up to ask the user for the beacon's lock
                // code
                attemptManualUnlock(runnable);
            }
        });
    }

    private void attemptManualUnlock(final Runnable runnable) {
        executor.execute(new Runnable() {
            @Override
            public void run() {
                UnlockDialog.show(BeaconAutoConfigActivity.this, new UnlockDialog.UnlockListener() {
                    @Override
                    public void unlockingDismissed() {
                        displayConnectionFailScreen("This beacon is locked. \n \n"
                                + "It has to be unlocked before accessing its characteristics.");
                    }

                    @Override
                    public void unlock(byte[] unlockCode) {
                        String unlockCodeString = Utils.toHexString(unlockCode);
                        Log.d(TAG, "Trying " + unlockCodeString);
                        log("Trying " + unlockCodeString);
                        if (gattClient.unlock(unlockCode)) {
                            BeaconAutoConfigActivity.this.unlockCode = unlockCodeString;
                            if (runnable != null) {
                                runnable.run();
                            }
                        } else {
                            UiUtils.showToast(BeaconAutoConfigActivity.this,
                                    "Incorrect lock code. Try again?");
                            log("Incorrect lock code.");
                            attemptManualUnlock(runnable);
                        }
                    }
                });
            }
        });
    }

    /**
     * Displays a screen with a message and a "try again" button. Pressing the button will attempt
     * to connect to the beacon from beginning
     *
     * @param message message which we want to be printed on the screen
     */
    private void displayConnectionFailScreen(final String message) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                //enableDisplay();
                ViewGroup configContentView
                        = (ViewGroup) findViewById(R.id.beacon_config_page_content);
                UiUtils.makeChildrenInvisible(configContentView);
                ViewGroup connectionFailSlot = (ViewGroup) findViewById(R.id.connection_fail);
                connectionFailSlot.findViewById(R.id.connection_fail_btn)
                        .setOnClickListener(new View.OnClickListener() {
                            @Override
                            public void onClick(View view) {
                                accessBeacon();
                                findViewById(R.id.connection_fail).setVisibility(View.GONE);
                            }
                        });
                ((TextView) connectionFailSlot.findViewById(R.id.connection_fail_message))
                        .setText(message);
                connectionFailSlot.setVisibility(View.VISIBLE);
            }
        });

    }

    private boolean programBeacon(int m_beaconNo) {
        try {
            BeaconConfiguration conf = mEddystoneConfigFileManager.getConfig(m_beaconNo);
            log("Programming beacon with name: " + conf.getName());
            byte[] broadCastCap = gattClient.readBroadcastCapabilities();
            int slotNo = 0;
            while (slotNo < broadCastCap[1]) {
                if (slotNo < conf.getNumberOfConfiguredSlots()) {
                    log("Writing active slot characteristic... slotNo = " + slotNo);
                    gattClient.writeActiveSlot(slotNo);
                    int advInt = conf.getAdvIntervalForSlot(slotNo);
                    log("Writing advertise interval characteristic... advInt = " + advInt);
                    gattClient.writeAdvertisingInterval(advInt);
                    int txPwr = conf.getAdvTxPowerForSlot(slotNo);
                    log("Writing tx power characteristic... txPwr = " + txPwr);
                    gattClient.writeRadioTxPower(txPwr);
                    byte[] data = conf.getSlotDataForSlot(slotNo);
                    log("Writing data characteristic... data[] = " + Utils.byteArrayToHexString(data));
                    gattClient.writeAdvSlotData(data);
                } else {
                    gattClient.writeActiveSlot(slotNo);
                    log("Writing active slot characteristic... slotNo = " + slotNo);
                    //gattClient.writeAdvertisingInterval(0);
                    //gattClient.writeRadioTxPower(0);
                    byte[] advOFFSlotDataDefault = new byte[1];
                    advOFFSlotDataDefault[0] = 0x00; //frame type (UID)
                    log("Disabling the slot... advOFFSlotDataDefault[] = " + Utils.byteArrayToHexString(advOFFSlotDataDefault));
                    gattClient.writeAdvSlotData(advOFFSlotDataDefault);
                }
                slotNo++;
            }

            byte[] mRemainConnectable = {0};  //SET THIS TO 0 TO MAKE THE BEACON NON CONNECTABLE
            log("Writing remain connectable characteristic... mRemainConnectable = " + mRemainConnectable[0]);
            gattClient.writeRemainConnectable(mRemainConnectable);

            byte mAccelConfig = conf.getAccelConfig();
            log("Writing accel config characteristic... mAccelConfig = " + mAccelConfig);
            gattClient.writeAccelConfig(mAccelConfig);

            if (unlockCode != null) {
                String newPassw = conf.getNewPassword();
                log("Locking beacon with new password...");
                if(gattClient.lockWithNewPassword(Utils.toByteArray(unlockCode), Utils.toByteArray(newPassw))) {
                    log("Beacon locked with password: (0x)" + newPassw);
                }else{
                    log("Error while locking with password: (0x)" + newPassw);
                }

            } else {
                //byte[] lockData = {GattConstants.LOCK_STATE_UNLOCKED_AND_AUTOMATIC_RELOCK_DISABLED};
                //lockedNotificationString = "Unlocked and automatic relock disabled.";
//                byte[] lockData = {GattConstants.LOCK_STATE_LOCKED};
//                lockedNotificationString = "Locked without setting a password.";
//                gattClient.writeLockState(lockData);
            }
            gattClient.disconnect();

            log("Beacon with name: " + conf.getName() + " programmed and ready to be released");
            setResult(RESULT_OK);

            if (auto_return){
                Handler h = new Handler();
                returnToParent = true;
                returnToParentRunnable = new Runnable() {
                    @Override
                    public void run() {
                        if (returnToParent) {
                            finish();
                        }
                    }
                };
                h.postDelayed(returnToParentRunnable, 2000);
            }else{

                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        mProgramConfigButton.setText("DONE");
                        mProgramConfigButton.setEnabled(true);
                    }
                });

                mProgramConfigButton.setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View view) {
                        finish();
                    }
                });
            }
            return true;
        }catch(Exception e){

                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        log("Beacon No: " + beaconNo + " NOT Programmed!!!\nConfiguration not valid!");
                        mProgramConfigButton.setText("PROGRAM!");
                        mProgramConfigButton.setEnabled(true);
                    }
                });
            return false;
        }
    }

    private void log(final String txt) {
        if(mConsole == null) return;

        final String timestamp = new SimpleDateFormat("yyyy.MM.dd HH:mm:ss.SSS").format(new Date());
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                mConsole.setText(timestamp + " : " + txt + "\n" + mConsole.getText());
            }
        });
    }
}
