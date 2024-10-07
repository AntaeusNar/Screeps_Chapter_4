/** The Omni-Union. */

/** Required Code */
const { masterTasks } = require('./lib.creepsTasksMaster');
const Node = require('./module.Nodes.js');
require('./prototype.spawn');
require('./prototype.tower');


/** Global Reset Check */
// Omni-Union Memory
if (Memory.OmniUnion == undefined) {
    Memory.OmniUnion = {};
}

/** Class defining the Omni-Union
 * The Omni-Union directs all Virtual Intelligences (VIs)
 */
class OmniUnion {

    /** Creates the Omni-Union
     * @returns {Object} OmniUnion
     */
    constructor() {

        // Create the empty Nodes Object
        this.Nodes = {};
        if (this.memory.Nodes != undefined) {
            for (let Node in this.memory.Nodes) {
                this.Nodes[Node] = new Node({id: Node});
            }
        }

        return this;
    }

    /** Omni-Union's main function */
    run(targetNumberOfCreeps) {
        /** Order of Operations
         * Clean Memory
         * Run Controllers
         * Run Logistics
         * Run Towers
         * Run TaskMaster
         * Run Creeps w/ Tasks and w/ Roles
         * Run Spawns
         * Sell Pixels
         */

        // Clean Memory
        this._memoryClean();

        // Run Controllers

        // Run Logistics

        // Run Towers
        this._towerRun();

        // Run the TaskMaster
        let creeps = _.values(Game.creeps);
        let idleCreeps = _.filter(creeps, creep => creep.isIdle && !creep.spawning);
        if (idleCreeps != null && idleCreeps.length > 0) {
            masterTasks(idleCreeps);
        }

        // Run all creeps
        for (let creep of creeps) {
            if (creep.run) {
                // Task based creeps
                creep.run();
            } else if (creep.runRole) {
                // Role based creeps
            } else {
                console.log("ERROR: Creep " + creep.name + " is neither task based or role based.");
            }
        }

        // Run Spawns
        // TODO: Split into separate file
        let spawn = Game.spawns['Spawn1'];
        let maxEnergy = spawn.room.energyAvailable;
        let spawnPeon = false;
        let spawnMessage = "";
        if (creeps.length < targetNumberOfCreeps) {
            //Can have more creeps based on left over cpu
            spawnMessage = "CPU can support more Creeps,";
            if (spawn.spawning == null) {
                //Spawner is ready
                spawnMessage = spawnMessage + " spawner is ready,";
                if (idleCreeps == null | idleCreeps.length == 0) {
                    //All Peons are busy
                    spawnMessage = spawnMessage + " there is more work then Peons,";
                    if (maxEnergy >= 250) {
                        spawnMessage = spawnMessage + " and we have enough energy for a basic Peon.";
                        spawnPeon = true;
                    } else {
                        spawnMessage = spawnMessage + " but there is not enough energy.";
                    }
                } else {
                    spawnMessage = spawnMessage + " but there are idle Peons.";
                }
            } else {
                spawnMessage = spawnMessage + " but the Spawner is busy.";
            }
        }

        if (spawn.memory.status == undefined) {
            spawn.memory.status = spawnMessage;
            console.log(spawnMessage);
        }
        if (spawn.memory.status != spawnMessage) {
            spawn.memory.status = spawnMessage;
            console.log(spawnMessage);
        }

        if (spawnPeon) {
            let bodyUnit = [WORK, CARRY, MOVE, MOVE];
            let bodyUnitCost = 250;
            let bodySize = Math.min(Math.floor(maxEnergy/bodyUnitCost), 12);
            let realBody = [];
            for (let i = 0; i < bodySize; i++) {
                realBody = realBody.concat(bodyUnit);
            }
            let name = 'Peon' + Game.time;
            console.log("Spawning " + name + " with a body size of " + realBody.length)
            spawn.customSpawnCreep(realBody, name);
        }

        // Sell Pixels
        this._pixelSale();

    } /** End of Omni-Union's Main Function */

    /** Omni-Union's public Methods and Properties */

        /** Gets the Omni-Union's Memory
         * @returns {Object} Omni-Union's memory
         */
        get memory() {
            return Memory.OmniUnion;
        }

        /** Sets the Omni-Union's memory
         * @param {*} value
         */
        set memory(value) {
            Memory.OmniUnion = value;
        }

    /** Omni-Union's private Methods and Properties */

        /** Memory Clean */
        _memoryClean() {
            for (let name in Memory.creeps) {
                if (!Game.creeps[name]) {
                    delete Memory.creeps[name];
                    console.log('Info: Cleaning non-existing creep memory: ', name);
                }
            }
        }

        /** Pixel Sale */
        _pixelSale() {
            if (Game.cpu.bucket == 10000) {
                Game.cpu.generatePixel();
                console.log('INFO: Got a New Pixel.');
            }
        }

        /** Run the towers */
        _towerRun() {
            let towers = _.filter(Game.structures, s => s.structureType == STRUCTURE_TOWER);
            for (let tower of towers) {
                tower.run();
            }
        }

}// End of the Omni-Union Class

module.exports = OmniUnion;