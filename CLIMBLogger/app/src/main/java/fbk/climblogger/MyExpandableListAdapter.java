package fbk.climblogger;


import java.util.HashMap;
import java.util.List;
import android.content.Context;
import android.graphics.Typeface;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseExpandableListAdapter;
import android.widget.CheckBox;
import android.widget.CompoundButton;
import android.widget.TextView;

public class MyExpandableListAdapter extends BaseExpandableListAdapter {

    private Context mContext;
    private List<ClimbNode> expandableListGroup;
    private HashMap<ClimbNode, List<String>> expandableListChild;

    // Hashmap for keeping track of our checkbox check states
    private HashMap<Integer, boolean[]> mChildCheckStates;

    // Our getChildView & getGroupView use the viewholder patter
    // Here are the viewholders defined, the inner classes are
    // at the bottom
    private ChildViewHolder childViewHolder;
    private GroupViewHolder groupViewHolder;


    /*
 *  For the purpose of this document, I'm only using a single
 *  textview in the group (parent) and child, but you're limited only
 *  by your XML view for each group item :)
*/
    private String groupText;
    private String childText;


    public MyExpandableListAdapter(Context context, List<ClimbNode> expandableListGroup,
                                 HashMap<ClimbNode, List<String>> expandableListChild) {
        this.mContext = context;
        this.expandableListGroup = expandableListGroup;
        this.expandableListChild = expandableListChild;

        // Initialize our hashmap containing our check states here
        mChildCheckStates = new HashMap<Integer, boolean[]>();
    }

    @Override
    public Object getChild(int listPosition, int expandedListPosition) {
        return this.expandableListChild.get(this.expandableListGroup.get(listPosition)).get(expandedListPosition);
    }

    @Override
    public long getChildId(int listPosition, int expandedListPosition) {
        return expandedListPosition;
    }

    @Override
    public View getChildView(int groupPosition, final int childPosition, boolean isLastChild, View convertView, ViewGroup parent) {

        final int mGroupPosition = groupPosition;
        final int mChildPosition = childPosition;

        //  I passed a text string into an activity holding a getter/setter
        //  which I passed in through "ExpListChildItems".
        //  Here is where I call the getter to get that text
        childText = (String) getChild(groupPosition, childPosition);

        //final String expandedListText = (String) getChild(groupPosition, childPosition);
        if (convertView == null) {
            LayoutInflater layoutInflater = (LayoutInflater) this.mContext.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
            convertView = layoutInflater.inflate(R.layout.list_item, null);

            childViewHolder = new ChildViewHolder();

            childViewHolder.mChildText = (TextView) convertView.findViewById(R.id.expandedListItem);

            childViewHolder.mCheckBox = (CheckBox) convertView.findViewById(R.id.nodeCheckbox);

            convertView.setTag(R.layout.list_item, childViewHolder);
//            CheckBox nodeCheckBox = (CheckBox) convertView.findViewById(R.id.nodeCheckbox);
//            nodeCheckBox.setOnCheckedChangeListener(met);
        }else{
            childViewHolder = (ChildViewHolder) convertView.getTag(R.layout.list_item);
        }
        childViewHolder.mChildText.setText(childText);

/*
         * You have to set the onCheckChangedListener to null
         * before restoring check states because each call to
         * "setChecked" is accompanied by a call to the
         * onCheckChangedListener
        */
        childViewHolder.mCheckBox.setOnCheckedChangeListener(null);

        if (mChildCheckStates.containsKey(mGroupPosition)) {
            /*
             * if the hashmap mChildCheckStates<Integer, Boolean[]> contains
             * the value of the parent view (group) of this child (aka, the key),
             * then retrive the boolean array getChecked[]
            */
            boolean getChecked[] = mChildCheckStates.get(mGroupPosition);

            // set the check state of this position's checkbox based on the
            // boolean value of getChecked[position]

            if(getChildrenCount(groupPosition) == getChecked.length) {
                childViewHolder.mCheckBox.setChecked(getChecked[mChildPosition]); //throw index out of bounds
            }else{ //tentativo....quando il numero di child cambia rigenera il vettore
                getChecked = new boolean[getChildrenCount(mGroupPosition)];

                // add getChecked[] to the mChildCheckStates hashmap using mGroupPosition as the key
                mChildCheckStates.put(mGroupPosition, getChecked);

                // set the check state of this position's checkbox based on the
                // boolean value of getChecked[position]
                childViewHolder.mCheckBox.setChecked(false);
            }

        } else {

            /*
            * if the hashmap mChildCheckStates<Integer, Boolean[]> does not
            * contain the value of the parent view (group) of this child (aka, the key),
            * (aka, the key), then initialize getChecked[] as a new boolean array
            *  and set it's size to the total number of children associated with
            *  the parent group
            */
            boolean getChecked[] = new boolean[getChildrenCount(mGroupPosition)];

            // add getChecked[] to the mChildCheckStates hashmap using mGroupPosition as the key
            mChildCheckStates.put(mGroupPosition, getChecked);

            // set the check state of this position's checkbox based on the
            // boolean value of getChecked[position]
            childViewHolder.mCheckBox.setChecked(false);
        }

        childViewHolder.mCheckBox.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {

            @Override
            public void onCheckedChanged(CompoundButton buttonView,
                                         boolean isChecked) {

                if (isChecked) {

                    boolean getChecked[] = mChildCheckStates.get(mGroupPosition);
                    getChecked[mChildPosition] = isChecked;
                    mChildCheckStates.put(mGroupPosition, getChecked);

                } else {

                    boolean getChecked[] = mChildCheckStates.get(mGroupPosition);
                    getChecked[mChildPosition] = isChecked;
                    mChildCheckStates.put(mGroupPosition, getChecked);
                }
            }
        });

//        TextView expandedListTextView = (TextView) convertView.findViewById(R.id.expandedListItem);
//        expandedListTextView.setText(expandedListText);
//
//        CheckBox nodeCheckBox = (CheckBox) convertView.findViewById(R.id.nodeCheckbox);
//        nodeCheckBox.setChecked(true);

        return convertView;
    }

    @Override
    public int getChildrenCount(int listPosition) {
        //if(this.expandableListChild.get(this.expandableListGroup.get(listPosition)) == null){
        //    return 0;
        //}
        return this.expandableListChild.get(this.expandableListGroup.get(listPosition)).size();
    }

    @Override
    public Object getGroup(int listPosition) {
        return this.expandableListGroup.get(listPosition);
    }

    @Override
    public int getGroupCount() {
        return this.expandableListGroup.size();
    }

    @Override
    public long getGroupId(int listPosition) {
        return listPosition;
    }

    @Override
    public View getGroupView(int listPosition, boolean isExpanded,View convertView, ViewGroup parent) {

        groupText = getGroup(listPosition).toString();

        if (convertView == null) {
            LayoutInflater layoutInflater = (LayoutInflater) this.mContext.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
            convertView = layoutInflater.inflate(R.layout.list_group, null);

            // Initialize the GroupViewHolder defined at the bottom of this document
            groupViewHolder = new GroupViewHolder();

            groupViewHolder.mGroupText = (TextView) convertView.findViewById(R.id.listTitle);

            convertView.setTag(groupViewHolder);
        }else {
            groupViewHolder = (GroupViewHolder) convertView.getTag();
        }
        groupViewHolder.mGroupText.setTypeface(null, Typeface.BOLD);
        groupViewHolder.mGroupText.setText(groupText);

        //TextView listTitleTextView = (TextView) convertView.findViewById(R.id.listTitle);
        //listTitleTextView.setTypeface(null, Typeface.BOLD);
        //listTitleTextView.setText(listTitle);
        return convertView;
    }

    public boolean[] getNodeCheckState(int groupIndex){
        return mChildCheckStates.get(groupIndex);
    }

    @Override
    public boolean hasStableIds() {
        return false;
    }

    @Override
    public boolean isChildSelectable(int listPosition, int expandedListPosition) {
        return true;
    }


    public final class GroupViewHolder {

        TextView mGroupText;
    }

    public final class ChildViewHolder {

        TextView mChildText;
        CheckBox mCheckBox;
    }
}
