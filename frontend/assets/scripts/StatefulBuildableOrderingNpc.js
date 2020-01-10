const StatefulBuildableFollowingNpc = require("./StatefulBuildableFollowingNpc");
const BasePlayer = require("./BasePlayer");

window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE = {
  MOVING_OUT: 1,
  MOVING_IN: 2, // This state will be active when "boundStatefulBuildable" is moved to a new "fixedSpriteCentreContinuousPos" where an available "NewGrandSrc" can be found.

  STUCK_WHILE_MOVING_OUT: 3,
  STUCK_WHILE_MOVING_IN: 4,

  STAYING_WHILE_MOVING_OUT: 5,
  STAYING_WHILE_MOVING_IN: 6,

  STAYING_AT_DESTINATION_AFTER_MOVING_IN: 7,

//  ATTACKING_AT_DESTINATION_AFTER_MOVING_IN: 8,
  ORDERING_AT_DESTINATION_AFTER_MOVING_IN: 8,
  ORDER_TAKEN_TRADING_AT_DESTINATION_AFTER_MOVING_IN: 9,
  ORDER_DELIVERED_AT_DESTINATION_AFTER_MOVING_IN: 10,

  STAYING_AT_DESTINATION_AFTER_MOVING_OUT: 11,
};

window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE = {
  NONE: 0,
  PATIENT: 1,
  IMPATIENT: 2,
  ORDERING_NOT_TAKEN_TIMED_OUT: 3,
  ORDERING_NOT_SERVERD: 4,
  ORDERING_SERVED: 5,
  ORDERING_ABORTED: 6,
  ORDERING_TAKEN_NOT_MET: 7,
};

module.export = cc.Class({
  extends: StatefulBuildableFollowingNpc,

  properties: {
    moodAnimNode: cc.Node,
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
    moodAnimationEnabled: true,
    popupNode: cc.Node,
    popupLabel: cc.Label,
  },

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
    this.state = STATEFUL_BUILDABLE_ORDERING_NPC_STATE.MOVING_IN;
    this.moodState = STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.NONE;
    this.movementStops = null;
    this.homePosInMapNode = null;
    this.targetChair = null;
    this.chairSpeciesName = "1"; // hardcode temporarily.
    this.offsetToChairPosition = null;
    this.chairDirection = "TopRight";
    this.drawer = null;
    this.popupOffset = {x: 0, y: 0};
  },

  setChairDirection(direction) {
    switch (direction) {
      case "TopRight":
        this.chairDirection = direction;
        this.offsetToChairPosition = constants.NPC_POSITION_OFFSET_TO_CHAIR_SPRITE_CENTER[this.chairSpeciesName].TopRight;
        break;
      case "TopLeft":
        this.chairDirection = direction;
        this.offsetToChairPosition = constants.NPC_POSITION_OFFSET_TO_CHAIR_SPRITE_CENTER[this.chairSpeciesName].TopLeft;
        break;
      default:
        this.chairDirection = "TopRight";
        this.offsetToChairPosition = constants.NPC_POSITION_OFFSET_TO_CHAIR_SPRITE_CENTER[this.chairSpeciesName].TopRight;
        break;
    }
  },

  onLoad() {
    const self = this;
    self.setAnim(self.speciesName, () => {
      self.scheduleNewDirection(self._generateRandomDirection());
    });

     // addToGlobalShelterChainVerticeMap [begin]
    const ShelterChainColliderNode = self.node.getChildByName('ShelterChainCollider');
    ShelterChainColliderNode.thePlayerNode = self.node;
    self.node.origZIndex = window.CORE_LAYER_Z_INDEX.UN_HIGHLIGHTED_STATEFUL_BUILDABLE_INSTANCE;
    window.addToGlobalShelterChainVerticeMap(self.node);
    self.shelterChinColliderNode = ShelterChainColliderNode;
    // addToGlobalShelterChainVerticeMap [end]
    // Prevent the tip is hiden by orderingNpc or buildable. [begin] {
    this.popupOffset = this.popupNode.position;
    safelyAssignParent(this.popupNode, this.mapIns.node);
    setLocalZOrder(this.popupNode, window.CORE_LAYER_Z_INDEX.LABEL_POPUP_OVER_ORDERING_NPC);
    this._onNodePositionChange();
    this.node.on(cc.Node.EventType.POSITION_CHANGED, this._onNodePositionChange, this);
    // Prevent the tip is hiden by orderingNpc or buildable. [end] {
  },

  onEnable() {
    const self = this;
    StatefulBuildableFollowingNpc.prototype.onEnable && StatefulBuildableFollowingNpc.prototype.onEnable.apply(self, arguments);
    // Initialization of Mood Animation. [begin]
    let armatureDisplayIns = self.moodAnimNode.getComponent(dragonBones.ArmatureDisplay);
    if (null != armatureDisplayIns) {
      armatureDisplayIns.on(dragonBones.EventObject.LOOP_COMPLETE, self.onMoodAnimationLoopComplete, self);
    }
    // Initialization of Mood Animation. [end]
  },

  onDisable() {
    const self = this;
    StatefulBuildableFollowingNpc.prototype.onDisable && StatefulBuildableFollowingNpc.prototype.onDisable.apply(self, arguments);
    // remove Mood Animation listener. [begin]
    let armatureDisplayIns = self.moodAnimNode.getComponent(dragonBones.ArmatureDisplay);
    if (null != armatureDisplayIns) {
      armatureDisplayIns.off(dragonBones.EventObject.LOOP_COMPLETE, self.onMoodAnimationLoopComplete, self);
    }
    // remove Mood Animation listener. [end]
  },

  onDestroy() {
    const self = this;
    if (null != this._tryToRestartPatrollingTimmer) {
      clearTimeout(this._tryToRestartPatrollingTimmer);
      this._tryToRestartPatrollingTimmer = null;
    }

    if (null != self.currentDestination) {
      const discretizedDestination = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.currentDestination, cc.v2(0, 0));
      let statefulBuildableOrderingNpcDestinationDictRecord = null;
      if (null != window.reverseStatefulBuildableFollowingNpcDestinationDict[discretizedDestination.x]) {
        statefulBuildableOrderingNpcDestinationDictRecord = window.reverseStatefulBuildableFollowingNpcDestinationDict[discretizedDestination.x][discretizedDestination.y];
      }
      if (null != statefulBuildableOrderingNpcDestinationDictRecord && null != statefulBuildableOrderingNpcDestinationDictRecord[self.node.uuid]) {
        delete statefulBuildableOrderingNpcDestinationDictRecord[self.node.uuid];
      }
    }
    if (null != self.drawer) {
      self.drawer.destroy();
    }
    window.removeFromGlobalShelterChainVerticeMap(self.node);
    this.popupNode.destroy();
    this.node.off(cc.Node.EventType.POSITION_CHANGED, this._onNodePositionChange, this);
  },

  transitToStaying(cb) {
    const self = this;
    // Don't execute the calculation of "continuous -> discrete coordinate" before checking the current state.
    let discretizedSelfNodePos = null;
    let discretizedDestination = null;

    switch (this.state) {
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.MOVING_IN:
        discretizedSelfNodePos = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.node.position, cc.v2(0, 0));
        discretizedDestination = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.currentDestination, cc.v2(0, 0));
        if (discretizedSelfNodePos.x == discretizedDestination.x && discretizedSelfNodePos.y == discretizedDestination.y) {
          this.state = window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN;
          this.onStayingAtTargetDestination && this.onStayingAtTargetDestination();
        } else {
          this.state = window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.STAYING_WHILE_MOVING_IN;
        }
        break;
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.MOVING_OUT:
        discretizedSelfNodePos = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.node.position, cc.v2(0, 0));
        discretizedDestination = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.currentDestination, cc.v2(0, 0));
        if (discretizedSelfNodePos.x == discretizedDestination.x && discretizedSelfNodePos.y == discretizedDestination.y) {
          self.state = window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_OUT;
          self.onStayingAtHomeDestination && self.onStayingAtHomeDestination();
        } else {
          self.state = window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.STAYING_WHILE_MOVING_OUT;
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

  transitToOrderingAtDestinationAfterMovingIn(cb) {
    const self = this;
    switch (this.state) {
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN:
        self.state = window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.ORDERING_AT_DESTINATION_AFTER_MOVING_IN;
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

  transitToOrderTakenTradingAtDestinationAfterMoveIn(cb) {
    const self = this;
    switch (this.state) {
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.ORDERING_AT_DESTINATION_AFTER_MOVING_IN:
        self.state = window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.ORDER_TAKEN_TRADING_AT_DESTINATION_AFTER_MOVING_IN;
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

  transitToOrderDeliveredAtDestinationAfterMoveIn(cb) {
    const self = this;
    switch (this.state) {
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.ORDER_TAKEN_TRADING_AT_DESTINATION_AFTER_MOVING_IN:
        self.state = window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.ORDER_DELIVERED_AT_DESTINATION_AFTER_MOVING_IN;
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
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.MOVING_IN:
        this.state = window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.STUCK_WHILE_MOVING_IN;
        break;
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.MOVING_OUT:
        this.state = window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.STUCK_WHILE_MOVING_OUT;
        break;
      default:
        break;
    }
    
    /*
    * Draw an arrow from the NPC to "this.currentDestination".
    */
    if (null != self.currentDestination) {
      if (null == self.drawer) {
        self.drawer = self.node.getChildByName("Drawer");
        self.drawer.parent = self.mapNode;
      }
      const drawer = self.drawer;
      drawer.setPosition(cc.v2(0, 0));
      setLocalZOrder(drawer, window.CORE_LAYER_Z_INDEX.POPUP_OVER_STATEFUL_BUILDABLE_FOLLOWING_NPC);
      let g = drawer.getComponent(cc.Graphics);
      g.lineWidth = 4;
      g.clear();
      g.strokeColor = cc.Color.ORANGE; // Fading doesn't work on "cc.Graphics". -- YFLu, 2019-10-13.
      g.moveTo(self.node.position.x, self.node.position.y);
      g.lineTo(self.currentDestination.x, self.currentDestination.y);
      const mainRevVec = self.node.position.sub(self.currentDestination); 
      const mainRevVecNormalized = mainRevVec.div(mainRevVec.mag());  

      const absAngleToRotateRadian = 0.10*Math.PI;  
      const rotatedRevVec1 = mainRevVecNormalized.rotate(absAngleToRotateRadian);
      const rotatedRevVec2 = mainRevVecNormalized.rotate(-absAngleToRotateRadian);
      g.moveTo(self.currentDestination.x, self.currentDestination.y);
      const finLength = 64;
      const arrowEnd1 = self.currentDestination.add(rotatedRevVec1.mul(finLength)); 
      const arrowEnd2 = self.currentDestination.add(rotatedRevVec2.mul(finLength)); 
      g.moveTo(self.currentDestination.x, self.currentDestination.y);
      g.lineTo(arrowEnd1.x, arrowEnd1.y);
      g.moveTo(self.currentDestination.x, self.currentDestination.y);
      g.lineTo(arrowEnd2.x, arrowEnd2.y);
      g.stroke();
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
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_OUT:
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.STAYING_WHILE_MOVING_IN:
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.STUCK_WHILE_MOVING_IN:
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.MOVING_IN:
        this.state = window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.MOVING_IN;
        break;
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN:
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.STAYING_WHILE_MOVING_OUT:
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.STUCK_WHILE_MOVING_OUT:
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.ORDERING_AT_DESTINATION_AFTER_MOVING_IN:
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.ORDER_TAKEN_TRADING_AT_DESTINATION_AFTER_MOVING_IN:
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.ORDER_DELIVERED_AT_DESTINATION_AFTER_MOVING_IN:
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.MOVING_OUT:
        this.state = window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.MOVING_OUT;
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
      }, 2000);
      return;
    }
    self.stopDrawerBlinking();
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
        g.strokeColor = cc.Color.BLACK;
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
    let collidingWithAssociatedStatefulBuildable = false;
    const boundStatefulBuildableOfCollider = otherCollider.boundStatefulBuildable; 
    collidingWithAssociatedStatefulBuildable = (null != boundStatefulBuildableOfCollider && (boundStatefulBuildableOfCollider.uuid == self.boundStatefulBuildable.uuid));
    let availableNewPositionNearby;
    switch (otherCollider.node.name) {
      case "PolygonBoundaryBarrier":
        if (collidingWithAssociatedStatefulBuildable) {
          return;
        }

        switch (self.state) {
          case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.ORDERING_AT_DESTINATION_AFTER_MOVING_IN:
          case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.ORDER_TAKEN_TRADING_AT_DESTINATION_AFTER_MOVING_IN:
          case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.ORDER_DELIVERED_AT_DESTINATION_AFTER_MOVING_IN:
            self.onOrderAbort && self.onOrderAbort();
            // Deliberately not to break, because it should go to homePosInMapNode now.
          case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.STUCK_WHILE_MOVING_OUT:
          case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.STAYING_WHILE_MOVING_OUT:
          case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.STUCK_WHILE_MOVING_IN:
          case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.STAYING_WHILE_MOVING_IN:
          case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN:
            self.node.stopAllActions();
            availableNewPositionNearby = window.findNearbyNonBarrierGridByBreathFirstSearch(self.mapNode, self.node.position, 1);
            
            if (null == availableNewPositionNearby) {
              self.currentDestination = self.homePosInMapNode;
              self.node.setPosition(self.homePosInMapNode);
              self.transitToStaying();
              break;
            } else {
              self.node.setPosition(availableNewPositionNearby);
            }

            self.refreshCurrentDestination();
            self.refreshContinuousStopsFromCurrentPositionToCurrentDestination();
            self.restartFollowing();
            break;
          case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.MOVING_IN:
          case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.MOVING_OUT:
          case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_OUT:
            // 使orderingNpc在走路过程中无视collision
            break;
          default:
            console.warn("Unknown state for statefulBuildableOrderingNpc, state is:", self.state);
            break;
        }
        break;
      default:
        break;
    }
  },

  onCollisionStay(otherCollider, selfCollider) {
    // TBD.
  },

  onCollisionExit(otherCollider, selfCollider) {
    BasePlayer.prototype.onCollisionEnter.call(this, otherCollider, selfCollider);
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
    self.grandSrc = self.homePosInMapNode;
    self.refreshCurrentDestination();
  },

  refreshCurrentDestination() {
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
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.MOVING_IN:
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.STUCK_WHILE_MOVING_IN:
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.STAYING_WHILE_MOVING_IN:
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_OUT:
        if (null != self.currentDestination) {
          previousDiscretizedDestinaion = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.currentDestination, cc.v2(0, 0));
        }
        self.currentDestination = self.boundStatefulBuildable.fixedSpriteCentreContinuousPos.add(
          (null == self.specifiedOffsetFromSpriteCentre ? self.boundStatefulBuildable.estimatedSpriteCentreToAnchorTileCentreContinuousOffset : self.specifiedOffsetFromSpriteCentre)  
        ).add(
          (null == self.offsetToChairPosition ? cc.v2(0, 0) : self.offsetToChairPosition)
        );
        discretizedDestination = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.currentDestination, cc.v2(0, 0));
        break;
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.MOVING_OUT:
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.STUCK_WHILE_MOVING_OUT:
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.STAYING_WHILE_MOVING_OUT:
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN:
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.ORDERING_AT_DESTINATION_AFTER_MOVING_IN:
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.ORDER_TAKEN_TRADING_AT_DESTINATION_AFTER_MOVING_IN:
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.ORDER_DELIVERED_AT_DESTINATION_AFTER_MOVING_IN:
        // Deliberately left blank. -- YFLu
        self.currentDestination = self.homePosInMapNode; 
        break;
      default:
        break;
    }

    if (null != previousDiscretizedDestinaion) {
      let previousStatefulBuildableOrderingNpcDestinationDictRecord = null;
      if (null != window.reverseStatefulBuildableOrderingNpcDestinationDict[previousDiscretizedDestinaion.x]) {
        previousStatefulBuildableOrderingNpcDestinationDictRecord = window.reverseStatefulBuildableOrderingNpcDestinationDict[previousDiscretizedDestinaion.x][previousDiscretizedDestinaion.y];
      }
      if (null != previousStatefulBuildableOrderingNpcDestinationDictRecord && null != previousStatefulBuildableOrderingNpcDestinationDictRecord[self.node.uuid]) {
        delete previousStatefulBuildableOrderingNpcDestinationDictRecord[self.node.uuid];
        // Lazy clearance.
        if (0 >= Object.keys(previousStatefulBuildableOrderingNpcDestinationDictRecord).length) {
          window.reverseStatefulBuildableOrderingNpcDestinationDict[previousDiscretizedDestinaion.x][previousDiscretizedDestinaion.y] = null;
          delete window.reverseStatefulBuildableOrderingNpcDestinationDict[previousDiscretizedDestinaion.x][previousDiscretizedDestinaion.y];
          if (0 >= Object.keys(window.reverseStatefulBuildableOrderingNpcDestinationDict[previousDiscretizedDestinaion.x]).length) {
            window.reverseStatefulBuildableOrderingNpcDestinationDict[previousDiscretizedDestinaion.x] = null;
            delete window.reverseStatefulBuildableOrderingNpcDestinationDict[previousDiscretizedDestinaion.x];
          }
        }
      }
    }

    if (null != discretizedDestination) {
      let reverseStatefulBuildableOrderingNpcDestinationDictRecord = null;
      // Lazy init.
      if (null == window.reverseStatefulBuildableOrderingNpcDestinationDict[discretizedDestination.x]) {
        window.reverseStatefulBuildableOrderingNpcDestinationDict[discretizedDestination.x] = {};
      }
      if (null == window.reverseStatefulBuildableOrderingNpcDestinationDict[discretizedDestination.x][discretizedDestination.y]) {
        window.reverseStatefulBuildableOrderingNpcDestinationDict[discretizedDestination.x][discretizedDestination.y] = {};
      }

      reverseStatefulBuildableOrderingNpcDestinationDictRecord = window.reverseStatefulBuildableOrderingNpcDestinationDict[discretizedDestination.x][discretizedDestination.y];
      reverseStatefulBuildableOrderingNpcDestinationDictRecord[self.node.uuid] = self;
    }
  },

  _playAnimComp(clip, forceReplay=false) {
    const self = this;
    if (null != clip && (self.animComp instanceof dragonBones.ArmatureDisplay)) {
      switch (self.state) {
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.ORDERING_AT_DESTINATION_AFTER_MOVING_IN: 
        switch (self.chairDirection) {
        case "TopLeft":
          clip = cc.js.formatStr('Ordering_%s', "BottomRight");
          break;
        case "TopRight":
          clip = cc.js.formatStr('Ordering_%s', "BottomLeft");
          break;
        default:
          clip = cc.js.formatStr('Ordering_%s', clip);
          break;
        }
        break;
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.ORDER_TAKEN_TRADING_AT_DESTINATION_AFTER_MOVING_IN:
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.ORDER_DELIVERED_AT_DESTINATION_AFTER_MOVING_IN:
        switch (self.chairDirection) {
        case "TopLeft":
          clip = cc.js.formatStr('Staying_%s', "BottomRight");
          break;
        case "TopRight":
          clip = cc.js.formatStr('Staying_%s', "BottomLeft");
          break;
        default:
          clip = cc.js.formatStr('Staying_%s', clip);
          break;
        }
        break;
      default:
        clip = cc.js.formatStr("Walking_%s", clip);
        break;
      }
      BasePlayer.prototype._playAnimComp.call(self, clip, forceReplay);
    }
  },

  setMoodStateAndPlayAnimation(moodState, forceReplay=false) {
    const self = this;
    
    if (moodState == self.moodState && !forceReplay) {
      return;
    }
    self.moodState = moodState;
    if (!self.moodAnimationEnabled) {
      self.moodAnimNode.active = false;
      self.onMoodAnimationLoopComplete();
      return;
    }
    let armatureDisplayIns = self.moodAnimNode.getComponent(dragonBones.ArmatureDisplay);
    if (null == armatureDisplayIns) {
      return;
    }
    armatureDisplayIns._init();
    armatureDisplayIns.armatureName = "Mood";
    switch (self.moodState) {
    case window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.NONE:
    case window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.PATIENT:
    case window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.IMPATIENT:
      self.moodAnimNode.active = false;
      break;
    case window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.ORDERING_NOT_TAKEN_TIMED_OUT:
    case window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.ORDERING_ABORTED:
      self.moodAnimNode.active = true;
      armatureDisplayIns.playAnimation("Angry", 1);
      break;
    case window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.ORDERING_NOT_SERVERD:
      self.moodAnimNode.active = true;
      armatureDisplayIns.playAnimation("Angry", 0);
      break;
    case window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.ORDERING_SERVED:
      self.moodAnimNode.active = true;
      armatureDisplayIns.playAnimation("Happy", 0);
      break;
    case window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.ORDERING_TAKEN_NOT_MET:
      self.moodAnimNode.active = true;
      armatureDisplayIns.playAnimation("Disappointed", 1);
      break;
    }
  },

  onMoodAnimationLoopComplete() {
    const self = this;
    switch (self.moodState) {
    case window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.NONE:
    case window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.PATIENT:
    case window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.IMPATIENT:
      self.moodAnimNode.active = false;
      break;
    case window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.ORDERING_NOT_TAKEN_TIMED_OUT:
    case window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.ORDERING_ABORTED:
    case window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.ORDERING_TAKEN_NOT_MET:
      self.moodAnimNode.active = false;
      self.onMoodDisplyCompleted && self.onMoodDisplyCompleted();
      break;
    case window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.ORDERING_SERVED:
    case window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.ORDERING_NOT_SERVERD:
      break;
    }
  },
  
  refreshContinuousStopsFromCurrentPositionToCurrentDestination() {
    StatefulBuildableFollowingNpc.prototype.refreshContinuousStopsFromCurrentPositionToCurrentDestination.call(this, false, true, true);
  },

  stopDrawerBlinking() {
    const self = this;
    if (null == self.drawer) {
      return;
    }
    self.drawer.stopAllActions();
    const g = self.drawer.getComponent(cc.Graphics);
    g.clear();
  },

  _onNodePositionChange() {
    const self = this;
    self.popupNode.position = self.node.position.add(self.popupOffset);
  },

  onPopupNodeClicked(evt) {
    const self = this;
  },
});
