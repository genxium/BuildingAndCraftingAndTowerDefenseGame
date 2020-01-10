const NarrativeSceneManagerDelegate = require('./NarrativeScenes/NarrativeSceneManagerDelegate');
const StatelessBuildableInstance = require('./StatelessBuildableInstance');
const i18n = require('LanguageData');
const BackgroundMap = require('./BackgroundMap');
const ScaleAnim = require('ScaleAnim');
i18n.init(window.language); // languageID should be equal to the one we input in New Language ID input field

window.SINGLE_CLICK_RET_CODE = {
  NOT_TOUCHED_SHOULD_PROPOGATE: 0,
  NOT_TOUCHED_STOPPED_PROPOGATION: 1,
  TOUCHED_SHOULD_PROPOGATE: 2,
  TOUCHED_STOPPED_PROPOGATION: 3,
};

window.ANIM_TYPE = {
  UPGRADING: 1,
  FINISHED: 2,
  NORMAL: 3,
};

cc.Class({
  extends: NarrativeSceneManagerDelegate,

  properties: {
    statelessBuildableInstanceSpriteAtlasArray: {
      type: [cc.SpriteAtlas],
      default: [],
    },
    ingredientAtlasArray: {
      type: [cc.SpriteAtlas],
      default: [],
    },
    statelessBuildableInstanceCardPrefab: {
      type: cc.Prefab,
      default: null,
    },
    statefulBuildableInstancePrefab: {
      type: cc.Prefab,
      default: null,
    },
    iapEnabled: true,
    boostEnabled: true,
    cameraAutoMove: true,
    missionEnabled: true,
    vidAdsRewardEnabled: true,
    activeBgmAudioClip: {
      type: cc.AudioClip,
      default: null,
    },
    commonCongratAudioClip: {
      type: cc.AudioClip,
      default: null,
    },
    commonFailureAudioClip: {
      type: cc.AudioClip,
      default: null,
    },
    collectGoldAudioClip: {
      type: cc.AudioClip,
      default: null,
    },
    bulletInvisibleAudioClipForNpc: {
      type: cc.AudioClip,
      tooltip: 'audioClip for npc that shot by invisibleBullet.',
      default: null,
    },
    bulletInvisibleAudioClipForBuildable: {
      type: cc.AudioClip,
      tooltip: 'audioClip for buildable that shot by invisibleBullet.',
      default: null,
    },
    bulletLinearSingleTargetAudioClipForNpc: {
      type: cc.AudioClip,
      tooltip: 'audioClip for npc that shot by linearSingleTargetBullet.',
      default: null,
    },
    bulletLinearSingleTargetAudioClipForBuildable: {
      type: cc.AudioClip,
      tooltip: 'audioClip for buildable that shot by linearSingleTargetBullet.',
      default: null,
    },
    bulletLinearAoeAudioClipForNpc: {
      type: cc.AudioClip,
      tooltip: 'audioClip for npc that shot by linearAoeBullet.',
      default: null,
    },
    bulletLinearAoeAudioClipForBuildable: {
      type: cc.AudioClip,
      tooltip: 'audioClip for buildable that shot by linearAoeBullet.',
      default: null,
    },
    commonBuildableDestroyingAudioClip: {
      type: cc.AudioClip,
      default: null,
    },
    bgmAudioClipList: {
      type: cc.AudioClip,
      default: [],
    }, 
    translationListenerNode: {
      type: cc.Node,
      default: null,
    },
    zoomingListenerNode: {
      type: cc.Node,
      default: null,
    },
    initialGoldCount: 5000,
    backgroundMap: BackgroundMap,
  },
  
  ctor() {
    this._paused = false;
    this.upsyncLocked = false;
    this.toReclaimIngredientProgressIdList = [];
    this.toClaimPlayerMissionBindingIdList = [];
    this.questCompletedMap = {};
    this.accumulatedResource = {};
    this.reversePlayrMissionBindingMap = {};
    this.playerMissionBindingMap = {};
    this.playerQuestBindingMap = {};
    this.ctrl = null;
    this.statelessBuildableInstanceCardListScriptIns = null;
    this.statefulBuildableFollowingNpcScriptInsDict = {}; // Used at least for refreshing the whole collection of `StatefulBuildableFollowingNpc`s.
    this.playerBuildableBindingIdCounter = 0;
    this.editingStatefulBuildableInstance = null;
    this.phantomEditingStatefulBuildableInstance = null;
    this.toIgnoreBuildableIds = [];
    this._timeroutTimer = null;

    this.announcementData = {
      zh: '',
      en: '',
    };

    this.successfullyDroppedSoldierCount = 0;

    /*
    * Both "actionableDict" and "actionableBubbleDict" are keyed as
    * {
    *   resourceType#1: {
    *    resourceTargetId#1: {
    *    },
    *    resourceTargetId#2: {
    *    },
    *    ...
    *   },
    *   resourceType#2: {
    *    resourceTargetId#7: {
    *    },
    *    resourceTargetId#8: {
    *    },
    *    ...
    *   },
    * }
    *
    * such that they can be dynamically positioned, added and removed without severely disrupting UI.
    * 
    * -- YFLu, 2019-10-18.
    */
    this.actionableDict = {}; 
    this.actionableBubbleDict = {}; 
    this.actionableInterval = null;
  
    this.persistentSoliderBattleBuffDict = {};
    this.volatileSoliderBattleBuffDict = {};

    this.currentActiveBgmAudioClip = null;

    this.shouldSetTileMapCullingDirty = false;
  },
  
  pause() {
    this._paused = true;
  },

  resume() {
    this._paused = false;
  },

  isPaused() {
    return this._paused;
  },

  // LIFE-CYCLE CALLBACKS:
  onDestroy() {
    if (null != this.upsyncInterval) {
      clearInterval(this.upsyncInterval);
      this.upsyncInterval = null;
    }
    if (null != this.inputControlTimer) {
      clearInterval(this.inputControlTimer);
      this.inputControlTimer = null;
    }
    if (null != this.actionableInterval) {
      clearInterval(this.actionableInterval);
      this.actionableInterval = null;
    }
    window.reverseStatefulBuildableFollowingNpcDestinationDict = {};
    window.cachedKnownBarrierGridDict = {};
    window.enabledDialogs.forEach((dialog) => {
      if (dialog && dialog.node.parent) {
        dialog.node.removeFromParent();  
      }
    });
    window.enabledDialogs = [];
    for (var uuid in window.globalShelterChainVerticeMap) {
      window.removeFromGlobalShelterChainVerticeMap(window.globalShelterChainVerticeMap[uuid].ccNode);
    }

    cc.audioEngine.stopAll();
    NarrativeSceneManagerDelegate.prototype.onDestroy.call(this);
  },

  refreshCachedGold() {
  
  },

  onSingleStatefulBuildableOnLoadCalled(statefulBuildable) {
    if (0 == this.toCallOnLoadStatefulBuildableDict[statefulBuildable.playerBuildableBinding.id]) {
      this.toCallOnLoadStatefulBuildableDict[statefulBuildable.playerBuildableBinding.id] = 1;
    }

    for (let k in this.toCallOnLoadStatefulBuildableDict) {
      if (0 == this.toCallOnLoadStatefulBuildableDict[k]) {
        return; 
      }
    }

    this.onAllStatefulBuildableOnLoadCalled();
  },

  onAllStatefulBuildableOnLoadCalled() {
    const self = this;
    if (true == cc.director.getCollisionManager().enabled) return;

    cc.director.getCollisionManager().enabled = true;
    cc.director.getCollisionManager().enabledDebugDraw = CC_DEBUG;

    /*
    [WARNING]
    I've deliberately set "self.isUsingTouchEventManager = false", thus imposed a "delayed initialization of the TouchEventsManager" only after most "GUI thread intensive tasks" completed, i.e. here.
    
    -- YFLu, 2019-11-01.
    */

    self.widgetsAboveAllScriptIns.touchEventManagerScriptIns = self.widgetsAboveAllNode.getComponent("TouchEventsManager");
    self.widgetsAboveAllScriptIns.touchEventManagerScriptIns.init(self, self.node, self.node.parent, self.isUsingJoystick);

    self.setupInputControls();

    // Starts upsyncing per {constants.SEND_PLAYER_SYNC_DATA_DURATION} seconds. [begins]
    self.upsyncInterval = setInterval(() => {
      self.saveAllPlayerSyncData(null, null);
    }, constants.SEND_PLAYER_SYNC_DATA_DURATION_MILLIS);
    // Starts upsyncing per {constants.SEND_PLAYER_SYNC_DATA_DURATION} seconds. [ends]
  },

  onLoad() {
    NarrativeSceneManagerDelegate.prototype.onLoad.call(this);
    const self = this;
    window.mapIns = self;
    const mapNode = self.node;
    const canvasNode = mapNode.parent;
    self.canvasNode = canvasNode;

    cc.director.getCollisionManager().enabled = false; // Delay it till all "StatefulBuildable"s are rendered, i.e. their "onLoad"s are all called.
    cc.director.getCollisionManager().enabledDebugDraw = false; // CC_DEBUG;
    // Initialization of the "widgetsAboveAllNode" [begins].
    for (let i in self.widgetsAboveAllNode.children) {
      const child = self.widgetsAboveAllNode.children[i];
      if (child.name != "NarrativeSceneLayer" && child.name != "StatefulBuildableController") {
        child.active = false;
      }
    }
    // Initialization of the "widgetsAboveAllNode" [ends].

    // Initialization of `statelessBuildableInstanceCardListScriptIns` [begins].
    const statelessBuildableInstanceCardListNode = cc.instantiate(self.statelessBuildableInstanceCardListPrefab);
    self.statelessBuildableInstanceCardListScriptIns = statelessBuildableInstanceCardListNode.getComponent('StatelessBuildableInstanceCardList');
    statelessBuildableInstanceCardListNode.setPosition(0, -400); // why -400?
    self.statelessBuildableInstanceCardListScriptIns.onCloseDelegate = () => {
      self.exitPanelView(self.statelessBuildableInstanceCardListScriptIns);
    };
    // Initialization of `statelessBuildableInstanceCardListScriptIns` [ends].

    // Initialization of `iapItemPanelNode` & `iapItemPanelEntranceNode`. [begins].
    const iapItemPanelNode = cc.instantiate(self.iapItemPanelPrefab);
    iapItemPanelNode.setPosition(cc.v2(0, 0));
    self.iapItemPanelNode = iapItemPanelNode;
    const iapItemPanelScriptIns = iapItemPanelNode.getComponent("IapItemPanel");
    // set panel's defaultActionsEnabled to false [begins].
    iapItemPanelScriptIns.defaultActionsEnabled = false;
    // set panel's defaultActionsEnabled to false [ends].
    iapItemPanelScriptIns.canvasNode = canvasNode;
    iapItemPanelScriptIns.mapNode = mapNode;
    iapItemPanelScriptIns.mapScriptIns = self;
    iapItemPanelScriptIns.onCloseDelegate = () => {
      self.removeShowingModalPopup();
    };
    self.iapItemPanelScriptIns = iapItemPanelScriptIns;

    const iapItemPanelButtonEventHandler = new cc.Component.EventHandler();
    iapItemPanelButtonEventHandler.target = self.node;
    iapItemPanelButtonEventHandler.component = self.node.name;
    iapItemPanelButtonEventHandler.handler = "showIapItemPanel";
    self.iapItemPanelEntranceButton = self.widgetsAboveAllScriptIns.iapItemPanelEntranceNode;
    self.iapItemPanelEntranceButton.getComponent(cc.Button).clickEvents = [
      iapItemPanelButtonEventHandler
    ];
    // Initialization of `iapItemPanelNode` & `iapItemPanelEntranceNode`. [ends].

    // Initialization of `narrativeSceneLayer`. [begins].
    self.narrativeSceneLayer = self.widgetsAboveAllNode.getChildByName("NarrativeSceneLayer");
    // Initialization of `narrativeSceneLayer`. [ends].

    // Initialization of `FullscreenIapPurchasingShadow`. [begins].
    const fullscreenIapPurchasingShadowNode = cc.instantiate(self.fullscreenIapPurchasingShadowPrefab);
    fullscreenIapPurchasingShadowNode.setPosition(0, 0);
    fullscreenIapPurchasingShadowNode.active = false;
    safelyAddChild(self.narrativeSceneLayer, fullscreenIapPurchasingShadowNode);
    setLocalZOrder(self.narrativeSceneLayer, CORE_LAYER_Z_INDEX.INFINITY)
    self.fullscreenIapPurchasingShadowNode = fullscreenIapPurchasingShadowNode;
    // Initialization of `FullscreenIapPurchasingShadow`. [ends].

    /*
    * The nomenclature is a little tricky here for two very similar concepts "playerBuildableBinding" and "statefulBuildableInstance".
    * - When talking about frontend in-RAM instances for rendering, we use mostly "statefulBuildableInstance"
    * - When talking about "localStorage" or "remote MySQLServer" stored, to be recovered data, we use mostly "playerBuildableBinding".
    */
    self.statefulBuildableInstanceList = []; //用于保存statefulBuildableInstance.playerBuildableBinding, 维护`cc.sys.localStorage`
    self.statefulBuildableInstanceCompList = []; //保存comp指针

    const boundaryObjs = tileCollisionManager.extractBoundaryObjects(self.node);
    tileCollisionManager.initMapNodeByTiledBoundaries(self, mapNode, boundaryObjs);

    self.tiledMapIns = mapNode.getComponent(cc.TiledMap);
    self.highlighterLayer = self.tiledMapIns.getLayer("StatefulBuildableInstanceHighlighter");
    setLocalZOrder(self.highlighterLayer.node, window.CORE_LAYER_Z_INDEX.STATEFUL_BUILDABLE_INSTANCE_HIGHLIGHTER_LAYER);

    // Initialization of lawn. [begin] {
    self.lawnLayer = self.tiledMapIns.getLayer("Lawn");
    if (null != self.lawnLayer) {
      setLocalZOrder(self.lawnLayer.node, window.CORE_LAYER_Z_INDEX.LAWN_LAYER);
    }
    self.clearLawnLayer();
    // Initialization of lawn. [end] }

    self.startedAtMillis = Date.now();

    self.ingredientSpriteFrameMap = {};
    for (let k in self.ingredientAtlasArray) {
      const ingredientAtlas = self.ingredientAtlasArray[k]; 
      const theSpriteFrames = ingredientAtlas.getSpriteFrames();  
      for (let kk in theSpriteFrames) {
        const spriteFrame = theSpriteFrames[kk];
        self.ingredientSpriteFrameMap[spriteFrame.name] = spriteFrame;
      } 
    }
    
    self.knapsackArray = [];
    self.playerMissionBindingList = [];
    self.playerMissionBindingListForAchievement = [];
    self.playerMissionBindingListForDailyMission = [];
    self.draggingIngredientCell = null;
    self.followingIngredientNode = null;

    if (null != self._timeroutTimer) {
      clearTimeout(self._timeroutTimer);
    }
    self._timeroutTimer = setTimeout(function() {
      if (null != window.handleNetworkDisconnected) { 
        window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
      }
    }, 8000);

    self.statefulBuildableController.active = false;

    if (null == window.enabledDialogs) {
      window.enabledDialogs = [];
    }
    self.ingredientMap = {};

    self.closeableWaitingShadowNode = cc.instantiate(self.closeableWaitingShadowPrefab);
    setLocalZOrder(self.closeableWaitingShadowNode, CORE_LAYER_Z_INDEX.INFINITY);

    // Initialization of bottomBannerAd scope. [begin]
    window.bottomBannerAd = null;
    // Initialization of bottomBannerAd scope. [end]

    // Initialization of videoAd scope. [begin]
    self.videoAd = null;
    self.videoWatchEndedCb = null;
    self.videoWatchAbortedCb = null;
    
    if (cc.sys.platform == cc.sys.WECHAT_GAME) {
      // WARNING: 激励视频是全局单例的，可以提前创建
      let videoAd = wx.createRewardedVideoAd({
        adUnitId: "adunit-9e848f29322ddf09",
      });
      let _videoAdOnError = function(err) {
        console.warn('激励视频错误信息:', err);
      };
      let _videoOnClose = function(res) {
        // 用户点击了【关闭广告】按钮
        // 小于 2.1.0 的基础库版本，res 是一个 undefined
        if (res && res.isEnded || res === undefined) {
          // 正常播放结束，可以下发游戏奖励
          self.videoWatchEndedCb && self.videoWatchEndedCb();
        } else {
          // 播放中途退出，不下发游戏奖励
          self.videoWatchAbortedCb && self.videoWatchAbortedCb(null);
        }
        self.videoWatchEndedCb = self.videoWatchAbortedCb = null;
      }
      if (null != videoAd._clearEvent) {
        videoAd._clearEvent();
      }
      videoAd.onError(_videoAdOnError);
      videoAd.onClose(_videoOnClose);
      videoAd._clearEvent = function() {
        videoAd.offError(_videoAdOnError);
        videoAd.offClose(_videoOnClose);
      }
      self.videoAd = videoAd;
    }
    // Initialization of videoAd scope. [end]
  },

  update(dt) {
    const self = this;
    if (true == self.shouldSetTileMapCullingDirty) {
      console.log("BuildableMap.update, true == self.shouldSetTileMapCullingDirty [begins]");
      self.tiledMapIns.getLayers().forEach((l) => {
        l._setCullingDirty(true); 
      });
      self.shouldSetTileMapCullingDirty = false;
      console.log("BuildableMap.update, true == self.shouldSetTileMapCullingDirty [ends]");
    }
    const cpn = self.widgetsAboveAllNode.getComponent(self.widgetsAboveAllNode.name);

    //显示收钱popupNode [begins]
    for (let i in self.statefulBuildableInstanceCompList) {
      const statefulBuildableInstance = self.statefulBuildableInstanceCompList[i];
      if (constants.STATELESS_BUILDABLE_ID.RESTAURANT != statefulBuildableInstance.id) {
        continue; 
      }
      const statefulBuildableInstanceNode = statefulBuildableInstance.node;
      const playerBuildableBinding = statefulBuildableInstance.playerBuildableBinding;
      const toShowGoldNum = 5; // Hardcoded temporarily. -- YFLu 
      let goldProductionRate = null;
      if (statefulBuildableInstance.currentLevel > 0) {
        goldProductionRate = statefulBuildableInstance.currentBaseGoldProductionRate;
      } else {
        goldProductionRate = 0;  // the hardCoded should be set to 0;
      }
      if (0 == playerBuildableBinding.lastCollectedAt && !playerBuildableBinding.lastCollectedAt) {
        continue; // lastCollectedAt 在state == BUILDING_OR_UPGRADING -> IDLE 时初始化或者刷新。
      }
      const cachedGold = goldProductionRate * (Date.now() - playerBuildableBinding.lastCollectedAt) / 1000;

      if (window.STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE == statefulBuildableInstance.state && toShowGoldNum <= cachedGold) {
        statefulBuildableInstanceNode.toCollectIncomeNode.active = false; //暂时不显示
      } else {
        statefulBuildableInstanceNode.toCollectIncomeNode.active = false;
      }
    }
    //显示收钱popupNode [ends]
  },

  setupInputControls() {
    const instance = this;
    const mapNode = instance.node;
    const canvasNode = mapNode.parent;
    instance.ctrl = instance.widgetsAboveAllScriptIns.touchEventManagerScriptIns;
  },

  createPerStatefulBuildableInstanceNodes(playerBuildableBinding, targetedStatelessBuildableInstance) {
    /**
    * This function is assumed to be called at least once before
    *
    * - "StatefulBuildableInstance.initFromStatelessBuildableBinding(...)", or
    * - "StatefulBuildableInstance.initOrUpdateFromPlayerBuildableBinding(...)", 
    * 
    * because the only way we can have a heap-RAM "statefulBuildableInstance" is 
    * by creating a "statefulBuildableInstanceNode" from "statefulBuildableInstancePrefab",
    * then invoke `statefulBuildableInstance = statefulBuildableInstanceNode.getComponent("StatefulBuildableInstance")`. 
    *
    * Therefore after this returns, you have simultaneously a new "statefulBuildableInstanceNode" as well as a new "statefulBuildableInstance".
    */
    const self = this;
    ++self.playerBuildableBindingIdCounter;
    const statefulBuildableInstanceNode = cc.instantiate(self.statefulBuildableInstancePrefab);
    const statefulBuildableInstance = statefulBuildableInstanceNode.getComponent("StatefulBuildableInstance");
    if (null == playerBuildableBinding) {
      statefulBuildableInstance.initFromStatelessBuildableBinding(targetedStatelessBuildableInstance, self);
      statefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_NEW, statefulBuildableInstance.fixedSpriteCentreContinuousPos, statefulBuildableInstance.currentLevel, null); // 此时还没开始建造
    } else {
      statefulBuildableInstance.initOrUpdateFromPlayerBuildableBinding(playerBuildableBinding, targetedStatelessBuildableInstance, self);
    }
    // Initialize "statefulInstanceInfoPanelNode" [begins] 
    let statefulInstanceInfoPanelNode = statefulBuildableInstanceNode.statefulInstanceInfoPanelNode;
    if (null == statefulInstanceInfoPanelNode) {
      statefulInstanceInfoPanelNode = cc.instantiate(self.statefulBuildableInstanceInfoPanelPrefab);
      statefulBuildableInstanceNode.statefulInstanceInfoPanelNode = statefulInstanceInfoPanelNode;
    }

    const statefulInfoPanelScriptIns = statefulInstanceInfoPanelNode.getComponent(statefulInstanceInfoPanelNode.name);
    // set panel's defaultActionsEnabled to false [begins].
    statefulInfoPanelScriptIns.defaultActionsEnabled = false;
    // set panel's defaultActionsEnabled to false [ends].

    statefulInfoPanelScriptIns.init(self);
    statefulInfoPanelScriptIns.setInfo(statefulBuildableInstance);
    statefulInfoPanelScriptIns.onCloseDelegate = () => {
      self.exitPanelView(statefulInfoPanelScriptIns);
    };
    // Initialize "statefulInstanceInfoPanelNode" [ends] 
    // Initialize "toCollectIncomeNode" [begins]
    let toCollectIncomeNode = statefulBuildableInstanceNode.toCollectIncomeNode;
    if (null == toCollectIncomeNode && null != self.toCollectIncomePrefab) {
      toCollectIncomeNode = cc.instantiate(self.toCollectIncomePrefab);
      toCollectIncomeNode.setPosition(statefulBuildableInstance.calculateOffsetXToBuildableCenter(), statefulBuildableInstance.calculateOffsetYToBuildableCenterTop());
      toCollectIncomeNode.active = false;
      safelyAddChild(statefulBuildableInstanceNode, toCollectIncomeNode);
      setLocalZOrder(toCollectIncomeNode, window.CORE_LAYER_Z_INDEX.TO_COLLECT_INCOME);
      statefulBuildableInstanceNode.toCollectIncomeNode = toCollectIncomeNode;
      const toCollectIncomeScriptIns = toCollectIncomeNode.getComponent("ToCollectIncome");
      toCollectIncomeScriptIns.init(self, statefulBuildableInstance);
      toCollectIncomeScriptIns.setData(0);
      toCollectIncomeScriptIns.onCollect = function(evt) {
        self.playEffectCollectGold();
        self.collectAutoIncreaseCachedGold(statefulBuildableInstance, null != evt);
      };
    }
    // Initialize "toCollectIncomeNode" [ends]

    // Initialize "DestroyableStatefulBuildableCollider". [begins]
    const destroyableStatefulBuildableCollider = statefulBuildableInstanceNode.getComponent(cc.CircleCollider);
    const boundaryParallelogram = statefulBuildableInstance.boundaryPoints;
    const boundaryParallelogramRadius = (boundaryParallelogram[2].sub(boundaryParallelogram[0]).mag())*0.5; 
    destroyableStatefulBuildableCollider.radius = boundaryParallelogramRadius;
    destroyableStatefulBuildableCollider.offset = cc.v2(statefulBuildableInstance.topmostAnchorTileCentreWrtBoundingBoxCentre);
    // Initialize "DestroyableStatefulBuildableCollider". [ends]

    return statefulBuildableInstance;
  },

  createPhantomEditingStatefulBuildable(statefulBuildableCompIns) {
    const self = this;
    const phantomEditingStatefulBuildableNode = cc.instantiate(self.statefulBuildableInstancePrefab);

    const targetStatefulBuildableNode = statefulBuildableCompIns.node;

    phantomEditingStatefulBuildableNode.setPosition(statefulBuildableCompIns.node);
    phantomEditingStatefulBuildableNode.size = targetStatefulBuildableNode.size; 

    const phantomEditingStatefulBuildableIns = phantomEditingStatefulBuildableNode.getComponent("StatefulBuildableInstance");
    phantomEditingStatefulBuildableIns.isPhantom = true;
    const targetedStatelessBuildableInstance = self._findStatelessBuildableInstance(statefulBuildableCompIns.playerBuildableBinding);
    phantomEditingStatefulBuildableIns.initFromStatelessBuildableBinding(targetedStatelessBuildableInstance, self); // Calls "_refreshAppearanceResource()" within.
    phantomEditingStatefulBuildableIns.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE /*Make it always IDLE for now, regardless of the building/upgrading progress. -- YFLu, 2019-10-14. */, statefulBuildableCompIns.fixedSpriteCentreContinuousPos, statefulBuildableCompIns.currentLevel, null);

    // Initialize "DestroyableStatefulBuildableCollider". [begins]
    const destroyableStatefulBuildableCollider = phantomEditingStatefulBuildableIns.getComponent(cc.CircleCollider);
    destroyableStatefulBuildableCollider.enabled = false;
    // Initialize "DestroyableStatefulBuildableCollider". [ends]

    return phantomEditingStatefulBuildableIns;
  },

  collectAutoIncreaseCachedGold(statefulBuildableInstance, shouldPlayAnimation) {
    const self = this;
    const toCollectIncomeNode = statefulBuildableInstance.node.toCollectIncomeNode;
    const toCollectIncomeScriptIns = toCollectIncomeNode.getComponent("ToCollectIncome");
    if (null == statefulBuildableInstance.playerBuildableBinding.lastCollectedAt) {
      return;
    }
    statefulBuildableInstance.playerBuildableBinding.lastCollectedAt = Date.now();
    if (0 >= toCollectIncomeScriptIns.cachedGoldCount) {
      return;
    }
    if (shouldPlayAnimation) {
      toCollectIncomeScriptIns.playCoinFallAnim();
      self.showGoldAdditionTip(statefulBuildableInstance.node, toCollectIncomeScriptIns.cachedGoldCount);
    }
    self.widgetsAboveAllScriptIns.walletInfo.setData({
      gold: self.wallet.gold + toCollectIncomeScriptIns.cachedGoldCount,
    });
    toCollectIncomeScriptIns.setData(0);
    if (statefulBuildableInstance.id == constants.STATELESS_BUILDABLE_ID.GLOBAL_CACHED_GOLD) {
      for (let i in self.statefulBuildableInstanceCompList) {
        const statefulBuildableInstanceComp = self.statefulBuildableInstanceCompList[i];
        if (statefulBuildableInstanceComp.id != constants.STATELESS_BUILDABLE_ID.GLOBAL_CACHED_GOLD) {
          self.collectAutoIncreaseCachedGold(statefulBuildableInstanceComp, false);
        }
      }
    }
  },

  renderPerStatefulBuildableInstanceNode(statefulBuildableInstance) {
    // console.log("BuildableMap.renderPerStatefulBuildableInstanceNode, statefulBuildableInstance.id == ", statefulBuildableInstance.id, " [begins]");
    const self = this;
    const mapIns = self;
    const statefulBuildableInstanceNode = statefulBuildableInstance.node;
    if (null == statefulBuildableInstance.fixedSpriteCentreContinuousPos) {
      const mainCameraContinuousPos = self.mainCameraNode.position; // With respect to CanvasNode.
      // Guoyl6: mainCameraNode 和 camMapNode 的坐标比例是 1 : 1,所以这里不用考虑缩放
      const roughSpriteCentreInitialContinuousPosWrtMapNode = cc.v2(mainCameraContinuousPos.x, mainCameraContinuousPos.y);
      let initialSpriteCentreDiscretePosWrtMapNode = tileCollisionManager._continuousToDiscrete(self.node, self.tiledMapIns, roughSpriteCentreInitialContinuousPosWrtMapNode, cc.v2(0, 0));
      initialSpriteCentreDiscretePosWrtMapNode = cc.v2(initialSpriteCentreDiscretePosWrtMapNode);
      let initialAnchorTileDiscretePosWrtMapNode = initialSpriteCentreDiscretePosWrtMapNode.sub(statefulBuildableInstance.spriteCentreTileToAnchorTileDiscreteOffset);
      initialAnchorTileDiscretePosWrtMapNode = self.correctDiscretePositionToWithinMap(statefulBuildableInstance, initialAnchorTileDiscretePosWrtMapNode);
      initialSpriteCentreDiscretePosWrtMapNode = initialAnchorTileDiscretePosWrtMapNode.add(statefulBuildableInstance.spriteCentreTileToAnchorTileDiscreteOffset);
      const initialSpriteCentreContinuousPosWrtMapNode = tileCollisionManager._continuousFromCentreOfDiscreteTile(mapIns.node, mapIns.tiledMapIns, null, initialSpriteCentreDiscretePosWrtMapNode.x, initialSpriteCentreDiscretePosWrtMapNode.y);
      statefulBuildableInstanceNode.setPosition(initialSpriteCentreContinuousPosWrtMapNode);
    } else {
      statefulBuildableInstanceNode.setPosition(statefulBuildableInstance.fixedSpriteCentreContinuousPos);
    }
    
    safelyAddChild(self.node, statefulBuildableInstanceNode); // Using `statefulBuildableInstanceNode` as a direct child under `mapNode`, but NOT UNDER `mainCameraNode`, for the convenience of zooming and translating.
    // 使statefulBuildableInstanceNode.zIndex具有一个初始值
    setLocalZOrder(statefulBuildableInstanceNode, window.CORE_LAYER_Z_INDEX.UN_HIGHLIGHTED_STATEFUL_BUILDABLE_INSTANCE);
    statefulBuildableInstanceNode.origZIndex = window.CORE_LAYER_Z_INDEX.UN_HIGHLIGHTED_STATEFUL_BUILDABLE_INSTANCE;
    // console.log("BuildableMap.renderPerStatefulBuildableInstanceNode, statefulBuildableInstance.id == ", statefulBuildableInstance.id, " [ends]");
  },

  refreshOrCreateIngredientAcceptor(statefulBuildableInstance) {
    const self = this;
    self.ingredientAcceptorMap = self.ingredientAcceptorMap || {};
    if (!self.ingredientAcceptorMap[statefulBuildableInstance.node.uuid]) {
      self.ingredientAcceptorMap[statefulBuildableInstance.node.uuid] = cc.instantiate(self.statefulBuildableIngredientAcceptorPrefab);
    }
    let ingredientAcceptorNode = self.ingredientAcceptorMap[statefulBuildableInstance.node.uuid];
    let ingredientAcceptorIns = ingredientAcceptorNode.getComponent('StatefulBuildableIngredientAcceptor');
    ingredientAcceptorIns.points.splice(0, ingredientAcceptorIns.points.length);

    const anchorTileContinuousPos = statefulBuildableInstance.fixedSpriteCentreContinuousPos.add(statefulBuildableInstance.estimatedSpriteCentreToAnchorTileCentreContinuousOffset);
    const boundingBoxCentrePos = anchorTileContinuousPos.sub(statefulBuildableInstance.topmostAnchorTileCentreWrtBoundingBoxCentre);

    const newAcceptorPos = boundingBoxCentrePos;

    for (let p of statefulBuildableInstance.boundaryPoints) {
      ingredientAcceptorIns.points.push(cc.v2(p));
    }

    ingredientAcceptorIns.init(self, statefulBuildableInstance);
    ingredientAcceptorNode.setPosition(newAcceptorPos);
    safelyAddChild(self.node, ingredientAcceptorNode);
  },

  clearIngredientAcceptor(statefulBuildableInstance) {
    if (null == statefulBuildableInstance) {
      return;
    }
    if (null == this.ingredientAcceptorMap[statefulBuildableInstance.node.uuid]) {
      return;
    }
    const theAcceptorNode = this.ingredientAcceptorMap[statefulBuildableInstance.node.uuid];
    if (theAcceptorNode.parent) {
      theAcceptorNode.removeFromParent();
    }
    delete this.ingredientAcceptorMap[statefulBuildableInstance.node.uuid];
  },

  startPositioningExistingStatefulBuildableInstance(statefulBuildableInstance) {
    const self = this;
    const mapIns = self;
    const tiledMapIns = mapIns.tiledMapIns;
    self.setSideButtonGroupActive(false);
    if (false == self.addEditingExistingStatefulBuildableInstance()) return;

    let statefulBuildableInstanceNode = statefulBuildableInstance.node;
    if (null == statefulBuildableInstanceNode) {
      cc.warn("There is no `statefulBuildableInstanceNode` when trying to position existing statefulBuildableInstance.");
      return;
    }

    switch (statefulBuildableInstance.state) {
      case window.STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE:
        statefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING, statefulBuildableInstance.fixedSpriteCentreContinuousPos, statefulBuildableInstance.currentLevel, statefulBuildableInstance.buildingOrUpgradingStartedAt);
        break;
      case window.STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING:
        statefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_BUILDING, statefulBuildableInstance.fixedSpriteCentreContinuousPos, statefulBuildableInstance.currentLevel, statefulBuildableInstance.buildingOrUpgradingStartedAt);
        break;
      case window.STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING:
        statefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_UPGRADING, statefulBuildableInstance.fixedSpriteCentreContinuousPos, statefulBuildableInstance.currentLevel, statefulBuildableInstance.buildingOrUpgradingStartedAt);
        break;
      default:
        break;
    }

    setLocalZOrder(statefulBuildableInstanceNode, window.CORE_LAYER_Z_INDEX.HIGHLIGHTED_STATEFUL_BUILDABLE_INSTANCE);
    statefulBuildableInstanceNode.origZIndex = window.CORE_LAYER_Z_INDEX.HIGHLIGHTED_STATEFUL_BUILDABLE_INSTANCE;

    self.editingStatefulBuildableInstance = statefulBuildableInstance;

    // Creates a "phantomEditingStatefulBuildableInstance" which will be deleted in "self.cancelHighlightingStatefulBuildableInstance". [begin]
    self.phantomEditingStatefulBuildableInstance = self.createPhantomEditingStatefulBuildable(statefulBuildableInstance);
    const phantomEditingStatefulBuildableInstanceNode = self.phantomEditingStatefulBuildableInstance.node;

    self.phantomEditingStatefulBuildableInstance.runBlinking();
    safelyAddChild(self.node, phantomEditingStatefulBuildableInstanceNode);
    setLocalZOrder(phantomEditingStatefulBuildableInstanceNode, window.CORE_LAYER_Z_INDEX.HIGHLIGHTED_STATEFUL_BUILDABLE_INSTANCE + 1);
    // 使用phantomEditingStatefulBuildableInstance的话，无需修改origZIndex使得建筑物不会因为shelterManager而被遮挡。
    setLocalZOrder(statefulBuildableInstanceNode, window.CORE_LAYER_Z_INDEX.HIGHLIGHTED_STATEFUL_BUILDABLE_INSTANCE);
    statefulBuildableInstanceNode.origZIndex = window.CORE_LAYER_Z_INDEX.UN_HIGHLIGHTED_STATEFUL_BUILDABLE_INSTANCE; 

    // Creates a "phantomEditingStatefulBuildableInstance" which will be deleted in "self.cancelHighlightingStatefulBuildableInstance". [end]

    /*
     * WARNING: 这里的setLocalZOrder应该在renderPerStatefulBuildableInstanceNode
     * 之后进行,因为renderPerStatefulBuildableInstanceNode中也有设置zIndex的操作.
     */

    self.refreshStatefulBuildableController();
    self.cancelLawnForStatefulBuildableInstance(statefulBuildableInstance);
    self.refreshHighlightedTileGridForEditingStatefulBuildableInstance();
    return statefulBuildableInstance;
  },

  startPositioningNewStatefulBuildableInstance(statelessBuildableInstance) {
    const self = this;
    const mapIns = self;
    const tiledMapIns = mapIns.tiledMapIns;
    self.setSideButtonGroupActive(false);
    if (false == self.addPositioningNewStatefulBuildableInstance()) return;

    const statefulBuildableInstance = self.createPerStatefulBuildableInstanceNodes(null, statelessBuildableInstance);
    const statefulBuildableInstanceNode = statefulBuildableInstance.node;
    self.renderPerStatefulBuildableInstanceNode(statefulBuildableInstance);
    /*
     * WARNING: 这里的setLocalZOrder应该在renderPerStatefulBuildableInstanceNode
     * 之后进行,因为renderPerStatefulBuildableInstanceNode中也有设置zIndex的操作.
     */
    setLocalZOrder(statefulBuildableInstanceNode, window.CORE_LAYER_Z_INDEX.HIGHLIGHTED_STATEFUL_BUILDABLE_INSTANCE);

    self.editingStatefulBuildableInstance = statefulBuildableInstance;
    self.refreshStatefulBuildableController();
    self.refreshHighlightedTileGridForEditingStatefulBuildableInstance(self.tiledMapIns);
    return statefulBuildableInstance;
  },

  endPositioningStatefulBuildableInstance(successfullyPlacedOrNot) {
    const self = this;
    self.setSideButtonGroupActive(true);
    let rs = self._endPositioningStatefulBuildableInstance(successfullyPlacedOrNot);
    self.refreshStatefulBuildableController();
    self.refreshBuildButtonCountTip();
    return rs;
  },

  _endPositioningStatefulBuildableInstance(successfullyPlacedOrNot) {
    const self = this,
      mapIns = self;
    const mapNode = self.node;
    let statefulBuildableInstanceList = self.statefulBuildableInstanceList;
    const editingStatefulBuildableInstance = self.editingStatefulBuildableInstance;
    const editingStatefulBuildableInstanceNode = editingStatefulBuildableInstance.node;

    const effFixedSpriteCentreContinuousPos = (null == self.phantomEditingStatefulBuildableInstance ? editingStatefulBuildableInstanceNode.position : self.phantomEditingStatefulBuildableInstance.node.position);
    const isPositionModified = (null == editingStatefulBuildableInstance.fixedSpriteCentreContinuousPos ? true : !self.isEditingStatefulBuildableInstanceInSelfBarriers());

    self.cancelHighlightingStatefulBuildableInstance(); // Will assign "self.phantomEditingStatefulBuildableInstance = null" within.
    if (null == editingStatefulBuildableInstance || null == editingStatefulBuildableInstanceNode.parent) {
      return;
    }
    setLocalZOrder(editingStatefulBuildableInstanceNode, window.CORE_LAYER_Z_INDEX.UN_HIGHLIGHTED_STATEFUL_BUILDABLE_INSTANCE);
    editingStatefulBuildableInstanceNode.origZIndex = window.CORE_LAYER_Z_INDEX.UN_HIGHLIGHTED_STATEFUL_BUILDABLE_INSTANCE;
    if (!successfullyPlacedOrNot) {
      /*
         In this case, "self.phantomEditingStatefulBuildableInstance" has no stake.
      */
      switch (editingStatefulBuildableInstance.state) {
        case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_NEW:
          self.removePositioningNewStatefulBuildableInstance();
          editingStatefulBuildableInstanceNode.parent.removeChild(editingStatefulBuildableInstanceNode);
          self.editingStatefulBuildableInstance = null;
          self.enterPanelView(self.statelessBuildableInstanceCardListScriptIns);
          --self.playerBuildableBindingIdCounter;
          return; // Note that it's returning instead breaking here -- YFLu.
        case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING:
          self.removeEditingExistingStatefulBuildableInstance();
          editingStatefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE, editingStatefulBuildableInstance.fixedSpriteCentreContinuousPos, editingStatefulBuildableInstance.currentLevel, editingStatefulBuildableInstance.buildingOrUpgradingStartedAt);
          break;
        case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_BUILDING:
          self.removeEditingExistingStatefulBuildableInstance();
          editingStatefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING, editingStatefulBuildableInstance.fixedSpriteCentreContinuousPos, editingStatefulBuildableInstance.currentLevel, editingStatefulBuildableInstance.buildingOrUpgradingStartedAt);
          break;
        case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_UPGRADING:
          self.removeEditingExistingStatefulBuildableInstance();
          editingStatefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING, editingStatefulBuildableInstance.fixedSpriteCentreContinuousPos, editingStatefulBuildableInstance.currentLevel, editingStatefulBuildableInstance.buildingOrUpgradingStartedAt);
          break;
        default:
          console.warn("Invalid `StatefulBuildableInstance.state` when positioning is cancelled: ", editingStatefulBuildableInstance);
          break;
      }
      editingStatefulBuildableInstanceNode.setPosition(editingStatefulBuildableInstance.fixedSpriteCentreContinuousPos);
      self.refreshOrCreateShelterAndDefenderForStatefulBuildableInstance(editingStatefulBuildableInstance);
      self.refreshLawnForStatefulBuildableInstance(editingStatefulBuildableInstance);
    } else {
      /*
         In this case, the position of "self.phantomEditingStatefulBuildableInstance" should be respected.
      */
      let spriteCentreDiscretePosWrtMapNode = tileCollisionManager._continuousToDiscrete(self.node, self.tiledMapIns, effFixedSpriteCentreContinuousPos, cc.v2(0, 0));
      spriteCentreDiscretePosWrtMapNode = cc.v2(spriteCentreDiscretePosWrtMapNode);
      if (self.isStatefulBuildableOutOfMap(editingStatefulBuildableInstance, spriteCentreDiscretePosWrtMapNode)) {
        console.warn("The positioned `StatefulBuildableInstance` is out of map: ", editingStatefulBuildableInstance, " at ", effFixedSpriteCentreContinuousPos);
        return;
      }
      let shouldClearPrevBoundaryBarrier = (editingStatefulBuildableInstance.isNewing() ? false : isPositionModified);
      let shouldCreateBoundaryBarrier = (editingStatefulBuildableInstance.isNewing() ? true : isPositionModified);
      switch (editingStatefulBuildableInstance.state) {
        case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_NEW:
          let buildSuccess = self.costGoldForBuildOrUpgradeBuildableInstance(
            editingStatefulBuildableInstance,
            editingStatefulBuildableInstance.currentLevel + 1,
            function(statefulBuildableInstance, newLevel, requiredGold) {
              self.removePositioningNewStatefulBuildableInstance();
              self.statefulBuildableInstanceList.push(editingStatefulBuildableInstance.playerBuildableBinding);
              self.statefulBuildableInstanceCompList.push(editingStatefulBuildableInstance);
              editingStatefulBuildableInstance.updateCriticalProperties(
                window.STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING,
                effFixedSpriteCentreContinuousPos,
                editingStatefulBuildableInstance.currentLevel,
                Date.now()
              );
              self.onStatefulBuildableInstanceCreated(editingStatefulBuildableInstance);
            }
          );
          if (!buildSuccess) {
            console.warn(`Why that I hava not enough money here?`);
            self.removePositioningNewStatefulBuildableInstance();
            self.editingStatefulBuildableInstance.node.parent.removeChild(self.editingStatefulBuildableInstance.node);
            self.editingStatefulBuildableInstance = null;
            return;
          }
          break;
        case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING:
          self.removeEditingExistingStatefulBuildableInstance();
          editingStatefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE, effFixedSpriteCentreContinuousPos, editingStatefulBuildableInstance.currentLevel, editingStatefulBuildableInstance.buildingOrUpgradingStartedAt);
          break;
        case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_BUILDING:
          self.removeEditingExistingStatefulBuildableInstance();
          editingStatefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING, effFixedSpriteCentreContinuousPos, editingStatefulBuildableInstance.currentLevel, editingStatefulBuildableInstance.buildingOrUpgradingStartedAt);
          break;
        case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_UPGRADING:
          self.removeEditingExistingStatefulBuildableInstance();
          editingStatefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING, effFixedSpriteCentreContinuousPos, editingStatefulBuildableInstance.currentLevel, editingStatefulBuildableInstance.buildingOrUpgradingStartedAt);
          break;
        default:
          console.warn("Invalid `StatefulBuildableInstance.state` when positioning is confirmed: ", editingStatefulBuildableInstance);
          break;
      }
      if (shouldClearPrevBoundaryBarrier) {
        self.clearTheBoundaryColliderInfoForStatefulBuildableInstance(editingStatefulBuildableInstance);
      }
      if (shouldCreateBoundaryBarrier) {
        self.createBoundaryColliderForStatefulBuildableInstance(editingStatefulBuildableInstance, effFixedSpriteCentreContinuousPos);
      }
      if (isPositionModified) {
        self.refreshOrCreateIngredientAcceptor(editingStatefulBuildableInstance);
        window.refreshCachedKnownBarrierGridDict(self.node, self.barrierColliders, null);
      }
      self.renderPerStatefulBuildableInstanceNode(editingStatefulBuildableInstance);
      self.refreshLawnForStatefulBuildableInstance(editingStatefulBuildableInstance);
      self.refreshOrCreateShelterAndDefenderForStatefulBuildableInstance(editingStatefulBuildableInstance);
    }
    self.editingStatefulBuildableInstance = null;
  },

  clearTheBoundaryColliderInfoForStatefulBuildableInstance(statefulBuildableInstance) {
    const self = this;
    const mapScriptIns = self;
    if (statefulBuildableInstance.barrierColliderIns) {
      const barrierCollidersInMap = mapScriptIns.barrierColliders;
      for (let i in barrierCollidersInMap) {
        const theBarrierColliderIns = barrierCollidersInMap[i];
        if (theBarrierColliderIns.uuid == statefulBuildableInstance.barrierColliderIns.uuid) {
          barrierCollidersInMap.splice(i, 1);
          const barrierColliderNode = statefulBuildableInstance.barrierColliderNode;
          if (barrierColliderNode && barrierColliderNode.parent) {
            barrierColliderNode.parent.removeChild(barrierColliderNode);
          }
          break;
        }
      }
      statefulBuildableInstance.barrierColliderIns = null;
      statefulBuildableInstance.barrierColliderNode = null;
    }
  },

  createBoundaryColliderForStatefulBuildableInstance(statefulBuildableInstance, effFixedSpriteCentreContinuousPos) {
    /*
    * Be very careful using this function, it should only be called
    * - when a new `statefulBuildableInstance` is created from a new `playerBuildableBinding` record from either `localStorage` or `remote MySQLServer`, or
    * - when `endPositioningStatefulBuildableInstance`.
    */
    if (null == statefulBuildableInstance.fixedSpriteCentreContinuousPos) {
      cc.warn("Invoking `createBoundaryColliderForStatefulBuildableInstance` when `null == statefulBuildableInstance.fixedSpriteCentreContinuousPos`.");
      return;
    }
    if (null == effFixedSpriteCentreContinuousPos) {
      effFixedSpriteCentreContinuousPos = statefulBuildableInstance.fixedSpriteCentreContinuousPos; 
    }
    const self = this;
    const mapScriptIns = self;
    if (null != statefulBuildableInstance.boundFollowingNpcDict) {
      for (let k in statefulBuildableInstance.boundFollowingNpcDict) {
        const boundFollowingNpc = statefulBuildableInstance.boundFollowingNpcDict[k]; 
        boundFollowingNpc.refreshGrandSrcAndCurrentDestination();
      } 
    }
    const newBarrier = cc.instantiate(mapScriptIns.polygonBoundaryBarrierPrefab);
    newBarrier.width = statefulBuildableInstance.boundingBoxContinuousWidth;
    newBarrier.height = statefulBuildableInstance.boundingBoxContinuousHeight;
    newBarrier.setAnchorPoint(cc.v2(0, 0));

    const anchorTileContinuousPos = effFixedSpriteCentreContinuousPos.add(statefulBuildableInstance.estimatedSpriteCentreToAnchorTileCentreContinuousOffset);
    const boundingBoxCentrePos = anchorTileContinuousPos.sub(statefulBuildableInstance.topmostAnchorTileCentreWrtBoundingBoxCentre);

    const newBarrierPos = boundingBoxCentrePos;
    newBarrier.setPosition(newBarrierPos);

    const newBarrierColliderIns = newBarrier.getComponent(cc.PolygonCollider);
    newBarrierColliderIns.points = [];
    for (let p of statefulBuildableInstance.boundaryPoints) {
      newBarrierColliderIns.points.push(cc.v2(p));
    }
    statefulBuildableInstance.barrierColliderIns = newBarrierColliderIns;
    statefulBuildableInstance.barrierColliderNode = newBarrier;
    newBarrierColliderIns.boundStatefulBuildable = statefulBuildableInstance;
    mapScriptIns.barrierColliders.push(newBarrierColliderIns);
    safelyAddChild(mapScriptIns.node, newBarrier);
    return newBarrier;
  },

  refreshOrCreateShelterAndDefenderForStatefulBuildableInstance(statefulBuildableInstance) {
    const self = this;
    const percentage = 0.6;

    let headShelterIns = null; 
    let tailShelterIns = null; 
    let tailShelterNode = null;
    let headShelterNode = null;

    if (!statefulBuildableInstance.node._polygonBoundaryShelterCreated) {
      statefulBuildableInstance.node._polygonBoundaryShelterCreated = true;
      tailShelterNode = cc.instantiate(self.polygonBoundaryShelterPrefab);
      headShelterNode = cc.instantiate(self.polygonBoundaryShelterPrefab);
      tailShelterNode.tailOrHead = "tail";
      headShelterNode.tailOrHead = "head";

      // Create fields referenced in PolygonBoundaryShelter and ShelterChainCollider. [begin]
      const imageObject = {
        imageObjectNode: statefulBuildableInstance.node,
      }, boundaryObj = {
        imageObject: imageObject,
      };
      tailShelterNode.imageObject = imageObject;
      tailShelterNode.boundaryObj = boundaryObj;
      headShelterNode.imageObject = imageObject;
      headShelterNode.boundaryObj = boundaryObj;
      // Create fields referenced in PolygonBoundaryShelter and ShelterChainCollider. [end]

      headShelterIns = headShelterNode.getComponent(cc.PolygonCollider);
      tailShelterIns = tailShelterNode.getComponent(cc.PolygonCollider);

      tailShelterIns.points.splice(0, tailShelterIns.points.length);
      tailShelterIns.points.push.call(tailShelterIns.points,
        cc.v2(statefulBuildableInstance.boundaryPoints[0]),
        cc.v2(statefulBuildableInstance.boundaryPoints[1].x * percentage, statefulBuildableInstance.boundaryPoints[0].y * (1 - percentage)),
        cc.v2(statefulBuildableInstance.boundaryPoints[3].x * (1 - percentage), statefulBuildableInstance.boundaryPoints[2].y * percentage),
        cc.v2(statefulBuildableInstance.boundaryPoints[3])
      );
      headShelterIns.points.splice(0, headShelterIns.points.length);
      headShelterIns.points.push.call(headShelterIns.points,
        cc.v2(statefulBuildableInstance.boundaryPoints[1].x * (1 - percentage), statefulBuildableInstance.boundaryPoints[0].y * percentage),
        cc.v2(statefulBuildableInstance.boundaryPoints[1]),
        cc.v2(statefulBuildableInstance.boundaryPoints[2]),
        cc.v2(statefulBuildableInstance.boundaryPoints[3].x * (percentage), statefulBuildableInstance.boundaryPoints[2].y * (1 - percentage)),
      );

      statefulBuildableInstance.node.tailShelterNode = tailShelterNode;
      statefulBuildableInstance.node.headShelterNode = headShelterNode;
      safelyAddChild(self.node, tailShelterNode);
      safelyAddChild(self.node, headShelterNode);
    }
    tailShelterNode = statefulBuildableInstance.node.tailShelterNode;
    headShelterNode = statefulBuildableInstance.node.headShelterNode; 

    headShelterIns = headShelterNode.getComponent(cc.PolygonCollider);
    tailShelterIns = tailShelterNode.getComponent(cc.PolygonCollider);

    window.addToGlobalShelterChainVerticeMap(statefulBuildableInstance.node);
    const halfBarrierAnchorToBoundingBoxCentre = cc.v2(statefulBuildableInstance.boundingBoxContinuousWidth, statefulBuildableInstance.boundingBoxContinuousHeight).mul(0.5);
    // force trigger PolygonBoundaryShelter.onCollisionExit
    tailShelterNode.removeFromParent();
    headShelterNode.removeFromParent();

    tailShelterNode.position = statefulBuildableInstance.fixedSpriteCentreContinuousPos.add(
      cc.v2(0, halfBarrierAnchorToBoundingBoxCentre.y * percentage)
    );
    headShelterNode.position = statefulBuildableInstance.fixedSpriteCentreContinuousPos.add(
      cc.v2(0, halfBarrierAnchorToBoundingBoxCentre.y * -percentage)
    );
    // force trigger PolygonBoundaryShelter.onCollisionEnter
    safelyAddChild(self.node, tailShelterNode);
    safelyAddChild(self.node, headShelterNode);
    return;
  },

  refreshHighlightedTileGridForEditingStatefulBuildableInstance() {
    const self = this;
    if (null == self.editingStatefulBuildableInstance && null == self.phantomEditingStatefulBuildableInstance) {
      cc.warn("Wrong map state detected in `refreshHighlightedTileGridForEditingStatefulBuildableInstance`!");
      return;
    }

    const theInsToHighlight = (null == self.phantomEditingStatefulBuildableInstance ? self.editingStatefulBuildableInstance : self.phantomEditingStatefulBuildableInstance);
    /*
    * Starting from CocosCreator v2.2.0, "TiledLayer.setTileGIDAt(...)" doesn't work. 
    */

    const mapTileRectilinearSize = self.tiledMapIns.getTileSize();
    const discreteWidth = theInsToHighlight.discreteWidth;
    const discreteHeight = theInsToHighlight.discreteHeight;
    if (null == theInsToHighlight.theHighlighters) {
      theInsToHighlight.theHighlighters = [];
      for (let dx = 0; dx < discreteWidth; ++dx) {
        for (let dy = 0; dy < discreteHeight; ++dy) {
          const highlighterNode = cc.instantiate(self.tileHighlighterPrefab);
          theInsToHighlight.theHighlighters.push(highlighterNode.getComponent("TileHighlighter"));
          safelyAddChild(self.highlighterLayer.node, highlighterNode);
        }
      }
    }
     
    let isCapableToPlace = !self.isHighlightingStatefulBuildableInstanceInBarriers();

    for (let dx = 0; dx < discreteWidth; ++dx) {
      for (let dy = 0; dy < discreteHeight; ++dy) {
        const indice = (dx + dy*discreteWidth);
        const highlighter = theInsToHighlight.theHighlighters[indice];
        highlighter.red.node.active = (false == isCapableToPlace); 
        highlighter.green.node.active = (true == isCapableToPlace); 

        const posWrtAnchorTileCentre = cc.v2(
          (dx - dy) * 0.5 * mapTileRectilinearSize.width,
          -(dx + dy) * 0.5 * mapTileRectilinearSize.height, 
        );
        const posWrtSpriteCentre = posWrtAnchorTileCentre.add(theInsToHighlight.estimatedSpriteCentreToAnchorTileCentreContinuousOffset);
        const posWrtMapNode = posWrtSpriteCentre.add(theInsToHighlight.node.position);
        highlighter.node.setPosition(posWrtMapNode);
      }
    }    
  },

  cancelHighlightingStatefulBuildableInstance() {
    const self = this;
    const theInsToHighlight = (null == self.phantomEditingStatefulBuildableInstance ? self.editingStatefulBuildableInstance : self.phantomEditingStatefulBuildableInstance);
    if (null != theInsToHighlight && null != theInsToHighlight.theHighlighters) {
      for (let k in theInsToHighlight.theHighlighters) {
        const singleHighlighter = theInsToHighlight.theHighlighters[k]; 
        singleHighlighter.red.node.active = false;
        singleHighlighter.green.node.active = false;
      } 
    }

    if (null != self.phantomEditingStatefulBuildableInstance) {
      if (null != self.phantomEditingStatefulBuildableInstance.node.parent) {
        self.phantomEditingStatefulBuildableInstance.node.removeFromParent();
      }
      self.phantomEditingStatefulBuildableInstance = null;
    }
  },

  isHighlightingStatefulBuildableInstanceInBarriers() {
    const self = this;
    let currentLayerSize = self.highlighterLayer.getLayerSize();
    const theInsToHighlight = (null == self.phantomEditingStatefulBuildableInstance ? self.editingStatefulBuildableInstance : self.phantomEditingStatefulBuildableInstance);
    const effContinuousPos = theInsToHighlight.node.position; 
    const discreteWidth = theInsToHighlight.discreteWidth;
    const discreteHeight = theInsToHighlight.discreteHeight;
    const anchorTileDiscretePos = tileCollisionManager._continuousToDiscrete(self.node, self.tiledMapIns, theInsToHighlight.node.position.add(theInsToHighlight.estimatedSpriteCentreToAnchorTileCentreContinuousOffset), cc.v2(0, 0));
    const selfBarriersAnchoTileDiscretePos = null == self.editingStatefulBuildableInstance.fixedSpriteCentreContinuousPos /* Deliberately NOT using "theInsToHighlight" here. -- YFLu, 2019-10-14. */ ? null : tileCollisionManager._continuousToDiscrete(self.node, self.tiledMapIns, self.editingStatefulBuildableInstance.fixedSpriteCentreContinuousPos.add(self.editingStatefulBuildableInstance.estimatedSpriteCentreToAnchorTileCentreContinuousOffset), cc.v2(0, 0));
    for (let x = anchorTileDiscretePos.x; x < anchorTileDiscretePos.x + discreteWidth; x++) {
      for (let y = anchorTileDiscretePos.y; y < anchorTileDiscretePos.y + discreteHeight; y++) {
        if (
           null != selfBarriersAnchoTileDiscretePos
           &&
           x >= selfBarriersAnchoTileDiscretePos.x && x < selfBarriersAnchoTileDiscretePos.x + discreteWidth
           &&
           y >= selfBarriersAnchoTileDiscretePos.y && y < selfBarriersAnchoTileDiscretePos.y + discreteHeight
        ) {
          continue;
        }
        if (window.cachedKnownBarrierGridDict[x] && window.cachedKnownBarrierGridDict[x][y]) {
          return true;
        }
        if (self.typedBuildableAreaDict && self.typedBuildableAreaDict[theInsToHighlight.type]) {
          /*
          [WARNING]
      
          If "null == self.typedBuildableAreaDict[theInsToHighlight.type]" then the targeted type can be considered "buildable everywhere".
      
          -- YFLu, 2019-10-01.
          */ 
          if (null == self.typedBuildableAreaDict[theInsToHighlight.type][x] || true != self.typedBuildableAreaDict[theInsToHighlight.type][x][y]) {
            return true;
          }
        } 
      }
    }
    return false;
  },

  isEditingStatefulBuildableInstanceInSelfBarriers() {
    const self = this;
    if (null == self.editingStatefulBuildableInstance.fixedSpriteCentreContinuousPos) {
      return false;
    }
    const effContinuousPos = (null == self.phantomEditingStatefulBuildableInstance ? self.editingStatefulBuildableInstance.node.position : self.phantomEditingStatefulBuildableInstance.node.position);
    const effFixedSpriteCentreContinuousPos = (null == self.phantomEditingStatefulBuildableInstance ? self.editingStatefulBuildableInstance.fixedSpriteCentreContinuousPos : self.phantomEditingStatefulBuildableInstance.fixedSpriteCentreContinuousPos);;
    const anchorTileDiscretePos = tileCollisionManager._continuousToDiscrete(self.node, self.tiledMapIns, effContinuousPos.add(self.editingStatefulBuildableInstance.estimatedSpriteCentreToAnchorTileCentreContinuousOffset), cc.v2(0, 0));
    const selfAnchorTileDiscretePos = tileCollisionManager._continuousToDiscrete(self.node, self.tiledMapIns, effFixedSpriteCentreContinuousPos.add(self.editingStatefulBuildableInstance.estimatedSpriteCentreToAnchorTileCentreContinuousOffset), cc.v2(0, 0));
    return cc.v2(anchorTileDiscretePos).equals(cc.v2(selfAnchorTileDiscretePos));
  },

  onMovingBuildableInstance(touchPosWrtCameraCentreScaledToMapNode, immediateDiffVec, statefulBuildableInstanceAtTouchStart) {
    const self = this,
      mapIns = this;
    if (null == this.editingStatefulBuildableInstance && null == this.phantomEditingStatefulBuildableInstance) {
      cc.warn("Wrong map state detected in `onMovingBuildableInstance`! #1 ");
      return;
    }
    if (!mapIns.isPositioningNewStatefulBuildableInstance() && !mapIns.isEditingExistingStatefulBuildableInstance()) {
      cc.warn("Wrong map state detected in `onMovingBuildableInstance`! #2");
      return;
    }
    let isMovingEditingStatefulBuildable = true;
    if (null == statefulBuildableInstanceAtTouchStart) {
      isMovingEditingStatefulBuildable = false;
    } else if (null != self.phantomEditingStatefulBuildableInstance) {
      isMovingEditingStatefulBuildable = statefulBuildableInstanceAtTouchStart == self.phantomEditingStatefulBuildableInstance;
    } else {
      isMovingEditingStatefulBuildable = statefulBuildableInstanceAtTouchStart == self.editingStatefulBuildableInstance;
    }
    if (isMovingEditingStatefulBuildable) {
      // Moving StatefulBuildableInstance
      const mainCameraContinuousPos = mapIns.ctrl.mainCameraNode.position; // With respect to CanvasNode.
      const {spriteCentreTileToAnchorTileDiscreteOffset} = statefulBuildableInstanceAtTouchStart;
      const roughImmediateContinuousPosOfTouchOnMapNode = (mainCameraContinuousPos.add(cc.v2(touchPosWrtCameraCentreScaledToMapNode.x, touchPosWrtCameraCentreScaledToMapNode.y)));
      let immediateDiscretePosOfCameraOnMapNode = tileCollisionManager._continuousToDiscrete(mapIns.node, mapIns.tiledMapIns, roughImmediateContinuousPosOfTouchOnMapNode, cc.v2(0, 0));
      immediateDiscretePosOfCameraOnMapNode = cc.v2(immediateDiscretePosOfCameraOnMapNode);
      let immediateAnchorDiscretePos = immediateDiscretePosOfCameraOnMapNode.sub(spriteCentreTileToAnchorTileDiscreteOffset);
      immediateAnchorDiscretePos = mapIns.correctDiscretePositionToWithinMap(statefulBuildableInstanceAtTouchStart, immediateAnchorDiscretePos);
      immediateDiscretePosOfCameraOnMapNode = immediateAnchorDiscretePos.add(spriteCentreTileToAnchorTileDiscreteOffset);
      const immediateContinuousPosWrtMapNode = tileCollisionManager._continuousFromCentreOfDiscreteTile(mapIns.node, mapIns.tiledMapIns, null, immediateDiscretePosOfCameraOnMapNode.x, immediateDiscretePosOfCameraOnMapNode.y);

      statefulBuildableInstanceAtTouchStart.node.setPosition(immediateContinuousPosWrtMapNode);
      mapIns.refreshHighlightedTileGridForEditingStatefulBuildableInstance();
    } else {
      if (self.isInNarrativeScene()) {
        // In NarrativeScene, don't move Camera.
        return;
      }
      // Moving Camera
      const cameraPos = mapIns.ctrl.mainCameraNode.position.sub(immediateDiffVec);
      if (tileCollisionManager.cameraIsOutOfGrandBoundary(mapIns.node, cameraPos.sub(mapIns.node.position))) {
        self.onMapOverMoved && self.onMapOverMoved();
        return;
      }
      mapIns.ctrl.mainCameraNode.setPosition(cameraPos);
    }
  },

  onSingleFingerClick(evt, touchPosWrtCameraCentreScaledToMapNode) {
    /*
    There're multiple types of return values for this method.
    - NOT_TOUCHED_SHOULD_PROPOGATE,
    - NOT_TOUCHED_STOPPED_PROPOGATION,
    - TOUCHED_SHOULD_PROPOGATE,
    - TOUCHED_STOPPED_PROPOGATION,
    
    -- YFLu, 2019-10-30.
    */
    const self = this,
      mapIns = this;

    if (self.isShowingModalPopup() || self.isFloatingModalPopup()) {
      let topEnabledDialog = window.enabledDialogs[window.enabledDialogs.length-1];
      // To find the outerest dialog for this situation:
      //   Dialog has some Dialog as children.
      let outerDialogFounded = false;
      while (!outerDialogFounded && null != topEnabledDialog) {
        outerDialogFounded = true;
        window.enabledDialogs.forEach(function(dialog) {
          if (dialog.node != topEnabledDialog.node && topEnabledDialog.node.isChildOf(dialog.node)) {
            topEnabledDialog = dialog;
            outerDialogFounded = false;
          }
        })
      }
      
      if (!topEnabledDialog) {
        console.log(`Why there no dialog found when mapIns isShowingModalPopup?`);
        return window.NOT_TOUCHED_STOPPED_PROPOGATION;
      }
      let touchLocationInWorld = touchPosWrtCameraCentreScaledToMapNode.add(cc.v2(self.canvasNode.width / 2, self.canvasNode.height / 2)).add(self.mainCameraNode.position);
      let rect = topEnabledDialog.node.getBoundingBoxToWorld(), touchInside = rect.contains(touchLocationInWorld);
      if (!touchInside && topEnabledDialog.closeSelfOnBlur) {
        topEnabledDialog.onCloseClicked(evt);
      }
      return window.TOUCHED_STOPPED_PROPOGATION;
    }
    
    if (self.isPositioningNewStatefulBuildableInstance()) {
      return window.SINGLE_CLICK_RET_CODE.NOT_TOUCHED_STOPPED_PROPOGATION;
    }
    if (false == self.isPurelyVisual()) {
      if (false == self.isInScouting() && false == self.isEditingExistingStatefulBuildableInstance()) {
        return window.NOT_TOUCHED_STOPPED_PROPOGATION;
      }
    }
    if (null == self.findStatefulBuildableInstanceAtPosition) {
      return window.SINGLE_CLICK_RET_CODE.NOT_TOUCHED_SHOULD_PROPOGATE;
    }
    let targetCpn = self.findStatefulBuildableInstanceAtPosition(touchPosWrtCameraCentreScaledToMapNode);
    if (true == self.isPurelyVisual() || (true == self.isInScouting() && false == self.isEditingExistingStatefulBuildableInstance())) {
      if (null == targetCpn) {
        return window.SINGLE_CLICK_RET_CODE.NOT_TOUCHED_SHOULD_PROPOGATE;
      }
      self.onStatefulBuildableInstanceClicked(targetCpn.node, targetCpn);
      return window.SINGLE_CLICK_RET_CODE.TOUCHED_STOPPED_PROPOGATION;
    } else if (self.isEditingExistingStatefulBuildableInstance()) {
      const isEditingStatefulBuildableInstanceClicked = (
                                                          (targetCpn == self.editingStatefulBuildableInstance) 
                                                          || 
                                                          (targetCpn == self.phantomEditingStatefulBuildableInstance)
                                                        );
      if (targetCpn == null || isEditingStatefulBuildableInstanceClicked) {
        if (self.isHighlightingStatefulBuildableInstanceInBarriers()) {
          self.endPositioningStatefulBuildableInstance(false);
        } else {
          self.endPositioningStatefulBuildableInstance(true);
        } 
      } else if (!isEditingStatefulBuildableInstanceClicked) {
        self.endPositioningStatefulBuildableInstance(false);
        mapIns.onStatefulBuildableInstanceClicked(targetCpn.node, targetCpn);
      }
      return window.SINGLE_CLICK_RET_CODE.TOUCHED_STOPPED_PROPOGATION;
    } else {
      return window.SINGLE_CLICK_RET_CODE.NOT_TOUCHED_SHOULD_PROPOGATE;
    }
  },

  onCancelBuildButtonClicked(evt) {
    const self = this;
    if (null != evt) {
      self.playEffectCommonButtonClick();
    }
    self.endPositioningStatefulBuildableInstance(false);
  },

  onConfirmBuildButtonClicked(evt) {
    const self = this;
    if (null != evt) {
      self.playEffectCommonButtonClick();
    }
    if (self.isHighlightingStatefulBuildableInstanceInBarriers()) {
      console.warn("碰到barriers了。");
      return false;
    }

    self.endPositioningStatefulBuildableInstance(true);
    return true;
  },

  onHQProductionButtonClicked(evt) {
    const self = this;
    if (null != evt) {
      self.playEffectCommonButtonClick();
    }
    let panelName = "ProduceWithIngredientProgressListPanel";
    if (self.viewingPanelManager.hasPanel(panelName)) {
      cc.warn('Already existing a same panel:', panelName);
      return false;
    }
    const hqProductionPanelNode = self.produceWithIngredientProgressListPanelNode || cc.instantiate(self.produceWithIngredientProgressListPanelPrefab);
    const statefulBuildableInstance = self.editingStatefulBuildableInstance;
    self.produceWithIngredientProgressListPanelNode = hqProductionPanelNode;
    self.refreshStatefulBuildableController();
    const produceWithIngredientProgressListPanelIns = hqProductionPanelNode.getComponent(panelName);
    self.produceWithIngredientProgressListPanelIns = produceWithIngredientProgressListPanelIns;
    produceWithIngredientProgressListPanelIns.onCloseDelegate = () => {
      let ingredientProgressList = produceWithIngredientProgressListPanelIns.ingredientProgressList.data;
      self.refreshIngredientProgressListEntry(statefulBuildableInstance, ingredientProgressList);
      let statefulBuildableIngredientProgressListEntryIns = statefulBuildableInstance.statefulBuildableIngredientProgressListEntryIns;
      if (null != statefulBuildableIngredientProgressListEntryIns) {
        statefulBuildableIngredientProgressListEntryIns.autoRefreshEnabled = true;
      }
      self.exitPanelView(produceWithIngredientProgressListPanelIns);
    };
    produceWithIngredientProgressListPanelIns.closeSelfOnBlur = true;
     // set panel's defaultActionsEnabled to false [begins].
    produceWithIngredientProgressListPanelIns.defaultActionsEnabled = false;
    // set panel's defaultActionsEnabled to false [ends].
    produceWithIngredientProgressListPanelIns.fixed = false;
    produceWithIngredientProgressListPanelIns.init(self, statefulBuildableInstance);
    produceWithIngredientProgressListPanelIns.queryIngredientList();
    produceWithIngredientProgressListPanelIns.resizeNode();
    let stageProducibleIngredientList = self.getProducibleIngredientList();
    produceWithIngredientProgressListPanelIns.setData(stageProducibleIngredientList, []);
    self.enterPanelView(produceWithIngredientProgressListPanelIns);
    produceWithIngredientProgressListPanelIns.refresh();
    produceWithIngredientProgressListPanelIns.onRefresh = function(ingredientList, ingredientProgressList) {
      self.refreshIngredientProgressListEntry(statefulBuildableInstance, ingredientProgressList);
      let statefulBuildableIngredientProgressListEntryIns = statefulBuildableInstance.statefulBuildableIngredientProgressListEntryIns;
      if (null != statefulBuildableIngredientProgressListEntryIns) {
        statefulBuildableIngredientProgressListEntryIns.autoRefreshEnabled = false;
        statefulBuildableIngredientProgressListEntryIns.hide();
      }
    };
  },

  onStatefulBuildableInstanceClicked(statefulBuildableInstanceNode, statefulBuildableInstance) {
    const self = this;
    if ((false == self.isPurelyVisual() && false == self.isInScouting())
      || (
      window.STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE != statefulBuildableInstance.state
      && window.STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING != statefulBuildableInstance.state
      && window.STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING != statefulBuildableInstance.state
      )) {
      return;
    }
    self.startPositioningExistingStatefulBuildableInstance(statefulBuildableInstance);
  },

  onBuildButtonClicked(evt) {
    const self = this;
    if (null != evt) {
      self.playEffectCommonButtonClick();
    }
    if (self.isShowingModalPopup()) {
      return;
    }
    self.statelessBuildableInstanceCardListScriptIns.refreshDynamicGUI();
    self.enterPanelView(self.statelessBuildableInstanceCardListScriptIns);
    if (this.widgetsAboveAllScriptIns.walletInfo.goldTip.active == true) {
      window.removeCurrentlyShowingQuantityLimitPopup();
    }
  },

  refreshStatelessBuildableInstances(allStatelessBuildableInstances, ownedStatefulBuildableInstances) {
    this.statelessBuildableInstanceList = [];
    for (let k in allStatelessBuildableInstances) {
      const singleStatelessBuildableInstance = allStatelessBuildableInstances[k]; 
      const statelessBuildableInstanceScriptIns = new StatelessBuildableInstance();
      const theAtlas = this.getStatelessBuildableInstanceSpriteAtlas(singleStatelessBuildableInstance);
      if (theAtlas) {
        statelessBuildableInstanceScriptIns.init(this, singleStatelessBuildableInstance, theAtlas);
        this.statelessBuildableInstanceList.push(statelessBuildableInstanceScriptIns);
      } else {
        cc.warn(`Cannot find corresponding StatelessBuildableInstanceSpriteAtlas for : ${singleStatelessBuildableInstance.displayName}`);
      }
    }
  },

  refreshStatelessBuildableInstanceCardListDisplay(toIgnoreBuildableIds) {
    const self = this;
    if (null == self.statelessBuildableInstanceCardListScriptIns) {
      console.warn("You're calling `BuildableMap.refreshStatelessBuildableInstanceCardListDisplay` with `null == self.statelessBuildableInstanceCardListScriptIns`, if this is NOT in TowerSiege mode, then you should check whether a bug is to be tackled!");
      return;
    }
    const existedHeadquarterList = self.getStatefulBuildableInstanceListByBuildableId(constants.STATELESS_BUILDABLE_ID.HEADQUARTER);
    const statelessBuildableInstanceList = self.statelessBuildableInstanceList.filter(function(singleStatelessBuildableInstance) {
      if (null != toIgnoreBuildableIds && toIgnoreBuildableIds.includes(singleStatelessBuildableInstance.id)) {
        return false;
      }
      if (existedHeadquarterList.length >= 1) {
        return singleStatelessBuildableInstance.id != constants.STATELESS_BUILDABLE_ID.HEADQUARTER;
      } else {
        return true;
      }
    });

    self.statelessBuildableInstanceCardListScriptIns.refreshStatelessBuildableInstanceCardListNode(self, statelessBuildableInstanceList, null);
    self.statelessBuildableInstanceCardListScriptIns.scrollView._aligned = false;
  },

  sendPlayerKnapsackQuery(callbackAnyway) {
    const self = this;

    let url = backendAddress.PROTOCOL + "://" + backendAddress.HOST + ":" + backendAddress.PORT + constants.ROUTE_PATH.API + constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.KNAPSACK + constants.ROUTE_PATH.QUERY;
    let data = {
      intAuthToken: JSON.parse(cc.sys.localStorage.getItem("selfPlayer")).intAuthToken,
      reqSeqNum: Date.now()
    };
    NetworkUtils.ajax({
      url, data, type: 'POST',
      success: (resp) => {
        if (constants.RET_CODE.OK != resp.ret) {
          console.warn(`Query knapsack list fails and ret == ${resp.ret}`)
          if (constants.RET_CODE.INVALID_TOKEN == resp.ret) {
            window.handleTokenExpired(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
            return;
          }
          callbackAnyway && callbackAnyway(new Error(resp.ret));
          return;
        }
        self.refreshKnapsackArray(resp.knapsack);
        callbackAnyway && callbackAnyway();
      },
      error: (err) => {
        console.warn(`Error occurred when querying knapsack list`)
        callbackAnyway && callbackAnyway(err);
        if (window.handleNetworkDisconnected) {
          window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
        }
        return;
      },
      timeout: () => {
        console.warn(`Timed out when querying knapsack list`)
        callbackAnyway && callbackAnyway(new Error(constants.NETWORK.ERROR.TIMEOUT));
        if (window.handleNetworkDisconnected) {
          window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
        }
        return;
      },
    })

  },
  initPlayerRecipe(playerRecipeArray) {
    const self = this; 
    playerRecipeArray = playerRecipeArray || [];
    self.initHqRecipeArray(playerRecipeArray.filter(
      (playerRecipeItem) => {
        /*
         * for hqRecipe, only state == UNLOCKED means that the targetIngredient can be produced in headquarter.
         */
        return (null == playerRecipeItem.recipeId || 0 == playerRecipeItem.recipeId) &&
          playerRecipeItem.state == constants.RECIPE.STATE.UNLOCKED;
      }
    ));

    self.initRecipeArray(playerRecipeArray.filter(
      (playerRecipeItem) => {
        return (null != playerRecipeItem.recipeId && 0 != playerRecipeItem.recipeId);
      }
    ));
  },

  refreshPlayerRecipe(playerRecipeArray) {
    const self = this;
    playerRecipeArray = playerRecipeArray || [];
    self.refreshHqRecipeArray(playerRecipeArray.filter(
      (playerRecipeItem) => {
        /*
         * for hqRecipe, only state == UNLOCKED means that the targetIngredient can be produced in headquarter.
         */
        return (null == playerRecipeItem.recipeId || 0 == playerRecipeItem.recipeId) &&
          playerRecipeItem.state == constants.RECIPE.STATE.UNLOCKED;
      }
    ));

    self.refreshRecipeArray(playerRecipeArray.filter(
      (playerRecipeItem) => {
        return (null != playerRecipeItem.recipeId && 0 != playerRecipeItem.recipeId);
      }
    ));
  },

  // Handling "soldier" ingredients. [begins]
  initSoldierIngredientItem(singleSoldier) {
    /*
    [WARNING]
  
    Deliberately calling just "initIngredientItem".
  
    -- YFLu, 2019-10-28.
    */
    if (null == singleSoldier || null == singleSoldier.ingredient) {
      console.warn("BuildableMap.initSoldierIngredientItem having an invalid singleSoldier == ", singleSoldier);
      return; 
    }
    this.initIngredientItem(singleSoldier.ingredient);
  },

  initSoldierArray(soldierArray) {
    const self = this;
    self.soldierArray = soldierArray || [];
    self.soldierArray.forEach((singleSoldier) => {
      self.initSoldierIngredientItem(singleSoldier);
    });
  },

  refreshSoldierArray(soldierArray) {
    const self = this;
    self.soldierArray = soldierArray || [];
    self.soldierArray.forEach((singleSoldier) => {
      self.initSoldierIngredientItem(singleSoldier);
    });

    if (null != self.barrackPanelIns) {
      self.barrackPanelIns.soldierKnapsack.setData(self.soldierArray);
      self.barrackPanelIns.refreshKnapsacks();;
    }
  },

  // Handling "soldier" ingredients. [ends]

  // Handling "tech" ingredients. [begins]
  initTechIngredientItem(singleTech) {
    if (null == singleTech || null == singleTech.ingredient) {
      console.warn("BuildableMap.singleTech having an invalid singleTech == ", singleTech);
      return; 
    }
    this.initIngredientItem(singleTech.ingredient);
    const battleBuffer = window.techToBattleBuff(singleTech.ingredient.id);
    if (null == battleBuffer) return;
    if (true != battleBuffer.isPersistent) {
      // Not considering volatile battle buffers here. -- YFLu, 2019-11-14.
      return;
    }
    switch (battleBuffer.targetResourceType) {
    case constants.RESOURCE_TYPE.SOLDIER_INGREDIENT_ID:
    self.persistentSoliderBattleBuffDict[singleTech.ingredient.id] = battleBuffer;
    break;
    default:
    break;
    }
  },

  initTechArray(techArray) {
    const self = this;
    self.techArray = techArray || [];
    self.techArray.forEach((singleTech) => {
      self.initTechIngredientItem(singleTech);
    });
  },

  refreshTechArray(techArray) {
    const self = this;
    self.techArray = techArray || [];
    self.techArray.forEach((singleTech) => {
      self.initTechIngredientItem(singleTech); 
    });
  },
  // Handling "tech" ingredients. [ends]

  initKnapsackArray(knapsackArrayFromBackend) {
    const self = this;
    knapsackArrayFromBackend = knapsackArrayFromBackend || [];
    let extractedSoldierArray = [];
    let extractedTechArray = [];
    let clonedKnapsackArray = knapsackArrayFromBackend.slice();
    for (let k in clonedKnapsackArray) {
      const item = clonedKnapsackArray[k]; 
      if (item.ingredient.category == constants.INGREDIENT.CATEGORY.SOLDIER) {
        extractedSoldierArray.push(item);
        knapsackArrayFromBackend.splice(knapsackArrayFromBackend.indexOf(item), 1);
      }
      if (item.ingredient.category == constants.INGREDIENT.CATEGORY.TECH) {
        extractedTechArray.push(item);
        knapsackArrayFromBackend.splice(knapsackArrayFromBackend.indexOf(item), 1); 
      }
    }
    self.initSoldierArray(extractedSoldierArray);
    self.initTechArray(extractedTechArray);

    self.knapsackArray = knapsackArrayFromBackend;
    self.knapsackArray.forEach((knapsackItem) => {
      self.initKnapsackItem(knapsackItem);
    });
  },

  refreshKnapsackArray(knapsackArrayFromBackend) {
    const self = this;
    knapsackArrayFromBackend = knapsackArrayFromBackend || [];
    let extractedSoldierArray = [];
    let extractedTechArray = [];
    let clonedKnapsackArray = knapsackArrayFromBackend.slice();
    for (let k in clonedKnapsackArray) {
      const item = clonedKnapsackArray[k]; 
      if (item.ingredient.category == constants.INGREDIENT.CATEGORY.SOLDIER) {
        extractedSoldierArray.push(item);
        knapsackArrayFromBackend.splice(knapsackArrayFromBackend.indexOf(item), 1);
      }
      if (item.ingredient.category == constants.INGREDIENT.CATEGORY.TECH) {
        extractedTechArray.push(item);
        knapsackArrayFromBackend.splice(knapsackArrayFromBackend.indexOf(item), 1);
      }
    }
    self.refreshSoldierArray(extractedSoldierArray);
    self.refreshTechArray(extractedTechArray);

    self.knapsackArray = knapsackArrayFromBackend;
    self.knapsackArray.forEach((knapsackItem) => {
      self.initKnapsackItem(knapsackItem);
    });
    // The knapsack data may be modified, thus refresh the auto-orders' state.

    if (null != self.floatingKnapsackPanelIns) {
      self.floatingKnapsackPanelIns.setData(self.knapsackArray);
      self.floatingKnapsackPanelIns.refresh();
    }
    if (null != self.craftingSystemPanelIns) {
       self.craftingSystemPanelIns.setData(self.getCraftableKnapsackArray());
       self.craftingSystemPanelIns.refreshKnapsackOnly();
    }
  },

  initRecipeArray(recipeArray) {
    const self = this;
    self.recipeArray = recipeArray || [];
    self.recipeArray.forEach((playerRecipeItem) => {
      self.initPlayerRecipeItem(playerRecipeItem);
    });
  },

  initHqRecipeArray(recipeArray) {
    const self = this;
    self.hqRecipeArray = recipeArray || [];
    self.hqRecipeArray.forEach((hqRecipeItem) => {
      self.initPlayerRecipeItem(hqRecipeItem);
    });
  },

  refreshRecipeArray(recipeArray) {
    const self = this;
    self.recipeArray = recipeArray || [];
    self.recipeArray.forEach((playerRecipeItem) => {
      self.initPlayerRecipeItem(playerRecipeItem);
    });
  },

  refreshHqRecipeArray(recipeArray) {
    const self = this;
    self.hqRecipeArray = recipeArray || [];
    self.hqRecipeArray.forEach((hqRecipeItem) => {
      self.initPlayerRecipeItem(hqRecipeItem);
    });
  },

  initKnapsackItem(knapsackItem) {
    const self = this;
    self.initIngredientItem(knapsackItem.ingredient);
  },

  initPlayerRecipeItem(playerRecipeItem) {
    const self = this;
    if (null != playerRecipeItem.targetIngredient) {
      self.initIngredientItem(playerRecipeItem.targetIngredient);
    } else {
      if (null != playerRecipeItem.targetIngredientList) {
        playerRecipeItem.targetIngredientList.forEach(function(targetIngredient) {
          self.initIngredientItem(targetIngredient);
        });
      }
    }
    if (null != playerRecipeItem.recipeIngredientBindingList) {
      playerRecipeItem.consumables = playerRecipeItem.recipeIngredientBindingList.filter(function(recipeIngredientBinding) {
        return "" == recipeIngredientBinding.prependedBinocularOperator ||
          constants.RECIPE.PREPENDED_BINOCULAR_OPERATOR.CONSUMABLE == recipeIngredientBinding.prependedBinocularOperator;
      });
    }
    
    if (null != playerRecipeItem.recipeId && 0 != playerRecipeItem.recipeId) {
      playerRecipeItem.recipe.consumables = playerRecipeItem.consumables || [];
      playerRecipeItem.recipe.targetIngredient = playerRecipeItem.targetIngredient;
      playerRecipeItem.recipe.targetIngredientList = playerRecipeItem.targetIngredientList;

    }
  },

  initIngredientItem(ingredient) {
    const self = this;
    if (null == ingredient) {
      return;
    }
    ingredient.appearance = self.getIngredientAppearance(ingredient.id);
    self.ingredientMap[ingredient.id] = ingredient;
  },

  saveAllPlayerSyncData(onSuccessCbForUpsyncRequest, callbackAnyway) {
    const self = this;
    if (!cc.isValid(self.node)) {
      // 防止节点销毁后依旧执行
      return;
    }
    /*
    * Deliberately wrapped in a "try ... catch ..." block to prevent any exception thrown within this method 
    * from interrupting the execution of current "JsAsyncTask".
    *
    * --YFLu
    */
    try {
      if (true == self.upsyncLocked) {
        console.warn("BuildableMap.upsyncLocked when executing `BuildableMap.saveAllPlayerSyncData`.");
        return;
      }
      self.saveIntoLocalStorage();

      const selfPlayerStr = cc.sys.localStorage.getItem("selfPlayer");
      if (null == selfPlayerStr) {
        if (window.handleNetworkDisconnected) {
          window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
        }
        return;
      } 
      
      let selfPlayer = null; 
      try {
        selfPlayer = JSON.parse(selfPlayerStr);
      } catch (e) {
        if (window.handleNetworkDisconnected) {
          window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
        }
      }

      // 请求后端同步数据 [begins].
      const queryParam = {
        intAuthToken: selfPlayer.intAuthToken,
        syncData: window.pbEncodeData(window.syncDataStruct, {
          playerBuildableBindingList: self.statefulBuildableInstanceList,
          wallet: self.wallet,
          tutorialStage: self.currentTutorialStage,
          questCompletedMap: self.questCompletedMap,
          accumulatedResource: self.accumulatedResource,
        }),
        stage: null == self.currentStageId ? 0 : self.currentStageId,
        interruptTutorialMask: null == self.interruptTutorialMask ? "" : window.pbEncodeData(window.interruptTutorialMaskStruct, self.interruptTutorialMask),
        diamond: null == self.wallet.diamond ? 0 : self.wallet.diamond,
        toClaimIngredientProgressList: JSON.stringify(self.toReclaimIngredientProgressIdList),
        toClaimPlayerMissionBindingList: JSON.stringify(self.toClaimPlayerMissionBindingIdList),
      };
      self._sendPlayerSyncDataUpsync(queryParam, onSuccessCbForUpsyncRequest, callbackAnyway);
      // 请求后端同步数据 [ends].
    } catch (e) {
      console.warn("Error occurred when calling `BuildableMap.saveAllPlayerSyncData`", e);
    }
  },

  _sendPlayerSyncDataUpsync(queryParam, callback, callbackAnyway) {
    const self = this;

    self.latestSyncDataReqSeqNum = Date.now();

    queryParam.reqSeqNum = self.latestSyncDataReqSeqNum;

    NetworkUtils.ajax({
      url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + ':' + backendAddress.PORT + constants.ROUTE_PATH.API +
        constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.MYSQL + constants.ROUTE_PATH.SYNCDATA + constants.ROUTE_PATH.UPSYNC,
      type: 'POST',
      data: queryParam,
      success: function(res) {
        if (!cc.isValid(self.node)) {
          // 防止节点销毁后依旧执行
          return;
        }
        callbackAnyway && callbackAnyway(null, res);
        if (constants.RET_CODE.OK != res.ret) {
          console.warn("_sendPlayerSyncDataUpsync fails and ret == ", res.ret);
          if (constants.RET_CODE.INVALID_TOKEN == res.ret) {
            if (window.handleTokenExpired) {
              window.handleTokenExpired(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
            }
          } else {
            if (window.handleNetworkDisconnected) {
              window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
            }   
          }
          return;
        }

        // To handle newlyReclaimedIngredientProgressList. [begin]
        if (null != res.newlyClaimedIngredientProgressList && res.newlyClaimedIngredientProgressList.length > 0) {
          res.newlyClaimedIngredientProgressList.forEach(function(ingredientProgressId) {
            let existingToReclaimIngredientProgressIdK = self.toReclaimIngredientProgressIdList.indexOf(ingredientProgressId);
            if (-1 != existingToReclaimIngredientProgressIdK) {
              self.toReclaimIngredientProgressIdList.splice(existingToReclaimIngredientProgressIdK, 1);
            }
          });
          for (let statefulBuildableInstance of self.statefulBuildableInstanceCompList) {
            if (
              null == statefulBuildableInstance.statefulBuildableIngredientProgressListEntryIns
              ||
              statefulBuildableInstance.id != constants.STATELESS_BUILDABLE_ID.RESTAURANT
            ) {
              continue; 
            }
            let newlyReclaimedIngredientProgressList = [],
                statefulBuildableIngredientProgressListEntryIns = statefulBuildableInstance.statefulBuildableIngredientProgressListEntryIns,
                modified = false;
            for (let k in statefulBuildableIngredientProgressListEntryIns.data) {
              const ingredientProgress = statefulBuildableIngredientProgressListEntryIns.data[k];
              if (-1 == res.newlyClaimedIngredientProgressList.indexOf(ingredientProgress.id)) {
                newlyReclaimedIngredientProgressList.push(ingredientProgress);
              } else {
                modified = true;
              }
            }
            if (modified) {
              self.refreshIngredientProgressListEntry(statefulBuildableInstance, newlyReclaimedIngredientProgressList);
              if (null != statefulBuildableIngredientProgressListEntryIns.ingredientProgressListPanelIns) {
                statefulBuildableIngredientProgressListEntryIns.ingredientProgressListPanelIns.setData(newlyReclaimedIngredientProgressList);
                statefulBuildableIngredientProgressListEntryIns.ingredientProgressListPanelIns.refresh();
              }
            }
          }
        }
        // To handle newlyReclaimedIngredientProgressList. [end]

        // To handle newlyClaimedPlayerMissionBindingList. [begin]
        if (null != res.newlyClaimedPlayerMissionBindingList && res.newlyClaimedPlayerMissionBindingList.length > 0) {
          res.newlyClaimedPlayerMissionBindingList.forEach(function(id) {
            let targetPlayerMissionBinding = self.playerMissionBindingMap[id];
            if (null != targetPlayerMissionBinding) {
              targetPlayerMissionBinding.state = constants.MISSION_STATE.CLAIMED_IN_UPSYNC;
            }
            let index = self.toClaimPlayerMissionBindingIdList.indexOf(id);
            if (index != -1) {
              self.toClaimPlayerMissionBindingIdList.splice(index, 1);
            }
          });
          self.refreshGlobalMissionGUI();
        }
        // To handle newlyClaimedPlayerMissionBindingList. [end]

        // Warning: the shouldRefreshMissionList are take as true temporarily.
        if (res.shouldRefreshMissionList || true) {
          self.getMissionList(function(res, shouldRefreshMissionGUI) {
            if (!shouldRefreshMissionGUI) {
              return;
            }
            self.refreshGlobalMissionGUI(); 
          });
        }

        if (res.reqSeqNum < self.latestSyncDataReqSeqNum) {
          cc.warn(`there has a fresh ajax at ${self.latestSyncDataReqSeqNum}, thus this ajax(${res.reqSeqNum}) should be ignored`);
          return;
        } else {
          self.latestSyncDataReqSeqNum = res.reqSeqNum;
          // self.refreshKnapsackArray(res.knapsack);
          self.refreshPlayerRecipe(res.playerRecipeList);

          cc.log(`sendPlayerDataUpsync request at ${res.reqSeqNum}, response at ${Date.now()}`);

          if (null != res.announcement) {
            self.announcementData = JSON.parse(res.announcement);
            self.refreshAnnouncementButton();
          }

          callback && callback(res);
        }
      }, 
      error: function(err) {
        console.error(err);
        if (null != window.handleNetworkDisconnected) {
          window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
        }
        callbackAnyway && callbackAnyway(err);
      }, 
      timeout: function() {
        if (null != window.handleNetworkDisconnected) {
          window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
        }
        callbackAnyway && callbackAnyway(new Error(constants.NETWORK.ERROR.TIMEOUT));
      }
    });
  },

  printProduct: function(p) {
    console.log("======The product info======");
    console.log("productIdentifier=", p.productIdentifier);
    console.log("title=", p.title);
    console.log("price=", p.price);
    console.log("");
  },

  initAfterAllTutorialStages() {
    NarrativeSceneManagerDelegate.prototype.initAfterAllTutorialStages.call(this);
    const self = this;
    const mapScriptIns = self;
    const mapNode = self.node;
    const canvasNode = mapNode.parent;
    const selfPlayer = JSON.parse(cc.sys.localStorage.getItem("selfPlayer"));
    
    // To active node upon widgetsAboveAllNode.
    self.widgetsAboveAllScriptIns.walletInfo.node.active = true;
    self.widgetsAboveAllScriptIns.sideButtonGroupNode.active = true;

    //初始化IAP相关方法 [begins]
    const APPLE_IAP_TRX_STATE_PURCHASING = 0;
    const APPLE_IAP_TRX_STATE_PURCHASED = 1;
    window.onIapSkuListObtained = (productInfoList) => {
      if (null == productInfoList) return;
      cc.log("Js called back by CPP (overridden): onProductRequestSuccess with productInfoList:", productInfoList);
      if (!CuisineMaster || !CuisineMaster.Iap) return;
      if (!self.addShowingModalPopup()) return;
      self.closeableWaitingShadowNode.removeFromParent();
      self.iapItemPanelScriptIns.setIapItems(productInfoList);
      safelyAddChild(self.widgetsAboveAllNode, self.iapItemPanelNode);
      for (let i = 0; i < productInfoList.length; ++i) {
        const productInfo = productInfoList[i];
        if (null == productInfo) continue;
        if (null == productInfo.title || "" == productInfo.title) {
          // A dirty fix to wipe out unexpected items configured by sdkbox defaults.
          continue;
        }
        self.printProduct(productInfo);
      }
    };

    //订单状态改变通知
    window.onIapTransactionsStateUpdated = (trxObj) => {
      cc.log(`onIapTransactionsStateUpdated ${JSON.stringify(trxObj)}`);
      if (!CuisineMaster || !CuisineMaster.Iap) return;
      const transactions = trxObj.UpdatedTransactions;
      if (transactions.length > 0) {
        // TODO: Submit the receipt to API "PlayerIapDarwinMobileReceiptSubmit -> PlayerSyncDataUpsync" and reacts correspondingly.
        for (let trx of transactions) {
          if (trx.transactionState == APPLE_IAP_TRX_STATE_PURCHASED) {
            console.log("onIapTransactionsStateUpdated, found unfinished trx:", trx, ", finishing it and adding diamonds");
            self._handleUnfinishedAppleIapTransaction(trx);
          }
        }
      }

      self.fullscreenIapPurchasingShadowNode.active = false;
      self.removeInIapWaiting();
    }

    window.onIapTransactionsRemoved = (trxObj) => {
      cc.log(`onIapTransactionsRemoved ${trxObj}`);
      if (!CuisineMaster || !CuisineMaster.Iap) return;
      const transactions = trxObj.RemovedTransactions;
      for (let trx of transactions) {
        CuisineMaster.Iap.finish_transaction(JSON.stringify(trx.transactionIdentifier));
      }
    }

    window.onIapUnfinishedTransactionsObtained = (trxObj) => {
      // TODO: Submit the receipt to API "PlayerIapDarwinMobileReceiptSubmit -> PlayerSyncDataUpsync" and reacts correspondingly.
      console.log("onIapUnfinishedTransactionsObtained with UnfinishedTransactions ", trxObj);
      if (!CuisineMaster || !CuisineMaster.Iap) return;
      const transactions = trxObj.UnfinishedTransactions;
      for (let trx of transactions) {
        if (trx.transactionState == APPLE_IAP_TRX_STATE_PURCHASED) {
          console.log("onIapUnfinishedTransactionsObtained, found unfinished trx:", trx, ", finishing it and adding diamonds accordingly");
          self._handleUnfinishedAppleIapTransaction(trx);
        }
      }
    };
    //初始化IAP相关方法 [ends]

    self.spawnOrRefreshStatefulBuildableFollowingNpcs();
    self.refreshPopupEntry();
    self.refreshLockedButtonByBuildable();
    self.setSideButtonGroupActive(true);
    self.refreshBuildButtonCountTip();

    if (null == self.actionableInterval) {
      self.actionableInterval = setInterval(() => {
        self.refreshActionableDict();
      }, 1000); 
    }
  },

  _findStatelessBuildableInstance(fromPlayerBuildableBinding) {
    const self = this;
    for (let i in self.statelessBuildableInstanceList) {
      const singleStatelessBuildableInstance = self.statelessBuildableInstanceList[i];
      if (fromPlayerBuildableBinding.buildable.id != singleStatelessBuildableInstance.id) {
        continue;
      }
      return singleStatelessBuildableInstance;
    }
    return null;
  },

  transitBuildableLevelBindingConfToStatelessBuildbaleInstances(buildableLevelConfList) {
    const AllStatelessBuildableInstances = [];
    for (let i in buildableLevelConfList) {
      let isPushedBuildable = false;
      const singleBuildableLevelBinding = buildableLevelConfList[i];
      if (null == singleBuildableLevelBinding.buildable) {
        singleBuildableLevelBinding.buildable = this.buildableDict[singleBuildableLevelBinding.buildableId];
      } 
      for (let i in AllStatelessBuildableInstances) {
        const pushedStatelessBuildable = AllStatelessBuildableInstances[i];
        if (pushedStatelessBuildable.id == singleBuildableLevelBinding.buildable.id) {
          if (!pushedStatelessBuildable.levelConfs) {
            pushedStatelessBuildable.levelConfs = [];
          }
          pushedStatelessBuildable.levelConfs.push(singleBuildableLevelBinding);
          isPushedBuildable = true;
          break;
        }
      }
      if (!isPushedBuildable) {
        //TODO hardcoded for now.可以遍历singleBuildableLevelBinding.key来构造buildableLevelBinding.
        const buildableLevelBinding = {
          id: singleBuildableLevelBinding.buildable.id,
          type: singleBuildableLevelBinding.buildable.type,
          discreteWidth: singleBuildableLevelBinding.buildable.discreteWidth,
          discreteHeight: singleBuildableLevelBinding.buildable.discreteHeight,
          displayName: singleBuildableLevelBinding.buildable.displayName,
          autoCollect: singleBuildableLevelBinding.buildable.autoCollect,
        }
        buildableLevelBinding.levelConfs = [];
        buildableLevelBinding.levelConfs.push(singleBuildableLevelBinding);
        AllStatelessBuildableInstances.push(buildableLevelBinding);
      }
    }

    // Sort allStatelessBuildableInstances according to STATELESS_BUILDABLE_INSTANCE_CARD_ORDER. [begin] 
    AllStatelessBuildableInstances.sort(function(statelessBuildableInstance1, statelessBuildableInstance2) {
      let order1, order2;
      for (let key in constants.STATELESS_BUILDABLE_ID) {
        if (constants.STATELESS_BUILDABLE_ID[key] == statelessBuildableInstance1.id) {
          order1 = constants.STATELESS_BUILDABLE_INSTANCE_CARD_ORDER[key];
        }
        if (constants.STATELESS_BUILDABLE_ID[key] == statelessBuildableInstance2.id) {
          order2 = constants.STATELESS_BUILDABLE_INSTANCE_CARD_ORDER[key];
        }
      } 
      return order1 - order2;
    });
    // Sort allStatelessBuildableInstances according to STATELESS_BUILDABLE_INSTANCE_CARD_ORDER. [end] 

    return AllStatelessBuildableInstances;
  },

  enterPanelView(targetPanel) {
    const self = this;
    
    if (null == self.commonMaskNode && null != self.commonMaskPrefab) {
      self.commonMaskNode = cc.instantiate(self.commonMaskPrefab);
      safelyAddChild(self.widgetsAboveAllNode, self.commonMaskNode);
      setLocalZOrder(self.commonMaskNode, CORE_LAYER_Z_INDEX.DIALOG_MASK);
    }

    if (self.viewingPanelManager.hasPanel(targetPanel.node.name) && self.viewingPanelManager.indexOf(targetPanel) == -1) {
      console.warn('Duplicated panel:', targetPanel.node.name);
    }

    const timerDict = {
      total: 0,
      hideSideButtonGroup: 0,
      hideOtherPanels: 0,
      targetPanelShow: 0,
      targetPanelNodeActivate: 0,
      targetPanelAddToWidgetsAboveAll: 0,
      targetPanelSetLocalZOrder: 0,
    };

    const t1 = Date.now();
    self.setSideButtonGroupActive(false);
    const t2 = Date.now();
    timerDict.hideSideButtonGroup = (t2 - t1);
    if (self.viewingPanelManager.length) {
      // has some panel viewing already
      let index = self.viewingPanelManager.indexOf(targetPanel),
        len = self.viewingPanelManager.length;
      let viewingPanel = self.viewingPanelManager[len-1];
      if (!viewingPanel.fixed && !viewingPanel.doNotRemove) {
        viewingPanel.node.active = false;
      } else if (!viewingPanel.fixed && viewingPanel.doNotRemove) {
        viewingPanel.hide();
      }
      const t3 = Date.now();
      timerDict.hideOtherPanels = (t3 - t2);
      if (index == -1) {
        // push the targetPanel into top of the stack
        self.viewingPanelManager.push(targetPanel);
        window.safelyAddChild(self.widgetsAboveAllNode, targetPanel.node);
        const t4 = Date.now();
        timerDict.targetPanelAddToWidgetsAboveAll = (t4 - t3);
        setLocalZOrder(targetPanel.node, window.CORE_LAYER_Z_INDEX.DIALOG);
        const t5 = Date.now();
        timerDict.targetPanelSetLocalZOrder = (t5 - t4);
      } else if (index != self.viewingPanelManager.length - 1) {
        // move the targetPanel into top of the stack
        self.viewingPanelManager.push(
          self.viewingPanelManager.splice(index, 1)[0]
        );
      } else {
        // the targetPanel already at the top of the stack
      }
      if (targetPanel.doNotRemove) {
        targetPanel.show();
        timerDict.targetPanelShow = (Date.now() - t3);
      } else {
        targetPanel.node.active = true;
        timerDict.targetPanelNodeActivate = (Date.now() - t3);
      }

      if (null != self.commonMaskNode) {
        self.commonMaskNode.active = targetPanel.withMask;
      }

      timerDict.total = (Date.now() - t1);
      return false;
    }

    const t4 = Date.now();
    self.addShowingModalPopup();
    if (targetPanel.doNotRemove) {
      targetPanel.show();
      timerDict.targetPanelShow = (Date.now() - t4);
    } else {
      targetPanel.node.active = true;
      timerDict.targetPanelNodeActivate = (Date.now() - t4);
    }
    self.viewingPanelManager.push(targetPanel);
    if (null != self.commonMaskNode) {
      self.commonMaskNode.active = targetPanel.withMask;
    }
      
    const t5 = Date.now();
    window.safelyAddChild(self.widgetsAboveAllNode, targetPanel.node);
    const t6 = Date.now();
    timerDict.targetPanelAddToWidgetsAboveAll = (t6 - t5);
    setLocalZOrder(targetPanel.node, window.CORE_LAYER_Z_INDEX.DIALOG);
    const t7 = Date.now();
    timerDict.targetPanelSetLocalZOrder = (t7 - t6);

    timerDict.total = (t7 - t1);

    cc.log("Enter panel:", targetPanel.node.name, ", timerDict == ", timerDict);
    
    self.statefulBuildableController.active = false;

    const statefulBuildableInstance = self.editingStatefulBuildableInstance;
    if (!statefulBuildableInstance) {
      return true;
    }
    
    switch (statefulBuildableInstance.state) {
      case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_NEW:
        self.removePositioningNewStatefulBuildableInstance();
        statefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_NEW, statefulBuildableInstance.fixedSpriteCentreContinuousPos, statefulBuildableInstance.currentLevel, statefulBuildableInstance.buildingOrUpgradingStartedAt);
        break;
      case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING:
        self.removeEditingExistingStatefulBuildableInstance();
        statefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL, statefulBuildableInstance.fixedSpriteCentreContinuousPos, statefulBuildableInstance.currentLevel, statefulBuildableInstance.buildingOrUpgradingStartedAt);
        break;
      case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_BUILDING:
        self.removeEditingExistingStatefulBuildableInstance();
        statefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_BUILDING, statefulBuildableInstance.fixedSpriteCentreContinuousPos, statefulBuildableInstance.currentLevel, statefulBuildableInstance.buildingOrUpgradingStartedAt);
        break;
      case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_UPGRADING:
        self.removeEditingExistingStatefulBuildableInstance();
        statefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_UPGRADING, statefulBuildableInstance.fixedSpriteCentreContinuousPos, statefulBuildableInstance.currentLevel, statefulBuildableInstance.buildingOrUpgradingStartedAt);
        break;
      default:
        cc.warn("Show statefulBuildableInstanceInfoPanelNode not in editing state.")
        break;
    }
    return true;
  },

  exitPanelView(targetPanel) {
    cc.log('exit panel:', targetPanel.node.name);
    // the CloseableDialog will remove dialog from parent automatically
    // thus this place could not to care about remove.
    const self = this;
    const statefulBuildableInstance = self.editingStatefulBuildableInstance;
    // remove the targetPanel from the viewingPanelManager and active
    // the panel which is at the top.
    let index = self.viewingPanelManager.indexOf(targetPanel);
    if (index != -1) {
      if (targetPanel.doNotRemove) {
        targetPanel.hide();
      } else {
        targetPanel.node.active = false;
      }
      self.viewingPanelManager.splice(index, 1);
    } else {
      cc.warn('Call exitPanelView: the panel has already exited.');
      if (null != self.commonMaskNode) {
        self.commonMaskNode.active = false;
      }
      return false;
    }

    if (self.viewingPanelManager.length) {
      let topPanel = self.viewingPanelManager[self.viewingPanelManager.length-1];
      if (topPanel.doNotRemove) {
        topPanel.show();
      } else {
        topPanel.node.active = true;
      }
      if (null != self.commonMaskNode) {
        self.commonMaskNode.active = topPanel.withMask;
      }
      return false;
    }

    self.removeShowingModalPopup();

    if (null != self.commonMaskNode) {
      self.commonMaskNode.active = false;
    }

    
    if (!statefulBuildableInstance) {
      if (self.isPurelyVisual()) {
        self.setSideButtonGroupActive(true);
      }
      return true;
    }
    //重置状态.
    switch (statefulBuildableInstance.state) {
      case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_NEW:
        self.addPositioningNewStatefulBuildableInstance();
        statefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_NEW, statefulBuildableInstance.fixedSpriteCentreContinuousPos, statefulBuildableInstance.currentLevel, statefulBuildableInstance.buildingOrUpgradingStartedAt);
        break;
      case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL:
        self.addEditingExistingStatefulBuildableInstance();
        statefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING, statefulBuildableInstance.fixedSpriteCentreContinuousPos, statefulBuildableInstance.currentLevel, statefulBuildableInstance.buildingOrUpgradingStartedAt);
        break;
      case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_BUILDING:
        self.addEditingExistingStatefulBuildableInstance();
        statefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_BUILDING, statefulBuildableInstance.fixedSpriteCentreContinuousPos, statefulBuildableInstance.currentLevel, statefulBuildableInstance.buildingOrUpgradingStartedAt);
        break;
      case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_UPGRADING:
        self.addEditingExistingStatefulBuildableInstance();
        statefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_UPGRADING, statefulBuildableInstance.fixedSpriteCentreContinuousPos, statefulBuildableInstance.currentLevel, statefulBuildableInstance.buildingOrUpgradingStartedAt);
        break;
      case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_NEW:
        // 新建建筑时调用了关闭self.statelessBuildableInstanceCardListScriptIns.node
        break;
      default:
        cc.warn("Show statefulBuildableInstanceInfoPanelNode not in editing state.")
        break;
    }
    self.refreshStatefulBuildableController();
    return true;
  },

  onStatefulBuildableInstanceInfoButtonClicked(evt) {
    const self = this;
    if (null != evt) {
      self.playEffectCommonButtonClick();
    }
    const statefulBuildableInstance = self.editingStatefulBuildableInstance;
    const statefulBuildableInstanceNode = statefulBuildableInstance.node;
    const statefulInstanceInfoPanelNode = statefulBuildableInstanceNode.statefulInstanceInfoPanelNode;
    const statefulInstanceInfoPanelScriptIns = statefulInstanceInfoPanelNode.getComponent(statefulInstanceInfoPanelNode.name);
    statefulInstanceInfoPanelScriptIns.setInfo(self.editingStatefulBuildableInstance);
    self.enterPanelView(statefulInstanceInfoPanelScriptIns);
    return statefulInstanceInfoPanelScriptIns;
  },

  isStatefulBuildableOutOfMap(statefulBuildableInstance, spriteCentreDiscretePosWrtMapNode) {
    const self = this;
    const anchorTileDiscretePosWrtMap = spriteCentreDiscretePosWrtMapNode.sub(statefulBuildableInstance.spriteCentreTileToAnchorTileDiscreteOffset);
    // TODO: Return true or false based on whether `anchorTileDiscretePosWrtMap` is out of the discrete map bound.
    let {discreteWidth, discreteHeight} = statefulBuildableInstance;
    let currentLayerSize = self.highlighterLayer.getLayerSize();
    return 0 > anchorTileDiscretePosWrtMap.x || 0 > anchorTileDiscretePosWrtMap.y || currentLayerSize.width - discreteWidth < anchorTileDiscretePosWrtMap.x || currentLayerSize.height - discreteHeight < anchorTileDiscretePosWrtMap.y;
  },

  correctDiscretePositionToWithinMap(statefulBuildableInstance, discretePos) {
    let mapIns = this;
    let {discreteWidth, discreteHeight} = statefulBuildableInstance;
    let currentLayerSize = mapIns.highlighterLayer.getLayerSize();
    let toRet = cc.v2();
    toRet.x = Math.max(0, discretePos.x);
    toRet.x = Math.min(toRet.x, currentLayerSize.width - discreteWidth);
    toRet.y = Math.max(0, discretePos.y);
    toRet.y = Math.min(toRet.y, currentLayerSize.height - discreteHeight);
    return toRet;
  },

  isEditingStatefulBuildableInstanceNodeOnBoundary() {
    const self = this,
      mapIns = self;
    if (null == self.editingStatefulBuildableInstance) {
      return false;
    }
    let statefulBuildableInstance = null == self.phantomEditingStatefulBuildableInstance ? self.editingStatefulBuildableInstance : self.phantomEditingStatefulBuildableInstance;
    let editingStatefulBuildableInstanceNode = statefulBuildableInstance.node;
    let spriteCentreDiscretePosWrtMapNode = tileCollisionManager._continuousToDiscrete(mapIns.node, mapIns.tiledMapIns, editingStatefulBuildableInstanceNode.position, cc.v2(0, 0));
    spriteCentreDiscretePosWrtMapNode = cc.v2(spriteCentreDiscretePosWrtMapNode);
    const anchorTileDiscretePosWrtMap = spriteCentreDiscretePosWrtMapNode.sub(statefulBuildableInstance.spriteCentreTileToAnchorTileDiscreteOffset);
    let {discreteWidth, discreteHeight} = statefulBuildableInstance;
    let currentLayerSize = self.highlighterLayer.getLayerSize();
    return anchorTileDiscretePosWrtMap.x == 0 || anchorTileDiscretePosWrtMap.y == 0 || anchorTileDiscretePosWrtMap.x + discreteWidth == currentLayerSize.width || anchorTileDiscretePosWrtMap.y + discreteHeight == currentLayerSize.height;
  },

  upgradeStatefulBuildableInstance(statefulBuildableInstance) {
    const self = this;
    const statefulBuildableInstanceNode = statefulBuildableInstance.node;
    // TODO: correct the dependency of upgrade.
    const statefulInstanceInfoPanelNode = statefulBuildableInstanceNode.statefulInstanceInfoPanelNode;
    const statefulInstanceInfoPanelScriptIns = statefulInstanceInfoPanelNode.getComponent(statefulInstanceInfoPanelNode.name);
    statefulBuildableInstance.upgradeUnconditionally();
    statefulInstanceInfoPanelScriptIns.setInfo(statefulBuildableInstance);
    self.refreshStatefulBuildableController();  
    self.refreshActionableDict();
    self.onConfirmBuildButtonClicked(null);
    if (null != statefulBuildableInstance.statefulBuildableIngredientProgressListEntryIns) {
      statefulBuildableInstance.statefulBuildableIngredientProgressListEntryIns.show();
      self.tryToCollectStatefulBuildableIngredientProgressListEntryIns(statefulBuildableInstance);
    }
    
  },

  tryToUpgradeStatefulBuildableInstance(evt, statefulBuildableInstance) {
    const self = this;
    if (null != evt) {
      self.playEffectCommonButtonClick();
    }
    if (
      statefulBuildableInstance.isUpgrading()
      || statefulBuildableInstance.isBuilding()
      || statefulBuildableInstance.isNewing()
    ) {
      cc.warn("can not upgrade a statefulBuildableInstance when it is building or newing");
      return;
    }


    
    const statefulBuildableIngredientProgressListEntryIns = statefulBuildableInstance.statefulBuildableIngredientProgressListEntryIns;
    if (null != statefulBuildableIngredientProgressListEntryIns
     && statefulBuildableIngredientProgressListEntryIns.hasSomeOneProducing()) {
      const simplePressToGoDialogNode = cc.instantiate(self.simplePressToGoDialogPrefab);
      simplePressToGoDialogNode.setPosition(cc.v2(0, 0));
      const simplePressToGoDialogScriptIns = simplePressToGoDialogNode.getComponent("SimplePressToGoDialog");
      simplePressToGoDialogScriptIns.mapIns = self;
      simplePressToGoDialogScriptIns.onCloseDelegate = () => {
        self.exitPanelView(simplePressToGoDialogScriptIns);
      };
      simplePressToGoDialogScriptIns.setHintLabel(i18n.t("Tip.Upgrade.ingredientProgressListNotEmpty"));
      self.enterPanelView(simplePressToGoDialogScriptIns);
      return;
    }
    if (!statefulBuildableInstance.isUpgradable()) {
      cc.warn("upgrade StatefulBuildableInstance when it isn't upgradeable.", '\n\t levelConfs is:', statefulBuildableInstance.levelConfs, '\n\tlevel is:', statefulBuildableInstance.currentLevel);
      self.showUpgradeDependencyPanel(statefulBuildableInstance);
    } else { 
      self.showChangeConfirmationPanel(statefulBuildableInstance);
    }

  },

  getStatelessBuildableInstanceSpriteAtlas(singleStatelessBuildableInstance) {
    const self = this;
    let spriteAtlasArray = self.statelessBuildableInstanceSpriteAtlasArray.filter(function(x) {
      return x.name.indexOf(singleStatelessBuildableInstance.displayName) == 0;
    });
    
    if (spriteAtlasArray.length == 0) {
      return null;
    } else {
      const lvToSpriteFrameDict = {};
      spriteAtlasArray.forEach(function(spriteAtlas) {
        const spriteFrames = spriteAtlas.getSpriteFrames();
        for (let kk in spriteFrames) {
          const spriteFrame = spriteFrames[kk];
          lvToSpriteFrameDict[spriteFrame.name] = spriteFrame;
        }
      });
      return {
        getSpriteFrame: function(lv) {
          return lvToSpriteFrameDict[lv];
        },
      }
    }
  },

  findStatefulBuildableInstanceAtPosition(touchPosWrtCameraCentreScaledToMapNode) {
    const self = this,
      mapIns = this;
    const mainCameraContinuousPos = mapIns.ctrl.mainCameraNode.position;
    const roughImmediateContinuousPosOfTouchOnMapNode = (mainCameraContinuousPos.add(cc.v2(touchPosWrtCameraCentreScaledToMapNode.x, touchPosWrtCameraCentreScaledToMapNode.y)));
    const immediateDiscretePosOfCameraOnMapNode = tileCollisionManager._continuousToDiscrete(mapIns.node, mapIns.tiledMapIns, roughImmediateContinuousPosOfTouchOnMapNode, cc.v2(0, 0));
    /**
    * Don't concat "self.editingStatefulBuildableInstance" if "self.phantomEditingStatefulBuildableInstance" exists, in case that they overlap with each other.
    *
    * -- YFLu, 2019-10-14.
    */
    const toConcat = (null != self.phantomEditingStatefulBuildableInstance ? self.phantomEditingStatefulBuildableInstance : self.editingStatefulBuildableInstance); 
    const targetCpns = mapIns.statefulBuildableInstanceCompList.concat(toConcat).filter((statefulBuildableInstance) => {
      if (!statefulBuildableInstance) {
        return false;
      }
      let spriteCentreDiscretePosWrtMapNode = tileCollisionManager._continuousToDiscrete(mapIns.node, mapIns.tiledMapIns, statefulBuildableInstance.node.position, cc.v2(0, 0));
      spriteCentreDiscretePosWrtMapNode = cc.v2(spriteCentreDiscretePosWrtMapNode);
      let anchorTileDiscretePosWrtMapNode = spriteCentreDiscretePosWrtMapNode.sub(statefulBuildableInstance.spriteCentreTileToAnchorTileDiscreteOffset);
      return anchorTileDiscretePosWrtMapNode.x <= immediateDiscretePosOfCameraOnMapNode.x
        && anchorTileDiscretePosWrtMapNode.x + statefulBuildableInstance.discreteWidth > immediateDiscretePosOfCameraOnMapNode.x
        && anchorTileDiscretePosWrtMapNode.y <= immediateDiscretePosOfCameraOnMapNode.y
        && anchorTileDiscretePosWrtMapNode.y + statefulBuildableInstance.discreteHeight > immediateDiscretePosOfCameraOnMapNode.y;
    });
    if (targetCpns != null) {
      // phantomEditingStatefulBuildableInstance has highest priority
      if (null != self.phantomEditingStatefulBuildableInstance && targetCpns.includes(self.phantomEditingStatefulBuildableInstance)) { 
        return self.phantomEditingStatefulBuildableInstance;
      } else if (null != self.editingStatefulBuildableInstance && targetCpns.includes(self.editingStatefulBuildableInstance)) {
        return self.editingStatefulBuildableInstance;
      } else {
        return targetCpns[0];
      }
    } else {
      return null;
    }
  },

  isDependencyRequiredMatched(buildableLevelDependency) {
    const self = this;
    const {requiredBuildableCount, requiredBuildableId, requiredMinimumLevel, targetBuildableMaxCount, } = buildableLevelDependency;
    // check if required matched
    const matchRequiredStatefuleInstance = self.statefulBuildableInstanceList.filter((playerBuildableBinding) => {
      return playerBuildableBinding.buildable.id == requiredBuildableId
        && playerBuildableBinding.currentLevel >= requiredMinimumLevel;
    });
    return matchRequiredStatefuleInstance.length >= requiredBuildableCount;
  },

  countTargetStatefulBuildableInstance(buildableId) {
    const self = this;
    const existingStatefulInstance = self.statefulBuildableInstanceList.filter((playerBuildableBinding) => {
      return playerBuildableBinding.buildable.id == buildableId;
    });
    return existingStatefulInstance.length;
  },

  determineCurrentlyLimitedCountAndLevel(buildableId) {
    const self = this;
    const toRet = {
      currentlyLimitedCountToBuild: 0,
      currentlyLimitedLevelToUpgradeTo: 0,
    };
    const targetStatelessBuildableInstance = self.AllStatelessBuildableInstances.find(x => x.id === buildableId);
    if (!targetStatelessBuildableInstance) {
      return toRet;
    }
    targetStatelessBuildableInstance.levelConfs.forEach((singleLvConf) => {
      if (buildableId == constants.STATELESS_BUILDABLE_ID.HEADQUARTER && singleLvConf.level == 1) {
        // 1级Headquarter
        toRet.currentlyLimitedCountToBuild = Math.max(toRet.currentlyLimitedCountToBuild, 1);
        toRet.currentlyLimitedLevelToUpgradeTo = Math.max(toRet.currentlyLimitedLevelToUpgradeTo, 1);
        return;
      }
      const singleLvConfMatched = singleLvConf.dependency.filter(
        (dependency) => {
          return self.isDependencyRequiredMatched(dependency);
        }
      ).length == singleLvConf.dependency.length;
      if (singleLvConfMatched) {
        toRet.currentlyLimitedLevelToUpgradeTo = Math.max(singleLvConf.level, toRet.currentlyLimitedLevelToUpgradeTo);
        toRet.currentlyLimitedCountToBuild = Math.max(singleLvConf.dependency[0].targetBuildableMaxCount, toRet.currentlyLimitedCountToBuild);
      }
    });
    return toRet;
  },
  
  countTargetStatefulBuildableInstanceWithEqualLevel(buildableId, buildableLevel){
    const self = this;
    const existingStatefulInstance = self.statefulBuildableInstanceList.filter((playerBuildableBinding) => {
      return playerBuildableBinding.buildable.id == buildableId && playerBuildableBinding.currentLevel == buildableLevel;
    });
    return existingStatefulInstance.length;

  },

  showUpgradeDependencyPanel(statefulBuildableInstance, isStatelessBuildableInstance=false, specifiedLevel=window.INITIAL_STATEFUL_BUILDABLE_LEVEL) {
    const self = this, panelName = 'UpgradeDependencyPanel';
    if (self.viewingPanelManager.hasPanel(panelName)) {
      cc.warn('Already existing a same panel:', panelName);
      return false;
    }
    let dialog = cc.instantiate(self.upgradeDependencyPanelPrefab);
    let cpn = dialog.getComponent(panelName);
    // set panel's defaultActionsEnabled to false [begins].
    cpn.defaultActionsEnabled = false;
    // set panel's defaultActionsEnabled to false [ends].
    cpn.onCloseDelegate = () => {
      self.exitPanelView(cpn);
    };
    let nextLevel;
    if (isStatelessBuildableInstance) {
      nextLevel = specifiedLevel + 1;
    } else {
      nextLevel = statefulBuildableInstance.currentLevel + 1;
    }
    let list = statefulBuildableInstance.getDependencyList(nextLevel);
    
    let activeAppearance = statefulBuildableInstance.appearance[nextLevel];
    let buildableList = list.map(({requiredBuildableCount, requiredBuildableId, requiredMinimumLevel, targetBuildableMaxCount, }) => {
      let statelessBuildableInstance = self.statelessBuildableInstanceList.find(x => x.id == requiredBuildableId);
      if (!statelessBuildableInstance) {
        cc.warn(`loss statelessBuildableInstance for buildableId: ${requiredBuildableId}.`);
        return null;
      }
      let actualRequiredBuildableCount = requiredBuildableCount - this.countTargetStatefulBuildableInstanceWithEqualLevel(requiredBuildableId, requiredMinimumLevel);
      return {
        appearance: statelessBuildableInstance.appearance[requiredMinimumLevel],
        count: actualRequiredBuildableCount,
        level: requiredMinimumLevel,
      };
    }).filter(x => !!x);
    cpn.init(self, statefulBuildableInstance, isStatelessBuildableInstance);
    cpn.render(nextLevel, buildableList);
    self.enterPanelView(cpn);
    return cpn;
  },

  showUnlockMoreBuildablePanel(statelessBuildableInstanceCard) {
    const self = this, panelName = 'UpgradeDependencyPanel';
    const statelessBuildableInstance = statelessBuildableInstanceCard.singleStatelessBuildableInstance;
    if (self.viewingPanelManager.hasPanel(panelName)) {
      cc.warn('Already existing a same panel:', panelName);
      return false;
    }
    let dialog = cc.instantiate(self.upgradeDependencyPanelPrefab);
    let cpn = dialog.getComponent(panelName);
    // set panel's defaultActionsEnabled to false [begins].
    cpn.defaultActionsEnabled = false;
    // set panel's defaultActionsEnabled to false [ends].
    cpn.onCloseDelegate = () => {
      self.exitPanelView(cpn);
    };
    let nextLevel = statelessBuildableInstanceCard.toRet.currentlyLimitedLevelToUpgradeTo + 1;
    let list = statelessBuildableInstance.getDependencyList(nextLevel);
    let activeAppearance = statelessBuildableInstance.appearance[1];
    let buildableList = null;
    if (!list || constants.STATELESS_BUILDABLE_ID.HEADQUARTER == statelessBuildableInstance.id) {
      buildableList = [];
    } else {
      buildableList = list.map(({requiredBuildableCount, requiredBuildableId, requiredMinimumLevel, targetBuildableMaxCount, }) => {
        let statelessBuildableInstance = self.statelessBuildableInstanceList.find(x => x.id == requiredBuildableId);
        if (!statelessBuildableInstance) {
          cc.warn(`loss statelessBuildableInstance for buildableId: ${requiredBuildableId}.`);
          return null;
        }
        return {
          appearance: statelessBuildableInstance.appearance[requiredMinimumLevel],
          count: requiredBuildableCount,
          level: requiredMinimumLevel,
        };
      }).filter(x => !!x);
    }
    cpn.init(self, statelessBuildableInstance, true);
    cpn.render(nextLevel, buildableList);
    cpn.refreshNote(!statelessBuildableInstance.levelConfs.find(x => x.level == nextLevel));
    self.enterPanelView(cpn);
  },

  showChangeConfirmationPanel(statefulBuildableInstance) {
    const self = this, panelName = 'StatefulBuildableChangeConfirmationPanel';
    if (self.viewingPanelManager.hasPanel(panelName)) {
      cc.warn('Already existing a same panel:', panelName);
      return false;
    }
    let dialog = cc.instantiate(self.statefulBuildableChangeConfirmationPanelPrefab);
    let cpn = dialog.getComponent(panelName);
    // set panel's defaultActionsEnabled to false [begins].
    cpn.defaultActionsEnabled = false;
    // set panel's defaultActionsEnabled to false [ends].
    cpn.onCloseDelegate = () => {
      self.exitPanelView(cpn);
    };
    let currentLevel = statefulBuildableInstance.currentLevel,
      nextLevel = statefulBuildableInstance.currentLevel + 1;
    let currentLevelConf = statefulBuildableInstance.levelConfs.find(x => x.level == currentLevel),
      nextLevelConf = statefulBuildableInstance.levelConfs.find(x => x.level == nextLevel);
    let diffMap = self.diffBetweenTwoLevelBinding(currentLevelConf, nextLevelConf, statefulBuildableInstance);
    const isHeadquarter = statefulBuildableInstance.id == constants.STATELESS_BUILDABLE_ID.HEADQUARTER;
    let unlockBuildables;
    if (isHeadquarter) {
      unlockBuildables = self.findUnlockBuildables(currentLevel, nextLevel);
    } else {
      unlockBuildables = [];
    }
    cpn.init(self, statefulBuildableInstance);
    cpn.render(statefulBuildableInstance.appearance[nextLevel], nextLevelConf, diffMap, unlockBuildables);
    let unlockIngredientList = [];
    unlockIngredientList = self.getUnlockIngredientIdsAfterBuildableUpgradeDone(
      statefulBuildableInstance.id,
      statefulBuildableInstance.currentLevel,
      statefulBuildableInstance.currentLevel + 1,
      isHeadquarter
    ).map(function(ingredientId) {
      return self.getIngredientById(ingredientId);
    });
    cpn.renderUnlockIngredientList(unlockIngredientList, isHeadquarter);
    self.enterPanelView(cpn);
    return cpn;
  },

  // Extends `NarrativeSceneManagerDelegate`.
  endCurrentNarrativeSceneIfApplicable(evt) {
    NarrativeSceneManagerDelegate.prototype.endCurrentNarrativeSceneIfApplicable.call(this, evt);
    const self = this;
    self.onCurrentNarrativeSceneEnded(self.currentTutorialGroupIndex, self.currentTutorialStage);
  },

  onCurrentNarrativeSceneEnded(groupIndex, toSpecifiedStage) {
    const self = this;
    NarrativeSceneManagerDelegate.prototype.onCurrentNarrativeSceneEnded.call(this, groupIndex, toSpecifiedStage);
    /** 持久化数据结构 [begins] */
    self.saveAllPlayerSyncData();
  /** 持久化数据结构 [ends] */
  },

  saveIntoLocalStorage() {
    const self = this;
    cc.sys.localStorage.setItem("playerBuildableBindingList", JSON.stringify(self.statefulBuildableInstanceList));
    cc.sys.localStorage.setItem("wallet", JSON.stringify(self.wallet));
    if (null != window.cachedPlayerStageBindingData) {
      // The "diamond" is a shared resource between "IdleGameMap" and "StageMap".
      window.cachedPlayerStageBindingData.diamond = self.wallet.diamond;
    }
    cc.sys.localStorage.setItem("tutorialStage", self.currentTutorialStage);
    cc.sys.localStorage.setItem("questCompletedMap", JSON.stringify(self.questCompletedMap));
    cc.sys.localStorage.setItem("accumulatedResource", JSON.stringify(self.accumulatedResource));
    cc.sys.localStorage.setItem("interruptTutorialMask", JSON.stringify(self.interruptTutorialMask));

    if (null != self.gameSettings && Object.keys(self.gameSettings).length > 0) {
      // Ever initialized.
      cc.sys.localStorage.setItem("gameSettings", JSON.stringify(self.gameSettings));
    }
  },

  onUpgradeButtonClicked(evt) {
    const self = this;
    if (null != evt) {
      self.playEffectCommonButtonClick();
    }
    if (self.editingStatefulBuildableInstance) {
      self.tryToUpgradeStatefulBuildableInstance(null, self.editingStatefulBuildableInstance);
      self.refreshStatefulBuildableController();
    }
  },

  refreshStatefulBuildableController() {
    const self = this;
    if (!self.isEditingExistingStatefulBuildableInstance() && !self.isPositioningNewStatefulBuildableInstance()) {
      self.statefulBuildableController.active = false;
      return;
    }
    if (!self.editingStatefulBuildableInstance) {
      self.statefulBuildableController.active = false;
      return;
    }
    switch (self.editingStatefulBuildableInstance.state) {
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING:
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_BUILDING:
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_UPGRADING:
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_NEW:
        self.statefulBuildableController.active = true;
        break;
      default:
        self.statefulBuildableController.active = false;
        return;
    }
    self.widgetsAboveAllScriptIns.upgradeButton.node.active = false;
    self.widgetsAboveAllScriptIns.cancelBuildButton.node.active = false;
    self.widgetsAboveAllScriptIns.confirmBuildButton.node.active = false;
    self.widgetsAboveAllScriptIns.statefulBuildableInstanceInfoLabel.node.active = false;
    self.widgetsAboveAllScriptIns.boostButton.node.active = false;

    if (
      !self.editingStatefulBuildableInstance.isBuilding()
      && !self.editingStatefulBuildableInstance.isUpgrading()
      && !self.editingStatefulBuildableInstance.isNewing()
      && !self.editingStatefulBuildableInstance.isLevelReachMaxLevel()
    ) {
      let requireGold = self.editingStatefulBuildableInstance.levelConfs.find(x => x.level == self.editingStatefulBuildableInstance.currentLevel + 1).buildingOrUpgradingRequiredGold;
      self.widgetsAboveAllScriptIns.upgradeButton.node.active = true;
      self.widgetsAboveAllScriptIns.upgradeButtonGoldLabel.string = requireGold;
      self.widgetsAboveAllScriptIns.upgradeButtonGoldLabel.node.color = requireGold <= self.wallet.gold ? cc.Color.BLACK : cc.Color.RED;
    }

    self.widgetsAboveAllScriptIns.statefulBuildableInstanceInfoLabel.node.active = true;
    self.widgetsAboveAllScriptIns.statefulBuildableInstanceInfoLabel.string = self.editingStatefulBuildableInstance.currentLevel ? 
      cc.js.formatStr(
        i18n.t("BuildingInfo.Short"),
        i18n.t("BuildingInfo.DisplayName." + self.editingStatefulBuildableInstance.displayName),
        self.editingStatefulBuildableInstance.currentLevel
      )
      :
      i18n.t("BuildingInfo.DisplayName." + self.editingStatefulBuildableInstance.displayName);

    switch (self.editingStatefulBuildableInstance.state) {
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_BUILDING:
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_UPGRADING:
        self.widgetsAboveAllScriptIns.boostButton.node.active = mapIns.boostEnabled;
        break;
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_NEW:
        self.widgetsAboveAllScriptIns.cancelBuildButton.node.active = true;
        self.widgetsAboveAllScriptIns.confirmBuildButton.node.active = true;
        break;
    }

    if (
         constants.STATELESS_BUILDABLE_ID.FARMLAND == self.editingStatefulBuildableInstance.id
      && !self.editingStatefulBuildableInstance.isNewing()
      && !self.editingStatefulBuildableInstance.isBuilding()) {
      // WARNING: UNDEFINED_ACTION.
      self.widgetsAboveAllScriptIns.farmProductionButton.node.active = false;
    } else {
      self.widgetsAboveAllScriptIns.farmProductionButton.node.active = false;
    }

    if (
         constants.STATELESS_BUILDABLE_ID.LABORATORY == self.editingStatefulBuildableInstance.id
      && !self.editingStatefulBuildableInstance.isNewing()
      && !self.editingStatefulBuildableInstance.isBuilding()
      && !self.editingStatefulBuildableInstance.isUpgrading()
    ) {
      self.widgetsAboveAllScriptIns.labResearchButton.node.active = true;
    } else {
      self.widgetsAboveAllScriptIns.labResearchButton.node.active = false;
    }

    if (
         constants.STATELESS_BUILDABLE_ID.HEADQUARTER == self.editingStatefulBuildableInstance.id
      && !self.editingStatefulBuildableInstance.isNewing()
      && !self.editingStatefulBuildableInstance.isBuilding()
      && !self.editingStatefulBuildableInstance.isUpgrading()
    ) {
      self.widgetsAboveAllScriptIns.hqProductionButton.node.active = true;
    } else {
      self.widgetsAboveAllScriptIns.hqProductionButton.node.active = false;
    }

    if (
         constants.STATELESS_BUILDABLE_ID.BAKERY == self.editingStatefulBuildableInstance.id
      && !self.editingStatefulBuildableInstance.isNewing()
      && !self.editingStatefulBuildableInstance.isBuilding()
      && !self.editingStatefulBuildableInstance.isUpgrading()
    ) {
      self.widgetsAboveAllScriptIns.bakeryProductionButton.node.active = true;
    } else {
      self.widgetsAboveAllScriptIns.bakeryProductionButton.node.active = false;
    }


  },

  diffBetweenTwoLevelBinding(first, second) {
    const self = this;
    let comparedKeys = [
        "baseFoodProductionRate",
        "baseGoldProductionRate",
        "goldLimitAddition",
      ],
      mapFns = {
        goldLimitAddition(val, isNewValue) {
          return self.wallet.goldLimit + (isNewValue ? val : 0);
        },
        baseGoldProductionRate(val, isNewValue) {
          return val * 60;
        },
        default(val) {
          return val;
        }
      },
      reduceMap = {
        goldLimitAddition(oldValue, newValue) {
          return {
            gold: self.wallet.gold,
            oldValue, newValue,
            diff: newValue - oldValue,
          };
        }
      },
      diff = {};
    comparedKeys.forEach((key) => {
      let mapFn = mapFns[key] || mapFns.default;
      let oldValue = mapFn(first[key], false);
      let newValue = mapFn(second[key], true);
      if (oldValue !== newValue) {
        if (!reduceMap[key]) {
          diff[key] = [oldValue, newValue];
        } else {
          diff[key] = reduceMap[key](oldValue, newValue);
        }
      }
    });
    return diff;
  },

  findUnlockBuildables(fromHeadquarterLevel, toHeadquarterLevel) {
    const self = this;
    let unlockBuildables = [];
    self.statelessBuildableInstanceList.forEach((statelessBuildableInstance) => {
      if (statelessBuildableInstance.id == constants.STATELESS_BUILDABLE_ID.HEADQUARTER) {
        return;
      }
      let fromMaxCount = 0,
        toMaxCount = 0, toMaxLevel;
      // TODO: count the maxCount under two Headquarter Level and compare them
      // if (toMaxCount > fromMaxCount), then the buildable are "unlock" (toMaxCount - fromMaxCount) numbers;
      statelessBuildableInstance.levelConfs.forEach((levelConf) => {
        levelConf.dependency.forEach((dependency) => {
          if (dependency.requiredBuildableId != constants.STATELESS_BUILDABLE_ID.HEADQUARTER) {
            cc.warn(`existing buildable's dependency not requires HEADQUARTER only!!!`);
            return;
          }
          if (dependency.requiredBuildableCount != 1) {
            cc.warn(`existing buildable's dependency requires more than a HEADQUARTER!!!`);
          }
          if (dependency.requiredMinimumLevel <= fromHeadquarterLevel) {
            fromMaxCount = Math.max(dependency.targetBuildableMaxCount, fromMaxCount);
          }
          if (dependency.requiredMinimumLevel <= toHeadquarterLevel) {
            toMaxCount = Math.max(dependency.targetBuildableMaxCount, toMaxCount);
            toMaxLevel = levelConf.level;
          }
        });
      });
      if (fromMaxCount < toMaxCount) {
        if (self.toIgnoreBuildableIds.indexOf(statelessBuildableInstance.id) == -1) {
          unlockBuildables.push({
            appearance: statelessBuildableInstance.appearance[toMaxLevel],
            count: toMaxCount - fromMaxCount,
            level: toMaxLevel,
          });
        }
        
      }
    });
    return unlockBuildables;
  },

  showIapItemPanel(evt, customEventData) {
    const self = this;
    const canvasNode = self.node.parent;
    if (cc.sys.isNative && self.iapEnabled) {
      try {
        safelyAddChild(self.widgetsAboveAllNode, self.closeableWaitingShadowNode);
        if (CuisineMaster && CuisineMaster.Iap) {
          CuisineMaster.Iap.iap_sku_list_query();
          CuisineMaster.Iap.iap_unfinished_transactions_query();
        }
      } catch (e) {
        cc.warn(e);
      }
    } else if ((cc.sys.platform == cc.sys.WECHAT_GAME || cc.sys.platform == cc.sys.ANDROID) && true == self.vidAdsRewardEnabled) {
      let confirmationPanelIns = self.onVidAdsPanelTriggerClicked();
    } else {
      const simplePressToGoDialogNode = cc.instantiate(self.simplePressToGoDialogPrefab);
      simplePressToGoDialogNode.setPosition(cc.v2(0, 0));
      const simplePressToGoDialogScriptIns = simplePressToGoDialogNode.getComponent("SimplePressToGoDialog");
      simplePressToGoDialogScriptIns.mapIns = self;
      simplePressToGoDialogScriptIns.onCloseDelegate = () => {
        self.exitPanelView(simplePressToGoDialogScriptIns);
      };
      simplePressToGoDialogScriptIns.setHintLabel(i18n.t("errorHint.lackOfDiamond"));
      simplePressToGoDialogScriptIns.setYesButtonLabel(i18n.t("bichoiceDialog.yes"));
      self.enterPanelView(simplePressToGoDialogScriptIns);
      return;
    }
  },

  updateBuildableMapGUIForBuildOrUpgradeDone(statefulBuildableInstance) {
    const self = this;
    self.playEffectCommonCongrat();
    self.spawnOrRefreshStatefulBuildableFollowingNpcs();
    self.refreshStatefulBuildableController();
    self.refreshLockedButtonByBuildable();
    self.refreshBuildButtonCountTip(); 
    self.renderPerStatefulBuildableInstanceNode(statefulBuildableInstance);
    self.showBuildOrUpgradeCompletedTip(statefulBuildableInstance.node, -statefulBuildableInstance.node.height / 2 + 60);
    if (null != self.editingStatefulBuildableInstance
      && null != self.phantomEditingStatefulBuildableInstance
      && self.editingStatefulBuildableInstance == statefulBuildableInstance) {
      self.phantomEditingStatefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE, statefulBuildableInstance.fixedSpriteCentreContinuousPos, statefulBuildableInstance.currentLevel, null);
      self.phantomEditingStatefulBuildableInstance._refreshAppearanceResource();
    }
  },

  costGoldForBuildOrUpgradeBuildableInstance(statefulBuildableInstance, newLevel, callback) {
    const self = this;
    if (statefulBuildableInstance.isBuilding() || statefulBuildableInstance.isUpgrading()) {
      cc.warn(`call costGoldForBuildOrUpgradeBuildableInstance when it is already building or upgrading`);
      return false;
    }

    const requiredGold = statefulBuildableInstance.levelConfs
      .find((x, i) => x.level == newLevel)
      .buildingOrUpgradingRequiredGold;
    return self.costGoldsToDo(requiredGold, callback && callback.bind(self, statefulBuildableInstance, newLevel, requiredGold));
  },

  costDiamondsToBuyGold(diamondCount, callback) {
    const self = this;
    const goldGained = self.countGoldForCostDiamond(diamondCount);

    return self.costDiamondsToDo(diamondCount, function() {
      self.widgetsAboveAllScriptIns.walletInfo.setData({
        gold: self.wallet.gold + goldGained,
      });
      callback && callback(diamondCount, goldGained);
    })
  },

  countDiamondToBuyGold(gold) {
    if (gold <= 0) {
      return 0;
    } else {
      return Math.ceil(gold / this.exchangeRateOfGoldToDiamond);
    }
  },

  countGoldForCostDiamond(diamond) {
    if (diamond <= 0) {
      return 0;
    } else {
      return Math.floor(diamond) * this.exchangeRateOfGoldToDiamond;
    }
  },

  countDiamondForBoostDurationMillis(durationMillis) {
    if (durationMillis > 0) {
      return Math.ceil(durationMillis / this.exchangeRateOfTimeToDiamond);
    } else {
      return 0;
    }
  },

  onBoostButtonClicked(evt) {
    const self = this;
    if (null != evt) {
      self.playEffectCommonButtonClick();
    }
    if (!self.isEditingExistingStatefulBuildableInstance()) {
      return;
    }
    if (!self.editingStatefulBuildableInstance) {
      console.warn(`why that self.editingStatefulBuildableInstance is null while self.isEditingExistingStatefulBuildableInstance?`);
      return;
    }
    if (!self.editingStatefulBuildableInstance.isBuilding() && !self.editingStatefulBuildableInstance.isUpgrading()) {
      return;
    }
    let statefulBuildableInstance = self.editingStatefulBuildableInstance;
    let passedDurationMills = Date.now() - statefulBuildableInstance.buildingOrUpgradingStartedAt;
    let restDuration = statefulBuildableInstance.buildingOrUpgradingDuration[statefulBuildableInstance.currentLevel + 1] - passedDurationMills / 1000;
    let costDiamond = self.countDiamondForBoostDurationMillis(restDuration * 1000);
    self._boostBuildingOrUpgradingStatefulBuildableInstance(statefulBuildableInstance, costDiamond);
  },

  tryToBoostBuildingOrUpgradingStatefulBuildableInstance(statefulBuildableInstance) {
    const self = this;
    if (!self.isPurelyVisual() && !self.isFloatingModalPopup()) {
      return;
    }
    if (self.isFloatingModalPopup()) {
      self.floatingKnapsackPanelIns.onCloseClicked();
    }
    if (!statefulBuildableInstance) {
      statefulBuildableInstance = self.editingStatefulBuildableInstance;
    }
    if (null == statefulBuildableInstance) {
      cc.warn("No statefulBuildableInstance specified to be boosted!");
      return;
    }
    let passedDurationMills = Date.now() - statefulBuildableInstance.buildingOrUpgradingStartedAt;
    let restDuration = statefulBuildableInstance.buildingOrUpgradingDuration[statefulBuildableInstance.currentLevel + 1] - passedDurationMills / 1000;
    let costDiamond = self.countDiamondForBoostDurationMillis(restDuration * 1000); 
    self._boostBuildingOrUpgradingStatefulBuildableInstance(statefulBuildableInstance, costDiamond);
  },

  _boostBuildingOrUpgradingStatefulBuildableInstance(statefulBuildableInstance, costDiamond) {
    const self = this, panelName = 'CostDiamondsConfirmationPanel';
    if (self.viewingPanelManager.hasPanel(panelName)) {
      cc.warn('Already existing a same panel:', panelName);
      return;
    }
    let panelNode = cc.instantiate(self.costDiamondsConfirmationPanelPrefab),
        panel = panelNode.getComponent(panelName);
    // set panel's defaultActionsEnabled to false [begins].
    panel.defaultActionsEnabled = false;
    // set panel's defaultActionsEnabled to false [ends].
    panel.init(self, costDiamond, null);
    panel.render('boost');
    panel.onConfirmDelegate = () => {
      self.clearPanels();
      if (statefulBuildableInstance.isBuilding() || statefulBuildableInstance.isUpgrading()) {
        self.costDiamondsToDo(costDiamond, function() {
          statefulBuildableInstance.boost();
        });
      } else {
        cc.warn(`boost called when statefulBuildableInstance in an error state: ${statefulBuildableInstance.state}`);
      }
    };
    panel.onCloseDelegate = () => {
      self.exitPanelView(panel);
    };
    self.enterPanelView(panel);
  },

  _handleUnfinishedAppleIapTransaction(trx) {
    const self = this;
    let diamondAddition = constants.DIAMOND_PRODUCT_INFO[trx.productIdentifier].DIAMOND_NUM;
    self.widgetsAboveAllScriptIns.walletInfo.setData({
      diamond: self.wallet.diamond + diamondAddition, 
    });
    CuisineMaster.Iap.finish_transaction(trx.transactionIdentifier);
  },
              
  showCostDiamondsToBuyGoldPanel(gold, confirmCallBack) {
    const self = this, panelName = 'CostDiamondsConfirmationPanel';
    if (self.viewingPanelManager.hasPanel(panelName)) {
      cc.warn('Already existing a same panel:', panelName);
      return;
    }
    const requiredDiamonds = self.countDiamondToBuyGold(gold);
    let panelNode = cc.instantiate(self.costDiamondsConfirmationPanelPrefab),
        panel = panelNode.getComponent(panelName);
    // set panel's defaultActionsEnabled to false [begins].
    panel.defaultActionsEnabled = false;
    // set panel's defaultActionsEnabled to false [ends].
    panel.init(self, requiredDiamonds, {
      goldCount: gold,
    });
    panel.render('gold');
    panel.onConfirmDelegate = () => {
      panel.onCloseClicked(null);
      confirmCallBack && confirmCallBack();
    };
    panel.onCloseDelegate = () => {
      self.exitPanelView(panel);
    }
    self.enterPanelView(panel);
    return panel;
  },

  tryToBuildStatefulBuildableInstance(statelessBuildableInstance) {
    const self = this;
    let levelConf = statelessBuildableInstance.levelConfs.find(x => x.level = 1);
    let requiredGold = levelConf.buildingOrUpgradingRequiredGold;
    return self.costGoldsToDo(requiredGold, function(goldValueBeforeCost) {
      // Gold will be cost after endPositioningStatefulBuildableInstance.
      self.widgetsAboveAllScriptIns.walletInfo.setData({
        gold: goldValueBeforeCost,
      });
      self.clearPanels();
      self.startPositioningNewStatefulBuildableInstance(statelessBuildableInstance);
    });
  },
  
  clearPanels() {
    const self = this;
		let allPanels = [];
		for (let i = 0, len = self.widgetsAboveAllScriptIns.node.children.length; i < len; i++) {
		  let panelNode = self.widgetsAboveAllScriptIns.node.children[i];
			let panelIns = panelNode.getComponent('CloseableDialog');
			if (null != panelIns) {
			  allPanels.push(panelIns);
			}
		}
    for (let panelIns of allPanels) {
      if (panelIns.node.active) {
        panelIns.onCloseClicked();
      } else {
        panelIns.node.removeFromParent();
        panelIns.onCloseDelegate && panelIns.onCloseDelegate(null);
      }
			if (self.viewingPanelManager.indexOf(panelIns) != -1) {
				self.exitPanelView(panelIns);
			}
    }
		self.removeShowingModalPopup();
		self.removeFloatingModalPopup();
  },

  spawnOrRefreshStatefulBuildableFollowingNpcs() {
    const self = this;
    if (!self.statefulBuildableFollowingNpcPrefab) {
      console.log("There's no \"statefulBuildableFollowingNpcPrefab\" yet!");
      return;
    }
    const tiledMapIns = self.tiledMapIns;
    const followingNpcOffsetScaleRatio = 1;
    let npcs = [
      constants.NPC_ANIM.NAME.HAT_GIRL,
      constants.NPC_ANIM.NAME.GREEN_HAIR_BOY,
      constants.NPC_ANIM.NAME.ORANGE_HAT_GIRL,
      constants.NPC_ANIM.NAME.BLACK_HAIR_GIRL,
      // constants.NPC_ANIM.NAME.GIRL,
    ];

    const baseFollowingNpcCountPerStatefulBuildable = 0;
    for (let indice = 0; indice < self.statefulBuildableInstanceCompList.length; ++indice) {
      const statefulBuildableInstanceComp = self.statefulBuildableInstanceCompList[indice];
      let maxCountOfFollowingNpcs = 0;
      switch (statefulBuildableInstanceComp.id) {
        case constants.STATELESS_BUILDABLE_ID.HEADQUARTER:
          maxCountOfFollowingNpcs = Math.min(4, baseFollowingNpcCountPerStatefulBuildable + statefulBuildableInstanceComp.currentLevel); // Hardcoded temporarily. -- YFLu 
        break; 
        case constants.STATELESS_BUILDABLE_ID.RESTAURANT:
          maxCountOfFollowingNpcs = Math.min(4, baseFollowingNpcCountPerStatefulBuildable + statefulBuildableInstanceComp.currentLevel); // Hardcoded temporarily. -- YFLu 
        break;
        default:
        break;
      }
      if (0 >= maxCountOfFollowingNpcs) {
        continue;
      }
      if (null == statefulBuildableInstanceComp.boundFollowingNpcDict) {
        statefulBuildableInstanceComp.boundFollowingNpcDict = {};
      }
      const countOfExistingFollowingNpc = Object.keys(statefulBuildableInstanceComp.boundFollowingNpcDict).length; 
      if (null != statefulBuildableInstanceComp.boundFollowingNpcDict && countOfExistingFollowingNpc >= maxCountOfFollowingNpcs) {
        console.warn("The `statefulBuildableInstanceComp` of uuid ", statefulBuildableInstanceComp.uuid, " already has countOfExistingFollowingNpc ", countOfExistingFollowingNpc);
        continue;
      }
      for (let i = countOfExistingFollowingNpc; i < maxCountOfFollowingNpcs; ++i) {
        const npcNode = cc.instantiate(self.statefulBuildableFollowingNpcPrefab);
        const npcScriptIns = npcNode.getComponent("StatefulBuildableFollowingNpc");
        npcScriptIns.speciesName = npcs[i%npcs.length];
        statefulBuildableInstanceComp.boundFollowingNpcDict[npcNode.uuid] = npcScriptIns;
        self.statefulBuildableFollowingNpcScriptInsDict[npcNode.uuid] = npcScriptIns;
        npcScriptIns.mapNode = self.node;
        npcScriptIns.mapIns = self;
        npcScriptIns.boundStatefulBuildable = statefulBuildableInstanceComp;
        const npcSrcContinuousPosWrtMapNode = statefulBuildableInstanceComp.fixedSpriteCentreContinuousPos;
        npcNode.setPosition(npcSrcContinuousPosWrtMapNode);
        safelyAddChild(self.node, npcNode);
        setLocalZOrder(npcNode, window.CORE_LAYER_Z_INDEX.PLAYER);
        let closeWise = window.ALL_DISCRETE_DIRECTIONS_CLOCKWISE[Math.floor(i/4)+2*(i%4)];
        let discreteX = closeWise.dx ? closeWise.dx/Math.abs(closeWise.dx) : closeWise.dx;
        let discreteY = closeWise.dy ? closeWise.dy/Math.abs(closeWise.dy) : closeWise.dy;
        npcScriptIns.specifiedOffsetFromSpriteCentre = cc.v2(
          tiledMapIns.getTileSize().width*followingNpcOffsetScaleRatio*discreteX,
          tiledMapIns.getTileSize().height*followingNpcOffsetScaleRatio*discreteY
        );
        npcScriptIns.refreshGrandSrcAndCurrentDestination();
        npcNode.position = npcScriptIns.currentDestination;
        npcScriptIns.transitToStaying();
      } 
    }
  },

  setSideButtonGroupActive(active, immediately=false) {
    active = !!active;
    const self = this;
    if (self.isInNarrativeScene()) {
      active = false;
    }
    let sideButtonGroupNode = self.widgetsAboveAllScriptIns.sideButtonGroupNode;
    let duration = 0.2;
    let action = active ? cc.fadeIn(duration) : cc.fadeOut(duration);
    sideButtonGroupNode.stopAllActions();
    if (true == immediately) {
      sideButtonGroupNode.active = active;
    } else {
      sideButtonGroupNode.active = true;
      sideButtonGroupNode.runAction(cc.sequence(
        action,
        cc.callFunc(() => {
          sideButtonGroupNode.active = active;
        })
      ));
    }
  },

  onKnapsackButtonClicked(evt) {
    const self = this;
    if (null != evt) {
      self.playEffectCommonButtonClick();
    }
    if (self.isShowingModalPopup()) {
      return;
    }
    let panelName = 'FloatingKnapsackPanel';
    if (!self.floatingKnapsackPanelNode) {
      self.floatingKnapsackPanelNode = cc.instantiate(self.floatingKnapsackPanelPrefab);
      self.floatingKnapsackPanelIns = self.floatingKnapsackPanelNode.getComponent(panelName);
    }
    let panelNode = self.floatingKnapsackPanelNode,
        panelIns = panelNode.getComponent(panelName);
    // set panel's defaultActionsEnabled to false [begins].
    panelIns.defaultActionsEnabled = false;
    // set panel's defaultActionsEnabled to false [ends].

    panelIns.onCloseDelegate = () => {
      self.removeFloatingModalPopup();
      if (self.isPurelyVisual()) {
        self.setSideButtonGroupActive(true);
      }
    };
    panelIns.init(self);
    if (!self.addFloatingModalPopup()) {
      return;
    }
    self.setSideButtonGroupActive(false);
    safelyAddChild(self.widgetsAboveAllNode, panelNode);
    panelIns.setState(window.AJAX_STATE.WAITING);
    self.sendPlayerKnapsackQuery(function(err) {
      if (null != err) {
        // TODO: handle query failed situaion.
      }
      panelIns.setData(self.knapsackArray);
      panelIns.refresh();
      panelIns.setState(window.AJAX_STATE.SUCCEED);
    });

  },

  onLabResearchButtonClicked(evt) {
    const self = this;
    if (null != evt) {
      self.playEffectCommonButtonClick();
    }
    return self.onCraftingSystemButtonClicked(self.editingStatefulBuildableInstance);
  },

  onCraftingSystemButtonClicked(statefulBuildableInstance) {
    const self = this;
    let existed = true;
    if (!self.craftingSystemPanelNode) {
      existed = false;
      self.craftingSystemPanelNode = cc.instantiate(self.craftingSystemPanelPrefab);
    }
    let panelName = 'CraftingSystemPanel';
    if (self.viewingPanelManager.hasPanel(panelName)) {
      cc.warn('Already existing a same panel:', panelName);
      return;
    }
    let panelNode = self.craftingSystemPanelNode,
        panelIns = panelNode.getComponent(panelName);
    
    self.craftingSystemPanelIns = panelIns;
    // set panel's defaultActionsEnabled to false [begins].
    panelIns.defaultActionsEnabled = false;
    // set panel's defaultActionsEnabled to false [ends].
    panelIns.closeSelfOnBlur = false;
    panelIns.onCloseDelegate = () => {
     self.exitPanelView(panelIns);
     panelIns.refresh();
    };
    panelIns.fixed = true;
    panelIns.init(self, statefulBuildableInstance);
    self.enterPanelView(panelIns);
    if (!existed) {
      panelIns.resizeNode();
    }
    panelIns.setState(window.AJAX_STATE.WAITING);
    self.sendIngredientListQuery(statefulBuildableInstance.playerBuildableBinding.id, statefulBuildableInstance.autoCollect, function({
      ingredientList,
      ingredientProgressList,
    }) {
      panelIns.setState(window.AJAX_STATE.SUCCEED);
      panelIns.setData(self.getCraftableKnapsackArray());
      panelIns.refresh();
      if (null != ingredientProgressList && ingredientProgressList.length) {
        let targetIngredientProgress = ingredientProgressList[0];
        self.onCraftingSynthesize(null, panelIns, targetIngredientProgress);
      }
    })
  },
  
  onCraftingSynthesize(knapsacks, craftingSystemPanelIns, ingredientProgress) {
    const self = this;
    let panelName = 'CraftingResultPanel';
    if (self.viewingPanelManager.hasPanel(panelName)) {
      cc.warn('Already existing a same panel:', panelName);
      return;
    }
    let panelNode = cc.instantiate(self.craftingResultPanelPrefab);
    let panelIns = panelNode.getComponent(panelName);
    // set panel's defaultActionsEnabled to false [begins].
    panelIns.defaultActionsEnabled = false;
    // set panel's defaultActionsEnabled to false [ends].
    panelIns.closeSelfOnBlur = false;
    panelIns.onCloseDelegate = () => {
      craftingSystemPanelIns.craftingButton.node.active = true;
      craftingSystemPanelIns.craftingButton.interactable = true;
      craftingSystemPanelIns.interactable = true;
      craftingSystemPanelIns.updateGUI();
      let targetIngredientProgress = panelIns.ingredientProgress;
      self.refreshIngredientProgressListEntry(craftingSystemPanelIns.statefulBuildableInstance, null == targetIngredientProgress ? [] : [targetIngredientProgress]);
      let statefulBuildableIngredientProgressListEntryIns = craftingSystemPanelIns.statefulBuildableInstance.statefulBuildableIngredientProgressListEntryIns;
      if (null != statefulBuildableIngredientProgressListEntryIns) {
        statefulBuildableIngredientProgressListEntryIns.autoRefreshEnabled = true;
      }
      self.exitPanelView(panelIns);
    };
    panelIns.onCellCollect = function() {
      self.sendIngredientCollectQuery(
        {
          targetPlayerBuildableBindingId: craftingSystemPanelIns.statefulBuildableInstance.playerBuildableBinding.id
        },
        function() {
          craftingSystemPanelIns.setData(self.getCraftableKnapsackArray());
          craftingSystemPanelIns.refresh();
          panelIns.ingredientProgress = null;
          panelIns.onCloseClicked(null);
        }
      )
    };
    panelIns.onCellCancel = function(ingredientProgress) {
      self.sendIngredientProgressCancelQuery(
        {
          ingredientProgressId: ingredientProgress.id,
          autoCollect: craftingSystemPanelIns.statefulBuildableInstance.autoCollect,
        },
        function() {
          craftingSystemPanelIns.setData(self.getCraftableKnapsackArray());
          craftingSystemPanelIns.refresh();
          panelIns.ingredientProgress = null;
          panelIns.onCloseClicked(null);
        }
      )
    };
    panelIns.onBoost = function(duration) {
      panelIns.craftingSystemPanelIns.closeBtn.interactable = false;
      panelIns.boostButton.interactable = false;
      self.tryToBoostIngredientProgressList(
        panelIns.craftingSystemPanelIns.statefulBuildableInstance, duration,
        function(
          { ingredientProgressList }
        ) {
          panelIns.setData(null, [null, ingredientProgressList[0], null]);
          panelIns.setState(window.AJAX_STATE.SUCCEED);
          panelIns.craftingSystemPanelIns.closeBtn.interactable = true;
          panelIns.boostButton.interactable = true;
        },
        function() {
          panelIns.craftingSystemPanelIns.closeBtn.interactable = true;
          panelIns.boostButton.interactable = true;
        }
      );
    };

    panelIns.onRefresh = function(ingredient, ingredientProgress, retType) {
      self.refreshIngredientProgressListEntry(craftingSystemPanelIns.statefulBuildableInstance, null == ingredientProgress ? [] : [ingredientProgress]);
      let statefulBuildableIngredientProgressListEntryIns = craftingSystemPanelIns.statefulBuildableInstance.statefulBuildableIngredientProgressListEntryIns;
      if (null != statefulBuildableIngredientProgressListEntryIns) {
        statefulBuildableIngredientProgressListEntryIns.autoRefreshEnabled = false;
        statefulBuildableIngredientProgressListEntryIns.hide();
      }
    };

    panelIns.init(self, craftingSystemPanelIns);
    if (null != knapsacks) {
      let targetPlayerBuildableBindingId = craftingSystemPanelIns.statefulBuildableInstance.playerBuildableBinding.id;
      const bindedData = {
        craftingResultPanelIns: panelIns,
        knapsacks,
        craftingSystemPanelIns,
      };
      self.sendSynthesizeQuery(
        craftingSystemPanelIns.statefulBuildableInstance,
        knapsacks.map((obj) => {
          return {
            knapsackId: obj.knapsack.id,
            count: obj.count,
          }
        }),
        function(res) {
          self.onCraftingSynthesizeSucceed(res, bindedData);
        },
        function(err, res) {
          if (null != err) {
           self.onCraftingSynthesizeFailed(null, bindedData);
           return;
          }
          switch (res.ret) {
            case constants.RET_CODE.INGREDIENT_PROGRESS_MAX_PER_PLAYER_BUILDABLE_BINDING_EXCEEDED:
              self.onCraftingSynthesizeFailed(res, bindedData);
            default:
              self.onCraftingSynthesizeFailed(res, bindedData);
              return;
          }
        },
      )
      panelIns.setState(window.AJAX_STATE.WAITING);
    } else if (ingredientProgress) {
      panelIns.setData(null, [null, ingredientProgress, null]);
      panelIns.setState(window.AJAX_STATE.SUCCEED);
      panelIns.onRefresh(null, ingredientProgress, null);
    }
    craftingSystemPanelIns.craftingButton.interactable = false;
    craftingSystemPanelIns.craftingButton.node.active = false;
    craftingSystemPanelIns.interactable = false;

    self.enterPanelView(panelIns);
  },

  sendSynthesizeQuery(statefulBuildableInstance, consumables, successCb, failCb) {
    const self = this;
    const queryParam = {
      intAuthToken: JSON.parse(cc.sys.localStorage.getItem("selfPlayer")).intAuthToken,
      reqSeqNum: Date.now(),
      targetBuildableId: statefulBuildableInstance.id,
      targetPlayerBuildableBindingId: statefulBuildableInstance.playerBuildableBinding.id,
      autoCollect: (0 == statefulBuildableInstance.autoCollect ? 0 : 1),
      consumables: ('string' === typeof consumables) ? consumables : JSON.stringify(consumables),
    };
    NetworkUtils.ajax({
      url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + ':' + backendAddress.PORT + constants.ROUTE_PATH.API +
        constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.KNAPSACK + constants.ROUTE_PATH.SYNTHESIZE,
      type: 'POST',
      data: queryParam,
      success: function(res) {
        if (constants.RET_CODE.INVALID_TOKEN == res.ret) {
          window.handleTokenExpired(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
          return;
        }
        if (
          res.ret == constants.RET_CODE.INGREDIENT_PROGRESS_MAX_PER_PLAYER_BUILDABLE_BINDING_EXCEEDED
        ) {
          failCb && failCb(null, res);
          return;
        }
        if (
            constants.RET_CODE.SUCCESSFUL_KNOWN_RECIPE_AND_KNOWN_INGREDIENT != res.ret
          && constants.RET_CODE.SUCCESSFUL_NEW_RECIPE_AND_KNOWN_INGREDIENT != res.ret
          && constants.RET_CODE.SUCCESSFUL_KNOWN_RECIPE_AND_NEW_INGREDIENT != res.ret
          && constants.RET_CODE.SUCCESSFUL_NEW_RECIPE_AND_NEW_INGREDIENT != res.ret
        ) {
          cc.warn(`Synthesize fails and ret == ${res.ret}`);
          failCb && failCb(null, res);
          return;
        }
        self.refreshKnapsackArray(res.knapsack);
        self.refreshPlayerRecipe(res.playerRecipeList);
        successCb && successCb(res);
      },
      error: function(err) {
        if (null != window.handleNetworkDisconnected) {
          window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
        }
        failCb && failCb(err, null);
      },
      timeout: function() { 
        if (null != window.handleNetworkDisconnected) {
          window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
        }
        failCb && failCb(new Error(constants.NETWORK.ERROR.TIMEOUT), null);
      },
    });
  },

  onCraftingSynthesizeSucceed(res, {craftingResultPanelIns, knapsacks, craftingSystemPanelIns}) {
    const self = this, retType = {
      isRecipeKnown: false,
      isIngredientKnown: false,
    };
    switch (res.ret) {
      case constants.RET_CODE.SUCCESSFUL_KNOWN_RECIPE_AND_KNOWN_INGREDIENT:
        retType.isRecipeKnown = true;
        retType.isIngredientKnown = true;
        break;
      case constants.RET_CODE.SUCCESSFUL_KNOWN_RECIPE_AND_NEW_INGREDIENT:
        retType.isRecipeKnown = true;
        retType.isIngredientKnown = false;
        break;
      case constants.RET_CODE.SUCCESSFUL_NEW_RECIPE_AND_KNOWN_INGREDIENT:
        retType.isRecipeKnown = false;
        retType.isIngredientKnown = true;
      case constants.RET_CODE.SUCCESSFUL_NEW_RECIPE_AND_NEW_INGREDIENT:
        retType.isRecipeKnown = false;
        retType.isIngredientKnown = false;
      default:
        cc.warn(`unknown return code ${res.ret} onCraftingSynthesizeSucceed`);
    }
    self.initIngredientItem(res.resultedIngredient);
    craftingSystemPanelIns.setData(self.getCraftableKnapsackArray());
    craftingSystemPanelIns.refresh();
    craftingResultPanelIns.setData(null, [res.resultedIngredient, res.ingredientProgressList[0], retType]);
    craftingResultPanelIns.setState(window.AJAX_STATE.SUCCEED);
  },

  onCraftingSynthesizeFailed(res, {craftingResultPanelIns, knapsacks, craftingSystemPanelIns}) {
    const self = this;
    craftingResultPanelIns.setState(window.AJAX_STATE.FAILED);
  },

  onStartDraggingIngredient(ingredientCell, evt) {
    const self = this;
    const touchLocation = evt.getLocation();
    const touchPosWrtCameraCentreScaledToMapNode = cc.v2(touchLocation.x, touchLocation.y).sub(cc.v2(self.canvasNode.width * self.canvasNode.anchorX, self.canvasNode.height * self.canvasNode.anchorY)).div(self.mainCamera.zoomRatio);

    if (!self.addDraggingIngredient()) {
      cc.warn('Duplicate addDraggingIngredient()!');
      return;
    }
    self.removeFloatingModalPopup();
    // WARNING: if you set floatingKnapsackPanelNode to unactive, then onDraggingIngredient will not be triggered.
    self.floatingKnapsackPanelIns.hide();
    self.draggingIngredientCell = ingredientCell;
    self.followingIngredientNode = ingredientCell.cloneDraggingTarget();
    self.followingIngredientNode.position = self.mainCameraNode.position.add(touchPosWrtCameraCentreScaledToMapNode);
    safelyAddChild(self.node, self.followingIngredientNode);
    setLocalZOrder(self.followingIngredientNode, window.CORE_LAYER_Z_INDEX.DRAGGING_INGREDIENT);

    if (null == self.draggingCancelAcceptorNode && null != self.draggingCancelAcceptorPrefab) {
      self.draggingCancelAcceptorNode = cc.instantiate(self.draggingCancelAcceptorPrefab);
      safelyAddChild(self.widgetsAboveAllNode, self.draggingCancelAcceptorNode);
      setLocalZOrder(self.draggingCancelAcceptorNode, window.CORE_LAYER_Z_INDEX.INFINITY);
    }
  },

  onDraggingIngredient(touchPosWrtCameraCentreScaledToMapNode, transformedImmediateDiffVec) {
    const self = this;
    if (self.isDraggingIngredientInsideCancelArea()) {
      self.draggingCancelAcceptorNode.stopAllActions();
      self.draggingCancelAcceptorNode.runAction(cc.repeatForever(
        cc.sequence(cc.fadeTo(0.5, 127), cc.fadeTo(0.5, 255))
      ));
    } else if (null != self.draggingCancelAcceptorNode) {
      self.draggingCancelAcceptorNode.stopAllActions();
      self.draggingCancelAcceptorNode.opacity = 255;
    }
    
    if (!self.isDraggingIngredient()) {
      cc.warn('OnDraggingIngredient called while mapIns is not in draggingIngredient state');
      return;
    }
    if (null == self.followingIngredientNode) {
      cc.warn('Required a not null followingIngredientNode');
      return;
    }
    self.followingIngredientNode.position = self.mainCameraNode.position.add(touchPosWrtCameraCentreScaledToMapNode);
  },

  isDraggingIngredientInsideCancelArea() {
    const self = this;
    if (null != self.followingIngredientNode || null != self.draggingCancelAcceptorNode) {
      // 坐标系是屏幕中心，x轴向右，y轴向上
      // draggingCancelAcceptorNode 在屏幕上方, anchor为0.5
      const touchPosInScreen = self.followingIngredientNode.position.sub(self.mainCameraNode.position).mul(self.mainCamera.zoomRatio);
     if (
        touchPosInScreen.y >= self.draggingCancelAcceptorNode.y - self.draggingCancelAcceptorNode.height / 2 &&
        touchPosInScreen.y <  self.draggingCancelAcceptorNode.y + self.draggingCancelAcceptorNode.height / 2
      ) {
        return true;
      } else {
        return false;
      }
    }
    return false;
  },

  onDropIngredient(evt) {
    console.log("onDropIngredient");
    const self = this;
    if (self.isDraggingIngredientInsideCancelArea()) {
      return self.onCancelDraggingIngredient();
    }
    if (null != self.draggingCancelAcceptorNode) {
      self.draggingCancelAcceptorNode.removeFromParent();
      self.draggingCancelAcceptorNode = null;
    }
    // WARNING: handle drop before remove followingIngredientNode.
    if (null != self.targetAcceptor) {
      // targetAcceptor.statefulBuildableInstance is trying  to receive ingredient
      const statefulBuildableInstance = self.targetAcceptor.statefulBuildableInstance;
      self.onStatefulBuildableReceiveIngredient(self.draggingIngredientCell, statefulBuildableInstance, self.targetAcceptor);
    } else {
      self.floatingKnapsackPanelIns.show();
    }
    if (null != self.followingIngredientNode) {
      self.followingIngredientNode.parent.removeChild(self.followingIngredientNode);
    }
    self.draggingIngredientCell = null;
    self.followingIngredientNode = null;
    self.removeDraggingIngredient();
    // To Cancel the animation for ingredient & statefulBuildable.
    if (null != self.targetAcceptor) {
      self.onIngredientAcceptOut(self.targetAcceptor.statefulBuildableInstance, self.targetAcceptor);
    }
    self.addFloatingModalPopup();
  },

  onCancelDraggingIngredient() {
    console.log("onCancelDraggingIngredient");
    const self = this;
    if (null != self.draggingCancelAcceptorNode) {
      self.draggingCancelAcceptorNode.removeFromParent();
      self.draggingCancelAcceptorNode = null;
    }
    if (null != self.draggingCancelAcceptorNode) {
      self.draggingCancelAcceptorNode.removeFromParent();
    }
    if (null != self.followingIngredientNode) {
      self.followingIngredientNode.parent.removeChild(self.followingIngredientNode);
    }
    self.draggingIngredientCell = null;
    self.followingIngredientNode = null;
    if (null != self.targetAcceptor) {  
      self.onIngredientAcceptOut(self.targetAcceptor.statefulBuildableInstance, self.targetAcceptor);
    }
    self.addFloatingModalPopup();
    if (null != self.floatingKnapsackPanelIns) {
      self.floatingKnapsackPanelIns.show();
    }
    self.removeDraggingIngredient();
  },

  onIngredientPageCellClicked(knapsackPanelIns, ingredientCell) {
    const self = this;
    knapsackPanelIns.interactable = false;
    let panelName = 'IngredientCellInfoPanel';
    if (self.viewingPanelManager.hasPanel(panelName)) {
      cc.warn('Already existing a same panel:', panelName);
      return;
    }
    let panelNode = cc.instantiate(self.ingredientCellInfoPanelPrefab),
        panelIns = panelNode.getComponent(panelName);

    // set panel's defaultActionsEnabled to false [begins].
    panelIns.defaultActionsEnabled = false;
    // set panel's defaultActionsEnabled to false [ends].

    panelIns.onCloseDelegate = () => {
      knapsackPanelIns.interactable = true;
      self.exitPanelView(panelIns);
      if (self.isFloatingModalPopup()) {
        self.floatingKnapsackPanelIns.show();
      }
    };
    panelIns.init(self);
    let buildablesToAcquireIngredient = [];
    // TODO: test getBuildablesToAcquireIngredient
    // buildablesToAcquireIngredient = self.getBuildablesToAcquireIngredient(ingredientCell.data.ingredient.id);
    panelIns.setData(ingredientCell.data.ingredient, buildablesToAcquireIngredient);
    panelIns.refresh();
    if (self.isFloatingModalPopup()) {
      self.floatingKnapsackPanelIns.hide();
    }
    self.enterPanelView(panelIns);
  },

  showIngredientCellInfoPanel(ingredientCell) {
    const self = this;
    let panelName = 'IngredientCellInfoPanel';
    if (self.viewingPanelManager.hasPanel(panelName)) {
      cc.warn('Already existing a same panel:', panelName);
      return;
    }
    let panelNode = cc.instantiate(self.ingredientCellInfoPanelPrefab),
        panelIns = panelNode.getComponent(panelName);

    // set panel's defaultActionsEnabled to false [begins].
    panelIns.defaultActionsEnabled = false;
    // set panel's defaultActionsEnabled to false [ends].

    panelIns.onCloseDelegate = () => {
      self.exitPanelView(panelIns);
    };
    panelIns.init(self);
    panelIns.setData(ingredientCell.data.ingredient, []);
    panelIns.refresh();
    self.enterPanelView(panelIns);
  },

  tryToProduceIngredient(produceWithIngredientProgressListPanelIns, ingredientCell) {
    const self = this;
    let ingredient = ingredientCell.data.ingredient,
        statefulBuildableInstance = produceWithIngredientProgressListPanelIns.statefulBuildableInstance;
    switch (ingredient.priceCurrency) {
    case constants.INGREDIENT.PRICE_CURRENCY.GOLD:
      self.costGoldsToDo(ingredient.priceValue, produce);
      break;
    default:
      console.warn(`unknown currency`, ingredient.priceCurrency);
      return;
    }
    function produce() {
      produceWithIngredientProgressListPanelIns.refreshIngredientPageCellPriceValueLabel();
      const queryParam = {
        intAuthToken: JSON.parse(cc.sys.localStorage.getItem("selfPlayer")).intAuthToken,
        reqSeqNum: Date.now(),
        ingredientId: ingredient.id,
        targetPlayerBuildableBindingId: statefulBuildableInstance.playerBuildableBinding.id,
        autoCollect: statefulBuildableInstance.autoCollect,
      };
      const bindedData = {
        produceWithIngredientProgressListPanelIns, ingredientCell,
        ingredient, statefulBuildableInstance
      };

      NetworkUtils.ajax({
        url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + ':' + backendAddress.PORT + constants.ROUTE_PATH.API +
          constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.INGREDIENT + constants.ROUTE_PATH.PRODUCE,
        type: 'POST',
        data: queryParam,
        success: function(res) {
          if (constants.RET_CODE.OK != res.ret) {
            if (constants.RET_CODE.INVALID_TOKEN == res.ret) {
              window.handleTokenExpired(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
              return;
            }
            self.onProduceIngredientFailed(res, bindedData);
            return;
          }
          self.onProduceIngredientSucceed(res, bindedData);
        },
        error: function() {
          if (null != window.handleNetworkDisconnected) {
            window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
          }
          self.onProduceIngredientFailed(null, bindedData);
        },
        timeout: function() {
          if (null != window.handleNetworkDisconnected) {
            window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
          }
          self.onProduceIngredientFailed(null, bindedData);
        }
      });
      produceWithIngredientProgressListPanelIns.ajaxProgressList.setState(window.AJAX_STATE.WAITING);
    }
  },

  onProduceIngredientFailed(res, {produceWithIngredientProgressListPanelIns}) {
    const self = this;
    produceWithIngredientProgressListPanelIns.ajaxProgressList.setState(window.AJAX_STATE.FAILED);
    if (res == null) {
      console.error(`net work error`);
      return;
    }
    if (constants.RET_CODE.INGREDIENT_PROGRESS_MAX_PER_PLAYER_BUILDABLE_BINDING_EXCEEDED == res.ret) {
      // TODO: Handle Produce too much.
      self.onProduceWhenReachMaxQueueLength();
      return;
    }
  },

  onProduceIngredientSucceed(res, {produceWithIngredientProgressListPanelIns}) {
    const self = this;
    produceWithIngredientProgressListPanelIns.setData(null, res.ingredientProgressList);
    produceWithIngredientProgressListPanelIns.refreshIngredientProgressList();
    produceWithIngredientProgressListPanelIns.ajaxProgressList.setState(window.AJAX_STATE.SUCCEED);
  },

  sendIngredientListQuery(targetPlayerBuildableBindingId, autoCollect, cb) {
    const self = this;
    const queryParam = {
      intAuthToken: JSON.parse(cc.sys.localStorage.getItem("selfPlayer")).intAuthToken,
      reqSeqNum: Date.now(),
      targetPlayerBuildableBindingId,
      autoCollect,
    };

    NetworkUtils.ajax({
      url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + ':' + backendAddress.PORT + constants.ROUTE_PATH.API +
        constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.PLAYER_BUILDABLE_BINDING + constants.ROUTE_PATH.INGREDIENT_LIST + constants.ROUTE_PATH.QUERY,
      type: 'POST',
      data: queryParam,
      success: function(res) {
        if (constants.RET_CODE.OK != res.ret) {
          //TODO: query failed.
          if (constants.RET_CODE.INVALID_TOKEN == res.ret) {
            window.handleTokenExpired(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
            return;
          }

          return;
        }
        self.refreshKnapsackArray(res.knapsack);

        res.ingredientList.forEach((ingredient) => self.initIngredientItem(ingredient));
        cb && cb({
          ingredientList: res.ingredientList,
          ingredientProgressList: res.ingredientProgressList,
        });
      },
      error: function() {
        //TODO: error occurs.
      },
    });

  },
  
  sendIngredientProgressCancelQuery({
    ingredientProgressId, autoCollect,
  }, cb) {
    const self = this;
    const queryParam = {
      intAuthToken: JSON.parse(cc.sys.localStorage.getItem("selfPlayer")).intAuthToken,
      reqSeqNum: Date.now(),
      ingredientProgressId,
      autoCollect,
    };

    NetworkUtils.ajax({
      url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + ':' + backendAddress.PORT + constants.ROUTE_PATH.API +
        constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.INGREDIENT_PROGRESS + constants.ROUTE_PATH.CANCEL,
      type: 'POST',
      data: queryParam,
      success: function(res) {
        if (constants.RET_CODE.OK != res.ret) {
          //TODO: query failed.
          if (constants.RET_CODE.INVALID_TOKEN == res.ret) {
            window.handleTokenExpired(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
            return;
          }

          return;
        }
        
        self.refreshKnapsackArray(res.knapsack);

        cb && cb({
          ingredientProgressList: res.ingredientProgressList,
        });
      },
      error: function() {
        //TODO: error occurs.
        if (null != window.handleNetworkDisconnected) {
          window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
        }
      },
      timeout: function() {
        if (null != window.handleNetworkDisconnected) {
          window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
        }
        //TODO: error occurs.
      },
    });

  },

  sendIngredientCollectQuery({
    targetPlayerBuildableBindingId
  }, cb) {
    const self = this;
    const queryParam = {
      intAuthToken: JSON.parse(cc.sys.localStorage.getItem("selfPlayer")).intAuthToken,
      reqSeqNum: Date.now(),
      targetPlayerBuildableBindingId
    };

    NetworkUtils.ajax({
      url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + ':' + backendAddress.PORT + constants.ROUTE_PATH.API +
        constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.PLAYER_BUILDABLE_BINDING + constants.ROUTE_PATH.INGREDIENT + constants.ROUTE_PATH.COLLECT,
      type: 'POST',
      data: queryParam,
      success: function(res) {
        if (constants.RET_CODE.OK != res.ret) {
          //TODO: query failed.
          if (constants.RET_CODE.INVALID_TOKEN == res.ret) {
            window.handleTokenExpired(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
            return;
          }

          return;
        }
        self.refreshKnapsackArray(res.knapsack);
        self.refreshPlayerRecipe(res.playerRecipeList);

        cb && cb({
          ingredientProgressList: res.ingredientProgressList,
        });
      },
      error: function() {
        //TODO: error occurs.
      },
    });
  },

  refreshIngredientProgressListEntry(statefulBuildableInstance, ingredientProgressList) {
    const self = this;
    if (null == self.statefulBuildableIngredientProgressListEntryPrefab) {
      console.warn("You're calling `BuildableMap.refreshIngredientProgressListEntry` with `null == self.statefulBuildableIngredientProgressListEntryPrefab`, if this is NOT in TowerSiege mode, then you should check whether a bug is to be tackled!");
      return;
    }
    let statefulBuildableIngredientProgressListEntryNode = statefulBuildableInstance.statefulBuildableIngredientProgressListEntryNode;
    // get StatefulBuildable's interactionType [begins].
    let interactionType = null;
    switch (statefulBuildableInstance.id) {
      case constants.STATELESS_BUILDABLE_ID.FARMLAND:
        interactionType = constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.SYNTHESIZE_CONSUMABLE;
        break;
      case constants.STATELESS_BUILDABLE_ID.RESTAURANT:
        interactionType = constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.RECLAIM;
        break;
      case constants.STATELESS_BUILDABLE_ID.BAKERY:
        interactionType = constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.SYNTHESIZE_TARGET;
        break;
      case constants.STATELESS_BUILDABLE_ID.HEADQUARTER:
        /*
        Deliberately not showing an IngredientProgress queue entry above HQ.       
  
        -- YFLu, 2019-11-09.
        */
        // interactionType = constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.PRODUCIBLE;
        break;
    }
    if (null == interactionType) {
      return;
    }
    // get StatefulBuildable's interactionType [ends].
    if (null == statefulBuildableIngredientProgressListEntryNode) {
      statefulBuildableIngredientProgressListEntryNode = cc.instantiate(self.statefulBuildableIngredientProgressListEntryPrefab);
      statefulBuildableInstance.statefulBuildableIngredientProgressListEntryNode = statefulBuildableIngredientProgressListEntryNode;
      statefulBuildableInstance.statefulBuildableIngredientProgressListEntryIns = statefulBuildableIngredientProgressListEntryNode.getComponent('StatefulBuildableIngredientProgressListEntry');
      statefulBuildableInstance.statefulBuildableIngredientProgressListEntryIns.autoRefreshEnabled = true;
      statefulBuildableInstance.statefulBuildableIngredientProgressListEntryIns.init(self, statefulBuildableInstance, interactionType);
      statefulBuildableInstance.statefulBuildableIngredientProgressListEntryNode.position = cc.v2(0, statefulBuildableInstance.calculateOffsetYToBuildableCenterTop());
      safelyAddChild(statefulBuildableInstance.node, statefulBuildableIngredientProgressListEntryNode);
    }
    let statefulBuildableIngredientProgressListEntryIns = statefulBuildableInstance.statefulBuildableIngredientProgressListEntryIns;
    statefulBuildableIngredientProgressListEntryIns.onRefresh = function(currentIngredientProgress, ingredientProgressList) {
      statefulBuildableInstance.refreshSkeletalAnimation();
    }
    statefulBuildableIngredientProgressListEntryIns.setData(ingredientProgressList);
    statefulBuildableIngredientProgressListEntryIns.refresh();
  },

  onStatefulBuildableIngredientProgressListEntryClicked(statefulBuildableInstance, statefulBuildableIngredientProgressListEntryIns) {
    const self = this;
    if (!self.isPurelyVisual() && !self.isFloatingModalPopup()) {
      return;
    }
    if (self.isFloatingModalPopup()) {
      self.floatingKnapsackPanelIns.onCloseClicked();
    }
    switch (statefulBuildableInstance.id) {
      case constants.STATELESS_BUILDABLE_ID.FARMLAND:
        self.onFarmlandIngredientProgressListEntryClicked(statefulBuildableInstance, statefulBuildableIngredientProgressListEntryIns);
        break;
      case constants.STATELESS_BUILDABLE_ID.RESTAURANT:
        self.onRestaurantIngredientProgressListEntryClicked(statefulBuildableInstance, statefulBuildableIngredientProgressListEntryIns);
        break;
      case constants.STATELESS_BUILDABLE_ID.BAKERY:
        self.onBakeryIngredientProgressListEntryClicked(statefulBuildableInstance, statefulBuildableIngredientProgressListEntryIns);
        break;
      case constants.STATELESS_BUILDABLE_ID.HEADQUARTER:
        self.onHeadquarterIngredientProgressListEntryClicked(statefulBuildableInstance, statefulBuildableIngredientProgressListEntryIns);
        break;
      case constants.STATELESS_BUILDABLE_ID.LABORATORY:
        self.onLaboratoryIngredientProgressListEntryClicked(statefulBuildableInstance, statefulBuildableIngredientProgressListEntryIns);
        break;
      default:
        console.warn(`Unknown statefulBuildableInstance's statefulBuildableIngredientProgressListEntry clicked.`, statefulBuildableInstance.id, statefulBuildableInstance.displayName);
    }
    return;
  },

  onLaboratoryIngredientProgressListEntryClicked(statefulBuildableInstance, statefulBuildableIngredientProgressListEntryIns) {
    const self = this;
    if (self.tryToCollectStatefulBuildableIngredientProgressListEntryIns(statefulBuildableInstance)) {
      return;
    } else {
      self.onStatefulBuildableInstanceClicked(statefulBuildableInstance.node, statefulBuildableInstance);
      self.onLabResearchButtonClicked(null);
    }
  },

  onHeadquarterIngredientProgressListEntryClicked(statefulBuildableInstance, statefulBuildableIngredientProgressListEntryIns) {
    const self = this;
    self.onStatefulBuildableInstanceClicked(statefulBuildableInstance.node, statefulBuildableInstance);
    self.onHQProductionButtonClicked(null);
  },

  onBakeryIngredientProgressListEntryClicked(statefulBuildableInstance, statefulBuildableIngredientProgressListEntryIns) {
    const self = this;
    if (self.tryToCollectStatefulBuildableIngredientProgressListEntryIns(statefulBuildableInstance)) {
      return;
    } else {
      self.onStatefulBuildableInstanceClicked(statefulBuildableInstance.node, statefulBuildableInstance);
      self.onBakeryProductionButtonClicked(null);
    }
  },

  onFarmlandIngredientProgressListEntryClicked(statefulBuildableInstance, statefulBuildableIngredientProgressListEntryIns) {
    const self = this, panelName = 'StatefulBuildableIngredientProgressListPanel';
    if (self.tryToCollectStatefulBuildableIngredientProgressListEntryIns(statefulBuildableInstance)) {
      return;
    }
    if (!statefulBuildableIngredientProgressListEntryIns.isEmpty() && !statefulBuildableIngredientProgressListEntryIns.hasSomeOneProducing()) {
      statefulBuildableIngredientProgressListEntryIns.playCollectAnim();
      statefulBuildableIngredientProgressListEntryIns.node.active = false;
      self.sendIngredientCollectQuery(
        {
          targetPlayerBuildableBindingId: statefulBuildableInstance.playerBuildableBinding.id,
        },
        function({ingredientProgressList}) {
          self.refreshIngredientProgressListEntry(statefulBuildableInstance, ingredientProgressList);
        }
      ); 
      return;
    }
    if (self.viewingPanelManager.hasPanel(panelName)) {
      cc.warn('Already existing a same panel:', panelName);
      return;
    }
    
    let panelNode = cc.instantiate(self.synthesizeProgressListPanelPrefab),
        panel = panelNode.getComponent(panelName);
    // set panel's defaultActionsEnabled to false [begins].
    panel.defaultActionsEnabled = false;
    // set panel's defaultActionsEnabled to false [ends].
    panel.init(self, statefulBuildableInstance);
    panel.setData(statefulBuildableIngredientProgressListEntryIns.data);
    panel.onRefresh = function(ingredientList, ingredientProgressList) {
      self.refreshIngredientProgressListEntry(statefulBuildableInstance, ingredientProgressList);
      if (self.floatingKnapsackPanelIns) {
        self.floatingKnapsackPanelIns.setData(self.knapsackArray);
        self.floatingKnapsackPanelIns.refresh();
      }
    };
    panel.onCloseDelegate = () => {
      statefulBuildableIngredientProgressListEntryIns.autoRefreshEnabled = true;
      self.exitPanelView(panel);
    };
    panel.refresh();
    statefulBuildableIngredientProgressListEntryIns.autoRefreshEnabled = false;
    self.enterPanelView(panel);
  },

  showGoldAdditionTip(node, goldCount, offsetY = 60) {
    const self = this;
    const ret = self.showNotificationAtNodeOuterTop(
      node,
      offsetY,
      self.goldObtainedNotificationPrefab,
      'DescriptionNotification',
      function initial(goldObtainedNotificationNode, goldObtainedNotificationIns, widgetIns) {
        widgetIns.enabled = false;
        goldObtainedNotificationIns.type = Notification.Type.AUTO_DISAPPEAR;
        goldObtainedNotificationIns.setTip(goldCount);
        let action = cc.moveBy(
          goldObtainedNotificationIns.durationMillis / 1000,
          cc.v2(0, 50)
        );
        
        window.runActionUnderOtherNode(goldObtainedNotificationNode, self.highlighterLayer.node, action);
        goldObtainedNotificationIns.appear();
      }
    );
    return ret;
  },

  showBuildOrUpgradeCompletedTip(statefulBuildableInstanceNode, offsetY = 60) {
    const self = this;
    self.showNotificationAtNodeOuterTop(
      statefulBuildableInstanceNode,
      offsetY,
      self.congratulationNotificationPrefab,
      'Notification',
      function initial(congratulationNotificationNode, congratulationNotificationIns, widgetIns) {
        widgetIns.enabled = false;
        congratulationNotificationIns.type = Notification.Type.AUTO_DISAPPEAR;
        let action = cc.fadeIn(congratulationNotificationIns.durationMillis / 1000);
        window.runActionUnderOtherNode(congratulationNotificationNode, self.highlighterLayer.node, action);
        congratulationNotificationIns.appear();
      }
    );
  },
  
  showNotificationAtNodeOuterTop(node, offsetY, prefab, specifiedComponentName, initialFunction) {
    const self = this;
    specifiedComponentName = specifiedComponentName || 'Notification';
    const notificationNode = cc.instantiate(prefab), notificationIns = notificationNode.getComponent(specifiedComponentName);
    let widgetIns = notificationNode.getComponent(cc.Widget) || notificationNode.addComponent(cc.Widget);
    widgetIns.isAlignBottom = true;
    widgetIns.bottom = offsetY + node.height;
    safelyAddChild(node, notificationNode);
    widgetIns.updateAlignment();
    initialFunction && initialFunction(notificationNode, notificationIns, widgetIns);
    return notificationIns;
  },

  onRestaurantIngredientProgressListEntryClicked(statefulBuildableInstance, statefulBuildableIngredientProgressListEntryIns) {
    const self = this, panelName = 'StatefulBuildableIngredientProgressListPanel';
    if (self.tryToCollectStatefulBuildableIngredientProgressListEntryIns(statefulBuildableInstance)) {
      return;
    }
    if (self.viewingPanelManager.hasPanel(panelName)) {
      cc.warn('Already existing a same panel:', panelName);
      return;
    }
    
    let panelNode = cc.instantiate(self.reclaimProgressListPanelPrefab),
        panel = panelNode.getComponent(panelName);
    // set panel's defaultActionsEnabled to false [begins].
    panel.defaultActionsEnabled = false;
    // set panel's defaultActionsEnabled to false [ends].
    panel.init(self, statefulBuildableInstance);
    panel.setData(statefulBuildableIngredientProgressListEntryIns.data);
    panel.collect = function() {
      panel.ingredientProgressList.collectButton.interactable = false;
      self.collectReclaimedIngredient(
        panel.ingredientProgressList.getIngredientProgressCells().filter(
          ingredientProgressCellIns => ingredientProgressCellIns.isCouldCollected()
        ).map(
          (ingredientProgressCellIns) => {
            return ingredientProgressCellIns.ingredientProgress;
          }
        ),
        function({
          priceAddition,
          newlyClaimedIngredientProgressList
        }) {
          panel.ingredientProgressList.collectButton.interactable = true;
        }
      );
    };
    panel.onRefresh = function(ingredientList, ingredientProgressList) {
      self.refreshIngredientProgressListEntry(statefulBuildableInstance, ingredientProgressList);
      if (self.floatingKnapsackPanelIns) {
        self.floatingKnapsackPanelIns.setData(self.knapsackArray);
        self.floatingKnapsackPanelIns.refresh();
      }
    };
    panel.onCloseDelegate = () => {
      statefulBuildableIngredientProgressListEntryIns.autoRefreshEnabled = true;
      self.exitPanelView(panel);
    };
    panel.refresh();
    statefulBuildableIngredientProgressListEntryIns.autoRefreshEnabled = false;
    statefulBuildableIngredientProgressListEntryIns.ingredientProgressListPanelIns = panel;
    self.enterPanelView(panel);
  },

  tryToCollectStatefulBuildableIngredientProgressListEntryIns(statefulBuildableInstance) {
    const self = this;
    const statefulBuildableIngredientProgressListEntryIns = statefulBuildableInstance.statefulBuildableIngredientProgressListEntryIns
    if (null != statefulBuildableIngredientProgressListEntryIns
      && !statefulBuildableIngredientProgressListEntryIns.isEmpty()
      && !statefulBuildableIngredientProgressListEntryIns.hasSomeOneProducing()
    ) {
      switch(statefulBuildableInstance.id) {
      case constants.STATELESS_BUILDABLE_ID.FARMLAND:
      case constants.STATELESS_BUILDABLE_ID.BAKERY:
      case constants.STATELESS_BUILDABLE_ID.LABORATORY:
        statefulBuildableIngredientProgressListEntryIns.playCollectAnim();
        statefulBuildableIngredientProgressListEntryIns.node.active = false;
        self.sendIngredientCollectQuery(
          {
            targetPlayerBuildableBindingId: statefulBuildableInstance.playerBuildableBinding.id,
          },
          function({ingredientProgressList}) {
            self.refreshIngredientProgressListEntry(statefulBuildableInstance, ingredientProgressList);
          }
        );
        break;
      case constants.STATELESS_BUILDABLE_ID.RESTAURANT:
        statefulBuildableIngredientProgressListEntryIns.playCollectAnim();
        statefulBuildableIngredientProgressListEntryIns.node.active = false;
        self.collectReclaimedIngredient(
          statefulBuildableIngredientProgressListEntryIns.data.filter(
            function(ingredientProgress) {
              switch (ingredientProgress.state) {
                case constants.INGREDIENT_PROGRESS_STATE.RECLAIMED_TO_BE_MANUALLY_COLLECTED:
                  return true;
                default:
                  return false;
              }
            }
          ),
          function({
            priceAddition,
            newlyClaimedIngredientProgressList
          }) {
            self.showGoldAdditionTip(statefulBuildableInstance.node, priceAddition.gold);
          }
        );
        break;
      default:
        return false;
      }
      return true;
    }
    return false;
  },

  onIngredientAcceptIn(statefulBuildableInstance, statefulBuildableIngredientAcceptorIns) {
    const self = this;
    if (null != self.targetAcceptor) {
      return;
    }
    self.targetAcceptor = statefulBuildableIngredientAcceptorIns;
    let statefulBuildableIngredientInteractionList = self.getStatefulBuildableIngredientInteractionList(statefulBuildableInstance);
    if (
      null == statefulBuildableIngredientInteractionList.find((interaction) => {
        switch (interaction.type) {
        case constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.SYNTHESIZE_CONSUMABLE:
        case constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.RECLAIM:
          return interaction.ingredientId == self.draggingIngredientCell.ingredient.id;
        default:
          return false;
        }
      })
    ) {
      statefulBuildableInstance.playWrongIngredientAcceptAnim();
    } else {
      statefulBuildableInstance.playRightIngredientAcceptAnim();
    }
  },

  onIngredientAcceptOut(statefulBuildableInstance, statefulBuildableIngredientAcceptorIns) {
    const self = this;
    if (null == self.targetAcceptor || self.targetAcceptor != statefulBuildableIngredientAcceptorIns) {
      // WARNING: not only one statefulBuildableIngredientAcceptorIns.onCollisionExit would be called.
      return;
    }
    self.targetAcceptor = null;
    statefulBuildableInstance.stopIngredientAcceptAnim();
  },

  onStatefulBuildableReceiveIngredient(ingredientCell, statefulBuildableInstance, statefulBuildableIngredientAcceptorIns) {
    const self = this;
    const statefulBuildableIngredientInteractionList = self.getStatefulBuildableIngredientInteractionList(statefulBuildableInstance);
    const ingredient = ingredientCell.data.ingredient;
    const targetBuildableIngredientInteraction = statefulBuildableIngredientInteractionList.find((interaction) => {
      switch (interaction.type) {
      case constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.SYNTHESIZE_CONSUMABLE:
      case constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.RECLAIM:
        return interaction.ingredientId == ingredient.id;
      default:
        return false;
      }
    });
    if (null == targetBuildableIngredientInteraction) {
      self.onDropIngredientFailed(i18n.t("Tip.DropIngredientFailed.wrongTarget"));
      return;
    }
    if (
         statefulBuildableInstance.isBuilding()
      || statefulBuildableInstance.isNewing()
      || statefulBuildableInstance.isUpgrading()
    
    ) {
      self.onDropIngredientFailed(i18n.t("Tip.DropIngredientFailed.buildable"));
      return;
    }

    if (targetBuildableIngredientInteraction.type == constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.SYNTHESIZE_CONSUMABLE) {
      self.sendSynthesizeQuery(
        statefulBuildableInstance,
        [
          {
            knapsackId: ingredientCell.data.id,
            count: 1
          }
        ],
        function(res) {
          self.onDropIngredientResultedSucceed(res, statefulBuildableInstance);
        },
        function(err, res) {
          if (null != err) {
            self.onDropIngredientFailed("ERROR!");
            return;
          }
          switch(res.ret) {
          case constants.RET_CODE.INGREDIENT_PROGRESS_MAX_PER_PLAYER_BUILDABLE_BINDING_EXCEEDED:
            self.onDropIngredientFailed(
              i18nExtend.render("Tip.DropIngredientFailed.queueFulled", { displayName: i18n.t("BuildingInfo.DisplayName." + statefulBuildableInstance.displayName), })
            );
            break;
          default:
            self.onDropIngredientFailed(i18n.t("Tip.DropIngredientFailed.recipe"));
            break;
          }
        }
      );
    } else if (targetBuildableIngredientInteraction.type == constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.RECLAIM) {
      self.sendReclaimQuery(statefulBuildableInstance, ingredient, function(res) {
        self.onDropIngredientResultedSucceed(res, statefulBuildableInstance);
      }, function(err, res) {
        if (null == err) {
          if (res.ret == constants.RET_CODE.INGREDIENT_PROGRESS_MAX_PER_PLAYER_BUILDABLE_BINDING_EXCEEDED) {
            self.onDropIngredientFailed(
              i18nExtend.render("Tip.DropIngredientFailed.queueFulled", { displayName: i18n.t("BuildingInfo.DisplayName." + statefulBuildableInstance.displayName), })
            );
          } else if (res.ret != constants.RET_CODE.OK) {
            if (constants.RET_CODE.INVALID_TOKEN == res.ret) {
              window.handleTokenExpired(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
              return;
            }

            self.onDropIngredientFailed(i18n.t("Tip.DropIngredientFailed.reclaim"));
          } else {
            self.onDropIngredientFailed("ERROR!");
          }
        } else {
          self.onDropIngredientFailed("ERROR!");
        } 
        
      });
    }
  },

  sendReclaimQuery(statefulBuildableInstance, ingredient, succeedCb, failCb) {
    const self = this;
    const queryParam = {
      intAuthToken: JSON.parse(cc.sys.localStorage.getItem("selfPlayer")).intAuthToken,
      reqSeqNum: Date.now(),
      targetPlayerBuildableBindingId: statefulBuildableInstance.playerBuildableBinding.id,
      targetIngredientList: JSON.stringify({
        [ingredient.id]: 1,
      })
    };
    NetworkUtils.ajax({
      url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + ':' + backendAddress.PORT + constants.ROUTE_PATH.API +
        constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.KNAPSACK + constants.ROUTE_PATH.RECLAIM,
      type: 'POST',
      data: queryParam,
      success: function(res) {
        if (constants.RET_CODE.OK == res.ret) {
          self.refreshKnapsackArray(res.knapsack);
          succeedCb && succeedCb(res);
        } else {
          if (constants.RET_CODE.INVALID_TOKEN == res.ret) {
            window.handleTokenExpired(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
            return;
          }
          failCb && failCb(null, res);
        }
      },
      timeout: function() {
        if (null != window.handleNetworkDisconnected) {
          window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
        }
        failCb && failCb(new Error(constants.NETWORK.ERROR.TIMEOUT), null);
      },
      error: function(err) {
        if (null != window.handleNetworkDisconnected) {
          window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
        }
        // TODO: Buildable synthesize failed.
        failCb && failCb(err, null);
      },
    });
  },

  sendReclaimQueryForSeveralIngredient(statefulBuildableInstance, ingredientMap, succeedCb, failCb) {
    // ingredientMap: { ingredientId: count }
    const self = this;
    const queryParam = {
      intAuthToken: JSON.parse(cc.sys.localStorage.getItem("selfPlayer")).intAuthToken,
      reqSeqNum: Date.now(),
      targetPlayerBuildableBindingId: statefulBuildableInstance.playerBuildableBinding.id,
      targetIngredientList: JSON.stringify(ingredientMap)
    };
    NetworkUtils.ajax({
      url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + ':' + backendAddress.PORT + constants.ROUTE_PATH.API +
        constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.KNAPSACK + constants.ROUTE_PATH.RECLAIM,
      type: 'POST',
      data: queryParam,
      success: function(res) {
        if (constants.RET_CODE.OK == res.ret) {
          self.refreshKnapsackArray(res.knapsack);
          succeedCb && succeedCb(res);
        } else {
          if (constants.RET_CODE.INVALID_TOKEN == res.ret) {
            window.handleTokenExpired(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
            return;
          }
          failCb && failCb(null, res);
        }
      },
      timeout: function() {
        if (null != window.handleNetworkDisconnected) {
          window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
        }
        failCb && failCb(new Error(constants.NETWORK.ERROR.TIMEOUT), null);
      },
      error: function(err) {
        // TODO: Buildable synthesize failed.
        if (null != window.handleNetworkDisconnected) {
          window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
        }
        failCb && failCb(err, null);
      },
    });
  },

  onDropIngredientResultedSucceed(res, statefulBuildableInstance) {
    const self = this;
    self.refreshIngredientProgressListEntry(statefulBuildableInstance, res.ingredientProgressList);
    self.floatingKnapsackPanelIns.setData(self.knapsackArray);
    self.floatingKnapsackPanelIns.refresh();
    self.floatingKnapsackPanelIns.show();
  },

  refreshPopupEntry() {
    const self = this;
    // WARNING: when mapIns.state increased, update this.
    let showUpon = {
      boostButton: true, listEntry: true,
    };
    do {
      if (self.isInNarrativeScene()) {
        showUpon.boostButton = false;
        showUpon.listEntry = true;
        break;
      }
      if (self.isPurelyVisual() || self.isFloatingModalPopup()) {
        showUpon.boostButton = true;
        showUpon.listEntry = true;
      }
      if (
        self.isShowingModalPopup()
        ||
        self.isDraggingIngredient()
        ||
        self.isPositioningNewStatefulBuildableInstance()
        ||
        self.isEditingExistingStatefulBuildableInstance()
        ||
        self.isInIapWaiting()
      ) {
        showUpon.boostButton = false;
        showUpon.listEntry = false;
      }
    } while(false);
    showUpon.boostButton = mapIns.boostEnabled && showUpon.boostButton;
    for (let i in self.statefulBuildableInstanceCompList) {
      const statefulBuildableInstance = self.statefulBuildableInstanceCompList[i];
      if (showUpon.boostButton) {
        statefulBuildableInstance.enableBoostButton();
      } else {
        statefulBuildableInstance.disableBoostButton();
      }
      if (null != statefulBuildableInstance.statefulBuildableIngredientProgressListEntryIns) {
        if (showUpon.listEntry) {
          statefulBuildableInstance.statefulBuildableIngredientProgressListEntryIns.show();
        } else {
          statefulBuildableInstance.statefulBuildableIngredientProgressListEntryIns.hide();
        }
      }
    }
    return showUpon;
  },


  onDropIngredientFailed(tip) {
    const self = this;
    const simplePressToGoDialogNode = cc.instantiate(self.simplePressToGoDialogPrefab);
    simplePressToGoDialogNode.setPosition(cc.v2(0, 0));
    const simplePressToGoDialogScriptIns = simplePressToGoDialogNode.getComponent("SimplePressToGoDialog");
    simplePressToGoDialogScriptIns.mapIns = self;
    simplePressToGoDialogScriptIns.onCloseDelegate = () => {
      self.exitPanelView(simplePressToGoDialogScriptIns);
      self.floatingKnapsackPanelIns.show();
    };
    simplePressToGoDialogScriptIns.setHintLabel(tip);
    self.enterPanelView(simplePressToGoDialogScriptIns);
    return;
  },

  getStatefulBuildableIngredientInteractionList(statefulBuildableInstance, specifiedIntercationType=null) {
    const self = this, buildableId = statefulBuildableInstance.playerBuildableBinding.buildable.id;
    return self.filterBuildableIngredientInteractionByBuildableId(buildableId, specifiedIntercationType);
  },

  filterBuildableIngredientInteractionByBuildableId(buildableId, specifiedIntercationType=null) {
    const self = this;
    let targetInteractionList = self.buildableIngredientInteractionList.filter(buildableIngredientInteraction => {
      return buildableIngredientInteraction.buildableId == buildableId;
    });
    if (null != specifiedIntercationType) {
      return targetInteractionList.filter(function(buildableIngredientInteraction) {
        return buildableIngredientInteraction.type == specifiedIntercationType;
      });
    } else {
      return targetInteractionList;
    }
  },

  collectReclaimedIngredient(ingredientProgressList, callback) {
    const self = this;
    const unHoldingIngredientProgressList = [];
    ingredientProgressList.forEach((ingredientProgress) => {
      if (-1 == self.toReclaimIngredientProgressIdList.indexOf(ingredientProgress.id)) {
        self.toReclaimIngredientProgressIdList.push(ingredientProgress.id);
        unHoldingIngredientProgressList.push(ingredientProgress);
      }
    });
    let priceAddition = {
      gold: 0, diamond: 0,
    };

    unHoldingIngredientProgressList.forEach((ingredientProgress) => {
      // WARNING: reclaimed ingredient must from knapsack!!!
      let ingredient = self.findIngredientFromKnapsack(ingredientProgress.ingredientId);
      switch (ingredient.reclaimPriceCurrency) {
        case constants.INGREDIENT.PRICE_CURRENCY.GOLD:
          priceAddition.gold += ingredient.reclaimPriceValue * ingredientProgress.targetIngredientCount;
          break;
        case constants.INGREDIENT.PRICE_CURRENCY.DIAMOND:
          priceAddition.diamond += ingredient.reclaimPriceValue * ingredientProgress.targetIngredientCount;
          break;
        default:
          console.warn('unkonwn ingredient priceCurrency');
          break;
      }
    });
    self.widgetsAboveAllScriptIns.walletInfo.setData({
      gold: self.wallet.gold + priceAddition.gold,
      diamond: self.wallet.diamond + priceAddition.diamond,
    }); 

    // 请求后端同步数据 [begins].
    self.saveAllPlayerSyncData(null, (err, res) => {
      if (err) {
        console.error(err);
        return;
      }
      callback && callback({
        priceAddition: priceAddition,
        newlyClaimedIngredientProgressList: res.newlyClaimedIngredientProgressList || [],
      });
    });
    // 请求后端同步数据 [ends].
  },

  getIngredientAppearance(ingredientId) {
    const self = this;
    let plistName = ingredientId;
    return self.ingredientSpriteFrameMap[plistName];
  },

  playEffectCommonCongrat() {
    if (null == this.commonCongratAudioClip) return;
    cc.audioEngine.playEffect(this.commonCongratAudioClip, false);
  },

  playEffectCommonFailure() {
    if (null == this.commonFailureAudioClip) return;
    cc.audioEngine.playEffect(this.commonFailureAudioClip, false);
  },

  playEffectCommonBuildableDestroying() {
    if (null == this.commonBuildableDestroyingAudioClip) return;
    cc.audioEngine.playEffect(this.commonBuildableDestroyingAudioClip, false);
  },

  playEffectCollectGold() {
    if (null == this.collectGoldAudioClip) return;
    cc.audioEngine.playEffect(this.collectGoldAudioClip, false);
  },

  playEffectBulletLinearAoe(targetScriptIns) {
    let targetAudioClip = this.bulletLinearAoeAudioClipForBuildable;
    if (null != targetScriptIns) {
      switch (targetScriptIns.node.name) {
      case "StatefulBuildableInstance":
        targetAudioClip = this.bulletLinearAoeAudioClipForBuildable;
      break;
      case "EscapingAttackingNpc":
        targetAudioClip = this.bulletLinearAoeAudioClipForNpc;
      break;
      }
    }
    if (null == targetAudioClip) {
      return;
    }
    // console.log("BuildableMap.playEffectBulletAoe()", " at ", Date.now());
    cc.audioEngine.playEffect(targetAudioClip, false);
  },

  playEffectBulletLinearSingle(targetScriptIns) {
    let targetAudioClip = this.bulletLinearSingleTargetAudioClipForBuildable;
    if (null != targetScriptIns) {
      switch (targetScriptIns.node.name) {
      case "StatefulBuildableInstance":
        targetAudioClip = this.bulletLinearSingleTargetAudioClipForBuildable;
      break;
      case "EscapingAttackingNpc":
        targetAudioClip = this.bulletLinearSingleTargetAudioClipForNpc;
      break;
      }
    }
    if (null == targetAudioClip) {
      return;
    }
    // console.log("BuildableMap.playEffectBulletSingleTarget()", " at ", Date.now());
    cc.audioEngine.playEffect(targetAudioClip, false);
  },

  playEffectBulletInvisible(targetScriptIns) {
    let targetAudioClip = this.bulletInvisibleAudioClipForBuildable;
    if (null != targetScriptIns) {
      switch (targetScriptIns.node.name) {
      case "StatefulBuildableInstance":
        targetAudioClip = this.bulletInvisibleAudioClipForBuildable;
      break;
      case "EscapingAttackingNpc":
        targetAudioClip = this.bulletInvisibleAudioClipForNpc;
      break;
      }
    }
    if (null == targetAudioClip) {
      return;
    }
    // console.log("BuildableMap.playEffectBulletInvisible()", " at ", Date.now());
    cc.audioEngine.playEffect(targetAudioClip, false);
  },

  costGoldsToDo(requiredGold, callback) {
    const self = this;
    let currentGoldInWallet = self.wallet.gold;
    if (requiredGold > self.wallet.goldLimit) {
      const simplePressToGoDialogNode = cc.instantiate(self.simplePressToGoDialogPrefab);
      simplePressToGoDialogNode.setPosition(cc.v2(0, 0));
      const simplePressToGoDialogScriptIns = simplePressToGoDialogNode.getComponent("SimplePressToGoDialog");
      simplePressToGoDialogScriptIns.mapIns = self;
      simplePressToGoDialogScriptIns.onCloseDelegate = () => {
        self.exitPanelView(simplePressToGoDialogScriptIns);
      };
      simplePressToGoDialogScriptIns.setHintLabel(i18n.t("Tip.requiredGoldTooMuch"));
      self.enterPanelView(simplePressToGoDialogScriptIns);
      return;
    }
    if (currentGoldInWallet < requiredGold) {
      const neededGold = requiredGold - currentGoldInWallet;
      self.showCostDiamondsToBuyGoldPanel(neededGold, function() {
        self.costDiamondsToBuyGold(self.countDiamondToBuyGold(neededGold), function() {
          currentGoldInWallet = self.wallet.gold;
          self.widgetsAboveAllScriptIns.walletInfo.setData({
            gold: currentGoldInWallet - requiredGold,
          });
          callback && callback(currentGoldInWallet, self.wallet.gold);
        });
      });
      return false;
    } else {
      self.widgetsAboveAllScriptIns.walletInfo.setData({
        gold: currentGoldInWallet - requiredGold,
      });
      callback && callback(currentGoldInWallet, self.wallet.gold);
      return true;
    }
  },

  costDiamondsToDo(requiredDiamonds, callback, callbackOnDiamondNotEnough) {
    const self = this;
    let currentDiamondInWallet = self.wallet.diamond;
    if (currentDiamondInWallet < requiredDiamonds) {
      callbackOnDiamondNotEnough && callbackOnDiamondNotEnough(currentDiamondInWallet, requiredDiamonds);
      self.clearPanels();
      self.showIapItemPanel(null, null);
      return false;
    } else {
      self.widgetsAboveAllScriptIns.walletInfo.setData({
        diamond: self.wallet.diamond - requiredDiamonds,
      });
      callback && callback(currentDiamondInWallet, self.wallet.diamond);
      return true;
    }
  },

  findIngredientFromKnapsack(ingredientId) {
    const self = this;
    let target = self.findKnapsackItemForIngredient(ingredientId);
    return target && target.ingredient;
  },

  findKnapsackItemForIngredient(ingredientId) {
    const self = this;
    return self.knapsackArray.find(x => x.ingredient.id == ingredientId);
  },

  onProduceWhenReachMaxQueueLength() {
    const self = this;
    const simplePressToGoDialogNode = cc.instantiate(self.simplePressToGoDialogPrefab);
    simplePressToGoDialogNode.setPosition(cc.v2(0, 0));
    const simplePressToGoDialogScriptIns = simplePressToGoDialogNode.getComponent("SimplePressToGoDialog");
    simplePressToGoDialogScriptIns.mapIns = self;
    simplePressToGoDialogScriptIns.onCloseDelegate = () => {
      self.exitPanelView(simplePressToGoDialogScriptIns);
    };
    simplePressToGoDialogScriptIns.setHintLabel(i18n.t("ProduceWithIngredientProgressListPanel.Tip.reachMaxQueueLength"));
    self.enterPanelView(simplePressToGoDialogScriptIns);
    return;
  },
  
  tryToBoostIngredientProgressList(statefulBuildableInstance, duration, succeedCb, failCb) {
    const self = this, panelName = 'CostDiamondsConfirmationPanel';
    if (self.viewingPanelManager.hasPanel(panelName)) {
      cc.warn('Already existing a same panel:', panelName);
      return;
    }
    let costDiamond = self.countDiamondForBoostDurationMillis(duration);
    let panelNode = cc.instantiate(self.costDiamondsConfirmationPanelPrefab),
        panel = panelNode.getComponent(panelName);
    // set panel's defaultActionsEnabled to false [begins].
    panel.defaultActionsEnabled = false;
    // set panel's defaultActionsEnabled to false [ends].
    panel.init(self, costDiamond, null);
    panel.render('boost');
    panel.onConfirmDelegate = () => {
      self.costDiamondsToDo(costDiamond, query, function() {
        failCb && failCb(null);
      });
      panel.onCloseClicked(null);
    };
    panel.onCloseDelegate = () => {
      self.exitPanelView(panel);
      if (!panel.isConfirmed) {
        failCb && failCb(null);
      }
    };
    self.enterPanelView(panel);

    function query() {
      const queryParam = {
        intAuthToken: JSON.parse(cc.sys.localStorage.getItem("selfPlayer")).intAuthToken,
        reqSeqNum: Date.now(),
        targetPlayerBuildableBindingId: statefulBuildableInstance.playerBuildableBinding.id,
        autoCollect: statefulBuildableInstance.autoCollect,
      };

      NetworkUtils.ajax({
        url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + ':' + backendAddress.PORT + constants.ROUTE_PATH.API +
          constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.INGREDIENT_PROGRESS + constants.ROUTE_PATH.BOOSTING,
        type: 'POST',
        data: queryParam,
        success: function(res) {
          if (constants.RET_CODE.OK != res.ret) {
            //TODO: query failed.
            if (constants.RET_CODE.INVALID_TOKEN == res.ret) {
              window.handleTokenExpired(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
              return;
            }
            failCb && failCb(new Error(res.ret));
            return;
          }
          self.refreshKnapsackArray(res.knapsack);
          succeedCb && succeedCb({
            ingredientList: null,
            ingredientProgressList: res.ingredientProgressList,
          });
          self.saveAllPlayerSyncData();
        },
        error: function(err) {
          //TODO: error occurs.
          failCb && failCb(err);
        },
      });
    }

  },

  isRecipeSynthesizable(playerRecipe) {
    const self = this;
    if (
      playerRecipe.state == constants.RECIPE.LOCKED_DISPLAY_NAME_CONSUMABLES_UNKNOWN
      ||
      (null == playerRecipe.recipeId || 0 == playerRecipe.recipeId)
    ) {
      return false;
    }

    // TODO: return true if the consumables of ingredient is enough else false.
    for (let consumable of playerRecipe.recipe.consumables) {
      let knapsackItem = self.findKnapsackItemForIngredient(consumable.ingredientId);
      if (!knapsackItem || knapsackItem.currentCount < consumable.count) {
        return false;
      }
    }
    return true;
  },
  
  getRecipeListBySynthesizeTargetIngedient(ingredient) {
    const self = this;
    return self.recipeArray.filter((playerRecipeItem) => {
      return playerRecipeItem.targetIngredient.id == ingredient.id;
    });
  },

  getPlayerRecipeById(recipeId) {
    const self = this;
    return self.recipeArray.find((playerRecipeItem) => {
      return playerRecipeItem.recipeId == recipeId;
    });
  },

  getHqPlayerRecipeByIngredientId(ingredientId) {
    const self = this;
    return self.hqRecipeArray.find((playerRecipeItem) => {
      return playerRecipeItem.targetIngredient.id == ingredientId;
    })
  },

  onRecipeButtonClicked(evt) {
    const self = this;
    if (null != evt) {
      self.playEffectCommonButtonClick();
    }
    if (self.isShowingModalPopup()) {
      return;
    }
    let panelName = 'PlayerRecipePanel';
    if (!self.playerRecipePanelNode) {
      self.playerRecipePanelNode = cc.instantiate(self.playerRecipePanelPrefab);
      self.playerRecipePanelIns = self.playerRecipePanelNode.getComponent(panelName);
    }
    let panelNode = self.playerRecipePanelNode,
        panelIns = panelNode.getComponent(panelName);
    // set panel's defaultActionsEnabled to false [begins].
    panelIns.defaultActionsEnabled = false;
    // set panel's defaultActionsEnabled to false [ends].

    panelIns.onCloseDelegate = () => {
      self.exitPanelView(panelIns);
    };
    panelIns.init(self);
    
    let playerRecipeList = self.recipeArray.filter(function(playerRecipe) {
      return playerRecipe.state == constants.RECIPE.STATE.LOCKED_DISPLAY_NAME_CONSUMABLES_KNOWN
          || playerRecipe.state == constants.RECIPE.STATE.UNLOCKED;
    });

    panelIns.setData(playerRecipeList);
    self.enterPanelView(panelIns);
    panelIns.refresh();
    panelIns.setState(window.AJAX_STATE.SUCCEED);

  },

  getProducibleIngredientList() {
    const self = this;

    return self.hqRecipeArray.filter(
      (playerRecipeItem) => {
        return playerRecipeItem.state == constants.RECIPE.STATE.UNLOCKED;
      }
    ).map(
      (playerRecipeItem) => {
        return playerRecipeItem.targetIngredient;
      }
    );
  },

  isIngredientProducible(ingredient) {
    const self = this;
    return null != self.hqRecipeArray.find(
      (playerRecipeItem) => {
        return playerRecipeItem.state == constants.RECIPE.STATE.UNLOCKED && playerRecipeItem.targetIngredient.id == ingredient.id;
      }
    )
  },

  isIngredientUnlocked(ingredient) {
    const self = this;
    return null != self.recipeArray.find((playerRecipeItem) => {
      return playerRecipeItem.state != constants.RECIPE.STATE.LOCKED_DISPLAY_NAME_CONSUMABLES_UNKNOWN && playerRecipeItem.targetIngredient.id == ingredient.id;
    }) || null != self.hqRecipeArray.find(
      (playerRecipeItem) => {
        return playerRecipeItem.state == constants.RECIPE.STATE.UNLOCKED && playerRecipeItem.targetIngredient.id == ingredient.id;
      }
    );
  },

  getIngredientById(ingredientId) {
    const self = this;
    return self.ingredientMap[ingredientId] || null;
  },

  addStateBit() {
    const self = this, rs = NarrativeSceneManagerDelegate.prototype.addStateBit.apply(self, arguments);
    if (rs) {
      self.refreshPopupEntry();
    }
    return rs;
  },

  removeStateBit() {
    const self = this, rs = NarrativeSceneManagerDelegate.prototype.removeStateBit.apply(self, arguments);
    self.refreshPopupEntry();
    return rs;
  },

  refreshLockedButtonByBuildable() {
    const self = this;
    let isLaboratoryBuildDone = self.statefulBuildableInstanceCompList.find((statefulBuildableInstance) => {
      return statefulBuildableInstance.id == constants.STATELESS_BUILDABLE_ID.LABORATORY && !statefulBuildableInstance.isBuilding();
    }) != null;
    self.widgetsAboveAllScriptIns.recipeButton.node.active = isLaboratoryBuildDone;
    self.widgetsAboveAllScriptIns.ingredientButton.node.active = false;
  },

  synthesizeRecipe(statefulBuildableInstance, playerRecipe, successCb, failCb) {
    const self = this;
    if (!self.isRecipeSynthesizable(playerRecipe)) {
      failCb && failCb(null);
      return;
    }
    self.sendSynthesizeQuery(
      statefulBuildableInstance,
      playerRecipe.recipe.consumables.map(function(consumable) {
        return {
          knapsackId: self.findKnapsackItemForIngredient(consumable.ingredientId).id,
          count: consumable.count,
        }
      }),
      successCb,
      failCb
    );
  },

  onBakeryProductionButtonClicked(evt) {
    const self = this;
    if (null != evt) {
      self.playEffectCommonButtonClick();
    }
    if (!self.isEditingExistingStatefulBuildableInstance()) {
      console.warn(`You can not call this when mapIns.state is not editingExistingStatefulBuildableInstance!`);
      return;
    }
    const floatingRecipePanelNode = cc.instantiate(self.floatingRecipePanelPrefab);
    const floatingRecipePanelIns = floatingRecipePanelNode.getComponent('FloatingRecipePanel');
    let statefulBuildableInstance = self.editingStatefulBuildableInstance;
    floatingRecipePanelIns.defaultActionsEnabled = false;
    floatingRecipePanelIns.fixed = true;
    floatingRecipePanelIns.closeSelfOnBlur = true;
    floatingRecipePanelIns.init(self, statefulBuildableInstance);
    // Filter the ingredient [begin].
    // recipe should matched: unlocked

    let interactionMapForSynthesizeTarget = self.getStatefulBuildableIngredientInteractionList(statefulBuildableInstance)
      .reduce(function(interactionMapForSynthesizeTarget, interaction) {
        if (interaction.type == constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.SYNTHESIZE_TARGET) {
          interactionMapForSynthesizeTarget[interaction.ingredientId] = interaction;
        }
        return interactionMapForSynthesizeTarget;
      }, {});
    let targetRecipeList = self.getStatefulBuildableRecipeList(statefulBuildableInstance).filter((playerRecipe) => {
      return playerRecipe.state == constants.RECIPE.STATE.UNLOCKED
          || playerRecipe.state == constants.RECIPE.STATE.LOCKED_DISPLAY_NAME_CONSUMABLES_KNOWN;
    }).filter(function(playerRecipe) {
      return interactionMapForSynthesizeTarget.hasOwnProperty(playerRecipe.targetIngredient.id);
    });

    // Filter the ingredient [end].

    floatingRecipePanelIns.setData(targetRecipeList, []);
    floatingRecipePanelIns.refresh();
    floatingRecipePanelIns.onCloseDelegate = function() {
      self.refreshIngredientProgressListEntry(statefulBuildableInstance, floatingRecipePanelIns.ingredientProgressList);
      let statefulBuildableIngredientProgressListEntryIns = statefulBuildableInstance.statefulBuildableIngredientProgressListEntryIns;
      if (null != statefulBuildableIngredientProgressListEntryIns) {
        statefulBuildableIngredientProgressListEntryIns.autoRefreshEnabled = true;
      }
      self.exitPanelView(floatingRecipePanelIns);
    };
    self.moveCameraToPosition(statefulBuildableInstance.node.position, 0.3, function() {
      self.enterPanelView(floatingRecipePanelIns);
    });
    floatingRecipePanelIns.setState(window.AJAX_STATE.WAITING);
    self.sendIngredientListQuery(
      statefulBuildableInstance.playerBuildableBinding.id,
      statefulBuildableInstance.autoCollect,
      function({
        ingredientList,
        ingredientProgressList,
      }) {
        floatingRecipePanelIns.setData(floatingRecipePanelIns.recipeList, ingredientProgressList);
        floatingRecipePanelIns.refresh();
        floatingRecipePanelIns.onRefresh && floatingRecipePanelIns.onRefresh();
        floatingRecipePanelIns.setState(window.AJAX_STATE.SUCCEED);
      }
    );
    floatingRecipePanelIns.onRefresh = function() {
      self.refreshIngredientProgressListEntry(statefulBuildableInstance, floatingRecipePanelIns.ingredientProgressList);
      let statefulBuildableIngredientProgressListEntryIns = statefulBuildableInstance.statefulBuildableIngredientProgressListEntryIns;
      if (null != statefulBuildableIngredientProgressListEntryIns) {
        statefulBuildableIngredientProgressListEntryIns.autoRefreshEnabled = false;
        statefulBuildableIngredientProgressListEntryIns.hide();
      }
      floatingRecipePanelIns.statefulBuildableInstance.cloneAnimation(floatingRecipePanelIns.highlightedStatefulBuildableInstanceNode);
    }
  },

  moveCameraToPosition(positionInMap, duration=0.3, callback=null) {
    const self = this;
    let onReachedTargetPosition = function() {
      callback && callback.call(self);
    }
    let sequence = cc.sequence([
      cc.moveTo(duration, positionInMap),
      cc.callFunc(onReachedTargetPosition)
    ]);
    self.mainCameraNode.stopAllActions();
    if (self.mainCameraNode.position.equals(positionInMap)) {
      onReachedTargetPosition();
    } else {
      if (duration > 0) {
        self.mainCameraNode.runAction(sequence);
      } else {
        self.mainCameraNode.setPosition(positionInMap);
        onReachedTargetPosition();
      }
    }
  },

  getStatefulBuildableRecipeList(statefulBuildableInstance) {
    const self = this;
    const recipeMapForSynthesizable = self.getStatefulBuildableIngredientInteractionList(statefulBuildableInstance)
      .reduce(function(recipeMapForSynthesizable, interaction) {
        if (interaction.type == constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.SYNTHESIZABLE) {
          if (!interaction.recipeId) {
            console.warn(`interaction with type SYNTHESIZABLE required a recipeId!!!`)
            return recipeMapForSynthesizable;
          }
          recipeMapForSynthesizable[interaction.recipeId] = interaction;
        }
        return recipeMapForSynthesizable;
      }, {});
    return self.recipeArray.filter(function(playerRecipe) {
      return recipeMapForSynthesizable.hasOwnProperty(playerRecipe.recipeId);
    });
  },

  refreshBuildButtonCountTip() {
    const self = this;
    let notificationIns = self.buildButton.notificationIns;
    if (null == notificationIns) {
      self.showNotificationAtNodeOuterTop(
        self.buildButton.node,
        0,
        self.countNotificationPrefab,
        'DescriptionNotification',
        function(notificationNode, notificationIns, widgetIns) {
          notificationIns.type = Notification.Type.PERSISTENT;
          widgetIns.enabled = false;
          notificationNode.x = self.buildButton.node.width / 2 - 2;
          notificationNode.y = self.buildButton.node.height / 2 - 2;
          self.buildButton.notificationIns = notificationIns;
        }
      );
      notificationIns = self.buildButton.notificationIns;
    }
    let sum = 0;
    for (let statelessBuildableInstance of self.statelessBuildableInstanceList) {
      if (true == self.toIgnoreBuildableIds.includes(statelessBuildableInstance.id)) {
        continue;
      }
      let currentlyBuiltLength = self.getStatefulBuildableInstanceListByBuildableId(statelessBuildableInstance.id).length;
      let toRet = self.determineCurrentlyLimitedCountAndLevel(statelessBuildableInstance.id);
      sum += toRet.currentlyLimitedCountToBuild - currentlyBuiltLength;
    }
    
    if (sum <= 0 || self.isInNarrativeScene()) {
      notificationIns.disappear();
    } else {
      safelyAddChild(self.buildButton.node, notificationIns.node);
      notificationIns.setTip(sum);
      notificationIns.appear();
    }
    return;
  },

  refreshMissionButtonCountTip() {
    const self = this;
    let targetMissionButtons = [
      self.missionButton, self.achievementButton,
    ];
    let targetPlayerMissionBindingList = [
      self.playerMissionBindingList,
      self.playerMissionBindingListForAchievement.concat(self.playerMissionBindingListForDailyMission),
    ];
    for (let i = 0; i < targetMissionButtons.length; i++) {
      let missionButton = targetMissionButtons[i];
      let playerMissionBindingList = targetPlayerMissionBindingList[i];
      let notificationIns = missionButton.notificationIns;
      if (null == notificationIns) {
        self.showNotificationAtNodeOuterTop(
          missionButton.node,
          0,
          self.countNotificationPrefab,
          'DescriptionNotification',
          function(notificationNode, notificationIns, widgetIns) {
            notificationIns.type = Notification.Type.PERSISTENT;
            widgetIns.enabled = false;
            notificationNode.x = missionButton.node.width / 2 - 2;
            notificationNode.y = missionButton.node.height / 2 - 2;
            missionButton.notificationIns = notificationIns;
          }
        );
        notificationIns = missionButton.notificationIns;
      }
      if (null == playerMissionBindingList) {
        notificationIns.disappear();
      }

      let sum = playerMissionBindingList.reduce(function(sum, playerMission) {
        if (playerMission.state == constants.MISSION_STATE.COMPLETED) {
          sum += 1;
        }
        return sum;
      }, 0);
      if (sum <= 0) {
        notificationIns.disappear();
      } else {
        safelyAddChild(missionButton.node, notificationIns.node);
        notificationIns.setTip(sum);
        notificationIns.appear();
      }
    }
    return;
  },

  onStatefulBuildableInstanceCreated() {
    const self = this;
    self.refreshBuildButtonCountTip();
  },

  onRecipeTargetIngredientClicked(playerRecipePanel, ingredientCell, specifiedRecipeList, specifiedBuildableId) {
    const self = this;
    let panelName = "RecipeInfoPanel";
    if (self.viewingPanelManager.hasPanel(panelName)) {
      cc.warn('Already existing a same panel:', panelName);
      return false;
    }
    let panelNode = cc.instantiate(self.recipeInfoPanelPrefab),
        panelIns = panelNode.getComponent(panelName);
    // set panel's defaultActionsEnabled to false [begins].
    panelIns.defaultActionsEnabled = false;
    // set panel's defaultActionsEnabled to false [ends].

    panelIns.onCloseDelegate = () => {
      self.exitPanelView(panelIns);
    };
    panelIns.init(self, specifiedBuildableId);
    const ingredient = ingredientCell.ingredient;
    let playerRecipeList = specifiedRecipeList || self.getRecipeListBySynthesizeTargetIngedient(ingredient).filter(function(playerRecipe) {
      return playerRecipe.state == constants.RECIPE.STATE.LOCKED_DISPLAY_NAME_CONSUMABLES_KNOWN
          || playerRecipe.state == constants.RECIPE.STATE.UNLOCKED;
    });

    panelIns.setData(ingredient, playerRecipeList);
    self.enterPanelView(panelIns);
    panelIns.refresh();
  },
  
  onPlayerIngredientButtonClicked(evt) {
    const self = this;
    if (null == self.playerIngredientPanelPrefab) {
      console.warn("You're calling `BuildableMap.onPlayerIngredientButtonClicked` with `null == self.playerIngredientPanelPrefab`, if this is NOT in TowerSiege mode, then you should check whether a bug is to be tackled!");
      return;
    }
    if (null != evt) {
      self.playEffectCommonButtonClick();
    }
    if (self.isShowingModalPopup()) {
      return;
    }
    let panelName = 'PlayerIngredientPanel';
    if (null == self.playerIngredientPanelNode) {
      self.playerIngredientPanelNode = cc.instantiate(self.playerIngredientPanelPrefab);
      self.playerIngredientPanelIns = self.playerIngredientPanelNode.getComponent(panelName);
    }
    const ingredientList = Object.values(self.ingredientMap).sort(function(a, b) {
      return a.id - b.id;
    });
    let panelNode = self.playerIngredientPanelNode,
        panelIns = panelNode.getComponent(panelName);
    // set panel's defaultActionsEnabled to false [begins].
    panelIns.defaultActionsEnabled = false;
    // set panel's defaultActionsEnabled to false [ends].

    panelIns.onCloseDelegate = () => {
      self.exitPanelView(panelIns);
    };
    panelIns.init(self);
    panelIns.setData(ingredientList);
    self.enterPanelView(panelIns);
    panelIns.refresh();
  },
  onPlayerMissionButtonClicked(evt) {
    const self = this;
    if (null != evt) {
      self.playEffectCommonButtonClick();
    }
    if (self.isShowingModalPopup()) {
      return;
    }
    let panelName = 'PlayerMissionPanel';
    if (self.viewingPanelManager.hasPanel(panelName)) {
      cc.warn('Already existing a same panel:', panelName);
      return false;
    }
    if(!self.playerMissionPanelNode){
      self.playerMissionPanelNode = cc.instantiate(self.playerMissionPanelPrefab);
      self.playerMissionPanelIns = self.playerMissionPanelNode.getComponent(panelName);
    }
    let panelNode = self.playerMissionPanelNode,
        panelIns = self.playerMissionPanelIns;
    panelIns.init(self);
    panelIns.onCloseDelegate = function() {
      self.exitPanelView(panelIns);
    }
    self.enterPanelView(panelIns);
    panelIns.onRefresh = function() {
      self.getMissionList(function(res, shouldRefreshMissionGUI){
        const missionList = self.playerMissionBindingList || [];
        if (shouldRefreshMissionGUI) {
          panelIns.setData(missionList);
          panelIns.refresh();
        }
      });
    };
    panelIns.onMissionDisplay = function(playerMission) {
      self.showPlayerQuestPanel(playerMission);
    },
    panelIns.onRefresh();
  },

  showPlayerQuestPanel(playerMission) {
    const self = this;
    let panelName = 'PlayerQuestPanel';
    if (self.viewingPanelManager.hasPanel(panelName)) {
      cc.warn('Already existing a same panel:', panelName);
      return false;
    }
    if(!self.playerQuestPanelNode){
      self.playerQuestPanelNode = cc.instantiate(self.playerQuestPanelPrefab);
      self.playerQuestPanelIns = self.playerQuestPanelNode.getComponent(panelName);
    }
    let panelNode = self.playerQuestPanelNode,
        panelIns = self.playerQuestPanelIns;
    panelIns.init(self);
    panelIns.setData(playerMission);
    panelIns.onCloseDelegate = function() {
      self.exitPanelView(panelIns);
    }
    panelIns.onClaimReward = function(playerMission) {
      self.obtainMissionReward(playerMission.id, function(res) {
        self.showMissionClaimRewardPanel(playerMission);
        if (null != self.playerMissionBindingList) {
          res.unclaimedPlayerMissionBindingList.forEach(function(playerMissionId) {
            let targetPlayerMission = self.playerMissionBindingList.find(function(playerMission) {
              return playerMission.id == playerMissionId;
            });
            if (null != targetPlayerMission) {
              self.claimMissionReward(targetPlayerMission.id, targetPlayerMission.giftList);
            }
          });
        }
        if (self.toClaimPlayerMissionBindingIdList.length > 0) {
          self.saveAllPlayerSyncData();
        }
      });
    }
    self.enterPanelView(panelIns);
    panelIns.refresh();
  },

  showMissionClaimRewardPanel(playerMission) {
    const self = this;
    let panelName = 'MissionClaimRewardPanel';
    if (self.viewingPanelManager.hasPanel(panelName)) {
      cc.warn('Already existing a same panel:', panelName);
      return false;
    }
    if(!self.missionClaimRewardPanelNode){
      self.missionClaimRewardPanelNode = cc.instantiate(self.missionClaimRewardPanelPrefab);
    }
    let panelNode = self.missionClaimRewardPanelNode,
        panelIns = panelNode.getComponent(panelName);
    panelIns.init(self);
    panelIns.setData(playerMission);
    panelIns.onCloseDelegate = function() {
      self.exitPanelView(panelIns);
    }
    self.enterPanelView(panelIns);
    panelIns.refresh();
  },

  getMissionList(callback, failCb) {
    const self = this;
    if (!self.missionEnabled) {
      failCb && failCb(null, null);
      return;
    }
    const selfPlayerStr = cc.sys.localStorage.getItem("selfPlayer");
    if (null == selfPlayerStr) {
      failCb && failCb(null, null);
      return;
    }
    let selfPlayer = null;
    try {
      selfPlayer = JSON.parse(selfPlayerStr); 
    } catch (e) {
      console.error(e);
      return;
    }
    
    NetworkUtils.ajax({
      url: backendAddress.PROTOCOL + "://" + backendAddress.HOST + ":" + backendAddress.PORT + constants.ROUTE_PATH.API + constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.MISSIONLIST + constants.ROUTE_PATH.QUERY,
      type: 'POST',
      data: {
        intAuthToken: selfPlayer.intAuthToken,
      },
      success: function(res){
        if (null == self || null == self.node || !cc.isValid(self.node)) {
          return;
        }
        if (constants.RET_CODE.OK == res.ret) {
          // claim mission rewards for state == COMPLETED_OBTAINED.
          if (null == res.playerMissionBindingList) {
            res.playerMissionBindingList = [];
          }

          let shouldRefreshMissionGUI = self.updatePlayerMissionBindingList(res.playerMissionBindingList);

          self.refreshQuestCompletedMapForDailyMission();
          self.refreshQuestCompletedMapForAchievement();
          res.playerMissionBindingList.forEach(function(playerMission) {
            if (playerMission.state == constants.MISSION_STATE.COMPLETED_OBTAINED) {
              self.claimMissionReward(playerMission.id, playerMission.giftList);
            }
          });
          if (self.toClaimPlayerMissionBindingIdList.length) {
            self.saveAllPlayerSyncData();
          }
          callback && callback(res, shouldRefreshMissionGUI);
        } else {
          if (constants.RET_CODE.INVALID_TOKEN == res.ret) {
            window.handleTokenExpired(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
            return;
          }
          failCb && failCb(null, res); 
          console.warn("Send mission query failed, return code is:", res.ret);
        }
      },
      error: function(err) {
        if (null != window.handleNetworkDisconnected) {
          window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
        }
        failCb && failCb(err, null);
      },
      timeout: function() {
        if (null != window.handleNetworkDisconnected) {
          window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
        }
        failCb && failCb(new Error(constants.NETWORK.ERROR.TIMEOUT), null);
      },
    });
  },

  updatePlayerMissionBindingList(playerMissionBindingList) {
    // If return true, it means that you should refresh the gui.
    // Initialization or refresh.
    const self = this;
    let isDataModified = false, isDataDirty = false;
    // Determine isDataModified or isDataDirty. [begin] {
    if (Object.keys(self.playerMissionBindingMap).length != playerMissionBindingList.length) {
      isDataModified = true;
    }
    for (let playerMissionBinding of playerMissionBindingList) {
      if (isDataModified) {
        break;
      }
      let oldPlayerMissionBinding = self.playerMissionBindingMap[playerMissionBinding.id];
      if (null == oldPlayerMissionBinding) {
        isDataModified = true;
        break;
      } else if (playerMissionBinding.state != oldPlayerMissionBinding.state) {
        isDataDirty = true;
        oldPlayerMissionBinding.state = playerMissionBinding.state;
      }
      for (let playerQuestBinding of playerMissionBinding.playerQuestBindingList) {
        let oldPlayerQuestBinding = self.playerQuestBindingMap[playerQuestBinding.id];
        if (null == oldPlayerQuestBinding) {
          isDataModified = true;
          break;
        } else if (oldPlayerQuestBinding.completedCount != playerQuestBinding.completedCount) {
          isDataDirty = true;
          oldPlayerQuestBinding.completedCount = playerQuestBinding.completedCount;
        }
      }
    }
    // Determine isDataModified or isDataDirty. [end] }
    if (isDataModified) {
      self.playerMissionBindingList = playerMissionBindingList.filter(function(playerMissionBinding) {
        return playerMissionBinding.type == constants.MISSION_TYPE.SIMPLE_MISSION && playerMissionBinding.reproductive == constants.MISSION_REPRODUCTIVE.SIMPLE_MISSION;
      });
      self.playerMissionBindingListForAchievement = playerMissionBindingList.filter(function(playerMissionBinding) {
        return playerMissionBinding.type == constants.MISSION_TYPE.ACHIEVEMENT;
      });
      self.playerMissionBindingListForDailyMission = playerMissionBindingList.filter(function(playerMissionBinding) {
        return playerMissionBinding.type == constants.MISSION_TYPE.SIMPLE_MISSION && playerMissionBinding.reproductive == constants.MISSION_REPRODUCTIVE.DAILY_MISION;
      });
      self.playerMissionBindingMap = {};
      self.reversePlayrMissionBindingMap = {};
      self.playerQuestBindingMap = {};
      for (let playerMissionBinding of playerMissionBindingList) {
        self.playerMissionBindingMap[playerMissionBinding.id] = playerMissionBinding;
        for (let playerQuestBinding of playerMissionBinding.playerQuestBindingList) {
          self.reversePlayrMissionBindingMap[playerQuestBinding.id] = playerMissionBinding;
          self.playerQuestBindingMap[playerQuestBinding.id] = playerQuestBinding;
        }
      }
   }
   return isDataModified || isDataDirty;
  },

  obtainMissionReward(playerMissionBindingId, callback, failCb) {
    const self = this;
    NetworkUtils.ajax({
      url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + ':' + backendAddress.PORT + constants.ROUTE_PATH.API + constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.MISSIONREWARD + constants.ROUTE_PATH.OBTAIN,
      type: 'POST',
      data: {
        intAuthToken: JSON.parse(cc.sys.localStorage.getItem("selfPlayer")).intAuthToken,
        playerMissionBindingId: playerMissionBindingId,
      },
      success: function(res){
        if (constants.RET_CODE.OK == res.ret) {
          callback && callback(res);
        } else {
          if (constants.RET_CODE.INVALID_TOKEN == res.ret) {
            window.handleTokenExpired(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
            return;
          }
          failCb && failCb(null, res);
          console.log("Send obtain mission reward failed, return code is:", res.ret);
        }
      },
      error: function(err) {
        if (null != window.handleNetworkDisconnected) {
          window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
        }
        failCb && failCb(err, null);
      },
      timeout: function() {
        if (null != window.handleNetworkDisconnected) {
          window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
        }
        failCb && failCb(new Error(constants.NETWORK.ERROR.TIMEOUT), null);
      },
    });
  },

  claimMissionReward(playerMissionBindingId, giftList) {
    const self = this;
    if (self.toClaimPlayerMissionBindingIdList.indexOf(playerMissionBindingId) != -1) {
      return;
    }
    let goldGift = giftList.find(function(gift) {
      return gift.addResourceType == constants.RESOURCE_TYPE.GOLD;
    }), diamondGift = giftList.find(function(gift) {
      return gift.addResourceType == constants.RESOURCE_TYPE.DIAMOND;
    });
    self.toClaimPlayerMissionBindingIdList.push(playerMissionBindingId);
    self.widgetsAboveAllScriptIns.walletInfo.setData({
      gold: mapIns.wallet.gold + (null == goldGift ? 0 : goldGift.addValue),
      diamond: mapIns.wallet.diamond + (null == diamondGift ? 0 : diamondGift.addValue),
    });
  },

  getUnlockIngredientIdsAfterBuildableUpgradeDone(buildableId, fromLevel, toLevel, producibleOnly=false) {
    const self = this;
    let producibleInteractionList = self.filterBuildableIngredientInteractionByBuildableId(buildableId, constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.PRODUCIBLE);
    let unlockIngredientIds = producibleInteractionList.filter(function(interaction) {
      return interaction.buildableLevelToUnlockDisplayName > fromLevel && interaction.buildableLevelToUnlockDisplayName <= toLevel;
    }).map(function(interaction) {
      return interaction.ingredientId;
    });
    if (!producibleOnly) {
      let willUnlockRecipeIntercationList = self.filterBuildableIngredientInteractionByBuildableId(buildableId, constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.WILL_UNLOCK_RECIPE);
      let willUnlockRecipeIds = willUnlockRecipeIntercationList.filter(function(interaction) {
        return interaction.buildableLevelToUnlockDisplayName > fromLevel && interaction.buildableLevelToUnlockDisplayName <= toLevel;
      }).map(function(interaction) {
        return interaction.recipeId;
      });
      willUnlockRecipeIds.forEach(function(recipeId) {
        let targetIngredientId = self.getRecipeById(recipeId).targetIngredient.id;
        if (unlockIngredientIds.indexOf(targetIngredientId) == -1) {
          unlockIngredientIds.push(targetIngredientId);
        }
      });
    }
    return unlockIngredientIds;
  },

  getRecipeById(recipeId) {
    const self = this;
    return self.getPlayerRecipeById(recipeId).recipe;
  },

  getBuildableAndLevelForUnlockingIngredient(ingredientId) {
    const self = this;
    let targetBuildableId = null, targetBulidableLevel = null;
    self.buildableIngredientInteractionList.forEach(function(interaction) {
      if (
        interaction.type == constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.PRODUCIBLE
        &&
        interaction.ingredientId == ingredientId
      ) {
        targetBuildableId = interaction.buildableId;
        targetBulidableLevel = interaction.buildableLevelToUnlockDisplayName;
      }
    });
    if (null == targetBuildableId) {
      let enableBuildableMap = {};
      self.buildableIngredientInteractionList.forEach(function(interaction) {
        if (
          interaction.type == constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.WILL_UNLOCK_RECIPE
        ) {
          let recipeTargetIngredient = self.getPlayerRecipeById(interaction.recipeId).targetIngredient;
          if (recipeTargetIngredient.id != ingredientId) {
            return;
          }
          if (!enableBuildableMap.hasOwnProperty(interaction.buildableId)) {
            enableBuildableMap[interaction.buildableId] = interaction.buildableLevelToUnlockDisplayName;
          } else {
            enableBuildableMap[interaction.buildableId] = Math.min(enableBuildableMap[interaction.buildableId], interaction.buildableLevelToUnlockDisplayName);
          }
        }
      });
      let buildables = Object.keys(enableBuildableMap);
      if (buildables.length > 1) {
        console.warn(`Why ingredient ${ingredientId} could be unlocked by more than one buildable?`);
      }
      if (!buildables.length) {
        console.warn(`Is there missing the type 6 interaction for ingredient ${ingredientId}?`);
      }
      targetBuildableId = buildables[0];
      targetBulidableLevel = enableBuildableMap[targetBuildableId];
    }
    return {
      buildableId: targetBuildableId,
      statelessBuildableInstance: self.statelessBuildableInstanceList.find(function(statelessBuildableInstance) {
        return statelessBuildableInstance.id == targetBuildableId;
      }),
      level: targetBulidableLevel,
    };
  },

  getBuildablesToAcquireIngredient(ingredientId) {
    const self = this;
    let enableBuildableMap = {};
    function addValue(buildableId, value) {
      if (!enableBuildableMap.hasOwnProperty(buildableId)) {
        enableBuildableMap[buildableId] = value;
      } else {
        enableBuildableMap[buildableId] = Math.min(value, enableBuildableMap[buildableId]);
      }
    }
    let interactionList = self.buildableIngredientInteractionList.filter(function(interaction) {
      return (
        interaction.type == constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.PRODUCIBLE
        ||
        interaction.type == constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.SYNTHESIZE_TARGET
      ) && ingredientId == interaction.ingredientId;
    });
    interactionList.forEach(function(interaction) {
      if (interaction.type == constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.PRODUCIBLE) {
        addValue(interaction.buildableId, interaction.buildableLevelToUnlockDisplayName);
      } else if (interaction.type == constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.SYNTHESIZE_TARGET) {
        let targetRecipeSynthesizableInteraction = self.buildableIngredientInteractionList.find(function(synthesizableInteraction) {
          if (
            synthesizableInteraction.type != constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.SYNTHESIZABLE
            ||
            synthesizableInteraction.buildableId != interaction.buildableId
          ) {
            return false;
          }
          let targetIngredient = self.getPlayerRecipeById(synthesizableInteraction.recipeId).targetIngredient;
          return targetIngredient.id == ingredientId;
        });
        if (null != targetRecipeSynthesizableInteraction) {
          addValue(targetRecipeSynthesizableInteraction.buildableId, targetRecipeSynthesizableInteraction.buildableLevelToUnlockDisplayName);
        }
      }
    });
    let buildableIds = Object.keys(enableBuildableMap);
    return buildableIds.sort(function(a, b) {
      return a - b;
    }).map(function(buildableId) {
      let statelessBuildableInstance = self.statelessBuildableInstanceList.find(function(statelessBuildableInstance) {
        return statelessBuildableInstance.id == buildableId
      });
      return {
        buildableId: buildableId,
        count: 1,
        level: enableBuildableMap[buildableId],
        appearance: statelessBuildableInstance.appearance[enableBuildableMap[buildableId]],
      }
    });
  },

  getStatefulBuildableInstanceListByBuildableId(buildableId) {
    const self = this;
    return self.statefulBuildableInstanceCompList.filter(function(statefulBuildableInstance) {
      return statefulBuildableInstance.id == buildableId;
    });
  },

  getMinimunLevelToSynthesizePlayerRecipe(playerRecipe, buildableId) {
    const self = this;
    if (null == playerRecipe) {
      return -1;
    }
    return self.buildableIngredientInteractionList.find(function(interaction) {
      return interaction.type == constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.SYNTHESIZABLE
          && interaction.buildableId == buildableId
          && interaction.recipeId == playerRecipe.recipeId;
    }).buildableLevelToUnlockDisplayName;
  },

  isStatefulBuildableInstanceProducingSomething(statefulBuildableInstance) {
    const self = this;
    const statefulBuildableIngredientProgressListEntryIns = statefulBuildableInstance.statefulBuildableIngredientProgressListEntryIns;
    return null != statefulBuildableIngredientProgressListEntryIns &&
      statefulBuildableIngredientProgressListEntryIns.hasSomeOneProducing();
  },

  removeStatefulBuildable(statefulBuildableCompIns) {
    if (null == statefulBuildableCompIns) {
      return;
    }
    /*
    Handling all of the followings.

    - window.globalShelterChainVerticeMap
    - mapIns.barrierColliders
    - mapIns.ingredientAcceptorMap
    - statefulBuildableCompIns.boundFollowingNpcDict
      - window.reverseStatefulBuildableFollowingNpcDestinationDict // If removed together with its "boundStatefulBuildable"
      - mapIns.statefulBuildableFollowingNpcScriptInsDict
    - mapIns.statefulBuildableInstanceList // Actually the "playerBuildableBindingList".
    - mapIns.statefulBuildableInstanceCompList
    */
    const self = this;

    self.playEffectCommonBuildableDestroying();

    // Handles "mapIns.editingStatefulBuildableInstance".
    if (null != mapIns.editingStatefulBuildableInstance && mapIns.editingStatefulBuildableInstance.node.uuid == statefulBuildableCompIns.node.uuid) {
      mapIns.onCancelBuildButtonClicked(null);
    }

    // Handles "window.globalShelterChainVerticeMap".
    let tailShelterNode = statefulBuildableCompIns.node.tailShelterNode;
    let headShelterNode = statefulBuildableCompIns.node.headShelterNode; 
    // force trigger PolygonBoundaryShelter.onCollisionExit
    tailShelterNode.removeFromParent();
    headShelterNode.removeFromParent();
    window.removeFromGlobalShelterChainVerticeMap(statefulBuildableCompIns.node);

    // Handles "mapIns.barrierColliders". 
    self.clearTheBoundaryColliderInfoForStatefulBuildableInstance(statefulBuildableCompIns);
    window.refreshCachedKnownBarrierGridDict(self.node, self.barrierColliders, null);

    // Handles "statefulBuildableCompIns.boundFollowingNpcDict".
    for (let k in statefulBuildableCompIns.boundFollowingNpcDict) {
      const theFollowingNpc = statefulBuildableCompIns.boundFollowingNpcDict[k];
      if (theFollowingNpc.node && theFollowingNpc.node.parent) {
        theFollowingNpc.node.destroy();
      } 
    }

    // Handles "mapIns.statefulBuildableInstanceList".
    let toSpliceIndexOfStatefulBuildableInstanceList = null; 
    for (let k in this.statefulBuildableInstanceList) {
      if (this.statefulBuildableInstanceList[k].id == statefulBuildableCompIns.playerBuildableBinding.id) {
        toSpliceIndexOfStatefulBuildableInstanceList = k;
        break; 
      }
    }
    if (null != toSpliceIndexOfStatefulBuildableInstanceList) {
      this.statefulBuildableInstanceList.splice(toSpliceIndexOfStatefulBuildableInstanceList, 1);
    }
    
    // Handles "mapIns.ingredientAcceptorMap".
    self.clearIngredientAcceptor(statefulBuildableCompIns);

    // Handles "mapIns.statefulBuildableInstanceCompList".
    let toSpliceIndexOfStatefulBuildableCompList = null; 
    for (let k in this.statefulBuildableInstanceCompList) {
      if (this.statefulBuildableInstanceCompList[k].playerBuildableBinding.id == statefulBuildableCompIns.playerBuildableBinding.id) {
        toSpliceIndexOfStatefulBuildableCompList = k;
        break; 
      }
    }
    if (null != toSpliceIndexOfStatefulBuildableCompList) {
      this.statefulBuildableInstanceCompList.splice(toSpliceIndexOfStatefulBuildableCompList, 1);
    }

    if (statefulBuildableCompIns.node && statefulBuildableCompIns.node.parent) {
      statefulBuildableCompIns.node.removeFromParent();
    }

    // clear the lawn for statefulBuildableCompIns.
    self.cancelLawnForStatefulBuildableInstance(statefulBuildableCompIns);

    // When used in StageMap will automatically ignore appropriate "toIgnoreBuildableIds".
    self.refreshStatelessBuildableInstanceCardListDisplay();
  },
  
  filterBuildableIngredientInteractionByIngredientId(ingredientId, specifiedIntercationType) {
    const self = this;
    return self.buildableIngredientInteractionList.filter(function(interaction) {
      if (null != specifiedIntercationType && interaction.type != specifiedIntercationType) {
        return;
      }
      if (null != interaction.ingredientId) {
        return interaction.ingredientId == ingredientId;
      } else {
        let playerRecipe = self.getPlayerRecipeById(interaction.recipeId);
        if (null != playerRecipe.targetIngredient) {
          return playerRecipe.targetIngredient.id == ingredientId;
        } else {
          return null != playerRecipe.targetIngredientList.find(function(targetIngredient) {
            return targetIngredient.id == ingredientId;
          })
        }
      }
    })
  },

  showStatelessBuildableInstanceInfoPanel(statelessBuildableInstance, level) {
    const self = this;
    let panelName = "StatelessBuildableInstanceInfoPanel";
    if (self.viewingPanelManager.hasPanel(panelName)) {
      cc.warn('Already existing a same panel:', panelName);
      return false;
    }
    let panelNode = self.statelessBuildableInstanceInfoPanelNode,
        panelIns = self.statelessBuildableInstanceInfoPanelIns;
    if (null == panelNode) {
      panelNode = self.statelessBuildableInstanceInfoPanelNode = cc.instantiate(self.statelessBuildableInstanceInfoPanelPrefab);
      panelIns = self.statelessBuildableInstanceInfoPanelIns = panelNode.getComponent(panelName);
      panelIns.init(self);
      panelIns.onCloseDelegate = function() {
        self.exitPanelView(panelIns);
      }
    }
    panelIns.setData(statelessBuildableInstance, level);
    self.enterPanelView(panelIns);
    panelIns.refresh();
  },

  updateOverallGoldLimit(baseOverallGoldLimit) {
    const self = this;
    let overallGoldLimit = 0;
    if (null != baseOverallGoldLimit && false == isNaN(parseInt(baseOverallGoldLimit))) {
      overallGoldLimit += parseInt(baseOverallGoldLimit);
    } 
    for (let k in self.statefulBuildableInstanceCompList) {
      const statefulBuildableInstanceComp = self.statefulBuildableInstanceCompList[k];

      if (constants.STATELESS_BUILDABLE_ID.HEADQUARTER == statefulBuildableInstanceComp.id) {
        for (let targetLevelConf of statefulBuildableInstanceComp.levelConfs) {
          if (targetLevelConf.level > statefulBuildableInstanceComp.currentLevel) {
            continue;
          }
          const goldLimitAddition = targetLevelConf.goldLimitAddition;
          if (0 < goldLimitAddition) {
            overallGoldLimit += goldLimitAddition; 
          }
        }
      }
    }

    self.widgetsAboveAllScriptIns.walletInfo.setData({
      goldLimit: overallGoldLimit,
    });

  },
  showCostGoldConfirmationPanel(goldCount, hint, confirmCallBack, cancelCallback, closeCallback) {
    const self = this;
    let panelName = "CostGoldConfirmationPanel";
    if (self.viewingPanelManager.hasPanel(panelName)) {
      cc.warn('Already existing a same panel:', panelName);
      return false;
    }
    let panelNode = self.costGoldConfirmationPanelNode,
        panelIns = self.costGoldConfirmationPanelIns;
    if (null == panelNode) {
      panelNode = self.costGoldConfirmationPanelNode  = cc.instantiate(self.costGoldConfirmationPanelPrefab);
      panelIns = self.costGoldConfirmationPanelIns = panelNode.getComponent(panelName);
      panelIns.init(self);
    }
    panelIns.onCloseDelegate = function() {
      self.exitPanelView(panelIns);
      closeCallback && closeCallback();
    }
    panelIns.onConfirm = confirmCallBack;
    panelIns.onCancel = cancelCallback;
    panelIns.setHintLabel(hint);
    panelIns.setGoldCount(goldCount);
    self.enterPanelView(panelIns);
    return panelIns;
  },

  // To support BottomBannerAd. [begin]
  openBottomBannerAd(callback) {
    const self = this;
    if (null == window.bottomBannerAd) {
      console.log("BuildableMap.openBottomBannerAd, null == window.bottomBannerAd");
      let {windowWidth, windowHeight} = wx.getSystemInfoSync();
      if (cc.sys.platform == cc.sys.WECHAT_GAME && null == window.tt) {
        window.bottomBannerAd = window.bottomBannerAd || wx.createBannerAd({
          adUnitId: 'adunit-9f4e1dc28fc2163a',
          style: {
              left: 1,
              top: 9999,
              // WARNING: 如果宽度铺满屏幕，有些广告会出现顶部有占位框的情况。
              width: windowWidth - 2,
          }
        });
        window.bottomBannerAd.autoDisappearTimmer = null;
        
        window.bottomBannerAd.onLoad(function() {
          if (null == window.bottomBannerAd) {
            // banner closed.
            return;
          }
          window.bottomBannerAd.style.top = windowHeight - window.bottomBannerAd.style.realHeight;
          window.bottomBannerAd
            .show()
            .then(function() {
              if (null == window.bottomBannerAd) {
                // banner closed.
              }
              callback && callback.call(self);
            });
        })
        
        window.bottomBannerAd.onError(function(err) {
          console.log(this, err);
        });
      } 

      if (null != window.tt) {
        let {windowWidth, windowHeight} = tt.getSystemInfoSync();
        const byteDanceBannerUnitId = "36dhj3nwtwg5ehf6pg";
        const byteDanceRewardVideoUnitId = "1i5nk7m7d65151kf6e";
        let targetBannerAdWidth = 200;
        if (null != window.tt.createBannerAd) {
          // Reference http://developer.toutiao.com/dev/cn/mini-game/develop/open-capacity/ads/createbannerad.
          // 注意"抖音"还不支持createBannerAd接口 -- YFLu, 2019-12-12.
          window.bottomBannerAd = window.bottomBannerAd || window.tt.createBannerAd({
            adUnitId: byteDanceBannerUnitId,
            adIntervals: 30,
            style: {
              width: targetBannerAdWidth,
              top: windowHeight - (targetBannerAdWidth / 16) * 9 // 根据系统约定尺寸计算出广告高度
            }
          });

          window.bottomBannerAd.onLoad(function() {
            if (null == window.bottomBannerAd) {
              // banner closed.
              return;
            }

            window.bottomBannerAd.style.left = (windowWidth - targetBannerAdWidth) / 2;

            window.bottomBannerAd.onResize(size => {
              window.bottomBannerAd.style.top = windowHeight - size.height;
              window.bottomBannerAd.style.left = (windowWidth - size.width) / 2;
            });
          
            window.bottomBannerAd
              .show()
              .then(function() {
                if (null == window.bottomBannerAd) {
                  // banner closed.
                }
                console.log("字节跳动Banner广告显示成功");
                callback && callback.call(self);
              })
              .catch(err => {
                console.log("字节跳动Banner广告组件出现问题", err);
              });
          });
          
          window.bottomBannerAd.onError(function(err) {
            console.log(this, err);
          });
        } else {
          window.bottomBannerAd = null;
        }
      } 
    } else {
      console.log("BuildableMap.openBottomBannerAd, null != window.bottomBannerAd");
      window.bottomBannerAd
        .show()
        .then(function() {
          if (null == window.bottomBannerAd) {
            // banner closed.
          }
          console.log("字节跳动Banner广告显示成功");
          callback && callback.call(self);
        })
        .catch(err => {
          console.log("字节跳动Banner广告组件出现问题", err);
        });
    } 
  },

  hideBottomBannerAd() {
    const self = this;
    if (null != window.bottomBannerAd) {
      window.bottomBannerAd.hide();
    }
  },

  closeBottomBannerAd() {
    const self = this;
    if (null != window.bottomBannerAd) {
      self.bottomBannerAd.destroy();
      if (null != window.bottomBannerAd.autoDisappearTimmer) {
        clearTimeout(window.bottomBannerAd.autoDisappearTimmer);
        window.bottomBannerAd.autoDisappearTimmer = null;
      }
      window.bottomBannerAd = null;
    }
  },
  // To support BottomBannerAd. [end]

  // Lawn support. [begin] {
  refreshLawnForStatefulBuildableInstance(statefulBuildableInstance) {
    const self = this;
    if (null == self.lawnLayer) {
      return;
    }
    /*
    * Starting from CocosCreator v2.2.0, "TiledLayer.setTileGIDAt(...)" doesn't work. 
    */

    const mapTileRectilinearSize = self.tiledMapIns.getTileSize();
    const discreteWidth = statefulBuildableInstance.discreteWidth;
    const discreteHeight = statefulBuildableInstance.discreteHeight;
    if (null == statefulBuildableInstance.theLawnTiles) {
      statefulBuildableInstance.theLawnTiles = [];
      for (let dx = 0; dx < discreteWidth; ++dx) {
        for (let dy = 0; dy < discreteHeight; ++dy) {
          const highlighterNode = cc.instantiate(self.tileHighlighterPrefab);
          statefulBuildableInstance.theLawnTiles.push(highlighterNode.getComponent("TileHighlighter"));
          safelyAddChild(self.lawnLayer.node, highlighterNode);
          highlighterNode.getComponent("TileHighlighter").lawn.node.active = true;
        }
      }
    }
     
    for (let dx = 0; dx < discreteWidth; ++dx) {
      for (let dy = 0; dy < discreteHeight; ++dy) {
        const indice = (dx + dy*discreteWidth);
        const highlighter = statefulBuildableInstance.theLawnTiles[indice];

        const posWrtAnchorTileCentre = cc.v2(
          (dx - dy) * 0.5 * mapTileRectilinearSize.width,
          -(dx + dy) * 0.5 * mapTileRectilinearSize.height, 
        );
        const posWrtSpriteCentre = posWrtAnchorTileCentre.add(statefulBuildableInstance.estimatedSpriteCentreToAnchorTileCentreContinuousOffset);
        const posWrtMapNode = posWrtSpriteCentre.add(statefulBuildableInstance.node.position);
        highlighter.node.setPosition(posWrtMapNode);
        highlighter.lawn.node.active = true;
      }
    }    

  },

  cancelLawnForStatefulBuildableInstance(statefulBuildableInstance) {
    const self = this;
    if (null == self.lawnLayer) {
      return;
    }

    if (null != statefulBuildableInstance && null != statefulBuildableInstance.theLawnTiles) {
      for (let k in statefulBuildableInstance.theLawnTiles) {
        const singleHighlighter = statefulBuildableInstance.theLawnTiles[k]; 
        singleHighlighter.lawn.node.active = false;
      } 
    }
  },

  clearLawnLayer() {
    /*
    * Starting from CocosCreator v2.2.0, we cannot simply use "TiledLayer.setTileGIDAt" to dynamically update a tile.
    */
  },

  // Lawn support. [end] }

  // Methods for PlayerAchievementPanel. [begin] 
  onAchievementButtonClicked(evt) {
    const self = this;
    if (null != evt) {
      self.playEffectCommonButtonClick();
    }
    self.toShowPlayerAchievementPanel = true; // This thread/routine is assigned low priority to use CPU/GPU and thus we delay the popup rendering to "self.update(dt)".
  },

  showPlayerAchievementPanel(isPreload) {
    const self = this, panelName = 'PlayerAchievementPanel';
    if (self.viewingPanelManager.hasPanel(panelName)) {
      cc.warn('Already existing a same panel:', panelName);
      return false;
    }
    const timerDict = {
      instantiate: 0,
      initFunc: 0,
      setData: 0,
      enterPanelView: 0,
      tabActivating: 0,
    };
    let panelNode = self.playerAchievementPanelNode;
    let panelIns = self.playerAchievementPanelIns;
    if (null != panelNode && isPreload) {
      return;
    }
    if (null == panelNode) {
      const t1 = Date.now();
      panelNode = self.playerAchievementPanelNode = cc.instantiate(self.playerAchievementPanelPrefab);
      const t2 = Date.now();
      timerDict.instantiate = (t2 - t1); 
      panelIns = self.playerAchievementPanelIns = panelNode.getComponent(panelName);
      panelIns.init(self);
      const t3 = Date.now();
      timerDict.initialFunc = (t3 - t2); 
      panelIns.onCloseDelegate = function() {
        self.exitPanelView(panelIns);
      };
      panelIns.onClaimReward = function(playerMission) {
        self.obtainMissionReward(playerMission.id, function(res) {
          if (null != self.playerMissionBindingListForAchievement &&
              null != self.playerMissionBindingListForDailyMission &&
              null != res.unclaimedPlayerMissionBindingList
          ) {
            const combinedPlayerMissionBindingList = self.playerMissionBindingListForAchievement.concat(self.playerMissionBindingListForDailyMission);
            res.unclaimedPlayerMissionBindingList.forEach(function(playerMissionId) {

              let targetPlayerMission = combinedPlayerMissionBindingList.find(function(playerMission) {
                return playerMission.id == playerMissionId;
              });
              if (null != targetPlayerMission) {
                self.claimMissionReward(targetPlayerMission.id, targetPlayerMission.giftList);
              }
            });
          }
          if (self.toClaimPlayerMissionBindingIdList.length > 0) {
            self.saveAllPlayerSyncData();
          }
        });
      };
    }
    const t4 = Date.now();
    if (isPreload) {
      safelyAddChild(self.widgetsAboveAllScriptIns.node, panelIns.node);
      panelIns.hide();
    } else {
      self.enterPanelView(panelIns);
      timerDict.enterPanelView = (Date.now() - t4); 
    }
    panelIns.setData(self.playerMissionBindingListForAchievement, self.playerMissionBindingListForDailyMission);
    const t5 = Date.now();
    timerDict.setData = (t5 - t4); 
    panelIns.onTabChanged(panelIns.tabContainer.toggleItems[panelIns.viewingTab]);
    const t6 = Date.now();
    timerDict.tabActivating = (t6 - t5); 
    cc.log("showPlayerAchievementPanel, timerDict = ", timerDict);
  },
  // Methods for PlayerAchievementPanel. [end] 

  // To support frontend quest completed record. [begin] {
  refreshQuestCompletedMapForDailyMission() {
    const self = this;
    if (
      0 >= self.playerMissionBindingList.length &&
      0 >= self.playerMissionBindingListForAchievement.length &&
      0 >= self.playerMissionBindingListForDailyMission.length
    ) {
      console.warn('Why are you calling refreshQuestCompletedMapForDailyMission when there has none playerMissionBinding?');
      return;
    }
    const deprecatedPlayerQuestBindingId = [];
    for (let playerQuestBindingId in self.questCompletedMap) {
      if (self.playerQuestBindingMap.hasOwnProperty(playerQuestBindingId)) {
        continue;
      }
      deprecatedPlayerQuestBindingId.push(playerQuestBindingId);
    }
    for (let playerQuestBindingId of deprecatedPlayerQuestBindingId) {
      delete self.questCompletedMap[playerQuestBindingId];
    }
  },

  refreshQuestCompletedMapForAchievement() {
    const self = this;
    if (
      0 >= self.playerMissionBindingList.length &&
      0 >= self.playerMissionBindingListForAchievement.length &&
      0 >= self.playerMissionBindingListForDailyMission.length
    ) {
      console.warn('Why are you calling refreshQuestCompletedMapForDailyMission when there has none playerMissionBinding?');
      return;
    }
    for (let playerMissionBinding of self.playerMissionBindingListForAchievement) {
      const playerQuestBinding = playerMissionBinding.playerQuestBindingList[0];
      const playerQuestBindingId = playerQuestBinding.id;
      if (self.questCompletedMap.hasOwnProperty(playerQuestBindingId)) {
        continue;
      }
      switch (playerQuestBinding.resourceType) {
      case constants.QUEST_RESOURCE_TYPE.SERVED_CUSTOMER:
        self.questCompletedMap[playerQuestBindingId] = self.accumulatedResource.servedCustomer || 0;
        break;
      case constants.QUEST_RESOURCE_TYPE.DISH_SOLD:
        self.questCompletedMap[playerQuestBindingId] = self.accumulatedResource.dishSold || 0;
        break;
      case constants.QUEST_RESOURCE_TYPE.INGREDIENT_PRODUCED:
        self.accumulatedResource.ingredientProduced = self.accumulatedResource.ingredientProduced || {};
        self.questCompletedMap[playerQuestBindingId] = self.accumulatedResource.ingredientProduced[playerQuestBinding.resourceTargetId] || 0;
      case constants.QUEST_RESOURCE_TYPE.FREEORDER_INCOME:
        self.questCompletedMap[playerQuestBindingId] = self.accumulatedResource.freeOrderIncome || 0;
        break;
      default:
        break;
      }
    }
  },

  _increasePlayerQuestBindingCompletedCount(playerQuestBindingId, accumulateQuantity = 1) {
    const self = this;
    const playerQuestBinding = self.playerQuestBindingMap[playerQuestBindingId];
    if (null == playerQuestBinding) {
      return;
    }
    const playerMissionBinding = self.reversePlayrMissionBindingMap[playerQuestBindingId];
    let currentCompletedCount = 0;
    switch (playerQuestBinding.resourceType) {
    case constants.QUEST_RESOURCE_TYPE.SERVED_CUSTOMER:
    case constants.QUEST_RESOURCE_TYPE.DISH_SOLD:
    case constants.QUEST_RESOURCE_TYPE.INGREDIENT_PRODUCED:
    case constants.QUEST_RESOURCE_TYPE.FREEORDER_INCOME:
      if (null == self.questCompletedMap[playerQuestBindingId] || !self.questCompletedMap.hasOwnProperty(playerQuestBindingId)) {
        // Initialization of questCompletedMap[playerQuestBindingId]
        console.warn('some PlayerQuestBindingId is not initialed before increase', playerQuestBinding);
        self.questCompletedMap[playerQuestBindingId] = playerQuestBinding.completedCount;
      }
      currentCompletedCount = self.questCompletedMap[playerQuestBindingId];
      self.questCompletedMap[playerQuestBindingId] = Math.min(currentCompletedCount + accumulateQuantity, playerQuestBinding.completedCountRequired);
      break;
    default:
      break;
    }
  },

  increaseAllPlayerQuestBindingCompletedCountByResource(resourceType, resourceTargetId, resourceQuantity) {
    const self = this;
    for (let playerQuestBindingId in self.playerQuestBindingMap) {
      const playerQuestBinding = self.playerQuestBindingMap[playerQuestBindingId];
      if (playerQuestBinding.resourceType != resourceType) {
        continue;
      }
      switch (playerQuestBinding.resourceType) {
      case constants.QUEST_RESOURCE_TYPE.SERVED_CUSTOMER:
        self.accumulatedResource.servedCustomer = self.accumulatedResource.servedCustomer || 0;
        self._increasePlayerQuestBindingCompletedCount(playerQuestBindingId, 1);
        break;
      case constants.QUEST_RESOURCE_TYPE.DISH_SOLD:
        self.accumulatedResource.dishSold = self.accumulatedResource.dishSold || 0;
        self._increasePlayerQuestBindingCompletedCount(playerQuestBindingId, 1);
        break;
      case constants.QUEST_RESOURCE_TYPE.INGREDIENT_PRODUCED:
        if (null != resourceTargetId && playerQuestBinding.resourceTargetId == resourceTargetId) {
          self.accumulatedResource.ingredientProduced = self.accumulatedResource.ingredientProduced || {};
          self.accumulatedResource.ingredientProduced[resourceTargetId] = self.accumulatedResource.ingredientProduced[resourceTargetId] || 0; 
          self._increasePlayerQuestBindingCompletedCount(playerQuestBindingId, 1);
        }
        break;
      case constants.QUEST_RESOURCE_TYPE.FREEORDER_INCOME:
        if (null != resourceQuantity) {
          self.accumulatedResource.freeOrderIncome = self.accumulatedResource.freeOrderIncome || 0; 
          self._increasePlayerQuestBindingCompletedCount(playerQuestBindingId, resourceQuantity);
        }
        break;
      default:
        break;
      }
    }
    switch (resourceType) {
    case constants.QUEST_RESOURCE_TYPE.SERVED_CUSTOMER:
      self.accumulatedResource.servedCustomer = self.accumulatedResource.servedCustomer || 0;
      self.accumulatedResource.servedCustomer += 1;
      break;
    case constants.QUEST_RESOURCE_TYPE.DISH_SOLD:
      self.accumulatedResource.dishSold = self.accumulatedResource.dishSold || 0;
      self.accumulatedResource.dishSold += 1;
      break;
    case constants.QUEST_RESOURCE_TYPE.INGREDIENT_PRODUCED:
      self.accumulatedResource.ingredientProduced = self.accumulatedResource.ingredientProduced || {};
      if (null != resourceTargetId) {
        self.accumulatedResource.ingredientProduced[resourceTargetId] = self.accumulatedResource.ingredientProduced[resourceTargetId] || 0;
        self.accumulatedResource.ingredientProduced[resourceTargetId] += 1;
      }
      break;
    case constants.QUEST_RESOURCE_TYPE.FREEORDER_INCOME:
      self.accumulatedResource.freeOrderIncome = self.accumulatedResource.freeOrderIncome || 0;
      if (null != resourceQuantity) {
        self.accumulatedResource.freeOrderIncome += resourceQuantity;
      }
      break;
    default:
      break;
    }
  },

  // To support frontend quest completed record. [end] }
  refreshGlobalMissionGUI() {
    const self = this;
    if (null != self.playerMissionPanelIns) {
      self.playerMissionPanelIns.setData(self.playerMissionBindingList);
      self.playerMissionPanelIns.refresh();
    }
    if (null != self.playerQuestPanelIns) {
      let playerMission = self.playerMissionBindingMap[self.playerQuestPanelIns.playerMission.id];
      if (null != playerMission) {
        self.playerQuestPanelIns.setData(playerMission);
        self.playerQuestPanelIns.refresh();
      }
    }
    if (null != self.playerAchievementPanelIns && self.playerAchievementPanelIns.isHidden()) {
			/*
			 * do not setData of playerAchievement when it is viewing.
			 */
      self.playerAchievementPanelIns.setData(self.playerMissionBindingListForAchievement, self.playerMissionBindingListForDailyMission); 
    }
    self.refreshMissionButtonCountTip();
  },

  isAllGoldUpgradableStatefulBuildablesAffordable() {
    /*
    [WARNING]

    This function serves to check whether "一键升级全部可以用金币升级的StatefulBuildables".

    Note that there being 10 individually upgradable StatelessBuildables on the map doesn't imply that you can afford them all at once. 
  
    -- YFLu, 2019-10-18. 
    */
    const self = this;
    let accumulatedDeduction = 0;
    for (let k in self.statefulBuildableInstanceCompList) {
      const singleStatefulBuildable = self.statefulBuildableInstanceCompList[k]; 
      const singleRet = singleStatefulBuildable.isUpgradableByGoldOnly(accumulatedDeduction);
      if (false == singleRet.res) {
        return {
          res: false,
          additionalGoldRequired: singleRet.additionalGoldRequired,
        };
      }
      accumulatedDeduction += singleRet.additionalAccumulatedDeduction; 
    }
    return {
      res: true,
      additionalGoldRequired: null,
    };
  },

  refreshActionableDict() {
    const self = this;
    
    /*
    [WARNING]

    This function WON'T update the position of existing "Bubble", but could remove some no-longer-actionable ones.

    -- YFLu, 2019-10-18.
    */    

    // Remove no longer actionable bubbles.
    for (let resourceType in self.actionableDict) {
      const secondLayerDict = self.actionableDict[resourceType]; // Keyed by actionable.resourceTargetId. 
      if (null == secondLayerDict) {
        continue;
      }
      const secondLayerBubbleDict = self.actionableBubbleDict[resourceType]; // Keyed by actionable.resourceTargetId. 
      for (let resourceTargetId in secondLayerDict) {
        const actionable = secondLayerDict[resourceTargetId];
        if (false == actionable.stillActionable()) {
          delete secondLayerDict[resourceTargetId];
          let actionableBubble = null;
          if (null != secondLayerBubbleDict) {
            actionableBubble = secondLayerBubbleDict[resourceTargetId]; 
          }
          if (null == actionableBubble) {
            continue;
          }
          self.removeActionableBubble(actionableBubble);
        }
      }
    }

    // Add new actionable items or update existing actionable items.
    for (let k in self.statefulBuildableInstanceCompList) {
      const singleStatefulBuildableInstanceComp = self.statefulBuildableInstanceCompList[k];      
      const singleRet = singleStatefulBuildableInstanceComp.isUpgradableByGoldOnly(); 
      if (false == singleStatefulBuildableInstanceComp.isEditing() && true == self.isPurelyVisual()) {
        singleStatefulBuildableInstanceComp.upgradableIndicator.position = cc.v2(
          singleStatefulBuildableInstanceComp.calculateOffsetXToBuildableCenter(),
          singleStatefulBuildableInstanceComp.calculateOffsetYToBuildableCenterTop(),
        );
        setLocalZOrder(singleStatefulBuildableInstanceComp.upgradableIndicator, window.CORE_LAYER_Z_INDEX.UPGRADABLE_INDICATOR);
        if (true == singleRet.res) {
          singleStatefulBuildableInstanceComp.upgradableIndicator.active = true;
          let animationIns = singleStatefulBuildableInstanceComp.upgradableIndicator.getChildByName('Animation').getComponent(dragonBones.ArmatureDisplay);
          if (animationIns.animationName != 'UpgradeAvailable') {
            animationIns.playAnimation('UpgradeAvailable');
          }
          const resourceType = ACTIONABLE_RESOURCE_TYPE.STATEFUL_BUILDABLE_UPGRADABLE_BY_GOLD;
          if (null == self.actionableDict[resourceType]) {
            self.actionableDict[resourceType] = {};
          }
          const resourceTargetId = singleStatefulBuildableInstanceComp.playerBuildableBinding.id;
          let targetActionable = self.actionableDict[resourceType][resourceTargetId];
          if (null == targetActionable) {
            targetActionable = new window.Actionable(); 
            self.actionableDict[resourceType][resourceTargetId] = targetActionable;
          } 
          targetActionable.initOrUpdatefromGoldUpgradableStatefulBuildable(singleStatefulBuildableInstanceComp);
        
          if (true == self.isPurelyVisual()) {
            const theNewActionableBubbleIntersection = targetActionable.calculateIntersectedPointOnCanvasEdges();
            let targetActionableBubble = (null == self.actionableBubbleDict[resourceType] ? null : self.actionableBubbleDict[resourceType][resourceTargetId]);
            if (null != theNewActionableBubbleIntersection && null == targetActionableBubble) {
              if (null == self.actionableBubbleDict[resourceType]) {
                self.actionableBubbleDict[resourceType] = {};
              }
              const theNewActionableBubbleNode = cc.instantiate(self.actionableBubblePrefab);
              targetActionableBubble = theNewActionableBubbleNode.getComponent("ActionableBubble"); 
              targetActionableBubble.init(targetActionable);
              theNewActionableBubbleNode.setPosition(theNewActionableBubbleIntersection);
              self.actionableBubbleDict[resourceType][resourceTargetId] = targetActionableBubble;
              safelyAddChild(self.widgetsAboveAllNode, theNewActionableBubbleNode);
              setLocalZOrder(theNewActionableBubbleNode, CORE_LAYER_Z_INDEX.ACTIONABLE_BUBBLE);
            }
          }
        } else if (null != singleRet.additionalGoldRequired) {
          singleStatefulBuildableInstanceComp.upgradableIndicator.active = true;
          let animationIns = singleStatefulBuildableInstanceComp.upgradableIndicator.getChildByName('Animation').getComponent(dragonBones.ArmatureDisplay);
          if (animationIns.animationName != 'DependencyMetOnly') {
            animationIns.playAnimation('DependencyMetOnly');
          }
        } else {
          singleStatefulBuildableInstanceComp.upgradableIndicator.active = false;
        }

        if (singleStatefulBuildableInstanceComp.id == constants.STATELESS_BUILDABLE_ID.MARKET) {
          /*
           * 在解决Market的toCollectIncome和upgradableIndicator重叠的问题之前，暂时不显示market的upgradableIndicator。
           *    -- guoyl6, 2019-10-21/05:25
           */
          singleStatefulBuildableInstanceComp.upgradableIndicator.active = false;
        }
      } else {
        singleStatefulBuildableInstanceComp.upgradableIndicator.active = false;
      }
    }
  },

  removeActionableBubble(actionableBubble) {
    const theActionable = actionableBubble.actionable;
    if (null == this.actionableBubbleDict[theActionable.resourceType] || null == this.actionableBubbleDict[theActionable.resourceType][theActionable.resourceTargetId]) {
      return;
    }
    if (actionableBubble.node && actionableBubble.node.parent) {
      actionableBubble.node.removeFromParent();
    }
    const theSecondLayerDict = this.actionableBubbleDict[theActionable.resourceType]; 
    delete theSecondLayerDict[theActionable.resourceTargetId];
  },

  onAnnouncementButtonClicked(evt) {
    const self = this;
    if (null != evt) {
      self.playEffectCommonButtonClick();
    }
    if (null == self.announcementData) {
      return;
    }
    self.showAnnoucementPanel();
  },

  showAnnoucementPanel() {
    const self = this;
    const simplePressToGoDialogNode = cc.instantiate(self.bigSimplePressToGoDialogPrefab);
    // In order to show bottomBannerAd, temporarily set the y as 88.66.
    simplePressToGoDialogNode.setPosition(cc.v2(0, 88.66));
    const simplePressToGoDialogScriptIns = simplePressToGoDialogNode.getComponent("SimplePressToGoDialog");
    simplePressToGoDialogScriptIns.mapIns = self;
    const currentAnnouncementData = self.announcementData;
    simplePressToGoDialogScriptIns.onCloseDelegate = () => {
      self.exitPanelView(simplePressToGoDialogScriptIns);
      cc.sys.localStorage.setItem('announcement', JSON.stringify(currentAnnouncementData));
      self.refreshAnnouncementButton();
    };
    simplePressToGoDialogScriptIns.setTitleLabel(i18n.t('Tip.announcementTitle'));
    simplePressToGoDialogScriptIns.setHintRichText(currentAnnouncementData[window.language]);
    self.enterPanelView(simplePressToGoDialogScriptIns);
    return simplePressToGoDialogScriptIns;
  },

  refreshAnnouncementButton() {
    const self = this;
    if (null != self.announcementData && null != self.announcementData[window.language] && 0 < self.announcementData[window.language].length) {
      self.announcementButton.node.active = true;
      let previousAnnouncementData = JSON.parse(cc.sys.localStorage.getItem('announcement') || '{}');
      if (previousAnnouncementData[window.language] !== self.announcementData[window.language]) {
        self.announcementButton.target.getComponent('ScaleAnim').enabled = true;
        let tipNode = self.announcementButton.node.getChildByName('Tip');
        if (null != tipNode) {
          tipNode.active = true;
        }
      } else {
        self.announcementButton.target.getComponent('ScaleAnim').enabled = false;
        self.announcementButton.target.scale = 1;
        let tipNode = self.announcementButton.node.getChildByName('Tip');
        if (null != tipNode) {
          tipNode.active = false;
        }
      }
    } else {
      self.announcementButton.node.active = false;
    }
  },

  onMapOverMoved() {
  
  },

  showMissionHelperPanel(hintLabel, confirmCallback, cancelCallback, closeCallback) {
    const self = this;
    const missionHelperPanelNode = cc.instantiate(self.missionHelperPanelPrefab);
    const missionHelperPanelIns = missionHelperPanelNode.getComponent('ConfirmationPanel');
    missionHelperPanelIns.init(self);
    missionHelperPanelIns.setHintLabel(hintLabel);
    missionHelperPanelIns.onCloseDelegate = function() {
      self.exitPanelView(missionHelperPanelIns);
      closeCallback && closeCallback();
    };
    missionHelperPanelIns.onConfirm = confirmCallback;
    missionHelperPanelIns.onCancel = cancelCallback;
    self.enterPanelView(missionHelperPanelIns);
    return missionHelperPanelIns;
  },

  getCraftableKnapsackArray() {
    return this.knapsackArray;
  },


  // To support rewardedVideoAd. [begin]
  _openWechatRewardedVideoAd(adUnitId, videoWatchEndedCb, videoWatchAbortedCb) {
    const self = this;

    if (cc.sys.platform == cc.sys.ANDROID) {
      /*
      [WARNING]

      This is a dirty hack.

      -- YFLu, 2019-11-15.
      */

      self.videoWatchEndedCb = videoWatchEndedCb;
      self.videoWatchAbortedCb = videoWatchAbortedCb;

      window.admobOnRewardedAdFailedToShow = function() {
        console.log("admobOnRewardedAdFailedToShow");
        if (null != self.videoWatchAbortedCb) {
          self.videoWatchAbortedCb(constants.ADMOB_ERROR_CODE.UNKNOWN); // No meaning error code to provide.
          self.videoWatchAbortedCb = null; // Prevent further calls to be triggered.
        }
      };

      window.admobOnRewardedAdFailedToLoad = function(admobErrorCode) {
        console.log("admobOnRewardedAdFailedToLoad, admobErrorCode == ", admobErrorCode);
        if (null != self.videoWatchAbortedCb) {
          if (constants.ADMOB_ERROR_CODE.NO_FILL == admobErrorCode) {
            self.videoWatchAbortedCb(constants.ADMOB_ERROR_CODE.NO_FILL);
          } else {
            self.videoWatchAbortedCb(constants.ADMOB_ERROR_CODE.UNKNOWN);
          }
          self.videoWatchAbortedCb = null; // Prevent further calls to be triggered.
        }
      }; 

      window.admobOnRewardedAdJustStartedLoading = function() {
        if (null != self.videoWatchAbortedCb) {
          self.videoWatchAbortedCb(constants.ADMOB_ERROR_CODE.UNKNOWN); // No meaning error code to provide.
          self.videoWatchAbortedCb = null; // Prevent further calls to be triggered.
        }
      };

      window.admobOnUserEarnedReward = function() {
        console.log("admobOnUserEarnedReward");
        if (null != self.videoWatchEndedCb) {
          self.videoWatchEndedCb();
          self.videoWatchEndedCb = null; // Prevent further calls to be triggered.
        }
      };

      jsb.reflection.callStaticMethod("org/cocos2dx/javascript/authpayment/ApHelper", "showRewardedVidAd", "()V");
      return;
    }
    
    self.videoWatchEndedCb = videoWatchEndedCb;
    self.videoWatchAbortedCb = videoWatchAbortedCb;

    if (!self.vidAdsRewardEnabled) {
      console.warn('You shouldn\'t have call _openWechatRewardedVideoAd when the mapIns.vidAdsRewardEnabled is false.');
      self.videoWatchAbortedCb && self.videoWatchAbortedCb(new Error("_openWechatRewardedVideoAd when mapIns.vidAdsRewardEnabled is false"));
      return;
    }

    if (cc.sys.platform == cc.sys.WECHAT_GAME) {
      // WARNING: 激励视频是全局单例的，因此不同的adUnitId是否有用尚不确定
      /* WARNING: 实际运行时发现此处更改adUnitId是不起作用的，
       * 因为钻石的广告uid本应是16～30s的激励视频，在运行时却出现了15s的激励视频
       */
      // WARNING: 激励广告destroy后，再次调用createRewardedVideoAd返回的依旧是被销毁的对象
      let videoAd = self.videoAd || wx.createRewardedVideoAd({
        adUnitId: adUnitId,
      });
      videoAd.show().catch(() => {
        // 失败重试
        videoAd.load()
          .then(() => videoAd.show())
          .catch(err => {
            self.videoWatchAbortedCb && self.videoWatchAbortedCb(constants.ADMOB_ERROR_CODE.NO_FILL /* Hardcoded temporarily -- YFLU, 2019-11-16. */);
          });
      });
      return videoAd;
    } else {
      self.videoWatchAbortedCb && self.videoWatchAbortedCb(constants.ERROR.WECHAT_PLATFORM_REQUIRED);
    }
  },

  watchVidAdToGainMoreGoldCount(successCb, failCb) {
    const self = this;
    // 广告位名称：挂机收益翻倍视频
    self._openWechatRewardedVideoAd("adunit-9e848f29322ddf09", successCb, failCb);
  },

  watchVidAdToGainMoreDiamond(successCb, failCb) {
    const self = this;
    // 广告位名称：获取5个钻石
    self._openWechatRewardedVideoAd("adunit-261597b5e75d841e", successCb, failCb);
  },

  // To support rewardedVideoAd. [end]

  onVidAdsPanelTriggerClicked(evt) {
    const self = this;
    if (!self.isPurelyVisual()) {
      return;
    }
    if (null != evt) {
      self.playEffectCommonButtonClick();
    }
    const diamondCount = 5;
    const confirmationPanelIns = self.showSimpleConfirmationPanel('', function() {
      self.watchVidAdToGainMoreDiamond(function() {
        self.widgetsAboveAllScriptIns.walletInfo.setData({
          diamond: self.wallet.diamond + diamondCount,
        });
        // Show some tip for diamond increase. [begin]
        const diamondIconNode = self.widgetsAboveAllScriptIns.walletInfo.diamondNode.getChildByName('Icon');
        if (null != diamondIconNode) {
          diamondIconNode.stopAllActions();
          diamondIconNode.runAction(
            cc.sequence(
              cc.scaleTo(0.2, 1.2),
              cc.scaleTo(0.2, 1)
            )
          );
        }
        // Show some tip for diamond increase. [end]
        self.saveAllPlayerSyncData();
      }, function(err) {
        const simplePressToGoDialogNode = cc.instantiate(self.simplePressToGoDialogPrefab);
        simplePressToGoDialogNode.setPosition(cc.v2(0, 0));
        const simplePressToGoDialogScriptIns = simplePressToGoDialogNode.getComponent("SimplePressToGoDialog");
        simplePressToGoDialogScriptIns.mapIns = self;
        simplePressToGoDialogScriptIns.onCloseDelegate = () => {
          self.exitPanelView(simplePressToGoDialogScriptIns);
        };
        if (constants.ADMOB_ERROR_CODE.UNKNOWN == err || constants.ADMOB_ERROR_CODE.NO_FILL == err) {
          simplePressToGoDialogScriptIns.setHintLabel(i18n.t("VideoAd.Error.NoFill"));
        } else {
          simplePressToGoDialogScriptIns.setHintLabel(cc.js.formatStr(i18n.t("VideoAd.Tip.gainDiamond"), diamondCount));
        }
        self.enterPanelView(simplePressToGoDialogScriptIns);
      });
    });
    confirmationPanelIns.hintRichText.lineHeight = 180;
    confirmationPanelIns.setHintRichText(cc.js.formatStr(i18n.t("VideoAd.Tip.gainDiamondRichText"), diamondCount));
    confirmationPanelIns.setTitleLabel(i18n.t("VideoAd.Title.gainDiamond"));
    return confirmationPanelIns;
  },

  transitZoomRatioTo(targetZoomRatio, duration=0.3, callback=null) {
    const self = this;
    if (null != self.mainCamera._zoomingTween) {
      self.mainCamera._zoomingTween.stop();
      self.mainCamera._zoomingTween = null;
    }
    function updateZoomRatioSync(value) {
      for (let child of self.mainCameraNode.children) {
        if ("coverVideoNode" == child.getName()) continue; // A dirty hack.
        child.setScale(1 / value);
      }
    }
    if (duration <= 0) {
      self.mainCamera.zoomRatio = targetZoomRatio;
      updateZoomRatioSync(targetZoomRatio);
      callback && callback();
      return;
    }
    self.mainCamera._zoomingTween = cc.tween(self.mainCamera).
      to(duration, {
        zoomRatio: {
          value: targetZoomRatio,
          progress: function(start, end, current, ratio) {
            let next = start + (end - start) * ratio;
            if (current != targetZoomRatio) {
              updateZoomRatioSync(next);
            }
            return next;
          },
        },
      }).
      call(function() {
        self.mainCamera._zoomingTween = null;
        callback && callback();
      });
    self.mainCamera._zoomingTween.start();
  },

});
