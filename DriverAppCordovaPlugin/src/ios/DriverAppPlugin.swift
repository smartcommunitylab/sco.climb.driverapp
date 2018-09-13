import Foundation
import UIKit
import CoreBluetooth

@objc(DriverAppPlugin)
class DriverAppPlugin: CDVPlugin {
    
    fileprivate var logger: ClimbLogger!
    
    var pluginResult = CDVPluginResult( status: CDVCommandStatus_ERROR)
    public override init() {
        super.init();
        
    }
    //--- CLIMB API -----------------------------------------------
    
    @objc(initialize:)
    open func initialize(command: CDVInvokedUrlCommand) -> Bool {
        
        print("****************************************Initalize ");

        //ALM SEPTEMBER 2018
        // start the logging.  This will open a new file the first time, then use that same file if initalize is called again
        self.logger = ClimbLogger.shared;
        logger.startDataLog();
        // try to start the bluetooth listening - this will fail if BT is turned off on the phone
        if (ClimbBeaconService.shared().climbInitalize()){
            sendSuccess(command: command, result: "Initialized", keepCallback: true);
            
        } else {
            sendSuccess(command: command, result: "NOT Initialized", keepCallback: true);
        }

        
        
        return true
    }
    
    @objc(deinitialize:)
    open func deinitialize(command: CDVInvokedUrlCommand) -> Bool {
        ClimbBeaconService.shared().climbDeinitialize();
        logger.stopDataLog();
        sendSuccess(command: command, result: "Deinitialized", keepCallback: true);
        return true
    }
    
    @objc(startListener:)
    open func startListener(command: CDVInvokedUrlCommand) -> Bool {
        
        // ALM: this listener is no longer needed by the ios plugin
        // but the Cordova side requires it to be invoked once to start the process to call getNetworkState
        // so, we fake the message that we are connected to the master, and never call the listener again
        
        let message = "fbk.climblogger.ClimbService.STATE_CONNECTED_TO_CLIMB_MASTER";
        let responseAsDict: [String: AnyObject] = [
            "action": message  as AnyObject
        ];
        
        sendSuccessWithDictionary(command: command, result: responseAsDict, keepCallback: true);
        
        return true
    }
    
    @objc(stopListener:)
    open func stopListener(command: CDVInvokedUrlCommand) -> Bool {
        sendOk(command: command, keepCallback: true);
        return true
    }
    
    
    
    @objc(getNetworkState:)
    open func getNetworkState(command: CDVInvokedUrlCommand) -> String {
        print("****************************************getNetworkStateCalled");
        let networkAsDict = ClimbBeaconService.shared().getChildrenDictArray();
        print("*************************************************************nodesInNetwork:",networkAsDict.count);
        //send the array of children nodes
        sendSuccessWithArray(command: command, result: networkAsDict, keepCallback: true);
        
        
        return "\(true)"
        
    }
    
    
    @objc(getLogFiles:)
    open func getLogFiles(command: CDVInvokedUrlCommand) -> [String] {
        
        let logFilePathsArray  = logger.getAllLogFilePaths();
        print("files:"+logFilePathsArray.description);
        //send the array of files names
        sendSuccessWithPlainArray(command: command, result: logFilePathsArray, keepCallback: true);
        return logFilePathsArray;
        
        
        //        let logFilePathsJSON  = logger.getAllLogFilePaths().toJson()
        //        sendSuccess(command: command, result: logFilePathsJSON, keepCallback: true);
        
        // return logFilePathsArray
    }
    
    @objc(test:)
    open func test(command: CDVInvokedUrlCommand) -> Bool {
        sendSuccess(command: command, result: "Hello test", keepCallback: true);
        return true
    }
    
    
    
    //--- Cordova Callbacks helpers -----------------------------------------------
    
    func sendSuccess(command: CDVInvokedUrlCommand, result: String, keepCallback: Bool) {
        //print("sendSuccess with a string:"+result);
        let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: result);
        pluginResult?.setKeepCallbackAs(keepCallback);
        self.commandDelegate!.send(pluginResult,callbackId: command.callbackId);
        
    }
    
    func sendOk(command: CDVInvokedUrlCommand, keepCallback: Bool) {
        let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK);
        pluginResult?.setKeepCallbackAs(keepCallback);
        self.commandDelegate!.send(pluginResult,callbackId: command.callbackId);
        
    }
    
    func sendSuccessWithArray(command: CDVInvokedUrlCommand, result: Array<Dictionary<String, AnyObject>>, keepCallback: Bool) {
        let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: result);
        pluginResult?.setKeepCallbackAs(keepCallback);
        self.commandDelegate!.send(pluginResult,callbackId: command.callbackId);
        
    }
    
    func sendSuccessWithDictionary (command: CDVInvokedUrlCommand, result: Dictionary<String, AnyObject>, keepCallback: Bool) {
        let pluginResult = CDVPluginResult (status: CDVCommandStatus_OK, messageAs: result);
        pluginResult?.setKeepCallbackAs (keepCallback);
        self.commandDelegate!.send(pluginResult, callbackId: command.callbackId);
    }
    
    func sendSuccessWithBoolean(command: CDVInvokedUrlCommand, result: Bool, keepCallback: Bool) {
        let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: result);
        pluginResult?.setKeepCallbackAs(keepCallback);
        self.commandDelegate!.send(pluginResult,callbackId: command.callbackId);
        
    }
    func sendSuccessWithPlainArray(command: CDVInvokedUrlCommand, result: Array<String>, keepCallback: Bool) {
        let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: result);
        pluginResult?.setKeepCallbackAs(keepCallback);
        self.commandDelegate!.send(pluginResult,callbackId: command.callbackId);
        
    }
    
}
