//
//  ClimbNode.swift
//  EddystoneScanner
//
//  Created by Amy L. Murphy on 15/01/2018.
//

import Foundation
import CoreBluetooth

public class ClimbNode: NSObject {
    public var nodeID: String
    var eddystoneID : UUID? // effectively the MAC address of an Eddystone beacon, if this is one
    var batteryVoltage_mV: Int
    var lastSeen: Date
    
    
    // constructor for an EddyStone beacon (don't know the battery level yet)
    init(eddystoneID: UUID, esNodeID: [UInt8]) {
        self.eddystoneID = eddystoneID;
        self.batteryVoltage_mV = 0;
        lastSeen = Date(); // last seen is NOW
        
        self.nodeID = "";
        for byte in esNodeID {
            var s = String(byte, radix:16, uppercase: false)
            if s.count == 1 {
                s = "0" + s
            }
            nodeID += s
        }
        
    }
    
    // constructor for a TI beacon
    init(nodeID:String, batteryVoltage_mV:Int) {
        self.nodeID = nodeID;
        self.batteryVoltage_mV = batteryVoltage_mV
        lastSeen = Date(); // assume last seen is NOW
        // note that eddystoneID remains nil
    }
    
    // when an EddyStone Telemetry packet arrives, or a new TI beacon for a node we've already seen
    public func updateNode(batt: Int) {
        self.batteryVoltage_mV = batt;
        updateLastSeen();
    }
    
    // when an EddyStone beacon arrives that we've already seen, simply update the last seen
    public func updateLastSeen() {
        lastSeen = Date(); // assume last seen is NOW
    }
    
    public func toDictionary() -> [String:AnyObject]{
        let childAsDict: [String: AnyObject] = [
            "nodeID": self.nodeID as AnyObject,
            "state": "0" as AnyObject,
            "lastSeen": self.lastSeen.currentTimeMillis as AnyObject,
            // ALM: lastStateChange is no longer used, so we are returning it for backward compatibility
            "lastStateChange": lastSeen.currentTimeMillis as AnyObject,
            "batteryVoltage_mV": self.batteryVoltage_mV as AnyObject,
            "batteryLevel" : getBatteryLevel() as AnyObject,
            ];
        //print("exporting Child" + " [nodeID:" + self.nodeID + ", lastSeen:" + String(self.lastSeen.currentTimeMillis)+", batteryLevel: " + String(getBatteryLevel()) + "]" );
        return childAsDict;
    }
    
    // ALM: This mapping of values is taken from the android library
    private func getBatteryLevel() -> Int {
        var batteryLevel = 0;
        if (batteryVoltage_mV == 0){
            batteryLevel = 0;
        }else if (batteryVoltage_mV < 2000){
            batteryLevel = 1;
        } else if (batteryVoltage_mV >= 2000 && batteryVoltage_mV < 2500) {
            batteryLevel = 2
        } else {
            batteryLevel = 3;
        }
        return batteryLevel;
        
    }
    
    
}





