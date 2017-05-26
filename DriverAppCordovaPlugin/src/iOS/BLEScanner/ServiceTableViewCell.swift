//
//  ServiceTableViewCell.swift
//  BLEScanner
//


import UIKit

class ServiceTableViewCell: UITableViewCell {

	@IBOutlet weak var serviceNameLabel: UILabel!
	@IBOutlet weak var serviceCharacteristicsButton: UIButton!
    
    override func awakeFromNib() {
        super.awakeFromNib()
        // Initialization code
	}
	
	@IBAction func characteristicsButtonPressed(_ sender: AnyObject) {
	}
}
