//
//  ClimbSimpleService.swift
//  BLEScanner
//


import Foundation
import UIKit
// import SwiftyBeaver
import CoreBluetooth
//logging to Xcode Console using swiftybeaver
let log = SwiftyBeaver.self

class ClimbLogger {
    
    // Singleton Pattern
    static let shared = ClimbLogger()
    
    var logsFolder: URL
    var fileDestination: FileDestination
    var dateFormatter: DateFormatter
    var isLogging: Bool
    
    private init() {
        logsFolder = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        fileDestination = FileDestination()
        dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "dd_hh.mm.ss"
        isLogging = false
        
        //custom logging to Xcode Console using swiftybeaver
        let console = ConsoleDestination()
        console.format = "$Dyyyy-MM-dd HH:mm:ss$d $C$L$c: $M"
        log.addDestination(console)
        
    }
    
    func getAllLogFilePaths() -> [String] {
        

        //sort all the files in the logs directory by date
        var allFiles : [String]!;
        if let urlArray = try? FileManager.default.contentsOfDirectory(at: logsFolder,
                                                                       includingPropertiesForKeys: [.contentModificationDateKey],
                                                                       options:.skipsHiddenFiles) {
            
            allFiles =  urlArray.map { url in
                (url.path, (try? url.resourceValues(forKeys: [.contentModificationDateKey]))?.contentModificationDate ?? Date.distantPast)
                }
                .sorted(by: { $0.1 > $1.1 }) // sort descending modification dates
                .map { $0.0 } // extract file names
            
        }

        // find newest log file
        var done = false;
        var i = 0;
        while (!done) {
            if (allFiles[i].hasSuffix(".log")) {
                done = true;
            } else {
                i = i + 1;
            }
        }
        
        return [allFiles[i]];
  /*
        
        // remove from the list the files that are not log files
        while (allFiles.last?.hasSuffix(".log")==false){
            allFiles.removeLast();
        }
        print ("size of allFiles:"+String(allFiles.count))
        for f in allFiles {
            print("f:"+f.description)
        }
        // return the most recent log file
        return [allFiles[0]];
        return [allFiles.popLast()!]; // rajeev was returning the last, which had the oldest date. we actually need the first
    */
        /*
         do {
         let urls = try FileManager.default.contentsOfDirectory(at: logsFolder, includingPropertiesForKeys: nil, options: [FileManager.DirectoryEnumerationOptions.skipsSubdirectoryDescendants])
         if (urls.map({$0.relativePath}).hasSuffix(".log"))
         result = urls.map({ $0.relativePath })
         } catch {
         // Impossible to read log files paths, could not do anything
         }
         return result
         */
    }
    /* This is the pre-September 2018 version of startDataLog
    func startDataLog() {
        
        // Set file logging parameters
        let fileName = "log_\(dateFormatter.string(from: Date())).log"
        let filePath = logsFolder.appendingPathComponent(fileName)

        print("Date:"+dateFormatter.string(from:Date()))
        print("filePath:"+filePath.description)
        fileDestination.logFileURL = filePath
        fileDestination.format = "$Dyyyy MM dd HH mm ss$d $M"
        
        // Log filepath on console before start loggging on file
        log.addDestination(fileDestination)
        isLogging = true
        
        // Log some system infos
        log.info(logString(genericMessage: "Initializing..."))
        log.info(logString(genericMessage: "Current device: \(UIDevice.current.modelName) - \(UIDevice.current.systemName) \(UIDevice.current.systemVersion)"))
        log.info(logString(genericMessage: "Initialized"))
    } */

    func startDataLog() {
        
        // if logging has not already been started, open the files - logs are started when the CLIMB API initalize is called.  If it is called more than once, we only want to open a single file (alm: september 2018)
        if (!isLogging) {
            // Set file logging parameters
            let fileName = "log_\(dateFormatter.string(from: Date())).log"
            let filePath = logsFolder.appendingPathComponent(fileName)
        
            //print("Date:"+dateFormatter.string(from:Date()))
            //print("filePath:"+filePath.description)
            fileDestination.logFileURL = filePath
            fileDestination.format = "$Dyyyy MM dd HH mm ss$d $M"
        
            // Log filepath on console before start loggging on file
            log.addDestination(fileDestination)
            isLogging = true
        }
        
        
        // Log some system info
        log.info(logString(genericMessage: "Initializing..."))
        log.info(logString(genericMessage: "Current device: \(UIDevice.current.modelName) - \(UIDevice.current.systemName) \(UIDevice.current.systemVersion)"))
        log.info(logString(genericMessage: "Date:"+dateFormatter.string(from:Date())))
        log.info(logString(genericMessage: "Initialized"))
    }

    
    func stopDataLog() {
        log.info(logString(genericMessage: "Deinitializing..."))
        log.info(logString(genericMessage: "Date:"+dateFormatter.string(from:Date())))
        log.info(logString(genericMessage: "Deinitialized..."))
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
