const BasePlayer = require("./BasePlayer");

/*
[WARNING]

If you overide the state definitions of this class in a subclass, you'll have to overide methods like "transitToXXX" along.

-- YFLu, 2019-10-08. 
*/
window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE = {
  MOVING_OUT: 1,
  MOVING_IN: 2, // This state will be active when "boundStatefulBuildable" is moved to a new "fixedSpriteCentreContinuousPos" where an available "NewGrandSrc" can be found.
  STUCK_WHILE_MOVING_OUT: 3,
  STUCK_WHILE_MOVING_IN: 4,
  STUCK_NO_AVAILABLE_GRAND_SRC: 5, // This state is only active when "boundStatefulBuildable" is moved to a new "fixedSpriteCentreContinuousPos" where NO AVAILABLE "NewGrandSrc" can be found, in such case it could yield "grandSrc == null && preGrandSrc != null".
  STAYING_WHILE_MOVING_OUT: 8,
  STAYING_WHILE_MOVING_IN: 9,
  STAYING_AT_DESTINATION_AFTER_MOVING_OUT: 10,
  STAYING_AT_DESTINATION_AFTER_MOVING_IN: 11, // A.k.a. staying at "grandSrc".
};

module.export = cc.Class({
  extends: BasePlayer,

  properties: {
    speciesName: {
      default: "DUCK",
    },
    preGrandSrc: {
      type: cc.v2,
      default: null
    },
    grandSrc: {
      type: cc.v2,
      default: null
    },
    walkingAnimNode: {
      type: cc.Node,
      default: null
    },
    stayingAnimNode: {
      type: cc.Node,
      default: null
    },
    currentDestination: {
      type: cc.v2,
      default: null
    },
    boundStatefulBuildable: {
      // It's a pointer to an instance of class "StatefulBuildableInstance" a.k.a. a "cc.Component class script instance", which is followed by this npc.
      type: Object,
      default: null,
    },
    wanderingLotteryIntervalMillis: {
      default: 1000,
    },
    wanderingLotteryGuardMillis: {
      default: 2500,
    },
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
    this.state = STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN;
    this.movementStops = null;
    this.drawer = null;
  },

  start() {
    BasePlayer.prototype.start.call(this);
  },

  onLoad() {
    const self = this;
    const now = Date.now();
    self.lastWanderingLotteryUpdatedAt = now;
    /*
    * Deliberately NOT calling "BasePlayer.prototype.onLoad".
    *
    * The class "BasePlayer" switches to play the "appropriate `cc.AnimationClip` of `scheduledDirection` within `this.clips`" when "scheduleNewDirection" is called. 
    * 
    * To switch "cc.Animation", the "this.animComp" will be tuned to point to appropriate objects.
    *
    * -- YFLu
    */

    self.setAnim(self.speciesName, () => {
      self.scheduleNewDirection(self._generateRandomDirection());
      self.transitToStaying(() => {
        // Deliberately left blank. -- YFLu
        self._lotteryInterval = setInterval(self._execStateLottery.bind(self), self.wanderingLotteryIntervalMillis);
      });
    });

    // addToGlobalShelterChainVerticeMap [begin]
    const shelterChainColliderNode = self.node.getChildByName('ShelterChainCollider');
    shelterChainColliderNode.thePlayerNode = self.node;
    self.node.origZIndex = window.CORE_LAYER_Z_INDEX.UN_HIGHLIGHTED_STATEFUL_BUILDABLE_INSTANCE;
    window.addToGlobalShelterChainVerticeMap(self.node);
    // addToGlobalShelterChainVerticeMap [end]
  },

  _execStateLottery() {
    const now = Date.now();
    const self = this;
    switch (self.state) {
      case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_OUT:
      case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN:
        if (now - self.lastWanderingLotteryUpdatedAt < self.wanderingLotteryGuardMillis) {
          return;
        }
        const availableNewDestinationNearby = window.findNearbyNonBarrierGridByBreathFirstSearch(self.mapNode, self.grandSrc, 2, null, false);
        if (null != availableNewDestinationNearby) {
          self.currentDestination = availableNewDestinationNearby;
          self.refreshContinuousStopsFromCurrentPositionToCurrentDestination();
          self.restartPatrolling();
          self.lastWanderingLotteryUpdatedAt = now;
        } 
        break;
      case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_OUT:
      case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_IN:
      case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STUCK_WHILE_MOVING_OUT:
      case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STUCK_WHILE_MOVING_IN:
      case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STUCK_NO_AVAILABLE_GRAND_SRC:
        break;
      case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_WHILE_MOVING_OUT:
      case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_WHILE_MOVING_IN:
        break;
      default:
        break;
    }
  },

  onDestroy() {
    const self = this;
    if (null != this._lotteryInterval) {
      clearInterval(this._lotteryInterval);
    }

    if (null != self.currentDestination) {
      const discretizedDestination = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.currentDestination, cc.v2(0, 0));
      let statefulBuildableFollowingNpcDestinationDictRecord = null;
      if (null != window.reverseStatefulBuildableFollowingNpcDestinationDict[discretizedDestination.x]) {
        statefulBuildableFollowingNpcDestinationDictRecord = window.reverseStatefulBuildableFollowingNpcDestinationDict[discretizedDestination.x][discretizedDestination.y];
      }
      if (null != statefulBuildableFollowingNpcDestinationDictRecord && null != statefulBuildableFollowingNpcDestinationDictRecord[self.node.uuid]) {
        delete statefulBuildableFollowingNpcDestinationDictRecord[self.node.uuid];
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
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_IN:
        discretizedSelfNodePos = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.node.position, cc.v2(0, 0));
        discretizedDestination = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.currentDestination, cc.v2(0, 0));
        if (discretizedSelfNodePos.x == discretizedDestination.x && discretizedSelfNodePos.y == discretizedDestination.y) {
          this.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN;
        } else {
          this.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_WHILE_MOVING_IN;
        }
        break;
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_OUT:
        discretizedSelfNodePos = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.node.position, cc.v2(0, 0));
        discretizedDestination = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.currentDestination, cc.v2(0, 0));
        if (discretizedSelfNodePos.x == discretizedDestination.x && discretizedSelfNodePos.y == discretizedDestination.y) {
          this.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_OUT;
        } else {
          this.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_WHILE_MOVING_OUT;
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

  transitToStuck(cb) {
    const self = this;
    switch (this.state) {
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_IN:
        this.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STUCK_WHILE_MOVING_IN;
        break;
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_OUT:
        this.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STUCK_WHILE_MOVING_OUT;
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
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_OUT:
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_WHILE_MOVING_IN:
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STUCK_WHILE_MOVING_IN:
        this.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_IN;
        break;
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN:
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_WHILE_MOVING_OUT:
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STUCK_WHILE_MOVING_OUT:
        this.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_OUT;
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

  refreshGrandSrcAndCurrentDestination() {
    const self = this;
    self.preGrandSrc = self.grandSrc;

    self.grandSrc = self.boundStatefulBuildable.fixedSpriteCentreContinuousPos.add(
      (null == self.specifiedOffsetFromSpriteCentre ? self.boundStatefulBuildable.estimatedSpriteCentreToAnchorTileCentreContinuousOffset : self.specifiedOffsetFromSpriteCentre)  
    );

    self.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_IN; 
    self.refreshCurrentDestination();
  },

  refreshCurrentDestination() {
    /**
    * WARNING: You should update `this.state` before calling this method. 
    */
    let previousDiscretizedDestinaion = null;
    let discretizedDestination = null;
    const self = this;
    self.node.stopAllActions();
    switch (self.state) {
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_IN:
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STUCK_WHILE_MOVING_IN:
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_WHILE_MOVING_IN:
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_OUT:
        if (null != self.currentDestination) {
          previousDiscretizedDestinaion = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.currentDestination, cc.v2(0, 0));
        }

        self.currentDestination = self.grandSrc;
        discretizedDestination = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.currentDestination, cc.v2(0, 0));
        break;
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_OUT:
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STUCK_WHILE_MOVING_OUT:
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_WHILE_MOVING_OUT:
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN:
        // Deliberately left blank. -- YFLu
        break;
      default:
        break;
    }

    if (null != previousDiscretizedDestinaion) {
      let previousStatefulBuildableFollowingNpcDestinationDictRecord = null;
      if (null != window.reverseStatefulBuildableFollowingNpcDestinationDict[previousDiscretizedDestinaion.x]) {
        previousStatefulBuildableFollowingNpcDestinationDictRecord = window.reverseStatefulBuildableFollowingNpcDestinationDict[previousDiscretizedDestinaion.x][previousDiscretizedDestinaion.y];
      }
      if (null != previousStatefulBuildableFollowingNpcDestinationDictRecord && null != previousStatefulBuildableFollowingNpcDestinationDictRecord[self.node.uuid]) {
        delete previousStatefulBuildableFollowingNpcDestinationDictRecord[self.node.uuid];
        // Lazy clearance.
        if (0 >= Object.keys(previousStatefulBuildableFollowingNpcDestinationDictRecord).length) {
          window.reverseStatefulBuildableFollowingNpcDestinationDict[previousDiscretizedDestinaion.x][previousDiscretizedDestinaion.y] = null;
          delete window.reverseStatefulBuildableFollowingNpcDestinationDict[previousDiscretizedDestinaion.x][previousDiscretizedDestinaion.y];
          if (0 >= Object.keys(window.reverseStatefulBuildableFollowingNpcDestinationDict[previousDiscretizedDestinaion.x]).length) {
            window.reverseStatefulBuildableFollowingNpcDestinationDict[previousDiscretizedDestinaion.x] = null;
            delete window.reverseStatefulBuildableFollowingNpcDestinationDict[previousDiscretizedDestinaion.x];
          }
        }
      }
    }

    if (null != discretizedDestination) {
      let reverseStatefulBuildableFollowingNpcDestinationDictRecord = null;
      // Lazy init.
      if (null == window.reverseStatefulBuildableFollowingNpcDestinationDict[discretizedDestination.x]) {
        window.reverseStatefulBuildableFollowingNpcDestinationDict[discretizedDestination.x] = {};
      }
      if (null == window.reverseStatefulBuildableFollowingNpcDestinationDict[discretizedDestination.x][discretizedDestination.y]) {
        window.reverseStatefulBuildableFollowingNpcDestinationDict[discretizedDestination.x][discretizedDestination.y] = {};
      }

      reverseStatefulBuildableFollowingNpcDestinationDictRecord = window.reverseStatefulBuildableFollowingNpcDestinationDict[discretizedDestination.x][discretizedDestination.y];
      reverseStatefulBuildableFollowingNpcDestinationDictRecord[self.node.uuid] = self;
    }
  },

  refreshContinuousStopsFromCurrentPositionToCurrentDestination(waiveBoundStatefulBuildableCheck, ignoreCurrentGridBarrierCheck, ignoreDestinationGridBarrierCheck, ignoreBuildableIdList) {
    const self = this;
    if (null == self.currentDestination) {
      self.movementStops = null;
    } else {
      const npcBarrierCollider = self.node.getComponent(cc.CircleCollider);
      if (true != waiveBoundStatefulBuildableCheck && (null == self.boundStatefulBuildable || null == self.boundStatefulBuildable.node)) {
        self.movementStops = null;
        return;
      } 
      let discreteBarrierGridsToIgnore = {};
      if (null != self.grandSrc) {
        const discretizedGrandSrc = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.grandSrc, cc.v2(0, 0));
        if (null == discreteBarrierGridsToIgnore[discretizedGrandSrc.x]) {
          discreteBarrierGridsToIgnore[discretizedGrandSrc.x] = {};
        }
        discreteBarrierGridsToIgnore[discretizedGrandSrc.x][discretizedGrandSrc.y] = true;
      }

      if (null != self.boundStatefulBuildable) {
        const discreteWidth = self.boundStatefulBuildable.discreteWidth;
        const discreteHeight = self.boundStatefulBuildable.discreteHeight;
        const anchorTileDiscretePos = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.boundStatefulBuildable.node.position.add(self.boundStatefulBuildable.estimatedSpriteCentreToAnchorTileCentreContinuousOffset), cc.v2(0, 0));

        for (let discreteX = anchorTileDiscretePos.x; discreteX < (anchorTileDiscretePos.x + discreteWidth); ++discreteX) {
          if (null == discreteBarrierGridsToIgnore[discreteX]) {
            discreteBarrierGridsToIgnore[discreteX] = {};
          }
          for (let discreteY = anchorTileDiscretePos.y; discreteY < (anchorTileDiscretePos.y + discreteHeight); ++discreteY) {
            discreteBarrierGridsToIgnore[discreteX][discreteY] = true;
          }  
        }  
      }

      if (true == ignoreCurrentGridBarrierCheck) {
        const discreteCurrentGrid = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.node.position, cc.v2(0, 0));
        if (null == discreteBarrierGridsToIgnore[discreteCurrentGrid.x]) {
          discreteBarrierGridsToIgnore[discreteCurrentGrid.x] = {};
        }
        discreteBarrierGridsToIgnore[discreteCurrentGrid.x][discreteCurrentGrid.y] = true;
      }

      if (true == ignoreDestinationGridBarrierCheck) {
        const discreteDesinationGrid = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.currentDestination, cc.v2(0, 0));
        if (null == discreteBarrierGridsToIgnore[discreteDesinationGrid.x]) {
          discreteBarrierGridsToIgnore[discreteDesinationGrid.x] = {};
        }
        discreteBarrierGridsToIgnore[discreteDesinationGrid.x][discreteDesinationGrid.y] = true;
      }
    
      if (null != ignoreBuildableIdList) {
        for (let k in self.mapIns.statefulBuildableInstanceCompList) {
          const statefulBuildableInstanceComp = self.mapIns.statefulBuildableInstanceCompList[k];
          if (false == ignoreBuildableIdList.includes(statefulBuildableInstanceComp.id)) {
            continue;
          }
          const discreteWidth = statefulBuildableInstanceComp.discreteWidth;
          const discreteHeight = statefulBuildableInstanceComp.discreteHeight;
          const playerBuildableBinding = statefulBuildableInstanceComp.playerBuildableBinding; 

          for (let discreteX = playerBuildableBinding.topmostTileDiscretePositionX; discreteX < (playerBuildableBinding.topmostTileDiscretePositionX + discreteWidth); ++discreteX) {
            if (null == discreteBarrierGridsToIgnore[discreteX]) {
              discreteBarrierGridsToIgnore[discreteX] = {};
            }
            for (let discreteY = playerBuildableBinding.topmostTileDiscretePositionY; discreteY < (playerBuildableBinding.topmostTileDiscretePositionY + discreteHeight); ++discreteY) {
              discreteBarrierGridsToIgnore[discreteX][discreteY] = true;
            }  
          }  
        }  
      }
      
      self.movementStops = window.findPathWithMapDiscretizingAStar(self.node.position, self.currentDestination, 0.01 /* Hardcoded temporarily */ , npcBarrierCollider, self.mapIns.barrierColliders, null, self.mapNode, null, discreteBarrierGridsToIgnore);
      if (null != self.movementStops) {
        self.movementStops.push(self.currentDestination);
      }
    }
    // console.log("For statefulBuildableFollowingNpcComp.uuid == ", self.uuid, ", found steps from ", self.node.position, " to ", self.currentDestination, " :", self.movementStops);

  },

  restartPatrolling() {
    const self = this;
    if (
        self.node.position.equals(self.currentDestination)
     || null == self.movementStops
     || self.movementStops.length == 1
               ) {
      self.transitToStaying();
      return;
    }
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
      g.strokeColor = cc.Color.WHITE;
      if (CC_DEBUG) {
        g.clear();
        g.moveTo(self.node.position.x, self.node.position.y);
      }
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

          if (CC_DEBUG) {
            g.lineTo(nextStop.x, nextStop.y);
            g.circle(nextStop.x, nextStop.y, 5);
          }
          ccSeqActArray.push(cc.callFunc(() => {
            self.scheduleNewDirection(discretizedDirection);
          }, self));
        }
      }
      if (CC_DEBUG) {
        g.stroke();
      }

      ccSeqActArray.push(cc.callFunc(() => {
        if (CC_DEBUG) {
          g.clear();
        }
        self.transitToStaying();
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
          return;
        }
        self.node.stopAllActions();
        const availableNewPositionNearby = window.findNearbyNonBarrierGridByBreathFirstSearch(self.mapNode, self.node.position, 1, null, false);
        if (null == availableNewPositionNearby) {
          self.currentDestination = self.grandSrc;
          self.node.setPosition(self.grandSrc);
          self.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN;
        } else {
          self.node.setPosition(availableNewPositionNearby);
        }
        self.refreshCurrentDestination();
        self.refreshContinuousStopsFromCurrentPositionToCurrentDestination();
        self.restartPatrolling();
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

  setAnim(speciesName, cb) {
    const self = this;

    let targetNode = null;
    let targetAnimationClips = null;

    const selfStateWhenCalled = self.state;

    switch (selfStateWhenCalled) {
      case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_OUT:
      case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_IN:
        if (null != self.walkingAnimComp) {
          self.stayingAnimNode.active = false;
          self.walkingAnimNode.active = true;
          self.animComp = self.walkingAnimComp;
          if (cb) {
            cb(false);
          }
          return;
        }
        targetNode = self.node.getChildByName(cc.js.formatStr("%s_STAYING", self.speciesName));
        break;
      default:
        if (null != self.stayingAnimComp) {
          self.walkingAnimNode.active = false;
          self.stayingAnimNode.active = true;
          self.animComp = self.stayingAnimComp;
          if (cb) {
            cb(false);
          }
          return;
        }
        targetNode = self.node.getChildByName(cc.js.formatStr("%s_WALKING", self.speciesName));
        break;
    }

    switch (selfStateWhenCalled) {
      case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_OUT:
      case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_IN:
        let walkingAnimComp = self.walkingAnimNode.getComponent(cc.Animation);
        if (null != walkingAnimComp) {
          targetAnimationClips = targetNode.getComponent(cc.Animation).getClips();
          for (let clip of targetAnimationClips) {
            walkingAnimComp.addClip(clip);
          }
        } else {
          targetAnimationClips = targetNode.getComponent(dragonBones.ArmatureDisplay);
          targetAnimationClips._init();
          walkingAnimComp = self.walkingAnimNode.getComponent(dragonBones.ArmatureDisplay);
          walkingAnimComp.dragonAtlasAsset = targetAnimationClips.dragonAtlasAsset;
          walkingAnimComp.dragonAsset = targetAnimationClips.dragonAsset;
          walkingAnimComp.setAnimationCacheMode(targetAnimationClips._cacheMode);
          walkingAnimComp._init();
          walkingAnimComp.armatureName = targetAnimationClips.armatureName;
          walkingAnimComp.animationName = targetAnimationClips.animationName;
        }
        
        self.walkingAnimComp = walkingAnimComp; 
        self.animComp = walkingAnimComp;
        self.stayingAnimNode.active = false;
        self.walkingAnimNode.active = true;
        break;
      default:
        let stayingAnimComp = self.stayingAnimNode.getComponent(cc.Animation);
        if (null != stayingAnimComp) {
          targetAnimationClips = targetNode.getComponent(cc.Animation).getClips();
          for (let clip of targetAnimationClips) {
            stayingAnimComp.addClip(clip);
          }
        } else {
          targetAnimationClips = targetNode.getComponent(dragonBones.ArmatureDisplay);
          targetAnimationClips._init();
          stayingAnimComp = self.stayingAnimNode.getComponent(dragonBones.ArmatureDisplay);
          stayingAnimComp.dragonAtlasAsset = targetAnimationClips.dragonAtlasAsset;
          stayingAnimComp.dragonAsset = targetAnimationClips.dragonAsset;
          stayingAnimComp.setAnimationCacheMode(targetAnimationClips._cacheMode);
          stayingAnimComp._init();
          stayingAnimComp.armatureName = targetAnimationClips.armatureName;
          stayingAnimComp.animationName = targetAnimationClips.animationName;
        }
        self.stayingAnimComp = stayingAnimComp; 
        self.animComp = stayingAnimComp;
        self.walkingAnimNode.active = false;
        self.stayingAnimNode.active = true;
        break;
    }
    if (cb) {
      cb(true);
    }
  },

  _playAnimComp(clip, forceReplay=true) {
    const self = this;
    if (null != clip && (self.animComp instanceof dragonBones.ArmatureDisplay)) {
      if (self.animComp == self.stayingAnimComp) {
        clip = cc.js.formatStr("Walking_%s", clip);
      } else if (self.animComp == self.walkingAnimComp) {
        clip = cc.js.formatStr("Walking_%s", clip);
      }
      BasePlayer.prototype._playAnimComp.call(self, clip, forceReplay=true);
    }
  },

});
