//
//  ClimbServiceImpl.swift
//  BLEScanner
//


import Foundation
import UIKit
import CoreBluetooth

//@objc(DriverAppPlugin) class DriverAppPlugin: CDVPlugin, ClimbService {
//open class ClimbServiceImpl: ClimbService {
@objc(DriverAppPlugin) class DriverAppPlugin: CDVPlugin{
    
    fileprivate var logger: ClimbLogger
    fileprivate var centralManagerDelegateVC: CBCentralManagerDelegate
    fileprivate var peripheralManagerDelegateVC: CBPeripheralManagerDelegate
    
    var centralManager: CBCentralManager?
    var peripheralManager: CBPeripheralManager?
    
    var peripherals: [DisplayPeripheral]
    var maintenanceModeEnabled: Bool
    var isScanning: Bool {
        return centralManager?.isScanning ?? false
    }
    
    init(centralManagerDelegateVC: CBCentralManagerDelegate, peripheralManagerDelegateVC: CBPeripheralManagerDelegate) {
        self.logger = ClimbLogger.shared
        self.centralManagerDelegateVC = centralManagerDelegateVC
        self.peripheralManagerDelegateVC = peripheralManagerDelegateVC
        
        peripherals = [DisplayPeripheral]()
        maintenanceModeEnabled = false
    }
    
    @objc(initialize:)
    open func initialize(command: CDVInvokedUrlCommand) -> Bool {
        logger.startDataLog()
        self.centralManager = CBCentralManager(delegate: centralManagerDelegateVC, queue: nil)
        self.peripheralManager = CBPeripheralManager(delegate: peripheralManagerDelegateVC, queue: nil)
        //cordova stuff
        let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK);
        pluginResult?.setKeepCallbackAs(true);
        commandDelegate.send(pluginResult, callbackId: command.callbackId);

        return true
    }
    
    @objc(deinitialize:)
    open func deinitialize(command: CDVInvokedUrlCommand) -> Bool {
        centralManager = nil
        peripheralManager = nil
        logger.stopDataLog()
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
    
    //@objc(getNetworkState:)
    open func getNetworkState(command: CDVInvokedUrlCommand) -> [NodeState] {
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
    
    //@objc(enableMaintenanceProcedure:)
    open func enableMaintenanceProcedure(wakeupTime: Int) -> ErrorCode? {
        let wakeupData = buildAdvertisementData(wakeupTime: wakeupTime)
        let advertisementData = [CBAdvertisementDataLocalNameKey : wakeupData]
        
        logger.maintenanceModeEnabled(advertisementData: advertisementData)
        peripheralManager?.startAdvertising(advertisementData)
        
        maintenanceModeEnabled = true
        return nil
    }
    
    //@objc(disableMaintenanceProcedure:)
    open func disableMaintenanceProcedure(command: CDVInvokedUrlCommand) -> ErrorCode? {
        peripheralManager?.stopAdvertising()
        logger.maintenanceModeDisabled()
        
        maintenanceModeEnabled = false
        return nil
    }
    
    @objc(getLogFiles:)
    open func getLogFiles(command: CDVInvokedUrlCommand) -> [String] {
        return logger.getAllLogFilePaths()
    }
    
    open func test(name: String) -> Bool {
        // Stub
        return true
    }
//}
//
//// MARK: - CoreBluetooth API calls and state management, used by UI
//extension ClimbServiceImpl {
    
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
//}

// MARK: - Utilities
//extension ClimbServiceImpl {
    
    fileprivate func getPeripheralBy(nodeId: String) -> DisplayPeripheral? {
        return peripherals.first { $0.nodeId == nodeId }
    }
    
    fileprivate func toNodeState(peripheral: DisplayPeripheral?) -> NodeState? {
        guard let peripheral = peripheral else {
            return nil
        }
        
        var nodeState: NodeState = NodeState()
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
//}
