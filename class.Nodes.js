/** Nodes are the foundational backbone of transportation logistics
 * At the foundational level Nodes collect resources and push them downstream to the closest claimed room.
 * Nodes are a collection of creeps, structures and logic that allow for this functionality.
 */

/** The Game must have a location for the Nodes */
if (Game.Nodes == undefined) {
    Game.Nodes = {};
}
if (Memory.Nodes == undefined) {
    Memory.Nodes = {};
}

/** Background constants */
// Update rate once every 12 hours (5 sec per tick, 12hr * 60Min * 60sec/5sec)
const updateTicks = (12*60*60)/5;

/** Normal game objects must be able to link to nodes */

/** DRY function for Sources, Minerals, Spawns */
const _getNode = {
    get: function() {
        // Check for Cached
        if (!this._node) {
            // Check for Node in Game
            if (!Game.Nodes[this.id]) {
                // Check for Node in Memory
                if (!Memory.Nodes[id]) {
                    // Create a new Node from id
                    Game.Nodes[this.id] = new Node(fromMemory = false, this.id);
                }
                else {
                    // Create a new Node from Memory
                    Game.Nodes[this.id] = new Node(fromMemory = true, Memory.Nodes[this.id]);
                }
            }
            this._node = Game.Nodes[this.id];
        }
        return this._node;
    }
}

/** Sources */
Object.defineProperty(Source.prototype, 'node', _getNode);

/** Minerals */
Object.defineProperty(Mineral.prototype, 'node', _getNode);

/** Spawns */
Object.defineProperty(StructureSpawn.prototype, 'node', _getNode);

/** Containers */
Object.defineProperty(StructureContainer.prototype, 'node', {
    get: function() {
        if (!this._node) {
            // Look 1 space away for Sources and Minerals
            let options = [];
            options.push(this.pos.findInRange(FIND_SOURCES, 1));
            options.push(this.pos.findInRange(FIND_MINERALS, 1));
            // If no options, this container is NOT part of a node
            if (options.length == 0) {
                return undefined;
            }
            else {
                // Check in the Game and Memory for a Node
                for (let option of options) {
                    if (!Game.Nodes[option.id]) {
                        if (!Memory.Nodes[option.id]) {
                            // nothing found
                        }
                        else {
                            // Found in Memory
                            Game.Nodes[option.id] = new Node(fromMemory = true, Memory.Nodes[option.id]);
                            this._node = Game.Nodes[option.id];
                            return this._node;
                        }
                    }
                    else {
                        // Found in Game
                        this._node = Game.Nodes[option.id];
                        return this._node;
                    }
                }
                // Only way to get here is if there are options but no node
                Game.Nodes[options[0].id] = new Node(fromMemory = false, options[0].id);
                this._node = Game.Nodes[options[0].id];
            }
        }
        return this._node;
    }
});

/** Storage */
Object.defineProperty(StructureStorage.prototype, 'node', {
    get: function() {
        if (!this._node) {
            // look 2 spaces away for spawns
            let options = [];
            options.push(this.pos.findInRange(FIND_MY_SPAWNS, 2));
            // If no options, this storage is NOT part of a node
            if (options.length == 0) {
                return undefined;
            }
            else {
                // IMPROVE: DRY this with the Container logic
                // Check in the Game and Memory for a Node
                for (let option of options) {
                    if (!Game.Nodes[option.id]) {
                        if (!Memory.Nodes[option.id]) {
                            // nothing found
                        }
                        else {
                            // Found in Memory
                            Game.Nodes[option.id] = new Node(fromMemory = true, Memory.Nodes[option.id]);
                            this._node = Game.Nodes[option.id];
                            return this._node;
                        }
                    }
                    else {
                        // Found in Game
                        this._node = Game.Nodes[option.id];
                        return this._node;
                    }
                }
                // Only way to get here is if there are options but no node
                Game.Nodes[options[0].id] = new Node(fromMemory = false, options[0].id);
                this._node = Game.Nodes[options[0].id];
            }

        }
        return this._node;
    }
});

/** Extractors */
Object.defineProperty(StructureExtractor.prototype, 'node', {
    get: function() {
        if (!this._node) {
            // Get the ID of the Mineral this is placed on
            let mineral = this.pos.findInRange(FIND_MINERALS, 0);
            this._node = Game.Nodes[mineral.id];
            // Still no node && there is one in memory
            if (!this._node || Memory.Nodes[mineral.id] != undefined) {
                Game.Nodes[mineral.id] = new Node(fromMemory = true, Memory.Nodes[mineral.id]);
                this._node = Game.Nodes[mineral.id];
            }
            else {
                //No node in memory or in game... make a bitch
                Game.Nodes[mineral.id] = new Node(fromMemory = false, mineral.id);
                this._node = Game.Nodes[mineral.id];
            }
        }
        return this._node
    }
});

/** Creeps */
Object.defineProperty(Creep.prototype, 'node', {
    get: function() {
        if (!this._node) {
            //Should it have a node?
            if (!this.memory.nodeID) {
                //nope not a node creep
                return undefined;
            }
            else {
                this._node = Game.Nodes[this.memory.nodeID];
            }
        }
        return this._node;
    }
});

/**
 * Class defining a Node
 */
class Node {
    /**
     * Creates a Node
     * @param {Boolean} fromMemory - flag if the creation is from member
     * @param {Object|String} scope - Memory Object or id string
     * @returns {Node} newly created Node
     */
    constructor(fromMemory, scope) {
        if (fromMemory) {
            // Build this from Memory
            for (let prop in scope) {
                this[prop] = scope[prop];
            };
            return this;
        }
        else {
            // Build this from ID
            // Validate that the id is from something that can be seen
            let requestor = Game.getObjectById({id: scope});
            if (requestor != null) {
                // Common items
                /** @member {String} id*/
                this.id = requestor.id;
                /** @member {Room} room - {@link room} object*/
                this.room = requestor.room;
                /** @member {String} roomName - name of the room */
                this.roomName = this.room.roomName;
                /** @member {Number} updateTick - tick the node was last updated*/
                this.lastUpdate = Game.time;

                if (requestor instanceof Source || requestor instanceof Mineral) {
                    /** @member {Boolean} finalDrop - True if the last stop in the chain */
                    this.finalDrop = false;
                    /** @member {String} resourceID - id of the resource */
                    this.resourceID = this.id;
                    /** @member {Source|Mineral} - {@link Source} or {@link Mineral} that is the resource */
                    this.resource = requestor;
                    /** @member {String} nodeType - the type of node */
                    this.nodeType = 'Production';
                }
                else if (requestor instanceof StructureSpawn) {
                    this.resourceID = null;
                    this.resource = null;
                    this.nodeType = 'Final';
                    this.finalDrop = true;
                    this.finalDistance = 0;
                    this.distance = 0;
                }
                else {
                    // TODO: throw an error of some kind
                }
            }
            else {
                // TODO: throw an error of some kind
            }
        }

        return this;
    }

    /** Gets the Final Node ID
     * @returns {String} Final Node Id
     */
    get finalNodeId() {
        if (this.finalDrop) {
            return this.id;
        }
        if (!this._finalNodeId) {
            if (!this.memory.finalNodeId || (Game.time - this.lastUpdate) > updateTicks) {
                let finalNodeId = this._findFinalNodeId();
                this.memory.finalNodeId = finalNodeId;
                this._finalNodeId = finalNodeId;
            }
            else {
                this._finalNodeId = this.memory.finalNodeId;
            }
        }
        return this._finalNodeId;
    }

    /** Gets the next downstream node id
     * @returns {String} next Node Id
     */
    get nextNodeId() {
        if (this.finalDrop) {
            return this.id;
        }
        if (!this._nextNodeId) {
            if (!this.memory.nextNodeId || (Game.time = this.lastUpdate) > updateTicks) {
                let results = this._findNextNodeId();
                this.memory.nextNodeId = results.nextNodeId;
                this.nextDistance = results.nextDistance;
                this.finalDistance = results.finalDistance;
                this._nextNodeId = nextNodeId;
                // TODO: finish saving or updating the next and final distances
            }
            else {
                this._nextNodeId = this.memory.nextNodeId;
            }
        }
        return this._nextNodeId;
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

    /** Private function to find closest destination
     * Should be run if the node has no idea or if the update needs run
     * @private
     * @returns {String} id of best destination node
     */
    _findFinalNodeId() {
        let finalOptions = [];
        if (Game.Nodes.length > 0) {
            deliveryOptions.push(_.filter(Game.Nodes, function(o) {
                return o.finalDrop;
            }));
            if (deliveryOptions.length > 0) {
                let bestOption = {
                    node: {},
                    distance: 8000
                }
                let distance = 0;
                for (let option in deliveryOptions) {
                    distance = Game.Map.findRoute(this.room.name, option.room.name).length;
                    if (distance < bestOption.distance) {
                        bestOption.node = option;
                        bestOption.distance = distance;
                    }
                }
                return bestOption.node.id;

            }
            else {
                // TODO: Throw an error here
            }
        }
        else {
            // TODO: Throw an error here
        }
    }

    /** Private function to find best downstream Node
     * @private
     * @returns {Object} results
     * @property {String} results.Id next downstream node in the chain.
     * @property {number} results.finalDistance - distance by path from this node to the final node.
     */
    _findNextNodeId() {
        /** Locates the best place to take the resources to for transfer or drop */
        let deliveryOptions = [];
        // Check first to see if there are other nodes
        if (Game.Nodes.length > 0) {
            let routeToCheckForNodes = Game.map.findRoute(this.room.name, this.finalNode.room.name);
            let roomsToCheckForNodes = []
            roomsToCheckForNodes.push(this.room.name);
            for (let route in routeToCheckForNodes) {
                roomsToCheckForNodes.push(route.room);
            }
            for (let room in roomsToCheckForNodes) {
                for (let node of Game.Nodes) {
                    if (node.room.name == room) {
                        deliveryOptions.push(node);
                    }
                }
            }

            let bestOption = {
                node: {},
                distance: 8000
            }
            let totalDistance = 0;
            for (let option in deliveryOptions) {
                let path = this.resource.pos.findPathTo(option);
                totalDistance = path.length + option.finalDistance;
                if (totalDistance < bestOption.distance) {
                    bestOption.nextNodeId = option.id;
                    bestOption.finalDistance = totalDistance;
                    bestOption.nextDistance = path.length;
                }
            }

            return bestOption;
        }
        else {
            // No other nodes
            // TODO: throw an error of some kind
            return null;
        }
    }

}

let test = new Node(false, "1");

test.













/** Nodes form the backbone of resource transportation routes for the Omni-Union.
 * 
 * Nodes are delivery points, production points, and can group a number of features and structures together.
 * Nodes can be upgraded (spawn delivery node to storage delivery node) or are gated (mineral nodes can't have miners or extractors until the room is at level 6)
 *
 * Due the many types and usages of nodes we will need to be able to create nodes from many
 * different types of information and run and number of checks to make sure there is not a node there already
 * plus upgrade the nodes functionality as room levels and needs increase.
 */

/** Node Class
 * 
 */
class Node {
    /** 
     * Constructs the Node
     * @param {String} id - id of proposed node (must match the id of a source, deposit, mineral, powerbank, spawn, or storage)
     * @returns {Node} The Node
     */
    constructor(id) {
        // validate that this is an id of something
        let requestedCreationObject = Game.getObjectById({id: id});
        if (requestedCreationObject != null) {
            // valid object that can be seen
            if (requestedCreationObject instanceof Source || 
                requestedCreationObject instanceof Deposit || 
                requestedCreationObject instanceof Mineral || 
                requestedCreationObject instanceof StructurePowerBank ||
                requestedCreationObject instanceof StructureSpawn ||
                requestedCreationObject instanceof StructureStorage ||
                requestedCreationObject instanceof 
            ) {
                // correct kind of object to be looked for
            }
        }
        // Check to see if this node is in memory
        if (Memory.Nodes[id] != undefined) {

        }

        // Check to see if the node was generated under a different id (final destination Nodes will be created via spawner before there is a storage)
        let creatorStructure = Game.structures[id];
        if (creatorStructure != undefined) {
            let idOptions = creatorStructure.room.find(FIND_MY_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_SPAWN);
                }
            })
        }
    }
}
/** function that will create the correct type of node and make sure that we are not duplicating nodes
 * Nodes can be created based off of an ID (if there is one that was created before and needs to be connected to a memory instance and rebuilt)
 * Additionally if given a Source, Deposit, Mineral, PowerBank, StructureSpawn, StructureStorage, or StructureContainer
 */
function createNode() {
    /** sort out what kind of information we are provided to create a new node */
}
/**
 * Resource Production Tracking
 * @typedef {Object} prodTrack
 * @property {number} energy - per tick energy.
 * @property {number} power - per tick power.
 * @property {Object} minerals - each mineral amount per tick.
 * @property {Object} commodities - each commodity amount per tick.
 */

/**
 * The BaseNode definition
 * @typedef {Object} BaseNode
 * @property {StructureStorage|StructureContainer|StructureSpawn} dropOff - link to the node's physical drop.
 * @property {prodTrack} prodTrack - object tracking amount of each resource pushed out from this node per tick.
 */

/**
 * The ChainNode definition, extends baseNode
 * @typedef {Object} ChainNode
 * @property {BaseNode|ChainNode|ProdNode} nextNode - link to the next downstream Node.
 * @property {BaseNode} finalNode - link to the final downstream Node.
 * @property {Number} finalDistance - distance from this node to the final node.
 * @property {Number} distance - distance from this node to next downstream node.
 * @property {Array} path - array describing the path from this node to the next downstream node.
 * @property {Creep[]} freighters - array of freighter {@link Creep}s.
 */

/**
 * The ProdNode definition, extends chainNode
 * @typedef {Object} ProdNode
 * @property {Source|Mineral|Deposit|PowerBank} resource - a {@link Source}, {@link Mineral}, {@link Deposit}, or {@link PowerBank}.
 * @property {Creep[]} miners - array of miner {@link Creep}s
 */

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