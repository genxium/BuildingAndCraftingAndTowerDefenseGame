const StatefulBuildableFollowingNpc = require("./StatefulBuildableFollowingNpc");
const BasePlayer = require("./BasePlayer");

window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE = {
  MOVING_OUT: 1,
  MOVING_IN: 2, // This state will be active when "boundStatefulBuildable" is moved to a new "fixedSpriteCentreContinuousPos" where an available "NewGrandSrc" can be found.

  STUCK_WHILE_MOVING_OUT: 3,
  STUCK_WHILE_MOVING_IN: 4,

  STAYING_WHILE_MOVING_OUT: 5,
  STAYING_WHILE_MOVING_IN: 6,

  STAYING_AT_DESTINATION_AFTER_MOVING_IN: 7,
  ATTACKING_AT_DESTINATION_AFTER_MOVING_IN: 8,

  STAYING_AT_DESTINATION_AFTER_MOVING_OUT: 9,
};

module.export = cc.Class({
  extends: StatefulBuildableFollowingNpc,

  ctor() {
    this.clips = {
      '01': 'TopRight',
      '0-1': 'BottomLeft',
      '-20': 'TopLeft',
      '20': 'BottomRight',
      '-21': 'TopLeft',
      '21': 'TopRight',
      '-2-1': 'BottomLeft',
      '2-1': 'BottomRight'
    };
    this.state = STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.MOVING_IN;
    this.movementStops = null;
    this.homePosInMapNode = null;
    this.drawer = null;
    this.finishAttackTimeout = null;
  
    this.baseHp = 0;
    this.remainingHp = 0;
  
    this.onCurrentDestinationArrived = null;
  },
  
  properties: {
    stayingAnimNode: {
      override: true,
      visible: false,
      get() {
        const self = this;
        return null == self.animComp ? null : self.animComp.node;
      },
      set() {},
    },
    walkingAnimNode: {
      override: true,
      visible: false,
      get() {
        const self = this;
        return null == self.animComp ? null : self.animComp.node;
      },
      set() {},
    },
  },

  onLoad() {
    const self = this;
    self.baseHp = constants.NPC_BASE_HP[self.speciesName];
    self.remainingHp = self.baseHp;

    self.baseDamage = parseInt(constants.NPC_BASE_DAMAGE[self.speciesName]);
    if (isNaN(self.baseDamage)) {
      self.baseDamage = 0;
    }

    self.baseAttackFps = parseFloat(constants.NPC_BASE_ATTACK_FPS[self.speciesName]);
    if (isNaN(self.baseAttackFps)) {
      self.baseAttackFps = 0;
    }

    self.setAnim(self.speciesName, () => {
      self.scheduleNewDirection(self._generateRandomDirection());
    });

     // addToGlobalShelterChainVerticeMap [begin]
    const ShelterChainColliderNode = self.node.getChildByName('ShelterChainCollider');
    ShelterChainColliderNode.thePlayerNode = self.node;
    self.node.origZIndex = window.CORE_LAYER_Z_INDEX.UN_HIGHLIGHTED_STATEFUL_BUILDABLE_INSTANCE;
    window.addToGlobalShelterChainVerticeMap(self.node);
    // addToGlobalShelterChainVerticeMap [end]
  },

  onDestroy() {
    if (null != this.finishAttackTimeout) {
      clearTimeout(this.finishAttackTimeout);
      this.finishAttackTimeout = null;
    }

    if (null != this._tryToRestartPatrollingTimmer) {
      clearTimeout(this._tryToRestartPatrollingTimmer);
      this._tryToRestartPatrollingTimmer = null;
    }

    const self = this;
    if (null != self.currentDestination) {
      const discretizedDestination = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.currentDestination, cc.v2(0, 0));
      let statefulBuildableAttackingNpcDestinationDictRecord = null;
      if (null != window.reverseStatefulBuildableFollowingNpcDestinationDict[discretizedDestination.x]) {
        statefulBuildableAttackingNpcDestinationDictRecord = window.reverseStatefulBuildableFollowingNpcDestinationDict[discretizedDestination.x][discretizedDestination.y];
      }
      if (null != statefulBuildableAttackingNpcDestinationDictRecord && null != statefulBuildableAttackingNpcDestinationDictRecord[self.node.uuid]) {
        delete statefulBuildableAttackingNpcDestinationDictRecord[self.node.uuid];
      }
    }
    if (null != self.drawer) {
      self.drawer.destroy();
    }
    window.removeFromGlobalShelterChainVerticeMap(self.node);
  },

  transitToStaying(cb) {
    const self = this;
    // Don't execute the calculation of "continuous -> discrete coordinate" before checking the current state.
    let discretizedSelfNodePos = null;
    let discretizedDestination = null;

    switch (this.state) {
      case window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.MOVING_IN:
        discretizedSelfNodePos = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.node.position, cc.v2(0, 0));
        discretizedDestination = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.currentDestination, cc.v2(0, 0));
        if (discretizedSelfNodePos.x == discretizedDestination.x && discretizedSelfNodePos.y == discretizedDestination.y) {
          this.state = window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN;
        } else {
          this.state = window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.STAYING_WHILE_MOVING_IN;
        }
        break;
      case window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.MOVING_OUT:
        discretizedSelfNodePos = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.node.position, cc.v2(0, 0));
        discretizedDestination = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.currentDestination, cc.v2(0, 0));
        if (discretizedSelfNodePos.x == discretizedDestination.x && discretizedSelfNodePos.y == discretizedDestination.y) {
          self.state = window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_OUT;
          self.mapIns.removeAttackingNpc(self);
        } else {
          self.state = window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.STAYING_WHILE_MOVING_OUT;
        }
        break;
      default:
        break;
    }

    self.setAnim(self.speciesName, () => {
      const clipKey = self.clips[self.scheduledDirection.dx.toString() + self.scheduledDirection.dy.toString()];
      self._playAnimComp(clipKey);
      if (cb) {
        cb();
      }
    });
  },

  transitToAttacking(cb) {
    const self = this;
    // Don't execute the calculation of "continuous -> discrete coordinate" before checking the current state.
    let discretizedSelfNodePos = null;
    let discretizedDestination = null;

    switch (this.state) {
      case window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN:
        self.state = window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.ATTACKING_AT_DESTINATION_AFTER_MOVING_IN;
        if (null != self.finishAttackTimeout) {
          clearTimeout(self.finishAttackTimeout);
        }
        self.finishAttackTimeout = setTimeout(() => {
          if (null == self.node || !cc.isValid(self.node)) {
            return; 
          }
          self.refreshCurrentDestination(self.homePosInMapNode);
          self.refreshContinuousStopsFromCurrentPositionToCurrentDestination();
          self.restartFollowing();
        }, 3000);
        break;
      default:
        break;
    }
    self.setAnim(self.speciesName, () => {
      const clipKey = self.clips[self.scheduledDirection.dx.toString() + self.scheduledDirection.dy.toString()];
      self._playAnimComp(clipKey);
      if (cb) {
        cb();
      }
    });
  },

  transitToStuck(cb) {
    const self = this;
    switch (this.state) {
      case window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.MOVING_IN:
        this.state = window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.STUCK_WHILE_MOVING_IN;
        break;
      case window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.MOVING_OUT:
        this.state = window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.STUCK_WHILE_MOVING_OUT;
        break;
      default:
        break;
    }

    self.setAnim(self.speciesName, () => {
      const clipKey = self.clips[self.scheduledDirection.dx.toString() + self.scheduledDirection.dy.toString()];
      self._playAnimComp(clipKey);
      if (cb) {
        cb();
      }
    });
  },

  transitToMoving(cb) {
    const self = this;
    switch (this.state) {
      case window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_OUT:
      case window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.STAYING_WHILE_MOVING_IN:
      case window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.STUCK_WHILE_MOVING_IN:
        this.state = window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.MOVING_IN;
        break;
      case window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN:
      case window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.ATTACKING_AT_DESTINATION_AFTER_MOVING_IN:
      case window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.STAYING_WHILE_MOVING_OUT:
      case window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.STUCK_WHILE_MOVING_OUT:
        this.state = window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.MOVING_OUT;
        break;
      default:
        break;
    }
    self.setAnim(self.speciesName, () => {
      const clipKey = self.clips[self.scheduledDirection.dx.toString() + self.scheduledDirection.dy.toString()];
      self._playAnimComp(clipKey);
      if (cb) {
        cb();
      }
    });
  },

  setAnim(speciesName, cb) {
    const self = this;

    let targetNode = null;
    let targetAnimationClips = null;

    targetNode = self.node.getChildByName(cc.js.formatStr("%s", self.speciesName));
    targetAnimationClips = targetNode.getComponent(dragonBones.ArmatureDisplay);

    if (self.animComp == targetAnimationClips) {
      if (cb) {
        cb(false);
      }
      return;
    }

    if (null != self.animComp) {
      self.animComp.node.active = false;
    }

    self.animComp = targetAnimationClips;
    self.animComp.node.active = true;
    if (cb) {
      cb(true);
    }
  },

  restartFollowing() {
    const self = this;
    if (null == self.node || !cc.isValid(self.node)) {
      return;
    }
    clearTimeout(self._tryToRestartPatrollingTimmer);
    if (null == self.movementStops
      && !self.node.position.equals(self.currentDestination)
    ) {
      self.transitToStuck();
      self.animComp.node.color = cc.Color.RED;
      self._tryToRestartPatrollingTimmer = setTimeout(function() {
        self.refreshCurrentDestination();
        self.refreshContinuousStopsFromCurrentPositionToCurrentDestination();
        self.restartFollowing();
      }, 1000);
      return;
    }
    self.animComp.node.color = cc.Color.WHITE;

    /*
    [WARNING] 

    Cutting "stops[0]" if "self.node.position" is on the way between "stops[0] --> stops[1]".

    -- YFLu, 2019-10-08.
    */

    if (2 <= self.movementStops.length) {
      const diffV1 = self.node.position.sub(self.movementStops[0]);
      const diffV2 = self.movementStops[1].sub(self.movementStops[0]);
      if (0 < diffV1.dot(diffV2)) {
        const diffV3 = self.movementStops[1].sub(self.node.position);
        const diffVec = {
          dx: diffV3.x,
          dy: diffV3.y,
        };
        const discretizedDirection = self.mapIns.ctrl.discretizeDirection(diffVec.dx, diffVec.dy, self.mapIns.ctrl.joyStickEps);
        self.scheduleNewDirection(discretizedDirection);
        self.movementStops.shift();
      }
    }

    if (
        self.node.position.equals(self.currentDestination)
     || null == self.movementStops
     || self.movementStops.length == 1
               ) {
      self.transitToStaying();
      return;
    }
    const actualExecution = () => {
      self.node.stopAllActions();
      const stops = self.movementStops;
      if (null == stops || 0 >= stops.length) {
        return;
      }
      let ccSeqActArray = [];
      if (null == self.drawer) {
        self.drawer = self.node.getChildByName("Drawer");
        self.drawer.parent = self.mapNode;
      }
      const drawer = self.drawer;
      drawer.setPosition(cc.v2(0, 0));
      setLocalZOrder(drawer, 20);
      let g = drawer.getComponent(cc.Graphics);
      g.lineWidth = 2;
      if (CC_DEBUG) {
        g.strokeColor = cc.Color.YELLOW;
      } else {
        g.strokeColor = cc.Color.TRANSPARENT;
      }
      g.clear();
      g.moveTo(self.node.position.x, self.node.position.y);
      for (let i = 0; i < stops.length; ++i) {
        const stop = cc.v2(stops[i]);
        if (i > 0) {
          const preStop = cc.v2(stops[i - 1]);
          ccSeqActArray.push(cc.moveTo(stop.sub(preStop).mag() / self.speed, stop));
        } else {
          const preStop = self.node.position;
          ccSeqActArray.push(cc.moveTo(stop.sub(preStop).mag() / self.speed, stop));
        }

        if (i < stops.length - 1) {
          const nextStop = cc.v2(stops[i + 1]);
          const tmpVec = nextStop.sub(stop);
          const diffVec = {
            dx: tmpVec.x,
            dy: tmpVec.y,
          };

          const discretizedDirection = self.mapIns.ctrl.discretizeDirection(diffVec.dx, diffVec.dy, self.mapIns.ctrl.joyStickEps);

          g.lineTo(nextStop.x, nextStop.y);
          g.circle(nextStop.x, nextStop.y, 5);
          ccSeqActArray.push(cc.callFunc(() => {
            self.scheduleNewDirection(discretizedDirection);
          }, self));
        }
      }
      g.stroke();

      ccSeqActArray.push(cc.callFunc(() => {
        if (null == self.node || null == g || !cc.isValid(self.node)) {
          return;
        }
        try {
          g.clear();
          self.transitToStaying();
          if (null != self.onCurrentDestinationArrived) {
            self.onCurrentDestinationArrived();
          }
        } catch (e) {

        }
      }, self));

      self.node.runAction(cc.sequence(ccSeqActArray));
    };
    self.transitToMoving(actualExecution);
  },

  onCollisionEnter(otherCollider, selfCollider) {
    BasePlayer.prototype.onCollisionEnter.call(this, otherCollider, selfCollider);
    const self = this.getComponent(this.node.name);
    switch (otherCollider.node.name) {
      case "PolygonBoundaryBarrier":
        let collidingWithAssociatedStatefulBuildable = false;
        const boundStatefulBuildableOfCollider = otherCollider.boundStatefulBuildable; 
        collidingWithAssociatedStatefulBuildable = (null != boundStatefulBuildableOfCollider && (boundStatefulBuildableOfCollider.uuid == self.boundStatefulBuildable.uuid));
        if (collidingWithAssociatedStatefulBuildable) {
          self.transitToStaying();
          self.state = window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN;
          self.transitToAttacking();
          return;
        }
        self.node.stopAllActions();
        const availableNewPositionNearby = window.findNearbyNonBarrierGridByBreathFirstSearch(self.mapNode, self.node.position, 1, null, false);
        if (null == availableNewPositionNearby) {
          self.mapIns.removeAttackingNpc(self);
          return;
        } else {
          self.node.setPosition(availableNewPositionNearby);
        }
        self.refreshCurrentDestination();
        self.refreshContinuousStopsFromCurrentPositionToCurrentDestination();
        self.restartFollowing();
        break;
      default:
        break;
    }
  },

  onCollisionStay(otherCollider, selfCollider) {
    // TBD.
  },

  onCollisionExit(otherCollider, selfCollider) {
    BasePlayer.prototype.onCollisionExit.call(this, otherCollider, selfCollider);
    const self = this.getComponent(this.node.name);
    switch (otherCollider.node.name) {
      case "PolygonBoundaryBarrier":
        // Deliberatly not handling. -- YFLu
        break;
      default:
        break;
    }
  },

  refreshGrandSrcAndCurrentDestination() {
    const self = this;
    self.state = window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.MOVING_IN; 
    self.refreshCurrentDestination();
  },

  refreshCurrentDestination(targetContinuousPosInMapNode) {
    /**
    * WARNING: You should update `this.state` before calling this method. 
    */
    let previousDiscretizedDestinaion = null;
    let discretizedDestination = null;
    const self = this;
    if (null == self.node || !cc.isValid(self.node) || null == self.boundStatefulBuildable || null == self.mapIns.tiledMapIns) {
      return;
    }

    self.node.stopAllActions();
    switch (self.state) {
      case window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.MOVING_IN:
      case window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.STUCK_WHILE_MOVING_IN:
      case window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.STAYING_WHILE_MOVING_IN:
      case window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.ATTACKING_AT_DESTINATION_AFTER_MOVING_IN:
      case window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_OUT:
        if (null != self.currentDestination) {
          previousDiscretizedDestinaion = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.currentDestination, cc.v2(0, 0));
        }

        if (null == targetContinuousPosInMapNode) {
          self.currentDestination = self.boundStatefulBuildable.fixedSpriteCentreContinuousPos.add(
            (null == self.specifiedOffsetFromSpriteCentre ? self.boundStatefulBuildable.estimatedSpriteCentreToAnchorTileCentreContinuousOffset : self.specifiedOffsetFromSpriteCentre)  
          );
        } else {
          self.currentDestination = targetContinuousPosInMapNode; 
        }
        discretizedDestination = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.currentDestination, cc.v2(0, 0));
        break;
      case window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.MOVING_OUT:
      case window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.STUCK_WHILE_MOVING_OUT:
      case window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.STAYING_WHILE_MOVING_OUT:
      case window.STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN:
        // Deliberately left blank. -- YFLu
        break;
      default:
        break;
    }

    if (null != previousDiscretizedDestinaion) {
      let previousStatefulBuildableAttackingNpcDestinationDictRecord = null;
      if (null != window.reverseStatefulBuildableAttackingNpcDestinationDict[previousDiscretizedDestinaion.x]) {
        previousStatefulBuildableAttackingNpcDestinationDictRecord = window.reverseStatefulBuildableAttackingNpcDestinationDict[previousDiscretizedDestinaion.x][previousDiscretizedDestinaion.y];
      }
      if (null != previousStatefulBuildableAttackingNpcDestinationDictRecord && null != previousStatefulBuildableAttackingNpcDestinationDictRecord[self.node.uuid]) {
        delete previousStatefulBuildableAttackingNpcDestinationDictRecord[self.node.uuid];
        // Lazy clearance.
        if (0 >= Object.keys(previousStatefulBuildableAttackingNpcDestinationDictRecord).length) {
          window.reverseStatefulBuildableAttackingNpcDestinationDict[previousDiscretizedDestinaion.x][previousDiscretizedDestinaion.y] = null;
          delete window.reverseStatefulBuildableAttackingNpcDestinationDict[previousDiscretizedDestinaion.x][previousDiscretizedDestinaion.y];
          if (0 >= Object.keys(window.reverseStatefulBuildableAttackingNpcDestinationDict[previousDiscretizedDestinaion.x]).length) {
            window.reverseStatefulBuildableAttackingNpcDestinationDict[previousDiscretizedDestinaion.x] = null;
            delete window.reverseStatefulBuildableAttackingNpcDestinationDict[previousDiscretizedDestinaion.x];
          }
        }
      }
    }

    if (null != discretizedDestination) {
      let reverseStatefulBuildableAttackingNpcDestinationDictRecord = null;
      // Lazy init.
      if (null == window.reverseStatefulBuildableAttackingNpcDestinationDict[discretizedDestination.x]) {
        window.reverseStatefulBuildableAttackingNpcDestinationDict[discretizedDestination.x] = {};
      }
      if (null == window.reverseStatefulBuildableAttackingNpcDestinationDict[discretizedDestination.x][discretizedDestination.y]) {
        window.reverseStatefulBuildableAttackingNpcDestinationDict[discretizedDestination.x][discretizedDestination.y] = {};
      }

      reverseStatefulBuildableAttackingNpcDestinationDictRecord = window.reverseStatefulBuildableAttackingNpcDestinationDict[discretizedDestination.x][discretizedDestination.y];
      reverseStatefulBuildableAttackingNpcDestinationDictRecord[self.node.uuid] = self;
    }
  },

  onShotByBullet(bulletScriptIns) {
    this.remainingHp -= bulletScriptIns.baseDamage;  
    if (0 < this.remainingHp) {
      return;
    }
    // TODO: Check hp before removing from the MapNode.
    this.mapIns.onAttackingNpcKilledByBullet(this, bulletScriptIns);
  },

  update(dt) {
    StatefulBuildableFollowingNpc.prototype.update.call(this, dt);
    if (null != this.defenderNode) {
      this.defenderNode.setPosition(this.node.position);
    }
    if (null != this.visionNode) {
      this.visionNode.setPosition(this.node.position);
    }
  },

  rerouteIfNotAttacking() {
    switch (this.state) {
    case STATEFUL_BUILDABLE_ATTACKING_NPC_STATE.ATTACKING_AT_DESTINATION_AFTER_MOVING_IN:
    break;
    default:
      this.refreshCurrentDestination();
      this.refreshContinuousStopsFromCurrentPositionToCurrentDestination();
      this.restartFollowing();
    break;
    }
  },
});

