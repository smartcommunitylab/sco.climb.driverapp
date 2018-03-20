//
//  ClimbBeaconService.swift
//  CLIMB Driver App
/// Scans for Eddystone and TI beacons compliant with the CLIMB application using Core Bluetooth.
//
//  Created by Amy L. Murphy on 17/01/2018.
//

import Foundation

import CoreBluetooth

///
/// ClimbBeaconService
///
/// Scans for Eddystone compliant beacons using Core Bluetooth. To receive notifications of any
/// sighted beacons, be sure to implement BeaconScannerDelegate and set that on the scanner.
///
public class ClimbBeaconService: NSObject, CBCentralManagerDelegate {
    
    
    /// Beacons that are close to the device.
    /// Keeps getting updated. Beacons are removed periodically after no packets being recieved for 1 minuite
    ///
    public var nearbyChildren = [ClimbNode]()
    
    private var centralManager: CBCentralManager!
    private let beaconOperationsQueue: DispatchQueue = DispatchQueue(label: "com.nearbyservice.queue.beaconscanner")
    private var shouldBeScanning: Bool = false
    
    private var beaconTelemetryCache = [UUID: Data]()
    //  private var beaconURLCache = [UUID: URL]()
    
    //private var timer: DispatchTimer?
    
    enum BeaconType { case tiClimb, esClimb}
    
    // the following two functions are for making this a singleton
    private static var climbBeaconScanner: ClimbBeaconService = {
        let sharedBeaconScanner = ClimbBeaconService();
        return sharedBeaconScanner;
    }()
    
    class func shared() -> ClimbBeaconService {
        return climbBeaconScanner
    }
    
    private override init() {
        super.init()
        
        self.centralManager = CBCentralManager(delegate: self, queue: self.beaconOperationsQueue)
        //self.timer = DispatchTimer(repeatingInterval: 10.0)
        //self.timer?.delegate = self
    }
    
    // ALM: to be called from plugin
    public func climbInitalize () {
        startScanning();
    }
    
    /**
     Start scanning. If Core Bluetooth isn't ready for us just yet, then waits and THEN starts scanning
     */
    public func startScanning() {
        self.beaconOperationsQueue.async { [weak self] in
            self?.startScanningSynchronized()
            //self?.timer?.startTimer()
        }
    }
    
    // ALM: to be called from plugin
    public func climbDeinitialize() {
        stopScanning();
    }
    
    /**
     Stops scanning for beacons
     */
    public func stopScanning() {
        self.beaconOperationsQueue.async { [weak self] in
            self?.centralManager.stopScan()
        }
    }
    
    
    /**
     Starts scanning for beacons
     */
    private func startScanningSynchronized() {
        if self.centralManager.state != .poweredOn {
            //print("CentralManager state is %d, cannot start scan", self.centralManager.state.rawValue)
            self.shouldBeScanning = true
        }
        else {
            //print("Starting to scan")
            let options = [CBCentralManagerScanOptionAllowDuplicatesKey : true]
            self.centralManager.scanForPeripherals(withServices: nil, options: options) // catch all beacons
        }
    }
    
    ///
    /// MARK - Delegate callbacks
    ///
    
    public func centralManagerDidUpdateState(_ central: CBCentralManager) {
        if central.state == .poweredOn && self.shouldBeScanning {
            self.startScanningSynchronized();
        }
    }
    
    ///
    /// Core Bluetooth CBCentralManager callback when we discover a beacon.
    ///
    public func centralManager(_ central: CBCentralManager,
                               didDiscover peripheral: CBPeripheral,
                               advertisementData: [String : Any],
                               rssi RSSI: NSNumber) {
        
        // look at the peripheral name to see if it is a climb child node
        if (peripheral.name == "CLIMBC") {
            //print("got a climb beacon");
            
            
            // get the battery voltage and id out of the packet
            let manufacturerData = advertisementData[CBAdvertisementDataManufacturerDataKey] as! Data;
            let batteryVoltage = batteryFromData(manufacturerData: manufacturerData, beaconType:BeaconType.tiClimb)
            let nodeID = String(format: "%02X", manufacturerData[2])
            
            // Get beacon index from the beacon list, if it exists
            if let tiBeaconIndex = self.nearbyChildren.index(where: {$0.nodeID == nodeID}) {
                // Beacon already discovered. Update battery (and last seen)
                let tiChild = self.nearbyChildren[tiBeaconIndex];
                tiChild.updateNode(batt:batteryVoltage);
                //print("UPDATING TI beacon" + nodeID + " size=" + String(nearbyChildren.count))
                
            }
            else {
                // add to the list of children I've seen
                appendChild(child: ClimbNode(nodeID:nodeID, batteryVoltage_mV:batteryVoltage));
                //print("NEW TI beacon" + peripheral.identifier.uuidString + " size=" + String(nearbyChildren.count));
            }
            
            // done processing the TI beacon
            return;
        }
        
        
        
        guard let serviceData = advertisementData[CBAdvertisementDataServiceDataKey]
            as? [NSObject : AnyObject] else {
                return
        }
        
        
        let frameType = Eddystone.frameTypeForFrame(advertisementFrameList: serviceData)
        switch frameType {
        case .telemetry:
            //print ("got telemetry")
            let telemetryData = Eddystone.telemetryDataForFrame(advertisementFrameList: serviceData)
            
            // Stash away the telemetry data for later use
            beaconTelemetryCache[peripheral.identifier] = telemetryData
            
            // Put the teleletry data in the beacon object (lookup using the eddystone mac id (eddystoneID)
            if let esBeaconIndex = self.nearbyChildren.index(where: {$0.eddystoneID == peripheral.identifier}) {
                //we've seen the child that matches this telemetry data
                let esChild = self.nearbyChildren[esBeaconIndex];
                esChild.updateNode (batt:batteryFromData(manufacturerData: telemetryData!, beaconType:BeaconType.esClimb));
                
            }
            
            break;
        case .uid, .eid:
            
            // get the 16 byte id out of the beacon data
            let beaconServiceData = serviceData[Eddystone.ServiceUUID] as? Data
            let frameBytes = Array(beaconServiceData!) as [UInt8]
            let esBeaconIDarray : [UInt8] = Array(frameBytes[2..<18]);
            
            // figure out if this is a Climb Eddystone Beacon
            let climbEddystoneNamespace:[UInt8] = [0x39, 0x06, 0xbf, 0x23, 0x0e, 0x28, 0x85, 0x33, 0x8f, 0x44];
            var isClimb : Bool = true;
            for i in 0..<climbEddystoneNamespace.count {
                if esBeaconIDarray[i] != climbEddystoneNamespace[i] {
                    isClimb = false;
                    continue;
                }
            }
            if (isClimb) {
                //print ("********************* identified the beacon as climb es beacon: " + hexBeaconID(beaconID: esBeaconIDarray))
                if let esBeaconIndex = self.nearbyChildren.index(where: {$0.nodeID == hexBeaconID(beaconID: esBeaconIDarray)}) {
                    // eddystone Beacon already discovered. Update last seen
                    let esChild = self.nearbyChildren[esBeaconIndex];
                    esChild.updateLastSeen();
                    //print("UPDATING ES beacon " + esChild.nodeID + " size=" + String(nearbyChildren.count));
                }
                else {
                    // add to the list of children I've seen
                    let esChild = ClimbNode(eddystoneID:peripheral.identifier, esNodeID:esBeaconIDarray);
                    appendChild(child: esChild);
                    //print("NEW ES beacon " + esChild.nodeID + " size=" + String(nearbyChildren.count));
                    
                    
                    // see if we have telemetry data in the cache for the new child
                    let telemetryData = self.beaconTelemetryCache[peripheral.identifier]
                    if telemetryData != nil {
                        esChild.updateNode (batt:batteryFromData(manufacturerData: telemetryData!, beaconType:BeaconType.esClimb));
                    }
                }
            } else {
                // not a climb beacon
                //print ("--------------------  NOT CLIMB BEACON" + hexBeaconID(beaconID: esBeaconIDarray))
            }
            
            
            
            
        default:
            //not a climb node
            break;
        }
    }
    
    
    public func getChildrenDictArray () -> Array<Dictionary<String,AnyObject>> {
        // make an array of the children nodes to pass up to the application
        var networkStateDict = Array<Dictionary<String, AnyObject>>.init();
        for child in nearbyChildren {
            // for each child, get a dictionary object analogous to the JSON describing the node
            let childAsDict = child.toDictionary();
            //print("exporting child "+childAsDict.description)
            // add the child to an array to send back
            networkStateDict.append(childAsDict);
        }
        return networkStateDict
    }
    
    private func batteryFromData(manufacturerData:Data, beaconType:BeaconType)->Int{
        var i:Int;
        var j:Int;
        switch beaconType {
        case BeaconType.esClimb:
            i=2; j=3;
            break;
        case BeaconType.tiClimb:
            i=4; j=5;
            break;
        }
        
        // Constructing 2-byte data as big endian (as done in the Java code)
        return Int(UInt16(manufacturerData[i]) << 8 + UInt16(manufacturerData[j]))
    }
    private static func sync(obj: Any, closure: () -> Void) {
        objc_sync_enter(obj)
        closure()
        objc_sync_exit(obj)
    }
    
    private func appendChild (child: ClimbNode) {
        ClimbBeaconService.sync(obj: self.nearbyChildren) {
            self.nearbyChildren.append(child);
        }
    }
    
    // convert a UInt8 array to a strng
    private func hexBeaconID(beaconID: [UInt8]) -> String {
        var retval = ""
        for byte in beaconID {
            var s = String(byte, radix:16, uppercase: false)
            if s.count == 1 {
                s = "0" + s
            }
            retval += s
        }
        return retval
    }
}


/*
extension ClimbBeaconService: DispatchTimerProtocol {
    func timerCalled(dispatchTimer: DispatchTimer?) {
        ClimbBeaconService.sync(obj: self.nearbyChildren) {
            // Loop through the beacon list and find which beacon has not been seen in the last 15 seconds
            // Mutation of array in-place
            self.nearbyChildren = self.nearbyChildren.filter({ (beacon) -> Bool in
                if Date().timeIntervalSince1970 - beacon.lastSeen.timeIntervalSince1970 > 15  {
                    //self.delegate?.didLoseBeacon(beaconScanner: self, beacon: beacon)
                    return false
                }
                return true
            })
        }
    }
 
}

*/

