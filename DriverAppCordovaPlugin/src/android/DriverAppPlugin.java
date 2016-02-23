package it.smartcommunitylab.climb.dap;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;

public class DriverAppPlugin extends CordovaPlugin {
    private static final String LOG_TAG = "DriverAppPlugin";
    BroadcastReceiver receiver;
    private CallbackContext callbackContext = null;

    public DriverAppPlugin() {
        this.receiver = null;
    }

    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
        // your init code here
    }

    @Override
    public boolean execute(String action, JSONArray data, CallbackContext callbackContext) throws JSONException {
        if (action.equals("start")) {
            if (this.callbackContext != null) {
                callbackContext.error("Already running.");
                return true;
            }
            this.callbackContext = callbackContext;

            IntentFilter intentFilter = new IntentFilter();
            // TODO set the intent types from the lib!
            intentFilter.addAction(...);
            if (this.receiver == null) {
                this.receiver = new BroadcastReceiver() {
                    @Override
                    public void onReceive(Context context, Intent intent) {
                        // TODO run callback.success looking the intent!
                        sendUpdate(this.createUpdateJSONObject(intent), true);
                    }
                };
                webView.getContext().registerReceiver(this.receiver, intentFilter);
            }

            // Don't return any result now, since status results will be sent when events come in from broadcast receiver
            PluginResult pluginResult = new PluginResult(PluginResult.Status.NO_RESULT);
            pluginResult.setKeepCallback(true);
            callbackContext.sendPluginResult(pluginResult);
            return true;
        }

        if (action.equals("stop")) {
            removeListener();
            // release status callback in JS side
            this.sendUpdate(new JSONObject(), false);
            this.callbackContext = null;
            callbackContext.success();
            return true;
        }

        if (action.equals("test")) {
            String name = data.getString(0);
            String message = "TEST: " + name;
            callbackContext.success(message);
            return true;
        }

        return false;
    }

    private JSONObject createUpdateJSONObject(Intent intent) {
        JSONObject obj = new JSONObject();
        try {
            //obj.put("info1", intent.getExtra(...);
            //obj.put("info2", intent.getExtra(...);
        } catch (JSONException e) {
            Log.e(LOG_TAG, e.getMessage(), e);
        }
        return obj;
    }

    private void sendUpdate(JSONObject info, boolean keepCallback) {
        if (this.callbackContext != null) {
            PluginResult result = new PluginResult(PluginResult.Status.OK, info);
            result.setKeepCallback(keepCallback);
            this.callbackContext.sendPluginResult(result);
        }
    }

    public void onDestroy() {
        removeBatteryListener();
    }

    public void onReset() {
        removeBatteryListener();
    }

    private void removeListener() {
        if (this.receiver != null) {
            try {
                webView.getContext().unregisterReceiver(this.receiver);
                this.receiver = null;
            } catch (Exception e) {
                Log.e(LOG_TAG, "Error unregistering receiver: " + e.getMessage(), e);
            }
        }
    }
}
