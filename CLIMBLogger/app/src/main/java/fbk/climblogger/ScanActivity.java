package fbk.climblogger;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.ServiceConnection;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;
import android.support.design.widget.FloatingActionButton;
import android.support.design.widget.Snackbar;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.internal.widget.AdapterViewCompat;
import android.support.v7.widget.Toolbar;
import android.util.Log;
import android.view.View;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.ExpandableListAdapter;
import android.widget.ExpandableListView;
import android.widget.ListView;
import android.widget.Toast;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;

public class ScanActivity extends Activity {

    private final static String TAG = "ScanActivity_GIOVA";
    private Button mStartButton,mStopButton,mTagButton,mCheckInAllButton,mCheckOutAllButton,mReleaseCmdButton;
    private int index = 0;
    private ArrayList<ClimbNode> climbNodeList;
    private ArrayAdapter<ListView> adapter;
    private ClimbService mClimbService;
    private Context mContext = null;
    private EditText mConsole = null;
    private CheckBox logCheckBox = null;
    private Handler mHandler = null;

    ExpandableListView expandableListView;
    MyExpandableListAdapter expandableListAdapter;
    List<ClimbNode> expandableListTitle;
    HashMap<ClimbNode, List<String>> expandableListDetail;

    // Handles various events fired by the Service.
    // ACTION_GATT_CONNECTED: connected to a GATT server.
    // ACTION_GATT_DISCONNECTED: disconnected from a GATT server.
    // ACTION_GATT_SERVICES_DISCOVERED: discovered GATT services.
    // ACTION_DATA_AVAILABLE: received data from the device.  This can be a result of read
    //                        or notification operations.

    private final BroadcastReceiver mClimbUpdateReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            final String action = intent.getAction();

            if (ClimbService.ACTION_DEVICE_ADDED_TO_LIST.equals(action)) {

                if(intent.hasExtra(ClimbService.EXTRA_INT_ARRAY)){
                    updateDetailsExpandableListDetails(intent.getIntArrayExtra(ClimbService.EXTRA_INT_ARRAY));
                }else{
                    updateDetailsExpandableListDetails();
                }
                expandableListAdapter.notifyDataSetChanged();
                log("ACTION_DEVICE_ADDED_TO_LIST broadcast received");

            } else if (ClimbService.ACTION_DEVICE_REMOVED_FROM_LIST.equals(action)) {

                expandableListAdapter.notifyDataSetChanged();
                log("ACTION_DEVICE_REMOVED_FROM_LIST broadcast received");

            }else if (ClimbService.ACTION_METADATA_CHANGED.equals(action)) {

                if(intent.hasExtra(ClimbService.EXTRA_INT_ARRAY)){
                    updateDetailsExpandableListDetails(intent.getIntArrayExtra(ClimbService.EXTRA_INT_ARRAY));
                }else{
                    updateDetailsExpandableListDetails();
                }
                expandableListAdapter.notifyDataSetChanged();
                //log("ACTION_METADATA_CHANGED broadcast received");

            }else if (ClimbService.ACTION_DATALOG_ACTIVE.equals(action)) {

                log("Datalog active on file: "+intent.getStringExtra(ClimbService.EXTRA_STRING));
            }else if (ClimbService.ACTION_DATALOG_INACTIVE.equals(action)) {

                log("Datalog stopped");
            }else if (ClimbService.STATE_CONNECTED_TO_CLIMB_MASTER.equals(action)) {
                Toast.makeText(getApplicationContext(),
                        "Connected with GATT!",
                        Toast.LENGTH_SHORT).show();
                log("Connected with GATT");
            }else if (ClimbService.STATE_DISCONNECTED_FROM_CLIMB_MASTER.equals(action)) {
                climbNodeList.clear();
            Toast.makeText(getApplicationContext(),
                    "DISCONNECTED FORM GATT!",
                    Toast.LENGTH_SHORT).show();
            log("DISCONNECTED FORM GATT!");
            }
            else if (ClimbService.ACTION_NODE_ALERT.equals(action)) {
                if(intent.hasExtra(ClimbService.EXTRA_BYTE_ARRAY)){
                    byte[] nodeID = intent.getByteArrayExtra(ClimbService.EXTRA_BYTE_ARRAY);
                    String alertString = "ALERT ON NODE :" + String.format("%02X", nodeID[0]);
                    Toast.makeText(getApplicationContext(),
                            alertString,
                            Toast.LENGTH_LONG).show();

                    log( alertString );
                }else{

                }


            }
        }
    };

    // Code to manage Service lifecycle.
    private final ServiceConnection mServiceConnection = new ServiceConnection() {

        @Override //Questa � usata per ritornare l'oggetto IBinder (c'� solo nei bound services)
        public void onServiceConnected(ComponentName componentName, IBinder service) {
            //la prossima istruzione ritorna l'oggetto BluetoothLeService
            mClimbService = ((ClimbService.LocalBinder) service).getService();
            mClimbService.setHandler(mHandler);
            mClimbService.setContext(getApplicationContext());
            //IN QUESTO PUNTO RICHIEDI LA LISTA DI DISPOSITIVI INIZIALI PER INSERIRLA NELLA LISTVIEW
            climbNodeList = mClimbService.getNodeList();
            //expandableListTitle = climbNodeList;
            //expandableListDetail = ExpandableListDataPump.getData(); //expandableListDetail conterrà le info aggiuntive
            //expandableListTitle = new ArrayList<String>(expandableListDetail.keySet()); //expandableListTitle dovrà contenere i nomi dei dispositivi direttamente visibili dallo smartphone
            expandableListDetail = new HashMap<ClimbNode, List<String>>();
            expandableListAdapter = new MyExpandableListAdapter(mContext, climbNodeList, expandableListDetail);
            expandableListView.setAdapter(expandableListAdapter);
/*
            //crea un adapter per gestire la listView
            adapter = new ArrayAdapter<ListView>(mContext, android.R.layout.simple_list_item_1, android.R.id.text1,climbNodeList);

            // Assign adapter to ListView
            listView.setAdapter(adapter);
            adapter.notifyDataSetChanged();
*/
            Log.i(TAG, "Service connected!");
        }

        @Override
        public void onServiceDisconnected(ComponentName componentName) {
            mClimbService = null;
            Log.i(TAG,"Service disconnected!");
        }
    };

    View.OnClickListener startButtonHandler = new View.OnClickListener(){
        public void onClick(View v) {

            if(mClimbService != null){
                if(logCheckBox != null && logCheckBox.isChecked()) {
                    //TODO: start logging
                    mClimbService.StartMonitoring(true);
                    Log.i(TAG, "Start scan with data logging!");
                    log("Start scan with data logging command sent!");
                }else{
                    mClimbService.StartMonitoring(false);
                    Log.i(TAG, "Start scan without data logging!");
                    log("Start scan without data logging command sent!");
                }

            }else{
                Log.i(TAG, "Start scan not sent!");
                log("Start scan not sent!");
            }

        }
    };

    View.OnClickListener stopButtonHandler = new View.OnClickListener(){
        public void onClick(View v) {

            if(mClimbService != null){
                mClimbService.StopMonitoring();
                Log.i(TAG, "Stop scan!");
                log("Stop scan command sent!");
            }else{
                Log.i(TAG, "Stop scan not sent!");
                log("Stop scan not sent!");
            }

        }
    };

    View.OnClickListener tagButtonHandler = new View.OnClickListener(){
        public void onClick(View v) {

            if(mClimbService != null){
                if(mClimbService.insertTag("Manually_inserted_tag")){
                    log("Tag Inserted!");
                }else{
                    log("Tag not inserted! Something went wrong in ClimbService!");
                }

            }else{
                Log.i(TAG, "Tag not inserted! mClimbService == null");
                log("Tag not inserted! mClimbService == null");
            }

        }
    };

    View.OnClickListener ckInAllButtonHandler = new View.OnClickListener(){
        public void onClick(View v) {

            if(mClimbService != null){
                mClimbService.SendCheckInAllCmd();
            }else{
                Log.i(TAG, "Stop scan not sent!");
                log("Stop scan not sent!");
            }

        }
    };
    View.OnClickListener ckOutAllButtonHandler = new View.OnClickListener(){
        public void onClick(View v) {

            if(mClimbService != null){
                mClimbService.SendCheckOutAllCmd();
            }else{
                Log.i(TAG, "Stop scan not sent!");
                log("Stop scan not sent!");
            }

        }
    };
    View.OnClickListener releaseCmdButtonHandler = new View.OnClickListener(){
        public void onClick(View v) {

            if(mClimbService != null){
                mClimbService.SendReleaseAllCmd();
            }else{
                Log.i(TAG, "Stop scan not sent!");
                log("Stop scan not sent!");
            }

        }
    };

    ExpandableListView.OnGroupExpandListener mOnGroupExpandListener = new ExpandableListView.OnGroupExpandListener() {

        @Override
        public void onGroupExpand(int groupPosition) {
            Log.i(TAG, "Group expanded, position: " + groupPosition);
            //ClimbNode clickedNode = climbNodeList.get(groupPosition);

            mClimbService.onNodeClick(groupPosition, -1);


        }
    };

    ExpandableListView.OnGroupCollapseListener mOnGroupCollapseListener = new ExpandableListView.OnGroupCollapseListener() {

        @Override
        public void onGroupCollapse(int groupPosition) {

            mClimbService.onNodeClick(groupPosition, -2);

        }
    };

    ExpandableListView.OnChildClickListener mOnChildClickListener = new ExpandableListView.OnChildClickListener() {
        @Override
        public boolean onChildClick(ExpandableListView parent, View v,
                                    int groupPosition, int childPosition, long id) {

            mClimbService.onNodeClick(groupPosition,childPosition);

            return false;
        }
    };


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_scan);
        mHandler = new Handler();

        mContext = this.getApplicationContext();
        mConsole = (EditText) findViewById(R.id.console_item);

        //listView = (ListView) findViewById(R.id.list);

        mStartButton = (Button) findViewById(R.id.buttonStart);
        mStartButton.setOnClickListener(startButtonHandler);


        mStopButton = (Button) findViewById(R.id.buttonStop);
        mStopButton.setOnClickListener(stopButtonHandler);

        logCheckBox = (CheckBox) findViewById(R.id.logCheckBox);

        mTagButton = (Button) findViewById(R.id.buttonTag);
        mTagButton.setOnClickListener(tagButtonHandler);

        mCheckInAllButton = (Button) findViewById(R.id.buttonCheckInAll);
        mCheckInAllButton.setOnClickListener(ckInAllButtonHandler);

        mCheckOutAllButton = (Button) findViewById(R.id.buttonCheckOutAll);
        mCheckOutAllButton.setOnClickListener(ckOutAllButtonHandler);

        mReleaseCmdButton = (Button) findViewById(R.id.buttonReleaseBrdcstCmd);
        mReleaseCmdButton.setOnClickListener(releaseCmdButtonHandler);

        expandableListView = (ExpandableListView) findViewById(R.id.list);

        Intent climbServiceIntent = new Intent(ScanActivity.this, ClimbService.class); //capire come si comporta nel caso in qui il servizio sia ancora in esecuzione in background
        startService(climbServiceIntent);


        expandableListView.setOnGroupExpandListener( mOnGroupExpandListener );

        expandableListView.setOnGroupCollapseListener( mOnGroupCollapseListener );

        expandableListView.setOnChildClickListener( mOnChildClickListener );
    }


    @Override
    protected void onStart() {
        super.onStart();


    }
    @Override
    protected void onResume() {
        super.onResume();
        Log.i(TAG, "ScanActivity.onResume() called.");
        log("ScanActivity.onResume() called.");

        //AVVIA IL SERVIZIO E INIZIALIZZA IL BIND
        Intent climbServiceIntent = new Intent(ScanActivity.this, ClimbService.class); //capire come si comporta nel caso in qui il servizio sia ancora in esecuzione in background
        bindService(climbServiceIntent, mServiceConnection, BIND_AUTO_CREATE);

        registerReceiver(mClimbUpdateReceiver, makeClimbServiceIntentFilter());

    }

    @Override
    protected void onPause() {
        Log.i(TAG, "ScanActivity.onPause() called.");
        log("ScanActivity.onPause() called.");
        super.onPause();
        unregisterReceiver(mClimbUpdateReceiver);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        Log.i(TAG, "ScanActivity.onDestroy() called.");
        log("ScanActivity.onDestroy() called.");

        //stopService(new Intent(ScanActivity.this, ClimbService.class));
        //climbNodeList = null;
        unbindService(mServiceConnection);
        //mClimbService = null;
        //expandableListDetail = null;
        //expandableListAdapter = null;
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.menu_scan, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        // Handle action bar item clicks here. The action bar will
        // automatically handle clicks on the Home/Up button, so long
        // as you specify a parent activity in AndroidManifest.xml.
        int id = item.getItemId();

        //noinspection SimplifiableIfStatement
        if (id == R.id.action_settings) {
            return true;
        }

        return super.onOptionsItemSelected(item);
    }

    private void updateDetailsExpandableListDetails(final int[] changedClimbNodeIndex){
        if(climbNodeList != null) {
            for (int i = 0; i < changedClimbNodeIndex.length; i++) {
                ClimbNode actualNode = climbNodeList.get(changedClimbNodeIndex[i]);
                if (actualNode != null) {
                    List<String> actualNodeDetailsList = actualNode.getClimbNeighbourList();
                    expandableListDetail.put(actualNode, actualNodeDetailsList); //il metodo put sostituisce il vecchio valore, quindi nella hashmap non si creano doppioni
                }
            }
        }

    }

    private void updateDetailsExpandableListDetails(){
        if(climbNodeList != null) {
            for (int i = 0; i < climbNodeList.size(); i++) {
                ClimbNode actualNode = climbNodeList.get(i);
                if (actualNode != null) {
                    List<String> actualNodeDetailsList = actualNode.getClimbNeighbourList();
                    expandableListDetail.put(actualNode, actualNodeDetailsList); //il metodo put sostituisce il vecchio valore, quindi nella hashmap non si creano doppioni
                }
            }
        }

    }

    private void log(final String txt) {
        if(mConsole == null) return;

        final String timestamp = new SimpleDateFormat("HH:mm:ss.SSS").format(new Date());
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                mConsole.setText(timestamp + " : " + txt + "\n" + mConsole.getText());
            }
        });
    }

    private static IntentFilter makeClimbServiceIntentFilter() {
        final IntentFilter intentFilter = new IntentFilter();
        intentFilter.addAction(ClimbService.ACTION_DATALOG_ACTIVE);
        intentFilter.addAction(ClimbService.ACTION_DATALOG_INACTIVE);
        intentFilter.addAction(ClimbService.ACTION_METADATA_CHANGED);
        intentFilter.addAction(ClimbService.ACTION_DEVICE_ADDED_TO_LIST);
        intentFilter.addAction(ClimbService.STATE_CONNECTED_TO_CLIMB_MASTER);
        intentFilter.addAction(ClimbService.STATE_DISCONNECTED_FROM_CLIMB_MASTER);
        intentFilter.addAction(ClimbService.ACTION_DEVICE_REMOVED_FROM_LIST);
        intentFilter.addAction(ClimbService.ACTION_NODE_ALERT);
        return intentFilter;
    }



}