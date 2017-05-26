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
    var nodeId: String?
    var nodeState: DisplayPeripheralState?
    var batteryVoltage: Int?
    var packetCount: Int?
    
    func checkIn() {
        nodeState = DisplayPeripheralState.onboard
    }
    
    func checkOut() {
        nodeState = DisplayPeripheralState.checking
    }
}

enum DisplayPeripheralState: String {
    case checking = "01"
    case onboard = "02"
    case error = "05"
}
