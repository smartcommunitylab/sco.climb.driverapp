public class NodeState: NSObject {
    var nodeId: String!
    var state: Int!
    var lastSteen: Int!
    var batteryVoltage_mV: Int!
    
    func toJSON() -> String {
        return "{\"nodeId\": \"\(nodeId!)\", \"state\": \(state!), \"lastSteen\": \(lastSteen!), \"batteryVoltage_mV\": \(batteryVoltage_mV!)}"
    }
}

extension Array where Element:NodeState {
    func toJson() -> String {
        if self.count == 0 {
            return "[]"
        }
        //reduce to combine all items in a collection to create a single new value
        return "[\(self[0].toJSON())\(self[1..<count].reduce("") { accumulator, actual in accumulator + "," + actual.toJSON()})]"
    }
}

extension Array where Element == String {
    func toJson() -> String {
        if self.count == 0 {
            return "[]"
        }
        
        return "[\"\(self[0])\"\(self[1..<count].reduce("") { accumulator, actual in accumulator + ", \"\(actual)\""})]"
    }
}
