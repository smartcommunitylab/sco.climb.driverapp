//
//  ScanButton.swift
//  BLEScanner
//


import UIKit

class ScanButton: UIButton {
	
    let borderWidth: CGFloat = 1.5
    
	required init?(coder aDecoder: NSCoder){
		super.init(coder: aDecoder)
		
		layer.borderWidth = borderWidth
		layer.borderColor = UIColor.bluetoothBlue.cgColor
	}
	
    func buttonColorScheme(isActive: Bool){
		let title = isActive ? "Stop Scanning" : "Start Scanning"
		setTitle(title, for: .normal)
		
		let titleColor = isActive ? UIColor.bluetoothBlue : UIColor.white
		setTitleColor(titleColor, for: .normal)
        
        layer.borderColor = UIColor.bluetoothBlue.cgColor
		backgroundColor = isActive ? UIColor.clear : UIColor.bluetoothBlue
	}
}
