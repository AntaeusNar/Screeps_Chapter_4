/** This Module will allow for the automatic placement of buildings.
 * Phase one will be the construction of the central hub around the spawn from level 2 to 8 of the room controller.
 * Phase two will include room level defenses, including walls, ramparts, and towers.
 * Phase three will include additional advanced units
 */

// Working Backwards
// [x] will need location(s) to place the construction site
// [x] will need to ensure that the room's control level is enough to place the construction sites
// [x] will need to group those locations together (templates)
// [x] switch to using a human-readable transform
// [ ] will need to have a 'center' in the actual room to position the template
// [ ] will need to ensure there is enough space to place the layout
// [ ] will need to ensure the layout is getting placed in an optimal place

/** Concept posted 10 October 2017 by @sparr https://github.com/screepers/screeps-snippets/blob/master/src/misc/JavaScript/bunkerLayoutsHumanReadable.js */
/**
 * maps letters/characters to structures types and vice versa
 * @constant
 */
const layoutKey = {
    'A': STRUCTURE_SPAWN,
    'N': STRUCTURE_NUKER,
    'K': STRUCTURE_LINK,
    'L': STRUCTURE_LAB,
    'E': STRUCTURE_EXTENSION,
    'S': STRUCTURE_STORAGE,
    'T': STRUCTURE_TOWER,
    'O': STRUCTURE_OBSERVER,
    'M': STRUCTURE_TERMINAL,
    'P': STRUCTURE_POWER_SPAWN,
    '.': STRUCTURE_ROAD,
    'C': STRUCTURE_CONTAINER,
    'R': STRUCTURE_RAMPART,
    'W': STRUCTURE_WALL,
    'F': STRUCTURE_FACTORY
};

/**
 * All Human Readable Templates SHALL be an odd square (3x3, 5x5, 7x7, 9x9, 11x11 etc).
 * This allows the system to find and ID the center, used for placement.
 */

/**
 * A machine readable template is an array of objects.  Each object has a structureType, and a array of pos (x, y cords)
 * @typedef {Object[]} strLoc
 * @property {structureType} strLoc.structureType - One of the STRUCTURE_* constants
 * @property {Object[]} strLoc - array of x, y cords relative to center of the template
 */

/**
 * HQ Template (rotatable square 5x5)
 * @constant
 */
const HQTemplate = [
    'TO..T',
    'T.A.T',
    'TN.FT',
    ' MSK ',
    '     '
];

/**
 * Extension Template (diagonal 3x3, square 5x5)
 * @constant
 */
const extensionTemplate = [
    '  .  ',
    ' .E. ',
    '.EEE.',
    ' .E. ',
    '  .  '
];


/**
 * Lab Template (rotatable diagonal 4x4)
 * @constant
 */
const labTemplate = [
    ' LL.',
    'LL.L',
    'L.LL',
    '.LL '
];

/**
 * Function to transform the human readable template to a machine readable formate
 * @param {String[]} hTemp - human readable template
 * @returns {strLoc}
 */
function humanToMachineLayout(hTemp) {
    const height = hTemp.length;
    const width = hTemp[0].length;
    const top = height / 2 | 0;
    const left = width / 2 | 0;

    let mTemp = [];
    for (let y = 0; y < height; y ++) {
        for (let x =0; x < width; x++) {
            const char = hTemp[y][x];
            // TODO: finsih
        }
    }

}

/**
 * Function to build construction sites from a template
 * @param {RoomPosition} center - the center of the template
 * @param {strLoc} template - the template to be built
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