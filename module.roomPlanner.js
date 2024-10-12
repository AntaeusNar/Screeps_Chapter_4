/** This Module will allow for the automatic placement of buildings.
 * Phase one will be the construction of the central hub around the spawn from level 2 to 8 of the room controller.
 * Phase two will include room level defenses, including walls, ramparts, and towers.
 * Phase three will include additional advanced units
 */

/**
 * a diagonal 5x5 template for the placement of a plus sign of extensions with surrounding roads
 * @constant
  */
const extensionTemplate = [
    {
        "structureType": STRUCTURE_EXTENSION,
        "pos": [{"x": 0, "y": 0}, {"x": 0, "y": 1}, {"x": 0, "y": -1}, {"x": 1, "y": 0}, {"x": -1, "y": 0}]
    },
    {
        "structureType": STRUCTURE_ROAD,
        "pos": [{"x": 2, "y": 0}, {"x": 1, "y": 1}, {"x": 0, "y": 2}, {"x": -1, "y": 1}, {"x": -2, "y": 0}, {"x": -1, "y": -1}, {"x": 0, "y": -2}, {"x": 1, "y": -1}]
    }
]

/**
 * Function to build construction sites from a template
 * @param {RoomPosition} center - the center of the template
 * @param {Array} template - the template to be built
 * @returns {Number} OK or ERR
 */
function buildFromTemplate(center, template) {
    let room = Game.rooms[center.roomName];
    let filter = [];
    // Collect the count of structures we can still build in this room from the template
    let countCheck = _.filter(template, (s) => ![STRUCTURE_CONTAINER, STRUCTURE_RAMPART, STRUCTURE_WALL, STRUCTURE_ROAD].includes(s.structureType) &&
        CONTROLLER_STRUCTURES[s.structureType][room.controller.level] > _.filter(room.structures))
}


// TODO: add room prototype for collecting all current structures