/** The Prime is a class that is merged with a central controller and operates a sector.  A sector is defined as the rooms assigned to a Prime
 * The Prime with perform in sector planning of buildings, and add tasks for the TaskMaster to prioritize and complete.
 * The Primes goals are to:
 * 1) upgrade the central controller to 8th level
 * 2) defend/expand its sector's territory
 * 3) plan and layout buildings
 * 4) identify locations for new Primes
 *
 * Each Prime will NOT directly control the creeps or the towers in its sector, but will control everything else.  It will be able to add tasks for the TaskMaster to work on.
 */

/** Global Reset Check */
// Prime's Memory
if (Memory.primes == undefined) {
    Memory.primes = {};
}

/** Class defining the Primes */
class Prime {

    /** Creates the Prime
     * @returns {Object} Prime
     */
    constructor(primeName, primeRoom) {
        this.name = primeName;
        this.room = primeRoom;
        this.controller = Game.rooms[this.room].controller;
        return this;
    }

    /** Prime's public Methods and Properties */

        /** Gets the Prime's Memory
         * @returns {Object} Prime's Memory
         */
        get memory() {
            return Memory.primes[this.name];
        }

        /** Sets the Prime's Memory
         * @param {*} value
         */
        set memory(value) {
            Memory.primes[this.name] = value;
        }

}