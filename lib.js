/** A library of useful functions*/

/** Exported Functions
 * @exports lib
*/
module.exports = {

  /** Given a roomName and a maxDistance from roomName, generates a array of room names within the maxDistance
      * @param {string} roomName
      * @param {number} maxDistance
      * @param {boolean} [countSK = false]
      * @param {boolean} [countHighway = false]
      * @returns {array} array of roomNames
      */
  roomMapper: function(roomName, maxDistance, countSK = false, countHighway = false) {
      //this function builds an array of rooms that are pathable with
      //a distance <= maxDistance.
      let roomList = [];
      let currentDistance = 0;
      let startingRoom = roomName;
      roomList.push(roomName);

      function scanning(roomName, maxDistance, currentDistance, startingRoom, countSK, countHighway) {
      //this recursive function is going to use an the passed currentDistance
      //until that distance == maxDistance, then it is going to recheck the
      //distance to see if there is a closer path
      currentDistance++;
      //check to see if we are at max distance
      if (currentDistance == maxDistance) {
          //get the path from startingRoom to this room
          let path = Game.map.findRoute(startingRoom, roomName);
          let pathDistance;
          //max sure we got a path
          if (path != -2) {
          //get the path distance
          pathDistance = path.length;
          //check to see if the path to this room is less then the tracked distance
          if (pathDistance < currentDistance) {
              //if the path distance is less then the current distance, reset currentDistance
              //to pathDistance
              currentDistance = pathDistance;
          }
          }
      }

      //now make sure we can reach the next rooms
      if (currentDistance < maxDistance) {
          //get the exits
          let adjacentExits = Game.map.describeExits(roomName);
          //convert exits to room names
          let currentScan = Object.keys(adjacentExits)
                                  .map(function(key) {
                                  return adjacentExits[key];
                                  });

          //for each name found, add the room
          currentScan.forEach(roomName => {
          //checks to make sure it is not in the list, and it is a normal room
          let count = false
          let roomType = _getRoomType(roomName);
          if (!roomList.includes(roomName) && Game.map.getRoomStatus(roomName).status == 'normal') {
              count = true;
          }
          if (count && !countSK && roomType == ROOM_SOURCE_KEEPER) {
              count = false;
          }
          if (count && !countHighway && (roomType == ROOM_CROSSROAD || roomType == ROOM_HIGHWAY)) {
              count = false;
          }
          if (count) {
              //add the room to the list
              roomList.push(roomName);
              //scan the room
              scanning(roomName, maxDistance, currentDistance, startingRoom, countSK, countHighway);
          }
          });
      }
      }//end of scanning

  scanning(roomName, maxDistance, currentDistance, startingRoom, countSK, countHighway);
  return roomList;
  },// end of roomMapper


  /** Finds the MAX value in a multidimensional array
    * @param {Array} arr  - the input array
    * @returns {number} Max Value of Array
    */
  getMaxOfArray: function(arr) {
    //console.log(arr);
    let flat = arr.flat(Infinity)
    //console.log(flat);
    let result = flat.reduce((a, b) => {
      return a > b ? a : b
    });
    //console.log(result);
    if (isNaN(result)) {
      console.log ('getMaxOfArray returned NaN ' + result + " See: " + arr);
      return null;
    }
    return result;
  },// end of getMaxOfArray

  /** Finds the top x values in a multidimensional Array
   * @param {Array} arr - the input array
   * @param {number} [top=1] the top highest values
   * @returns {Array} array of top highest values
   */
  getTopOfArray: function(arr, top=1) {
    let flat = arr.flat(Infinity);
    let topValues = flat.sort((a, b) => b - a).slice(0, top);
    return topValues;
  },

  /** Finds the Index of Multidimensional Array value (returns first matching value as an array of coordinates)
    * @param {Array} arr - the input array
    * @param {number|string} k - the value to search
    * @returns {number[]} The x, y, z ... of the requested value
    */
  getIndexPathOf: function(arr, k) {
    // If we're not array, return null;
    if (!Array.isArray(arr)) {
      return null;
    }

    // If our item is directly within our current
    // array, return it's index as an array.
    var shallowIndex = arr.indexOf(k);
    if (shallowIndex > -1)
      return [shallowIndex];

    // Search through our current array, recursively
    // calling our getIndexPathOf with the current value.
    for (var i = 0, l = arr.length; i < l; i++) {
      var path = this.getIndexPathOf(arr[i], k);
      if (path != null) {
        // If we found the path, prepend the current index
        // and return.
        path.unshift(i);
        return path;
      }
    }

    // If nothing was found, return null.
    return null;
  }, //end of getIndexPathOf

  uniqueValues: function(arr) {
    let outputArray = arr.filter(function (v, i, self) {

      // It returns the index of the first
      // instance of each value
      return i == self.indexOf(v);
    });
    return outputArray;
  },

  // https://stackoverflow.com/a/1830844
  isNumeric: function(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  },


}; // End of Exported Functions

/** Internal Use Functions */

/** Decide the Room Type */
function _getRoomType(roomName) {
  const [EW, NS] = roomName.match(/\d+/g)
  if (EW%10 == 0 && NS%10 == 0) {
    return ROOM_CROSSROAD
  }
    else if (EW%10 == 0 || NS%10 == 0) {
    return ROOM_HIGHWAY
  }
  else if (EW%5 == 0 && NS%5 == 0) {
    return ROOM_CENTER
  }
  else if (Math.abs(5 - EW%10) <= 1 && Math.abs(5 - NS%10) <= 1) {
    return ROOM_SOURCE_KEEPER
  }
  else {
    return ROOM_STANDARD
  }
}//end of getRoomType

Object.defineProperty(Array.prototype, 'flat', {
  value: function(depth = 1) {
    return this.reduce(function (flat, toFlatten) {
      return flat.concat((Array.isArray(toFlatten) && (depth>1)) ? toFlatten.flat(depth-1) : toFlatten);
    }, []);
  }
});