import Foundation
import UIKit
import CoreBluetooth

@objc(DriverAppPlugin)
class DriverAppPlugin: CDVPlugin, CBCentralManagerDelegate, CBPeripheralManagerDelegate {
    
    fileprivate var logger: ClimbLogger!
    
    var centralManager: CBCentralManager?
    var peripheralManager: CBPeripheralManager?
    
    var peripherals: [DisplayPeripheral]!
    var maintenanceModeEnabled: Bool!
    var isScanning: Bool {
        return centralManager?.isScanning ?? false
    }
    
    var pluginResult = CDVPluginResult( status: CDVCommandStatus_ERROR)
    
    //--- CLIMB API -----------------------------------------------

    @objc(initialize:)
    open func initialize(command: CDVInvokedUrlCommand) -> Bool {
        self.logger = ClimbLogger.shared
        peripherals = [DisplayPeripheral]()
        maintenanceModeEnabled = false
        logger.startDataLog()//enable data logging
        
        //enable BLE
        self.centralManager = CBCentralManager(delegate: self, queue: nil)
        self.peripheralManager = CBPeripheralManager(delegate: self, queue: nil)
        //cordova callbacks
        sendSuccess(command: command, result: "Initialized", keepCallback: true);
        return true
    }
    
    @objc(deinitialize:)
    open func deinitialize(command: CDVInvokedUrlCommand) -> Bool {
        centralManager = nil
        peripheralManager = nil
        logger.stopDataLog()
        stopScanning()
        
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
        
        // make an array of the children nodes to pass up to the application
        var networkStateDict = Array<Dictionary<String, AnyObject>>.init();
        for p in peripherals {
            // for each child, make a dictionary object analogous to the JSON describing the node
                        // for each child, make a dictionary object analogous to the JSON describing the node
            let childAsDict: [String: AnyObject] = [
                "nodeID": p.nodeID as AnyObject,
                "state": (String)(describing: p.nodeState) as AnyObject,
                "lastSeen": p.lastSeen!.currentTimeMillis as AnyObject,
                // ALM: lastStateChange is no longer used, so we are returning it for backward compatibility
                "lastStateChange": p.lastSeen!.currentTimeMillis as AnyObject,
                "batteryVoltage_mV": p.batteryVoltage as AnyObject,
                "batteryLevel" : p.getBatteryLevel() as AnyObject,
            ];
            // add the child to the array sent back
            networkStateDict.append(childAsDict);
            
        }
        //send the array of children nodes
        sendSuccessWithArray(command: command, result: networkStateDict, keepCallback: true);


        return "\(true)"
        
        //return peripherals.map { toNodeState(peripheral: $0)! }.toJson()
    }
    
    open func getNodeState(child: String) -> String {
        return toNodeState(peripheral: getPeripheralBy(nodeId: child))?.toJSON() ?? ""
    }
    
    let child = String()
    @objc(checkinChild:)
    open func checkinChild(command: CDVInvokedUrlCommand) -> String {
        
        let procedureStarted = "\(true)"
        sendSuccess(command: command, result: procedureStarted, keepCallback: true);
        
        //return "\(toggleChildStatus(child: child, isCheckin: true))"
        //return procedureStarted
	return "\(true)"
    }
    
    @objc(checkoutChild:)
    open func checkoutChild(command: CDVInvokedUrlCommand) -> String {
        let procedureStarted = "\(true)"
        sendSuccess(command: command, result: procedureStarted, keepCallback: true);
        
        //return "\(toggleChildStatus(child: child, isCheckin: false))"
        //return procedureStarted
	return "\(true)"
    }
    
    let children = [String]()
    @objc(checkinChildren:)
    open func checkinChildren(command: CDVInvokedUrlCommand) -> String {
        let procedureStarted = "\(true)"
        sendSuccess(command: command, result: procedureStarted, keepCallback: true);
        
        //return "\(children.map{ toggleChildStatus(child: $0, isCheckin: true) }.contains(false) ? false : true)"
        //return procedureStarted
	return "\(true)"
    }
    
    @objc(checkoutChildren:)
    open func checkoutChildren(command: CDVInvokedUrlCommand) -> String {
        let procedureStarted = "\(true)"
        sendSuccess(command: command, result: procedureStarted, keepCallback: true);
        
        //return "\(children.map{ toggleChildStatus(child: $0, isCheckin: false) }.contains(false) ? false : true)"
       // return procedureStarted
	return "\(true)"

    }
    
    @objc(command: enableMaintenanceProcedure:)
    open func enableMaintenanceProcedure(command: CDVInvokedUrlCommand, wakeupTime: Int) -> String {
        let wakeupData = buildAdvertisementData(wakeupTime: wakeupTime)
        let advertisementData = [CBAdvertisementDataLocalNameKey : wakeupData]
        
        logger.maintenanceModeEnabled(advertisementData: advertisementData)
        peripheralManager?.startAdvertising(advertisementData)
        maintenanceModeEnabled = true
        sendSuccessWithBoolean(command: command, result: true, keepCallback: true);
        return "\(true)"
    }
    
    @objc(disableMaintenanceProcedure:)
    open func disableMaintenanceProcedure(command: CDVInvokedUrlCommand) -> String {
        peripheralManager?.stopAdvertising()
        logger.maintenanceModeDisabled()
        
        maintenanceModeEnabled = false
        sendSuccessWithBoolean(command: command, result: true, keepCallback: true);
        return "\(true)"
    }
    
    @objc(getLogFiles:)
    open func getLogFiles(command: CDVInvokedUrlCommand) -> [String] {
        
        let logFilePathsArray  = logger.getAllLogFilePaths();
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
    
    func startScanning() {
        logger.logExtraInfo(message: "Start scanning...")
        centralManager?.scanForPeripherals(withServices: nil, options: [CBCentralManagerScanOptionAllowDuplicatesKey: true])
    }
    
    func stopScanning() {
        centralManager?.stopScan()
        logger.logExtraInfo(message: "Scanning stopped")
    }
    
    func reset() {
        if isScanning {
            stopScanning()
        }
        peripherals.removeAll(keepingCapacity: false)
    }
    
    func insertTag() {
        logger.logExtraInfo(message: "Manually inserted tag")
    }
    
    //Receive the update of central manager’s state and scan for peripherals
    internal func centralManagerDidUpdateState(_ central: CBCentralManager) {
        switch (central.state) {
        case .poweredOn:
            logger.logExtraInfo(message: "Bluetooth CentralManager is now on")
            startScanning()
            break
        case .poweredOff:
            logger.logExtraInfo(message: "Bluetooth CentralManager is now off!")
            break
        default:
            logger.logExtraInfo(message: "Unsupported CentralManager state: \(central.state)")
        }
    }
    
    internal func peripheralManagerDidUpdateState(_ peripheral: CBPeripheralManager) {
        switch (peripheral.state) {
        case .poweredOn:
            logger.logExtraInfo(message: "Bluetooth PeripheralManager is now on")
            break
        case .poweredOff:
            logger.logExtraInfo(message: "Bluetooth PeripheralManager is now off!")
            break
        default:
            logger.logExtraInfo(message: "Unsupported Bluetooth PeripheralManager state: \(peripheral.state)")
        }
    }
    
    //receive the results of scan
    internal func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String : Any], rssi RSSI: NSNumber){
        
        // Only care about SensorTag, do nothing when other bluetooth devices are discovered
        //“guard” statement makes early exits possible
        guard peripheral.name == "CLIMBC" else {
            return
        }
        
        var displayPeripheral: DisplayPeripheral
        
        // Check if the current device was already discovered
        let peripheralToUpdateIndex = peripherals.index{ $0.peripheral!.identifier == peripheral.identifier }
        
        if let peripheralToUpdateIndex = peripheralToUpdateIndex {
            displayPeripheral = peripherals[peripheralToUpdateIndex]
        } else {
            displayPeripheral = DisplayPeripheral()
            peripherals.append(displayPeripheral)
            displayPeripheral.peripheral = peripheral
            displayPeripheral.isConnectable = advertisementData[CBAdvertisementDataIsConnectable] as? Bool
        }
        
        displayPeripheral.lastRSSI = Int(RSSI)
        displayPeripheral.lastSeen = Date()
        
        if let manufacturerData = advertisementData[CBAdvertisementDataManufacturerDataKey] as? Data {
            updateAdvertisementData(peripheral: displayPeripheral, advertisementData: manufacturerData)
        } else {
            displayPeripheral.nodeID = peripheral.identifier.uuidString
            displayPeripheral.nodeState = DisplayPeripheralState.error
        }
        
        logger.deviceDiscovered(id: peripheral.identifier.uuidString,
                                name: peripheral.name ?? "No Device Name",
                                rssi: displayPeripheral.lastRSSI!,
                                manufacturerString: displayPeripheral.manufacturerData ?? "")
        
    }
    
    internal func peripheralManagerDidStartAdvertising(_ peripheral: CBPeripheralManager, error: Error?) {
        logger.logExtraInfo(message: "Started advertising")
    }
    
    private func updateAdvertisementData(peripheral: DisplayPeripheral, advertisementData: Data) {
        
        guard advertisementData.count >= 7 else {
            return
        }
        
        // TI manufacturer ID -> 0D00
        let manufacturerID = UInt16(advertisementData[0]) + UInt16(advertisementData[1]) << 8 // Constructing 2-byte data as little endian (as TI's manufacturer ID is 0x000D)
        // CLIMB CHILD node ID -> FE
        let nodeID = advertisementData[2]
        // CLIMB CHILD node state -> 05
        let state = advertisementData[3]
        // CLIMB CHILD node battery voltage
        let batteryVoltage = UInt16(advertisementData[4]) << 8 + UInt16(advertisementData[5]) // Constructing 2-byte data as big endian (as done in the Java code)
        let voltageInDecimals = Int(batteryVoltage)
        // Becon packet counter
        let packetCounter = advertisementData[6] //resets after 255
        let packetInDecimals = Int(packetCounter)
        
        peripheral.manufacturerData = Data(advertisementData[2..<advertisementData.count]).hexEncodedString()
        peripheral.manufacturerId = String(format: "%04X", manufacturerID)
        peripheral.nodeID = String(format: "%02X", nodeID)
        peripheral.nodeState = DisplayPeripheralState(rawValue: String(format: "%02X", state))
        peripheral.batteryVoltage = voltageInDecimals
        peripheral.packetCount = packetInDecimals
    }
    
    fileprivate func getPeripheralBy(nodeId: String) -> DisplayPeripheral? {
        return peripherals.first { $0.nodeID == nodeId }
    }
    
    fileprivate func toNodeState(peripheral: DisplayPeripheral?) -> NodeState? {
        guard let peripheral = peripheral else {
            return nil
        }
        
        let nodeState: NodeState = NodeState()
        nodeState.nodeID = peripheral.nodeID
        nodeState.state = Int(peripheral.nodeState!.rawValue)
        nodeState.lastSeen = peripheral.lastSeen!.currentTimeMillis
        nodeState.batteryVoltage_mV = peripheral.batteryVoltage
        
        return nodeState
    }
    

    
    fileprivate func toggleChildStatus(child: String, isCheckin: Bool) -> Bool {
        let peripheral = getPeripheralBy(nodeId: child)
        
        if let peripheral = peripheral {
            isCheckin ? peripheral.checkIn() : peripheral.checkOut()
            return true
        } else {
            return false
        }
    }
    
    fileprivate func buildAdvertisementData(wakeupTime: Int) -> Data {
        var data = Data(bytes: [0xff, 0x02])
        data.append(Data(bytes: toByteArray(wakeupTime).reversed()[2..<8]))
        return data
    }
    
    //--- Cordova Callbacks -----------------------------------------------
    
    func sendSuccess(command: CDVInvokedUrlCommand, result: String, keepCallback: Bool) {
        print("sendSuccess with a string:"+result);
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
