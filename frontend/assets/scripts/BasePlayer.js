module.export = cc.Class({
  extends: cc.Component,

  properties: {
    speed: {
      type: cc.Float,
      default: 33 // In "GMT milliseconds"
    },
    lastMovedAt: {
      type: cc.Float,
      default: 0 // In "GMT milliseconds"
    },
    eps: {
      default: 0.10,
      type: cc.Float
    },
    magicLeanLowerBound: {
      default: 0.414, // Tangent of (PI/8).
      type: cc.Float
    },
    magicLeanUpperBound: {
      default: 2.414, // Tangent of (3*PI/8).
      type: cc.Float
    },
  },

  // LIFE-CYCLE CALLBACKS:
  ctor() {
    const self = this;
    self.mapNode = null;
    self.contactedControlledPlayers = [];
    self.contactedNPCPlayers = [];
    self.contactedBarriers = [];
    self.coveringShelterZReducers = [];

    self.computedNewDifferentPosLocalToParentWithinCurrentFrame = null;
    self.actionMangerSingleton = new cc.ActionManager();
    self.scheduledDirection = {
      dx: 0.0,
      dy: 0.0
    };

    self.activeDirection = {
      dx: 0.0,
      dy: 0.0
    };

    self.animComp = null;
  },

  start() {
  },

  onLoad() {
    const self = this;
    self.animComp = this.node.getComponent(cc.Animation);
    self._playAnimComp();
  },

  scheduleNewDirection(newScheduledDirection, forceAnimSwitch) {
    if (!newScheduledDirection) {
      return;
    }
    if (forceAnimSwitch || null == this.scheduledDirection || (newScheduledDirection.dx != this.scheduledDirection.dx || newScheduledDirection.dy != this.scheduledDirection.dy)) {
      this.scheduledDirection = newScheduledDirection;
      const clipKey = newScheduledDirection.dx.toString() + newScheduledDirection.dy.toString()
  
      if(!this.clips){
        return;
      }
      let clip = this.clips[clipKey];
      if (!clip) {
        // Keep playing the current anim.
        if (0 !== newScheduledDirection.dx || 0 !== newScheduledDirection.dy) {
          console.warn('Clip for clipKey === ' + clipKey + ' is invalid: ' + clip + '.');
        }
      } else {
        this._playAnimComp(clip);
      }
    }
  },

  _playAnimComp(clip, forceReplay=true) {
    const self = this;
    if (self.animComp == null) {
      return false;
    }
    if (self.animComp instanceof cc.Animation) {
      self.animComp.play(clip);
    } else if (self.animComp instanceof dragonBones.ArmatureDisplay) {
      self.animComp._init();
      let animationNames = self.animComp.getAnimationNames(self.animComp.armatureName);
      if (animationNames.indexOf(clip) == -1) {
        console.warn('animation for NPC is not found:', self.animComp.armatureName, clip);
        clip = animationNames[0] || null;
      }
      if (null != clip && self.animComp.animationName == clip && !forceReplay) {
        return;
      }
      if (null == clip && !forceReplay) {
        return;
      }
      self.animComp.playAnimation(null == clip ? self.animComp.animationName : clip);  
    }
  },

  _addCoveringShelterZReducer(compId) {
    const self = this;
    for (let coveringShelterZReducer of self.coveringShelterZReducers) {
      if (coveringShelterZReducer == compId) {
        return false;
      }
    }
    self.coveringShelterZReducers.push(compId);
    return true;
  },

  _removeCoveringShelterZReducer(compId) {
    const self = this;
    self.coveringShelterZReducers = self.coveringShelterZReducers.filter((coveringShelterZReducer) => {
      return coveringShelterZReducer != compId;
    });
    return true;
  },

  _addContactedBarrier(collider) {
    const self = this;
    for (let contactedBarrier of self.contactedBarriers) {
      if (contactedBarrier.id == collider.id) {
        return false;
      }
    }
    self.contactedBarriers.push(collider);
    return true;
  },

  _removeContactedBarrier(collider) {
    const self = this;
    self.contactedBarriers = self.contactedBarriers.filter((contactedBarrier) => {
      return contactedBarrier.id != collider.id;
    });
    return true;
  },

  _addContactedControlledPlayers(comp) {
    const self = this;
    for (let aComp of self.contactedControlledPlayers) {
      if (aComp.uuid == comp.uuid) {
        return false;
      }
    }
    self.contactedControlledPlayers.push(comp);
    return true;
  },

  _removeContactedControlledPlayer(comp) {
    const self = this;
    self.contactedControlledPlayers = self.contactedControlledPlayers.filter((aComp) => {
      return aComp.uuid != comp.uuid;
    });
    return true;
  },

  _addContactedNPCPlayers(comp) {
    const self = this;
    for (let aComp of self.contactedNPCPlayers) {
      if (aComp.uuid == comp.uuid) {
        return false;
      }
    }
    self.contactedNPCPlayers.push(comp);
    return true;
  },

  _removeContactedNPCPlayer(comp) {
    const self = this;
    self.contactedNPCPlayers = self.contactedNPCPlayers.filter((aComp) => {
      return aComp.uuid != comp.uuid;
    });
    return true;
  },

  _canMoveBy(vecToMoveBy) {
    const self = this;
    const computedNewDifferentPosLocalToParentWithinCurrentFrame = self.node.position.add(vecToMoveBy);
    self.computedNewDifferentPosLocalToParentWithinCurrentFrame = computedNewDifferentPosLocalToParentWithinCurrentFrame;

    if (tileCollisionManager.isOutOfMapNode(self.mapNode, computedNewDifferentPosLocalToParentWithinCurrentFrame)) {
      return false;
    }

    const currentSelfColliderCircle = self.node.getComponent(cc.CircleCollider);
    let nextSelfColliderCircle = null;
    if (0 < self.contactedBarriers.length || 0 < self.contactedNPCPlayers.length) {
      /* To avoid unexpected buckling. */
      const mutatedVecToMoveBy = vecToMoveBy.mul(2);
      nextSelfColliderCircle = {
        position: self.node.position.add(mutatedVecToMoveBy).add(
          currentSelfColliderCircle.offset
        ),
        radius: currentSelfColliderCircle.radius,
      };
    } else {
      nextSelfColliderCircle = {
        position: computedNewDifferentPosLocalToParentWithinCurrentFrame.add(currentSelfColliderCircle.offset),
        radius: currentSelfColliderCircle.radius,
      };
    }

    for (let contactedBarrier of self.contactedBarriers) {
      let contactedBarrierPolygonLocalToParentWithinCurrentFrame = [];
      for (let p of contactedBarrier.points) {
        contactedBarrierPolygonLocalToParentWithinCurrentFrame.push(contactedBarrier.node.position.add(p));
      }
      if (cc.Intersection.polygonCircle(contactedBarrierPolygonLocalToParentWithinCurrentFrame, nextSelfColliderCircle)) {
        return false;
      }
    }

    return true;

  /*
   * In a subclass, use 
   * 
   * _canMoveBy(vecToMoveBy) {
   *   BasePlayer.prototype._canMoveBy.call(this, vecToMoveBy);
   *   // Customized codes.
   * }
   *
   * Reference http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/class.html#override
   */
  },

  _calculateVecToMoveByInDir(elapsedTime, sDir) {
    const self = this;

    if (0 == sDir.dx && 0 == sDir.dy) {
      return cc.v2();
    }

    const distanceToMove = (self.speed * elapsedTime);
    const denominator = Math.sqrt(sDir.dx * sDir.dx + sDir.dy * sDir.dy);
    const unitProjDx = (sDir.dx / denominator);
    const unitProjDy = (sDir.dy / denominator);
    return cc.v2(
      distanceToMove * unitProjDx,
      distanceToMove * unitProjDy,
    );
  },

  _calculateVecToMoveBy(elapsedTime) {
    const self = this;
    const sDir = self.scheduledDirection;
    return self._calculateVecToMoveByInDir(elapsedTime, sDir);
  },

  update(dt) {
    if (this.mapIns.isPaused()) {
      this.node.pauseAllActions();
    } else {
      this.node.resumeAllActions();
    }
  },

  lateUpdate(dt) {
    const self = this;
    const now = new Date().getTime();
    self.activeDirection = {
      dx: self.scheduledDirection.dx, 
      dy: self.scheduledDirection.dy, 
    } // Deliberately making a value copy -- YFLu, 2019-11-20.
    self.lastMovedAt = now;
  },

  onCollisionEnter(other, self) {
    const playerScriptIns = self.getComponent(self.node.name);
    const mapIns = playerScriptIns.mapNode.getComponent(playerScriptIns.mapNode.name);
    switch (other.node.name) {
      case "NPCPlayer":
        playerScriptIns._addContactedNPCPlayers(other);
        break;
      case "PolygonBoundaryBarrier":
        playerScriptIns._addContactedBarrier(other);
        break;
      case "PolygonBoundaryTransparent":
        const transparentNode = other.node;
        if (false == transparentNode.pTiledLayer.node.active || 0 == transparentNode.pTiledLayer.node.opacity) {
          break;
        }
        window.previewShelter(mapIns, playerScriptIns.mapNode, transparentNode.pTiledLayer, transparentNode.tileDiscretePos);
        if(undefined == transparentNode.affectedAccount){
          transparentNode.affectedAccount = 0;
        }
        transparentNode.affectedAccount++;
        break;
      case "PolygonBoundaryShelterZReducer":
        playerScriptIns._addCoveringShelterZReducer(other._id);
        if (1 == playerScriptIns.coveringShelterZReducers.length) {
          self.node.origZIndex = (window.CORE_LAYER_Z_INDEX.PLAYER - 3);
        }
        break;
      default:
        break;
    }
  },

  onCollisionStay(other, self) {
    // TBD.
  },

  onCollisionExit(other, self) {
    const playerScriptIns = self.getComponent(self.node.name);
    const mapIns = playerScriptIns.mapNode.getComponent(playerScriptIns.mapNode.name);
    switch (other.node.name) {
      case "NPCPlayer":
        playerScriptIns._removeContactedNPCPlayer(other);
        break;
      case "PolygonBoundaryBarrier":
        playerScriptIns._removeContactedBarrier(other);
        break;
      case "PolygonBoundaryTransparent":
        if (false == other.node.pTiledLayer.node.active || 0 == other.node.pTiledLayer.node.opacity ) break;
        other.node.affectedAccount--;
        if(0 == other.node.affectedAccount) { 
          //如果该透明化建筑中还有npc, 则不隐藏shelter
          window.cancelPreviewingOfShelter(mapIns, playerScriptIns.mapNode, other.node.pTiledLayer, other.node.tileDiscretePos);
        }
        break;
      case "PolygonBoundaryShelterZReducer":
        playerScriptIns._removeCoveringShelterZReducer(other._id);
        if (0 == playerScriptIns.coveringShelterZReducers.length) {
          self.node.origZIndex = window.CORE_LAYER_Z_INDEX.PLAYER;
        }
        break;
      default:
        break;
    }
  },

  _generateRandomDirection() {
    return ALL_DISCRETE_DIRECTIONS_CLOCKWISE[Math.floor(Math.random() * ALL_DISCRETE_DIRECTIONS_CLOCKWISE.length)];
  },

  _generateRandomDirectionExcluding(toExcludeDx, toExcludeDy, withJumpingDt) {
    let randomDirectionList = [];
    let exactIdx = null;
    for (let ii = 0; ii < ALL_DISCRETE_DIRECTIONS_CLOCKWISE.length; ++ii) {
      if (toExcludeDx != ALL_DISCRETE_DIRECTIONS_CLOCKWISE[ii].dx || toExcludeDy != ALL_DISCRETE_DIRECTIONS_CLOCKWISE[ii].dy) continue;
      exactIdx = ii;
      break;
    }

    for (let ii = 0; ii < ALL_DISCRETE_DIRECTIONS_CLOCKWISE.length; ++ii) {
      if (ii == exactIdx) continue;
      const roughDtPerFrame = (null == withJumpingDt ? 1/10.0 : withJumpingDt);
      const extrapolatedVecToMove = this._calculateVecToMoveByInDir(roughDtPerFrame, ALL_DISCRETE_DIRECTIONS_CLOCKWISE[ii]);
      if (!this._canMoveBy(extrapolatedVecToMove)) continue;
      randomDirectionList.push(ALL_DISCRETE_DIRECTIONS_CLOCKWISE[ii]);
    }
    return randomDirectionList[Math.floor(Math.random() * randomDirectionList.length)];
  },
});
