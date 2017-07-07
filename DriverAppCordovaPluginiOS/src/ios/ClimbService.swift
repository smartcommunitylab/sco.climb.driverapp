//
//  ClimbService.swift
//  BLEScanner
//


import Foundation

protocol ClimbService {
    
    /// Initialize the service.
    ///
    /// - Returns: whether the initialization was successful.
    func initialize() -> Bool
    
    /// Deinitialize the service.
    ///
    /// - Returns: whether the deinitialization was successful.
    func deinitialize() -> Bool
    
    /// Stub.
    ///
    /// - Returns: always true.
    func startListener() -> Bool
    
    /// Stub.
    ///
    /// - Returns: always true.
    func stopListener() -> Bool
    
    /// Stub.
    ///
    /// - Returns: an empty array.
    func getMasters() -> [String]
    
    /// Stub.
    ///
    /// - Returns: always true.
    func connectMaster(master: String) -> Bool
    
    /// Stub.
    ///
    /// - Returns: always true.
    func disconnectMaster() -> Bool
    
    /// Stub.
    ///
    /// - Returns: always true.
    func setNodeList(children: [String]) -> Bool
    
    /// Get all nodes states.
    ///
    /// - Returns: an array of `NodeState` representing all the discovered child nodes.
    func getNetworkState() -> [NodeState]
    
    /// Get the state of a single child node.
    ///
    /// - Parameter child: The child ID.
    /// - Returns: a `NodeState` which represents the state of the node if available, nil otherwise.
    func getNodeState(child: String) -> NodeState?
    
    /// Check in a given child node.
    ///
    /// - Parameter child: The child ID.
    /// - Returns: always true in this implementation.
    func checkinChild(child: String) -> Bool
    
    /// Check out a given child node.
    ///
    /// - Parameter child: The child ID.
    /// - Returns: always true in this implementation.
    func checkoutChild(child: String) -> Bool
    
    /// Check in a given array of child nodes.
    ///
    /// - Parameter children: an array of child IDs.
    /// - Returns: true if the check-in of each child node was successful, false otherwise.
    func checkinChildren(children: [String]) -> Bool
    
    /// Check out a given array of child nodes.
    ///
    /// - Parameter children: an array of child IDs.
    /// - Returns: true if the check-out of each child node was successful, false otherwise.
    func checkoutChildren(children: [String]) -> Bool
   
    /// Enable maintenance procedure.
    ///
    /// - Parameter wakeupTime: the wakeup time to be advertised, expressed using the UNIX epoch format (millis from 1970). 
    /// - Returns: nil if the maintenance mode was succesfully enabled, an `ErrorCode` otherwise, describing the error type.
    func enableMaintenanceProcedure(wakeupTime: Int) -> ErrorCode?
    
    /// Disable maintenance procedure.
    ///
    /// - Returns: nil if the maintenance mode was succesfully disabled , an `ErrorCode` otherwise, describing the error type.
    func disableMaintenanceProcedure() -> ErrorCode?
    
    /// Get all log files paths.
    ///
    /// - Returns: all log files absolute paths.
    func getLogFiles() -> [String]
    
    /// Stub
    ///
    /// - Returns: always true
    func test(name: String) -> Bool

}

public enum ErrorCode {}

public struct NodeState {
    var nodeId: String!
    var state: Int!
    var lastSteen: Int!
    var batteryVoltage_mV: Int!
}
