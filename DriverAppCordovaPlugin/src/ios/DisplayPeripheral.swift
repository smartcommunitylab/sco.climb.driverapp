//
//  DisplayPeripheral.swift
//  BLEScanner
//


import Foundation
import CoreBluetooth

class DisplayPeripheral{
    var peripheral: CBPeripheral?
    var lastRSSI: Int?
    var isConnectable: Bool?
    var lastSeen: Date?
    
    var manufacturerData: String?
    var manufacturerId: String?
    var nodeID: String?
    var nodeState: DisplayPeripheralState?
    var batteryVoltage: Int?
    var packetCount: Int?
    
    func checkIn() {
        nodeState = DisplayPeripheralState.onboard
    }
    
    func checkOut() {
        nodeState = DisplayPeripheralState.checking
    }
    
     // ALM: This mapping of values is taken from the android library
    func getBatteryLevel() -> Int {
        var batteryLevel = 0;
        if (batteryVoltage == 0){
            batteryLevel = 0;
        }else if (batteryVoltage! < 2000 && batteryVoltage! != 0){
            batteryLevel = 1;
        } else if (batteryVoltage! >= 2000 && batteryVoltage! < 2500) {
            batteryLevel = 2
        } else {
            batteryLevel = 3;
        }
        return batteryLevel;
    }
}

enum DisplayPeripheralState: String {
    case checking = "01"
    case onboard = "02"
    case error = "05"
}
