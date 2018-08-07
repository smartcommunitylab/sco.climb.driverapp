package fbk.climblogger;


import android.content.Context;
import android.graphics.Typeface;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseExpandableListAdapter;
import android.widget.TextView;

public class MyExpandableListAdapter extends BaseExpandableListAdapter {

    private fbk.climblogger.ClimbServiceInterface service;
    private Context context;
    private String TAG = "MyExpandableListAdapter";

    public String[] getMasters() {
        return new String[]{"ME"};
    }

    public MyExpandableListAdapter(Context context, fbk.climblogger.ClimbServiceInterface service) {
        this.context = context;
        this.service = service;
    }

    @Override
    public Object getChild(int listPosition, int expandedListPosition) {
        try {
            return service.getNetworkState()[expandedListPosition];
        }catch(Exception e){
            Log.d(TAG,"Exeption caught!");
            return null;
        }
    }

    @Override
    public long getChildId(int listPosition, int expandedListPosition) {
        return expandedListPosition;
    }

    @Override
    public View getChildView(int listPosition, final int expandedListPosition,
                             boolean isLastChild, View convertView, ViewGroup parent) {

        if (convertView == null) {
            LayoutInflater layoutInflater = (LayoutInflater) this.context
                    .getSystemService(Context.LAYOUT_INFLATER_SERVICE);
            convertView = layoutInflater.inflate(R.layout.list_item, null);
        }

        fbk.climblogger.ClimbServiceInterface.NodeState ns = (fbk.climblogger.ClimbServiceInterface.NodeState) getChild(listPosition, expandedListPosition);

        if(ns != null) {
            String expandedListText;

            expandedListText = "bd_addr: " + ns.bdAddress + "\nID (0x): " + ns.nodeID + "\nState: " + ns.state + "\nLast seen: " + (System.currentTimeMillis() - ns.lastSeen + "ms ago") + "\nBeacon Type: " + ns.beaconType;

            if (ns.batteryVoltage_mV != fbk.climblogger.ConfigVals.INVALID_BATTERY_VOLTAGE) {
                expandedListText += "\nBattery voltage: " + ns.batteryVoltage_mV + "mV, Level: " + ns.batteryLevel;
            }

            TextView expandedListTextView = (TextView) convertView
                    .findViewById(R.id.expandedListItem);
            expandedListTextView.setText(expandedListText);
        }
        return convertView;
    }

    @Override
    public int getChildrenCount(int listPosition) {
        return service.getNetworkState().length;
    }

    @Override
    public Object getGroup(int listPosition) {
        return getMasters()[listPosition];
    }

    @Override
    public int getGroupCount() {
        return getMasters().length;
    }

    @Override
    public long getGroupId(int listPosition) {
        return listPosition;
    }

    @Override
    public View getGroupView(int listPosition, boolean isExpanded,View convertView, ViewGroup parent) {
        String listTitle = "";
        if(service instanceof fbk.climblogger.ClimbSimpleService){
            listTitle += "CLIMBM - " + getGroup(listPosition).toString() + " - Local device";
        }else{
            listTitle += getGroup(listPosition).toString();
        }
        if (convertView == null) {
            LayoutInflater layoutInflater = (LayoutInflater) this.context.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
            convertView = layoutInflater.inflate(R.layout.list_group, null);
        }
        TextView listTitleTextView = (TextView) convertView
                .findViewById(R.id.listTitle);
        listTitleTextView.setTypeface(null, Typeface.BOLD);
        listTitleTextView.setText(listTitle);
        return convertView;
    }

    @Override
    public boolean hasStableIds() {
        return false;
    }

    @Override
    public boolean isChildSelectable(int listPosition, int expandedListPosition) {
        return true;
    }

}