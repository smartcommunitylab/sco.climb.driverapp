//
//  ClimbSimpleService.swift
//  BLEScanner
//

import Foundation
import UIKit
import SwiftyBeaver
import CoreBluetooth

class ClimbLogger {
    
    // Singleton Pattern
    static let shared = ClimbLogger()
    
    var fileDestination: FileDestination
    var dateFormatter: DateFormatter
    var isLogging: Bool = false
    
    private init() {
        dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "dd_hh.mm.ss"
        fileDestination = FileDestination()
    }
    
    func startDataLog() {
        
        // Set file logging parameters
        let fileName = "log_\(dateFormatter.string(from: Date())).log"
        let filePath = URL(fileURLWithPath: (NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true)[0] as NSString).appendingPathComponent(fileName))
        
        fileDestination.logFileURL = filePath
        fileDestination.format = "$Dyyyy MM dd HH mm ss$d $M"
        
        // Log filepath on console before start loggging on file
        log.info("Log file path: \(filePath)")
        log.addDestination(fileDestination)
        isLogging = true
        
        // Log some system infos
        log.info(logString(genericMessage: "Initializing..."))
        log.info(logString(genericMessage: "Current device: \(UIDevice.current.modelName) - \(UIDevice.current.systemName) \(UIDevice.current.systemVersion)"))
        log.info(logString(genericMessage: "Initialized"))
    }
    
    func stopDataLog() {
        log.removeDestination(fileDestination)
        isLogging = false
    }
    
    func logExtraInfo(message: String) {
        if isLogging {
            log.info(logString(genericMessage: message))
        }
    }
    
    func deviceDiscovered(id: String, name: String, rssi: Int, manufacturerString: String) {
        if isLogging {
            log.info(logString(id: id, name: name, rssi: rssi, manufacturerString: manufacturerString))
        }
    }
    
    func maintenanceModeEnabled(advertisementData: [String: Any]) {
        logExtraInfo(message: "Setting up maintenance mode...")
        logExtraInfo(message: "Broadcasting maintenance packet: [ \((advertisementData[CBAdvertisementDataLocalNameKey] as! Data).map { "0x" + String(format: "%02hhx", $0) + " "}.joined())]")
    }

    func maintenanceModeDisabled() {
        logExtraInfo(message: "Shutting down maintenance packet broadcasting...")
        logExtraInfo(message: "Stopping maintenance mode")
    }
    
    private func logString(genericMessage: String) -> String {
        return "\(Date().currentTimeMillis) PHONE LOCAL_DEVICE TAG data \(genericMessage)"
    }
    
    private func logString(id: String, name: String, rssi: Int, manufacturerString: String) -> String {
        return "\(Date().currentTimeMillis) \(id) \(name) ADV \(rssi) \(manufacturerString)"
    }
}
