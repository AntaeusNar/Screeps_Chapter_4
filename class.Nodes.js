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

    // TODO: RoomPos Object
    // TODO: Containers
    // TODO: Roads
    // TODO: Room link
    // TODO: Controller Link
    // TODO: Resource link
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
        }
        else {
            // Build this from ID
            // Validate that the id is from something that can be seen
            let requestor = Game.getObjectById({id: scope});
            if (requestor == null ||
                !(requestor instanceof Source) ||
                !(requestor instanceof Mineral) ||
                !(requestor instanceof StructureSpawn)
            ) {
                // This node cannot be built w/ this info.
                return ERR_INVALID_ARGS;
            }
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
                /** @member {String} nodeType - the type of node */
                this.nodeType = 'Production';
                /** @member {String} resourceID - id of the resource */
                this.resourceID = this.id;
                /** @member {Source|Mineral} - {@link Source} or {@link Mineral} that is the resource */
                this.resource = requestor;


            }
            else if (requestor instanceof StructureSpawn) {
                this.finalDrop = true;
                this.nodeType = 'Final';
                this.finalNodeId = this.id;
                this.finalNode = null;
                this.finalDistance = 0;
                this.nextNodeId = this.id;
                this.nextNode = null;
                this.nextDistance = 0;
                this.resourceID = null;
                this.resource = null;
            }
        }
        return this;
    } // End of constructor

    /** Gets the final Node ID
     * @returns {String} Final Node Id
     */
    get finalNodeId() {
        if (this.finalDrop) {
            return this.id;
        }
        if (!this._finalNodeId) {
            if (!this.memory.finalNodeId || (Game.time - this.lastUpdate) > updateTicks) {
                this._updateDownstream();
            }
            this._finalNodeId = this.memory.finalNodeId;
        }
        return this._finalNodeId;
    }

    set finalNodeId(id) {
        this.memory.finalNodeId = id;
    }

    get finalNode() {
        if (this.finalDrop) {
            return null;
        }
        if (!this._finalNode) {
            this._finalNode = Game.Nodes[this.finalNodeId];
        }
        return this._finalNode;
    }

    set finalNode(node) {
        if (node instanceof Node) {
            this.finalNodeId = node.id;
            this._finalNode = node;
        }
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
                this._updateDownstream();
            }
            this._nextNodeId = this.memory.nextNodeId;
        }
        return this._nextNodeId;
    }

    set nextNodeId(id) {
        this.memory.nextNodeId = id;
    }

    get nextNode() {
        if (this.finalDrop) {
            return null;
        }
        if (!this._nextNode) {
            this._nextNode = Game.Nodes[this.nextNodeId];
        }
        return this._nextNode;
    }

    set nextNode(node) {
        if (node instanceof Node) {
            this.nextNodeId = node.id;
            this._nextNode = node;
        }
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

    /** Function to update the node's downstream all at once.
     * Should only be called in the case that either the node does not know where the downstream is,
     * OR after about 12 hours have passed.
     * @private
     * @returns {Number} OK or ERR_NOT_FOUND
     */
    _updateDownstream() {
        // If this node is a final node, update and return.
        if (this.finalDrop || this.nodeType == 'Final') {
            this.finalDrop = true;
            this.nodeType = 'Final';
            this.finalNodeId = this.id;
            this.finalNode = null;
            this.finalDistance = 0;
            this.nextNodeId = this.id;
            this.nextNode = null;
            this.nextDistance = 0;
            return OK;
        }
        let completeSelection = {
            finalDistance: 99999999,
            finalNodeId: "",
            finalNode: {},
            finalRoute: [],
            nextDistance: 99999999,
            nextNodeId: '',
            nextNode: {},
            nextPath: []
        }
        let finalOptions = [];
        // Make sure there are other nodes in the game
        if (Game.Nodes.length > 0) {
            for (let node in Game.Nodes) {
                if (node.finalDrop) {
                    finalOptions.push(node);
                }
            }
            // Make sure we found some final drop options
            if (finalOptions.length > 0) {
                let testingRoute = [];
                // Loop through our choices, looking for the closest one
                for (let option in finalOptions) {
                    // Check to make sure the straight line distance to the option is
                    // less the current path distance to the best selection.
                    // Should save a bit of CPU.
                    if (Game.map.getRoomLinearDistance(this.room.name, option.room.name).length < completeSelection.finalDistance) {
                        testingRoute = Game.Map.findRoute(this.room.name, option.room.name);
                        if (testingRoute.length < completeSelection.finalDistance) {
                            completeSelection.finalDistance = testingRoute.length;
                            completeSelection.finalNodeId = option.id;
                            completeSelection.finalNode = option;
                            completeSelection.finalRoute = testingRoute;
                        }
                    }
                }
                // Having picked the finalNode, w/ Id and Room Route already on hand,
                // lets find the nextNode.
                let nextOptions = [];
                // Add any options from this room
                for (let node of Game.Nodes) {
                    if (node.room.name == this.room.name || node.id != this.id) {
                        nextOptions.push(node);
                    }
                }
                // Add any options along the way
                for (let route in completeSelection.finalRoute) {
                    for (let node of Game.Nodes) {
                        if (node.room.name == route.name) {
                            nextOptions.push(node);
                        }
                    }
                }
                // Make sure we found some options
                if (nextOptions.length > 0) {
                    let testDistance = 0;
                    let testPath = [];
                    for (let option in nextOptions) {
                        // check to see if the estimated Linear Distance is less then the current nextDistance
                        // Should save some CPU
                        let estLinearTiles = Game.map.getRoomLinearDistance(this.room.name, option.room.name)*50;
                        if (estLinearTiles < completeSelection.nextDistance) {
                            testPath = PathFinder.search(this.pos, {pos: option.pos, range: 1})
                            testDistance = testPath.length;
                            if (testDistance < completeSelection.nextDistance) {
                                completeSelection.nextDistance = testDistance;
                                completeSelection.nextNodeId = option.id;
                                completeSelection.nextNode = option;
                                completeSelection.nextPath = testPath;
                            }
                        }
                    }
                    // Update the Node with the selected options
                    for (let prop of completeSelection) {
                        this[prop] = completeSelection[prop];
                    }
                    return OK;
                }
            }
        }
        // This code can only be reached if there are no nodes, no final drops, or no nodes on route to the final drop.
        return ERR_NOT_FOUND;
    } // End of _updateDownstream()

} // End of class Node

let test = new Node(false, "1");

test.fin


/** Nodes form the backbone of resource transportation routes for the Omni-Union.
 *
 * Nodes are delivery points, production points, and can group a number of features and structures together.
 * Nodes can be upgraded (spawn delivery node to storage delivery node) or are gated (mineral nodes can't have miners or extractors until the room is at level 6)
 *
 * Due the many types and usages of nodes we will need to be able to create nodes from many
 * different types of information and run and number of checks to make sure there is not a node there already
 * plus upgrade the nodes functionality as room levels and needs increase.
 */

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

module.exports = BasicNode;