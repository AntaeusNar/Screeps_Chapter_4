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
        else if (this.resourceID != undefined && this.destinationID != undefined) {
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

}