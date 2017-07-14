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
        self.centralManager = CBCentralManager(delegate: nil, queue: nil)
        self.peripheralManager = CBPeripheralManager(delegate: nil, queue: nil)
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
//}
