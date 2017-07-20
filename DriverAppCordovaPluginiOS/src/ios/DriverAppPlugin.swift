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
    
    @objc(initialize:)
    open func initialize(command: CDVInvokedUrlCommand) -> Bool {
        let message = "Initialized";
        
        self.logger = ClimbLogger.shared
        peripherals = [DisplayPeripheral]()
        maintenanceModeEnabled = false
        logger.startDataLog()//enable data logging
        
        //enable BLE and scanning
        self.centralManager = CBCentralManager(delegate: self, queue: nil)
        self.peripheralManager = CBPeripheralManager(delegate: self, queue: nil)
        startScanning()
        
        //cordova callbacks
        let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: message);
        pluginResult?.setKeepCallbackAs(true);
        commandDelegate.send(pluginResult, callbackId: command.callbackId);
        
        return true
    }
    
    @objc(deinitialize:)
    open func deinitialize(command: CDVInvokedUrlCommand) -> Bool {
        centralManager = nil
        peripheralManager = nil
        logger.stopDataLog()
        stopScanning()
        return true
    }
    
    @objc(startListener:)
    open func startListener(command: CDVInvokedUrlCommand) -> Bool {
        // Stub
        return true
    }
    
    @objc(stopListener:)
    open func stopListener(command: CDVInvokedUrlCommand) -> Bool {
        // Stub
        return true
    }
    
    @objc(getMasters:)
    open func getMasters(command: CDVInvokedUrlCommand) -> [String] {
        // Stub
        return [String]()
    }
    
    @objc(connectMaster:)
    open func connectMaster(master: String) -> Bool {
        // Stub
        return true
    }
    
    open func disconnectMaster() -> Bool {
        // Stub
        return true
    }
    
    @objc(setNodeList:)
    open func setNodeList(children: [String]) -> Bool {
        // Stub
        return true
    }
    
    @objc(getNetworkState:)
    open func getNetworkState(command: CDVInvokedUrlCommand) -> [NodeState] {
        let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK);
        pluginResult?.setKeepCallbackAs(true);
        commandDelegate.send(pluginResult, callbackId: command.callbackId);
        
        return peripherals.map { toNodeState(peripheral: $0)! }
    }
    
    open func getNodeState(child: String) -> NodeState? {
        return toNodeState(peripheral: getPeripheralBy(nodeId: child))
    }
    
    @objc(checkinChild:)
    open func checkinChild(child: String) -> Bool {
        return toggleChildStatus(child: child, isCheckin: true)
    }
    
    @objc(checkoutChild:)
    open func checkoutChild(child: String) -> Bool {
        return toggleChildStatus(child: child, isCheckin: false)
    }
    
    @objc(checkinChildren:)
    open func checkinChildren(children: [String]) -> Bool {
        return children.map{ toggleChildStatus(child: $0, isCheckin: true) }.contains(false) ? false : true
    }
    
    @objc(checkoutChildren:)
    open func checkoutChildren(children: [String]) -> Bool {
        return children.map{ toggleChildStatus(child: $0, isCheckin: false) }.contains(false) ? false : true
    }
    
    @objc(enableMaintenanceProcedure:)
    open func enableMaintenanceProcedure(wakeupTime: Int) -> Bool {
        let wakeupData = buildAdvertisementData(wakeupTime: wakeupTime)
        let advertisementData = [CBAdvertisementDataLocalNameKey : wakeupData]
        
        logger.maintenanceModeEnabled(advertisementData: advertisementData)
        peripheralManager?.startAdvertising(advertisementData)
        
        maintenanceModeEnabled = true
        return true
    }
    
    @objc(disableMaintenanceProcedure:)
    open func disableMaintenanceProcedure(command: CDVInvokedUrlCommand) -> Bool {
        peripheralManager?.stopAdvertising()
        logger.maintenanceModeDisabled()
        
        maintenanceModeEnabled = false
        return true
    }
    
    @objc(getLogFiles:)
    open func getLogFiles(command: CDVInvokedUrlCommand) -> [String] {
        return logger.getAllLogFilePaths()
    }
    
    open func test(name: String) -> Bool {
        // Stub
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
    
    internal func centralManagerDidUpdateState(_ central: CBCentralManager) {
        
        switch (central.state) {
        case .poweredOn:
            logger.logExtraInfo(message: "Bluetooth CentralManager is now on")
            break
        case .poweredOff:
            logger.logExtraInfo(message: "Bluetooth Bluetooth CentralManager is now off!")
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
    
    internal func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String : Any], rssi RSSI: NSNumber){
        
        // Only care about SensorTag, do nothing when other bluetooth devices are discovered
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
            displayPeripheral.nodeId = peripheral.identifier.uuidString
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
        peripheral.nodeId = String(format: "%02X", nodeID)
        peripheral.nodeState = DisplayPeripheralState(rawValue: String(format: "%02X", state))
        peripheral.batteryVoltage = voltageInDecimals
        peripheral.packetCount = packetInDecimals
    }
    
    fileprivate func getPeripheralBy(nodeId: String) -> DisplayPeripheral? {
        return peripherals.first { $0.nodeId == nodeId }
    }
    
    fileprivate func toNodeState(peripheral: DisplayPeripheral?) -> NodeState? {
        guard let peripheral = peripheral else {
            return nil
        }
        
        let nodeState: NodeState = NodeState()
        nodeState.nodeId = peripheral.nodeId
        nodeState.state = Int(peripheral.nodeState!.rawValue)
        nodeState.lastSteen = peripheral.lastSeen!.currentTimeMillis
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
}
