//
//  ServiceTableViewCell.swift
//  BLEScanner
//
//  Created by Rajeev Piyare on 30/01/2017.
//  Copyright © 2017 RKP. All rights reserved.
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
