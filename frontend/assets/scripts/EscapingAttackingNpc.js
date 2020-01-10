const StatefulBuildableAttackingNpc = require("./StatefulBuildableAttackingNpc");
const BasePlayer = require("./BasePlayer");

window.ESCAPING_ATTACKING_NPC_STATE = {
  MOVING_IN: 2,

  STUCK_WHILE_MOVING_IN: 4,

  STAYING_WHILE_MOVING_IN: 6,
  ATTACKING_WHILE_MOVING_IN: 7,

  STAYING_AT_DESTINATION_AFTER_MOVING_IN: 8,
  ATTACKING_AT_DESTINATION_AFTER_MOVING_IN: 9,

  DYING: 10,

  TRACING_TARGET_IN_VISION: 11, // But not in "Defender" range.
};

module.export = cc.Class({
  extends: StatefulBuildableAttackingNpc,

  properties: {
    compUuidLabel: {
      type: cc.Label,
      default: null,
    },
    hpBarLastingDurationMillis: {
      default: 2000,
    },
    hpBar: {
      type: cc.ProgressBar,
      default: null,
    },
    hpResidualLabel: {
      type: cc.Label,
      default: null,
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
    this.state = ESCAPING_ATTACKING_NPC_STATE.MOVING_IN;
    this.movementStops = null;
    this.homePosInMapNode = null;
    this.targetPosInMapNode = null;
    this.drawer = null;
    this.finishAttackTimeout = null;
    this.attackTimeout = null;
    this.consumedIngredient = null;
    this.teamId = constants.BATTLE_TEAM.DEFAULT_ALLY_TEAM_ID; // Should be an integer local to the currently involved battle.

    const self = this;
    this.onCurrentDestinationArrived = () => {
      if (null == self.mapIns) {
        console.warn("Null `self.mapIns` when `onCurrentDestinationArrived` called.");
        return;
      }
      self.mapIns.onEscapingAttackingNpcFled(self);
    };

    this.isBeingInspected = false;
      
    this.paralyzedDebuff = {
      speedFpsDiscountPercentage: 0, 
      attackFpsDiscountPercentage: 0,
      startedAt: null, // That "null == this.paralyzedDebuff.startedAt" implies "not paralyzed".
      durationMilis: 0,
    };
  },

  onLoad() {
    /*
    Will call "self.setAnim" within "StatefulBuildableAttackingNpc.prototype.onLoad".
    
    -- YFLu, 2019-10-31.
    */
    StatefulBuildableAttackingNpc.prototype.onLoad.call(this);
    this.speed = constants.NPC_BASE_SPEED[this.speciesName];
    
    if (null == this.currentDestination) {
      this.transitToStaying();
    }

    this.hpBarOffsetWrtSelf = this.hpBar.node.position;
    this.hpResidualLabelOffsetWrtSelf = this.hpResidualLabel.node.position;
    this.compUuidLabel.string = this.uuid;
  },

  transferHpGuiToMapNodeAndUpdatePosition() {
    if (null == this.mapIns) {
      return;
    }
    if (null != this.hpBar && null != this.hpBarOffsetWrtSelf) {
      const newHpBarPos = this.node.position.add(this.hpBarOffsetWrtSelf); 
      if (this.hpBar.node.parent == this.node) {
        this.hpBar.node.removeFromParent();
        this.hpBar.node.setPosition(newHpBarPos);
        safelyAddChild(this.mapIns.node, this.hpBar.node);
        setLocalZOrder(this.hpBar.node, CORE_LAYER_Z_INDEX.INFINITY);
      } else {
        this.hpBar.node.setPosition(newHpBarPos);
      }
    }

    if (null != this.hpResidualLabel && null != this.hpResidualLabelOffsetWrtSelf) {
      const newHpResidualLabelPos = this.node.position.add(this.hpResidualLabelOffsetWrtSelf); 
      if (this.hpResidualLabel.node.parent == this.node) {
        this.hpResidualLabel.node.removeFromParent();
        this.hpResidualLabel.node.setPosition(newHpResidualLabelPos);
        safelyAddChild(this.mapIns.node, this.hpResidualLabel.node);
        setLocalZOrder(this.hpResidualLabel.node, CORE_LAYER_Z_INDEX.INFINITY);
      } else {
        this.hpResidualLabel.node.setPosition(newHpResidualLabelPos);
      }
    }
  },

  onDestroy() {
    StatefulBuildableAttackingNpc.prototype.onDestroy.call(this);
    this._stopAttacking();
  },

  onCollisionEnter(otherCollider, selfCollider) {
    BasePlayer.prototype.onCollisionEnter.call(this, otherCollider, selfCollider);
    const self = this.getComponent(this.node.name);
    switch (otherCollider.node.name) {
      case "PolygonBoundaryBarrier":
        const otherColliderScriptIns = otherCollider.node.getComponent(cc.PolygonCollider); 
        if (null == otherColliderScriptIns.boundStatefulBuildable) {
          /*
          If the current Npc collides with a non-buildable-barrier, we're not going to do anything for it and it might just stick to that barrier. 
          
          -- YFLu, 2019-12-08.
          */
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
        self.rerouteIfNotAttacking();
        break;
      default:
        break;
    }
  },

  transitToStayingIfNotAttacking(cb) {
    if (true == this._isAttacking()) {
      return;
    }
    this.transitToStaying(cb);
  },

  transitToStaying(cb) {
    const self = this;
    // Don't execute the calculation of "continuous -> discrete coordinate" before checking the current state.
    let discretizedSelfNodePos = null;
    let discretizedDestination = null;

    switch (this.state) {
      case window.ESCAPING_ATTACKING_NPC_STATE.ATTACKING_WHILE_MOVING_IN:
      case window.ESCAPING_ATTACKING_NPC_STATE.ATTACKING_AT_DESTINATION_AFTER_MOVING_IN:
      case window.ESCAPING_ATTACKING_NPC_STATE.MOVING_IN:
      case window.ESCAPING_ATTACKING_NPC_STATE.TRACING_TARGET_IN_VISION:
        discretizedSelfNodePos = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.node.position, cc.v2(0, 0));
        if (null != self.currentDestination) {
          discretizedDestination = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.currentDestination, cc.v2(0, 0));
        }
        if (null != discretizedDestination && discretizedSelfNodePos.x == discretizedDestination.x && discretizedSelfNodePos.y == discretizedDestination.y) {
          this.state = window.ESCAPING_ATTACKING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN;
        } else {
          this.state = window.ESCAPING_ATTACKING_NPC_STATE.STAYING_WHILE_MOVING_IN;
        }
        this.node.stopAllActions();
        break;
      default:
        break;
    }

    self.animComp.timeScale = constants.NPC_BASE_STAYING_BASE_TIME_SCALE[self.speciesName]; 
    const clipKey = self.clips[self.scheduledDirection.dx.toString() + self.scheduledDirection.dy.toString()];
    self._playAnimComp(clipKey);
    if (cb) {
      cb();
    }
  },

  transitToDying(cb) {
    const self = this;
    // Don't execute the calculation of "continuous -> discrete coordinate" before checking the current state.
    let discretizedSelfNodePos = null;

    switch (this.state) {
      default:
        this.state = window.ESCAPING_ATTACKING_NPC_STATE.DYING;
        this.node.stopAllActions();
        break;
    }

    self.animComp.timeScale = 1; 
    const clipKey = self.clips[self.scheduledDirection.dx.toString() + self.scheduledDirection.dy.toString()];

    const onDied = () => {
      self.animComp._playing = false;
      self.animComp.off(dragonBones.EventObject.LOOP_COMPLETE, onDied, self);
      if (cb) {
        cb();
      }
    };
    self.animComp.on(dragonBones.EventObject.LOOP_COMPLETE, onDied, self);
    self._playAnimComp(clipKey);
  },

  _startAttacking() {
    const self = this;
    if (0 >= self.baseDamage) {
      return;
    }

    if (0 >= self.baseAttackFps) {
      return;
    }

    const attackLoopDurationMillis = (1000/self.baseAttackFps);

    const attackAction = () => {
      if (null == self.mapIns) {
        self._stopAttacking();
        return;
      }
      if (false == [ESCAPING_ATTACKING_NPC_STATE.ATTACKING_AT_DESTINATION_AFTER_MOVING_IN, ESCAPING_ATTACKING_NPC_STATE.ATTACKING_WHILE_MOVING_IN].includes(self.state)) {
        self._stopAttacking();
        return;
      }
      if (null == self.defenderScriptIns || 0 >= Object.keys(self.defenderScriptIns.inRangeToAttackTargets).length) {
        self._stopAttacking();
        return;
      }
      
      if (self.mapIns.isPaused()) {
        self.attackTimeout = setTimeout(attackAction, attackLoopDurationMillis);
        return;
      }
      const targetToAttackIndex = Object.keys(self.defenderScriptIns.inRangeToAttackTargets)[0];
      const targetToAttack = self.defenderScriptIns.inRangeToAttackTargets[targetToAttackIndex];
      if (null == targetToAttack) {
        self.attackTimeout = setTimeout(attackAction, attackLoopDurationMillis);
        return;
      }
      if (
        null == targetToAttack.node 
        || 
        !cc.isValid(targetToAttack.node)
        ||
        (targetToAttack.node.name == "StatefulBuildableInstance" && false == targetToAttack.shouldColliderWithAttackingNpcDefender())
        ) {
        delete self.defenderScriptIns.inRangeToAttackTargets[targetToAttackIndex];
        self.attackTimeout = setTimeout(attackAction, 0);
        return;
      }
      if (null == self.node || null == self.node.parent) {
        self._stopAttacking();
        return;
      }
      
      const shootTargetAndStop = () => { 
        self.transitToStaying();
        self.animComp.off(dragonBones.EventObject.LOOP_COMPLETE, shootTargetAndStop, self);
      };
      if (null != self.delayedShoot) {
        clearTimeout(self.delayedShoot);
      }
      self.delayedShoot = setTimeout(() => {
        self._shoot(targetToAttack); 
      }, constants.NPC_BULLET_DELAYED_SHOOT_MILLIS[self.speciesName]);

      self.animComp.on(dragonBones.EventObject.LOOP_COMPLETE, shootTargetAndStop, self);
      const clipKey = self.clips[self.scheduledDirection.dx.toString() + self.scheduledDirection.dy.toString()];
      self.animComp.timeScale = constants.NPC_BASE_ATTACK_BASE_TIME_SCALE[self.speciesName]; 
      self._playAnimComp(clipKey, true);
      self.attackTimeout = setTimeout(attackAction, attackLoopDurationMillis);
    };
    self.attackTimeout = setTimeout(attackAction, 0); // For the first attack, no need to wait for first loop duration. -- YFLu, 2019-10-31.
  },

  _stopAttacking() {
    const self = this;
    if (null != self.attackTimeout) {
      clearTimeout(self.attackTimeout);
      self.attackTimeout = null;
    }
    if (null != self.delayedShoot) {
      clearTimeout(self.delayedShoot);
      self.delayedShoot = null;
    }
  },

  _restartAttacking() {
    this._stopAttacking();
    this._startAttacking();
  },

  _isAttacking() {
    switch (this.state) {
      case window.ESCAPING_ATTACKING_NPC_STATE.ATTACKING_AT_DESTINATION_AFTER_MOVING_IN:
      case window.ESCAPING_ATTACKING_NPC_STATE.ATTACKING_WHILE_MOVING_IN:
      return true;
      case window.ESCAPING_ATTACKING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN:
      case window.ESCAPING_ATTACKING_NPC_STATE.STAYING_WHILE_MOVING_IN:
      return (null != this.defenderScriptIns && null != this.defenderScriptIns.inRangeToAttackTargets && 0 < Object.keys(this.defenderScriptIns.inRangeToAttackTargets).length && null != this.attackTimeout);
      default:
      break;
    }
    return false;
  },


  transitToAttacking(cb) {
    const self = this;

    switch (this.state) {
      case window.ESCAPING_ATTACKING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN:
        self.state = window.ESCAPING_ATTACKING_NPC_STATE.ATTACKING_AT_DESTINATION_AFTER_MOVING_IN;
        self._restartAttacking();
        break;
      case window.ESCAPING_ATTACKING_NPC_STATE.STAYING_WHILE_MOVING_IN:
        self.state = window.ESCAPING_ATTACKING_NPC_STATE.ATTACKING_WHILE_MOVING_IN;
        self._restartAttacking();
        break;
      default:
        break;
    }
  },

  transitToMoving(cb) {
    const self = this;
    switch (this.state) {
      case window.ESCAPING_ATTACKING_NPC_STATE.STAYING_WHILE_MOVING_IN:
      case window.ESCAPING_ATTACKING_NPC_STATE.STUCK_WHILE_MOVING_IN:
      case window.ESCAPING_ATTACKING_NPC_STATE.TRACING_TARGET_IN_VISION:
        this.state = window.ESCAPING_ATTACKING_NPC_STATE.MOVING_IN;
        break;
      default:
        break;
    }

    self.animComp.timeScale = constants.NPC_BASE_MOVEMENT_BASE_TIME_SCALE[self.speciesName]; 
    const clipKey = self.clips[self.scheduledDirection.dx.toString() + self.scheduledDirection.dy.toString()];
    self._playAnimComp(clipKey);
    if (cb) {
      cb();
    }
  },

  transitToTracingTargetInVisionIfNotAttackingAndNoAttackable(cb) {
    if (true == this._isAttacking()) {
      return;
    }
    this.transitToTracingTargetInVision(cb);
  },

  transitToTracingTargetInVision(cb) {
    const self = this;
    self.node.stopAllActions();
   
    switch (this.state) {
      case window.ESCAPING_ATTACKING_NPC_STATE.STAYING_WHILE_MOVING_IN:
      case window.ESCAPING_ATTACKING_NPC_STATE.STUCK_WHILE_MOVING_IN:
      case window.ESCAPING_ATTACKING_NPC_STATE.MOVING_IN:
        this.state = window.ESCAPING_ATTACKING_NPC_STATE.TRACING_TARGET_IN_VISION;
        break;
      default:
        break;
    }

    self.animComp.timeScale = 1; 
    const clipKey = self.clips[self.scheduledDirection.dx.toString() + self.scheduledDirection.dy.toString()];
    self._playAnimComp(clipKey);
    if (cb) {
      cb();
    }
  },

  refreshContinuousStopsFromCurrentPositionToCurrentDestination() {
    StatefulBuildableAttackingNpc.prototype.refreshContinuousStopsFromCurrentPositionToCurrentDestination.call(this, true, false, false, constants.ATTACKING_NPC_WILL_IGNORE_BUILDABLE_BARRIER_LIST);
  },

  refreshCurrentDestination(targetContinuousPosInMapNode) {
    /**
    * WARNING: You should update `this.state` before calling this method. 
    */
    let previousDiscretizedDestinaion = null;
    let discretizedDestination = null;
    const self = this;
    if (null == self.node || !cc.isValid(self.node) || null == self.mapIns.tiledMapIns || null == targetContinuousPosInMapNode) {
      return;
    }

    self.node.stopAllActions();
    switch (self.state) {
      case window.ESCAPING_ATTACKING_NPC_STATE.MOVING_IN:
      case window.ESCAPING_ATTACKING_NPC_STATE.STUCK_WHILE_MOVING_IN:
      case window.ESCAPING_ATTACKING_NPC_STATE.STAYING_WHILE_MOVING_IN:
      case window.ESCAPING_ATTACKING_NPC_STATE.ATTACKING_AT_DESTINATION_AFTER_MOVING_IN:
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

  _shoot(targetToAttack) {
    const self = this;
    let bulletNode = null;
    let bulletScriptIns = null;
    const bulletStartPosOffsetOnMapNode = cc.v2(0, 0); // Hardcoded temporarily. -- YFLu
    switch (constants.NPC_BULLET_TYPE[self.speciesName]) {
    case constants.BULLET_TYPE.INVISIBLE:
      bulletNode = cc.instantiate(self.mapIns.bulletPrefab);
      bulletScriptIns = bulletNode.getComponent("Bullet");
      bulletScriptIns.tailNode.active = false;
    break;
    case constants.BULLET_TYPE.LINEAR:
      bulletNode = cc.instantiate(self.mapIns.linearBulletPrefab);
      bulletScriptIns = bulletNode.getComponent("LinearBullet");
    break;
    default:
    break; 
    }

    bulletScriptIns.teamId = self.teamId;
    bulletScriptIns.explosionType = constants.NPC_BULLET_EXPLOSION_TYPE[self.speciesName];
    bulletNode.setPosition(self.node.position.add(bulletStartPosOffsetOnMapNode));

    bulletScriptIns.baseDamage = self.baseDamage;
    bulletScriptIns.mapIns = self.mapIns;
    bulletScriptIns.targetScriptIns = targetToAttack;
    bulletScriptIns.emitterCharacter = self;
    safelyAddChild(self.mapIns.node, bulletNode);
    setLocalZOrder(bulletNode, window.CORE_LAYER_Z_INDEX.CACHED_GOLD);
  },

  _playAnimComp(clip, forceReplay=false) {
    const self = this;
    if (null != clip && (self.animComp instanceof dragonBones.ArmatureDisplay)) {
      let suffix = clip.replace(/Top/, "Bottom");
  
      let prefix = "";

      switch (self.state) {
      case window.ESCAPING_ATTACKING_NPC_STATE.ATTACKING_WHILE_MOVING_IN:
      case window.ESCAPING_ATTACKING_NPC_STATE.ATTACKING_AT_DESTINATION_AFTER_MOVING_IN:
        prefix = "Attacking_";
        break;
      case window.ESCAPING_ATTACKING_NPC_STATE.DYING:
        prefix = "Dying_";
        break;
      case window.ESCAPING_ATTACKING_NPC_STATE.STAYING_WHILE_MOVING_IN:
      case window.ESCAPING_ATTACKING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN:
      case window.ESCAPING_ATTACKING_NPC_STATE.STUCK_WHILE_MOVING_IN:
        prefix = "Winning_";
      break;
      default:
        prefix = "Walking_";
        break;
      }

      clip = cc.js.formatStr("%s%s", prefix, suffix);
      BasePlayer.prototype._playAnimComp.call(self, clip, forceReplay);
    } else {
      console.error("EscapingAttackingNpc._playAnimComp ", " we require `self.animComp of dragonBones.ArmatureDisplay` and `null != clip`!");
    }
  },

  rerouteIfNotAttacking() {
    if (null == this.currentDestination) {
      return;
    }
    if (true == this._isAttacking()) {
      return;
    }
    this.refreshCurrentDestination(this.currentDestination);
    this.refreshContinuousStopsFromCurrentPositionToCurrentDestination();
    this.restartFollowing();
  },

  setAnim(speciesName, cb) {
    /*
    [WARNING]
    Deliberately overriding "StatefulBuildableAttackingNpc.setAnim(...)".

    -- YFLu, 2019-10-30.
    */
    const self = this;

    let targetNode = self.node.getChildByName(cc.js.formatStr("%s", self.speciesName));
    self.animComp = targetNode.getComponent(dragonBones.ArmatureDisplay); 
    if (false == targetNode.active) {
      targetNode.active = true;
    } 

    if (cb) {
      cb(true);
    }
  },

  feedToShowHpBar() {
    this.hpBar.node.active = true;
    this.hpBarDisplaylastFedAt = Date.now();
  }, 
  
  update(dt) {
    StatefulBuildableAttackingNpc.prototype.update.call(this, dt);
    const self = this;
    try {
      if (null != this.hpBar && true == this.hpBar.node.active) {
        this.hpResidualLabel.string = cc.js.formatStr("%s/%s", this.remainingHp, this.baseHp);
        const remainingHpRatio = (this.remainingHp/this.baseHp);
        this.hpBar.progress = remainingHpRatio;

        if (null != this.hpBarDisplaylastFedAt) {
          if (Date.now() - this.hpBarDisplaylastFedAt > this.hpBarLastingDurationMillis) {
            if (false == this.isBeingInspected) {
              this.hpBar.node.active = false;
            }
          }
        } 
        this.transferHpGuiToMapNodeAndUpdatePosition();
      }
    
      if (null != self.defenderScriptIns && null != self.defenderScriptIns.inRangeToAttackTargets && 0 < Object.keys(self.defenderScriptIns.inRangeToAttackTargets).length) {
        /*
        * The "defenderScriptIns.inRangeToAttackTargets" has a higher priority than "visionScriptIns.inRangeToAttackTargets" to trigger any state transition.
        *
        * -- YFLu, 2019-11-21.
        */
        if (null == self.attackTimeout) {
          self.transitToStayingIfNotAttacking(() => {
            // Transitting to "staying" is a prerequisite to call "transitToAttacking".
            self.transitToAttacking();
          }); 
        } else {
          /*
          * If "defenderScriptIns.inRangeToAttackTargets" is not empty whilst "null != self.attackTimeout", there's still a chance that this npc 
          * is at a state of "STAYING_*" between two shots!
          *
          * -- YFLu, 2019-11-21.
          */
        }
        return;
      }

      if (null != self.visionScriptIns && null != self.visionScriptIns.inRangeToAttackTargets && 0 < Object.keys(self.visionScriptIns.inRangeToAttackTargets).length) {
        self.transitToTracingTargetInVisionIfNotAttackingAndNoAttackable(); 
      }
    
      if (ESCAPING_ATTACKING_NPC_STATE.TRACING_TARGET_IN_VISION == self.state) {
        const targetToTraceIndex = Object.keys(self.visionScriptIns.inRangeToAttackTargets)[0];
        const targetToTrace = self.visionScriptIns.inRangeToAttackTargets[targetToTraceIndex];
        if (null == targetToTrace) {
          if (null != self.currentDestination) {
            /**
             * This state correction is compulsory, otherwise the npc with a "currentDestination" will halt forever.
             *
             * -- YFLu, 2019-11-21.
             */
            self.transitToStaying(() => {
              self.rerouteIfNotAttacking();
            });
          }
          return;
        }

        // Tracing the target.
        const newDir = targetToTrace.node.position.sub(self.node.position);   
        self.activeDirection.dx = newDir.x;
        self.activeDirection.dy = newDir.y;

        const vecToMoveBy = self._calculateVecToMoveBy(dt);
        if (null == vecToMoveBy) {
          return;
        }
        if (self._canMoveBy(vecToMoveBy)) {
          const discretizedDirection = self.mapIns.ctrl.discretizeDirection(vecToMoveBy.x, vecToMoveBy.y, self.mapIns.ctrl.joyStickEps);
          self.scheduleNewDirection(discretizedDirection);
          self.node.position = self.node.position.add(vecToMoveBy);
        }
      } else {
        if (null != self.currentDestination) {
          /*
           Per reaching here, the npc is neither tracing or having any "defenderScriptIns.inRangeToAttackTargets", yet it might still be in an attacking state due to chaotic sequence of signals, thus we make a check-and-correct below.
           
           -- YFLu, 2019-11-21.
           */
          switch (self.state) {
          case ESCAPING_ATTACKING_NPC_STATE.ATTACKING_WHILE_MOVING_IN:
          case ESCAPING_ATTACKING_NPC_STATE.STAYING_WHILE_MOVING_IN:
          case ESCAPING_ATTACKING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN:
          case ESCAPING_ATTACKING_NPC_STATE.STUCK_WHILE_MOVING_IN:
            self._stopAttacking();
            self.transitToStaying(() => {
              self.rerouteIfNotAttacking();
            });
          break;
          default:
          break;
          }
        }
      }
    } catch (e) {
      console.warn("EscapingAttackingNpc.update, error == ", e);
    }
  },
  
  // Overriding "BasePlayer" methods for tracing along barriers. [begins] 
  _calculateTangentialMovementAttrs(currentSelfColliderCircle, contactedBarrier) {
    /*
     * Theoretically when the `contactedBarrier` is a convex polygon and the `PlayerCollider` is a circle, there can be only 1 `contactedEdge` for each `contactedBarrier`. Except only for around the corner.
     *
     * We should avoid the possibility of players hitting the "corners of convex polygons" by map design wherever & whenever possible.
     *
     */
    const self = this;
    const sDir = self.activeDirection;
    const currentSelfColliderCircleCentrePos = (currentSelfColliderCircle.position ? currentSelfColliderCircle.position : self.node.position.add(currentSelfColliderCircle.offset));
    const currentSelfColliderCircleRadius = currentSelfColliderCircle.radius;
    let contactedEdgeCandidateList = [];
    let skinDepthThreshold = 0.45*currentSelfColliderCircleRadius;
    for (let i = 0; i < contactedBarrier.points.length; ++i) {
      const stPoint = contactedBarrier.points[i].add(contactedBarrier.offset).add(contactedBarrier.node.position);
      const edPoint = (i == contactedBarrier.points.length - 1 ? contactedBarrier.points[0].add(contactedBarrier.offset).add(contactedBarrier.node.position) : contactedBarrier.points[1 + i].add(contactedBarrier.offset).add(contactedBarrier.node.position));
      const tmpVSt = stPoint.sub(currentSelfColliderCircleCentrePos);
      const tmpVEd = edPoint.sub(currentSelfColliderCircleCentrePos);
      const crossProdScalar = tmpVSt.cross(tmpVEd);
      if (0 < crossProdScalar) {
        // If moving parallel along `st <-> ed`, the trajectory of `currentSelfColliderCircleCentrePos` will cut inside the polygon. 
        continue; 
      } 
      const dis = cc.Intersection.pointLineDistance(currentSelfColliderCircleCentrePos, stPoint, edPoint, true); 
      if (dis > currentSelfColliderCircleRadius) continue;
      if (dis < skinDepthThreshold) continue;
      contactedEdgeCandidateList.push({
        st: stPoint, 
        ed: edPoint,
        associatedBarrier: contactedBarrier,
      });
    }
    let contactedEdge = null;
    let contactedEdgeDir = null;
    let largestInnerProdAbs = Number.MIN_VALUE;

    if (0 < contactedEdgeCandidateList.length) {
      const sDirMag = Math.sqrt(sDir.dx * sDir.dx + sDir.dy * sDir.dy);
      for (let contactedEdgeCandidate of contactedEdgeCandidateList) {  
        const tmp = contactedEdgeCandidate.ed.sub(contactedEdgeCandidate.st);
        const contactedEdgeDirCandidate = {
          dx: tmp.x,
          dy: tmp.y,
        };
        const contactedEdgeDirCandidateMag = Math.sqrt(contactedEdgeDirCandidate.dx * contactedEdgeDirCandidate.dx + contactedEdgeDirCandidate.dy * contactedEdgeDirCandidate.dy);
        const innerDotProd = (sDir.dx * contactedEdgeDirCandidate.dx + sDir.dy * contactedEdgeDirCandidate.dy)/(sDirMag * contactedEdgeDirCandidateMag); 
        const innerDotProdThresholdMag = 0.7;
        if ((0 > innerDotProd && innerDotProd > -innerDotProdThresholdMag) || (0 < innerDotProd && innerDotProd < innerDotProdThresholdMag)) {
          // Intentionally left blank, in this case the player is trying to escape from the `contactedEdge`.    
          continue;
        } else if (innerDotProd > 0) {
          const abs = Math.abs(innerDotProd);
          if (abs > largestInnerProdAbs) {
            contactedEdgeDir = contactedEdgeDirCandidate; 
            contactedEdge = contactedEdgeCandidate;
          }
        } else {
          const abs = Math.abs(innerDotProd);
          if (abs > largestInnerProdAbs) {
            contactedEdgeDir = {
              dx: -contactedEdgeDirCandidate.dx,
              dy: -contactedEdgeDirCandidate.dy,
            };
            contactedEdge = contactedEdgeCandidate; 
          }
        }
      }
    } 
    return {
      contactedEdgeDir: contactedEdgeDir,
      contactedEdge: contactedEdge, 
    }; 
  },

  _calculateVecToMoveBy(elapsedTime) {
    const self = this;
    // Note that `sDir` used in this method MUST BE a copy in RAM.
    let sDir = {
      dx: self.activeDirection.dx,
      dy: self.activeDirection.dy,
    };

    if (0 == sDir.dx && 0 == sDir.dy) {
      return cc.v2();
    }

    self.firstContactedEdge = null; // Reset everytime (temporary algorithm design, might change later).
    if (0 < self.contactedBarriers.length) {
      /*
       * Hardcoded to take care of only the 1st `contactedEdge` of the 1st `contactedBarrier` for now. Each `contactedBarrier` must be "counterclockwisely convex polygonal", otherwise sliding doesn't work! 
       *
       */
      const contactedBarrier = self.contactedBarriers[0]; 
      const currentSelfColliderCircle = self.node.getComponent(cc.CircleCollider);
      const res = self._calculateTangentialMovementAttrs(currentSelfColliderCircle, contactedBarrier);
      if (res.contactedEdge) {
        self.firstContactedEdge = res.contactedEdge; 
        sDir = res.contactedEdgeDir;
      }
    } 
    return self._calculateVecToMoveByInDir(elapsedTime, sDir);
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
    if (0 < self.contactedBarriers.length) {
      /* To avoid unexpected buckling. */
      const mutatedVecToMoveBy = vecToMoveBy.mul(5); // To help it escape the engaged `contactedBarriers`.
      nextSelfColliderCircle = {
        position: self.node.position.add(mutatedVecToMoveBy).add(currentSelfColliderCircle.offset),
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
      if (cc.Intersection.pointInPolygon(nextSelfColliderCircle.position, contactedBarrierPolygonLocalToParentWithinCurrentFrame)) {
        // Make sure that the player is "leaving" the PolygonCollider.
        return false;  
      }
      if (cc.Intersection.polygonCircle(contactedBarrierPolygonLocalToParentWithinCurrentFrame, nextSelfColliderCircle)) {
        if (null == self.firstContactedEdge) {
          return false; 
        }
        if (null != self.firstContactedEdge && self.firstContactedEdge.associatedBarrier != contactedBarrier) {
          const res = self._calculateTangentialMovementAttrs(nextSelfColliderCircle, contactedBarrier);
          if (null == res.contactedEdge) {
            // Otherwise, the current movement is going to transit smoothly onto the next PolygonCollider.
            return false; 
          }
        }
      }
    }

    return true;
  },
  // Overriding "BasePlayer" methods for tracing along barriers. [ends] 

  onShotByBullet(bulletScriptIns) {
    this.feedToShowHpBar();
    StatefulBuildableAttackingNpc.prototype.onShotByBullet.call(this, bulletScriptIns);
  },

  onClicked(evt) {
    if (null == this.mapIns) {
      return;
    }
    this.mapIns.onAttackingNpcClicked(evt, this); 
  },
});

