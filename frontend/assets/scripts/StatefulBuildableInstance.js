const StatelessBuildableInstance = require("./StatelessBuildableInstance");
window.INITIAL_STATEFUL_BUILDABLE_LEVEL = 0;
const STATEFUL_BUILDABLE_INSTANCE_STATE = {
  /*
   * - At states "BUILDING", "EDITING_WHILE_BUILDING" and "EDITING_PANEL_WHILE_BUILDING", the field "currentLevel" should be 0.
   * - Only states "IDLE", "BUILDING", and "UPGRADING" should be written into persistent storage, and restored from persistent storage, via `StatefulBuildableInstance.playerBuildableBinding.state`.
   */
  IDLE: 1,
  EDITING_WHILE_NEW: 2,
  BUILDING: 3,
  UPGRADING: 4,
  EDITING: 5,
  EDITING_WHILE_BUILDING: 6,
  EDITING_WHILE_UPGRADING: 7,
  EDITING_PANEL_WHILE_NEW: 8,
  EDITING_PANEL: 9,
  EDITING_PANEL_WHILE_BUILDING: 10,
  EDITING_PANEL_WHILE_UPGRADING: 11,
};
window.STATEFUL_BUILDABLE_INSTANCE_STATE = STATEFUL_BUILDABLE_INSTANCE_STATE; 
window.STATEFUL_BUILDABLE_INSTANCE_ACCEPT_INGREDIENT_TAG = 1;

const StatefulBuildableInstance = cc.Class({
  extends: StatelessBuildableInstance,

  properties: {
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
    upgradableIndicator: {
      type: cc.Node,
      default: null,
    },
    currentLevelConf: {
      visible: false,
      get() {
        const self = this;
        if (CC_EDITOR) {
          return null;
        }
        if (null == self.levelConfs) {
          return null;
        }
        return self.levelConfs.find(function(levelConf) {
          return levelConf.level == self.currentLevel;
        });
      },
      set() {},
    },
    // Reference for getter/setter overriding https://docs.cocos.com/creator/manual/en/scripting/class.html#getset-declaration.
    fixedSpriteCentreContinuousPos: {
      get: function() {
        return (null == this._fixedSpriteCentreContinuousPos ? null : this._fixedSpriteCentreContinuousPos);
      },
      set: function(val) {
        /*
         * WARNING
         *
         * You SHOULDN'T DIRECTLY trigger this setter from outside of `StatefulBuildableInstance` class.
         *
         * -- YFLu
         */
        if (null == val) return;
        const self = this;
        if (!self.mapIns || !self.mapIns.tiledMapIns) return;
        if (!self.playerBuildableBinding) return;
        let originFixedSpriteCenterContinuousPos = self._fixedSpriteCentreContinuousPos;
        self._fixedSpriteCentreContinuousPos = val;
        const anchorTileDiscretePos = tileCollisionManager._continuousToDiscrete(self.mapIns.node, self.mapIns.tiledMapIns, val.add(self.estimatedSpriteCentreToAnchorTileCentreContinuousOffset), cc.v2(0, 0));
        self.playerBuildableBinding.topmostTileDiscretePositionX = anchorTileDiscretePos.x;
        self.playerBuildableBinding.topmostTileDiscretePositionY = anchorTileDiscretePos.y;
      }
    },
    state: {
      get: function() {
        return (null == this._state ? STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_NEW : this._state);
      },
      set: function(val) {
        /*
         * WARNING
         *
         * You SHOULDN'T DIRECTLY trigger this setter from outside of `StatefulBuildableInstance` class.
         *
         * -- YFLu
         */
        const self = this,
          modified = self._state !== val;
        self._state = val;
        if (!self.playerBuildableBinding) {
          cc.warn(`why there has not a playerBuildableBinding here?`);
          return;
        }
        ;
        self.playerBuildableBinding.state = self.mapCurrentStateToPlayerBuildableBindingState(val);

        switch (self.playerBuildableBinding.state) {
          case STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE:
            if (null == this.playerBuildableBinding.lastCollectedAt) {
              self.playerBuildableBinding.lastCollectedAt = Date.now();
            }
            self.mapIns.refreshStatelessBuildableInstanceCardListDisplay();
            break;
          case STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING:
            self.showProgressBar();
            self.playerBuildableBinding.lastCollectedAt = null;
            self.mapIns.refreshStatelessBuildableInstanceCardListDisplay();
            break;
          case STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING:
            self.showProgressBar();
            self.playerBuildableBinding.lastCollectedAt = null;
            self.mapIns.refreshStatelessBuildableInstanceCardListDisplay();
            break;
          default:
            break;
        }
        if (modified && self.node.active) {
          self._refreshAppearanceResource();
        }
        if (self.isEditing()) {
          self.disableBoostButton();
        } else {
          self.enableBoostButton();
        }
      }
    },
  },

  mapCurrentStateToPlayerBuildableBindingState(state) {
    const self = this;
    if (!self.playerBuildableBinding) {
      console.warn("Calling `mapCurrentStateToPlayerBuildableBindingState` when there\'s no playerBuildableBinding?");
      return -1;
    }
    switch (state) {
      case STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE:
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING:
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL:
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_NEW:
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_NEW:
        return STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE;
      case STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING:
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_BUILDING:
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_BUILDING:
        return STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING;
      case STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING:
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_UPGRADING:
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_UPGRADING:
        return STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING;
      default:
        if (!Object.values(STATEFUL_BUILDABLE_INSTANCE_STATE).includes(state)) {
          cc.warn("Unknown state obtained:", state);
        }
        return self.playerBuildableBinding.state;
    }
  },

  _shoot(targetToAttack) {
    const self = this;    
    let bulletNode = null;
    if (self.id == constants.STATELESS_BUILDABLE_ID.CANNON_TOWER) {
      bulletNode = cc.instantiate(self.mapIns.cannonLinearBulletPrefab); 
    } else {
      bulletNode = cc.instantiate(self.mapIns.bulletPrefab); 
    }
    let bulletStartPosOffsetOnMapNode = cc.v2(0, 0);
    let bulletScriptIns = null;
    if (self.id == constants.STATELESS_BUILDABLE_ID.CANNON_TOWER) {
      bulletScriptIns = bulletNode.getComponent("LinearBullet");
      bulletStartPosOffsetOnMapNode = cc.v2(0, 120); // Hardcoded temporarily. -- YFLu
    } else { 
      bulletScriptIns = bulletNode.getComponent("Bullet");
      bulletStartPosOffsetOnMapNode = cc.v2(0, 240); // Hardcoded temporarily. -- YFLu
    }
    bulletNode.setPosition(self.node.position.add(bulletStartPosOffsetOnMapNode));
    bulletScriptIns.teamId = self.teamId;
    bulletScriptIns.explosionType = constants.BUILDABLE_BULLET_EXPLOSION_TYPE[self.id];
    bulletScriptIns.mapIns = self.mapIns;
    bulletScriptIns.emitterStatefulBuildable = self;
    bulletScriptIns.baseDamage = self.baseDamage;
    bulletScriptIns.targetScriptIns = targetToAttack; 
    safelyAddChild(self.mapIns.node, bulletNode);
    setLocalZOrder(bulletNode, window.CORE_LAYER_Z_INDEX.CACHED_GOLD);
  },

  onLoad() {
    const self = this;
    self.anim = this.node.getComponent(cc.Animation);
    self.baseAttackFps = constants.BUILDABLE_BASE_ATTACK_FPS[self.id];

    self.node.on(cc.Node.EventType.POSITION_CHANGED, (evt) => {
      // Temporarily left blank, but could be useful soon. -- YFLu
    }, self);

    if (self.isDefenderBuildable()) {
      self._restartAttacking();
    }
    let upgradableIndicatorButton = self.upgradableIndicator.getComponent(cc.Button);
    let clickEvent = new cc.Component.EventHandler();
    clickEvent.target = self.node;
    clickEvent.component = self.node.name;
    clickEvent.handler = "onUpgradableIndicatorButtonClicked";
    upgradableIndicatorButton.clickEvents = [clickEvent];

    self.mapIns.onSingleStatefulBuildableOnLoadCalled(self);

    self.hpBarOffsetWrtSelf = self.hpBar.node.position;
    self.hpResidualLabelOffsetWrtSelf = self.hpResidualLabel.node.position;
  },

  onUpgradableIndicatorButtonClicked(evt) {
    const self = this;
    if (null != self.mapIns) {
      if (self.mapIns.isPurelyVisual() && self.state == window.STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE) {
        self.mapIns.startPositioningExistingStatefulBuildableInstance(self);
        self.mapIns.tryToUpgradeStatefulBuildableInstance(evt, self);
      }
    }
  },

  onDestroy() {
    this._stopAttacking();
  },

  ctor() {
    this.mapIns = null;
    this.buildingOrUpgradingStartedAt = null; // GMT+0 milliseconds.
    this.buildingOrUpgradingDuration = null;
    this.lastCollectedAt = null; // 建筑建造所需时间
    this._progressInstanceNode = null; // 进度条节点
    this.activeAppearance = null;
    this.chairOffsetDict = {};
    this.isPhantom = false;
    this.teamId = constants.BATTLE_TEAM.DEFAULT_ALLY_TEAM_ID;

    // The "hp" fields will be initialized within `this.initFromStatelessBuildableBinding`(but NOT `this.initOrUpdateFromPlayerBuildableBinding`) and or `updateCriticalProperties when (newLevel > this.currentLevel)`. -- YFLu, 2019-10-15
    this.remainingHp = 0;
    this.baseHp = 0; 
  },

  isDefenderBuildable() {
    return (constants.BUILDABLE.TYPE.DEFENDER == this.type); 
  },

  initOrUpdateFromPlayerBuildableBinding(playerBuildableBinding, statelessBuildableInstance, mapIns) {
    const self = this;
    if (null == self.node) {
      console.warn("StatefulBuildableInstance.initAfterInstantiated: Please instantiate the node first!");
      return;
    }
    self.mapIns = mapIns;
    self.currentLevel = playerBuildableBinding.currentLevel;
    self.buildingOrUpgradingStartedAt = playerBuildableBinding.buildingOrUpgradingStartedAt;
    self.playerBuildableBinding = playerBuildableBinding;
    self.initFromStatelessBuildableBinding(statelessBuildableInstance, mapIns);
    switch (playerBuildableBinding.state) {
      case window.STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE:
      case window.STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING:
      case window.STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING:
        self.state = playerBuildableBinding.state; // This assignment might trigger `self.showProgressBar()`, thus should be put AFTER `self.initFromStatelessBuildableBinding(...)` within which `self.buildingOrUpgradingDuration` is initialized. -- YFLu 
        break;
      default:
        console.warn("Invalid persistent storage `playerBuildableBinding.state` found for: ", playerBuildableBinding);
        break;
    }

    const anchorTileContinuousPos = tileCollisionManager._continuousFromCentreOfDiscreteTile(self.mapIns.node, self.mapIns.tiledMapIns, null, playerBuildableBinding.topmostTileDiscretePositionX, playerBuildableBinding.topmostTileDiscretePositionY);

    self.fixedSpriteCentreContinuousPos = anchorTileContinuousPos.sub(self.estimatedSpriteCentreToAnchorTileCentreContinuousOffset);
    
    // Update chairOffsetDict. [begin]
    self.chairOffsetDict = {};
    for (let i in constants.CHAIR_OFFSET_DATA) {
      const chairObject = constants.CHAIR_OFFSET_DATA[i];
      if (chairObject.buildableId == self.id && chairObject.buildableLevel == self.currentLevel) {
        self.chairOffsetDict[chairObject.chairId] = chairObject;
      }
    }
    // Update chairOffsetDict. [end]

    self._refreshAppearanceResource();
  },

  initFromStatelessBuildableBinding(singleStatelessBuildableInstance, mapIns, specifiedState) {
    const self = this;
    if (null == self.node) {
      console.warn("StatefulBuildableInstance.initAfterInstantiated: Please instantiate the node first!");
      return;
    }
    self.mapIns = mapIns;
    self.id = singleStatelessBuildableInstance.id;
    self.autoCollect = singleStatelessBuildableInstance.autoCollect;
    self.currentLevel = (self.currentLevel ? self.currentLevel : INITIAL_STATEFUL_BUILDABLE_LEVEL);
    if (self.currentLevel > INITIAL_STATEFUL_BUILDABLE_LEVEL) {
      const targetLevelConf = singleStatelessBuildableInstance.levelConfs.find(x => x.level == self.currentLevel);
      self.currentBaseGoldProductionRate = targetLevelConf.baseGoldProductionRate;
      self.baseHp = targetLevelConf.baseHp;
      self.remainingHp = self.baseHp;
      self.baseDamage = targetLevelConf.baseDamage; 
    } else {
      const targetLevelConf = singleStatelessBuildableInstance.levelConfs.find(x => x.level == INITIAL_STATEFUL_BUILDABLE_LEVEL + 1);
      self.currentBaseGoldProductionRate = 0;
      self.baseHp = (targetLevelConf.baseHp >> 1);
      self.remainingHp = self.baseHp;
      self.baseDamage = 0; 
    }
    self.type = singleStatelessBuildableInstance.type;
    self.displayName = singleStatelessBuildableInstance.displayName;
    self.discreteWidth = singleStatelessBuildableInstance.discreteWidth; // Not used yet.
    self.discreteHeight = singleStatelessBuildableInstance.discreteHeight; // Not used yet.
    self.boundingBoxContinuousWidth = singleStatelessBuildableInstance.boundingBoxContinuousWidth;
    self.boundingBoxContinuousHeight = singleStatelessBuildableInstance.boundingBoxContinuousHeight;
    self.topmostAnchorTileCentreWrtBoundingBoxCentre = singleStatelessBuildableInstance.topmostAnchorTileCentreWrtBoundingBoxCentre;
    self.spriteCentreTileToAnchorTileDiscreteOffset = singleStatelessBuildableInstance.spriteCentreTileToAnchorTileDiscreteOffset;
    self.estimatedSpriteCentreToAnchorTileCentreContinuousOffset = singleStatelessBuildableInstance.estimatedSpriteCentreToAnchorTileCentreContinuousOffset;
    self.boundaryPoints = singleStatelessBuildableInstance.boundaryPoints;
    // 记录等级配置
    self.levelConfs = singleStatelessBuildableInstance.levelConfs;
    // 记录建筑升级所需时间
    self.buildingOrUpgradingDuration = singleStatelessBuildableInstance.buildingOrUpgradingDuration;
    // 记录appearance
    self.appearance = singleStatelessBuildableInstance.appearance;

    /*
     * You shouldn't assign anything to `self._fixedSpriteCentreContinuousPos` at the moment, because upon creation from `statelessBuildableInstance` the corresponding `statefulBuildableInstance` has NO FIXED SpriteCentre!
     */
    let curTimeMills = Date.now();
    if (null != self.playerBuildableBinding) {
      // Already initialized or updated within `self.initOrUpdateFromPlayerBuildableBinding(...)`, should NOT invoke `self._refreshAppearanceResource()`.
      self.playerBuildableBinding.id = self.mapIns.playerBuildableBindingIdCounter;
      self.playerBuildableBinding.buildable.autoCollect = singleStatelessBuildableInstance.autoCollect;
      return;
    }
    self.playerBuildableBinding = {
      id: self.mapIns.playerBuildableBindingIdCounter,
      topmostTileDiscretePositionX: null,
      topmostTileDiscretePositionY: null,
      playerId: -1, // Hardcoded temporarily. -- YFLu
      buildable: {
        id: singleStatelessBuildableInstance.id,
        type: singleStatelessBuildableInstance.type,
        discreteWidth: singleStatelessBuildableInstance.discreteWidth,
        discreteHeight: singleStatelessBuildableInstance.discreteHeight,
        displayName: singleStatelessBuildableInstance.displayName,
        autoCollect: singleStatelessBuildableInstance.autoCollect,
      },
      currentLevel: (self.currentLevel ? self.currentLevel : window.INITIAL_STATEFUL_BUILDABLE_LEVEL),
      state: (null == self._state ? STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING : self._state),
      createdAt: curTimeMills,
      updatedAt: curTimeMills,
      buildingOrUpgradingStartedAt: null,
    };
    self._refreshAppearanceResource();
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

  updateCriticalProperties(newState, newFixedSpriteCentreContinuousPos, newLevel, newBuildingOrUpgradingStartedAt, shouldNotCallUpsync=false) {
    const self = this;
    /*
    * The use of `BuildableMap.upsyncLocked` prevents the upsync API from 
    * writing "remote persistent storage" with "non-recoverable state of a player". 
    * 
    * For example, without such "BuildableMap.upsyncLocked", an invocation of 
    * `BuildableMap.saveAllPlayerSyncData(...)` could be triggered by a tick in 
    * `BuildableMap.update(dt)` when "`statefulBuildableInstance.playerBuildableBinding.state` is updated, yet `mapIns.wallet` is not", and it'd be difficult to recover.  
    */
    self.mapIns.upsyncLocked = true;

    let anythingChanged = (
    (self.mapCurrentStateToPlayerBuildableBindingState(newState) != self.playerBuildableBinding.state)
      ||
      (newLevel != self.currentLevel)
    );
    self.fixedSpriteCentreContinuousPos = newFixedSpriteCentreContinuousPos;
    self.transferHpGuiToMapNodeAndUpdatePosition();

    if (self.currentLevel < newLevel) {
      anythingChanged = true;
      const targetLevelConf = self.levelConfs.find((x) => {
        return (x.level == newLevel);
      });
      const incrementedHp = targetLevelConf.baseHp - self.baseHp; 
      self.baseDamage = targetLevelConf.baseDamage;
      self.baseHp = targetLevelConf.baseHp;
      self.remainingHp += incrementedHp;

      if (targetLevelConf.baseGoldProductionRate != self.currentBaseGoldProductionRate) {
        self.currentBaseGoldProductionRate = targetLevelConf.baseGoldProductionRate;
      }
      self.currentLevel = newLevel;
      self.playerBuildableBinding.currentLevel = newLevel;
      // Update chairOffsetDict. [begin]
      self.chairOffsetDict = {};
      for (let i in constants.CHAIR_OFFSET_DATA) {
        const chairObject = constants.CHAIR_OFFSET_DATA[i];
        if (chairObject.buildableId == self.id && chairObject.buildableLevel == self.currentLevel) {
          self.chairOffsetDict[chairObject.chairId] = chairObject;
        }
      }
      // Update chairOffsetDict. [end]
    }
    self.buildingOrUpgradingStartedAt = newBuildingOrUpgradingStartedAt;
    self.playerBuildableBinding.buildingOrUpgradingStartedAt = newBuildingOrUpgradingStartedAt;
    self.state = newState; // Will trigger the "setter" of "StatefulBuildableInstance.state" to update "StatefulBuildableInstance.playerBuildableBinding.state" appropriately.

    self.mapIns.upsyncLocked = false;

    if (
      anythingChanged
      &&
      (
      self.playerBuildableBinding.state == STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE
      || self.playerBuildableBinding.state == STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING
      || self.playerBuildableBinding.state == STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING)
      && 
      (
        self.state != STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_NEW &&
        self.state != STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_NEW
      )
      && !shouldNotCallUpsync
    ) {
      self.mapIns.saveAllPlayerSyncData();
    }
  },

  showProgressBar() {
    const self = this;
    if (self._progressInstanceNode && self._progressInstanceNode.active) {
      // 若进度条已显示,则不进行任何操作.
      return;
    }
    let totalSeconds = null;
    if (null != self.buildingOrUpgradingDuration && (self.isUpgrading() || self.isBuilding())) {
      totalSeconds = self.buildingOrUpgradingDuration[self.currentLevel + 1];
    }

    //TODO: 应该判断当前状态才显示progressBar
    if (null != totalSeconds && null != self.buildingOrUpgradingStartedAt) {
      let pi = self._progressInstanceNode || self._createProgressInstance(),
        cpn = pi.getComponent("BuildOrUpgradeProgressBar");
      self._progressInstanceNode = pi;
      self._progressInstanceNode.active = true;
      self.progressInstance = cpn;
      cpn.setData(self.buildingOrUpgradingStartedAt, totalSeconds * 1000 /* milliseconds */ );
    } else {
      console.warn("Invalid values of `totalSeconds`, `self.buildingOrUpgradingStartedAt` found when calling `showProgressBar`",
        self.buildingOrUpgradingDuration,
        totalSeconds,
        self.buildingOrUpgradingStartedAt
      );
    }

  },

   _createProgressInstance() {
    const self = this;
    let node = cc.instantiate(self.mapIns.buildOrUpgradeProgressBarPrefab);
    let cpn = node.getComponent("BuildOrUpgradeProgressBar");
    cpn.mapIns = self.mapIns;

    cpn.onCompleted = function() {
      // 建造或升级完成时会把ProgressBar隐藏.
      self._progressInstanceNode.active = false;
      let targetState = null;
      const newLevel = self.currentLevel + 1;

      // 若建筑在移动中完成建造,则将其状态变更为EDITING
      switch (self.state) {
        case STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING:
        case STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING:
          targetState = STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE;
          break;
        case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_BUILDING:
        case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_UPGRADING:
          // This case is entered when for example, building or upgrading is completed while we're moving the StatefulBuildableInstance on map.
          targetState = STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING;
          break;
        case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_BUILDING:
        case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_UPGRADING:
          // This case is entered when for example, building or upgrading is completed while we're viewing info panel of the StatefulBuildableInstance.
          targetState = STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL;
          break;
        default:
          console.warn("unknown state founded when buildingOrUpgrade operation done: ", self.state);
          break;
      }
      self.updateCriticalProperties(targetState, self.fixedSpriteCentreContinuousPos, newLevel, null);
      // 更新InfoPanel的data。
      let statefulInstanceInfoPanelNode = self.node.statefulInstanceInfoPanelNode;
      let statefulInstanceInfoPanelScriptIns = statefulInstanceInfoPanelNode.getComponent(statefulInstanceInfoPanelNode.name);
      statefulInstanceInfoPanelScriptIns.refreshData();
      // 更新Controller的按钮显示。

      self.mapIns.updateBuildableMapGUIForBuildOrUpgradeDone(self);  
      self.mapIns.updateOverallGoldLimit(self.mapIns.baseOverallGoldLimit);
    };
    cpn.onBoost = function(evt) {
      if (null != evt) {
        self.mapIns.playEffectCommonButtonClick();
      }
      self.mapIns.tryToBoostBuildingOrUpgradingStatefulBuildableInstance(self);
    }
    // 由于progressbar作为node的子元素,则其位置会随着node的改变而自动改变,无需在onProgressUpdate中不停设置.
    node.setPosition(cc.v2(0, self.node.height / 2));
    // 修改: 将progressbar作为node的子元素而不是mapIns的子元素
    safelyAddChild(self.node, node);
    return node;
  },

  isUpgradable() {
    const self = this;
    const nextLevel = self.currentLevel + 1;
    if (nextLevel > self.levelConfs.length) {
      return false;
    }
    return self.isLevelDependencyMatchedInMapIns(nextLevel);
  },

  isUpgradableByGoldOnly(accumulatedDeduction) {
    if (null == accumulatedDeduction) {
      accumulatedDeduction = 0;
    }
    const self = this;
    const isUpgradableWrtState = self.isIdle();
    if (false == isUpgradableWrtState) {
      return {
        res: false,
        additionalGoldRequired: null,
        additionalAccumulatedDeduction: null,
      };
    }
    const isUpgradableWrtDependencyTree = self.isUpgradable();
    if (false == isUpgradableWrtDependencyTree) {
      return {
        res: false,
        additionalGoldRequired: null,
        additionalAccumulatedDeduction: null,
      };
    }
    const newLevel = self.currentLevel + 1; 
    const targetLevelConf = self.levelConfs.find((x) => {
      return (x.level == newLevel);
    });
    const isUpgradableByResidualGold = (self.mapIns.wallet.gold - accumulatedDeduction) >= targetLevelConf.buildingOrUpgradingRequiredGold;
    if (false == isUpgradableByResidualGold) {
      return {
        res: false,
        additionalGoldRequired: targetLevelConf.buildingOrUpgradingRequiredGold - (self.mapIns.wallet.gold - accumulatedDeduction),
        additionalAccumulatedDeduction: null,
      };
    } 
    return {
        res: true,
        additionalGoldRequired: null,
        additionalAccumulatedDeduction: targetLevelConf.buildingOrUpgradingRequiredGold,
    };
  },

  isLevelReachCurrentlyMaxLevel() {
    const self = this;
    const toRet = self.mapIns.determineCurrentlyLimitedCountAndLevel(self.id);
    return toRet.currentlyLimitedLevelToUpgradeTo === self.currentLevel;
  },

  isLevelReachMaxLevel() {
    const self = this;
    const nextLevel = self.currentLevel + 1;
    return !self.levelConfs.find(x => x.level == nextLevel);
  },

  isNewing() {
    const self = this;
    return [STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_NEW, STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_NEW].includes(self.state);
  },

  isBuilding() {
    const self = this;
    return [STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING, STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_BUILDING, STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_BUILDING].includes(self.state);
  },

  isUpgrading() {
    const self = this;
    return [STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING, STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_UPGRADING, STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_UPGRADING].includes(self.state);
  },
  
  couldShowProducingAnimation() {
    const self = this;
    return self.isIdle();
  },

  isIdle() {
    const self = this;
    return [STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE, STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING, STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL].includes(self.state);
  },

  isEditing() {
    const self = this;
    return [
      STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING,
      STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL,
      STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_NEW,
      STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_NEW,
      STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_BUILDING,
      STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_BUILDING,
      STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_UPGRADING,
      STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_UPGRADING
    ].includes(self.state);
  },

  upgradeUnconditionally() {
    const self = this;
    let targetState;
    switch (self.state) {
      case STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE:
        targetState = STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING;
        break;
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING:
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_BUILDING:
        targetState = STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_UPGRADING;
        break;
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL:
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_UPGRADING:
        targetState = STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_UPGRADING;
        break;
      default:
        console.warn("Incorrect state when upgrade:", self.state);
        return;
    }
    self.updateCriticalProperties(targetState, self.fixedSpriteCentreContinuousPos, self.currentLevel, Date.now());
    self.showProgressBar();
  },

  stopCurrentBuildableAnimation() {
    const self = this;
    if (null != self.animationState) {
      self.animationState.stop();
      self.animationState = null;
    }
    if (null == self.skeletalAnimationIns) {
      return;
    }
    if (0 >= Object.keys(self.skeletalAnimationIns).length) {
      return;
    }
    Object.values(self.skeletalAnimationIns).forEach(function(skeletalAnimationIns) {
      skeletalAnimationIns.node.active = false;
    })
  },

  _refreshAppearanceResource() {
    const self = this;
    if (!self.animationClipsLoaded) {
      self.loadAnimationClips();
    }
    const sprite = self.node.getComponent(cc.Sprite);
    switch (self.state) {
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_NEW:
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_NEW:
        self.stopCurrentBuildableAnimation();
        if (!self.showSkeletalAnimation(1)) {
          self.showStatelessBuildableAppearance(1);
        }
        break;
      case STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING:
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_BUILDING:
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_BUILDING:
        if (!self.showSkeletalAnimation(0)) {
          self.showBuildingAnimation();
        }
        break;
      case STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE:
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING:
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL:
        if (!self.showSkeletalAnimation(self.currentLevel)) {
          self.showBuildableAnimation(self.currentLevel);
        }
        break;
      case STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING:
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_UPGRADING:
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_UPGRADING:
        if (!self.showSkeletalAnimation(0)) {
          self.showUpgradingAnimation(self.currentLevel);
        }
        break;
      default:
        console.warn("Incorrect state found when invoking `_refreshAppearanceResource`:", STATEFUL_BUILDABLE_INSTANCE_STATE, self.state);
        break;
    }
    self._correctSize();
  },

  _getExpectedNodeSize() {
    const self = this;
    return {
      width: null != constants.BUILDABLE.SPECIFIED_WIDTH[self.displayName] ? constants.BUILDABLE.SPECIFIED_WIDTH[self.displayName] : constants.BUILDABLE.WIDTH,
      height: null != constants.BUILDABLE.SPECIFIED_HEIGHT[self.displayName] ? constants.BUILDABLE.SPECIFIED_HEIGHT[self.displayName] : constants.BUILDABLE.HEIGHT,
    };
  },

  _correctSize() {
    const self = this;
    let skeletalAnimationTargetIns = self.getPlayingSkeletalAnimationIns();
    let {width, height} = self._getExpectedNodeSize();
    if (null == skeletalAnimationTargetIns) {
      let targetSize = {
        width: 0,
        height: 0
      };
      if (self.animationState) {
        targetSize = self.animationState.clip.curveData.comps['cc.Sprite'].spriteFrame[0].value.getRect();
      } else {
        targetSize = self.appearance[1].getRect();
      }
      // height = targetSize.height * (width / targetSize.width);
      width = targetSize.width * (height / targetSize.height);
      self.node.width = width;
      self.node.height = height;
      console.log(self.displayName, 'resized to:', self.node.width, 'height:', self.node.height);
      return true;
    } else if (null != skeletalAnimationTargetIns._curFrame) {
      skeletalAnimationTargetIns.node.scale = self.calculateScaleForSkeletalAnimation();
      self.node.width = width;
      self.node.height = height;
      // console.log(self.displayName, 'skeletalAnimation scaled to: ', skeletalAnimationTargetIns.node.scale);
      return true;
    } else {
      // TODO: Correct the scale value by the viewing frame Height.
      skeletalAnimationTargetIns.node.scale = self.calculateScaleForSkeletalAnimation();
      return true;
    }
  },

  calculateScaleForSkeletalAnimation() {
    const self = this;
    // TODO: Correct the scale value by the viewing frame Height.
    // The following code is not correct always, but it may be helpful for you.
    /*
        let skeletalAnimationTargetIns = self.getPlayingSkeletalAnimationIns();
        let minVertice = skeletalAnimationTargetIns._curFrame.vertices.reduce(function(minValue, val) {return isNaN(val) ? minValue : Math.min(minValue, val); }, 0),
        maxVertice = skeletalAnimationTargetIns._curFrame.vertices.reduce(function(maxValue, val) {return isNaN(val) ? maxValue : Math.max(maxValue, val); }, 0),
        frameHeight = maxVertice - minVertice;
    */
    let specifiedSkeletalScale = constants.BUILDABLE.SPECIFIED_SKELETAL_SCALE[self.displayName];
    let level = self.isUpgrading() || self.isBuilding() ? 0 : self.currentLevel;
    if (typeof specifiedSkeletalScale == 'number') {
      return specifiedSkeletalScale;
    } else if (null != specifiedSkeletalScale) {
      return specifiedSkeletalScale[level] || constants.BUILDABLE.SKELETAL_SCALE;
    } else {
      return constants.BUILDABLE.SKELETAL_SCALE;
    }
  },

  showStatelessBuildableAppearance(lv) {
    const self = this;
    if (self.appearance) {
      self.activeAppearance = self.appearance[lv];
      if (!self.activeAppearance) {
        console.warn("The expected `activeAppearance` is not found:", self.appearance, lv);
      } else {
        self.node.getComponent(cc.Sprite).spriteFrame = self.activeAppearance;
      }
    }
  },

  showUpgradingAnimation(lv) {
    const self = this;
    const animation = self.node.getComponent(cc.Animation);
    let upgradingAnimClipName = cc.js.formatStr("%s_Level_0", self.displayName);
    let defaultAnimClipName = constants.BUILDING_ANIM.DEFAULT_UPGRADING;
    if (null != self.animationState && self.animationState.name == upgradingAnimClipName) {
      // the current playing animation is same as the target playing animation, thus do nothing.
      return;
    }
    self.stopCurrentBuildableAnimation(); 
    // Warning: StatefulBuildableInstanceInfoPanel中会使用到activeAppearance
    self.showStatelessBuildableAppearance(lv);
    if ( (self.animationState = animation.playAdditive(upgradingAnimClipName)) ) {
      return;
    }
    console.warn("The expected upgrading anim clip is not found for:", upgradingAnimClipName);
    if ( (self.animationState = animation.playAdditive(defaultAnimClipName)) ) {
      return;
    }
    console.warn("The expected upgrading anim clip is not found for:", defaultAnimClipName);
  },

  showBuildingAnimation() {
    const self = this;
    const animation = self.node.getComponent(cc.Animation);
    let buildingAnimClipName = cc.js.formatStr("%s_Level_0", self.displayName),
      defaultBuildingAnimClipName = constants.BUILDING_ANIM.DEFAULT_BUILDING;
    if (null != self.animationState && self.animationState.name == buildingAnimClipName) {
      // the current playing animation is same as the target playing animation, thus do nothing.
      return;
    }
    self.stopCurrentBuildableAnimation(); 
    // Warning: StatefulBuildableInstanceInfoPanel中会使用到activeAppearance
    self.showStatelessBuildableAppearance(1);
    if ( (self.animationState = animation.playAdditive(buildingAnimClipName)) ) {
      return;
    }
    console.warn("The expected lv0 building anim clip is not found for:", buildingAnimClipName);
    if ( (self.animationState = animation.playAdditive(defaultBuildingAnimClipName)) ) {
      return;
    }
    console.warn("The expected default building anim clip is not found for:", defaultBuildingAnimClipName);
  },

  showBuildableAnimation(lv) {
    const self = this;
    const animation = self.node.getComponent(cc.Animation);
    const levelAnimClipName = cc.js.formatStr("%s_Level_%s", self.displayName, lv);
    if (null != self.animationState && self.animationState.name == levelAnimClipName) {
      // the current playing animation is same as the target playing animation, thus do nothing.
      return;
    }
    self.stopCurrentBuildableAnimation();
    // Warning: StatefulBuildableInstanceInfoPanel中会使用到activeAppearance
    self.showStatelessBuildableAppearance(lv);
    if ( (self.animationState = animation.playAdditive(levelAnimClipName)) ) {
      return;
    }
    console.warn(cc.js.formatStr("The expected level anim clip is not found for %s: %s", self.currentLevel, levelAnimClipName));
  },

  showSkeletalAnimation(lv) {
    const self = this;
    if (null == self.skeletalAnimationIns) {
      return false;
    }
    const skeletalAnimationTargetIns = self.skeletalAnimationIns[cc.js.formatStr('Level_%s', lv)];
    self.showStatelessBuildableAppearance(lv == 0 ? 1 : lv);
    if (null == skeletalAnimationTargetIns) {
      console.warn(cc.js.formatStr("The expected skeletalAnimation is not found for %s, level is %s", self.displayName, lv));
      return false;
    }
    self.node.getComponent(cc.Sprite).spriteFrame = null;
    if (true == skeletalAnimationTargetIns.node.active) {
      return true;
    }
    self.stopCurrentBuildableAnimation();
    self._playBuildableSkeletalAnimation(skeletalAnimationTargetIns);
    self._correctSize();
    return true;
  },

  getPlayingSkeletalAnimationIns() {
    const self = this;
    if (!self.skeletalAnimationIns) {
      return null;
    }
    return Object.values(self.skeletalAnimationIns).find(function(skeletalAnimationIns) {
      return skeletalAnimationIns.node.active;
    });
  },

  loadAnimationClips() {
    const self = this;
    const targetNode = self.node.getChildByName(cc.js.formatStr("%sAnimationNode", self.displayName));
    if (self.animationClipsLoaded) {
      return;
    }
    self.animationClipsLoaded = true;
    const animation = self.node.getComponent(cc.Animation);
    if (!targetNode) {
      console.warn("Lacking animationNode for:", self.displayName);
      return;
    }

    let index = 0;
    targetNode.getComponent(cc.Animation).getClips().forEach((clip) => {
      if (index > self.levelConfs.length) {
        return;
      }
      if (null == clip) {
        console.warn("Clip is nonexistent for: ", self.displayName, ", level: ", index);
      } else {
        animation.addClip(clip, cc.js.formatStr("%s_%s", self.displayName, clip.name));
      }
      ++index;
    });
    // load skeletalAnimationIns [begin].
    self.skeletalAnimationIns = {};
    let skeletalAnimationNode = targetNode.getChildByName('Skeletal');
    if (null != skeletalAnimationNode) {
      skeletalAnimationNode.children.slice().forEach(function(childNode) {
        childNode.parent = self.node;
        childNode.active = false;
        // priority: dragonBones > spine
        // try load dragonBones
        let skeletalAnimationTargetIns = self.skeletalAnimationIns[childNode.name] = childNode.getComponent(dragonBones.ArmatureDisplay);
        let called = false;
        function onStartPlay() {
          if (called) {
            return;
          }
          called = true;
          skeletalAnimationTargetIns.scheduleOnce(function() {
            self._correctSize();
            self.onSkeletalAnimationStartPlay && self.onSkeletalAnimationStartPlay(skeletalAnimationTargetIns);
          });
          
          if (self.isNewing()) {
            if (skeletalAnimationTargetIns instanceof dragonBones.ArmatureDisplay) {
              skeletalAnimationTargetIns._playing = false;
            } else if (skeletalAnimationTargetIns instanceof sp.Skeleton) {
              skeletalAnimationTargetIns.paused = true;
            }
          }
        }

        if (skeletalAnimationTargetIns != null) {
          skeletalAnimationTargetIns.on(dragonBones.EventObject.START, onStartPlay);
        } else {
          // try load spine
          // Warning: the node's name should same as the armatureName.
          skeletalAnimationTargetIns = self.skeletalAnimationIns[childNode.name] = childNode.getComponent(sp.Skeleton);
          if (null != skeletalAnimationTargetIns) {
            skeletalAnimationTargetIns.setStartListener(onStartPlay);
          }
        }

        if (null == skeletalAnimationTargetIns) {
          console.warn(cc.js.formatStr('There is no dragonBones or spine in childNode, parentNode is %s/Skeletal', targetNode.name));
        }
      });
    }
    // load skeletalAnimationIns [end].
  },

  boost() {
    const self = this;
    if (self.isBuilding() || self.isUpgrading()) {
      self._progressInstanceNode.getComponent('BuildOrUpgradeProgressBar').onCompleted();
    } else {
      return;
    }
  },

  _createRightIngredientAcceptAction() {
    // Craete fadeOut and fadeIn action. [begin]
    let action = cc.repeatForever(
      cc.sequence(
        cc.fadeTo(1, 255 * 0.3),
        cc.fadeTo(1, 255)
      )
    );
    return action;
    // Craete fadeOut and fadeIn action. [end]
  },

  _createWrongIngredientAcceptAction() {
    // Craete shake action. [begin]
    let action = cc.repeat(
      cc.sequence(
        cc.moveTo(0.05, cc.v2(-20, 0)),
        cc.moveTo(0.05, cc.v2(0, 0)),
        cc.moveTo(0.05, cc.v2(20, 0)),
        cc.moveTo(0.05, cc.v2(0, 0))
      ), 3
    );
    return action;
    // Craete shake action. [end]
  },

  _playIngredientAcceptAnim(node, action) {
    let currentAction = node.getActionByTag(window.STATEFUL_BUILDABLE_INSTANCE_ACCEPT_INGREDIENT_TAG);
    if (null != currentAction) {
      return false;
    }
    action.setTag(window.STATEFUL_BUILDABLE_INSTANCE_ACCEPT_INGREDIENT_TAG);
    node.runAction(action);
    return true;
  },

  playRightIngredientAcceptAnim() {
    const self = this;
    let skeletalAnimationTargetIns = self.getPlayingSkeletalAnimationIns();
    let action = self._createRightIngredientAcceptAction();
    if (null != skeletalAnimationTargetIns) {
      self._playIngredientAcceptAnim(skeletalAnimationTargetIns.node, action);
    }
  },

  playWrongIngredientAcceptAnim() {
    const self = this;
    let skeletalAnimationTargetIns = self.getPlayingSkeletalAnimationIns();
    let action = self._createWrongIngredientAcceptAction();
    if (null != skeletalAnimationTargetIns) {
      self._playIngredientAcceptAnim(skeletalAnimationTargetIns.node, action);
    }
  },

  _stopIngredientAcceptAnim(node) {
    node.stopActionByTag(window.STATEFUL_BUILDABLE_INSTANCE_ACCEPT_INGREDIENT_TAG);
    node.x = 0;
    node.opacity = 255;
  },

  stopIngredientAcceptAnim() {
    const self = this;
    Object.values(self.skeletalAnimationIns).forEach(function(skeletalAnimationIns) {
      self._stopIngredientAcceptAnim(skeletalAnimationIns.node);
    });
  },

  enableBoostButton() {
    const self = this;
    if (!self.isBuilding() && !self.isUpgrading()) {
      return false;
    }
    if (null == self._progressInstanceNode) {
      return false;
    }
    let cpn = self._progressInstanceNode.getComponent('BuildOrUpgradeProgressBar');
    if (cpn.boostButton.node.active) {
      return false;
    }
    cpn.boostButton.node.active = mapIns.boostEnabled;
    return true;

  },

  disableBoostButton() {
    const self = this;
    if (!self.isBuilding() && !self.isUpgrading()) {
      return false;
    }
    if (null == self._progressInstanceNode) {
      return false;
    }
    let cpn = self._progressInstanceNode.getComponent('BuildOrUpgradeProgressBar');
    if (cpn.boostButton.node.active) {
      cpn.boostButton.node.active = false;
      return true;
    }
    return false;
  },

  refreshSkeletalAnimation() {
    const self = this;
    let skeletalAnimationIns = self.getPlayingSkeletalAnimationIns();
    if (null != skeletalAnimationIns) {
      self._playBuildableSkeletalAnimation(skeletalAnimationIns);
    }
  },

  _playBuildableSkeletalAnimation(skeletalAnimationTargetIns) {
    const self = this;
    skeletalAnimationTargetIns.node.active = true;
    if (skeletalAnimationTargetIns instanceof dragonBones.ArmatureDisplay) {
      // TODO: If using dragonBones, correct the animation name.
      // TODO: if using dragonBones, make sure it can work good in tutorial.
      let armature = skeletalAnimationTargetIns.node.name;
      let animationName = 'Idle';
      skeletalAnimationTargetIns._init();
      const existingAnimNames = skeletalAnimationTargetIns.getAnimationNames(armature);  
      // console.log("Of self.id == ", self.id, ", armature == ", armature, ", existingAnimNames == ", existingAnimNames, ", count(existingAnimNames) == ", Object.keys(existingAnimNames).length);
      if (existingAnimNames.indexOf(animationName) == -1) {
        animationName = 'Idle'; // hardcode temporarily
      }
      if (
          skeletalAnimationTargetIns.getAnimationNames(armature).indexOf('Producing') != -1
          &&
          self.couldShowProducingAnimation()
          &&
          self.mapIns.isStatefulBuildableInstanceProducingSomething(self)
      ) {
        animationName = 'Producing';
      }
      /*
      // In "CocosCreator v2.2.0" & "CocosCreator v2.2.1-rc9", this commented assignment to "dragonBones.ArmatureDisplay" will result in a crash on native platform, e.g. Android/iOS/Simulator !
      skeletalAnimationTargetIns.armatureName = armature;
      */
      skeletalAnimationTargetIns.playAnimation(animationName, 0);
    } else if (skeletalAnimationTargetIns instanceof sp.Skeleton) {
      skeletalAnimationTargetIns._updateSkeletonData();
      // TODO: Correct the animation name.
      skeletalAnimationTargetIns.animation = cc.js.formatStr("IDLE");
    }
  },

  cloneAnimation(targetNode) {
    // WARNING: targetNode should be created by cc.instantiate(statefulBuildableInstance.node)
    //          The statefulBuildableInstance should be active and _refreshAppearanceResource at lease once.
    const self = this;
    let sprite = targetNode.getComponent(cc.Sprite);
    let anim = targetNode.getComponent(cc.Animation);
    let skeletalAnimationTargetIns = self.getPlayingSkeletalAnimationIns();
    if (null == skeletalAnimationTargetIns) {
      if (null == self.anim.currentClip) {
        console.warn('why no animation and no skeletalAnimation found?');
        sprite.spriteFrame = self.activeAppearance;
        return;
      }
      anim.playAdditive(self.anim.currentClip.name);
    } else {
      let clonedSkeletalAnimationNode = targetNode.getChildByName(cc.js.formatStr('Level_%s', self.currentLevel)),
          clonedSkeletalAnimationIns = null;
      // TODO: Correct the scale value by the viewing frame Height.
      clonedSkeletalAnimationNode.scale = self.calculateScaleForSkeletalAnimation();
      if (skeletalAnimationTargetIns instanceof dragonBones.ArmatureDisplay) {
        clonedSkeletalAnimationIns = clonedSkeletalAnimationNode.getComponent(dragonBones.ArmatureDisplay);
      } else if (skeletalAnimationTargetIns instanceof sp.Skeleton) {
        clonedSkeletalAnimationIns = clonedSkeletalAnimationNode.getComponent(sp.Skeleton);
      }
      self._playBuildableSkeletalAnimation(skeletalAnimationTargetIns);
      self._playBuildableSkeletalAnimation(clonedSkeletalAnimationIns);
    }
  },

  calculateOffsetYToBuildableCenterTop() {
    const self = this;
    let skeletalAnimationTargetIns = self.getPlayingSkeletalAnimationIns();
    if (null != skeletalAnimationTargetIns) {
      let offsetData = constants.BUILDABLE.SKELETAL_OFFSET[self.displayName];
      return null == offsetData || null == offsetData.y ? self._getExpectedNodeSize().height / 2 : offsetData.y;
    } else {
      return self._getExpectedNodeSize().height / 2;
    }
  },

  calculateOffsetXToBuildableCenter() {
    const self = this;
    let skeletalAnimationTargetIns = self.getPlayingSkeletalAnimationIns();
    if (null != skeletalAnimationTargetIns) {
      let offsetData = constants.BUILDABLE.SKELETAL_OFFSET[self.displayName];
      return null == offsetData || null == offsetData.x ? 0 : offsetData.x;
    } else {
      return 0;
    }
  },

  onShotByBullet(bulletScriptIns) {
    this.remainingHp -= bulletScriptIns.baseDamage;  
    if (0 < this.remainingHp) {
      this.feedToShowHpBar();
      return;
    }
    // TODO: Check hp before removing from the MapNode.
    this.mapIns.onStatefulBuildableDestroyedByBullet(this, bulletScriptIns);
  },

  _startAttacking() {
    const self = this;
    if (0 >= self.baseAttackFps) {
      return;
    }

    const effectiveAttackFps = (self.baseAttackFps + constants.BUILDABLE_ATTACK_FPS_LV_BUFF[self.id][self.currentLevel]);
    const attackLoopDurationMillis = (1000/effectiveAttackFps);
    const attackAction = () => {
      if (null == self.mapIns) {
        self._stopAttacking();
        return;
      }
      if (self.mapIns.isPaused() || self.isNewing() || self.isBuilding() || self.isUpgrading() || null == self.defenderScriptIns) {
        /*
         Note that "self.defenderScriptIns" is to be initialized by "StageMap.refreshOrCreateShelterAndDefenderForStatefulBuildableInstance".
          
          -- YFLu, 2019-10-08.
        */
        self.attackTimeout = setTimeout(attackAction, attackLoopDurationMillis);
        return;
      }

      if (false == self.isNewing() && 0 >= self.baseDamage) {
        /*
        [WARNING]
        
        The "false == self.isNewing()" condition is necessary, because all StatefulBuildables with "0 == self.currentLevel" have "0 == baseDamage".
        */
        self._stopAttacking();
        return;
      }

      const targetToAttackIndex = window.randomKey(self.defenderScriptIns.inRangeToAttackTargets); 
      const targetToAttack = self.defenderScriptIns.inRangeToAttackTargets[targetToAttackIndex]; 
      if (null == targetToAttack) {
        self.attackTimeout = setTimeout(attackAction, attackLoopDurationMillis);
        return;
      }
      if (null == targetToAttack.node || !cc.isValid(targetToAttack.node)) {
        delete self.defenderScriptIns.inRangeToAttackTargets[targetToAttackIndex];
        delete self.boundAttackingNpcDict[targetToAttackIndex];
        self.attackTimeout = setTimeout(attackAction, 0);
        return;
      }
      if (null == self.node || null == self.node.parent) {
        return;
      }
      self._shoot(targetToAttack);
      self.attackTimeout = setTimeout(attackAction, attackLoopDurationMillis);
    };
    self.attackTimeout = setTimeout(attackAction, 0); // For the first attack, no need to wait for first loop duration. -- YFLu, 2019-11-08.
  },

  _stopAttacking() {
    const self = this;
    if (null != self.attackTimeout) {
      clearTimeout(self.attackTimeout);
      self.attackTimeout = null;
    }
  },

  _restartAttacking() {
    this._stopAttacking();
    this._startAttacking();
  },

  shouldColliderWithAttackingNpcDefender() {
    return (
    !this.isPhantom
    &&
    !this.isNewing()
    );
  },
  
  feedToShowHpBar() {
    this.hpBar.node.active = true;
    this.hpBarDisplaylastFedAt = Date.now();
  }, 

  update(dt) {
    if (null == this.hpBar || false == this.hpBar.node.active) {
      return;
    }
    this.hpResidualLabel.string = cc.js.formatStr("%s/%s", this.remainingHp, this.baseHp);
    const remainingHpRatio = (this.remainingHp/this.baseHp);
    this.hpBar.progress = remainingHpRatio;

    if (null == this.hpBarDisplaylastFedAt) {
      return;
    } 
    
    if (Date.now() - this.hpBarDisplaylastFedAt > this.hpBarLastingDurationMillis) {
      if (false == this.isEditing()) {
        this.hpBar.node.active = false;
      }
    }
  },

  runBlinking() {
    // Hopefully only used by "phantomEditingStatefulBuildable".
    if (false == this.isPhantom) {
      return;
    } 
    if (null == this.node || 0 < this.node.getNumberOfRunningActions()) {
      return;
    }

    const blinkingAct = cc.repeatForever(cc.sequence([
      cc.fadeOut(0.7),
      cc.fadeIn(0.7),
    ]));

    this.node.runAction(blinkingAct);
  },
});

module.export = StatefulBuildableInstance;
