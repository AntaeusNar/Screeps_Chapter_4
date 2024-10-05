/** Nodes are the building blocks of transportation routes for the Omni-Union
 *
 * The idea is that a Node exists as a base class that is extendable under different
 * situations for different uses.
 *
 * Node types:
 * Source and Deposit container Miner Nodes
 * Mineral Container Miner Node
 * Energy Link Node
 *
 */

const OmniUnion = require("./class.OmniUnion");

/** Additional private functions */

/** Finds the best downstream node by distance and adds the needed info to memory and returns the node
 * @param {Object} this
 * @return {Object} Downstream Option
 */
function _findDownStreamNode(this) {
    /** Locate and select the correct place to take the resource to
         * for transfer or drop.
         * If in the same room as the destination, we need to see if there is a storage
         * to take the resource to, or if we need to drop next to spawn.
         * If adjacent to the destination room, we need to check to see if there is a storage
         * in the destination room, or see if we need to drop at spawn, and also see if the
         * storage/spawn option is the closest by path or if there is a node closer.
         */

    let deliveryOptions = [];
    let spawnDrop = false;
    // Check to see if there are other nodes
    if (OmniUnion.Nodes.length > 0) {
        // Check to see if we need to walk through rooms
        let roomsToCheckForNodes = Game.map.findRoute(this.room.name, this.destinationRoom.name);
        if (roomsToCheckForNodes.length > 0) {
            // Loop through every room available adding the nodes in those rooms
            for (let room in roomsToCheckForNodes) {
                for (let node of OmniUnion.Nodes) {
                    if (node.room.name == room) {
                        deliveryOptions.push(node);
                    }
                }
                if (deliveryOptions.length > 0) {
                    break; // Breaks the loop if we have found some options
                }
            }
        }
    }

    // Check to see if there are No delivery Options (nodes only), if this node is IN the destination room, or if this node is NEXT to the destination room
    if (deliveryOptions.length == 0 ||
        this.room.name == this.destinationRoom.name ||
        Game.map.getRoomLinearDistance(this.room.name, this.destinationRoom.name) == 1 ) {
            // Check to see if there is NOT a storage in the destination room
        if (!this.destinationRoom.storage) {
            // add the tile 1 south of the spawn to the options
            let spawn = this.room.find(FIND_MY_SPAWNS)[0];
            deliveryOptions.push(new RoomPosition(spawn.pos.x, spawn.pos.y - 1, spawn.pos.roomName));
            spawnDrop = true;
        }
        else {
            // There is a storage in the destination room, add it as an option
            deliveryOptions.push(this.destinationRoom.storage);
        }
    }

    // Find the closest option by path + the options distance to the final destination
    let bestOption = {
        node: {},
        distance: 8000,
        path:[]
    }
    let totalDistance = 0
    for (let option in deliveryOptions) {
        let path = this.resource.pos.findPathTo(option);

        // check to make sure the option has a distance to the destination (not true for the storage or the spawn pos)
        if (option.totalDistance != undefined) {
            totalDistance = option.distanceToDestination + path.length;
        }
        else {
            totalDistance = path.length
        }

        // Check to see if the current totalDistance is the shortest distance we have see
        if (totalDistance < bestOption.distance) {
            bestOption.node = option;
            bestOption.distance = totalDistance;
            bestOption.path = path;
        }
    }

    // Now that the best option has been selected

    /**
    if (!spawnDrop) {
        //find the closest option by path + option distance to final destination
        let bestOption = {
            node: {},
            distance: 80000,
            path: [],
        }
        let totalDistance = 0
        for (let option in deliveryOptions) {
            let path = this.resource.pos.findPathTo(option);
            totalDistance = option.distanceToDestination + path.length;
            if (totalDistance < bestOption.distance) {
                bestOption.node = option;
                bestOption.distance = totalDistance;
                bestOption.path = path;
            }
        }
        this._downstreamNode = bestOption.node;
 
        this.memory.downstreamNodeID = bestOption.node.id;
        this.memory.distanceToDestination = totalDistance
    }
        */
}

/** Class defining the base Node */
class BasicNode {
    /** Creates a Basic Node
     * MUST be either a valid ID and have matching Memory
     * OR a resource id and destination id
     * @param {scope}
     * @param {string} [scope.id] - the node id
     * @param {string} [scope.resourceID] - the id of the resource
     */
    constructor(scope = {}) {
        for (let prop in scope) {
            this[prop] = scope[prop]
        }

        // Check to see if the Node was recalled from memory
        if (this.id != undefined && Memory.Node[this.id] != undefined) {
            //construction completed
            return this;
        }

        // else we need to have a resourceID and destinationID
        else if (this.resourceID != undefined) {
            // Build the Node based on this information
            this.id = "Node_" + this.resourceID;
            this.init();
            return this;
        }

        // not enough info to build the Node
        else {
            console.log("ERROR: NOT GIVEN ENOUGH INFORMATION TO CREATE A NODE.");
            return;
        }

    } // End of Constructor

    /** Initializes the Node (Runs as part of the construction) */
    init() {
        // TODO: set Prime
        // TODO: set Downstream Object
        // TODO: check set path to Downstream Object
        // TODO: Check set POS
        // TODO: check/build Container
        // TODO: check/build the roads

    }

    /** Gets the Memory Object
     * @returns {Object} memory
     */
    get memory() {
        return Memory.Nodes[this.id] || {};
    }

    /** Sets the Memory Object
     * @param {*} value
     */
    set memory(value) {
        Memory.Nodes[this.id] = value;
    }

    /** Gets the Resource Object
     * @returns {Object} Source/Deposit/Mineral
     */
    get resource() {
        if (!this._resource) {
            if (!this.memory.resourceID) {
                this.memory.resourceID = this.resourceID;
            }
            this._resource = Game.getObjectById(this.memory.resourceID);
        }
        return this._resource
    }

    /** Gets the Room Object
     * @returns {Object} room
     */
    get room() {
        if (!this._room) {
            if (!this.memory.roomName) {
                this.memory.roomName = this.resource.room.name;
            }
            this._room = Game.rooms[this.memory.roomName];
        }
        return this._room;
    }

    /** Gets the Room Controller Object */
    get controller() {
        if (!this._controller) {
            this._controller = this.room.controller;
        }
        return this._controller
    }

    /** Gets the Destination Room
     * @returns {Object} Destination Room
     */
    get destinationRoom() {
        if (!this._destinationRoom) {
            if (!this.memory.destinationRoomName) {
                let minDist = 200;
                let distance = 0;
                let destinationRoomName = "";
                for (let i in Game.rooms) {
                    if (Game.rooms[i].controller.my) {
                        distance = Game.Map.findRoute(this.room.name, Game.rooms[i].name);
                        if(distance < minDist) {
                            minDist = distance;
                            destinationRoomName = Game.rooms[i].name;
                        }
                    }
                }
                this.memory.destinationRoomName = destinationRoomName;
            }
            this._destinationRoom = Game.rooms[this.memory.destinationRoomName];
        }
        return this._destinationRoom;
    }

    /** Gets the Downstream Object
     * If there is a know downstream Node (Node container or room Storage),
     * it returns that object.  Otherwise it returns a RoomPos Object located one square
     * south of the room's spawn. (in the case the node is in the same room as the best
     * controller and the room does not have a storage)
     * @returns {Object} downstream Structure Object or a dropoff RoomPos Object
     */
    get downstreamNode() {
        // Check to see if the node is cached
        if (!this._downstreamNode) {
            /// Check to see if the node id is remembered
            if (!this.memory.downstreamNodeID) {
                let downstreamOption = _findDownStreamNode(self);
                this._downstreamNode = downstreamOption.node;
                this.memory.distanceToDestination = downstreamOption.totalDistance;
                //this.memory.downstreamPath = bestOption.path;
                // if the node has an id, it should be remembered
                if (this._downstreamNode.id != undefined) {
                    this.memory.downstreamNodeID = this._downstreamNode.id;
                }
            }
            // The Id is remembered!
            else {
                this._downstreamNode = OmniUnion.Nodes[this.memory.downstreamNodeID];
                // Check to see if we found the node in the game
                if (!this._downstreamNode) {
                    // Nope, it is a storage
                    this._downstreamNode = Game.structures[this.memory.downstreamNodeID];
                }
            }

        }
        return this._downstreamNode;
    }

} // End of BasicNode

module.exports = BasicNode;