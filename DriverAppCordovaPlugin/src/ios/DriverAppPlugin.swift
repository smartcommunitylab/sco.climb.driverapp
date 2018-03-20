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
        ClimbBeaconService.shared().climbInitalize();
        self.logger = ClimbLogger.shared;
        logger.startDataLog();
        //cordova callbacks
        sendSuccess(command: command, result: "Initialized", keepCallback: true);
        return true
    }
    
    @objc(deinitialize:)
    open func deinitialize(command: CDVInvokedUrlCommand) -> Bool {
        ClimbBeaconService.shared().climbDeinitialize();
        
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
    
    @objc(getMasters:)
    open func getMasters(command: CDVInvokedUrlCommand) -> String {
        //let masters = "[]"
        sendSuccessWithArray(command: command, result: [], keepCallback: true);
        return "[]" // empty json array since there are no masters now
    }
    
    let master = String()
    @objc(connectMaster:)
    //open func connectMaster(command: CDVInvokedUrlCommand, master: String) -> String {
    open func connectMaster(command: CDVInvokedUrlCommand) -> String {
        let procedureStarted = "\(true)"
        sendSuccess(command: command, result: procedureStarted, keepCallback: true);
        //return "\(true)"
        
        return procedureStarted
    }
    
    open func disconnectMaster() -> String {
        return "\(true)"
    }
    
    @objc(setNodeList:)
    open func setNodeList(command: CDVInvokedUrlCommand) -> String {
        sendSuccessWithBoolean(command: command, result: true, keepCallback: true);
        return "\(true)"
    }
    
    @objc(getNetworkState:)
    open func getNetworkState(command: CDVInvokedUrlCommand) -> String {
        let networkAsDict = ClimbBeaconService.shared().getChildrenDictArray();
        
        //send the array of children nodes
        sendSuccessWithArray(command: command, result: networkAsDict, keepCallback: true);
        
        
        return "\(true)"
        
    }
    
    @objc(checkinChild:)
    open func checkinChild(command: CDVInvokedUrlCommand) -> String {
        
        let procedureStarted = "\(true)"
        sendSuccess(command: command, result: procedureStarted, keepCallback: true);
        
        return "\(true)"
    }
    
    @objc(checkoutChild:)
    open func checkoutChild(command: CDVInvokedUrlCommand) -> String {
        let procedureStarted = "\(true)"
        sendSuccess(command: command, result: procedureStarted, keepCallback: true);
        
        return "\(true)"
    }
    
    let children = [String]()
    @objc(checkinChildren:)
    open func checkinChildren(command: CDVInvokedUrlCommand) -> String {
        let procedureStarted = "\(true)"
        sendSuccess(command: command, result: procedureStarted, keepCallback: true);
        
        return "\(true)"
    }
    
    @objc(checkoutChildren:)
    open func checkoutChildren(command: CDVInvokedUrlCommand) -> String {
        let procedureStarted = "\(true)"
        sendSuccess(command: command, result: procedureStarted, keepCallback: true);
        
        return "\(true)"
        
    }
    
    @objc(command: enableMaintenanceProcedure:)
    open func enableMaintenanceProcedure(command: CDVInvokedUrlCommand, wakeupTime: Int) -> String {
        /*        let wakeupData = buildAdvertisementData(wakeupTime: wakeupTime)
         let advertisementData = [CBAdvertisementDataLocalNameKey : wakeupData]
         
         logger.maintenanceModeEnabled(advertisementData: advertisementData)
         peripheralManager?.startAdvertising(advertisementData)
         maintenanceModeEnabled = true
         */
        sendSuccessWithBoolean(command: command, result: true, keepCallback: true);
        return "\(true)"
    }
    
    @objc(disableMaintenanceProcedure:)
    open func disableMaintenanceProcedure(command: CDVInvokedUrlCommand) -> String {
        /*
         peripheralManager?.stopAdvertising()
         logger.maintenanceModeDisabled()
         
         maintenanceModeEnabled = false
         */
        sendSuccessWithBoolean(command: command, result: true, keepCallback: true);
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
