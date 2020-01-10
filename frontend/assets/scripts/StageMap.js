const BuildableMap = require('./BuildableMap');
const ProgressNum = require('./ProgressNum');
const NarrativeSceneManagerDelegate = require('./NarrativeScenes/NarrativeSceneManagerDelegate');
const i18n = require('LanguageData');

cc.Class({
  extends: BuildableMap,

  properties: {
    statefulBuildableDestroyedAnimPrefab: cc.Prefab,
  },

  ctor() {
    this.comboIndicatorNode = null;
    this.comboIndicatorScriptIns = null;
    this.elapsedTimeMillis = 0;
    this.baseOverallGoldLimit = 0;
    this.gameSettingsUpdateInterval = null;

    this.inspectingAttackingNpc = null;
    this.mapName = 'StageMap';
    this.stageSelectionName = 'StageSelection';
    
    this.successfullyDroppedSoldierCount = 0;
    this.destoryedStatefulBuildableDict = {};
  },

  onLoad() {
    NarrativeSceneManagerDelegate.prototype.onLoad.call(this);
    const self = this;
    self.allMapsFadedIn = false;
    self.stageGoalPanelDismissed = false;

    self.buildButton.node.active = false;
    self.knapsackButton.node.active = false;

    // deliberately set knapsackArray, recipeArray, hqRecipeArray to null.
    self.knapsackArray = null;
    self.recipeArray = null;
    self.hqRecipeArray = null;
    self.stageStartTime = null;
    self.statefulBuildableAttackingNpcScriptInsDict = {};

    // Initialization of knapsack cache. [begin]
    self.knapsackConsumedCache = {};
    // Initialization of knapsack cache. [end]

    // Initialization of stage information. [begin]
    const data = JSON.parse(cc.sys.localStorage.getItem('stage'));
    self.stageData = data;
    const currentStageId = data.stageId;
    const currentStageBinding = data.stageBinding;
    self.stage = data.stage;
    self.stageIndex = data.index;
    if (null != window.tt) {
      tt.hideShareMenu();
      const expectedStageId = self.stageIndex;
      const ttToShareMessage = {
        imageUrl: window.ttShareImageUrl,
        title: i18n.t("StageSelectionCell.DisplayName." + self.stageIndex),
        query: 'expectedStageId=' + expectedStageId,
      };
      console.warn("The expectedStageId for sharing: ", expectedStageId, ", ttToShareMessage: ", ttToShareMessage);
      tt.onShareAppMessage(() => {
        return ttToShareMessage;
      });
    } else {
      if (cc.sys.platform == cc.sys.WECHAT_GAME) {
        const expectedStageId = self.stageIndex;
        const wxToShareMessage = {
          title: i18n.t("StageSelectionCell.DisplayName." + self.stageIndex),
          imageUrl: window.wxShareImageUrl,
          imageUrlId: window.wxShareImageId,
          query: 'expectedStageId=' + expectedStageId,
        };
        console.warn("The expectedStageId for sharing: ", expectedStageId, ", wxToShareMessage: ", wxToShareMessage);
        wx.showShareMenu();
        wx.onShareAppMessage(() => {
          return wxToShareMessage;
        });
      }
    }

    self.currentStageBinding = currentStageBinding;
    self.currentStageId = currentStageId;
    // Initialization of stage infomation. [end]

    self.findStatefulBuildableInstanceAtPosition = null;

    window.mapIns = self;
    const mapNode = self.node;
    const canvasNode = mapNode.parent;
    self.canvasNode = canvasNode;

    cc.director.getCollisionManager().enabled = true;
    cc.director.getCollisionManager().enabledDebugDraw = CC_DEBUG;

    //Initialization of the viewingPanelManager [begins].
    self.viewingPanelManager = [];
    self.viewingPanelManager.hasPanel = function(nodeName) {
      return !!this.find(x => x.node.name == nodeName);
    };
    //Initialization of the viewingPanelManager [ends].

    // Initialization of the "widgetsAboveAllNode" [begins].
    for (let i in self.widgetsAboveAllNode.children) {
      const child = self.widgetsAboveAllNode.children[i];
      if (child.name != "NarrativeSceneLayer" && child.name != "StatefulBuildableController") {
        child.active = false;
      }
    }
    // Initialization of the "widgetsAboveAllNode" [ends].

    // Initialization of `statelessBuildableInstanceCardListScriptIns` [begins].
    if (null == self.statelessBuildableInstanceCardListPrefab) {
      console.warn("You don't have a `mapIns.statelessBuildableInstanceCardListPrefab`, meaning that your code is only available for TowerSiege mode but not TowerDefense!");
    } else {
      const statelessBuildableInstanceCardListNode = cc.instantiate(self.statelessBuildableInstanceCardListPrefab);
      self.statelessBuildableInstanceCardListScriptIns = statelessBuildableInstanceCardListNode.getComponent('StatelessBuildableInstanceCardList');
      statelessBuildableInstanceCardListNode.setPosition(0, -400); // why -400?
      self.statelessBuildableInstanceCardListScriptIns.onCloseDelegate = () => {
        self.exitPanelView(self.statelessBuildableInstanceCardListScriptIns);
      };
    }
    // Initialization of `statelessBuildableInstanceCardListScriptIns` [ends].

    // Initialization of `narrativeSceneLayer`. [begins].
    self.narrativeSceneLayer = self.widgetsAboveAllNode.getChildByName("NarrativeSceneLayer");
    // Initialization of `narrativeSceneLayer`. [ends].

    if (null == self.iapItemPanelPrefab) {
      console.warn("You don't have a `mapIns.iapItemPanelPrefab`, meaning that your code is not available for InappPurchase!");
    } else {
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

      // Initialization of `FullscreenIapPurchasingShadow`. [begins].
      const fullscreenIapPurchasingShadowNode = cc.instantiate(self.fullscreenIapPurchasingShadowPrefab);
      fullscreenIapPurchasingShadowNode.setPosition(0, 0);
      fullscreenIapPurchasingShadowNode.active = false;
      safelyAddChild(self.narrativeSceneLayer, fullscreenIapPurchasingShadowNode);
      setLocalZOrder(self.narrativeSceneLayer, CORE_LAYER_Z_INDEX.INFINITY)
      self.fullscreenIapPurchasingShadowNode = fullscreenIapPurchasingShadowNode;
      // Initialization of `FullscreenIapPurchasingShadow`. [ends].
    }

    /*
    * The nomenclature is a little tricky here for two very similar concepts "playerBuildableBinding" and "statefulBuildableInstance".
    * - When talking about frontend in-RAM instances for rendering, we use mostly "statefulBuildableInstance"
    * - When talking about "localStorage" or "remote MySQLServer" stored, to be recovered data, we use mostly "playerBuildableBinding".
    */
    self.statefulBuildableInstanceList = []; //用于保存statefulBuildableInstance.playerBuildableBinding, 维护`cc.sys.localStorage`
    self.statefulBuildableInstanceCompList = []; //保存comp指针

    self.startedAtMillis = Date.now();
    self.setupInputControls();

    /*
    The initialization sequence is 
    
    - sendStagePlayerBuildableBindingListQuery
    - _onStagePlayerBuildableBindingListQueryResponded
    - renderCurrentTileMap & showing "StageGoalPanel", concurrently
    - Both "_onBothTiledMapLoadedAndRendered" and player clicking confirm button of "StageGoalPanel" will call "mapIns.tryToStartStageTimer", but only the latter one will work once, because "mapIns.tryToStartStageTimer" requires both "mapIns.allMapsFadedIn == true" and "mapIns.stageGoalPanelDismissed == true" to proceed. 
    - tryToStartStageTimer 
      - if should show a specific tutorial, then show it and at last `initAfterAllTutorialStages` 
      - else invoke `initAfterAllTutorialStages` immediately
  
    -- YFLu, 2019-10-16.
    */

    self.statefulBuildableController.active = false;

    if (null == window.enabledDialogs) {
      window.enabledDialogs = [];
    }

    /*
    [WARNING]

    To avoid any inconvenience due to asynchronized events, always put the definition of "self.ingredientMap" and "self.knapsackArray" before loading the texture-files.

    -- YFLu, 2019-09-23
    */
    self.ingredientMap = {};
    self.knapsackArray = [];
    self.playerMissionBindingList = [];
    self.draggingIngredientCell = null;
    self.followingIngredientNode = null;

    self.closeableWaitingShadowNode = cc.instantiate(self.closeableWaitingShadowPrefab);
    setLocalZOrder(self.closeableWaitingShadowNode, CORE_LAYER_Z_INDEX.INFINITY);

    self.ingredientSpriteFrameMap = {};
    for (let k in self.ingredientAtlasArray) {
      const ingredientAtlas = self.ingredientAtlasArray[k]; 
      const theSpriteFrames = ingredientAtlas.getSpriteFrames();  
      for (let kk in theSpriteFrames) {
        const spriteFrame = theSpriteFrames[kk];
        self.ingredientSpriteFrameMap[spriteFrame.name] = spriteFrame;
      } 
    }

    try {
      const selfPlayerStr = cc.sys.localStorage.getItem("selfPlayer");
      const selfPlayer = JSON.parse(selfPlayerStr);
      const intAuthToken = selfPlayer.intAuthToken;
      self.sendStagePlayerBuildableBindingListQuery({
        intAuthToken: intAuthToken
      });
    } catch (e) {
      if (null != window.handleNetworkDisconnected) {
        window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
      }
      return;
    }

    if (null != self._timeroutTimer) {
      clearTimeout(self._timeroutTimer);
    }

    self.onRecordedVideoSharedAndUpsyncedSuccessfully = (ttChannel) => {
      if (null != self.resultPanelIns) {
        if (null != ttChannel && "video" == ttChannel) {
          self.resultPanelIns.videoShareBtn.node.active = false;
        } else {
          self.resultPanelIns.shareBtn.node.active = false;
        }
      }
      if (null != window.cachedPlayerStageBindingData) {
        window.cachedPlayerStageBindingData.diamond = self.wallet.diamond; // To refresh the cached data viewed in "StageSelectionScene". -- YFLu, 2019-12-06.
      }
    };

    self.onRecordedVideoSharedSuccessfully = (ttChannel) => {
      self.widgetsAboveAllScriptIns.walletInfo.setData({
        diamond: self.wallet.diamond + 1,
      });
      const cbWithParam = () => {
        self.onRecordedVideoSharedAndUpsyncedSuccessfully(ttChannel);
      };
      self.syncPlayerHoldingsAfterRewarded(cbWithParam);
    };

    self._timeroutTimer = setTimeout(function() {
      if (null != window.handleNetworkDisconnected) {
        window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
      }
    }, 8000);
  },

  onDestroy() {
    const self = this;
    window.reverseStatefulBuildableAttackingNpcDestinationDict = {};
    BuildableMap.prototype.onDestroy.apply(this, arguments);

    if (null != self.spawnAttackingNpcInterval) {
      clearInterval(self.spawnAttackingNpcInterval);
      self.spawnAttackingNpcInterval = null;
    }

    if (null != self.spawnEscapingAttackingNpcInterval) {
      clearInterval(self.spawnEscapingAttackingNpcInterval);
      self.spawnEscapingAttackingNpcInterval = null;
    }

    if (null != self.saveAllPlayerSyncDataInterval) {
      clearInterval(self.saveAllPlayerSyncDataInterval);
      self.saveAllPlayerSyncDataInterval = null;
    }

    self.hideBottomBannerAd();
  },

  computeEffectiveInBattleSoldierArray(persistentSoldierArray, volatileKnapsackDict) {
    const self = this;
    const effectiveInBattleSoldierArray = [];
    const toIgnoreVolatileCounts = new Set();
    for (let k in persistentSoldierArray) {
      const thatPersistentSingleSoldier = persistentSoldierArray[k]; 
      /*
       * Deliberately making a deep copy, bcz "self.soldierArray" should always keep counting the persistent records on backend. We
       * should eliminate any possibility of data contamination here.
       *
       *  -- YFLu, 2019-11-27.
       */
      const singleSoldier = {};
      Object.assign(singleSoldier, {
        ingredientId: thatPersistentSingleSoldier.ingredientId, 
        currentCount: thatPersistentSingleSoldier.currentCount, 
        ingredient: thatPersistentSingleSoldier.ingredient,
      });
      if (volatileKnapsackDict.hasOwnProperty(singleSoldier.ingredient.id)) {
        singleSoldier.currentCount += volatileKnapsackDict[singleSoldier.ingredient.id].currentCount;
        toIgnoreVolatileCounts.add(singleSoldier.ingredient.id);
      }
      effectiveInBattleSoldierArray.push(singleSoldier);
    }
    for (let k in volatileKnapsackDict) {
      const thatVolatileSingleSoldier = volatileKnapsackDict[k]; 
      if (toIgnoreVolatileCounts.has(thatVolatileSingleSoldier.ingredientId)) continue;
      /*
       * Deliberately making a deep copy, bcz "self.volatileKnapsackDict" will later be used in counting the "to be reported termination req param". We
       * should eliminate any possibility of data contamination here.
       *
       *  -- YFLu, 2019-11-27.
       */
      const singleSoldier = {};
      Object.assign(singleSoldier, {
        ingredientId: thatVolatileSingleSoldier.ingredientId, 
        currentCount: thatVolatileSingleSoldier.currentCount, 
        ingredient: thatVolatileSingleSoldier.ingredient,
      });
      effectiveInBattleSoldierArray.push(singleSoldier);
    }
    return effectiveInBattleSoldierArray;
  },

  spawnGuardSoldier(homePosInMapNode, speciesName, teamId) {
    const self = this;
    const tiledMapIns = self.node.getComponent(cc.TiledMap);
    const npcNode = cc.instantiate(self.escapingAttackingNpcPrefab);

    const npcScriptIns = npcNode.getComponent("EscapingAttackingNpc");
    npcScriptIns.speciesName = speciesName;
    npcScriptIns.teamId = teamId;
    npcScriptIns.mapNode = self.node;
    npcScriptIns.mapIns = self;
    npcScriptIns.boundStatefulBuildable = null;
    npcScriptIns.homePosInMapNode = homePosInMapNode;

    npcNode.setPosition(homePosInMapNode);

    safelyAddChild(self.node, npcNode);
    setLocalZOrder(npcNode, window.CORE_LAYER_Z_INDEX.PLAYER);

    const randomOrientation = window.getRandomInt(0, Object.keys(window.ALL_DISCRETE_DIRECTIONS_CLOCKWISE).length);
    let closeWise = window.ALL_DISCRETE_DIRECTIONS_CLOCKWISE[Math.floor(randomOrientation / 4) + 2 * (randomOrientation % 4)];
    let discreteX = closeWise.dx ? closeWise.dx / Math.abs(closeWise.dx) : closeWise.dx;
    let discreteY = closeWise.dy ? closeWise.dy / Math.abs(closeWise.dy) : closeWise.dy;
    const followingNpcOffsetScaleRatio = 1;
    npcScriptIns.specifiedOffsetFromSpriteCentre = cc.v2(
      tiledMapIns.getTileSize().width * followingNpcOffsetScaleRatio * discreteX,
      tiledMapIns.getTileSize().height * followingNpcOffsetScaleRatio * discreteY
    );

    // Init the associated "visionNode". [begins]
    const visionNode = cc.instantiate(self.polygonBoundaryVisionPrefab);
    npcScriptIns.visionNode = visionNode;
    const theActualVisionCollider = visionNode.getComponent(cc.CircleCollider);
    theActualVisionCollider.radius = constants.NPC_BASE_VISION_RADIUS[npcScriptIns.speciesName];

    const visionScriptIns = visionNode.getComponent("PolygonBoundaryVision");
    visionScriptIns.emitterCharacter = npcScriptIns;
    npcScriptIns.visionScriptIns = visionScriptIns;

    const visionPosition = npcNode.position;
    visionNode.setPosition(visionPosition);
    safelyAddChild(self.node, visionNode);
    // Init the associated "visionNode". [ends]

    // Init the associated "defenderNode". [begins]
    const defenderNode = cc.instantiate(self.polygonBoundaryDefenderPrefab);
    npcScriptIns.defenderNode = defenderNode;
    const theActualDefenderCollider = defenderNode.getComponent(cc.CircleCollider);
    theActualDefenderCollider.radius = constants.NPC_BASE_DEFENDER_RADIUS[npcScriptIns.speciesName];

    const defenderScriptIns = defenderNode.getComponent("PolygonBoundaryDefender");
    defenderScriptIns.emitterCharacter = npcScriptIns;
    npcScriptIns.defenderScriptIns = defenderScriptIns;

    const defenderPosition = npcNode.position;
    defenderNode.setPosition(defenderPosition);
    safelyAddChild(self.node, defenderNode);
    // Init the associated "defenderNode". [ends]

    self.statefulBuildableAttackingNpcScriptInsDict[npcNode.uuid] = npcScriptIns;

    // Init the hpBar. [begins]
    const MIN_HP_LIMIT_LENGTH = 100;
    const MAX_HP_LIMIT_LENGTH = 200;

    const REFERENCE_HP_LIMIT = 5000;
    const REFERENCE_LENGTH = MAX_HP_LIMIT_LENGTH;

    const hpBarNode = npcScriptIns.hpBar.node; 
    let correspondingHpLimitLength = REFERENCE_LENGTH*(npcScriptIns.baseHp/REFERENCE_HP_LIMIT); 
    if (correspondingHpLimitLength < MIN_HP_LIMIT_LENGTH) {
      correspondingHpLimitLength = MIN_HP_LIMIT_LENGTH;
    }
    hpBarNode.width = correspondingHpLimitLength; 
    npcScriptIns.hpBar.totalLength = correspondingHpLimitLength; 
    npcScriptIns.hpBar.barSprite.node.x = -0.5*(correspondingHpLimitLength);
  
    npcScriptIns.transferHpGuiToMapNodeAndUpdatePosition();
    // Init the hpBar. [ends]

    return npcScriptIns;
  },

  spawnEscapingAttackingNpc(homePosInMapNode, targetPosInMapNode, speciesName, activeSoldier) {
    /*
    [WARNING]
      
    Not each AttackingNpc that's attacking an "boundStatefulBuildableComp" will fall into "boundStatefulBuildableComp.boundAttackingNpc", e.g. instances of "EscapingAttackingNpc" won't. 

    The key factor to consider whether an AttackingNpc would fall into "boundStatefulBuildableComp.boundAttackingNpc" is whether the movement of targeted "boundStatefulBuildableComp" will trigger re-routing of that AttackingNpc. 

    -- YFLu, 2019-10-22.
    */
    const self = this;
    const tiledMapIns = self.node.getComponent(cc.TiledMap);
    const npcNode = cc.instantiate(self.escapingAttackingNpcPrefab);

    const npcScriptIns = npcNode.getComponent("EscapingAttackingNpc");
    npcScriptIns.speciesName = speciesName;

    npcScriptIns.mapNode = self.node;
    npcScriptIns.mapIns = self;
    npcScriptIns.boundStatefulBuildable = null;
    npcScriptIns.homePosInMapNode = homePosInMapNode;

    if (null != activeSoldier) {
      npcScriptIns.consumedIngredient = activeSoldier.ingredient;
    }

    npcNode.setPosition(homePosInMapNode);

    safelyAddChild(self.node, npcNode);
    setLocalZOrder(npcNode, window.CORE_LAYER_Z_INDEX.PLAYER);

    const randomOrientation = window.getRandomInt(0, Object.keys(window.ALL_DISCRETE_DIRECTIONS_CLOCKWISE).length);
    let closeWise = window.ALL_DISCRETE_DIRECTIONS_CLOCKWISE[Math.floor(randomOrientation / 4) + 2 * (randomOrientation % 4)];
    let discreteX = closeWise.dx ? closeWise.dx / Math.abs(closeWise.dx) : closeWise.dx;
    let discreteY = closeWise.dy ? closeWise.dy / Math.abs(closeWise.dy) : closeWise.dy;
    const followingNpcOffsetScaleRatio = 1;
    npcScriptIns.specifiedOffsetFromSpriteCentre = cc.v2(
      tiledMapIns.getTileSize().width * followingNpcOffsetScaleRatio * discreteX,
      tiledMapIns.getTileSize().height * followingNpcOffsetScaleRatio * discreteY
    );

    // Init the associated "visionNode". [begins]
    const visionNode = cc.instantiate(self.polygonBoundaryVisionPrefab);
    npcScriptIns.visionNode = visionNode;
    const theActualVisionCollider = visionNode.getComponent(cc.CircleCollider);
    theActualVisionCollider.radius = constants.NPC_BASE_VISION_RADIUS[npcScriptIns.speciesName];

    const visionScriptIns = visionNode.getComponent("PolygonBoundaryVision");
    visionScriptIns.emitterCharacter = npcScriptIns;
    npcScriptIns.visionScriptIns = visionScriptIns;

    const visionPosition = npcNode.position;
    visionNode.setPosition(visionPosition);
    safelyAddChild(self.node, visionNode);
    // Init the associated "visionNode". [ends]

    // Init the associated "defenderNode". [begins]
    const defenderNode = cc.instantiate(self.polygonBoundaryDefenderPrefab);
    npcScriptIns.defenderNode = defenderNode;
    const theActualDefenderCollider = defenderNode.getComponent(cc.CircleCollider);
    theActualDefenderCollider.radius = constants.NPC_BASE_DEFENDER_RADIUS[npcScriptIns.speciesName];

    const defenderScriptIns = defenderNode.getComponent("PolygonBoundaryDefender");
    defenderScriptIns.emitterCharacter = npcScriptIns;
    npcScriptIns.defenderScriptIns = defenderScriptIns;

    const defenderPosition = npcNode.position;
    defenderNode.setPosition(defenderPosition);
    safelyAddChild(self.node, defenderNode);
    // Init the associated "defenderNode". [ends]

    npcScriptIns.refreshCurrentDestination(targetPosInMapNode);
    npcScriptIns.refreshContinuousStopsFromCurrentPositionToCurrentDestination(true);
    npcScriptIns.restartFollowing();
    self.statefulBuildableAttackingNpcScriptInsDict[npcNode.uuid] = npcScriptIns;

    // Init the hpBar. [begins]
    const MIN_HP_LIMIT_LENGTH = 100;
    const MAX_HP_LIMIT_LENGTH = 200;

    const REFERENCE_HP_LIMIT = 5000;
    const REFERENCE_LENGTH = MAX_HP_LIMIT_LENGTH;

    const hpBarNode = npcScriptIns.hpBar.node; 
    let correspondingHpLimitLength = REFERENCE_LENGTH*(npcScriptIns.baseHp/REFERENCE_HP_LIMIT); 
    if (correspondingHpLimitLength < MIN_HP_LIMIT_LENGTH) {
      correspondingHpLimitLength = MIN_HP_LIMIT_LENGTH;
    }
    hpBarNode.width = correspondingHpLimitLength; 
    npcScriptIns.hpBar.totalLength = correspondingHpLimitLength; 
    npcScriptIns.hpBar.barSprite.node.x = -0.5*(correspondingHpLimitLength);
  
    npcScriptIns.transferHpGuiToMapNodeAndUpdatePosition();
    // Init the hpBar. [ends]

    return npcScriptIns;
  },

  onAttackingNpcKilledByBullet(npcScriptIns, bulletScriptIns) {
    const self = this;
    if (null == self.comboIndicatorScriptIns) {
      self.comboIndicatorNode = cc.instantiate(self.comboIndicatorPrefab);
      const positionOnWidgetsAboveAllNode = cc.v2(self.widgetsAboveAllScriptIns.walletInfo.node.position.x, 200);

      self.comboIndicatorNode.setPosition(positionOnWidgetsAboveAllNode);
      self.comboIndicatorScriptIns = self.comboIndicatorNode.getComponent("ComboIndicator");
      safelyAddChild(self.widgetsAboveAllNode, self.comboIndicatorNode);
      self.comboIndicatorScriptIns.init(self, (culmulatedCountAfterEnded) => {
        self.comboIndicatorNode = null;
        self.comboIndicatorScriptIns = null;

        /*
        [WARNING] 

        The following magic numbers are all just TEMPORARILY HARDCODED!

        -- YFLu, 2019-09-26 
        */
        const intervalToMod = 5;
        const intervalToModForGold = intervalToMod;
        const intervalToModForDiamond = intervalToMod;
        const rewardedGold = Math.floor(culmulatedCountAfterEnded / intervalToModForGold) * 100;
        // const rewardedDiamond = Math.floor(culmulatedCountAfterEnded/intervalToModForDiamond);
        const rewardedDiamond = 0;

        self.widgetsAboveAllScriptIns.walletInfo.setData({
          gold: self.wallet.gold + rewardedGold,
          diamond: self.wallet.diamond + rewardedDiamond,
        });

        if (0 < rewardedGold) {
          const goldRewardIndicatorNode = cc.instantiate(self.goldObtainedNotificationPrefab);
          const goldRewardIndicatorScriptIns = goldRewardIndicatorNode.getComponent("DescriptionNotification");
          goldRewardIndicatorScriptIns.setTip(rewardedGold);
          goldRewardIndicatorNode.setPosition(positionOnWidgetsAboveAllNode);
          safelyAddChild(self.widgetsAboveAllNode, goldRewardIndicatorNode);
          goldRewardIndicatorNode.runAction(cc.sequence([
            cc.moveBy(1, cc.v2(0, 50)),
            cc.callFunc(() => {
              if (goldRewardIndicatorNode && goldRewardIndicatorNode.parent) {
                goldRewardIndicatorNode.removeFromParent();
              }
            })
          ]));
        }

        if (0 < rewardedDiamond) {
          const diamondRewardIndicatorNode = cc.instantiate(self.goldObtainedNotificationPrefab);
          const diamondRewardIndicatorScriptIns = diamondRewardIndicatorNode.getComponent("DescriptionNotification");
          diamondRewardIndicatorScriptIns.setColor(cc.Color.MAGENTA);
          diamondRewardIndicatorScriptIns.setTip(rewardedDiamond);
          diamondRewardIndicatorNode.setPosition(positionOnWidgetsAboveAllNode.add(cc.v2(0, 50)));
          safelyAddChild(self.widgetsAboveAllNode, diamondRewardIndicatorNode);
          diamondRewardIndicatorNode.runAction(cc.sequence([
            cc.moveBy(1.2, cc.v2(0, 50)),
            cc.callFunc(() => {
              if (diamondRewardIndicatorNode && diamondRewardIndicatorNode.parent) {
                diamondRewardIndicatorNode.removeFromParent();
              }
            })
          ]));
        }
      });
    }

    try {
      if (false == self.isStageGoalToDestroyEnemy()) {
        self.comboIndicatorScriptIns.feed(); 
      } else {
        self.comboIndicatorScriptIns.node.removeFromParent();
      }
    } catch (e) {
      console.warn("Failed to feed comboIndicator:", self.comboIndicatorScriptIns, e);
    }

    self.removeAttackingNpc(npcScriptIns, bulletScriptIns, true);
    npcScriptIns.transitToDying(() => {
      if (npcScriptIns && npcScriptIns.node && npcScriptIns.node.parent) {
        npcScriptIns.node.removeFromParent();
      }

      // try to generate smallSheep for bigSheep dying. [begin]
      if (npcScriptIns.speciesName != constants.NPC_ANIM.NAME.BIGSHEEP) {
        return;
      }
      if (bulletScriptIns.explosionType == constants.BULLET_EXPLOSION_TYPE.AOE) {
        for (let i = 0; i < 2; i++) {
          const homePosInMapNode = npcScriptIns.node.position.add(
            cc.v2(getRandomInt(50, 60) * (getRandomInt(0, 2) - 1), getRandomInt(50, 60) * (getRandomInt(0, 2) - 1))
          );
          self.spawnGuardSoldier(homePosInMapNode, constants.NPC_ANIM.NAME.SMALLSHEEP, npcScriptIns.teamId);
        }
      }
      // try to generate smallSheep for bigSheep dying. [end]
    });
    // To update "consumeKnapsackInCache" and determine if stage goal is no longer completable. [begin] {
    let stageGoalNoLongerCompletable = true;
    if (true == self.isStageGoalToDestroyEnemy() && null != npcScriptIns.consumedIngredient) {
      if (null != self.statefulBuildableAttackingNpcScriptInsDict) {
        for (let uuid in self.statefulBuildableAttackingNpcScriptInsDict) {
          stageGoalNoLongerCompletable = false;
          break;
        }  
      }

      self.inBattleSoldierPanelScriptIns.getAllIngredientPageCell().forEach(function(theCell) {
        if (theCell.ingredient.id == npcScriptIns.consumedIngredient.id) {
          /*
           * The "InBattleSoldierPanel" doesn't care about "knapsackConsumedCache" BY FAR.

           -- YFLu, 2019-11-05
           */
          self.consumeKnapsackInCache(theCell.data, 1);
        }
        if (0 < theCell.data.currentCount) {
          /*  
          Some soldiers are still droppable to the battle field.

          -- YFLu, 2019-11-05
          */
          stageGoalNoLongerCompletable = false;
        }
      });
      self.inBattleSoldierPanelScriptIns.refresh();
    } else {
      stageGoalNoLongerCompletable = false;
    }

    if (true == stageGoalNoLongerCompletable) {
      self.onStageFailed();
    }
    // To update "consumeKnapsackInCache" and determine if stage goal is no longer completable. [end] }
  },

  removeStatefulBuildable(statefulBuildableCompIns) {
    BuildableMap.prototype.removeStatefulBuildable.call(this, statefulBuildableCompIns);
    const self = this;
    if (null != statefulBuildableCompIns.node && null != statefulBuildableCompIns.node.defenderNode && null != statefulBuildableCompIns.node.defenderNode.parent) {
      statefulBuildableCompIns.node.defenderNode.removeFromParent();
    }

    if (null != statefulBuildableCompIns.hpBar && null != statefulBuildableCompIns.hpBar.node && null != statefulBuildableCompIns.hpBar.node.parent) {
      statefulBuildableCompIns.hpBar.node.removeFromParent();
    }

    if (null != statefulBuildableCompIns.hpResidualLabel && null != statefulBuildableCompIns.hpResidualLabel.node && null != statefulBuildableCompIns.hpResidualLabel.node.parent) {
      statefulBuildableCompIns.hpResidualLabel.node.removeFromParent();
    }

    self.refreshAttackingNpcsAfterAnythingRemoved(null, statefulBuildableCompIns);
  },

  onStatefulBuildableDestroyedByBullet(statefulBuildableInstance, bulletScriptIns) {
    const self = this;
    if (statefulBuildableInstance.uuid in self.destoryedStatefulBuildableDict) {
      return;
    }
    self.destoryedStatefulBuildableDict[statefulBuildableInstance.uuid] = statefulBuildableInstance;
    console.log('Buildable destoryed:', statefulBuildableInstance.uuid);
    self.removeStatefulBuildable(statefulBuildableInstance); // Will trigger "PolygonBoundaryDefender.onCollisionExit" for the "emitterCharacter".
      
    const debrisPos = statefulBuildableInstance.node.position;
    const destroyedAnimNode = cc.instantiate(self.statefulBuildableDestroyedAnimPrefab);
    destroyedAnimNode.setPosition(debrisPos);
    safelyAddChild(self.node, destroyedAnimNode);
    setLocalZOrder(destroyedAnimNode, CORE_LAYER_Z_INDEX.UN_HIGHLIGHTED_STATEFUL_BUILDABLE_INSTANCE);

    if (null != bulletScriptIns.targetScriptIns) {
      bulletScriptIns.targetScriptIns = null;
    }
      
    ++self.destroyedEnemyStatefulBuildableCount;
    self.refreshScoreAndStar(); 
    self.stageGoalQuestListScriptIns.onBuildableDestoryed(statefulBuildableInstance);
  },

  onEscapingAttackingNpcFled(npcScriptIns) {
    const self = this;
    const stageGoalQuestListScriptIns = self.stageGoalQuestListScriptIns;
    self.removeAttackingNpc(npcScriptIns, null);
    stageGoalQuestListScriptIns.onEscapingAttackingNpcFled();
    self.refreshScoreAndStar();
  },

  removeAttackingNpc(npcScriptIns, bulletScriptIns, keepNpcNode) {
    const self = this;
    if (null == npcScriptIns || null == npcScriptIns.node || null == npcScriptIns.node.uuid) return;

    if (null != npcScriptIns.hpBar && null != npcScriptIns.hpBar.node && null != npcScriptIns.hpBar.node.parent) {
      npcScriptIns.hpBar.node.removeFromParent();
    }

    if (null != npcScriptIns.hpResidualLabel && null != npcScriptIns.hpResidualLabel.node && null != npcScriptIns.hpResidualLabel.node.parent) {
      npcScriptIns.hpResidualLabel.node.removeFromParent();
    }

    if (null != npcScriptIns.visionNode && null != npcScriptIns.visionNode.parent) {
      npcScriptIns.visionNode.removeFromParent();
    }

    if (null != npcScriptIns.defenderNode && null != npcScriptIns.defenderNode.parent) {
      npcScriptIns.defenderNode.removeFromParent();
    }
    delete self.statefulBuildableAttackingNpcScriptInsDict[npcScriptIns.node.uuid];
    if (true != keepNpcNode) {
      if (npcScriptIns.node.parent) {
        npcScriptIns.node.destroy();
      }
    }
    if (null != npcScriptIns.boundStatefulBuildable && null != npcScriptIns.boundStatefulBuildable.boundAttackingNpc) {
      delete npcScriptIns.boundStatefulBuildable.boundAttackingNpc[npcScriptIns.node.uuid];
    }
    for (let k in self.statefulBuildableInstanceCompList) {
      const visionScriptIns = self.statefulBuildableInstanceCompList[k].visionScriptIns;
      if (null != visionScriptIns) {
        delete visionScriptIns.inRangeToAttackTargets[npcScriptIns.node.uuid];
      }
      const defenderScriptIns = self.statefulBuildableInstanceCompList[k].defenderScriptIns;
      if (null != defenderScriptIns) {
        delete defenderScriptIns.inRangeToAttackTargets[npcScriptIns.node.uuid];
      }
    }

    self.refreshAttackingNpcsAfterAnythingRemoved(npcScriptIns, null);
  },

  sendStagePlayerBuildableBindingListQuery(queryParam, callback, alwaysCallback) {
    const self = this;
    queryParam.reqSeqNum = Date.now();
    queryParam.stage = self.currentStageId;
    NetworkUtils.ajax({
      url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + ':' + backendAddress.PORT + constants.ROUTE_PATH.API +
        constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.STAGE_PLAYER_BUILDABLE_BINDING + constants.ROUTE_PATH.LIST + constants.ROUTE_PATH.QUERY,
      type: 'POST',
      data: queryParam,
      success: function(res) {
        if (constants.RET_CODE.OK != res.ret) {
          console.warn("sendStagePlayerBuildableBindingListQuery fails and ret ==", res.ret)
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
        self._onStagePlayerBuildableBindingListQueryResponded(res);
      },
      error: function(err) {
        console.error("sendStagePlayerBuildableBindingListQuery request is responded with error", err);
        if (window.handleNetworkDisconnected) {
          window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
        }
      },
      timeout: function() {
        console.warn("sendStagePlayerBuildableBindingListQuery request is timed out.");
        if (window.handleNetworkDisconnected) {
          window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
        }
      }
    });

  },

  _onBothTiledMapLoadedAndRendered(res, stageInitialState) {
    console.log("StageMap._onBothTiledMapLoadedAndRendered [begins]");
    const self = this;

    let data = stageInitialState.syncData;

    /*
    [WARNING]
    
    The following steps are deliberately re-invoked here because some member vairables of "StatelessBuildable" is only initializable AFTER the TileSize is know.
    */
    self.refreshStatelessBuildableInstances(self.AllStatelessBuildableInstances);

    // 初始化wallet对象 [begins]
    self.wallet = self.wallet || {};
    self.widgetsAboveAllScriptIns.walletInfo.init(self);
    // 初始化wallet对象 [ends]

    // 初始化StatefulBuildableInstance集合 [begins]
    data.playerBuildableBindingList = data.playerBuildableBindingList || [];
    let playerBuildableBindingList = data.playerBuildableBindingList;
    window.playerBuildableBindingList = playerBuildableBindingList;

    self.toCallOnLoadStatefulBuildableDict = {};

    for (let i in playerBuildableBindingList) {
      const playerBuildableBinding = playerBuildableBindingList[i];
      self.toCallOnLoadStatefulBuildableDict[playerBuildableBinding.id] = 0;
    }

    for (let i in playerBuildableBindingList) {
      const playerBuildableBinding = playerBuildableBindingList[i];
      const targetedStatelessBuildableInstance = self._findStatelessBuildableInstance(playerBuildableBinding);
      const statefulBuildableInstance = self.createPerStatefulBuildableInstanceNodes(playerBuildableBinding, targetedStatelessBuildableInstance);
      self.createBoundaryColliderForStatefulBuildableInstance(statefulBuildableInstance);
      self.refreshOrCreateIngredientAcceptor(statefulBuildableInstance);
      self.statefulBuildableInstanceList.push(statefulBuildableInstance.playerBuildableBinding);
      self.statefulBuildableInstanceCompList.push(statefulBuildableInstance);
      self.renderPerStatefulBuildableInstanceNode(statefulBuildableInstance);
      self.refreshOrCreateShelterAndDefenderForStatefulBuildableInstance(statefulBuildableInstance);
      self.refreshLawnForStatefulBuildableInstance(statefulBuildableInstance);

      if (true == self.isStageGoalToDestroyEnemy()) {
        statefulBuildableInstance.teamId = constants.BATTLE_TEAM.DEFAULT_ENEMY_TEAM_ID;
      } else {
        statefulBuildableInstance.teamId = constants.BATTLE_TEAM.DEFAULT_ALLY_TEAM_ID;
      }
    }
    self.baseOverallGoldLimit = data.wallet.goldLimit;
    self.updateOverallGoldLimit(self.baseOverallGoldLimit);
    window.refreshCachedKnownBarrierGridDict(self.node, self.barrierColliders, null);
    // 初始化StatefulBuildableInstance集合 [ends]

    // 初始化"防御兵"集合 [begins]
    const guardSoldierList = stageInitialState.guardSoldierList; 
    for (let k in guardSoldierList) {
      const guardSoldier = guardSoldierList[k]; 
      const homePosInMapNode = tileCollisionManager._continuousFromCentreOfDiscreteTile(self.node, self.tiledMapIns, null, guardSoldier.tileDiscretePositionX, guardSoldier.tileDiscretePositionY);
      self.spawnGuardSoldier(homePosInMapNode, constants.NPC_ANIM.NAME[guardSoldier.species], guardSoldier.teamId);
    } 
    // 初始化"防御兵"集合 [ends]

    self.widgetsAboveAllScriptIns.walletInfo.setData({
      gold: (null != data.wallet && null != data.wallet.gold) ? data.wallet.gold : 0,
      diamond: res.diamond,
    });

    self.refreshStatelessBuildableInstanceCardListDisplay();

    // 构造各个StatefulBuildableInstance的IngredientProgressListEntry [begins].
    const ingredientProgressList = res.ingredientProgressList || [];
    self.statefulBuildableInstanceCompList.forEach((statefulBuildableInstance) => {
      if (
        statefulBuildableInstance.id != constants.STATELESS_BUILDABLE_ID.FARMLAND
        && statefulBuildableInstance.id != constants.STATELESS_BUILDABLE_ID.RESTAURANT
        && statefulBuildableInstance.id != constants.STATELESS_BUILDABLE_ID.BAKERY
        && statefulBuildableInstance.id != constants.STATELESS_BUILDABLE_ID.HEADQUARTER
        && statefulBuildableInstance.id != constants.STATELESS_BUILDABLE_ID.LABORATORY
      ) {
        // hardcode temporarily.
        return;
      }
      let data = ingredientProgressList.filter(x => x.playerBuildableBindingId == statefulBuildableInstance.playerBuildableBinding.id);
      self.refreshIngredientProgressListEntry(statefulBuildableInstance, data);
    });
    // 构造各个StatefulBuildableInstance的IngredientProgressListEntry [ends].

    clearTimeout(self._timeroutTimer);
    self._timeroutTimer = null; 
  
    // Renders the "allyEscapingTargetList". [begins]
    for (let k in self.allyEscapingTargetList) {
      const escapingTargetPos = self.allyEscapingTargetList[k]; 
      const escapingTargetNode = cc.instantiate(self.escapingTargetPrefab);
      const escapingTargetScriptIns = escapingTargetNode.getComponent("EscapingTarget");
      escapingTargetScriptIns.setForAlly();
      escapingTargetNode.setPosition(escapingTargetPos);
      safelyAddChild(self.node, escapingTargetNode);
      setLocalZOrder(escapingTargetNode, window.CORE_LAYER_Z_INDEX.PLAYER);
      if (self.isStageGoalToDestroyEnemy()) {
        escapingTargetNode.opacity = 0;
      }
    }
    // Renders the "allyEscapingTargetList". [ends]

    // Renders the "InBattleSoldierPanel". [begins]
    self.inBattleSoldierPanelNode = cc.instantiate(self.inBattleSoldierPanelPrefab);
    self.inBattleSoldierPanelScriptIns = self.inBattleSoldierPanelNode.getComponent("InBattleSoldierPanel");

    self.inBattleSoldierPanelScriptIns.init(self);
    const effectiveInBattleSoldierArray = self.computeEffectiveInBattleSoldierArray(self.soldierArray, self.volatileKnapsackDict);
    self.inBattleSoldierPanelScriptIns.setData(effectiveInBattleSoldierArray);
    self.inBattleSoldierPanelScriptIns.refresh();
    self.inBattleSoldierPanelScriptIns.searchForAndSwitchToPossibleActiveSoldier();
    // Renders the "InBattleSoldierPanel". [ends]

    self.allMapsFadedIn = true;
    self.tryToStartStageTimer(1000 * self.stageGoal.timeLimitSeconds);
    console.log("StageMap._onBothTiledMapLoadedAndRendered [ends]");
  },

  _onStagePlayerBuildableBindingListQueryResponded(res) {
    const self = this;

    // Init buildableDict. [begins]
    self.buildableDict = {};
    for (let k in res.buildableList) {
      const buildable = res.buildableList[k];
      self.buildableDict[buildable.id] = buildable;
    }

    self.buildableIngredientInteractionList = res.buildableIngredientInteractionList;
    // Init buildableDict. [ends]

    // Initialization of IngredientList for player [begins]
    for (let k in res.ingredientList) {
      const ingredient = res.ingredientList[k];
      self.initIngredientItem(ingredient);
    }
    // Initialization of IngredientList for player [ends]

    // Load recipeList. [begin]
    self.recipeDict = {};
    for (let k in res.recipeList) {
      const recipeItem = res.recipeList[k];
      const consumables = [],
        targetIngredientList = [];
      for (let kk in recipeItem.recipeIngredientBindingList) {
        const recipeIngredientBinding = recipeItem.recipeIngredientBindingList[kk];
        recipeIngredientBinding.recipeId = recipeItem.id;
        if (recipeIngredientBinding.prependedBinocularOperator == constants.RECIPE.PREPENDED_BINOCULAR_OPERATOR.RESULT) {
          targetIngredientList.push(self.getIngredientById(recipeIngredientBinding.ingredientId));
        } else {
          consumables.push(self.getIngredientById(recipeIngredientBinding.ingredientId));
        }
      }
      if (null != recipeItem.targetIngredientId) {
        recipeItem.targetIngredient = self.getIngredientById(recipeItem.targetIngredientId);
      }
      recipeItem.consumables = consumables;
      recipeItem.targetIngredientList = targetIngredientList;
      self.recipeDict[recipeItem.id] = recipeItem;
    }
    // Load recipeList. [end]

    self.exchangeRateOfGoldToDiamond = null == res.exchangeRateOfGoldToDiamond ? 100 : res.exchangeRateOfGoldToDiamond;
    self.exchangeRateOfTimeToDiamond = null == res.exchangeRateOfTimeToDiamond ? 60 * 1000 : res.exchangeRateOfTimeToDiamond;

    // Decode stageInitialState. [begin]
    const stageInitialState = self.decodeStageInitialState(res.stageInitialState);
    // Deliberately redecode stageInitialState (deep copy).
    self.stageInitialState = self.decodeStageInitialState(res.stageInitialState); // Cached for later comparison to identify the progress of "StageGoalQuest"s.
    // Decode stageInitialState. [end]

    self.AllStatelessBuildableInstances = self.transitBuildableLevelBindingConfToStatelessBuildbaleInstances(stageInitialState.stageBuildableLevelBindingList);
    self.refreshStatelessBuildableInstances(self.AllStatelessBuildableInstances);

    self.initKnapsackArray(res.knapsack);
    self.initVolatileKnapsackDict(stageInitialState.knapsack);
    self.initPlayerRecipe(stageInitialState.playerRecipeList);

    // 初始化StageGoalQuest的显示与监听器。 -- YFLu, 2019-09-14
    if (null != stageInitialState.goal) {
      self.stageGoalQuestListNode = self.widgetsAboveAllScriptIns.stageGoalQuestListNode;
      self.stageGoalQuestListScriptIns = self.stageGoalQuestListNode.getComponent("StageGoalQuestList");
      self.stageGoalQuestListScriptIns.mapIns = self;

      const stageGoal = stageInitialState.goal;
      self.stageGoal = stageGoal;

      self.stageGoalQuestListScriptIns.setData(stageGoal.questList);

      self.stageGoalPanelNode = cc.instantiate(self.stageGoalPanelPrefab);
      const stageGoalPanelScriptIns = self.stageGoalPanelNode.getComponent("StageGoalPanel");
      stageGoalPanelScriptIns.mapIns = self;

      const effectiveInBattleSoldierArray = self.computeEffectiveInBattleSoldierArray(self.soldierArray, self.volatileKnapsackDict);
      stageGoalPanelScriptIns.setData(i18n.t("StageSelectionCell.DisplayName." + self.currentStageId), stageGoal.questList, effectiveInBattleSoldierArray);

      stageGoalPanelScriptIns.fadeOutDurationSeconds = 0;
      stageGoalPanelScriptIns.onCloseDelegate = () => {
        let ccSeqActArray = [];
        ccSeqActArray.push(cc.fadeOut(stageGoalPanelScriptIns.fadeOutDurationSeconds));
        ccSeqActArray.push(cc.callFunc(() => {
          self.exitPanelView(stageGoalPanelScriptIns);
          if (null != stageGoalPanelScriptIns.afterFadedOutCb) {
            stageGoalPanelScriptIns.afterFadedOutCb();
          }
        }, self));

        self.stageGoalPanelNode.runAction(cc.sequence(ccSeqActArray));
      };

      stageGoalPanelScriptIns.onBackToStageSelection = function() {
        self.playEffectCommonButtonClick();
        self.showSimpleConfirmationPanel(i18n.t('ConfirmationPanel.Tip.backToStageSelection'), function() {
          self.clearPanels();
          cc.director.loadScene(self.stageSelectionName);
        });
      };
      
      stageGoalPanelScriptIns.onConfirmButtonClicked = (evt) => {
        self.playEffectCommonButtonClick();
        stageGoalPanelScriptIns.fadeOutDurationSeconds = 0.2;
        stageGoalPanelScriptIns.afterFadedOutCb = () => {
          self.stageGoalPanelDismissed = true;
          self.tryToStartStageTimer(1000 * stageGoal.timeLimitSeconds);
        };
        stageGoalPanelScriptIns.onCloseDelegate();
      };

      stageGoalPanelScriptIns.onScoutButtonClicked = (evt) => {
        self.playEffectCommonButtonClick();
        stageGoalPanelScriptIns.fadeOutDurationSeconds = 0;
        stageGoalPanelScriptIns.afterFadedOutCb = () => {
          self.findStatefulBuildableInstanceAtPosition = BuildableMap.prototype.findStatefulBuildableInstanceAtPosition;
          self.addInScouting();
        };
        stageGoalPanelScriptIns.onCloseDelegate();
      };
      self.enterPanelView(stageGoalPanelScriptIns);
    }

    self.attackWaveList = stageInitialState.attackWaveList; 

    self.renderCurrentTileMap(function(err, tmxAssetOfMainMap, tmxAssetOfBackgroundMap) {
      if (null != err) {
        return;
      }

      const tiledMapIns = self.node.getComponent(cc.TiledMap);
      tiledMapIns.tmxAsset = null;
      self.node.removeAllChildren();
      tiledMapIns.tmxAsset = tmxAssetOfMainMap;
      const newMapSize = tiledMapIns.getMapSize();
      const newMapTileSize = tiledMapIns.getTileSize();
      tiledMapIns.node.setContentSize(newMapSize.width * newMapTileSize.width, newMapSize.height * newMapTileSize.height);
      tiledMapIns.node.setPosition(cc.v2(0, 0));

      const boundaryObjs = tileCollisionManager.extractBoundaryObjects(self.node);
      tileCollisionManager.initMapNodeByTiledBoundaries(self, self.node, boundaryObjs);

      // Move Camera to specified position. [begins]
      if (null != self.initialCameraPos) {
        self.moveCameraToPosition(self.initialCameraPos, 0, null);
      }
      // Move Camera to specified position. [ends]

      self.highlighterLayer = tiledMapIns.getLayer("StatefulBuildableInstanceHighlighter");
      self.tiledMapIns = tiledMapIns;
      setLocalZOrder(self.highlighterLayer.node, window.CORE_LAYER_Z_INDEX.STATEFUL_BUILDABLE_INSTANCE_HIGHLIGHTER_LAYER);

      // Initialization of lawn. [begin] {
      self.lawnLayer = self.tiledMapIns.getLayer("Lawn");
      if (null != self.lawnLayer) {
        setLocalZOrder(self.lawnLayer.node, window.CORE_LAYER_Z_INDEX.LAWN_LAYER);
      }
      self.clearLawnLayer();
      // Initialization of lawn. [end] }

      self._onBothTiledMapLoadedAndRendered(res, stageInitialState);

      // Init "destroyedEnemyStatefulBuildableCount" & "totalEnemyStatefulBuildableCount". [begins]
      // These steps are only feasible AFTER the processing of "data.playerBuildableBindingList".
      self.destroyedEnemyStatefulBuildableCount = 0;    
      self.totalEnemyStatefulBuildableCount = self.statefulBuildableInstanceCompList.length;
      self.refreshScoreAndStar();
      // Init "destroyedEnemyStatefulBuildableCount" & "totalEnemyStatefulBuildableCount". [ends]

      self.shouldSetTileMapCullingDirty = true;

      console.log("StageMap._onStagePlayerBuildableBindingListQueryResponded, has assigned `self.shouldSetTileMapCullingDirty = true`");
    });

    self.currentTutorialStage = stageInitialState.syncData.tutorialStage || 0;
  },

  initAfterAllTutorialStages() {
    NarrativeSceneManagerDelegate.prototype.initAfterAllTutorialStages.call(this);
    const self = this;
    const mapScriptIns = self;
    const mapNode = self.node;
    const canvasNode = mapNode.parent;
    const selfPlayer = JSON.parse(cc.sys.localStorage.getItem("selfPlayer"));

    self.refreshPopupEntry();
    self.refreshLockedButtonByBuildable();
    self.refreshBuildButtonCountTip();

    self.startStageTimer(1000 * self.stageGoal.timeLimitSeconds);
  },

  decodeStageInitialState(stageInitialStateEncodedString) {
    const self = this;
    const stageInitialState = window.pbDecodeData(window.stageInitialState, stageInitialStateEncodedString);
    stageInitialState.knapsack.forEach(function(knapsackItem) {
      knapsackItem.ingredient = self.getIngredientById(knapsackItem.ingredientId);
    });
    stageInitialState.playerRecipeList.forEach(function(playerRecipe) {
      if (null == playerRecipe.recipeId || 0 == playerRecipe.recipeId /* The pb default value of an integer is 0 instead of null. */ ) {
        playerRecipe.targetIngredient = self.getIngredientById(playerRecipe.ingredientId);
      } else if (null != playerRecipe.recipeId && 0 != playerRecipe.recipeId) {
        let recipe = self.recipeDict[playerRecipe.recipeId];
        playerRecipe.ingredientId = null;
        playerRecipe.recipeIngredientBindingList = recipe.recipeIngredientBindingList;
        playerRecipe.recipe = recipe;
        if (null != recipe.targetIngredientId) {
          playerRecipe.targetIngredient = self.getIngredientById(recipe.targetIngredientId);
        } else {
          playerRecipe.targetIngredientList = playerRecipe.recipeIngredientBindingList.filter(function(recipeIngredientBinding) {
            return recipeIngredientBinding.prependedBinocularOperator == constants.RECIPE.PREPENDED_BINOCULAR_OPERATOR.RESULT;
          }).map(function(recipeIngredientBinding) {
            return self.getIngredientById(recipeIngredientBinding.ingredientId);
          })
        }
      } else {
        // Deliberately left blank. -- YFLu, 2019-09-15
      }
    });
    stageInitialState.stageBuildableLevelBindingList.forEach(function(singleStageBuildableLevelBindingList) {
      singleStageBuildableLevelBindingList.buildable = self.buildableDict[singleStageBuildableLevelBindingList.buildableId];
    })
    return stageInitialState;
  },

  sendPlayerStageTerminateQuery(successCb, failCb) {
    // TODO: remove the hardcoded data.
    const self = this;
    const score = self.allGoalQuestFulfilled() ? self.calculateScore() : 0;
    const starCount = self.calculateStar(score);

    let effectiveConsumedKnapsackDict = {};
    /*
    * We'll consume the volatile knapsack first as it's a more 
    * user friendly priority. 
    * 
    * -- YFLu, 2019-11-25.
    */

    for (let k in self.knapsackConsumedCache) {
      if (null != self.volatileKnapsackDict[k]) {
        effectiveConsumedKnapsackDict[k] = (self.knapsackConsumedCache[k] - self.volatileKnapsackDict[k]); 
      } else {
        effectiveConsumedKnapsackDict[k] = (self.knapsackConsumedCache[k]); 
      }
    }

    NetworkUtils.ajax({
      url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + ':' + backendAddress.PORT + constants.ROUTE_PATH.API + constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.STAGE + constants.ROUTE_PATH.PLAYER_STAGE_TERMINATE,
      type: "POST",
      data: {
        intAuthToken: JSON.parse(cc.sys.localStorage.getItem("selfPlayer")).intAuthToken,
        reqSeqNum: Date.now(),
        stage: self.currentStageId,
        score: score,
        stars: starCount,
        consumedKnapsackDict: JSON.stringify(effectiveConsumedKnapsackDict),
      },
      success(res) {
        if (constants.RET_CODE.OK != res.ret) {
          console.warn('Send playerStageTerminate query failed and return code is', res.ret);
          failCb && failCb(null, res);
        } else {
          if (null != window.cachedPlayerStageBindingData) {
            window.cachedPlayerStageBindingData.diamond = res.diamond;
            self.widgetsAboveAllScriptIns.walletInfo.setData({
              diamond: res.diamond,
            });
            window.cachedPlayerStageBindingData.star = res.star;
            if (null != window.cachedPlayerStageBindingData.playerStageBindingList) {
              let targetPlayerStageBinding = window.cachedPlayerStageBindingData.playerStageBindingList.find(function(playerStageBinding) {
                return playerStageBinding.stageId == res.playerStageBinding.stageId;
              });
              if (null != targetPlayerStageBinding) {
                Object.assign(targetPlayerStageBinding, res.playerStageBinding);

                // Warning: StageMap从localStorage中读取数据，数据更新时应重新写入。
                cc.sys.localStorage.setItem('stage', JSON.stringify({
                  stageId: self.currentStageId,
                  stage: self.stage,
                  index: self.stageIndex,
                  stageBinding: targetPlayerStageBinding,
                  diamond: res.diamond,
                }));
              } else {
                console.warn("Why I can find the target playerStageBinding?");
                window.cachedPlayerStageBindingData = {
                  playerStageBindingList: [],
                };
              }
              if (null != res.unlockedPlayerStageBinding) {
                let targetPlayerStageBinding = window.cachedPlayerStageBindingData.playerStageBindingList.find(function(playerStageBinding) {
                  return playerStageBinding.stageId == res.unlockedPlayerStageBinding.id;
                });
                if (null != targetPlayerStageBinding) {
                  Object.assign(targetPlayerStageBinding, res.unlockedPlayerStageBinding);
                } else {
                  window.cachedPlayerStageBindingData.playerStageBindingList.push(res.unlockedPlayerStageBinding);
                }
              }
            }
          }
          successCb && successCb({
            score: score,
            star: starCount,
          });
        }
      },
      error(err) {
        console.warn('Error occurs when send playerStageTerminate query', err);
        failCb && failCb(err, null);
      },
      timeout() {
        console.warn('Send playerStageTerminate query timeout.');
        failCb && failCb(new Error(constants.NETWORK.ERROR.TIMEOUT), null);
      },
    });

  },

  update(dt) {
    const self = this;
    if (true == self.isPaused()) {
      for (let statefulBuildableInstanceComp of self.statefulBuildableInstanceCompList) {
        if (null == statefulBuildableInstanceComp) {
          continue;
        }
        if (null == statefulBuildableInstanceComp.progressInstance) {
          continue;
        }
        statefulBuildableInstanceComp.progressInstance.incrementWaivedMillis(1000*dt);
      }
    }
    if (null == self.stageStartTime) {
      return;
    }
    if (true == self.currentStageStopped) {
      return;
    }
    BuildableMap.prototype.update.call(self);
  },

  tryToStartStageTimer(stageTimeMillis) {
    const self = this;
    if (null != self.stageStartTime) {
      // It has already been started!
      return;
    }
    if (false == self.allMapsFadedIn || false == self.stageGoalPanelDismissed) {
      return;
    }
    let isStageTutorialPassed = false;
    let targetTutorialGroupIndex;
    let targetTutorialGroupData;
    let cachedCurrentTutorialStageNotInTargetGroup = false;
    switch (self.stageIndex) {
    case 1:
    targetTutorialGroupIndex = 2; // Hardcoded temporarily. -- YFLu, 2019-10-16.
    targetTutorialGroupData = constants.TUTORIAL_STAGE_GROUP[targetTutorialGroupIndex];
    cachedCurrentTutorialStageNotInTargetGroup = (null == targetTutorialGroupData.EDGES[self.currentTutorialStage] && self.currentTutorialStage != targetTutorialGroupData.END); 
    isStageTutorialPassed = self.currentStageBinding.highestScore > 0;
    if (isStageTutorialPassed || null == targetTutorialGroupData || self.currentTutorialStage == targetTutorialGroupData.END) {
      self.initAfterAllTutorialStages();
    } else {
      // Already confirmed that the tutorial should show. 
      self.currentTutorialGroupIndex = targetTutorialGroupIndex; 
      if (null != targetTutorialGroupData && (null == self.currentTutorialStage || cachedCurrentTutorialStageNotInTargetGroup)) {
        self.currentTutorialStage = targetTutorialGroupData.START;
      }
      let zoomDuration = self.mainCamera.zoomRatio != 1 ? 0.5 : 0;
      self.transitZoomRatioTo(1, zoomDuration, function() {
        self.narrativeSceneManager.showTutorialStage(null, self.currentTutorialStage);
      });
      if (self.currentTutorialStage != targetTutorialGroupData.END) {
        self.setSideButtonGroupActive(false, true);
      }
    }
    break;
    default:
    self.initAfterAllTutorialStages();
    break;
    }
  },

  startStageTimer(stageTimeMillis) {
    const self = this;
    self.resume();
    if (null != window.tt) {
      window.ttRecorder = tt.getGameRecorderManager();

      window.ttRecorder.onStart(res => {
        console.log("录屏开始");
        // do something
      });
      window.ttRecorder.onPause(res => {
        console.log("录屏暂停");
        // do something
      });
      window.ttRecorder.onResume(res => {
        console.log("录屏恢复");
        // do something
      });
      window.ttRecorder.onStop(res => {
        self.ttRecorderStoppedResult = res;
        console.log("录屏终止", res.videoPath);
        // do something
      });
      window.ttRecorder.onError(errStr => {
        console.log("录屏终止", errStr);
        // do something
      });

      window.ttRecorder.start({
        duration: (stageTimeMillis/1000)
      });
    }
    self.onAttackingNpcClicked(null, null);
    self.destroyedEnemyStatefulBuildableCount = 0;    
    self.totalEnemyStatefulBuildableCount = self.statefulBuildableInstanceCompList.length;

    self.stageTimerNode = self.widgetsAboveAllScriptIns.stageTimerNode;
    self.stageTimerNode.active = true;

    self.findStatefulBuildableInstanceAtPosition = BuildableMap.prototype.findStatefulBuildableInstanceAtPosition;

    self.stageGoalQuestListScriptIns.node.active = true;
    self.setSideButtonGroupActive(true);
    if (true == self.isStageGoalToDestroyEnemy()) {
      self.widgetsAboveAllScriptIns.walletNode.active = false;
    } else {
      self.widgetsAboveAllScriptIns.walletNode.active = true;
    }

    self.stageStartTime = Date.now();
    let progressNumberIns = self.stageTimerNode.getComponent('ProgressNum');
    progressNumberIns.setData(null, stageTimeMillis, self.stageStartTime);
    progressNumberIns.update = function(dt) {
      if (self.isPaused()) {
        progressNumberIns.incrementWaivedMillis(1000*dt);
      } else {
        self.elapsedTimeMillis += (1000*dt);
      }
      let prevCurrentlyDisplayingQuantity = progressNumberIns.currentlyDisplayingQuantity;
      ProgressNum.prototype.update.call(this, dt);
      if (null !== progressNumberIns.maxValue &&
          prevCurrentlyDisplayingQuantity < progressNumberIns.maxValue &&
          progressNumberIns.currentlyDisplayingQuantity >= progressNumberIns.maxValue
      ) {
        self.stopStageTimer();
        self.onStageTimedOut && self.onStageTimedOut();
      }
    }
    // tensionForRemainingMillis tip [begin]. {
    const tensionForRemainingMillis = 10000;
    progressNumberIns.formulateIndicatorLabelStr = function() {
      if (progressNumberIns.isForElapsedTimeProgress) {
        const elapsedMillis = this.targetQuantity;
        const durationMillis = this.maxValue;
        let remainingMillis = (durationMillis - elapsedMillis);
        if (remainingMillis <= tensionForRemainingMillis) {
          progressNumberIns.indicatorLabel.node.color = Math.floor(remainingMillis / 1000) % 2 != 0 ? cc.color('#DE5244') : cc.Color.WHITE;
        } else {
          progressNumberIns.indicatorLabel.node.color = cc.Color.WHITE;
        }
      }
      return ProgressNum.prototype.formulateIndicatorLabelStr.apply(this, arguments);
    }
    // tensionForRemainingMillis tip [end]. }
    progressNumberIns.enabled = true;

    self.currentStageStopped = false;
    self.toSpawnEscapingAttackingNpcWaveIndex = 0; 

    safelyAddChild(self.widgetsAboveAllNode, self.inBattleSoldierPanelNode); 
  },

  saveAllPlayerSyncData() {
    /*
    Deliberately NOT calling upsync in "StageMap", thus avoiding the temporary data contamination issue on backend. 

    -- YFLu, 2019-10-16.
    */ 
  },

  stopStageTimer() {
    const self = this;
    if (null != window.ttRecorder) {
      window.ttRecorder.stop();
    }
    self.allMapsFadedIn = false;
    self.stageGoalPanelDismissed = false;
    self.stageStartTime = null;
    self.stageTimerNode = self.widgetsAboveAllScriptIns.stageTimerNode;
    self.stageTimerNode.active = false;
    self.setSideButtonGroupActive(false);
    self.widgetsAboveAllScriptIns.walletNode.active = false;
    self.stageGoalQuestListScriptIns.node.active = false;
    self.pause();

    self.findStatefulBuildableInstanceAtPosition = null;

    self.onCancelDraggingIngredient();
    if (null != self.floatingKnapsackPanelIns) {
      self.floatingKnapsackPanelIns.onCloseClicked();
    }

    if (null != self.spawnAttackingNpcInterval) {
      clearInterval(self.spawnAttackingNpcInterval);
      self.spawnAttackingNpcInterval = null;
    }

    if (null != self.spawnEscapingAttackingNpcInterval) {
      clearInterval(self.spawnEscapingAttackingNpcInterval);
      self.spawnEscapingAttackingNpcInterval = null;
    }

    for (let k in self.statefulBuildableAttackingNpcScriptInsDict) {
      const theAttackingNpc = self.statefulBuildableAttackingNpcScriptInsDict[k];
      self.removeAttackingNpc(theAttackingNpc);
    }

    if (null != self.saveAllPlayerSyncDataInterval) {
      clearInterval(self.saveAllPlayerSyncDataInterval);
      self.saveAllPlayerSyncDataInterval = null;
    }

    let progressNumberIns = self.stageTimerNode.getComponent('ProgressNum');
    progressNumberIns.update = ProgressNum.prototype.update;
    progressNumberIns.enabled = false;
  },

  onStageTimedOut() {
    const self = this;
    self.onStageTerminated();
  },

  onStageFailed() {
    const self = this;
    self.stopStageTimer();
    self.onStageTerminated();
  },
  
  onStageCompleted() {
    const self = this;
    self.stopStageTimer();
    self.onStageTerminated();
  },

  onStageTerminated() {
    const self = this;
    if (true == self.currentStageStopped) {
      return;
    }
    self.currentStageStopped = true;
    self.sendPlayerStageTerminateQuery(function(stageScoreData) {
      const score = stageScoreData.score,
        star = stageScoreData.star;
      self.showResultPanel(score, star);
    }, function(err, res) {
      if (null == err && null != res && constants.RET_CODE.INVALID_TOKEN == res.ret) {
        window.handleTokenExpired(self.node, self.simplePressToGoDialogPrefab);
      } else {
        window.handleNetworkDisconnected(self.node, self.simplePressToGoDialogPrefab);
      }
    });
  },

  showResultPanel(score, star) {
    const self = this;
    self.onAttackingNpcClicked(null, null);
    let resultPanelNode = cc.instantiate(self.stageResultPanelPrefab);
    let resultPanelIns = resultPanelNode.getComponent('StageResultPanel');
    self.resultPanelIns = resultPanelIns; 
    let stageIndex = self.stageIndex;
    let nextStageData = null;
    if (null != window.cachedPlayerStageBindingData) {
      let nextStageIndex = stageIndex + 1, nextStage = null, nextStageBinding = null;
      // warning: stageIndex is started at 1, not zero.
      nextStageBinding = window.cachedPlayerStageBindingData.playerStageBindingList[nextStageIndex-1];
      if (null != nextStageBinding && constants.FUTURE_STAGE_ID != nextStageBinding.stageId) {
        nextStage = window.cachedPlayerStageBindingData.stageList.find(function(stage) {
          return stage.id == nextStageBinding.stageId;
        });

        nextStageData = {
          stageId: nextStageBinding.stageId,
          stage: nextStage,
          index: nextStageIndex,
          stageBinding: nextStageBinding,
        };

        if (null == nextStage) {
          console.warn("Why I can't find a stage with", nextStageBinding.stageId);
          nextStageData = null;
        }
        
      } else {
        nextStageData = null;
      }
    } else {
      console.warn('How can I get the next stage without cachedPlayerStageBindingData?');
      nextStageData = null;
    }
    resultPanelIns.onReplay = function() {
      self.costDiamondsToDo(self.stage.ticketPrice, function() {
        cc.director.loadScene(self.mapName);
      }, function() {
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
      });
    }
    resultPanelIns.onBackToStageSelection = function() {
      cc.director.loadScene(self.stageSelectionName);
    }
    resultPanelIns.onShare = function() {
      self.shareCurrentStageMap();
    }
    resultPanelIns.onVideoShare = function() {
      self.shareCurrentStageMap("video");
    }
    resultPanelIns.onCloseDelegate = function() {
      self.exitPanelView(resultPanelIns);
      self.closeBottomBannerAd();
    }
    resultPanelIns.onGoToNextStage = function(nextStageData) {
      self.costDiamondsToDo(nextStageData.stage.ticketPrice, function() {
        cc.sys.localStorage.setItem('stage', JSON.stringify({
          stageId: nextStageData.stageId,
          stage: nextStageData.stage,
          index: nextStageData.index,
          stageBinding: nextStageData.stageBinding,
          diamond: self.wallet.diamond,
        }));
        cc.director.loadScene(self.mapName);
      }, function() {
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
      });
    }
    resultPanelIns.init(self, self.stageData, nextStageData);
    resultPanelIns.setData(score, star, self.currentStageBinding.highestScore, self.currentStageBinding.highestStars, stageIndex);
    self.clearPanels();
    self.enterPanelView(resultPanelIns);
    self.openBottomBannerAd();
    resultPanelIns.refresh();
    if (0 >= star) {
      // stage failure.
      self.playEffectCommonFailure();
    } else {
      // stage passed.
      self.playEffectCommonCongrat();
    }
  },

  onStageMenuTriggerButtonClicked(evt) {
    const self = this;
    if (null != evt) {
      self.playEffectCommonButtonClick();
    }
    if (true == self.isInScouting()) {
      self.removeInScouting();
      self.findStatefulBuildableInstanceAtPosition = null;
      self.enterPanelView(self.stageGoalPanelNode.getComponent("StageGoalPanel"));
      return;
    }
    if (false == self.isPurelyVisual()) {
      return;
    }
    const stageMenuPanelNode = cc.instantiate(self.stageMenuPanelPrefab);
    const stageMenuPanelIns = stageMenuPanelNode.getComponent('StageMenuPanel');
    stageMenuPanelIns.init(self);
    stageMenuPanelIns.onReplay = function() {
      self.showSimpleConfirmationPanel(i18n.t('ConfirmationPanel.Tip.replay'), function() {
        self.clearPanels();
        if (null != window.ttRecorder) {
          window.ttRecorder.stop();
        }
        cc.director.loadScene(self.mapName);
      });
    };
    stageMenuPanelIns.onBackToStageSelection = function() {
      self.showSimpleConfirmationPanel(i18n.t('ConfirmationPanel.Tip.backToStageSelection'), function() {
        self.clearPanels();
        cc.director.loadScene(self.stageSelectionName);
      });
    };
    stageMenuPanelIns.onCloseDelegate = function() {
      self.exitPanelView(stageMenuPanelIns);
      self.resume();
      if (true == self.stageGoalPanelDismissed) {
        self.inBattleSoldierPanelNode.active = true;
      } else {
        // false == self.stageGoalPanelDismissed
        self.enterPanelView(self.stageGoalPanelNode.getComponent("StageGoalPanel"));
      }
    };
    if (true == self.stageGoalPanelDismissed) {
      self.inBattleSoldierPanelNode.active = false;
    }
    self.onAttackingNpcClicked(null, null);
    self.enterPanelView(stageMenuPanelIns);
    self.pause();
  },

  // temporarily hide entry for supporting multi-target recipe. [begin]
  refreshLockedButtonByBuildable() {
    const self = this;
    BuildableMap.prototype.refreshLockedButtonByBuildable.apply(self, arguments);
    self.recipeButton.node.active = false;
    if (true == self.isStageGoalToDestroyEnemy()) {
      self.buildButton.node.active = false;
    }
  },

  refreshStatefulBuildableController() {
    const self = this;
    BuildableMap.prototype.refreshStatefulBuildableController.apply(self, arguments);
    self.upgradeButton.node.active = false;
    self.hqProductionButton.node.active = false;
    self.bakeryProductionButton.node.active = false;
    self.labResearchButton.node.active = false;
  },

  getUnlockIngredientIdsAfterBuildableUpgradeDone(buildableId, fromLevel, toLevel, producibleOnly = false) {
    const self = this;
    let ingredientIdList = BuildableMap.prototype.getUnlockIngredientIdsAfterBuildableUpgradeDone.call(self, buildableId, fromLevel, toLevel, producibleOnly);
    return ingredientIdList.filter(function(ingredientId) {
      return null != self.stageInitialState.playerRecipeList.find(function(playerRecipe) {
          if (null != playerRecipe.ingredientId && producibleOnly) {
            return ingredientId == playerRecipe.ingredientId && playerRecipe.state != constants.RECIPE.STATE.UNLOCKED;
          } else if (null != playerRecipe.targetIngredient && !producibleOnly) {
            return ingredientId == playerRecipe.targetIngredient.id && playerRecipe.state != constants.RECIPE.STATE.UNLOCKED;
          } else if (null == playerRecipe.targetIngredient && null == playerRecipe.ingredientId) {
            console.warn('You may not handle the multi-target recipe?');
            return false;
          }
        })
    })
  },

  // temporarily hide entry for supporting multi-target recipe. [end]

  updateBuildableMapGUIForBuildOrUpgradeDone(statefulBuildableInstance) {
    const self = this;
    BuildableMap.prototype.updateBuildableMapGUIForBuildOrUpgradeDone.apply(self, arguments);
    // 更新StageGoalQuestList下的节点的显示（如适用）。 -- YFLu, 2019-09-14
    const stageGoalQuestListScriptIns = self.stageGoalQuestListScriptIns;
    stageGoalQuestListScriptIns.onStatefulBuildableListChanged();
    self.refreshScoreAndStar();
  },

  allGoalQuestFulfilled() {
    const self = this;
    for (let k in self.stageGoalQuestListScriptIns.questNodeCompList) {
      const stageGoalQuestScriptIns = self.stageGoalQuestListScriptIns.questNodeCompList[k];
      if (constants.RESOURCE_TYPE.ESCAPED_ATTACKING_NPC_FOR_ENEMY == stageGoalQuestScriptIns.quest.resourceType) {
        continue;
      }
      const thisQuestCompletedCountRequired = stageGoalQuestScriptIns.quest.completedCountRequired;
      const thisQuestCompletedCount = parseInt(stageGoalQuestScriptIns.completedCountIndicator.string);
      if (thisQuestCompletedCountRequired > thisQuestCompletedCount) {
        return false;
      }
    }
    return true;
  },

  // WARNING: If score's calculation changed, eg. by server, update this. [begin]
  calculateScore() {
    const self = this;
    if (true == self.isStageGoalToDestroyEnemy())  {
      const destroyedRatio = (self.destroyedEnemyStatefulBuildableCount/self.totalEnemyStatefulBuildableCount);
      const passScore = self.stageInitialState.goal.passScore;
      const score = (self.allGoalQuestFulfilled() ? passScore : 0) + parseInt(0.5*destroyedRatio*passScore);
      return score;
    } else {
      let totalGoalQuestCompletedCount = 0;
      let totalGoalQuestCompletedCountRequired = 0;

      let totalForFailingGoalQuestCompletedCount = 0;
      let totalForFailingGoalQuestCompletedCountRequired = 0;

      for (let k in self.stageGoalQuestListScriptIns.questNodeCompList) {
        const stageGoalQuestScriptIns = self.stageGoalQuestListScriptIns.questNodeCompList[k];
        switch (stageGoalQuestScriptIns.quest.resourceType) {
          case constants.RESOURCE_TYPE.ESCAPED_ATTACKING_NPC_FOR_ENEMY:
            totalForFailingGoalQuestCompletedCountRequired += stageGoalQuestScriptIns.completedCountRequired;
            totalForFailingGoalQuestCompletedCount += stageGoalQuestScriptIns.currentCompletedCount;
            break;
          default:
            totalGoalQuestCompletedCountRequired += stageGoalQuestScriptIns.completedCountRequired;
            totalGoalQuestCompletedCount += stageGoalQuestScriptIns.currentCompletedCount;
            break;
        }
      }
      if (0 < totalGoalQuestCompletedCountRequired && 0 >= totalForFailingGoalQuestCompletedCountRequired) {
        const slope = (self.stageInitialState.goal.passScore) / totalGoalQuestCompletedCountRequired;
        const floatingPointScore = slope * (totalGoalQuestCompletedCount);
        return parseInt(floatingPointScore);
      }
      if (0 >= totalGoalQuestCompletedCountRequired && 0 < totalForFailingGoalQuestCompletedCountRequired) {
        const slope = 3 * (self.stageInitialState.goal.passScore) / totalForFailingGoalQuestCompletedCountRequired;
        const residualCount = (totalForFailingGoalQuestCompletedCountRequired - totalForFailingGoalQuestCompletedCount);
        const floatingPointScore = slope * (residualCount);
        return parseInt(floatingPointScore);
      }
      if (0 < totalGoalQuestCompletedCountRequired && 0 < totalForFailingGoalQuestCompletedCountRequired) {
        // TBD. -- YFLu, 2019-10-09.
        return 0;
      }
      return 0;
    }
  },

  calculateStar(score) {
    const self = this;
    const passScore = self.stageInitialState.goal.passScore;
    if (score < passScore) {
      return 0;
    }
    if (score >= 1.5 * passScore) {
      return 3;
    }

    if (score >= 1.2 * passScore) {
      return 2;
    }
    return 1;
  },

  // WARNING: If score's calculation changed, eg. by server, update this. [begin]

  refreshScoreAndStar() {
    /*
    [WARNING]
    By refreshing stars, we don't need "true == allGoalQuestFulfilled()" to show any star.

    Therefore this is showing just the "extrapolated stars IF `true == allGoalQuestFulfilled()`". 

    -- YFLu, 2019-09-21
    */
    const self = this;
    const passScore = self.stageInitialState.goal.passScore;
    let currentScore = self.calculateScore();
    let starCount = self.calculateStar(currentScore);
    let stageScoreIns = self.widgetsAboveAllScriptIns.stageScore.getComponent('StageScore');
    stageScoreIns.init(self);
    stageScoreIns.setData(currentScore, starCount);
    stageScoreIns.refresh();
  }, 

  getProducibleIngredientList() {
    const self = this;
    let ingredientList = BuildableMap.prototype.getProducibleIngredientList.apply(self, arguments);
    return ingredientList.filter(function(ingredient) {
      const ingredientId = ingredient.id;
      return null != self.stageInitialState.playerRecipeList.find(function(playerRecipe) {
          return (playerRecipe.state == constants.RECIPE.STATE.UNLOCKED || playerRecipe.state == constants.RECIPE.STATE.LOCKED_INGREDIENT_KNOWN) &&
            null != playerRecipe.ingredientId &&
            0 != playerRecipe.ingredientId &&
            ingredientId == playerRecipe.ingredientId;
        });
    });
  },

  createBoundaryColliderForStatefulBuildableInstance(statefulBuildableInstance) {
    const self = this;
    let barrier = BuildableMap.prototype.createBoundaryColliderForStatefulBuildableInstance.apply(self, arguments);
    if (null != statefulBuildableInstance.boundAttackingNpcDict) {
      for (let k in statefulBuildableInstance.boundAttackingNpcDict) {
        const boundAttackingNpc = statefulBuildableInstance.boundAttackingNpcDict[k];
        boundAttackingNpc.refreshGrandSrcAndCurrentDestination();
        boundAttackingNpc.refreshContinuousStopsFromCurrentPositionToCurrentDestination();
        boundAttackingNpc.restartFollowing();
      }
    }
    if (barrier != null) {
      const barrierColliderIns = barrier.getComponent(cc.PolygonCollider);
      for (let i = 0; i < barrierColliderIns.points.length; i++) {
        barrierColliderIns.points[i] = barrierColliderIns.points[i].mul(0.5);
      }
    }
    return barrier;
  },

  renderCurrentTileMap(callback) {
    const self = this;
    if (null == self.currentStageId) {
      callback && callback(new Error("No self.currentStageId is provided to render."));
      return;

    }
    const tiledMapIns = self.node.getComponent(cc.TiledMap);
    const fullPathOfTmxFile = cc.js.formatStr("maps/stage%s/Map/map", self.currentStageId);

    cc.loader.loadRes(fullPathOfTmxFile, cc.TiledMapAsset, function(err, tmxAsset) {
      if (null != err) {
        console.error(err);
        return;
      }

      const fullPathOfBackgroundMapTmxFile = cc.js.formatStr("maps/stage%s/Background/map", self.currentStageId);
      cc.loader.loadRes(fullPathOfBackgroundMapTmxFile, cc.TiledMapAsset, (err, backgroundMapTmxAsset) => {
        if (null != err) {
          console.error(err);
          return;
        }

        const backgroundMapTiledMapIns = self.backgroundMap.getComponent(cc.TiledMap);
        backgroundMapTiledMapIns.tmxAsset = null;
        backgroundMapTiledMapIns.node.removeAllChildren();
        backgroundMapTiledMapIns.tmxAsset = backgroundMapTmxAsset;
        const newBackgroundMapSize = backgroundMapTiledMapIns.getMapSize();
        const newBackgroundMapTileSize = backgroundMapTiledMapIns.getTileSize();
        self.backgroundMap.node.setContentSize(newBackgroundMapSize.width * newBackgroundMapTileSize.width, newBackgroundMapSize.height * newBackgroundMapTileSize.height);
        self.backgroundMap.node.setPosition(cc.v2(0, 0));

        const backgroundMapBoundaryObjs = tileCollisionManager.extractBoundaryObjects(self.backgroundMap.node);
        tileCollisionManager.initMapNodeByTiledBoundaries(self.backgroundMap, self.backgroundMap.node, backgroundMapBoundaryObjs);
        callback && callback(null, tmxAsset, backgroundMapTmxAsset);
      });
    });
  },

  syncPlayerHoldingsAfterRewarded(onSuccessCbForUpsyncRequest, callbackAnyway) {
    const self = this;
    let selfPlayer = null; 
    try {
      const selfPlayerStr = cc.sys.localStorage.getItem("selfPlayer");
      selfPlayer = JSON.parse(selfPlayerStr);
    } catch (e) {
      if (window.handleNetworkDisconnected) {
        window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
      }
      return;
    }
    
    if (null == self.stageIndex || 0 == self.stageIndex) {
      return;
    }

    // 请求后端同步数据 [begins].
    const queryParam = {
      intAuthToken: selfPlayer.intAuthToken,
      syncData: window.pbEncodeData(window.syncDataStruct, {
        wallet: self.wallet,
      }), /* This "syncData" field will NOT be processed by the backend due to "0 != self.stageIndex", yet it's still necessary to be non-empty for the backend to allow saving of the "diamond" field! -- YFLu, 2019-12-05. */
      stage: self.stageIndex,
      interruptTutorialMask: null == self.interruptTutorialMask ? "" : window.pbEncodeData(window.interruptTutorialMaskStruct, self.interruptTutorialMask),
      diamond: null == self.wallet.diamond ? 0 : self.wallet.diamond,
    };
    self._sendPlayerSyncDataUpsync(queryParam, onSuccessCbForUpsyncRequest, callbackAnyway);
    // 请求后端同步数据 [ends].
  },

  shareCurrentStageMap(ttChannel) {
    const self = this;
    if (null != window.tt) {
      const mapNode = self.node;
      const canvasNode = mapNode.parent;
      const tempImgFilePath = canvas.toTempFilePathSync({
        x: 0,
        y: 0,
        width: canvasNode.width,
        height: canvasNode.height,
        destWidth: canvasNode.width,
        destHeight: canvasNode.height,
      });
      // Reference https://developer.toutiao.com/dev/cn/mini-game/develop/api/retweet/tt.shareappmessage.
      const ttToShareMessage = {
        /*
        Using the default channel shares a "card" on the player's ByteDance timeline, where the "card" is clickable to start playing the game.

        On the contrary, "channel == `video`" only shares a video on the timeline which doesn't direct the viewer to play the game. 

        -- YFLu, 2019-12-06.
        */
        imageUrl: tempImgFilePath,
        title: i18n.t("StageSelectionCell.DisplayName." + self.stageIndex),
        query: 'expectedStageId=' + self.stageIndex,
        extra: {
          videoPath: (null == self.ttRecorderStoppedResult ? null : self.ttRecorderStoppedResult.videoPath),
        },
        success() {
          console.log("分享视频成功");
          self.onRecordedVideoSharedSuccessfully(ttChannel);
        },
        fail(e) {
          console.log("分享视频失败", e);
        }
      };
      if (null != ttChannel) {
        Object.assign(ttToShareMessage, {
          channel: ttChannel,
        });
      }
      tt.shareAppMessage(ttToShareMessage);
    } else {
      if (cc.sys.platform == cc.sys.WECHAT_GAME) {
        const expectedStageId = self.stageIndex;
        const wxToShareMessage = {
          title: i18n.t("StageSelectionCell.DisplayName." + self.stageIndex),
          query: 'expectedStageId=' + self.stageIndex,
        };
        console.warn("The expectedStageId for sharing: ", self.stageIndex, " wxToShareMessage ", wxToShareMessage);
        wx.showShareMenu();
        wx.onShareAppMessage(() => {
          return wxToShareMessage;
        });
      }
    }
  },

  getConsumedIngredientCountInCache(knapsackItem) {
    const self = this;
    return self.knapsackConsumedCache.hasOwnProperty(knapsackItem.ingredient.id) ? self.knapsackConsumedCache[knapsackItem.ingredient.id] : 0;
  },

  consumeKnapsackInCache(knapsackItem, consumedCount = 1) {
    const self = this;
    self.knapsackConsumedCache[knapsackItem.ingredient.id] = self.getConsumedIngredientCountInCache(knapsackItem) + consumedCount;
    if (null != self.floatingKnapsackPanelIns) {
      self.floatingKnapsackPanelIns.refresh();
    }
  },

  sendReclaimQuery(statefulBuildableInstance, ingredient, successCb, failCb) {
    const self = this;
    let targetKnapsackItem = self.findKnapsackItemForIngredient(ingredient.id);
    if (0 < targetKnapsackItem.currentCount) {
      return BuildableMap.prototype.sendReclaimQuery.apply(self, arguments);
    } else {
      failCb && failCb(null, {
        ret: constants.RET_CODE.MYSQL_ERROR
      });
      return;
    }
  },

  sendSynthesizeQuery(statefulBuildableInstance, consumables, successCb, failCb) {
    const self = this;
    let allConsumablesEnough = true;
    for (let i = 0, len = consumables.length; i < len; i++) {
      let consumableItem = consumables[i];
      for (let knapsackItem of self.knapsackArray) {
        if (knapsackItem.id == consumableItem.knapsackId) {
          allConsumablesEnough = knapsackItem.currentCount >= consumableItem.count;
          break;
        }
      }
      if (!allConsumablesEnough) {
        break;
      }
    }
    if (!allConsumablesEnough) {
      failCb && failCb(null, {
        ret: constants.RET_CODE.MYSQL_ERROR
      });
      return;
    } else {
      return BuildableMap.prototype.sendSynthesizeQuery.apply(self, arguments);
    }
  },

  getRecipeById(recipeId) {
    const self = this;
    return self.recipeDict[recipeId];
  },

  refreshOrCreateShelterAndDefenderForStatefulBuildableInstance(statefulBuildableInstance) {
    BuildableMap.prototype.refreshOrCreateShelterAndDefenderForStatefulBuildableInstance.call(this, statefulBuildableInstance);
    const self = this;
    if (false == statefulBuildableInstance.isDefenderBuildable()) {
      return;
    }

    if (constants.WITHOUT_DEFENDING_COLLIDER_DEFENDER_TYPE_BUILDABLE_LIST.includes(statefulBuildableInstance.id)) {
      return;
    }

    const anchorTileContinuousPos = statefulBuildableInstance.fixedSpriteCentreContinuousPos.add(statefulBuildableInstance.estimatedSpriteCentreToAnchorTileCentreContinuousOffset);
    const boundingBoxCentrePos = anchorTileContinuousPos.sub(statefulBuildableInstance.topmostAnchorTileCentreWrtBoundingBoxCentre); 

    const defenderPosition = boundingBoxCentrePos;
    let defenderNode = null;
    if (!statefulBuildableInstance.node._polygonBoundaryDefenderCreated) {
      statefulBuildableInstance.node._polygonBoundaryDefenderCreated = true;
      defenderNode = cc.instantiate(self.polygonBoundaryDefenderPrefab);
      statefulBuildableInstance.node.defenderNode = defenderNode;
      const defenderScriptIns = defenderNode.getComponent("PolygonBoundaryDefender");
      defenderScriptIns.emitterStatefulBuildable = statefulBuildableInstance;
      statefulBuildableInstance.defenderScriptIns = defenderScriptIns;
      const circleColliderScriptIns = defenderNode.getComponent(cc.CircleCollider); 
      circleColliderScriptIns.radius = constants.STATEFUL_BUILDABLE_BASE_DEFENDER_RADIUS[statefulBuildableInstance.id];
    
      const indicatorUnifiedEdgeLength = 2*circleColliderScriptIns.radius; 
      defenderScriptIns.indicator.width = indicatorUnifiedEdgeLength;
      defenderScriptIns.indicator.height = indicatorUnifiedEdgeLength;
    } else {
      defenderNode = statefulBuildableInstance.node.defenderNode;
      defenderNode.removeFromParent();
    }

    defenderNode.setPosition(defenderPosition);
    safelyAddChild(self.node, defenderNode); // Therefore it can collider with the other colliders directly under the same node. 
  },

  onMovingBuildableInstance(touchPosWrtCameraCentreScaledToMapNode, immediateDiffVec, statefulBuildableInstanceAtTouchStart) {
    const self = this;
    if (null != statefulBuildableInstanceAtTouchStart && true == statefulBuildableInstanceAtTouchStart.isDefenderBuildable()) {
      if (window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_NEW != statefulBuildableInstanceAtTouchStart.state && window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_NEW != statefulBuildableInstanceAtTouchStart.state) {
        return;
      }
    }
    if (null != statefulBuildableInstanceAtTouchStart && true == self.isStageGoalToDestroyEnemy()) {
      return;
    }

    BuildableMap.prototype.onMovingBuildableInstance.call(this, touchPosWrtCameraCentreScaledToMapNode, immediateDiffVec, statefulBuildableInstanceAtTouchStart);
  },

  upgradeStatefulBuildableInstance(statefulBuildableInstance) {
    const self = this;
    BuildableMap.prototype.upgradeStatefulBuildableInstance.apply(self, arguments);
  },

  showCostDiamondsToBuyGoldPanel(gold, confirmCallBack) {
    const self = this;
    if (!self.iapEnabled) {
      const simplePressToGoDialogNode = cc.instantiate(self.simplePressToGoDialogPrefab);
      simplePressToGoDialogNode.setPosition(cc.v2(0, 0));
      const simplePressToGoDialogScriptIns = simplePressToGoDialogNode.getComponent("SimplePressToGoDialog");
      simplePressToGoDialogScriptIns.mapIns = self;
      simplePressToGoDialogScriptIns.onCloseDelegate = () => {
        self.exitPanelView(simplePressToGoDialogScriptIns);
      };
      simplePressToGoDialogScriptIns.setHintLabel(i18n.t("errorHint.lackOfGold"));
      simplePressToGoDialogScriptIns.setYesButtonLabel(i18n.t("bichoiceDialog.yes"));
      self.enterPanelView(simplePressToGoDialogScriptIns);
      return;
    }
    return BuildableMap.prototype.showCostDiamondsToBuyGoldPanel.apply(self, arguments);
  },

  spawnOrRefreshStatefulBuildableFollowingNpcs() {
    // Deliberately left blank. -- YFLu, 2019-10-07.
  },

  refreshStatelessBuildableInstanceCardListDisplay() {
    /*
    * HQ is not allowed to be built in stage based games.
    *
    * --YFLu, 2019-10-15.
    */
    const self = this;
    BuildableMap.prototype.refreshStatelessBuildableInstanceCardListDisplay.call(self, [constants.STATELESS_BUILDABLE_ID.HEADQUARTER]);   
  },

  onStartDraggingIngredient(ingredientCell, evt) {
    const self = this;
    BuildableMap.prototype.onStartDraggingIngredient.apply(self, arguments);
    
    if (null == self.draggingIngredientCell || null == self.followingIngredientNode) {
      console.warn('Please debug this, for why I can not find an draggingIngredientCell here.');
      return;
    }
    // Hardcoded data. [begin]
    const boomIngredientId = 22;
    // Hardcoded data. [begin]
    const ingredientId = self.draggingIngredientCell.ingredient.id;
    if (ingredientId == boomIngredientId && null == self.followingIngredientNode.aoeBulletNode) {
      const aoeBulletNode = cc.instantiate(self.aoeBulletPrefab);
      const aoeBulletIns = aoeBulletNode.getComponent('AoeBullet');
      aoeBulletIns.mapIns = self;
      aoeBulletIns.emitterIngredient = self.draggingIngredientCell.ingredient;
      aoeBulletNode.position = self.followingIngredientNode.position;
      self.followingIngredientNode.aoeBulletNode = aoeBulletNode;
      self.followingIngredientNode.aoeBulletIns = aoeBulletIns;
      safelyAddChild(self.node, aoeBulletNode);
    }
  },

  onDraggingIngredient() {
    const self = this;
    BuildableMap.prototype.onDraggingIngredient.apply(self, arguments);
    if (null != self.followingIngredientNode && null != self.followingIngredientNode.aoeBulletNode) {
      self.followingIngredientNode.aoeBulletNode.position = self.followingIngredientNode.position;
    }
  },

  onCancelDraggingIngredient() {
    const self = this;
    if (null != self.followingIngredientNode && null != self.followingIngredientNode.aoeBulletNode) {
      self.followingIngredientNode.aoeBulletNode.destroy();
    }
    BuildableMap.prototype.onCancelDraggingIngredient.apply(self, arguments);
  },
  
  onDropIngredient() {
    const self = this;
    if (self.isDraggingIngredientInsideCancelArea()) {
      return self.onCancelDraggingIngredient();
    }
    // Warning: should handle before BuildableMap.prototype.onDropIngredient.
    // handle drop ingredient to attack npc. [begin]
    if (null != self.followingIngredientNode && null != self.followingIngredientNode.aoeBulletNode) {
      const aoeBulletNode = self.followingIngredientNode.aoeBulletNode;
      const aoeBulletIns = self.followingIngredientNode.aoeBulletIns;
      aoeBulletIns.boom(function() {
        aoeBulletNode.destroy();
      });
      const targetKnapsackItem = self.findKnapsackItemForIngredient(aoeBulletIns.emitterIngredient.id);
      self.consumeKnapsackInCache(targetKnapsackItem);
    } 
    // handle drop ingredient to attack npc. [end]

    BuildableMap.prototype.onDropIngredient.apply(self, arguments);
    
  },

  onStatefulBuildableReceiveIngredient(ingredientCell, statefulBuildableInstance, targetAcceptor) {
    const self = this;
    // Hardcoded data. [begin]
    const boomIngredientId = 22;
    // Hardcoded data. [begin]
    if (ingredientCell.ingredient.id == boomIngredientId) {
      self.floatingKnapsackPanelIns.show();
      return;
    }
    BuildableMap.prototype.onStatefulBuildableReceiveIngredient.apply(self, arguments);
  },

  refreshKnapsackArray(knapsackArrayFromBackend) {
    const self = this;
    BuildableMap.prototype.refreshKnapsackArray.call(self, knapsackArrayFromBackend);
    // 更新StageGoalQuestList下的节点的显示
    const stageGoalQuestListScriptIns = self.stageGoalQuestListScriptIns;
    stageGoalQuestListScriptIns.onKnapsackChanged();
    self.refreshScoreAndStar();
  },

  onSingleFingerClick(evt, touchPosWrtCameraCentreScaledToMapNode) {
    const self = this,
      mapIns = this;
  
    /*
    * If a click manages to propagate to this method "onSingleFingerClick", then that "the click is not consumed by any EscapingAttackingNpc's cc.Button component" is implied.
    *
    * -- YFLu, 2019-11-21.
    */
    if (null != mapIns.inspectingAttackingNpc) {
      mapIns.onAttackingNpcClicked(null, null);
    }

    /*
    The effective click to drop a soldier takes lowest priority in "StageMap".

    -- YFLu, 2019-10-30.
    */
    const prevRet = BuildableMap.prototype.onSingleFingerClick.call(self, evt, touchPosWrtCameraCentreScaledToMapNode);
    if (true == self.isInScouting()) {
      return;
    }
    switch (prevRet) {
    case window.SINGLE_CLICK_RET_CODE.NOT_TOUCHED_SHOULD_PROPOGATE:
      if (!self.isPurelyVisual()) {
        return;
      }
      const mainCameraContinuousPos = mapIns.ctrl.mainCameraNode.position;
      const roughImmediateContinuousPosOfTouchOnMapNode = (mainCameraContinuousPos.add(cc.v2(touchPosWrtCameraCentreScaledToMapNode.x, touchPosWrtCameraCentreScaledToMapNode.y)));

      if (null == self.inBattleSoldierPanelScriptIns) {
        return;
      }
      const inBattleSoldierPageCellIns = self.inBattleSoldierPanelScriptIns.activeSoldierCell;
      if (null == inBattleSoldierPageCellIns || false == inBattleSoldierPageCellIns.isDropable) {
        return;
      }
      for (let k in self.soldierDroppables) {
        const droppablePolygon = self.soldierDroppables[k];  
        if (false == cc.Intersection.pointInPolygon(roughImmediateContinuousPosOfTouchOnMapNode, droppablePolygon)) {
          continue; 
        }
        self.stopHighlightSoldierDroppableArea();
        const activeSoldier = self.inBattleSoldierPanelScriptIns.activeSoldier;
        if (null == activeSoldier || 0 >= activeSoldier.currentCount) {
          console.warn("Encountered an invalid activeSoldier state here!");
          self.inBattleSoldierPanelScriptIns.searchForAndSwitchToPossibleActiveSoldier();
          return; 
        }
        const specifiedSpeciesName = constants.NPC_ANIM.NAME[activeSoldier.ingredient.name];
        self.playEffectCommonButtonClick();
        self.spawnEscapingAttackingNpc(roughImmediateContinuousPosOfTouchOnMapNode, self.allyEscapingTargetList[0], specifiedSpeciesName, activeSoldier);
        --activeSoldier.currentCount;
        self.inBattleSoldierPanelScriptIns.refresh();
        if (0 >= self.inBattleSoldierPanelScriptIns.activeSoldier.currentCount) {
          self.inBattleSoldierPanelScriptIns.searchForAndSwitchToPossibleActiveSoldier();
        } else {
          inBattleSoldierPageCellIns.startCoolDownDropping();
        }
        
        ++self.successfullyDroppedSoldierCount;
        const successfulSoldierDroppedIndicatorNode = cc.instantiate(self.successfulSoldierDroppedIndicatorPrefab);

        successfulSoldierDroppedIndicatorNode.setScale(0.1);
        let ccSeqActArray = [];
        ccSeqActArray.push(cc.scaleTo(0.8, 2.0));
        ccSeqActArray.push(cc.callFunc(() => {
          if (null != successfulSoldierDroppedIndicatorNode.parent) {
            successfulSoldierDroppedIndicatorNode.removeFromParent();
          }
        }, self));

        successfulSoldierDroppedIndicatorNode.setPosition(roughImmediateContinuousPosOfTouchOnMapNode);
        safelyAddChild(self.node, successfulSoldierDroppedIndicatorNode);
        successfulSoldierDroppedIndicatorNode.runAction(cc.sequence(ccSeqActArray));
        /*
        * By reaching here, a soldier is successfully dropped.
        */
        return;
      }
      self.startHighlightSoldierDroppableArea();
    break;
    default:
    break;
    }
  },

  renderPerStatefulBuildableInstanceNode(statefulBuildableInstance) {
    const self = this;
    BuildableMap.prototype.renderPerStatefulBuildableInstanceNode.call(this, statefulBuildableInstance);
    const MIN_HP_LIMIT_LENGTH = 100;
    const MAX_HP_LIMIT_LENGTH = 400;

    const REFERENCE_HP_LIMIT = 15000;
    const REFERENCE_LENGTH = MAX_HP_LIMIT_LENGTH;

    const hpBarNode = statefulBuildableInstance.hpBar.node; 
    let correspondingHpLimitLength = REFERENCE_LENGTH*(statefulBuildableInstance.baseHp/REFERENCE_HP_LIMIT); 
    if (correspondingHpLimitLength < MIN_HP_LIMIT_LENGTH) {
      correspondingHpLimitLength = MIN_HP_LIMIT_LENGTH;
    }
    hpBarNode.width = correspondingHpLimitLength; 
    statefulBuildableInstance.hpBar.totalLength = correspondingHpLimitLength; 
    statefulBuildableInstance.hpBar.barSprite.node.x = -0.5*(correspondingHpLimitLength);
  
    statefulBuildableInstance.transferHpGuiToMapNodeAndUpdatePosition();
  },

  findKnapsackItemForIngredient(ingredientId) {
    const self = this;
    const ingredient = self.getIngredientById(ingredientId);
    if (ingredient != null) {
      if (ingredient.category == constants.INGREDIENT.CATEGORY.SOLDIER) {
        return self.soldierArray.find(function(x) { return x.ingredient.id == ingredientId });
      } else {
        return self.knapsackArray.find(function(x) { return x.ingredient.id == ingredientId });
      }
    } else {
      return self.soldierArray.concat(self.knapsackArray).find(function(x) { return x.ingredient.id == ingredientId });
    }
  },

  onSingleStageGoalCompleted(quest, questList, stageGoalQuestScriptIns, stageGoalQuestListScriptIns) {
    const self = this;
    switch (quest.resourceType) {
      case constants.RESOURCE_TYPE.STATEFULBUILDABLE_DESTORYED:
        if (true == self.isStageGoalToDestroyEnemy()) {
          self.onStageCompleted();
        }
        break;
    }
  },

  isStageGoalToDestroyEnemy() {
    const self = this;
    const questList = self.stageGoal.questList;
    return questList.length == 1 && questList[0].resourceType == constants.RESOURCE_TYPE.STATEFULBUILDABLE_DESTORYED;
  },

  startPositioningExistingStatefulBuildableInstance(statefulBuildableInstance) {
    BuildableMap.prototype.startPositioningExistingStatefulBuildableInstance.call(this, statefulBuildableInstance);
    if (statefulBuildableInstance.isEditing() && null != statefulBuildableInstance.defenderScriptIns) {
      statefulBuildableInstance.defenderScriptIns.showIndicator(true);
    }
    this.editingStatefulBuildableInstance.hpBar.node.active = true;
    this.editingStatefulBuildableInstance.hpResidualLabel.node.active = true;
  },

  endPositioningStatefulBuildableInstance(successfullyPlacedOrNot) {
    if (successfullyPlacedOrNot && null != this.editingStatefulBuildableInstance.defenderScriptIns) {
      this.editingStatefulBuildableInstance.defenderScriptIns.showIndicator(false);
    }
    this.editingStatefulBuildableInstance.hpBar.node.active = false;
    this.editingStatefulBuildableInstance.hpResidualLabel.node.active = false;
    BuildableMap.prototype.endPositioningStatefulBuildableInstance.call(this, successfullyPlacedOrNot);
  },

  // highlighterLayer related. [begin] {

  refreshHighlightedTileGridForEditingStatefulBuildableInstance() {
    this.stopHighlightSoldierDroppableArea();
    return BuildableMap.prototype.refreshHighlightedTileGridForEditingStatefulBuildableInstance.apply(this, arguments);
  },


  cancelHighlightingStatefulBuildableInstance() {
    this.stopHighlightSoldierDroppableArea();
    if (null != this.editingStatefulBuildableInstance.defenderScriptIns) {
      this.editingStatefulBuildableInstance.defenderScriptIns.showIndicator(false);
    }
    this.editingStatefulBuildableInstance.hpBar.node.active = false;
    this.editingStatefulBuildableInstance.hpResidualLabel.node.active = false;
    BuildableMap.prototype.cancelHighlightingStatefulBuildableInstance.call(this); 
  },

  startHighlightSoldierDroppableArea() {
    const self = this;
    self.stopHighlightSoldierDroppableArea();
    let action = cc.sequence(
      cc.callFunc(function() {
        let currentLayerSize = self.highlighterLayer.getLayerSize();
        for (let k in self.soldierDroppables) {
          const droppablePolygon = self.soldierDroppables[k];
          // highligh droppable area. [begin]
          for (let discreteXInLayer = 0; discreteXInLayer < currentLayerSize.width; ++discreteXInLayer) {
            for (let discreteYInLayer = 0; discreteYInLayer < currentLayerSize.height; ++discreteYInLayer) {
              let continuousPosWrtMapNode = tileCollisionManager._continuousFromCentreOfDiscreteTile(self.node, self.tiledMapIns, null, discreteXInLayer, discreteYInLayer);
              if (false == cc.Intersection.pointInPolygon(continuousPosWrtMapNode, droppablePolygon)) {
                continue; 
              }
              const highlighterNode = cc.instantiate(self.tileHighlighterPrefab);
              highlighterNode.setPosition(continuousPosWrtMapNode);
              safelyAddChild(self.highlighterLayer.node, highlighterNode);
              highlighterNode.getComponent("TileHighlighter").green.node.active = true;
            }
          }
          // highligh droppable area. [end]
        }
      }),
      cc.repeat(
        cc.sequence(
          cc.fadeTo(0.2, 0),
          cc.fadeTo(0.2, 125)
        ), 1
      ),
      cc.callFunc(function() {
        self.stopHighlightSoldierDroppableArea();
      })
    )
    action.setTag(1);
    self.highlighterLayer.node.runAction(action);
  },

  stopHighlightSoldierDroppableArea() {
    const self = this;
    self.highlighterLayer.node.stopActionByTag(1); // Hardcoded temporarily. -- YFLu, 2019-12-01.
    self.highlighterLayer.node.opacity = 255;
    self.highlighterLayer.node.removeAllChildren();
  },

  // highlighterLayer related. [end] }

  onGameSettingsTriggerClicked(evt) {
    const self = this;
    self.playEffectCommonButtonClick();
    self.gameSettingsPanelScriptIns.onCloseDelegate = () => {
      self.exitPanelView(self.gameSettingsPanelScriptIns);
      self.resume();
    };
    self.enterPanelView(self.gameSettingsPanelScriptIns);
    self.pause();
  },

  exitPanelView(targetPanel) {
    const self = this;
    const nonePanelViewiing = BuildableMap.prototype.exitPanelView.apply(self, arguments);
    if (nonePanelViewiing && self.isInScouting()) {
      self.setSideButtonGroupActive(true);
    }
  },

  refreshAttackingNpcsAfterAnythingRemoved(removedAttackingNpcScriptIns, removedStatefulBuildableCompIns) {
    const self = this;
    for (let k in self.statefulBuildableAttackingNpcScriptInsDict) {
      const attackingNpc = self.statefulBuildableAttackingNpcScriptInsDict[k];
      const visionScriptIns = attackingNpc.visionScriptIns;
      if (null != visionScriptIns && null != visionScriptIns.inRangeToAttackTargets) {
        if (null != removedAttackingNpcScriptIns && visionScriptIns.inRangeToAttackTargets.hasOwnProperty(removedAttackingNpcScriptIns.node.uuid)) {
          delete visionScriptIns.inRangeToAttackTargets[removedAttackingNpcScriptIns.node.uuid];
        }
        if (null != removedStatefulBuildableCompIns && visionScriptIns.inRangeToAttackTargets.hasOwnProperty(removedStatefulBuildableCompIns.node.uuid)) {
          delete visionScriptIns.inRangeToAttackTargets[removedStatefulBuildableCompIns.node.uuid];
        }
      }
      const defenderScriptIns = attackingNpc.defenderScriptIns;
      if (null != defenderScriptIns && null != defenderScriptIns.inRangeToAttackTargets) {
        if (null != removedAttackingNpcScriptIns && defenderScriptIns.inRangeToAttackTargets.hasOwnProperty(removedAttackingNpcScriptIns.node.uuid)) {
          delete defenderScriptIns.inRangeToAttackTargets[removedAttackingNpcScriptIns.node.uuid];  
        }
        if (null != removedStatefulBuildableCompIns && defenderScriptIns.inRangeToAttackTargets.hasOwnProperty(removedStatefulBuildableCompIns.node.uuid)) {
          delete defenderScriptIns.inRangeToAttackTargets[removedStatefulBuildableCompIns.node.uuid];  
        }
      }
    }
  },

  onAttackingNpcClicked(evt, customEventData) {
    if (null != evt) {
      evt.stopPropagation();
    }
    if (null != this.inspectingAttackingNpc) {
      this.inspectingAttackingNpc.isBeingInspected = false;
      if (null != this.inspectingAttackingNpc.hpBar) {
        this.inspectingAttackingNpc.hpBar.node.active = false;
      }
      if (null != this.inspectingAttackingNpc.hpResidualLabel) {
        this.inspectingAttackingNpc.hpResidualLabel.node.active = false;
      }
      this.inspectingAttackingNpc = null;
    }

    if (null != this.stageStartTime) {
      /*
      * Temporarily not allowing to inspect soldier of any team during an ongoing battle. 
      *
      * -- YFLu, 2019-11-21.
      */
      return;
    }
    if (null != customEventData) {
      this.inspectingAttackingNpc = customEventData;
      if (null != this.inspectingAttackingNpc.hpBar) {
        this.inspectingAttackingNpc.hpBar.node.active = true;
      }
      if (null != this.inspectingAttackingNpc.hpResidualLabel) {
        this.inspectingAttackingNpc.hpResidualLabel.node.active = true;
      }
      this.inspectingAttackingNpc.isBeingInspected = true;
    }
  },


  initVolatileKnapsackDict(knapsackArrayFromBackend) {
    /*
    * There's no "volatile ingredient.category == TECH".
    * The "volatileKnapsackDict" includes "ingredient.category == SOLDIER". 
    * 
    * -- YFLu, 2019-11-25.
    */
    const self = this;
    self.volatileKnapsackDict = {};

    knapsackArrayFromBackend = knapsackArrayFromBackend || [];
    for (let k in knapsackArrayFromBackend) {
      const knapsackItem = knapsackArrayFromBackend[k]; 
      const ingredientId = knapsackItem.ingredientId; 
      self.volatileKnapsackDict[ingredientId] = knapsackItem;
    }
  },

  costDiamondsToDo(requiredDiamonds, callback, callbackOnDiamondNotEnough) {
    const self = this;
    let currentDiamondInWallet = self.wallet.diamond;
    if (currentDiamondInWallet < requiredDiamonds) {
      callbackOnDiamondNotEnough && callbackOnDiamondNotEnough(currentDiamondInWallet, requiredDiamonds);
      return false;
    } else {
      self.widgetsAboveAllScriptIns.walletInfo.setData({
        diamond: self.wallet.diamond - requiredDiamonds,
      });
      callback && callback(currentDiamondInWallet, self.wallet.diamond);
      return true;
    }
  },

  resume() {
    cc.audioEngine.resumeMusic();
    if (null != window.ttRecorder && null != this.stageStartTime) {
      window.ttRecorder.resume();
    }
    BuildableMap.prototype.resume.call(this);
  },

  pause() {
    cc.audioEngine.pauseMusic();
    if (null != window.ttRecorder && null != this.stageStartTime) {
      window.ttRecorder.pause();
    }
    BuildableMap.prototype.pause.call(this);
  },

  refreshAnnouncementButton() {
    // Deliberately overriding this method to empty.
  },

});
