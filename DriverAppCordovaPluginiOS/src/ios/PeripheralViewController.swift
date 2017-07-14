//
//  PeripheralTableViewController.swift
//  BLEScanner
//
//  Created by Rajeev Piyare on 30/01/2017.
//  Copyright © 2017 RKP. All rights reserved.
//

import CoreBluetooth
import UIKit
import DatePickerDialog

class PeripheralViewController: UIViewController {
	
	@IBOutlet weak var statusLabel: UILabel!
	@IBOutlet weak var bluetoothIcon: UIImageView!
	@IBOutlet weak var scanningButton: ScanButton!
    @IBOutlet weak var tableView: UITableView!
    @IBOutlet weak var resetButton: ScanButton!
    @IBOutlet weak var checkInButton: ScanButton!
    @IBOutlet weak var checkOutButton: ScanButton!
    @IBOutlet weak var maintenanceButton: MaintenanceButton!
    @IBOutlet weak var tagButton: ScanButton!
    
    var logger: ClimbLogger!
    var climbService: DriverAppPlugin!
    
    var selectedPeripheral: CBPeripheral?
    
    let sensorTagName = "CLIMBC"
    let standardMessage = "Scanning BLE Devices..."
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        logger = ClimbLogger.shared
        climbService = DriverAppPlugin()
    
        //let _ = climbService.initialize()
        
        maintenanceButton.buttonColorScheme(isActive: false)
    }
    
    deinit {
        //let _ = climbService.deinitialize()
    }
	
    @IBAction func scanningButtonPressed(_ sender: ScanButton) {
        if !climbService.isScanning {
            updateUiForScanningStarted()
            climbService.startScanning()
        } else {
            climbService.stopScanning()
            updateUiForScanningStopped()
        }
    }

    @IBAction func reset(_ sender: ScanButton) {
        reset()
    }
    
    @IBAction func insertTag(_ sender: ScanButton) {
        climbService.insertTag()
    }
    
    @IBAction func toggleMaintenance(_ sender: MaintenanceButton) {
        reset()
        if climbService.maintenanceModeEnabled {
            updateUiForMaintenanceModeDisabled()
        } else {
            updateUiForMaintenanceModeEnabled()
        }
    }
    
    @IBAction func checkInAll(_ sender: ScanButton) {
        let _ = climbService.checkinChildren(children: climbService.peripherals.map{ $0.nodeId! })
        tableView.reloadData()
    }
    
    @IBAction func checkOutAll(_ sender: Any) {
        let _ = climbService.checkoutChildren(children: climbService.peripherals.map{ $0.nodeId! })
        tableView.reloadData()
    }
    
    private func reset() {
        climbService.reset()
        tableView.reloadData()
        statusLabel.text = standardMessage
        scanningButton.isHidden = false
    }

    private func updateUiForScanningStarted() {
        statusLabel.text = standardMessage
        bluetoothIcon.pulseAnimation()
        bluetoothIcon.isHidden = false
        scanningButton.buttonColorScheme(isActive: true)
    }
    
    private func updateUiForScanningStopped() {
        statusLabel.text = "\(climbService.peripherals.count) device\(climbService.peripherals.count > 1 ? "s" : "") found"
        bluetoothIcon.layer.removeAllAnimations()
        bluetoothIcon.isHidden = true
        scanningButton.buttonColorScheme(isActive: false)
    }
	
    private func updateUiForMaintenanceModeEnabled() {
        DatePickerDialog().show(title: "Wake-up time", doneButtonTitle: "Done", cancelButtonTitle: "Cancel", datePickerMode: .dateAndTime) { wakeupTime in
            
            guard wakeupTime != nil, wakeupTime?.compare(Date()) == .orderedDescending else {
                self.logger.logExtraInfo(message: "Date is nil or in the past")
                return
            }
            
            let _ = self.climbService.enableMaintenanceProcedure(wakeupTime: wakeupTime!.currentTimeMillis)
            
            self.checkInButton.isEnabled = false
            self.checkOutButton.isEnabled = false
            self.scanningButton.isEnabled = false
            self.tagButton.isEnabled = false
            self.resetButton.isEnabled = false
            self.maintenanceButton.buttonColorScheme(isActive: true)
            self.statusLabel.text = "Advertising..."
            self.bluetoothIcon.pulseAnimation()
            self.bluetoothIcon.isHidden = false
        }
    }
    
    private func updateUiForMaintenanceModeDisabled() {
        maintenanceButton.buttonColorScheme(isActive: false)
        checkInButton.isEnabled = true
        checkOutButton.isEnabled = true
        scanningButton.isEnabled = true
        tagButton.isEnabled = true
        resetButton.isEnabled = true
        statusLabel.text = standardMessage
        bluetoothIcon.layer.removeAllAnimations()
        bluetoothIcon.isHidden = true
        bluetoothIcon.isHidden = false
    }

}

extension PeripheralViewController: CBCentralManagerDelegate {
	
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        
        switch (central.state) {
        case .poweredOn:
            scanningButton.isEnabled = true
            logger.logExtraInfo(message: "Bluetooth CentralManager is now on")
            break
        case .poweredOff:
            scanningButton.isEnabled = false
            presentAlertController(title: "Bluetooth is off!", message: "Enable Bluetooth from Settings to allow scanning for devices")
            logger.logExtraInfo(message: "Bluetooth Bluetooth CentralManager is now off!")
            break
        default:
            logger.logExtraInfo(message: "Unsupported CentralManager state: \(central.state)")
        }
	}
	
	func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String : Any], rssi RSSI: NSNumber){
        
        // Only care about SensorTag, do nothing when other bluetooth devices are discovered
        guard peripheral.name == sensorTagName else {
            return
        }
        
        var displayPeripheral: DisplayPeripheral
        
        // Check if the current device was already discovered
        let peripheralToUpdateIndex = climbService.peripherals.index{ $0.peripheral!.identifier == peripheral.identifier }
        
        if let peripheralToUpdateIndex = peripheralToUpdateIndex {
            displayPeripheral = climbService.peripherals[peripheralToUpdateIndex]
        } else {
            displayPeripheral = DisplayPeripheral()
            climbService.peripherals.append(displayPeripheral)
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
        
        tableView.reloadData()
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
}

extension PeripheralViewController: CBPeripheralManagerDelegate {
    
    func peripheralManagerDidUpdateState(_ peripheral: CBPeripheralManager) {
        switch (peripheral.state) {
        case .poweredOn:
            maintenanceButton.isEnabled = true
            logger.logExtraInfo(message: "Bluetooth PeripheralManager is now on")
            break
        case .poweredOff:
            maintenanceButton.isEnabled = false
            presentAlertController(title: "Bluetooth is off!", message: "Enable Bluetooth from Settings to allow broadcasting data")
            logger.logExtraInfo(message: "Bluetooth PeripheralManager is now off!")
            break
        default:
            logger.logExtraInfo(message: "Unsupported Bluetooth PeripheralManager state: \(peripheral.state)")
        }
    }
    
    func peripheralManagerDidStartAdvertising(_ peripheral: CBPeripheralManager, error: Error?) {
        logger.logExtraInfo(message: "Started advertising")
    }
}

extension PeripheralViewController: CBPeripheralDelegate {
	func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) {
        if let error = error {
            logger.logExtraInfo(message: "Error connecting peripheral: \(error.localizedDescription)")
        }
	}
	
	func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
		logger.logExtraInfo(message: "Peripheral connected (id: \(peripheral.identifier.uuidString) name: \(peripheral.name ?? "" ))")
		performSegue(withIdentifier: "PeripheralConnectedSegue", sender: self)
		peripheral.discoverServices(nil)
	}
    
}

extension PeripheralViewController: UITableViewDataSource, UITableViewDelegate {
	func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell{
		
		let cell = self.tableView.dequeueReusableCell(withIdentifier: "cell")! as! DeviceTableViewCell
		cell.displayPeripheral = climbService.peripherals[indexPath.row]
		return cell
	}
	
	func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int{
		return climbService.peripherals.count
	}
    
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        
        tableView.deselectRow(at: indexPath, animated: false)
        let selected = climbService.peripherals[indexPath.row]
        
        switch selected.nodeState! {
        case .onboard:
            selected.checkOut()
        default:
            selected.checkIn()
        }
        tableView.reloadData()
    }
}
