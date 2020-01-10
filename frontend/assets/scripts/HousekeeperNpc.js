const StatefulBuildableFollowingNpc = require("./StatefulBuildableFollowingNpc");
const BasePlayer = require("./BasePlayer");
const i18n = require('LanguageData');

module.export = cc.Class({
  extends: StatefulBuildableFollowingNpc,

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
    currentLevelBinding: {
      visible: false,
      get() {
        if (CC_EDITOR) {
          return null;
        }
        if (null == this.housekeeperBinding) {
          return null;
        }
        if (null == constants || null == constants.HOUSEKEEPER) {
          return null;
        }
        const housekeeperConfigured = constants.HOUSEKEEPER["BUILDABLEID_" + this.housekeeperBinding.buildableId];
        const housekeeperLevelBinding = housekeeperConfigured.LEVEL_BINDINGS[this.housekeeperBinding.currentLevel];
        return housekeeperLevelBinding;
      },
      set() {},
    },
    restTip: cc.Node,
    unlockTip: cc.Node,
    servingTip: cc.Node,
    servingTipLabel: cc.Label,
    servingTipPreservedDuration: 1300,
  },

  ctor() {
    this.targetStatefulBuildableOrderingNpc = null;
    this.lastPeriodStartedAt = null;
    this.stuckedAtStatefulBuildable = null;
    this._paused = false;
    this._lastPickCachedGoldMillis = null;
    this._timer = null;
    this.unlockTipOffset = null;
    this.servingTipOffset = null;
    this.servingBuildableId = null;
    this.housekeeperBinding = null;
  },

  onClicked(evt) {
    const self = this;
    if (null != self.mapIns) {
      self.mapIns.playEffectCommonButtonClick();
    }
    if (null == self.lastPeriodStartedAt || 0 == self.lastPeriodStartedAt) {
      self.onUnlocking && self.onUnlocking();
    } else {
      self.onShowingTip && self.onShowingTip();
    }
  },

  onCollisionEnter(otherCollider, selfCollider) {
    const self = this;
    if (null != self.targetStatefulBuildableOrderingNpc) {
      const boundStatefulBuildableOfCollider = otherCollider.boundStatefulBuildable; 
      if (self.targetStatefulBuildableOrderingNpc.boundStatefulBuildable == boundStatefulBuildableOfCollider) {
        self.stuckedAtStatefulBuildable = boundStatefulBuildableOfCollider;
        return;
      }
    }
    StatefulBuildableFollowingNpc.prototype.onCollisionEnter.apply(self, arguments);
  },


  onCollisionExit(otherCollider) {
    const self = this;
    const boundStatefulBuildableOfCollider = otherCollider.boundStatefulBuildable;
    if (boundStatefulBuildableOfCollider == self.stuckedAtStatefulBuildable) {
      self.stuckedAtStatefulBuildable = null;
    }
    StatefulBuildableFollowingNpc.prototype.onCollisionExit.apply(self, arguments);
  },

  update(dt=0) {
    const self = this;
    const housekeeperLevelBinding = self.currentLevelBinding;

    if (self.isPaused()) {
      if (null != self.lastPeriodStartedAt && 0 != self.lastPeriodStartedAt) {
        self.lastPeriodStartedAt += dt * 1000;
        self.housekeeperBinding.lastPeriodStartedAt = self.lastPeriodStartedAt;
      }
      return;
    }
    
    self._refreshAnimCompIfNecessary();

    const nowMillis = Date.now();
    const passedMillis = nowMillis - self.lastPeriodStartedAt;
    const servingEnabled = !self.mapIns.isInCombo() && null != self.lastPeriodStartedAt && 0 != self.lastPeriodStartedAt;
    if (!servingEnabled) {
      self.targetStatefulBuildableOrderingNpc = null;
      switch (self.state) {
      case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_IN:
      case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN:
        break;
      default:
        self.transitToMoving();
        self.refreshCurrentDestination();
        self.refreshContinuousStopsFromCurrentPositionToCurrentDestination();
        self.restartPatrolling();
        break;
      }
      return;
    }
    if (self.isOnDuty()) {
      switch (self.state) {
      case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_OUT:
        // The housekeeper is going to serve an orderingNpc, thus do nothing.
      break;
      case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STUCK_WHILE_MOVING_OUT:
      case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STUCK_WHILE_MOVING_IN:
      case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STUCK_NO_AVAILABLE_GRAND_SRC:
        // TODO: to handle the stuck of npc.
      break;
      case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_IN:
        if (null != self.targetStatefulBuildableOrderingNpc) {
          // The housekeeper is going to serve an orderingNpc, but why it is moving in?
          console.warn('There may be a ircorrect state, because the housekeeper is going to serve orderingNpc while it\'s state is MOVING_IN?');
          self.transitToMoving();
          self.refreshCurrentDestination();
          self.refreshContinuousStopsFromCurrentPositionToCurrentDestination();
          self.restartPatrolling();
        } else {
          self.targetStatefulBuildableOrderingNpc = self.mapIns.findAnOrderingNpcToServe(self);
          if (null == self.targetStatefulBuildableOrderingNpc) {
            // There can't find an orderingNpc to serve, thus break;
            break;
          }
          self.transitToMoving();
          self.refreshCurrentDestination();
          self.refreshContinuousStopsFromCurrentPositionToCurrentDestination();
          self.restartPatrolling();
        }
        break;
      case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_WHILE_MOVING_OUT:
      case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_WHILE_MOVING_IN:
      case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN:
      case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_OUT:
        if (null == self.targetStatefulBuildableOrderingNpc) {
          // The housekeeper is staying, thus to make it working.
          self.targetStatefulBuildableOrderingNpc = self.mapIns.findAnOrderingNpcToServe(self);
          if (null == self.targetStatefulBuildableOrderingNpc && self.state == STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN) {
            /*
             * If there can not find an orderingNpc to serve, trigger restartPatrolling to make the housekeeper goto grandSrc.
             * But if it is already at the grandSrc, just break.
             */ 
            break;
          }
          self.transitToMoving();
          self.refreshCurrentDestination();
          self.refreshContinuousStopsFromCurrentPositionToCurrentDestination();
          self.restartPatrolling();
        } else {
          if (self.state == STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_OUT) {
            // WARNING: Npc is already reach destination, why self.targetStatefulBuildableOrderingNpc is still not null?
            console.warn('There may be a ircorrect state, because the housekeeper is reach destination, but it\'s targetStatefulBuildableOrderingNpc is still not null');
            // force goto grandSrc by setting targetStatefulBuildableOrderingNpc to null.
            self.targetStatefulBuildableOrderingNpc = null;
          } else {
            /*
             * Why the housekeeper is Staying when it's targetStatefulBuildableOrderingNpc is not null?
             *   1. the autoOrder is clicked manully by user.
             *   2. the targetStatefulBuildableOrderingNpc's freeAutoOrder is timedout/aborted.
             */
            // To find a new target.
            self.targetStatefulBuildableOrderingNpc = self.mapIns.findAnOrderingNpcToServe(self);
          }
          self.transitToMoving();
          self.refreshCurrentDestination();
          self.refreshContinuousStopsFromCurrentPositionToCurrentDestination();
          self.restartPatrolling();
        }
        break;
      default:
        break;
      }
      if (null != self.mapIns.cachedGoldNodeList && 0 < self.mapIns.cachedGoldNodeList.length) {
        if (null != self._lastPickCachedGoldMillis && nowMillis - self._lastPickCachedGoldMillis < 1000) {
          // pick interval 1000, temporarily.
        } else {
          let targetCachedGoldIns = null;
          for (let cachedGoldNode of self.mapIns.cachedGoldNodeList) {
            let cachedGoldIns = cachedGoldNode.getComponent('CachedGold');
            if (!cachedGoldIns.couldBeAutoCollect) {
              continue;
            }
            if (!cachedGoldIns.hasTriggeredCollection) {
              targetCachedGoldIns = cachedGoldIns;
              break;
            }
            
          }
          if (null != targetCachedGoldIns && null != targetCachedGoldIns.node && null != targetCachedGoldIns.node.parent) {
            self._lastPickCachedGoldMillis = nowMillis;
            targetCachedGoldIns.onSelfClicked();
          }
        }
      }
    } else if (self.isRest()) {
      self.targetStatefulBuildableOrderingNpc = null;
      switch (self.state) {
      case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_IN:
      case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN:
        // The housekeeper is resting or is going to resting, thus do nothing.
        break;
      default:
        self.transitToMoving();
        self.refreshCurrentDestination();
        self.refreshContinuousStopsFromCurrentPositionToCurrentDestination();
        self.restartPatrolling();
        break;
      }
    } else if (passedMillis > housekeeperLevelBinding.ON_DUTY_DURATION_MILLIS + housekeeperLevelBinding.REST_DURATION_MILLIS) {
      cc.log('A period duration is passed:', nowMillis - self.lastPeriodStartedAt);
      self.lastPeriodStartedAt = nowMillis;
      self.housekeeperBinding.lastPeriodStartedAt = nowMillis;
      self.transitToStaying();
    }
    
  },

  disableClick() {
    const self = this;
    self.node.getComponentsInChildren(cc.Button).forEach(function(button) {
      button.enabled = false;
    });
  },

  enableClick() {
    const self = this;
    self.node.getComponentsInChildren(cc.Button).forEach(function(button) {
      button.enabled = true;
    });
  },

  isOnDuty() {
    const self = this;
    const nowMillis = Date.now();
    const passedMillis = nowMillis - self.lastPeriodStartedAt;
    const housekeeperLevelBinding = self.currentLevelBinding;
    return 0 <= passedMillis && passedMillis <= housekeeperLevelBinding.ON_DUTY_DURATION_MILLIS;
  },

  isRest() {
    const self = this;
    const nowMillis = Date.now();
    const passedMillis = nowMillis - self.lastPeriodStartedAt;
    const housekeeperLevelBinding = self.currentLevelBinding;
    return housekeeperLevelBinding.ON_DUTY_DURATION_MILLIS < passedMillis && passedMillis <= housekeeperLevelBinding.ON_DUTY_DURATION_MILLIS + housekeeperLevelBinding.REST_DURATION_MILLIS;
  },

  onLoad() {
    const self = this;
    self.setAnim(self.speciesName, () => {
      self.transitToStaying();
    });

    // addToGlobalShelterChainVerticeMap [begin]
    const shelterChainColliderNode = self.node.getChildByName('ShelterChainCollider');
    shelterChainColliderNode.thePlayerNode = self.node;
    self.node.origZIndex = window.CORE_LAYER_Z_INDEX.UN_HIGHLIGHTED_STATEFUL_BUILDABLE_INSTANCE;
    window.addToGlobalShelterChainVerticeMap(self.node);
    // addToGlobalShelterChainVerticeMap [end]

    // Initialization of click event. [begin]
    const clickHandler = new cc.Component.EventHandler();
    clickHandler.target = self.node;
    clickHandler.component = self.node.name;
    clickHandler.handler = 'onClicked';
    self.node.getComponent(cc.Button).clickEvents = [
      clickHandler
    ];
    // Initialization of click event. [end]
    
    // Play popup up and sync animation. [begin]
    let action = cc.sequence(
      cc.moveBy(0.7, cc.v2(0, 10)),
      cc.moveBy(0.7, cc.v2(0, -10))
    );
    self.unlockTip.runAction(cc.repeatForever(action));
    // Play popup up and sync animation. [end]

    // Prevent the tip is hiden by orderingNpc or buildable. [begin] {
    this.unlockTipOffset = this.unlockTip.position;
    this.servingTipOffset = this.servingTip.position;
    safelyAssignParent(this.unlockTip, this.mapIns.node);
    safelyAssignParent(this.servingTip, this.mapIns.node);
    setLocalZOrder(this.unlockTip, window.CORE_LAYER_Z_INDEX.POPUP_OVER_HOUSEKEEPER_NPC);
    setLocalZOrder(this.servingTip, window.CORE_LAYER_Z_INDEX.POPUP_OVER_HOUSEKEEPER_NPC);
    this._onNodePositionChange();
    this.node.on(cc.Node.EventType.POSITION_CHANGED, this._onNodePositionChange, this);
    // Prevent the tip is hiden by orderingNpc or buildable. [end] }

  },

  transitToMoving(cb) {
    const self = this;
    if (null != self.targetStatefulBuildableOrderingNpc) {
      self.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_OUT;
    } else {
      self.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_IN;
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

  refreshGrandSrcAndCurrentDestination() {
    const self = this;
    self.preGrandSrc = self.grandSrc;

    self.grandSrc = self.boundStatefulBuildable.fixedSpriteCentreContinuousPos.add(
      (null == self.specifiedOffsetFromSpriteCentre ? self.boundStatefulBuildable.estimatedSpriteCentreToAnchorTileCentreContinuousOffset : self.specifiedOffsetFromSpriteCentre)  
    );
    if (null != self.targetStatefulBuildableOrderingNpc) {
      // thus do nothing.
    } else {
      self.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_IN;
      self.refreshCurrentDestination();
    }
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
        if (null != self.currentDestination) {
          previousDiscretizedDestinaion = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.currentDestination, cc.v2(0, 0));
        }
        if (null != self.targetStatefulBuildableOrderingNpc) {
          self.currentDestination = self.targetStatefulBuildableOrderingNpc.node.position.
            add(
              cc.v2(self.targetStatefulBuildableOrderingNpc.node.width / 2, 0)
            );
        } else {
          self.currentDestination = self.grandSrc;
        }
        discretizedDestination = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.currentDestination, cc.v2(0, 0));
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

  _refreshAnimCompIfNecessary() {
    // This method is to confirm the npc's animation is right for it's state, include isOnDuty/isRest.
    const self = this;
    const clipKey = self.clips[self.scheduledDirection.dx.toString() + self.scheduledDirection.dy.toString()];
    self._playAnimComp(clipKey, false);
  },

  _playAnimComp(clip, forceReplay=false) {
    const self = this;
    if (null != clip && (self.animComp instanceof dragonBones.ArmatureDisplay)) {
      switch (self.state) {
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_OUT:
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_IN:
        clip = cc.js.formatStr("Walking_%s", clip);
        break;
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_OUT:
        if (null == self.targetStatefulBuildableOrderingNpc) {
          clip = cc.js.formatStr("Staying_%s", clip);
        } else {
          switch (self.targetStatefulBuildableOrderingNpc.chairDirection) {
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
        }
        break;
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN:
        if (self.mapIns.isInCombo()) {
          clip = cc.js.formatStr("Staying_%s", clip);
        } else if (null == self.lastPeriodStartedAt || 0 == self.lastPeriodStartedAt) {
          clip = cc.js.formatStr("Ordering_%s", clip);
        } else {
          if (self.isRest()) {
            clip = cc.js.formatStr("Resting_%s", clip);
          } else {
            clip = cc.js.formatStr("Staying_%s", "BottomLeft");
          }
        }
        break;
      default:
        clip = cc.js.formatStr("Staying_%s", clip);
        break;
      }
      BasePlayer.prototype._playAnimComp.call(self, clip, forceReplay);
    }
  },

  
  refreshContinuousStopsFromCurrentPositionToCurrentDestination(waiveBoundStatefulBuildableCheck=false, ignoreCurrentGridBarrierCheck=true, ignoreDestinationGridBarrierCheck=true, ignoreBuildableIdList) {
    const self = this;
    console.log("Housekeeper is refreshContinuousStopsFromCurrentPositionToCurrentDestination.");
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

      if (null != self.targetStatefulBuildableOrderingNpc) {
        const statefulBuildableInstanceComp = self.targetStatefulBuildableOrderingNpc.boundStatefulBuildable;
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

      if (null != self.stuckedAtStatefulBuildable) {
        const statefulBuildableInstanceComp = self.stuckedAtStatefulBuildable;
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
      
      self.movementStops = window.findPathWithMapDiscretizingAStar(self.node.position, self.currentDestination, 0.01 /* Hardcoded temporarily */ , npcBarrierCollider, self.mapIns.barrierColliders, null, self.mapNode, null, discreteBarrierGridsToIgnore);
      if (null != self.movementStops) {
        self.movementStops.push(self.currentDestination);
      }
    }
    // console.log("For statefulBuildableFollowingNpcComp.uuid == ", self.uuid, ", found steps from ", self.node.position, " to ", self.currentDestination, " :", self.movementStops);

  },

  transitToStaying() {
    const self = this;
    let servingRet = null;
    StatefulBuildableFollowingNpc.prototype.transitToStaying.apply(self, arguments);
    if (null != self._timer) {
      clearTimeout(self._timer);
      self._timer = null;
      self.servingTip.active = false;
      self.resume();
    }
    switch (self.state) {
    case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN:
      if (self.mapIns.isInCombo()) {
        self.unlockTip.active = false;
        self.pause();
      } else if (null == self.lastPeriodStartedAt || 0 == self.lastPeriodStartedAt) {
        self.unlockTip.active = true;
      } else {
        self.unlockTip.active = false;
      }
      break;
    case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_OUT:
      servingRet = self.servingTargetOrderingNpc();
      if (servingRet.succeed) {
        self.servingTip.active = true;
        if (servingRet.ingredientUnlocked) {
          self.servingTipLabel.string = i18n.t("Housekeeper.words." + getRandomInt(1, 7));
        } else {
          self.servingTipLabel.string = i18n.t("Housekeeper.sorryWords." + getRandomInt(1, 5));
        }
        self.pause();
        self._timer = setTimeout(function() {
          self._timer = null;
          self.servingTip.active = false;
          self.resume();
        }, self.servingTipPreservedDuration);
      } else {
        self.servingTip.active = false;
      }
      break;
    default:
    break;
    }
  },
  
  restartPatrolling() {
    const self = this;
    self.unlockTip.active = false;
    self.servingTip.active = false;
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
  
  servingTargetOrderingNpc() {
    const self = this;
    let succeed = false, ingredientUnlocked = false;
    const targetStatefulBuildableOrderingNpc = self.targetStatefulBuildableOrderingNpc;
    self.targetStatefulBuildableOrderingNpc = null;
    if (null != targetStatefulBuildableOrderingNpc) {
      const freeAutoOrder = targetStatefulBuildableOrderingNpc.boundAutoOrder;
      if (null != freeAutoOrder && null == freeAutoOrder.deletedAt && null != freeAutoOrder.targetAutoOrderPopup && freeAutoOrder.state == constants.FREE_AUTO_ORDER_STATE.NOT_TAKEN) {
        let playerIngredientForIdleGame = self.mapIns.getPlayerIngredientForIdleGameByIngredientId(freeAutoOrder.targetIngredientId);
        if (null == playerIngredientForIdleGame || playerIngredientForIdleGame.state != constants.PLAYER_INGREDIENT_FOR_IDLEGAME.STATE.UNLOCKED) {
          ingredientUnlocked = false;
        } else {
          ingredientUnlocked = true;
        }
        freeAutoOrder.targetAutoOrderPopup.onSelfClicked();
        succeed = true;
      }
    }
    return {
      succeed: succeed,
      ingredientUnlocked: ingredientUnlocked,
    };
  },

  pause() {
    const self = this;
    self._paused = true;
    self.node.pauseAllActions();
  },

  resume() {
    const self = this;
    self._paused = false; 
    self.node.resumeAllActions();
  },

  isPaused() {
    return this._paused;
  },

  onDestroy() {
    const self = this;
    StatefulBuildableFollowingNpc.prototype.onDestroy.apply(self, arguments);
    if (null != self._timer) {
      clearTimeout(self._timer);
    }
    this.unlockTip.destroy();
    this.servingTip.destroy();
    this.node.off(cc.Node.EventType.POSITION_CHANGED, this._onNodePositionChange, this);
  },

  _onNodePositionChange() {
    const self = this;
    self.unlockTip.position = self.node.position.add(self.unlockTipOffset);
    self.servingTip.position = self.node.position.add(self.servingTipOffset);
  },

});
