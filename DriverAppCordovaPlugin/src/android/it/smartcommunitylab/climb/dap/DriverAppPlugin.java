package it.smartcommunitylab.climb.dap;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.ServiceConnection;
import android.os.Handler;
import android.os.IBinder;
import android.util.Log;
import fbk.climblogger.ClimbService;
import fbk.climblogger.ClimbServiceInterface.NodeState;

public class DriverAppPlugin extends CordovaPlugin {
	private static final String LOG_TAG = "DriverAppPlugin";

	private ClimbService mClimbService = null;
	private BroadcastReceiver receiver = null;
	private CallbackContext callbackContext = null;

	public DriverAppPlugin() {
		this.receiver = null;
	}

	@Override
	public void initialize(CordovaInterface cordova, CordovaWebView webView) {
		super.initialize(cordova, webView);

		Log.d(LOG_TAG, "context: " + webView.getContext());

		Intent climbServiceIntent = new Intent(webView.getContext(), ClimbService.class);
		Log.d(LOG_TAG, "climbServiceIntent: " + climbServiceIntent);
		boolean bound = webView.getContext().bindService(climbServiceIntent, mServiceConnection, Context.BIND_AUTO_CREATE);
		Log.d(LOG_TAG, "bound? " + bound);
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
			// intentFilter.addAction(...);
			if (this.receiver == null) {
				this.receiver = new BroadcastReceiver() {
					@Override
					public void onReceive(Context context, Intent intent) {
						// TODO run callback.success looking the intent!
						sendUpdate(createUpdateJSONObject(intent), true);
					}
				};
				webView.getContext().registerReceiver(this.receiver, intentFilter);
			}

			// Don't return any result now, since status results will be sent
			// when events come in from broadcast receiver
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

		if (action.equals("getNetworkState")) {
			Log.d(LOG_TAG, "action: getNetworkState");
			NodeState[] networkState = mClimbService.getNetworkState();
			String status = networkState != null ? networkState.length + " nodes connected" : "No master connected!";
			Log.d(LOG_TAG, "networkState: " + status);
			callbackContext.success("networkState: " + status);
			return true;
		}

		if (action.equals("test")) {
			Log.d(LOG_TAG, "action: test");
			String name = data.getString(0);
			String message = "Hello, " + name;
			Log.d(LOG_TAG, "test: " + message);
			callbackContext.success(message);
			return true;
		}

		return false;
	}

	private JSONObject createUpdateJSONObject(Intent intent) {
		JSONObject obj = new JSONObject();

		try {
			obj.put("info1", intent.getIntExtra("info1", 1));
			obj.put("info2", intent.getIntExtra("info2", 2));
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
		removeListener();
	}

	public void onReset() {
		removeListener();
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

	private final ServiceConnection mServiceConnection = new ServiceConnection() {
		@Override
		public void onServiceConnected(ComponentName className, IBinder service) {
			mClimbService = ((ClimbService.LocalBinder) service).getService();
	        //mClimbService.setHandler(new Handler());
	        //mClimbService.setContext(webView.getContext());
			Log.d(LOG_TAG, "climbService: " + mClimbService);
		}

		@Override
		public void onServiceDisconnected(ComponentName className) {
			mClimbService = null;
			Log.d(LOG_TAG, "climbService: " + mClimbService);
		}
	};
}
