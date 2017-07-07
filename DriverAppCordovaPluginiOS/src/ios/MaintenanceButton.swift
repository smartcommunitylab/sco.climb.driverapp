//
//  MaintenaceButton.swift
//  BLEScanner
//


import UIKit

class MaintenanceButton: UIButton {
    
    let borderWidth: CGFloat = 1.5
    
    required init?(coder aDecoder: NSCoder){
        super.init(coder: aDecoder)
        
        layer.borderWidth = borderWidth
        layer.borderColor = UIColor.bluetoothRed.cgColor
    }
    
    func buttonColorScheme(isActive: Bool){
        let title = isActive ? "Stop Maintenance" : "Start Maintenance"
        setTitle(title, for: .normal)
        
        let titleColor = isActive ? UIColor.bluetoothRed : UIColor.white
        setTitleColor(titleColor, for: .normal)
        
        layer.borderColor = UIColor.bluetoothRed.cgColor
        backgroundColor = isActive ? UIColor.clear : UIColor.bluetoothRed
    }
}
