//
//  PeripheralTableViewController.swift
//  BLEScanner
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
    
    var centralManager: CBCentralManager!
    var peripheralManager: CBPeripheralManager!
    
    var peripherals: [DisplayPeripheral]!
    var selectedPeripheral: CBPeripheral?
    var logger: ClimbLogger!
    var maintenanceModeEnabled: Bool!
    
    let sensorTagName = "CLIMBC"
    let standardMessage = "Scanning BLE Devices..."
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        centralManager = CBCentralManager(delegate: self, queue: nil)
        peripheralManager = CBPeripheralManager(delegate: self, queue: nil)
        
        peripherals = []
        logger = ClimbLogger.shared
        maintenanceModeEnabled = false
        maintenanceButton.buttonColorScheme(isActive: false)
    }
	
    @IBAction func scanningButtonPressed(_ sender: ScanButton) {
        centralManager.isScanning ? stopScanning() : startScanning()
    }

    @IBAction func reset(_ sender: ScanButton) {
        reset()
        scanningButton.isHidden = false
    }
    
    @IBAction func insertTag(_ sender: ScanButton) {
        logger.logExtraInfo(message: "Manually inserted tag")
    }
    
    @IBAction func toggleMaintenance(_ sender: MaintenanceButton) {
        reset()
        if maintenanceModeEnabled {
            stopMaintenanceMode()
        } else {
            startMaintenanceMode()
        }
    }
    
    @IBAction func checkInAll(_ sender: ScanButton) {
        for peripheral in peripherals {
            peripheral.checkIn()
        }
        tableView.reloadData()
    }
    
    @IBAction func checkOutAll(_ sender: Any) {
        for peripheral in peripherals {
            peripheral.checkOut()
        }
        tableView.reloadData()
    }
    
    fileprivate func startScanning(){
        updateUiForScanningStarted()
        
        centralManager.scanForPeripherals(withServices: nil, options: [CBCentralManagerScanOptionAllowDuplicatesKey: true])
    }
    
    fileprivate func stopScanning() {
        centralManager.stopScan()
        logger.stopDataLog()
        updateUiForScanningStopped()
    }
    
    private func reset() {
        if centralManager.isScanning {
            stopScanning()
        }
       
        resetDiscoveredPeripherals()
        statusLabel.text = standardMessage
    }
    
    private func updateUiForScanningStarted() {
        statusLabel.text = standardMessage
        bluetoothIcon.pulseAnimation()
        bluetoothIcon.isHidden = false
        scanningButton.buttonColorScheme(isActive: true)
    }
    
    private func updateUiForScanningStopped() {
        statusLabel.text = "\(self.peripherals.count) device\(self.peripherals.count > 1 ? "s" : "") found"
        bluetoothIcon.layer.removeAllAnimations()
        bluetoothIcon.isHidden = true
        scanningButton.buttonColorScheme(isActive: false)
    }
	
    private func resetDiscoveredPeripherals() {
        peripherals.removeAll(keepingCapacity: false)
        tableView.reloadData()
    }

    private func startMaintenanceMode() {
        DatePickerDialog().show(title: "Wake-up time", doneButtonTitle: "Done", cancelButtonTitle: "Cancel", datePickerMode: .dateAndTime) { wakeupTime in
            
            guard wakeupTime != nil, wakeupTime?.compare(Date()) == .orderedDescending else {
                self.logger.logExtraInfo(message: "Date is nil or in the past")
                return
            }
        
            self.checkInButton.isEnabled = false
            self.checkOutButton.isEnabled = false
            self.scanningButton.isEnabled = false
            self.tagButton.isEnabled = false
            self.resetButton.isEnabled = false
            self.maintenanceButton.buttonColorScheme(isActive: true)
            self.statusLabel.text = "Advertising..."
            self.bluetoothIcon.pulseAnimation()
            self.bluetoothIcon.isHidden = false
            self.maintenanceModeEnabled = true
            
            let wakeupData = self.buildAdvertisementData(wakeupTime: wakeupTime!)
            let advertisementData = [CBAdvertisementDataLocalNameKey : wakeupData]
            
            self.logger.maintenanceModeEnabled(advertisementData: advertisementData)
            self.peripheralManager.startAdvertising(advertisementData)
        }
    }
    
    private func stopMaintenanceMode() {
        
        peripheralManager.stopAdvertising()
        logger.maintenanceModeDisabled()
        maintenanceModeEnabled = false
        
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
    
    private func buildAdvertisementData(wakeupTime: Date) -> Data {
        let wakeupMillis = wakeupTime.currentTimeMillis
        var data = Data(bytes: [0xff, 0x02])
        data.append(Data(bytes: toByteArray(wakeupMillis).reversed()[2..<8]))
        return data
    }
    
	override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
		if let destinationViewController = segue.destination as? PeripheralConnectedViewController{
			destinationViewController.peripheral = selectedPeripheral
		}
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
            updateAdvertimentData(peripheral: displayPeripheral, advertisementData: manufacturerData)
        }
        
        logger.deviceDiscovered(id: peripheral.identifier.uuidString,
                                name: peripheral.name ?? "No Device Name",
                                rssi: displayPeripheral.lastRSSI!,
                                manufacturerString: displayPeripheral.manufacturerData ?? "")
        
        tableView.reloadData()
    }
    
    private func updateAdvertimentData(peripheral: DisplayPeripheral, advertisementData: Data) {
        
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
        
        //peripheral.manufacturerData = Data(advertisementData[2...6]).hexEncodedString()                    //use for proper CLIMB log
        peripheral.manufacturerData = Data(advertisementData[2..<advertisementData.count]).hexEncodedString() // use for logging the whole packet with extra node neighbor field
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
		cell.displayPeripheral = peripherals[indexPath.row]
		cell.delegate = self
		return cell
	}
	
	func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int{
		return peripherals.count
	}
    
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        
        tableView.deselectRow(at: indexPath, animated: false)
        let selected = peripherals[indexPath.row]
        
        switch selected.nodeState! {
        case .checking:
            selected.checkIn()
        case .onboard:
            selected.checkOut()
        default:
            // State is error or something not supported, could not do anything
            break
        }
        tableView.reloadData()
    }
}

extension PeripheralViewController: DeviceCellDelegate {
	func connectPressed(_ peripheral: CBPeripheral) {
		if peripheral.state != .connected {
			selectedPeripheral = peripheral
			peripheral.delegate = self
			
            centralManager?.connect(peripheral, options: nil)
		}
	}
}
