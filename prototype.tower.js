StructureTower.prototype.run =
  function () {
    let target;
    //Closest hostile healers

    target = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
      filter: h => h.getActiveBodyparts(HEAL) > 0 && h.pos.findInRange(FIND_HOSTILE_CREEPS, 3) > 0
    });

    //closest hostile attacker
    if (target == undefined) {
      target = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
        filter: h => h.getActiveBodyparts(ATTACK) > 0 || h.getActiveBodyparts(RANGED_ATTACK) > 0
      });
    }
    //closest hostiles
    if (target == undefined) {
      target = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    }
    if (target != undefined) {
      this.attack(target);
      return;
    }

    //closest healable creep
    target = this.pos.findClosestByRange(FIND_MY_CREEPS, {
      filter: c => c.hits < c.hitsMax
    });
    if (target != undefined) {
      this.heal(target);
      return;
    }

    //greatest need repairable my structure
    let repair_targets = this.room.find(FIND_MY_STRUCTURES, {
      filter: s => (s.hits < s.hitsMax && s.structureType != STRUCTURE_RAMPART) ||
                    (s.structureType == STRUCTURE_RAMPART && s.hits/s.hitsMax < .0001)
    });
    _.sortBy(repair_targets, [function(s) {return s.hits/s.hitsMax;}]);
    target = repair_targets[0]
    if (target != undefined) {
      this.repair(target);
      return;
    }

  }