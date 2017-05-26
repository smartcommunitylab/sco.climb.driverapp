//
//  PeripheralConnectedViewController.swift
//  BLEScanner
//


import UIKit
import CoreBluetooth

class PeripheralConnectedViewController: UIViewController {

	@IBOutlet weak var tableView: UITableView!
	@IBOutlet weak var peripheralName: UILabel!
	@IBOutlet weak var blurView: UIVisualEffectView!
	@IBOutlet weak var rssiLabel: UILabel!
	
	var peripheral: CBPeripheral?
	var rssiReloadTimer: Timer?
	var services: [CBService]!
    var logger: ClimbLogger!
	
    override func viewDidLoad() {
        super.viewDidLoad()

		peripheral?.delegate = self
		peripheralName.text = peripheral?.name
        
        services = []
        logger = ClimbLogger.shared
		
		let blurEffect = UIBlurEffect(style: .dark)
		blurView.effect = blurEffect
		
		tableView.rowHeight = UITableViewAutomaticDimension
		tableView.estimatedRowHeight = 80.0
		tableView.contentInset.top = 5
		
		rssiReloadTimer = Timer.scheduledTimer(timeInterval: 1.0, target: self, selector: #selector(PeripheralConnectedViewController.refreshRSSI), userInfo: nil, repeats: true)
	}
	
	@IBAction func disconnectButtonPressed(_ sender: AnyObject) {
		UIView.animate(withDuration: 0.5, animations: {
            self.view.alpha = 0.0
			}, completion: {_ in
				self.dismiss(animated: false, completion: nil)
		}) 
	}
    
    func refreshRSSI(){
        peripheral?.readRSSI()
    }
}

extension PeripheralConnectedViewController: UITableViewDataSource{
	
	func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
		return services.count
	}
	
	func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
		let cell = tableView.dequeueReusableCell(withIdentifier: "ServiceCell") as! ServiceTableViewCell
		cell.serviceNameLabel.text = "\(services[indexPath.row].uuid)"
		
		return cell
	}
}

extension PeripheralConnectedViewController: CBPeripheralDelegate {
    
    func peripheral(_ peripheral: CBPeripheral, didReadRSSI RSSI: NSNumber, error: Error?) {
        
        switch RSSI.intValue {
        case -90 ... -60:
            rssiLabel.textColor = UIColor.bluetoothOrange
            break
        case -200 ... -90:
            rssiLabel.textColor = UIColor.bluetoothRed
            break
        default:
            rssiLabel.textColor = UIColor.bluetoothGreen
            break
        }
        
        rssiLabel.text = "\(RSSI)dB"
    }
    
	func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
		if let error = error {
			logger.logExtraInfo(message: "Error discovering services: \(error.localizedDescription)")
		}
    
        guard let peripheralServices = peripheral.services, peripheralServices.count > 0 else {
            return
        }
        
        services = peripheral.services!
        tableView.reloadData()
        
        services.forEach { service in
            peripheral.discoverCharacteristics(nil, for: service)
        }
	}
	
	func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
		if let error = error {
			logger.logExtraInfo(message: "Error discovering service characteristics: \(error.localizedDescription)")
		}
		
		service.characteristics?.forEach({ (characteristic) in
            logger.logExtraInfo(message: "Characteristic (\(characteristic.uuid): \(characteristic.value != nil ? String(data: characteristic.value!, encoding: .utf8)! : "<empty>"))")
		})
	}
	
	
}
