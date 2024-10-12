/** This Module will allow for the automatic placement of buildings.
 * Phase one will be the construction of the central hub around the spawn from level 2 to 8 of the room controller.
 * Phase two will include room level defenses, including walls, ramparts, and towers.
 * Phase three will include additional advanced units
 */

// Working Backwards
// [x] will need location(s) to place the construction site
// [x] will need to ensure that the room's control level is enough to place the construction sites
// [x] will need to group those locations together (templates)
// [ ] will need to have a 'center' in the actual room to position the template
// [ ] will need to ensure there is enough space to place the layout
// [ ] will need to ensure the layout is getting placed in an optimal place

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
 * Function to find the best center for any given template
 */
/**
 * Function to build construction sites from a template
 * @param {RoomPosition} center - the center of the template
 * @param {Array} template - the template to be built
 * @returns {Number} OK or ERR
 */
function buildFromTemplate(center, template) {
    let room = Game.rooms[center.roomName];
    // Collect the count of structures we can still build in this room from the template
    let countCheck = _.filter(template, (s) => CONTROLLER_STRUCTURES[s.structureType][room.controller.level] > _.filter(room.structures, (r).structureType === s.structureType).length + _.filter(room.constructionSites, (r) => r.structureType === s.structureType));
    if (!countCheck.length) {
        return ERR_RCL_NOT_ENOUGH;
    }
    for (let structure of countCheck) {
        for (let buildPos of structure.pos) {
            let pos = new RoomPosition(center.x + buildPos.x, center.y + buildPos.y, room.name);
            let result = pos.createConstructionSite(structure.structureType);
            if (result != OK) {
                return result;
            }
        }
    }
    return OK;
}


/** Prototype Changes */

Object.defineProperty(Room.prototype, 'constructionSites', {
    get: function () {
        if (!this._constructionSites) {
            this._constructionSites = _.filter(Game.constructionSites, (s) => s.pos.roomName === this.name);
        }
        return this._constructionSites;
    }
});

Object.defineProperty(Room.prototype, 'structures', {
    get: function () {
        if (!this._structures) {
            this._structures = this.find(FIND_STRUCTURES);
        }
        return this._structures;
    }
});