const BuildableMap = require('./BuildableMap');
const i18n = require('LanguageData');
const ProgressNum = require('./ProgressNum');
cc.Class({
  extends: BuildableMap,
  properties: {
    housekeeperEnabled: true,
    comboBgmAudioClip: {
      type: cc.AudioClip,
      default: null,
    },  
  },

  ctor() {
    this.comboIndicatorNode = null;
    this.comboIndicatorScriptIns = null;
    // Data scope for playerIngredientForIdleGame. [begin] {
    this.toClaimPurchaseIngredientList = [];
    this.playerIngredientForIdleGameList = [];
    this.playerIngredientForIdleGameDict = {};
    // Data scope for playerIngredientForIdleGame. [end] }
    this.cachedGoldNodeList = [];
    this.toIgnoreBuildableIds = [
      // constants.STATELESS_BUILDABLE_ID.FIRE_TOWER,
      // constants.STATELESS_BUILDABLE_ID.STONE_TOWER,
      // constants.STATELESS_BUILDABLE_ID.THUNDER_TOWER,
      // constants.STATELESS_BUILDABLE_ID.CANNON_TOWER,   
      // constants.STATELESS_BUILDABLE_ID.LABORATORY,   
    ];
    this.comboCulmulatedCount = 0;

    this.cachedPlayerBuildableQueryRespToHandle = null;

    this.housekeeperOfflineIncome = 0;
    this.housekeeperNpc = null;

    this.housekeeperBindingList = [];
    this.housekeeperNpcDict = {
      // buildableId -> housekeeperNpc
    };
    this._inited = false;
  },

  onLoad() {
    const self = this;
    BuildableMap.prototype.onLoad.call(self);
    console.log("IdleGameMap.onLoad");

    self.widgetsAboveAllScriptIns.walletInfo.node.active = true;

    if (null != self.loadingTip) {
      self.loadingTip.active = true;
      setLocalZOrder(self.loadingTip, CORE_LAYER_Z_INDEX.INFINITY);
    }

    self.statefulBuildableOrderingNpcScriptInsDict = {};

    // Initialization of freeAutoOrder. [begin] {
    self.freeAutoOrderDict = {};
    self.lastOrderingNpcSpawnTimeMillis = null;
    self.freeAutoOrderIncreasedId = 0;
    // Initialization of freeAutoOrder. [end] }
    if (cc.sys.platform == cc.sys.WECHAT_GAME && typeof wx != 'undefined') {
      self._onWxHide = function() {
        self.closeBottomBannerAd();
      }
      wx.onHide(self._onWxHide);
    }

    try {
      const selfPlayerStr = cc.sys.localStorage.getItem("selfPlayer");
      const selfPlayer = JSON.parse(selfPlayerStr);
      const intAuthToken = selfPlayer.intAuthToken;
      self.sendGlobalBuildableLevelConfQuery({
        intAuthToken: intAuthToken
      });
    } catch (e) {
      if (null != window.handleNetworkDisconnected) {
        window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
      }
      return; 
    }
  },

  onDestroy() {
    const self = this;
    cc.audioEngine.stopAll();
    window.reverseStatefulBuildableAttackingNpcDestinationDict = {};
    window.reverseStatefulBuildableOrderingNpcDestinationDict = {};
    BuildableMap.prototype.onDestroy.apply(this, arguments);
    
    if (null != self.saveAllPlayerSyncDataInterval) {
      clearInterval(self.saveAllPlayerSyncDataInterval);
      self.saveAllPlayerSyncDataInterval = null;
    }
    if (cc.sys.platform == cc.sys.WECHAT_GAME && typeof wx != 'undefined') {
      self.closeBottomBannerAd();
      if (null != self._onWxHide) {
        wx.offHide(self._onWxHide);
      }
    }
    if (null != self.statefulBuildableInstanceCompList) {
      for (let statefulBuildableInstance of self.statefulBuildableInstanceCompList) {
        if (null != statefulBuildableInstance.node
          && null != statefulBuildableInstance.node.cookingAnimationNode
          && null != statefulBuildableInstance.node.cookingAnimationNode.delayDisappearTimmer) {
          clearTimeout(statefulBuildableInstance.node.cookingAnimationNode.delayDisappearTimmer);
        }
      }
    }
  },

  // hide relatedButton for crafting. [begin] {
  refreshStatefulBuildableController() {
    const self = this;
    BuildableMap.prototype.refreshStatefulBuildableController.apply(self, arguments);
    self.hqProductionButton.node.active = false;
    self.bakeryProductionButton.node.active = false;
    if (!self.statefulBuildableController.active) {
      return;
    }
    if (
         constants.STATELESS_BUILDABLE_ID.HEADQUARTER == self.editingStatefulBuildableInstance.id
      && !self.editingStatefulBuildableInstance.isNewing()
      && !self.editingStatefulBuildableInstance.isBuilding()
      && !self.editingStatefulBuildableInstance.isUpgrading()
    ) {
      // WARNING: 兵营启动前暂不显示。
      self.widgetsAboveAllScriptIns.labResearchButton.node.active = false;
    } else {
      self.widgetsAboveAllScriptIns.labResearchButton.node.active = false;
    }
  },

  refreshLockedButtonByBuildable() {
    const self = this;
    BuildableMap.prototype.refreshLockedButtonByBuildable.apply(self, arguments);
    self.knapsackButton.node.active = false;
    self.recipeButton.node.active = false;
  },
  // hide relatedButton for crafting. [end] }

  spawnOrderingNpc(boundStatefulBuildableComp, homePosInMapNode, targetChair) {
    const self = this;
    if (null == boundStatefulBuildableComp || null == homePosInMapNode) {
      return;
    }
    const tiledMapIns = self.node.getComponent(cc.TiledMap);
    let npcs = [
      constants.NPC_ANIM.NAME.HAT_GIRL,
      constants.NPC_ANIM.NAME.GREEN_HAIR_BOY,
      constants.NPC_ANIM.NAME.ORANGE_HAT_GIRL,
      constants.NPC_ANIM.NAME.BLACK_HAIR_GIRL,
      // constants.NPC_ANIM.NAME.GIRL,
    ];
    const npcNode = cc.instantiate(self.statefulBuildableOrderingNpcPrefab);

    const npcScriptIns = npcNode.getComponent("StatefulBuildableOrderingNpc");
    npcScriptIns.speciesName = window.randomProperty(npcs);

    npcScriptIns.mapNode = self.node;
    npcScriptIns.mapIns = self;
    npcScriptIns.boundStatefulBuildable = boundStatefulBuildableComp;
    npcScriptIns.homePosInMapNode = homePosInMapNode;
    npcScriptIns.targetChair = targetChair;

    npcScriptIns.speed = self.isInCombo() ? constants.SPEED.ORDERING_NPC_IN_COMBO : constants.SPEED.ORDERING_NPC;

    npcNode.setPosition(homePosInMapNode);
    safelyAddChild(self.node, npcNode);
    setLocalZOrder(npcNode, window.CORE_LAYER_Z_INDEX.PLAYER);
    const minSpawnXMagnitude = -100, minSpawnYMagnitude = -100,
          maxSpawnXMagnitude = 100, maxSpawnYMagnitude = 100;
    npcScriptIns.setChairDirection(window.randomProperty(["TopLeft", "TopRight"]));
    npcScriptIns.specifiedOffsetFromSpriteCentre = cc.v2(targetChair.offsetX, targetChair.offsetY);
    npcScriptIns.refreshGrandSrcAndCurrentDestination();
    npcScriptIns.refreshContinuousStopsFromCurrentPositionToCurrentDestination();
    npcScriptIns.restartFollowing();
    npcScriptIns.npcId = npcNode.uuid;
    self.statefulBuildableOrderingNpcScriptInsDict[npcNode.uuid] = npcScriptIns;
    if (null == boundStatefulBuildableComp.boundOrderingNpcDict) {
      boundStatefulBuildableComp.boundOrderingNpcDict = {};
    }

    boundStatefulBuildableComp.boundOrderingNpcDict[npcNode.uuid] = npcScriptIns;

    // Initialization of some keyAction. [begin]
    npcScriptIns.onStayingAtTargetDestination = function() {
      npcScriptIns.transitToOrderingAtDestinationAfterMovingIn(function() {
        // 从globalShelterChainVerticeMap中移除，防止npc挡住椅子. [begin]
        let targetChairNode = npcScriptIns.boundStatefulBuildable.chairNodeDict[npcScriptIns.targetChair.chairId];
        npcScriptIns.shelterChinColliderNode.active = false;
        window.removeFromGlobalShelterChainVerticeMap(npcScriptIns.node);
        setLocalZOrder(npcScriptIns.node, getLocalZOrder(targetChairNode) - 1);
        // 从globalShelterChainVerticeMap中移除，防止npc挡住椅子. [end]
        let autoOrder = self.tryToGenerateFreeAutoOrderForNpc(npcScriptIns);
        npcScriptIns.boundAutoOrder = autoOrder;
        npcScriptIns.moodAnimationEnabled = !self.isInCombo();
      });
      npcScriptIns.setMoodStateAndPlayAnimation(window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.PATIENT);
    };
    
    npcScriptIns.onStayingAtHomeDestination = function() {
      self.removeOrderingNpc(npcScriptIns);
    };

    npcScriptIns.onOrderAbort = function() {
      const autoOrder = npcScriptIns.boundAutoOrder;
      if (null != autoOrder && (
          null == autoOrder.deletedAt ||
          (null != autoOrder.targetAutoOrderPopup)
        )
      ) {
        npcScriptIns.targetChair = null;
        autoOrder.state = constants.FREE_AUTO_ORDER_STATE.ABORTED;
        self.removeFreeAutoOrder(autoOrder);
        self.removeFreeAutoOrderPopup(autoOrder);

        npcScriptIns.state = window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.MOVING_OUT;
        if (
          autoOrder.state == constants.FREE_AUTO_ORDER_STATE.NOT_TAKEN &&
          Date.now() - freeAutoOrder.createdAt >= freeAutoOrder.timeoutMillisBeforeTaken
        ) {
          switch (npcScriptIns.moodState) {
          case window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.NONE:
          case window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.PATIENT:
          case window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.IMPATIENT:
          case window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.ORDERING_SERVED:
          case window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.ORDERING_NOT_SERVERD:
            npcScriptIns.refreshCurrentDestination();
            npcScriptIns.refreshContinuousStopsFromCurrentPositionToCurrentDestination();
            npcScriptIns.restartFollowing();
            break;
          }
        } else {
          npcScriptIns.setMoodStateAndPlayAnimation(window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.ORDERING_ABORTED);
        }
      }

      switch (npcScriptIns.moodState) {
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.ORDERING_NOT_TAKEN_TIMED_OUT:
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.ORDERING_ABORTED:
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.ORDERING_TAKEN_NOT_MET:
        break;
      default:
        // 添加进globalShelterChainVerticeMap中移除，防止npc挡住建筑. [begin]
        window.addToGlobalShelterChainVerticeMap(npcScriptIns.node);
        npcScriptIns.shelterChinColliderNode.active = true;
        // 从globalShelterChainVerticeMap中移除，防止npc挡住建筑. [end]
        break;
      }
    };

    npcScriptIns.onMoodDisplyCompleted = function() {
      const autoOrder = npcScriptIns.boundAutoOrder;
      switch (npcScriptIns.moodState) {
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.ORDERING_NOT_TAKEN_TIMED_OUT:
        npcScriptIns.setMoodStateAndPlayAnimation(window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.ORDERING_NOT_SERVERD);
        break;
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.ORDERING_ABORTED:
        npcScriptIns.setMoodStateAndPlayAnimation(window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.ORDERING_NOT_SERVERD);
        self.createCachedGoldForAutoOrder(autoOrder, npcScriptIns.node.position);
        break;
      case window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.ORDERING_TAKEN_NOT_MET:
        npcScriptIns.popupNode.active = true;
        npcScriptIns.popupLabel.string = cc.js.formatStr(
          i18n.t("StatefulBuildableOrderingNpc.complainWords." + window.getRandomInt(1, 8)),
          i18n.t("Ingredient.DisplayName." + autoOrder.targetIngredient.name)
        );
        break;
      }
      // 添加进globalShelterChainVerticeMap中移除，防止npc挡住建筑. [begin]
      window.addToGlobalShelterChainVerticeMap(npcScriptIns.node);
      npcScriptIns.shelterChinColliderNode.active = true;
      // 从globalShelterChainVerticeMap中移除，防止npc挡住建筑. [end]
      npcScriptIns.refreshCurrentDestination();
      npcScriptIns.refreshContinuousStopsFromCurrentPositionToCurrentDestination();
      npcScriptIns.restartFollowing();
    };

    npcScriptIns.onPopupNodeClicked = function(evt) {
      if (!self.isPurelyVisual()) {
        return;
      }
      if (null != evt) {
        self.playEffectCommonButtonClick();
      }
      const autoOrder = npcScriptIns.boundAutoOrder;
      const targetIngredient = autoOrder.targetIngredient;
      self.showIngredientCellInfoPanel({
        ingredient: targetIngredient,
      });
    }
    // Initialization of some keyAction. [begin]

  },
  
  removeOrderingNpc(npcScriptIns) {
    const self = this;
    if (null == npcScriptIns || null == npcScriptIns.node || null == npcScriptIns.node.uuid) return;
    delete self.statefulBuildableOrderingNpcScriptInsDict[npcScriptIns.node.uuid];
    if (npcScriptIns.node.parent) {
      npcScriptIns.node.parent.removeChild(npcScriptIns.node);
    }
    if (null != npcScriptIns.boundStatefulBuildable && null != npcScriptIns.boundStatefulBuildable.boundOrderingNpcDict) {
      delete npcScriptIns.boundStatefulBuildable.boundOrderingNpcDict[npcScriptIns.node.uuid];
    }
    npcScriptIns.boundAutoOrder = null;
    npcScriptIns.onStayingAtTargetDestination = null;
    npcScriptIns.onStayingAtHomeDestination = null;
    npcScriptIns.onOrderAbort = null;
    npcScriptIns.freeAutoOrder
    npcScriptIns.destroy();
  },

  // Temporarily say AUTO_ORDER_WITH_NO_CONSUMPTION as freeAutoOrder
  tryToGenerateFreeAutoOrderForNpc(targetStatefulBuildableOrderingNpc) {
    const self = this;
    if (null == self.freeAutoOrderDict) {
      return null;
    }
    if (null != self.freeAutoOrderDict[targetStatefulBuildableOrderingNpc.npcId]) {
      return self.freeAutoOrderDict[targetStatefulBuildableOrderingNpc.npcId];
    }
    // Generation an auto-order. [begin]
    const boundStatefulBuildable = targetStatefulBuildableOrderingNpc.boundStatefulBuildable;
    const npcId = targetStatefulBuildableOrderingNpc.npcId;
    boundStatefulBuildable.node.freeAutoOrderCounter++;
    // Randomly pick an ingredientId. [begin]
    let targetIngredientId = null, targetIngredientList = null, targetIngredient = null;
    if (boundStatefulBuildable.node.freeAutoOrderCounter % constants.TRIGGER_INGREDIENT_LEARNING_COUNT == 0 && false == self.isInCombo() && false == self.isInNarrativeScene()) {
      // console.warn("tryToGenerateFreeAutoOrderForNpc assigning to `targetIngredientList`#1 ", targetStatefulBuildableOrderingNpc);
      targetIngredientList = self.getIngredientListForFreeAutoOrder(boundStatefulBuildable, constants.PLAYER_INGREDIENT_FOR_IDLEGAME.STATE.LOCKED_INGREDIENT_PURCHASABLE_TO_UNLOCK);
      if (0 >= targetIngredientList.length) {
        // console.warn("tryToGenerateFreeAutoOrderForNpc assigning to `targetIngredientList`#2 ", targetStatefulBuildableOrderingNpc);
        targetIngredientList = self.getIngredientListForFreeAutoOrder(boundStatefulBuildable, constants.PLAYER_INGREDIENT_FOR_IDLEGAME.STATE.UNLOCKED);
      }
    } else {
      // console.warn("tryToGenerateFreeAutoOrderForNpc assigning to `targetIngredientList`#3 ", targetStatefulBuildableOrderingNpc);
      targetIngredientList = self.getIngredientListForFreeAutoOrder(boundStatefulBuildable, constants.PLAYER_INGREDIENT_FOR_IDLEGAME.STATE.UNLOCKED);
    }
    
    if (0 >= targetIngredientList.length) {
      // console.warn("tryToGenerateFreeAutoOrderForNpc met `0 >= targetIngredientList` for ", targetStatefulBuildableOrderingNpc);
      return null;
    }

    targetIngredient = targetIngredientList[getRandomInt(0, targetIngredientList.length)];
    targetIngredientId = targetIngredient.id;
    // Randomly pick an ingredientId. [end]
    const autoOrder = {
      localId: ++self.freeAutoOrderIncreasedId,
      npcId: npcId,
      createdAt: Date.now(),
      deletedAt: null,
      startedAt: null,
      durationMillis: targetIngredient.baseReclaimDurationMillis, 
      timeoutMillisBeforeTaken: self.isInCombo() ? constants.DURATION_MILLIS.AUTO_ORDER_ALIVE_IN_COMBO : constants.DURATION_MILLIS.AUTO_ORDER_ALIVE,
      targetStatefulBuildableId: boundStatefulBuildable.playerBuildableBinding.id,
      targetIngredient: targetIngredient,
      targetIngredientId: targetIngredientId,
      state: constants.FREE_AUTO_ORDER_STATE.NOT_TAKEN,
      targetStatefulBuildableOrderingNpc: targetStatefulBuildableOrderingNpc,
      targetAutoOrderPopup: null,
      incomeRatio: 1,
    };

    self.freeAutoOrderDict[npcId] = autoOrder;
    self.createFreeAutoOrderPopup(autoOrder);
    // assert(null != autoOrder.targetAutoOrderPopup);
    autoOrder.targetAutoOrderPopup.show();
    self.refreshPopupEntry();
    return autoOrder;
    // Generation an auto-order. [end]
  },

  removeFreeAutoOrder(freeAutoOrder, finishEatingCb) {
    const self = this;
    if (null == freeAutoOrder || null != freeAutoOrder.deletedAt) {
      return;
    }
    freeAutoOrder.deletedAt = Date.now();
    delete self.freeAutoOrderDict[freeAutoOrder.npcId];
    // Before freeAutoOrderPopup remove. [begin]
    const freeAutoOrderPopupIns = freeAutoOrder.targetAutoOrderPopup;
    const targetStatefulBuildableOrderingNpc = freeAutoOrder.targetStatefulBuildableOrderingNpc;
    if (freeAutoOrder.state == constants.FREE_AUTO_ORDER_STATE.DELIVERED) {
      // Play flying animation. [begin]
      const statefulBuildableInstance = freeAutoOrder.targetStatefulBuildableOrderingNpc.boundStatefulBuildable;
      const fromPosition = (null == statefulBuildableInstance.node.cookingAnimationNode) ? statefulBuildableInstance.node.position.add(
        cc.v2(
          statefulBuildableInstance.calculateOffsetXToBuildableCenter(),
          statefulBuildableInstance.calculateOffsetYToBuildableCenterTop()
        )
      ).sub(freeAutoOrderPopupIns.node.position) : statefulBuildableInstance.node.cookingAnimationNode.position.sub(freeAutoOrderPopupIns.node.position);
      const toPosition = targetStatefulBuildableOrderingNpc.specifiedOffsetFromSpriteCentre.
      add(
        targetStatefulBuildableOrderingNpc.boundStatefulBuildable.node.position
      ).
      add(
        constants.CHAIR_CENTER_OFFSET_TO_SPRITE_CENTER[targetStatefulBuildableOrderingNpc.chairSpeciesName]
      ).
      sub(
        freeAutoOrderPopupIns.node.position
      );
      freeAutoOrderPopupIns.playIngredientFlyingAnimation(fromPosition, toPosition, 1000, function() {
        if (self.isInCombo()) {
          self.removeFreeAutoOrderPopup(freeAutoOrder);
          finishEatingCb && finishEatingCb();
        } else {
          freeAutoOrderPopupIns.playEatingAnimation(2000, function() {
            self.removeFreeAutoOrderPopup(freeAutoOrder);
            finishEatingCb && finishEatingCb();
          });
        }
      });
      // Play flying animation. [end]
    } else if (null != freeAutoOrder.targetAutoOrderPopup) {
      self.removeFreeAutoOrderPopup(freeAutoOrder);
    }
    // Before freeAutoOrderPopup remove. [end]
    for (let buildableId in self.housekeeperNpcDict) {
      let housekeeperNpc = self.housekeeperNpcDict[buildableId];
      if (
        housekeeperNpc.targetStatefulBuildableOrderingNpc == freeAutoOrder.targetStatefulBuildableOrderingNpc
      ) {
        housekeeperNpc.targetStatefulBuildableOrderingNpc = null;
        housekeeperNpc.transitToStaying();
      }
    }
    freeAutoOrder.targetStatefulBuildableOrderingNpc = null;
  },

  completeFreeAutoOrder(freeAutoOrder) {
    const self = this;
    if (null == freeAutoOrder || null != freeAutoOrder.deletedAt) {
      return;
    }
    self.increaseAllPlayerQuestBindingCompletedCountByResource(constants.QUEST_RESOURCE_TYPE.SERVED_CUSTOMER);
    self.increaseAllPlayerQuestBindingCompletedCountByResource(constants.QUEST_RESOURCE_TYPE.DISH_SOLD);
    self.increaseAllPlayerQuestBindingCompletedCountByResource(constants.QUEST_RESOURCE_TYPE.INGREDIENT_PRODUCED, freeAutoOrder.targetIngredientId);
    const targetStatefulBuildableOrderingNpc = freeAutoOrder.targetStatefulBuildableOrderingNpc;
    targetStatefulBuildableOrderingNpc.transitToOrderDeliveredAtDestinationAfterMoveIn(function() {
      freeAutoOrder.state = constants.FREE_AUTO_ORDER_STATE.DELIVERED;
      freeAutoOrder.targetAutoOrderPopup.refresh();
      self.removeFreeAutoOrder(freeAutoOrder, function() {
        // 添加进globalShelterChainVerticeMap中移除，防止npc挡住建筑. [begin]
        window.addToGlobalShelterChainVerticeMap(targetStatefulBuildableOrderingNpc.node);
        targetStatefulBuildableOrderingNpc.shelterChinColliderNode.active = true;
        // 从globalShelterChainVerticeMap中移除，防止npc挡住建筑. [begin]
        targetStatefulBuildableOrderingNpc.setMoodStateAndPlayAnimation(window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.ORDERING_SERVED);
        targetStatefulBuildableOrderingNpc.refreshCurrentDestination();
        targetStatefulBuildableOrderingNpc.refreshContinuousStopsFromCurrentPositionToCurrentDestination();
        targetStatefulBuildableOrderingNpc.restartFollowing();
        targetStatefulBuildableOrderingNpc.targetChair = null;
        self.createCachedGoldForAutoOrder(freeAutoOrder, targetStatefulBuildableOrderingNpc.node.position);
      });
    });
  },

  onFreeAutoOrderTimeout(freeAutoOrder) {
    const self = this;
    if (null == freeAutoOrder || null != freeAutoOrder.deletedAt) {
      return;
    }
    freeAutoOrder.targetStatefulBuildableOrderingNpc.setMoodStateAndPlayAnimation(window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.ORDERING_NOT_TAKEN_TIMED_OUT);
    freeAutoOrder.targetStatefulBuildableOrderingNpc.onOrderAbort && freeAutoOrder.targetStatefulBuildableOrderingNpc.onOrderAbort();
  },

  createFreeAutoOrderPopup(autoOrder) {
    const self = this;
    if (autoOrder.targetAutoOrderPopup != null) {
      return;
    }
    const targetStatefulBuildableOrderingNpc = autoOrder.targetStatefulBuildableOrderingNpc;
    const targetStatefulBuildable = targetStatefulBuildableOrderingNpc.boundStatefulBuildable;
    let autoOrderPopupNode = cc.instantiate(self.freeAutoOrderPopupPrefab);
    let autoOrderPopupIns = autoOrderPopupNode.getComponent('FreeAutoOrderPopup');
    autoOrderPopupIns.init(self);
    autoOrderPopupIns.setData(autoOrder);
    autoOrderPopupNode.position = targetStatefulBuildableOrderingNpc.node.position.add(
      cc.v2(0, targetStatefulBuildableOrderingNpc.node.height)
    ).add(
      cc.v2(0, autoOrderPopupNode.height * autoOrderPopupNode.anchorY)
    ); // hardcode temporarily. --guoyl6
    safelyAddChild(self.node, autoOrderPopupNode);
    setLocalZOrder(autoOrderPopupNode, CORE_LAYER_Z_INDEX.POPUP_OVER_STATEFUL_BUILDABLE_FOLLOWING_NPC);
    autoOrderPopupIns.refresh();
    autoOrder.targetAutoOrderPopup = autoOrderPopupIns;
    autoOrderPopupIns.onClicked = function(autoOrder, evt) {
      if (null != evt) {
        // Clicked by user, which is the case we should play an effect sound.
        self.playEffectCommonButtonClick();
        if (!self.isPurelyVisual() && !self.isFloatingModalPopup() && !self.isInCombo() && !self.isInNarrativeScene()) {
          return;
        }
        
      }

      // Check if the autoOrder's targetIngredient is not unlocked. [begin] {
      let playerIngredientForIdleGame = self.getPlayerIngredientForIdleGameByIngredientId(autoOrder.targetIngredientId);
      if (null == playerIngredientForIdleGame || playerIngredientForIdleGame.state != constants.PLAYER_INGREDIENT_FOR_IDLEGAME.STATE.UNLOCKED) {
        autoOrder.targetStatefulBuildableOrderingNpc.setMoodStateAndPlayAnimation(window.STATEFUL_BUILDABLE_ORDERING_NPC_MOOD_STATE.ORDERING_TAKEN_NOT_MET);
        autoOrder.targetStatefulBuildableOrderingNpc.state = window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.MOVING_OUT;
        self.removeFreeAutoOrder(autoOrder);
        self.removeFreeAutoOrderPopup(autoOrder);
        if (!self.isPurelyVisual()) {
          return;
        }
        // TODO: try to enter tutorialStage.
        const firstStageForNewPlayer = 0, purchaseIngredientStage = 3; // groupIndex
        if (null != self.interruptTutorialMask.visitedGroups[purchaseIngredientStage]) {
          // already enter tutorialStage.
          return;
        }
        let couldPassTutorial = false;
        for (let playerIngredientForIdleGame of self.playerIngredientForIdleGameList) {
          if (playerIngredientForIdleGame.state != constants.PLAYER_INGREDIENT_FOR_IDLEGAME.STATE.UNLOCKED) {
            continue;
          }
          const targetInteraction = self.filterBuildableIngredientInteractionByIngredientId(playerIngredientForIdleGame.ingredientId, constants.PLAYER_INGREDIENT_FOR_IDLEGAME.STATE.FREEORDER)[0];
          if (null == targetInteraction) {
            console.warn('None interaction of freeorder found for playerIngredientForIdleGame which ingredientId is:', playerIngredientForIdleGame.ingredientId);
            continue;
          }
          if (targetInteraction.ingredientPurchasePriceValue == 0) {
            continue;
          }
          // The user has already purchase an ingredient before.
          self.interruptTutorialMask.visitedGroups[purchaseIngredientStage] = {
            dictContent: {}
          };
          couldPassTutorial = true;
          break;
        }

        if (couldPassTutorial) {
          console.warn('The tutorialStage can be passed because the user has already purchased the requested ingredient.');
        } else {
          /*
          TODO

          There should be a narrative tutorial when the requested ingredient is not yet purchased!
          */
          const targetTutorialGroupData = constants.TUTORIAL_STAGE_GROUP[purchaseIngredientStage];
          if (null != targetTutorialGroupData) {
            self.currentTutorialGroupIndex = purchaseIngredientStage;
            self.currentTutorialStage = targetTutorialGroupData.START;

            let zoomDuration = self.mainCamera.zoomRatio != 1 ? 0.5 : 0;
            self.transitZoomRatioTo(1, zoomDuration, function() {
              self.narrativeSceneManager.showTutorialStage(null, self.currentTutorialStage);
            });
          } 
        }

        return;
      }
      // Check if the autoOrder's targetIngredient is not unlocked. [end] }
      
      autoOrderPopupIns.disableClick();
      switch (autoOrder.state) {
      case constants.FREE_AUTO_ORDER_STATE.NOT_TAKEN:
        autoOrderPopupIns.stopTimeRemainingLittleAnimation();
        autoOrder.state = constants.FREE_AUTO_ORDER_STATE.TAKEN_TRADING;
        autoOrder.targetStatefulBuildableOrderingNpc.transitToOrderTakenTradingAtDestinationAfterMoveIn(function() {
          autoOrder.startedAt = Date.now();
          autoOrderPopupIns.refresh();

          if (self.isInNarrativeScene()) {
            return;
          }
          
          if (!self.isInCombo()) {
            return;
          }
        
          if (null == self.comboIndicatorScriptIns) {
            self.comboIndicatorNode = cc.instantiate(self.comboIndicatorPrefab);
            const positionOnWidgetsAboveAllNode = cc.v2(self.widgetsAboveAllScriptIns.walletInfo.node.position.x, 200);

            self.comboIndicatorNode.setPosition(positionOnWidgetsAboveAllNode);
            self.comboIndicatorScriptIns = self.comboIndicatorNode.getComponent("ComboIndicator");  
            safelyAddChild(self.widgetsAboveAllNode, self.comboIndicatorNode);
            self.comboIndicatorScriptIns.init(self, (culmulatedCountAfterEnded, matchedComboRule) => {
              self.comboIndicatorNode = null;
              self.comboIndicatorScriptIns = null;

              /*
              [WARNING] 

              The following magic numbers are all just TEMPORARILY HARDCODED!

              -- YFLu, 2019-09-26 
              */
               
              let rewardedGold = 0, rewardedDiamond = 0;
              
              if (null != matchedComboRule) {
                rewardedGold = matchedComboRule.rewardedGold;
                rewardedDiamond = matchedComboRule.rewardedDiamond;
              } else {
                rewardedGold = 100;
                rewardedDiamond = 1;
              }

              // record combo score. [begin]
              if (null != self.comboCachedMap) {
                if (self.comboCachedMap.maxCulmulatedCount < culmulatedCountAfterEnded) {
                  self.comboCachedMap.reward.gold = rewardedGold;
                  self.comboCachedMap.reward.diamond = rewardedDiamond;
                  self.comboCachedMap.maxCulmulatedCount = culmulatedCountAfterEnded;
                }
              }
              // record combo score. [end]
            });
          }
          try {
            self.comboIndicatorScriptIns.feed();
            let comboRule = self.comboIndicatorScriptIns.findTheCurrentMatchedRule();
            if (null != comboRule) {
              autoOrder.incomeRatio = comboRule.incomeRatio;
            } else {
              autoOrder.incomeRatio = 1;
            }
          } catch (e) {
            console.warn("Failed to feed comboIndicator:", self.comboIndicatorScriptIns, e); 
          }
          
        });
        for (let buildableId in self.housekeeperNpcDict) {
          let housekeeperNpc = self.housekeeperNpcDict[buildableId];
          if (targetStatefulBuildableOrderingNpc == housekeeperNpc.targetStatefulBuildableOrderingNpc) {
            housekeeperNpc.targetStatefulBuildableOrderingNpc = null;
            housekeeperNpc.transitToStaying();
          }
        }
        break;
      case constants.FREE_AUTO_ORDER_STATE.TAKEN_TRADING:
        break;
      case constants.FREE_AUTO_ORDER_STATE.DELIVERED:
        break;
      default:
        break;
      }
    };

    // Play popup up and sync animation. [begin]
    let action = cc.sequence(
      cc.moveBy(0.7, cc.v2(0, 10)),
      cc.moveBy(0.7, cc.v2(0, -10))
    );
    autoOrderPopupNode.runAction(cc.repeatForever(action));
    // Play popup up and sync animation. [end]

  },

  removeFreeAutoOrderPopup(freeAutoOrder) {
    const self = this;
    if (null != freeAutoOrder && null != freeAutoOrder.targetAutoOrderPopup) {
      const freeAutoOrderPopupIns = freeAutoOrder.targetAutoOrderPopup;
      freeAutoOrderPopupIns.stopIngredientFlyingAnimation();
      freeAutoOrderPopupIns.stopEatingAnimation();
      freeAutoOrderPopupIns.node.destroy();
      freeAutoOrder.targetAutoOrderPopup = null;
    }
  },

  createCachedGoldForAutoOrder(freeAutoOrder, cachedGoldNodePosition) {
    const self = this;
    // You should explicitly check if freeAutoOrder is alived.
    if (null == freeAutoOrder || null == freeAutoOrder.startedAt) {
      return;
    }

    const completeProgress = Math.min(Date.now() - freeAutoOrder.startedAt, freeAutoOrder.durationMillis) / freeAutoOrder.durationMillis;
    const goldCount = Math.floor(completeProgress * freeAutoOrder.targetIngredient.reclaimPriceValue * freeAutoOrder.incomeRatio);
    const targetCachedGoldIns = self.renderCachedGold(freeAutoOrder.localId, cachedGoldNodePosition, goldCount, false);
    // 目前金币没有掉落动画，加上之后再考虑实现onCoinFallCompleted，若实现了，新手教程那里也要改.
    // targetCachedGoldIns.onCoinFallCompleted = function() {
      if (self.isInCombo()) {
        setTimeout(function() {
          if (null != targetCachedGoldIns.node && null != targetCachedGoldIns.node.parent) {
            targetCachedGoldIns.onSelfClicked();
          }
        }, 1000);
      }
    // }
    if (null != self.comboCachedMap && self.isInCombo() && freeAutoOrder.startedAt >= self.comboStartTimeMillis) {
      self.comboCachedMap.cachedGoldNodeList.push(targetCachedGoldIns.node);
      self.comboCachedMap.culmulatedGoldCount += targetCachedGoldIns.goldCount;
    }
  },

  renderCachedGold(cachedGoldId, position, goldCount, doNotSaveIntoLocalStorage) {
    const self = this;
    const cachedGoldNode = cc.instantiate(self.cachedGoldPrefab);
    const cachedGoldIns = cachedGoldNode.getComponent('CachedGold');
    cachedGoldIns.init(self, cachedGoldId);
    cachedGoldIns.setData(goldCount);
    cachedGoldNode.setPosition(position);
    safelyAddChild(self.node, cachedGoldNode);
    setLocalZOrder(cachedGoldNode, window.CORE_LAYER_Z_INDEX.CACHED_GOLD);
    // 禁用CachedGold的点击响应
    if (null != cachedGoldIns.collectButton) {
      cachedGoldIns.collectButton.enabled = false;
    }
    // 缓存cachedGold. [begin] {
    if (!doNotSaveIntoLocalStorage) {
      let unCollectFreeAutoOrderMap = null;
      try {
        unCollectFreeAutoOrderMap = JSON.parse(cc.sys.localStorage.getItem("unCollectFreeAutoOrderMap") || '{}');
      } catch (e) {
        unCollectFreeAutoOrderMap = {};
      }
      unCollectFreeAutoOrderMap[cachedGoldId] = [position, goldCount];
      cc.sys.localStorage.setItem("unCollectFreeAutoOrderMap", JSON.stringify(unCollectFreeAutoOrderMap));
    }
    // 缓存cachedGold. [end] }
    cachedGoldIns.onCollect = function(evt, cb) {
      self.playEffectCollectGold();
      self.widgetsAboveAllScriptIns.walletInfo.setData({
        gold: self.wallet.gold + cachedGoldIns.goldCount,
      });
      self.increaseAllPlayerQuestBindingCompletedCountByResource(constants.QUEST_RESOURCE_TYPE.FREEORDER_INCOME, null, cachedGoldIns.goldCount);
      const goldAdditionTipScriptIns = self.showGoldAdditionTip(cachedGoldNode, goldCount, -cachedGoldNode.height / 2 + 60);
      cachedGoldIns.playAnimationNodeFlyingAnimation(0.5*goldAdditionTipScriptIns.durationMillis /* Hardcoded temporarily -- YFLu, 2019-11-16. */, cb);
      // 移除缓存的cachedGold. [begin] {
      let unCollectFreeAutoOrderMap = null;
      try {
        unCollectFreeAutoOrderMap = JSON.parse(cc.sys.localStorage.getItem("unCollectFreeAutoOrderMap") || '{}');
      } catch (e) {
        unCollectFreeAutoOrderMap = {};
      }
      delete unCollectFreeAutoOrderMap[cachedGoldId];
      cc.sys.localStorage.setItem("unCollectFreeAutoOrderMap", JSON.stringify(unCollectFreeAutoOrderMap));
      // 移除缓存的cachedGold. [end] }
    };
    return cachedGoldIns;
  },

  refreshPopupEntry() {
    const self = this;
    let showUpon = BuildableMap.prototype.refreshPopupEntry.call(self);
    if (null != self.freeAutoOrderDict) {
      for (let npcId in self.freeAutoOrderDict) {
        const freeAutoOrder = self.freeAutoOrderDict[npcId];
        if (showUpon.listEntry) {
          freeAutoOrder.targetAutoOrderPopup.show();
        } else {
          freeAutoOrder.targetAutoOrderPopup.hide();
        }
      }
    }
  },
  
  upgradeStatefulBuildableInstance(statefulBuildableInstance) {
    const self = this;
    
    let toCollectIncomeScriptIns = statefulBuildableInstance.node.toCollectIncomeNode.getComponent('ToCollectIncome');
    if (0 < toCollectIncomeScriptIns.cachedGoldCount) {
      self.collectAutoIncreaseCachedGold(statefulBuildableInstance, true);
    }

    BuildableMap.prototype.upgradeStatefulBuildableInstance.apply(self, arguments);
    if (null != statefulBuildableInstance.boundOrderingNpcDict) {
      for (let uuid in statefulBuildableInstance.boundOrderingNpcDict) {
        const statefulBuildableOrderingNpcIns = statefulBuildableInstance.boundOrderingNpcDict[uuid];
        self.evicAnOrderingNpc(statefulBuildableOrderingNpcIns);
      }
    }
  },

  onPlayerBuildableListQueryResponded(resp) {
    const self = this;
    let data = pbDecodeData(window.syncDataStruct, resp.syncData);

    self.housekeeperBindingList = data.housekeeperBindingList || [];
    self.housekeeperOfflineIncome = data.housekeeperOfflineIncome;

    self.comboCulmulatedCount = data.comboCulmulatedCount || 0;

    self.wallet = self.wallet || {};
    self.widgetsAboveAllScriptIns.walletInfo.init(self);

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
    }
    self.updateOverallGoldLimit();
    window.refreshCachedKnownBarrierGridDict(self.node, self.barrierColliders, null);
    // 初始化StatefulBuildableInstance集合 [ends]

    // 还原缓存的cachedGold. [begin] {
    let unCollectFreeAutoOrderMap = null;
    try {
      unCollectFreeAutoOrderMap = JSON.parse(cc.sys.localStorage.getItem('unCollectFreeAutoOrderMap') || '{}');
      let largestFreeAutoOrderId = self.freeAutoOrderIncreasedId;
      for (let freeAutoOrderLocalId in unCollectFreeAutoOrderMap) {
        let [cachedGoldNodePosition, goldCount] = unCollectFreeAutoOrderMap[freeAutoOrderLocalId];
        self.renderCachedGold(freeAutoOrderLocalId, cachedGoldNodePosition, goldCount, true);
        largestFreeAutoOrderId = Math.max(largestFreeAutoOrderId, freeAutoOrderLocalId);
      }
      self.freeAutoOrderIncreasedId = largestFreeAutoOrderId + 1;
    } catch(e) {}
    // 还原缓存的cachedGold. [end] }

    // 初始化wallet对象 [begins]
    /*
    [WARNING] 

    Deliberately proceeding AFTER the updating of "wallet.goldLimit".

    -- YFLu, 2019-10-01.
    */
    self.widgetsAboveAllScriptIns.walletInfo.setData({
      gold: (null != data.wallet && null != data.wallet.gold) ? data.wallet.gold : 0,
      diamond: resp.diamond, 
    });
    // 初始化wallet对象 [ends]

    // 构造各个StatefulBuildableInstance的IngredientProgressListEntry [begins].
    const ingredientProgressList = resp.ingredientProgressList || [];
    self.statefulBuildableInstanceCompList.forEach((statefulBuildableInstance) => {
      let data = ingredientProgressList.filter(x => x.playerBuildableBindingId == statefulBuildableInstance.playerBuildableBinding.id);
      self.refreshIngredientProgressListEntry(statefulBuildableInstance, data);
    });
    // 构造各个StatefulBuildableInstance的IngredientProgressListEntry [ends].
    
    // 初始化Mission 相关记录 questCompletedMap, accumulatedResource. [begin] {
    self.questCompletedMap = data.questCompletedMap || {};
    self.accumulatedResource = data.accumulatedResource || {};
    if (null == resp.playerMissionBindingList) {
      resp.playerMissionBindingList = [];
    }

    let shouldRefreshMissionGUI = self.updatePlayerMissionBindingList(resp.playerMissionBindingList);
    self.refreshQuestCompletedMapForDailyMission();
    self.refreshQuestCompletedMapForAchievement();
    resp.playerMissionBindingList.forEach(function(playerMission) {
      if (playerMission.state == constants.MISSION_STATE.COMPLETED_OBTAINED) {
        self.claimMissionReward(playerMission.id, playerMission.giftList);
      }
    });
    if (true == shouldRefreshMissionGUI) {
      self.refreshMissionButtonCountTip(); 
    }
    // 初始化Mission 相关记录 questCompletedMap, accumulatedResource. [end] }

    self.initKnapsackArray(resp.knapsack);
    self.initPlayerRecipe(resp.playerRecipeList);

    // Initialization of playerIngredientForIdleGameList. [begin] 
    self.initPlayerIngredientForIdleGameList(resp.playerIngredientForIdleGameList);
    // Initialization of playerIngredientForIdleGameList. [end] 

    self.refreshStatelessBuildableInstanceCardListDisplay();

    // pre-initialization of "IdlePlayerArchivePanel" & "PlayerAchievementPanel". [begins]
    self.showIdlePlayerArchivePanel(true);
    self.showPlayerAchievementPanel(true);
    // pre-initialization of "IdlePlayerArchivePanel" & "PlayerAchievementPanel". [ends]

    // Handles "data.tutorialStage" & "resp.interruptTutorialMask". [begin]
    const decodedInterruptTutorialMask = window.pbDecodeData(window.interruptTutorialMaskStruct, resp.interruptTutorialMask); 
    self.interruptTutorialMask = decodedInterruptTutorialMask;
    const firstStageForNewPlayer = 0, purchaseIngredientStage = 3; // groupIndex
    // "Map.currentTutorialStage" is initialized to 0 within "NarrativeSceneManagerDelegate". -- YFLu, 2019-10-11.
    let targetTutorialGroupIndex = self.narrativeSceneManager.findGroupIndexByStage(data.tutorialStage || 0); 
    const targetTutorialGroupData = constants.TUTORIAL_STAGE_GROUP[targetTutorialGroupIndex]; 
    if (null != data.tutorialStage) {
      self.currentTutorialStage = data.tutorialStage;
      if (null  == self.narrativeSceneManager.findGroupIndexByStage(self.currentTutorialStage)) {
        // A dirty fix for "an old player" whose tutorial stage is terribly wrong.
        self.currentTutorialStage = targetTutorialGroupData.START;
      } 
    } else {
      self.currentTutorialStage = targetTutorialGroupData.START;
    }

    if (0 < data.playerBuildableBindingList.length && self.currentTutorialStage == targetTutorialGroupData.START && targetTutorialGroupIndex == firstStageForNewPlayer) {
      // Deem all players with any built substance "an old player that doesn't need tutorial group[1]".
      self.currentTutorialStage = targetTutorialGroupData.END; 
    }


    if (self.currentTutorialStage == targetTutorialGroupData.END || (null == targetTutorialGroupData.EDGES[self.currentTutorialStage] && self.currentTutorialStage != targetTutorialGroupData.END)) {
      self.initAfterAllTutorialStages();
    } else {
      self.currentTutorialGroupIndex = targetTutorialGroupIndex;
      if (self.currentTutorialStage == targetTutorialGroupData.START) {
        // Do something for tutorial group start.
        switch (self.currentTutorialStage) {
          case firstStageForNewPlayer:
            if (null != self.cachedGoldNodeList && 0 < self.cachedGoldNodeList.length) {
              let deletedNodeList = self.cachedGoldNodeList.splice(0, self.cachedGoldNodeList.length);
              console.warn(deletedNodeList.length + ' deprecated cachedGoldNode found, start deleting them.');
              for (let node of deletedNodeList) {
                node.destroy();
              }
              console.warn('Deprecated cachedGoldNode deleted.');
              cc.sys.localStorage.setItem('unCollectFreeAutoOrderMap', JSON.stringify({}));
            }
            break;
        }
      }
      let zoomDuration = self.mainCamera.zoomRatio != 1 ? 0.5 : 0;
      self.transitZoomRatioTo(1, zoomDuration, function() {
        self.narrativeSceneManager.showTutorialStage(null, self.currentTutorialStage);
      });
      if (self.currentTutorialStage != targetTutorialGroupData.END) {
        self.setSideButtonGroupActive(false, true);
      }
    }
    // Handles "data.tutorialStage" & "resp.interruptTutorialMask". [end]

    self.saveIntoLocalStorage(); 

    // Loads `gameSettings`, and starts playing BGM if applicable. [begins]
    const savedGameSettingsStr = cc.sys.localStorage.getItem("gameSettings");
    self.gameSettingsPanelNode = cc.instantiate(self.gameSettingsPanelPrefab);
    self.gameSettingsPanelNode.setPosition(cc.v2(0, 0));
    self.gameSettingsPanelScriptIns = self.gameSettingsPanelNode.getComponent("GameSettingsPanel");
    self.gameSettingsPanelScriptIns.init(self);

    if (null != savedGameSettingsStr && 0 < savedGameSettingsStr.length) {
      const savedGameSettings = JSON.parse(savedGameSettingsStr);
      self.gameSettings = Object.assign(self.gameSettings, savedGameSettings);
    }
      
    if (null == self.gameSettings.volumeToggle) {
      self.gameSettings.volumeToggle = true;
    }

    if (null == self.gameSettings.volumePercentage) {
      self.gameSettings.volumePercentage = 0.5;
    }

    self.gameSettingsPanelScriptIns.volumeSlider.progress = self.gameSettings.volumePercentage;
    self.volumeToggle.active = self.gameSettings.volumeToggle;
    if (self.volumeToggle.active) {
      // The assignment above alone might miss to trigger the following function when "true == self.gameSettings.volumeToggle".
      self.onVolumeActive();
    }
    // Loads `gameSettings`, and starts playing BGM if applicable. [ends]

    if (null != self.loadingTip) {
      self.loadingTip.active = false;
    }
  },

  onAllStatefulBuildableOnLoadCalled() {
    const self = this;
    BuildableMap.prototype.onAllStatefulBuildableOnLoadCalled.call(this);
  },

  update(dt) {
    // Deliberately not call BuildableMap.prototype.update.
    const self = this;
    if (null != self.cachedPlayerBuildableQueryRespToHandle) {
      try {
        self.onPlayerBuildableListQueryResponded(self.cachedPlayerBuildableQueryRespToHandle);
      } catch (e) {
        console.warn("IdleGameMap.update error:", e);
        if (null != window.handleNetworkDisconnected) {
          window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
        }
      } finally {
        self.cachedPlayerBuildableQueryRespToHandle = null;
      }
      return;
    }

    if (true == self.toShowIdlePlayerArchivePanel) {
      self.showIdlePlayerArchivePanel();
      self.toShowIdlePlayerArchivePanel = false; // Regardless of whether the panel is successfully showed or not. -- YFLu, 2019-10-31.
      return;
    }

    if (true == self.toShowPlayerAchievementPanel) {
      const st = Date.now();
      self.showPlayerAchievementPanel();
      const ed = Date.now();
      console.log("It took ", ed - st, " millis to showIdlePlayerArchivePanel.");
      self.toShowPlayerAchievementPanel = false;  // Regardless of whether the panel is successfully showed or not. -- YFLu, 2019-10-31.
      return;
    }

    if (null != self.ctrl) {
      /*
      [WARNING]
      Using "self.ctrl" as a checkvalve is a dirty fix to hold back "npc spawning" to after the map is fully ready for touch event handling, and thus npc interaction handling.

      -- YFLu, 2019-10-31.
      */
      const singleMarketBuildableInstance = self.getStatefulBuildableInstanceListByBuildableId(constants.STATELESS_BUILDABLE_ID.MARKET)[0];
      if (null == singleMarketBuildableInstance) {
        self.refreshCachedGold(50);
      } else {
        let levelConf = singleMarketBuildableInstance.currentLevelConf;
        self.refreshCachedGold(levelConf ? levelConf.goldLimitAddition * 0.1 : 50);
      }
        
      let curTimeStampMillis = Date.now();
      let spawnAnOrderingNpcInterval = self.isInCombo() ? constants.DURATION_MILLIS.SPAWN_AN_ORDERING_NPC_IN_COMBO : constants.DURATION_MILLIS.SPAWN_AN_ORDERING_NPC;
      // To spawn an orderingNpc after some duration. [begin] {
      if (null != self.lastOrderingNpcSpawnTimeMillis
        && curTimeStampMillis - self.lastOrderingNpcSpawnTimeMillis >= spawnAnOrderingNpcInterval) {

        // TODO: Choose a appropriately target.
        let count = self.isInCombo() ? constants.SPAWNED_ORDERING_NPC_COUNT_PER_INTERVAL_IN_COMBO : constants.SPAWNED_ORDERING_NPC_COUNT_PER_INTERVAL;
        let retList = self.randomPickSevelralStatefulBuildableInstanceForOrderingNpc(count);
        for (let i = 0; i < retList.length; i++) {
          let statefulBuildableInstanceComp = retList[i].target;
          let chairs = retList[i].idleChairs;
          const chosenGrandSrc = window.randomProperty(self.attackingNpcPositionInMapNodeList);
          const targetChair = window.randomProperty(chairs);
          if (targetChair != null) {
            self.spawnOrderingNpc(statefulBuildableInstanceComp, chosenGrandSrc, targetChair);
          } 
        }
        self.lastOrderingNpcSpawnTimeMillis = curTimeStampMillis;
      }
      // To spawn an orderingNpc after some duration. [end] }

      if (null != self.freeAutoOrderDict) {
        for (let npcId in self.freeAutoOrderDict) {
          const freeAutoOrder = self.freeAutoOrderDict[npcId];
          const tensionForRemainingMillis = freeAutoOrder.timeoutMillisBeforeTaken - 3000;
          switch (freeAutoOrder.state) {
          case constants.FREE_AUTO_ORDER_STATE.NOT_TAKEN:
          if (curTimeStampMillis - freeAutoOrder.createdAt >= freeAutoOrder.timeoutMillisBeforeTaken) {
            self.onFreeAutoOrderTimeout(freeAutoOrder);
          } else if (curTimeStampMillis - freeAutoOrder.createdAt >= tensionForRemainingMillis) {
            freeAutoOrder.targetAutoOrderPopup.playTimeRemainingLittleAnimation();
          }
          break;
          case constants.FREE_AUTO_ORDER_STATE.TAKEN_TRADING:
          if (curTimeStampMillis - freeAutoOrder.startedAt >= freeAutoOrder.durationMillis) {
            self.completeFreeAutoOrder(freeAutoOrder);
          }
          case constants.FREE_AUTO_ORDER_STATE.DELIVERED:
          break;
          }
        }
      }

      // Refresh cooking state for statefulBuildableInstanceComp. [begin]
      for (let statefulBuildableInstanceComp of self.statefulBuildableInstanceCompList) {
        if (!statefulBuildableInstanceComp.isIdle()) {
          self.refreshCookingAnimationForStatefulBuildableInstance(statefulBuildableInstanceComp, true);
          continue;
        }
        self.refreshCookingAnimationForStatefulBuildableInstance(statefulBuildableInstanceComp, false);
      }
      // Refresh cooking state for statefulBuildableInstanceComp. [end]
    }
  },

  refreshCachedGold(toShowCollectGoldPopupCount = 5) {
    const self = this;
    if (null == self.wallet) {
      return;
    }

    if (self.isInNarrativeScene()) {
      return;
    }
    // Calculate globalCachedGold. [begin] {
    let globalCachedGold = 0, globalGoldAdditionLimit = self.wallet.goldLimit - self.wallet.gold;
    
    for (let i in self.statefulBuildableInstanceCompList) {
      const statefulBuildableInstance = self.statefulBuildableInstanceCompList[i];
      const goldProductionRate = statefulBuildableInstance.currentBaseGoldProductionRate;
      const playerBuildableBinding = statefulBuildableInstance.playerBuildableBinding;
      let buildableCachedGold = 0, buildableGoldLimit = 0;
      if (null == statefulBuildableInstance.node.toCollectIncomeNode || 0 >= goldProductionRate) {
        // unRendered.
        continue;
      }
      let toCollectIncomeScriptIns = statefulBuildableInstance.node.toCollectIncomeNode.getComponent('ToCollectIncome');
      if (!statefulBuildableInstance.isIdle() || null == playerBuildableBinding.lastCollectedAt) {
        toCollectIncomeScriptIns.setData(0);
        continue;
      }
      switch (statefulBuildableInstance.id) {
      case constants.STATELESS_BUILDABLE_ID.MARKET:
        for (let levelConfIndex in statefulBuildableInstance.levelConfs) {
          const levelConf = statefulBuildableInstance.levelConfs[levelConfIndex];
          if (levelConf.level <= statefulBuildableInstance.currentLevel) {
            buildableGoldLimit += levelConf.goldLimitAddition;
          }
        }
        buildableCachedGold = Math.floor(goldProductionRate * (Date.now() - playerBuildableBinding.lastCollectedAt) / 1000);
        buildableCachedGold = Math.min(buildableCachedGold, buildableGoldLimit);
        toCollectIncomeScriptIns.setData(buildableCachedGold);
        break;
      
      default:
        toCollectIncomeScriptIns.setData(0);
        break;
      }
      globalCachedGold += buildableCachedGold;
      globalCachedGold = Math.min(globalGoldAdditionLimit, globalCachedGold);
    }
    // Calculate globalCachedGold. [end] }

    // 汇集金币到Market [begin] {
    let singleMarketBuildableInstance = self.getStatefulBuildableInstanceListByBuildableId(constants.STATELESS_BUILDABLE_ID.MARKET)[0];
    let singleMarketBuildableInstanceGoldLimit = 0;
    let singleMarketBuildableInstanceToCollectIncomeScriptsIns = null, singleMarketBuildableInstanceCachedGoldCount = 0;
    if (
        null != singleMarketBuildableInstance &&
        null != singleMarketBuildableInstance.node.toCollectIncomeNode &&
        singleMarketBuildableInstance.isIdle()
    ) {
      for (let levelConfIndex in singleMarketBuildableInstance.levelConfs) {
        const levelConf = singleMarketBuildableInstance.levelConfs[levelConfIndex];
        if (levelConf.level <= singleMarketBuildableInstance.currentLevel) {
          singleMarketBuildableInstanceGoldLimit += levelConf.goldLimitAddition;
        }
      }
      singleMarketBuildableInstanceToCollectIncomeScriptsIns = singleMarketBuildableInstance.node.toCollectIncomeNode.getComponent('ToCollectIncome');
      singleMarketBuildableInstanceCachedGoldCount = singleMarketBuildableInstanceToCollectIncomeScriptsIns.cachedGoldCount;
    }
    for (let i in self.statefulBuildableInstanceCompList) {
      const statefulBuildableInstance = self.statefulBuildableInstanceCompList[i];
      const goldProductionRate = statefulBuildableInstance.currentBaseGoldProductionRate;
      const playerBuildableBinding = statefulBuildableInstance.playerBuildableBinding;
      let increaseCachedGold = 0;
      if (null == statefulBuildableInstance.node.toCollectIncomeNode || 0 >= goldProductionRate) {
        // unRendered.
        continue;
      }
      let toCollectIncomeScriptIns = statefulBuildableInstance.node.toCollectIncomeNode.getComponent('ToCollectIncome');
      if (!statefulBuildableInstance.isIdle() || null == playerBuildableBinding.lastCollectedAt) {
        continue;
      }
      switch (statefulBuildableInstance.id) {
      case constants.STATELESS_BUILDABLE_ID.MARKET:
        break;
      default:
        // 汇集金币到Market
        if (null == singleMarketBuildableInstanceToCollectIncomeScriptsIns) {
          break;
        }
        increaseCachedGold = Math.floor(goldProductionRate * (Date.now() - playerBuildableBinding.lastCollectedAt) / 1000); 
        singleMarketBuildableInstanceCachedGoldCount += increaseCachedGold;
        toCollectIncomeScriptIns.setData(0);
        break;
      }
    }
    if (null != singleMarketBuildableInstanceToCollectIncomeScriptsIns) {
      singleMarketBuildableInstanceCachedGoldCount = Math.min(singleMarketBuildableInstanceCachedGoldCount, singleMarketBuildableInstanceGoldLimit);
      singleMarketBuildableInstanceToCollectIncomeScriptsIns.setData(singleMarketBuildableInstanceCachedGoldCount);
    }
    // 汇集金币到Market [end] }
    
    // refresh toCollectIncomeNode. [begin] {
    for (let i in self.statefulBuildableInstanceCompList) {
      const statefulBuildableInstance = self.statefulBuildableInstanceCompList[i];
      if (null == statefulBuildableInstance.node.toCollectIncomeNode) {
        continue;
      }
      const toCollectIncomeScriptIns = statefulBuildableInstance.node.toCollectIncomeNode.getComponent('ToCollectIncome');
      if (toCollectIncomeScriptIns.cachedGoldCount > toShowCollectGoldPopupCount && (self.isInNarrativeScene() || self.isPurelyVisual()) && statefulBuildableInstance.isIdle()) {
        toCollectIncomeScriptIns.node.active = true;
      } else {
        toCollectIncomeScriptIns.node.active = false;
      }
    }
    // refresh toCollectIncomeNode. [end] }

  },

  collectAutoIncreaseCachedGold(statefulBuildableInstance, shouldPlayAnimation) {
    const self = this;
    BuildableMap.prototype.collectAutoIncreaseCachedGold.apply(self, arguments);
    switch (statefulBuildableInstance.id) {
    case constants.STATELESS_BUILDABLE_ID.MARKET:
      for (let i in self.statefulBuildableInstanceCompList) {
        const statefulBuildableInstanceComp = self.statefulBuildableInstanceCompList[i];
        switch (statefulBuildableInstanceComp.id) {
        case constants.STATELESS_BUILDABLE_ID.MARKET:
        break;
        default: 
          self.collectAutoIncreaseCachedGold(statefulBuildableInstanceComp, false);
        break;
        }
      }
      break;
    }
  },

  randomlyPickAStatefulBuildableInstanceForOrderingNpc() {
    const self = this;
    let statefulBuildableInstanceCompListWithIdleChairs = [];
    for (let i in self.statefulBuildableInstanceCompList) {
      const statefulBuildableInstanceComp = self.statefulBuildableInstanceCompList[i];
      if (!statefulBuildableInstanceComp.isIdle()) {
        continue;
      }
      let idleChairs = self.getIdleChairsForStatefulBuildableInstance(statefulBuildableInstanceComp);
      if (idleChairs.length > 0) {
        statefulBuildableInstanceCompListWithIdleChairs.push(statefulBuildableInstanceComp);
      }
    }
    if (0 >= statefulBuildableInstanceCompListWithIdleChairs.length) {
      return null;
    }
    return window.randomProperty(statefulBuildableInstanceCompListWithIdleChairs);
  },

  randomPickSevelralStatefulBuildableInstanceForOrderingNpc(count=1) {
    const self = this;
    let statefulBuildableInstanceCompListWithIdleChairs = [], ret = [];
    for (let i in self.statefulBuildableInstanceCompList) {
      const statefulBuildableInstanceComp = self.statefulBuildableInstanceCompList[i];
      if (!statefulBuildableInstanceComp.isIdle()) {
        continue;
      }
      let idleChairs = self.getIdleChairsForStatefulBuildableInstance(statefulBuildableInstanceComp);
      if (idleChairs.length > 0) {
        statefulBuildableInstanceCompListWithIdleChairs.push({
          target: statefulBuildableInstanceComp,
          idleChairs: idleChairs,
        });
      }
    }
    for (let i = 0; i < count; i++) {
      if (0 >= statefulBuildableInstanceCompListWithIdleChairs.length) {
        break;
      }
      let randomIndex = getRandomInt(0, statefulBuildableInstanceCompListWithIdleChairs.length);
      ret.push(statefulBuildableInstanceCompListWithIdleChairs[randomIndex]);
      statefulBuildableInstanceCompListWithIdleChairs.splice(randomIndex, 1);
    }
    return ret;
  },

  getIdleChairsForStatefulBuildableInstance(statefulBuildableInstanceComp) {
    const self = this;
    const idleChairs = [];
    if (null == statefulBuildableInstanceComp.chairOffsetDict) {
      return idleChairs;
    }
    for (let chairId in statefulBuildableInstanceComp.chairOffsetDict) {
      let chair = statefulBuildableInstanceComp.chairOffsetDict[chairId], chairOccupied = false;
      if (null != statefulBuildableInstanceComp.boundOrderingNpcDict) {
        for (let uuid in statefulBuildableInstanceComp.boundOrderingNpcDict) {
          const statefulBuildableOrderingNpcIns = statefulBuildableInstanceComp.boundOrderingNpcDict[uuid];
          if (null != statefulBuildableOrderingNpcIns.targetChair && chair == statefulBuildableOrderingNpcIns.targetChair) {
            chairOccupied = true;
            break;
          }
        }
      }

      if (!chairOccupied) {
        idleChairs.push(chair);
      }
    }
    return idleChairs;
  },

  initAfterAllTutorialStages() {
    const self = this;
    if (self._inited) {
      return;
    }
    self._inited = true;
    BuildableMap.prototype.initAfterAllTutorialStages.apply(self, arguments); 
    self.lastOrderingNpcSpawnTimeMillis = Date.now();
    self.widgetsAboveAllScriptIns.elapsedTimer.node.active = false;
    try {
      if (self.housekeeperEnabled) {
        for (let statefulBuildableInstanceComp of self.statefulBuildableInstanceCompList) {
          self.createHousekeeperBindingIfNotExists(statefulBuildableInstanceComp.id);
        }
        self.removeDeprecatedHousekeeperBindingRecord();
        self.createOfflineIncomeButtonAndUpdateHousekeeperBindingList();
        for (let housekeeperBinding of self.housekeeperBindingList) {
          self.spawnHousekeeperNpcIfNotExists(housekeeperBinding);
        }
      }
    } catch(e) {
      console.error('When spawnHousekeeperNpcIfNotExists, error occurs:', e);
    }
  },

  createOfflineIncomeButtonAndUpdateHousekeeperBindingList() {
    const self = this;
    // calculate the housekeeperOfflineIncome. [begin] {
    for (let housekeeperBinding of self.housekeeperBindingList) {
      if (null != housekeeperBinding.lastPeriodStartedAt && 0 != housekeeperBinding.lastPeriodStartedAt) {
        const nowMillis = Date.now();
        const buildableId = housekeeperBinding.buildableId;
        const housekeeperConfigured = constants.HOUSEKEEPER["BUILDABLEID_" + buildableId];
        const housekeeperLevelBinding = housekeeperConfigured.LEVEL_BINDINGS[housekeeperBinding.currentLevel];
        const onDutyDurationMillis = housekeeperLevelBinding.ON_DUTY_DURATION_MILLIS;
        const restDurationMillis = housekeeperLevelBinding.REST_DURATION_MILLIS;
        const aPeriodDurationMillis = onDutyDurationMillis + restDurationMillis; 
        const periodCount = Math.floor((nowMillis - housekeeperBinding.lastPeriodStartedAt) / aPeriodDurationMillis);
        const RATIO = 0.7;
        const onDutyDuration = onDutyDurationMillis / 1000;
        let countTable = 0, guestGenerationInterval = constants.DURATION_MILLIS.SPAWN_AN_ORDERING_NPC / 1000,
            walkingDuration = 0, servingDuration = 0, unitPrice = 0, totalPrice = 0, totalCount = 0, totalDuration = 0;

        let aPeriodOfflineIncome, totalOfflineIncome = 0;

        for (let statefulBuildableInstanceComp of self.statefulBuildableInstanceCompList) {
          if (statefulBuildableInstanceComp.id != housekeeperBinding.buildableId) {
            continue;
          }
          const chairOffsetDict = statefulBuildableInstanceComp.chairOffsetDict;
          countTable += Object.keys(chairOffsetDict).length;
        }
        let interactionList = self.filterBuildableIngredientInteractionByBuildableId(housekeeperBinding.buildableId, constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.FREEORDER);
        for (let interaction of interactionList) {
          const playerIngredientForIdleGame = self.getPlayerIngredientForIdleGameByIngredientId(interaction.ingredientId);
          if (null == playerIngredientForIdleGame || playerIngredientForIdleGame.state != constants.PLAYER_INGREDIENT_FOR_IDLEGAME.STATE.UNLOCKED) {
            continue;
          }
          const ingredient = self.getIngredientById(playerIngredientForIdleGame.ingredientId);
          totalDuration += ingredient.baseReclaimDurationMillis / 1000;
          totalPrice += ingredient.reclaimPriceValue;
          totalCount += 1;
        }
        unitPrice = totalCount > 0 ? totalPrice / totalCount : 0;
        servingDuration = totalCount > 0 ? totalDuration / totalCount : 0;

        walkingDuration = countTable * 10;

        const periodServingDuration = (servingDuration + walkingDuration);

        if (countTable * guestGenerationInterval > servingDuration + walkingDuration) {
          aPeriodOfflineIncome = onDutyDuration / ( periodServingDuration * 2 ) * unitPrice * ( periodServingDuration / guestGenerationInterval );
        } else {
          aPeriodOfflineIncome = onDutyDuration / (periodServingDuration + countTable * guestGenerationInterval) * unitPrice * countTable;
        }

        totalOfflineIncome = Math.floor(aPeriodOfflineIncome * periodCount * RATIO);
        
        if (totalOfflineIncome > 0) {
          self.housekeeperOfflineIncome += totalOfflineIncome;
        }
        // refresh the housekeeperBinding.lastPeriodStartedAt.
        housekeeperBinding.lastPeriodStartedAt += Math.floor(periodCount * aPeriodDurationMillis);
      }
    }
    let housekeeperOfflineIncomeLimit = 0;
    for (let statefulBuildableInstanceComp of self.statefulBuildableInstanceCompList) {
      switch (statefulBuildableInstanceComp.id) {
      case constants.STATELESS_BUILDABLE_ID.SNACK:
      case constants.STATELESS_BUILDABLE_ID.BAKERY:
      case constants.STATELESS_BUILDABLE_ID.CAFE:
        housekeeperOfflineIncomeLimit += statefulBuildableInstanceComp.currentLevelConf.goldLimitAddition;
        break;
      default:
        console.log('The housekeeperOfflineIncomeLimit would not care the buildable:', statefulBuildableInstanceComp.id);
        break;
      }
    }
    console.log(
      'Calculate the housekeeperOfflineIncom completed.',
        '\n\tvalue is:', self.housekeeperOfflineIncome,
        '\n\tthe limit is:', housekeeperOfflineIncomeLimit,
        '\n\twill set to:', Math.min(self.housekeeperOfflineIncome, housekeeperOfflineIncomeLimit)
    );
    self.housekeeperOfflineIncome = Math.min(self.housekeeperOfflineIncome, housekeeperOfflineIncomeLimit);
    // calculate the housekeeperOfflineIncome. [end] }
    // create offlineIncomeCachedGold. [begin] {
    const goldCountToForceTip = 1000;
    if (self.housekeeperOfflineIncome > 0) {
      const statefulBuildableInstanceComp = self.getStatefulBuildableInstanceListByBuildableId(constants.STATELESS_BUILDABLE_ID.HEADQUARTER)[0];
      if (null != statefulBuildableInstanceComp.node.followingCachedGoldNode) {
        statefulBuildableInstanceComp.node.followingCachedGoldNode.removeFromParent();
        statefulBuildableInstanceComp.node.followingCachedGoldNode = null;
      }
      const cachedGoldNode = cc.instantiate(self.cachedGoldPrefab);
      const cachedGoldIns = cachedGoldNode.getComponent('CachedGold');
      cachedGoldIns.init(self, -1);
      cachedGoldIns.usePiggyBankAnimationNode();
      cachedGoldIns.setData(self.housekeeperOfflineIncome);

      const npcSrcContinuousPosWrtMapNode = statefulBuildableInstanceComp.fixedSpriteCentreContinuousPos;
      cachedGoldNode.setPosition( statefulBuildableInstanceComp.node.position.add(
        constants.HOUSEKEEPER.CACHED_GOLD_OFFSET_TO_BUILDBALE_SPRITE_CENTER
      ));
      safelyAddChild(self.node, cachedGoldNode);
      setLocalZOrder(cachedGoldNode, window.CORE_LAYER_Z_INDEX.CACHED_GOLD);
      // 禁用CachedGold的点击响应
      if (null != cachedGoldIns.collectButton) {
        cachedGoldIns.collectButton.enabled = false;
      }
      const _originalOnSelfClicked = cachedGoldIns.onSelfClicked;
      cachedGoldIns.onSelfClicked = function(evt) {
        if (!self.isPurelyVisual()) {
          return;
        }
        if (null != evt) {
          self.playEffectCommonButtonClick();
        }
        const collectCacedGoldConfirmationPanelNode = cc.instantiate(self.collectCachedGoldConfirmationPanelPrefab);
        collectCacedGoldConfirmationPanelNode.setPosition(cc.v2(0, 0));
        const collectCacedGoldConfirmationPanelIns = collectCacedGoldConfirmationPanelNode.getComponent("CollectCachedGoldConfirmationPanel");
        collectCacedGoldConfirmationPanelIns.init(self);
        collectCacedGoldConfirmationPanelIns.onCloseDelegate = () => {
          self.exitPanelView(collectCacedGoldConfirmationPanelIns);
        };
        collectCacedGoldConfirmationPanelIns.onConfirm = function() {
          cachedGoldIns.onSelfClicked = _originalOnSelfClicked;
          _originalOnSelfClicked.call(cachedGoldIns, evt);
        };
        collectCacedGoldConfirmationPanelIns.onVidAdBtnClicked = function(evt) {
          if (null != evt) {
            self.playEffectCommonButtonClick();
          }
          collectCacedGoldConfirmationPanelIns.vidAdBtn.interactable = false;
          self.watchVidAdToGainMoreGoldCount(function() {
            cachedGoldIns.setData(cachedGoldIns.goldCount * 2);
            collectCacedGoldConfirmationPanelIns.vidAdBtn.interactable = true;
            collectCacedGoldConfirmationPanelIns.onConfirm();
            collectCacedGoldConfirmationPanelIns.onCloseClicked();
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
              simplePressToGoDialogScriptIns.setHintLabel(i18n.t("VideoAd.Tip.gainGold"));
            }
            self.enterPanelView(simplePressToGoDialogScriptIns);
            collectCacedGoldConfirmationPanelIns.vidAdBtn.interactable = true;
          });
        }
        collectCacedGoldConfirmationPanelIns.vidAdBtn.node.active = self.vidAdsRewardEnabled;
        collectCacedGoldConfirmationPanelIns.setTitleLabel(i18n.t("Tip.housekeeperOfflineIncomeTitle"));
        collectCacedGoldConfirmationPanelIns.setHintLabel(cc.js.formatStr(i18n.t("Tip.housekeeperOfflineIncome"), cachedGoldIns.goldCount));
        collectCacedGoldConfirmationPanelIns.setGoldCount(cachedGoldIns.goldCount);
        self.enterPanelView(collectCacedGoldConfirmationPanelIns);
      };
      cachedGoldIns.onCollect = function(evt, cb) {
        self.playEffectCollectGold();
        self.housekeeperOfflineIncome = 0;
        self.widgetsAboveAllScriptIns.walletInfo.setData({
          gold: self.wallet.gold + cachedGoldIns.goldCount,
        });
        const goldAdditionTipScriptIns = self.showGoldAdditionTip(cachedGoldNode, cachedGoldIns.goldCount, -cachedGoldNode.height / 2 + 60);
        cachedGoldIns.useCoinAnimationNode();
        cachedGoldIns.playAnimationNodeFlyingAnimation(goldAdditionTipScriptIns.durationMillis, cb);
      };

      cachedGoldIns.couldBeAutoCollect = false;


      if (self.housekeeperOfflineIncome > goldCountToForceTip) {
        cachedGoldIns.onSelfClicked();
      }

      statefulBuildableInstanceComp.node.followingCachedGoldNode = cachedGoldNode;
    }
    // create offlineIncomeCachedGold. [end] }
  },

  sendGlobalBuildableLevelConfQuery(queryParam, callback, alwaysCallback) {
    const self = this;

    self.widgetsAboveAllScriptIns.initStateIndicatorNode.color = cc.Color.RED;
    NetworkUtils.ajax({
      url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + ':' + backendAddress.PORT + constants.ROUTE_PATH.API +
        constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.GLOBAL + constants.ROUTE_PATH.BUILDABLE_LEVEL_CONF + constants.ROUTE_PATH.QUERY,
      type: 'POST',
      data: queryParam,
      success: function(res) {
        if (constants.RET_CODE.OK != res.ret) {
          console.warn("sendGlobalBuildableLevelConfQuery fails and ret ==", res.ret);
          if (constants.RET_CODE.INVALID_TOKEN == res.ret) {
            window.handleTokenExpired(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
            return;
          }
          if (window.handleNetworkDisconnected) {
            window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
            return;
          }
          return;
        }

        // Initialization of IngredientList for player [begins]
        res.ingredientList.forEach(function(ingredient) {
          self.initIngredientItem(ingredient);
        })
        // Initialization of IngredientList for player [ends]

        //解析数据, resp = base64(encode(data)) [begins]
        const decodedBuildableLevelConf = window.pbDecodeData(window.buildableLevelConfStruct, res.buildableLevelConf);
        self.buildableIngredientInteractionList = decodedBuildableLevelConf.buildableIngredientInteractionList;
        self.AllStatelessBuildableInstances = self.transitBuildableLevelBindingConfToStatelessBuildbaleInstances(decodedBuildableLevelConf.levelConfList);
        self.refreshStatelessBuildableInstances(self.AllStatelessBuildableInstances, null);
        //解析数据 [ends]

        self.exchangeRateOfGoldToDiamond = null == res.exchangeRateOfGoldToDiamond ? 100 : res.exchangeRateOfGoldToDiamond;
        self.exchangeRateOfTimeToDiamond = null == res.exchangeRateOfTimeToDiamond ? 60 * 1000 : res.exchangeRateOfTimeToDiamond;

        // 开始从服务器获取数据
        let url = backendAddress.PROTOCOL + "://" + backendAddress.HOST + ":" + backendAddress.PORT + constants.ROUTE_PATH.API + constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.BUILDABLE_LIST + constants.ROUTE_PATH.QUERY;
        let data = {
          intAuthToken: JSON.parse(cc.sys.localStorage.getItem("selfPlayer")).intAuthToken,
          targetPlayerId: JSON.parse(cc.sys.localStorage.getItem("selfPlayer")).playerId,
          reqSeqNum: Date.now()
        };
        self.widgetsAboveAllScriptIns.initStateIndicatorNode.color = cc.Color.BLUE;

        NetworkUtils.ajax({
          url,
          data,
          type: 'POST',
          success: (resp) => {
            clearTimeout(self._timeroutTimer);
            self._timeroutTimer = null;
            if (constants.RET_CODE.OK != resp.ret) {
              console.warn("Query buildable list fails and ret ==", resp.ret);
              if (constants.RET_CODE.INVALID_TOKEN == res.ret) {
                window.handleTokenExpired(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
                return;
              }
              if (window.handleNetworkDisconnected) {
                window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
                return;
              }
              return;
            }
            self.widgetsAboveAllScriptIns.initStateIndicatorNode.color = cc.Color.GREEN;
            self.cachedPlayerBuildableQueryRespToHandle = resp;
          },
          error: function(err) {
            self.widgetsAboveAllScriptIns.initStateIndicatorNode.color = cc.Color.ORANGE;
            console.error("Query buildable list request is responded with error", err);
            if (window.handleNetworkDisconnected) {
              window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
            }
          },
          timeout: function() {
            self.widgetsAboveAllScriptIns.initStateIndicatorNode.color = cc.Color.ORANGE;
            console.warn("Query buildable list request is timed out.");
            if (window.handleNetworkDisconnected) {
              window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
            }
          }
        });

      },
      error: function(err) {
        self.widgetsAboveAllScriptIns.initStateIndicatorNode.color = cc.Color.ORANGE;
        console.error("Query buildable list request is responded with error", err);
      },
      timeout: function() {
        self.widgetsAboveAllScriptIns.initStateIndicatorNode.color = cc.Color.ORANGE;
        console.warn("Query buildable list request is timed out.");
      },
    });

  },

  getIngredientListForFreeAutoOrder(statefulBuildableInstance, specifiedState) {
    const self = this;
    let buildableId = statefulBuildableInstance.id, buildableLevel = statefulBuildableInstance.currentLevel;
    let interactionList = self.getStatefulBuildableIngredientInteractionList(
      statefulBuildableInstance,
      constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.FREEORDER
    );
    // TODO: 需排除未解锁的Ingredient。
    return interactionList.filter(function(interaction) {
      const ingredientId = interaction.ingredientId;
      if (interaction.buildableLevelToUnlockDisplayName > buildableLevel) {
        return false;
      }
      const targetPlayerIngredientForIdleGame = self.getPlayerIngredientForIdleGameByIngredientId(ingredientId);
      return null != targetPlayerIngredientForIdleGame && targetPlayerIngredientForIdleGame.state == specifiedState;
    }).map(function(interaction) {
      return self.getIngredientById(interaction.ingredientId);
    });
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
      self.closeBottomBannerAd();
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
    diffMap.keys = ["goldLimitAddition", "chairCountAddition", "baseGoldProductionRate", "baseFoodProductionRate"];
    cpn.render(statefulBuildableInstance.appearance[nextLevel], nextLevelConf, diffMap, unlockBuildables);
    let unlockIngredientList = [];
    unlockIngredientList = self.getUnlockIngredientIdsAfterBuildableUpgradeDone(
      statefulBuildableInstance.id,
      statefulBuildableInstance.currentLevel,
      statefulBuildableInstance.currentLevel + 1,
      true
    ).map(function(ingredientId) {
      return self.getIngredientById(ingredientId);
    });
    cpn.renderUnlockIngredientList(unlockIngredientList, true);
    // Show Tab upon ingredient. [begin] {
    const ingredientNodeList = cpn.unlockIngredientListNode.children;
    for (let i = 0, len = ingredientNodeList.length; i < len; i++) {
      const unlockedForFreeOrderIngredientCellIns = ingredientNodeList[i].getComponent('UnlockedForFreeOrderIngredientCell');
      if (null == unlockedForFreeOrderIngredientCellIns || null == unlockedForFreeOrderIngredientCellIns.ingredient) {
        continue;
      }
      let targetInteraction = self.filterBuildableIngredientInteractionByBuildableId(statefulBuildableInstance.id, constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.FREEORDER)
        .find(function(interaction) {
          return interaction.ingredientId == unlockedForFreeOrderIngredientCellIns.ingredient.id;
        });
      let requirePurchased = targetInteraction.ingredientPurchasePriceValue != 0;
      unlockedForFreeOrderIngredientCellIns.tabNode.active = requirePurchased;
    }
    // Show Tab upon ingredient. [end] }
    self.enterPanelView(cpn);
    self.openBottomBannerAd();
  },

  diffBetweenTwoLevelBinding(first, second, statefulBuildableInstance) {
    const self = this;
    const diff = BuildableMap.prototype.diffBetweenTwoLevelBinding.call(self, first, second);
    if (statefulBuildableInstance.id == constants.STATELESS_BUILDABLE_ID.MARKET) {
      let buildableGoldLimit = 0;
      for (let levelConfIndex in statefulBuildableInstance.levelConfs) {
        const levelConf = statefulBuildableInstance.levelConfs[levelConfIndex];
        if (levelConf.level <= statefulBuildableInstance.currentLevel) {
          buildableGoldLimit += levelConf.goldLimitAddition;
        }
      }
      diff.goldLimitAddition.oldValue = buildableGoldLimit;
      diff.goldLimitAddition.newValue = buildableGoldLimit + second.goldLimitAddition;
      diff.goldLimitAddition.diff = second.goldLimitAddition;
    } else if (statefulBuildableInstance.id != constants.STATELESS_BUILDABLE_ID.HEADQUARTER) {
      diff.goldLimitAddition.oldValue = first.goldLimitAddition;
      diff.goldLimitAddition.newValue = second.goldLimitAddition;
      diff.goldLimitAddition.diff = second.goldLimitAddition - first.goldLimitAddition;
    }
    if (null != constants.CHAIR_OFFSET_DATA) {
      diff["chairCountAddition"] = [
        constants.CHAIR_OFFSET_DATA.filter(function(chairData) {
          return chairData.buildableId == first.buildable.id &&
            chairData.buildableLevel == first.level;
        }).length,
        constants.CHAIR_OFFSET_DATA.filter(function(chairData) {
          return chairData.buildableId == first.buildable.id &&
            chairData.buildableLevel == second.level;
        }).length,
      ];
    }
    return diff;
  },
  
  getArchiveIngredientList() {
    const self = this;
    return self.buildableIngredientInteractionList.filter(function(interaction) {
      return interaction.type == constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.FREEORDER;
    }).map(function(interaction) {
      return self.getIngredientById(interaction.ingredientId);
    });
  },

  getArchiveIngredientListForStatefulBuildableInstance(statefulBuildableInstance) {
    const self = this;
    return self.buildableIngredientInteractionList.filter(function(interaction) {
      return interaction.type == constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.FREEORDER &&
        interaction.buildableId == statefulBuildableInstance.id;
    }).map(function(interaction) {
      return self.getIngredientById(interaction.ingredientId);
    });
  },

  onArchiveButtonClicked(evt) {
    const self = this;
    self.playEffectCommonButtonClick();
    self.toShowIdlePlayerArchivePanel = true; // This thread/routine is assigned low priority to use CPU/GPU and thus we delay the popup rendering to "self.update(dt)".
  },

  showIdlePlayerArchivePanel(isPreload) {
    const self = this;
    let panelName = "IdlePlayerArchivePanel";
    if (self.viewingPanelManager.hasPanel(panelName)) {
      cc.warn('Already existing a same panel:', panelName);
      return false;
    }
    let panelNode = self.idlePlayerArchivePanelNode,
        panelIns = self.idlePlayerArchivePanelIns;
    if (null != panelNode && isPreload) {
      return;
    }
    if (null == panelNode) {
      panelNode = cc.instantiate(self.idlePlayerArchivePanelPrefab);
      panelIns = panelNode.getComponent(panelName);
      self.idlePlayerArchivePanelNode = panelNode;
      self.idlePlayerArchivePanelIns = panelIns;
      panelIns.init(self);
      
      let ingredientList = self.getArchiveIngredientList(), statelessBuildableInstanceList = self.statelessBuildableInstanceList.slice();

      statelessBuildableInstanceList = statelessBuildableInstanceList.filter(function(statelessBuildableInstance) {
        return self.toIgnoreBuildableIds.indexOf(statelessBuildableInstance.id) == -1;
      })

      panelIns.setData(ingredientList, statelessBuildableInstanceList, [
        constants.STATELESS_BUILDABLE_ID.SNACK,
        constants.STATELESS_BUILDABLE_ID.BAKERY,
        constants.STATELESS_BUILDABLE_ID.CAFE,
      ]);
      panelIns.onCloseDelegate = function() {
        self.exitPanelView(panelIns);
      }
    }
    // optimization: this panel should refresh before added.
    panelIns.refresh();
    if (isPreload) {
      safelyAddChild(self.widgetsAboveAllNode, panelIns.node);
      panelIns.hide();
    } else {
      self.enterPanelView(panelIns);
    }
    return panelIns;
  },

  getBuildableAndLevelForUnlockingIngredient(ingredientId) {
    const self = this;
    let interactionList = self.filterBuildableIngredientInteractionByIngredientId(
      ingredientId,
      constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.FREEORDER
    );
    if (!interactionList.length) {
      return null;
    } else {
      let targetInteraction = interactionList[0];
      let targetBuildableId = targetInteraction.buildableId;
      let targetBulidableLevel = targetInteraction.buildableLevelToUnlockDisplayName;
      return {
        buildableId: targetBuildableId,
        statelessBuildableInstance: self.statelessBuildableInstanceList.find(function(statelessBuildableInstance) {
          return statelessBuildableInstance.id == targetBuildableId;
        }),
        level: targetBulidableLevel,
      };
    }
  },

  getBuildableAndLevelForUnlockingSoldier(ingredientId) {
    const self = this;
    let interactionList = self.filterBuildableIngredientInteractionByIngredientId(
      ingredientId,
      constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.PRODUCIBLE
    );
    if (!interactionList.length) {
      return null;
    } else {
      let targetInteraction = interactionList[0];
      let targetBuildableId = targetInteraction.buildableId;
      let targetBulidableLevel = targetInteraction.buildableLevelToUnlockDisplayName;
      return {
        buildableId: targetBuildableId,
        statelessBuildableInstance: self.statelessBuildableInstanceList.find(function(statelessBuildableInstance) {
          return statelessBuildableInstance.id == targetBuildableId;
        }),
        level: targetBulidableLevel,
      };
    }
  },

  showIngredientCellInfoPanel(ingredientCell) {
    const self = this;
    let panelName = 'IdleIngredientCellInfoPanel';
    if (self.viewingPanelManager.hasPanel(panelName)) {
      cc.warn('Already existing a same panel:', panelName);
      return;
    }
    let panelNode = self.ingredientCellInfoPanelNode,
        panelIns = self.ingredientCellInfoPanelIns;
    if (null == panelNode) {
      panelNode = self.ingredientCellInfoPanelNode = cc.instantiate(self.idleIngredientCellInfoPanelPrefab);
      panelIns = self.ingredientCellInfoPanelIns = panelNode.getComponent(panelName);
      panelIns.init(self);
    }

    // set panel's defaultActionsEnabled to false [begins].
    panelIns.defaultActionsEnabled = false;
    // set panel's defaultActionsEnabled to false [ends].

    panelIns.onCloseDelegate = () => {
      self.exitPanelView(panelIns);
      self.closeBottomBannerAd();
    };
    let targetInteractionList = self.filterBuildableIngredientInteractionByIngredientId(
      ingredientCell.ingredient.id,
      constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.FREEORDER
    );
    let acquiredAtBuildableList = targetInteractionList
      .map(function(interaction) {
        return self.statelessBuildableInstanceList.find(function(statelessBuildableInstance) {
          return statelessBuildableInstance.id == interaction.buildableId;
        });
      });
    panelIns.setData(ingredientCell.ingredient, acquiredAtBuildableList);
    panelIns.refresh();
    self.enterPanelView(panelIns);
    self.openBottomBannerAd();
    return panelIns;
  },
 

  showStatelessBuildableInstanceInfoPanel(statelessBuildableInstance, level) {
    const self = this;
    let panelName = "IdleStatelessBuildableInstanceInfoPanel";
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
        self.closeBottomBannerAd();
      }
    }
    panelIns.setData(statelessBuildableInstance, level);
    self.enterPanelView(panelIns);
    self.openBottomBannerAd();
    panelIns.refresh();
  },
  
  getUnlockIngredientIdsAfterBuildableUpgradeDone(buildableId, fromLevel, toLevel, producibleOnly=false) {
    const self = this;
    let targetInteractionList = self.filterBuildableIngredientInteractionByBuildableId(
      buildableId,
      constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.FREEORDER
    );
    let unlockIngredientIds = targetInteractionList.filter(function(interaction) {
      return interaction.buildableLevelToUnlockDisplayName > fromLevel && interaction.buildableLevelToUnlockDisplayName <= toLevel;
    }).map(function(interaction) {
      return interaction.ingredientId;
    });
    return unlockIngredientIds;
  },
  
  // Unlock Ingredient For IdleGame. [begin] {

  toUnlockeIngredientByPurchasing(ingredientId, callbackAnyway) {
    const self = this;
    // Warning: 若有多个建筑物可以解锁同一个ingredient，修改这里。
    const targetInteraction = self.filterBuildableIngredientInteractionByIngredientId(ingredientId)[0];
    const targetPlayerIngredientForIdleGame = self.getPlayerIngredientForIdleGameByIngredientId(ingredientId);
    // Warning: 若有ingredientPurchasePriceCurrency不为constants.RESOURCE_TYPE.GOLD存在时，修改这里。
    const ingredientPrice = targetInteraction.ingredientPurchasePriceValue;
    if (null == targetPlayerIngredientForIdleGame) {
      // 此配置下的ingredient不该处于LOCKED_INGREDIENT_PURCHASABLE_TO_UNLOCK
      return;
    }
    if (targetPlayerIngredientForIdleGame.state != constants.PLAYER_INGREDIENT_FOR_IDLEGAME.STATE.LOCKED_INGREDIENT_PURCHASABLE_TO_UNLOCK) {
      console.warn("Why would you call toUnlockeIngredientByPurchasing while the targetPlayerIngredientForIdleGame's state is:",  targetPlayerIngredientForIdleGame.state);
      return;
    }
    self.costGoldsToDo(ingredientPrice, function() {
      let index = self.toClaimPurchaseIngredientList.indexOf(targetPlayerIngredientForIdleGame.ingredientId);
      if (index == -1) { 
        // To prevent the duplicated data. 
        self.toClaimPurchaseIngredientList.push(targetPlayerIngredientForIdleGame.ingredientId);
        self.saveAllPlayerSyncData(null, callbackAnyway);
      }
    });
  },
  // Unlock Ingredient For IdleGame. [end] }

  // 显示微信底部广告。[begin] {
  onStatefulBuildableInstanceInfoButtonClicked(evt) {
    const self = this;
    const statefulInstanceInfoPanelScriptIns = BuildableMap.prototype.onStatefulBuildableInstanceInfoButtonClicked.apply(self, arguments);
    statefulInstanceInfoPanelScriptIns.onCloseDelegate = () => {
      self.exitPanelView(statefulInstanceInfoPanelScriptIns);
      self.closeBottomBannerAd();
    }
    self.openBottomBannerAd();
  },

  showUpgradeDependencyPanel() {
    const self = this;
    const upgradeDependencyPanelIns = BuildableMap.prototype.showUpgradeDependencyPanel.apply(self, arguments);
    const originalCloseDelegate = upgradeDependencyPanelIns.onCloseDelegate;
    upgradeDependencyPanelIns.onCloseDelegate = function() {
      originalCloseDelegate && originalCloseDelegate.apply(this, arguments);
      self.closeBottomBannerAd();
    }
    self.openBottomBannerAd();
  },

  showAnnoucementPanel() {
    const self = this;
    const panelIns = BuildableMap.prototype.showAnnoucementPanel.apply(self, arguments);
    const originalCloseDelegate = panelIns.onCloseDelegate;
    panelIns.onCloseDelegate = function() {
      originalCloseDelegate && originalCloseDelegate.apply(this, arguments);
      self.closeBottomBannerAd();
    }
    self.openBottomBannerAd();
  },

  // 显示微信底部广告。[end] }

  // handle newlyClaimedPurchaseIngredientList. [begin] {
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
        return;
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
          comboCulmulatedCount: self.comboCulmulatedCount,
          housekeeperBindingList: self.housekeeperBindingList,
          housekeeperOfflineIncome: self.housekeeperOfflineIncome,
        }),
        stage: 0,
        interruptTutorialMask: null == self.interruptTutorialMask ? "" : window.pbEncodeData(window.interruptTutorialMaskStruct, self.interruptTutorialMask),
        diamond: null == self.wallet.diamond ? 0 : self.wallet.diamond,
        toClaimIngredientProgressList: JSON.stringify(self.toReclaimIngredientProgressIdList),
        toClaimPlayerMissionBindingList: JSON.stringify(self.toClaimPlayerMissionBindingIdList),
        
        // THIS CODE IS ADDED FOR PURCHASE INGREDIENT. [begin]
        toClaimPurchaseIngredientList: JSON.stringify(self.toClaimPurchaseIngredientList),
        // THIS CODE IS ADDED FOR PURCHASE INGREDIENT. [end]
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

        if (null == self || null == self.node || !cc.isValid(self.node)) {
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
          self.getMissionList(function(res, shouldRefreshMissionList) {
            if (shouldRefreshMissionList) {
              self.refreshGlobalMissionGUI();
            }
          });
        }

        // THIS CODE IS ADDED FOR PURCHASE INGREDIENT. [begin] {
        // To handle newlyClaimedPurchaseIngredientList. [begin] {
        if (null != res.newlyClaimedPurchaseIngredientList && 0 < res.newlyClaimedPurchaseIngredientList.length) {
         self.refreshPlayerIngredientForIdleGameList(res.playerIngredientForIdleGameList);
         for (let i = 0, len = res.newlyClaimedPurchaseIngredientList.length; i < len; i++) {
           let ingredientId = res.newlyClaimedPurchaseIngredientList[i];
           let index = self.toClaimPurchaseIngredientList.indexOf(ingredientId);
           if (index != -1) {
             self.toClaimPurchaseIngredientList.splice(index, 1);
           }
         }
         
        }
        // To handle newlyClaimedPurchaseIngredientList. [end] }
        // THIS CODE IS ADDED PURCHASE INGREDIENT. [end] }

        if (res.reqSeqNum < self.latestSyncDataReqSeqNum) {
          console.warn("Ignoring an out of date upsync response.");
          return;
        } else {
          self.latestSyncDataReqSeqNum = res.reqSeqNum;
          // self.refreshKnapsackArray(res.knapsack);
          self.refreshPlayerRecipe(res.playerRecipeList);
          self.refreshPlayerIngredientForIdleGameList(res.playerIngredientForIdleGameList);

          if (null != res.announcement) {
            self.announcementData = JSON.parse(res.announcement);
            self.refreshAnnouncementButton();
          }
          // console.log("sendPlayerDataUpsync request at ", res.reqSeqNum, "responded at ", Date.now());
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
  // handle newlyClaimedPurchaseIngredientList. [end] }

  // playerIngredientForIdleGame. [begin] {
  initPlayerIngredientForIdleGameList(playerIngredientForIdleGameList) {
    const self = this;
    playerIngredientForIdleGameList = playerIngredientForIdleGameList || [];
    self.playerIngredientForIdleGameList = playerIngredientForIdleGameList;
    self.playerIngredientForIdleGameDict = {}; // ingredientId -> playerIngredientForIdleGame.
    for (let playerIngredientForIdleGame of self.playerIngredientForIdleGameList) {
      self.playerIngredientForIdleGameDict[playerIngredientForIdleGame.ingredientId] = playerIngredientForIdleGame;
    }
  },
  refreshPlayerIngredientForIdleGameList(playerIngredientForIdleGameList) {
    const self = this;
    let shouldUpdateGUI = false, shouldPlayCongratulationAnimationDict = {};
    /*
     * To determine if the gui should be refrehed.
     */
    playerIngredientForIdleGameList = playerIngredientForIdleGameList || [];

    if (
      null == playerIngredientForIdleGameList || null == self.playerIngredientForIdleGameList
      || playerIngredientForIdleGameList.length != self.playerIngredientForIdleGameList.length
    ) {
      shouldUpdateGUI = true;
    } else {
      for (let playerIngredientForIdleGame of playerIngredientForIdleGameList) {
        let oldPlayerIngredientForIdleGame = self.playerIngredientForIdleGameDict[playerIngredientForIdleGame.ingredientId];
        if (
          null == oldPlayerIngredientForIdleGame ||
          oldPlayerIngredientForIdleGame.ingredientId != playerIngredientForIdleGame.ingredientId ||
          oldPlayerIngredientForIdleGame.state != playerIngredientForIdleGame.state
        ) {
          if (playerIngredientForIdleGame.state == constants.PLAYER_INGREDIENT_FOR_IDLEGAME.STATE.UNLOCKED) {
            shouldPlayCongratulationAnimationDict[playerIngredientForIdleGame.ingredientId] = true;
          }
          shouldUpdateGUI = true;
        }
      }
    }
    
    
    if (!shouldUpdateGUI) {
      return;
    }

    self.playerIngredientForIdleGameList = playerIngredientForIdleGameList;
    self.playerIngredientForIdleGameDict = {}; // ingredientId -> playerIngredientForIdleGame.
    for (let playerIngredientForIdleGame of self.playerIngredientForIdleGameList) {
      self.playerIngredientForIdleGameDict[playerIngredientForIdleGame.ingredientId] = playerIngredientForIdleGame;
    }

    for (let i = 0, len = self.statefulBuildableInstanceCompList.length; i < len; i++) {
      const statefulBuildableInstanceComp = self.statefulBuildableInstanceCompList[i];
      const statefulInstanceInfoPanelNode = statefulBuildableInstanceComp.node.statefulInstanceInfoPanelNode;
      const statefulInstanceInfoPanelScriptIns = statefulInstanceInfoPanelNode.getComponent('IdleStatefulBuildableInstanceInfoPanel');
      if (statefulInstanceInfoPanelNode.active) {
        // renderIngredientListForFreeOrder will be called while statefulInstanceInfoPanelScriptIns.onEnable
        // thus preChecking if node is active to prevent duplicating render.
        statefulInstanceInfoPanelScriptIns.renderIngredientListForFreeOrder();
      }
    }
    if (null != self.idlePlayerArchivePanelNode) {
      self.idlePlayerArchivePanelIns.refresh();
    }
    if (null != self.ingredientCellInfoPanelNode) {
      self.ingredientCellInfoPanelIns.refresh();
      if (shouldPlayCongratulationAnimationDict[self.ingredientCellInfoPanelIns.data.id] === true) {
        self.playEffectCommonCongrat();
        self.ingredientCellInfoPanelIns.playCongratulationAnimation();
      }
    }
  },
  getPlayerIngredientForIdleGameByIngredientId(ingredientId) {
    const self = this;
    return self.playerIngredientForIdleGameDict[ingredientId];
  },
  // playerIngredientForIdleGame. [end] }

  onSingleFingerClick(evt, touchPosInCamera) {
    const self = this;
    if (self.isPurelyVisual() || self.isFloatingModalPopup() || self.isInCombo() || self.isInNarrativeScene()) {
      const mainCameraContinuousPos = self.mainCameraNode.position; // With respect to CanvasNode.
      const roughImmediateContinuousPosOfCameraOnMapNode = (mainCameraContinuousPos.add(cc.v2(touchPosInCamera.x, touchPosInCamera.y)));
      let isCachedGoldNodeClicked = false;
      for (let cachedGoldNode of self.cachedGoldNodeList) {
        let boundingBox = cachedGoldNode.getBoundingBox();
        if (boundingBox.contains(roughImmediateContinuousPosOfCameraOnMapNode)) {
          isCachedGoldNodeClicked = true;
          cachedGoldNode.getComponent('CachedGold').onSelfClicked(evt);
        }
      }
      if (isCachedGoldNodeClicked) {
        return;
      }
    }
    
    if (self.isInCombo()) {
      return;
    }
    BuildableMap.prototype.onSingleFingerClick.apply(self, arguments);
  },

  // 为建筑添加椅子. [begin] {
  renderPerStatefulBuildableInstanceNode(statefulBuildableInstance) {
    const self = this;
    const rs = BuildableMap.prototype.renderPerStatefulBuildableInstanceNode.apply(self, arguments);
    let chairRefreshed = false;
    if (null != statefulBuildableInstance.chairOffsetDict && null != self.chairPrefab) {
      if (null == statefulBuildableInstance.chairNodeDict) {
        statefulBuildableInstance.chairNodeDict = {};
      }
      for (let chairId in statefulBuildableInstance.chairOffsetDict) {
        let chairData = statefulBuildableInstance.chairOffsetDict[chairId];
        let chairNode = statefulBuildableInstance.chairNodeDict[chairId];
        if (null == statefulBuildableInstance.chairNodeDict[chairId]) {
          chairNode = statefulBuildableInstance.chairNodeDict[chairId] = cc.instantiate(self.chairPrefab);
          chairRefreshed = true;
        }
        if (null != chairNode.parent) {
          chairNode.removeFromParent();
        }
        const currentPosition = chairNode.position;
        const chairPosition = statefulBuildableInstance.node.position.add(cc.v2(chairData.offsetX, chairData.offsetY));
        if (!currentPosition.equals(chairPosition)) {
          chairRefreshed = true;
        }
        chairNode.setPosition(chairPosition);
        setLocalZOrder(chairNode, window.CORE_LAYER_Z_INDEX.STATEFUL_BUILDABLE_INSTANCE_CHAIR);
        const ShelterChainColliderNode = chairNode.getChildByName('ShelterChainColliderForChair');
        ShelterChainColliderNode.theChairNode = chairNode;
        ShelterChainColliderNode.boundStatefulBuildable = statefulBuildableInstance.node;
        chairNode.origZIndex = window.CORE_LAYER_Z_INDEX.STATEFUL_BUILDABLE_INSTANCE_CHAIR;
        window.addToGlobalShelterChainVerticeMap(chairNode);
        safelyAddChild(self.node, chairNode);
      }
      let toDeleteChairId = [];
      for (let chairId in statefulBuildableInstance.chairNodeDict) {
        const chairNode = statefulBuildableInstance.chairNodeDict[chairId];
        if (null == statefulBuildableInstance.chairOffsetDict[chairId]) {
          chairNode.removeFromParent();
          toDeleteChairId.push(chairId);
          chairRefreshed = true;
        }
      }
      for (let chairId of toDeleteChairId) {
        delete statefulBuildableInstance.chairNodeDict[chairId];
      }
      for (let chairId in statefulBuildableInstance.chairNodeDict) {
        const chairNode = statefulBuildableInstance.chairNodeDict[chairId];
        if (statefulBuildableInstance.isBuilding() || statefulBuildableInstance.isUpgrading()) {
          chairNode.active = false;
          continue;
        }
        chairNode.active = true;
        for (let node of chairNode.children) {
          if (node.name.indexOf('lv') != 0) {
            continue;
          }
          if (node.name == cc.js.formatStr('lv%s', statefulBuildableInstance.currentLevel)) {
            node.active = true;
          } else {
            node.active = false;
          }
        }
      }
    } else {
      chairRefreshed = true;
    }
    self.refreshCookingAnimationForStatefulBuildableInstance(statefulBuildableInstance, true);

    // Abort the orderingNpc. [begin]
    if (chairRefreshed && null != statefulBuildableInstance.boundOrderingNpcDict) {
      for (let k in statefulBuildableInstance.boundOrderingNpcDict) {
        const boundOrderingNpc = statefulBuildableInstance.boundOrderingNpcDict[k];
        self.evicAnOrderingNpc(boundOrderingNpc);
      }
    }
    // Abort the orderingNpc. [end]

    if (null != statefulBuildableInstance.node.followingCachedGoldNode) {
      statefulBuildableInstance.node.followingCachedGoldNode.setPosition(
        statefulBuildableInstance.node.position.add(
          constants.HOUSEKEEPER.CACHED_GOLD_OFFSET_TO_BUILDBALE_SPRITE_CENTER
        )
      );
    }

    return rs;
  },

  removeStatefulBuildable(statefulBuildableInstance) {
    const self = this;
    const rs = BuildableMap.prototype.removeStatefulBuildable.apply(self, arguments);
    if (null != statefulBuildableInstance.chairNodeDict) {
      for (let chairId in statefulBuildableInstance.chairNodeDict) {
        statefulBuildableInstance.chairNodeDict[chairId].removeFromParent();
        window.removeFromGlobalShelterChainVerticeMap(statefulBuildableInstance.chairNodeDict[chairId]);
      }
    }
    if (null != statefulBuildableInstance.node.cookingAnimationNode) {
      clearTimeout(statefulBuildableInstance.node.cookingAnimationNode.delayDisappearTimmer);
      statefulBuildableInstance.node.cookingAnimationNode.destroy();
      statefulBuildableInstance.node.cookingAnimationNode = null;
    }
    return rs;
  },
  // 为建筑添加椅子. [end] }

  refreshStatelessBuildableInstanceCardListDisplay() {
    const self = this;
    BuildableMap.prototype.refreshStatelessBuildableInstanceCardListDisplay.call(self, self.toIgnoreBuildableIds.concat([
      constants.STATELESS_BUILDABLE_ID.MARKET,
    ]));
  },
  spawnOrRefreshStatefulBuildableFollowingNpcs() {
    // No followingNpc in idleGameMap, thus do nothing. --guoyl6
  },

  refreshCookingAnimationForStatefulBuildableInstance(statefulBuildableInstance, shouldNotDelay) {
    const self = this;
    const InfinityX = -99999;
    let isCooking = false;
    let cookingAnimationNode = statefulBuildableInstance.node.cookingAnimationNode;
    if (null == cookingAnimationNode) {
      cookingAnimationNode = statefulBuildableInstance.node.cookingAnimationNode = cc.instantiate(self.cookingAnimationPrefab);
      safelyAddChild(self.node, cookingAnimationNode);
      cookingAnimationNode.x = InfinityX;
    }
    if (!cookingAnimationNode.active) {
      if (null != cookingAnimationNode.delayDisappearTimmer) {
        clearTimeout(cookingAnimationNode.delayDisappearTimmer);
        cookingAnimationNode.delayDisappearTimmer = null;
      }
      return;
    }
    if (null != statefulBuildableInstance.boundOrderingNpcDict) {
      for (let uuid in statefulBuildableInstance.boundOrderingNpcDict) {
        const orderingNpc = statefulBuildableInstance.boundOrderingNpcDict[uuid];
        if (null != orderingNpc.boundAutoOrder && orderingNpc.boundAutoOrder.state == constants.FREE_AUTO_ORDER_STATE.TAKEN_TRADING) {
          isCooking = true;
          break;
        }
      }
    }
    if (isCooking) {
      cookingAnimationNode.position = statefulBuildableInstance.node.position.add(
        // cc.v2(statefulBuildableInstance.calculateOffsetXToBuildableCenter(), statefulBuildableInstance.calculateOffsetYToBuildableCenterTop())
        cc.v2(0, 30) // hardcoded temporarily, 新手教程使用到了。
      );
      setLocalZOrder(cookingAnimationNode, getLocalZOrder(statefulBuildableInstance.node) + 1);
      if (null != cookingAnimationNode.delayDisappearTimmer) {
        clearTimeout(cookingAnimationNode.delayDisappearTimmer);
        cookingAnimationNode.delayDisappearTimmer = null;
      }
    } else {
      if (shouldNotDelay) {
        cookingAnimationNode.x = InfinityX;
        if (null != cookingAnimationNode.delayDisappearTimmer) {
          clearTimeout(cookingAnimationNode.delayDisappearTimmer);
          cookingAnimationNode.delayDisappearTimmer = null;
        }
      } else {
        if (null == cookingAnimationNode.delayDisappearTimmer && cookingAnimationNode.x != InfinityX) {
          cookingAnimationNode.delayDisappearTimmer = setTimeout(function() {
            if (null == cookingAnimationNode) {
              return;
            }
            cookingAnimationNode.x = InfinityX;
            cookingAnimationNode.delayDisappearTimmer = null;
          }, 1000);
        }
      }
    }
  },

  onComboButtonClicked(evt) {
    const self = this;
    self.playEffectCommonButtonClick();
    const price = 5; // Hardcode temporarily -- YFLu, 2019-11-16.
    const comboGoalPanelNode = cc.instantiate(self.comboGoalPanelPrefab);
    const comboGoalPanelIns = comboGoalPanelNode.getComponent('ComboGoalPanel');
    // In order to show bottomBannerAd, temporarily set the y as 40.
    comboGoalPanelNode.setPosition(cc.v2(0, 40));
    comboGoalPanelIns.init(self);
    comboGoalPanelIns.setHintLabel(cc.js.formatStr(i18n.t('ComboGoalPanel.Tip.rule')));
    comboGoalPanelIns.setData(price, constants.RESOURCE_TYPE.DIAMOND);
    comboGoalPanelIns.onCloseDelegate = function() {
      self.exitPanelView(comboGoalPanelIns);
      self.closeBottomBannerAd();
    };
    comboGoalPanelIns.onConfirm = function() {
      self.costDiamondsToDo(price, function() {
        self.startComboTimer();
      });
    };
    comboGoalPanelIns.onVidAdBtnClicked = function(evt) {
      if (null != evt) {
        self.playEffectCommonButtonClick();
      }
      self.watchVidAdToStartCombo(function() {
        comboGoalPanelIns.onCloseClicked(null);
        self.startComboTimer();
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
          simplePressToGoDialogScriptIns.setHintLabel(i18n.t("VideoAd.Tip.startCombo"));
        }
        self.enterPanelView(simplePressToGoDialogScriptIns);
      });
    };
    comboGoalPanelIns.confirmBtn.node.active = true;
    comboGoalPanelIns.vidAdBtn.node.active = self.vidAdsRewardEnabled;
    self.enterPanelView(comboGoalPanelIns);
    self.openBottomBannerAd();
  },

  startComboTimer() {
    const self = this;
    const timer = self.widgetsAboveAllScriptIns.elapsedTimer;
    const comboDurationMillis = constants.DURATION_MILLIS.COMBO;

    self.addInCombo();
    self.setSideButtonGroupActive(false);
    
    self.comboCachedMap = {
      cachedGoldNodeList: [],
      culmulatedGoldCount: 0,
      maxCulmulatedCount: 0,
      previousMaxCulmulatedCount: self.comboCulmulatedCount,
      reward: {
        gold: 0,
        diamond: 0,
      },
    };

    // disable buildableAnimation. [ebgin]
    for (let statefulBuildableInstanceComp of self.statefulBuildableInstanceCompList) {
      if (statefulBuildableInstanceComp.isBuilding() || statefulBuildableInstanceComp.isUpgrading()) {
        continue;
      }
      const skeletalAnimationTargetIns = statefulBuildableInstanceComp.getPlayingSkeletalAnimationIns();
      if (null == skeletalAnimationTargetIns) {
        continue;
      }
      if (skeletalAnimationTargetIns instanceof dragonBones.ArmatureDisplay) {
        skeletalAnimationTargetIns._playing = false;
      } else if (skeletalAnimationTargetIns instanceof sp.Skeleton) {
        skeletalAnimationTargetIns.paused = true;
      }
    }
    // disable buildableAnimation. [end]

    // disable cookingAnimation. [begin]
    for (let statefulBuildableInstanceComp of self.statefulBuildableInstanceCompList) {
      const cookingAnimationNode = statefulBuildableInstanceComp.node.cookingAnimationNode;
      if (null == cookingAnimationNode) {
        continue;
      }
      cookingAnimationNode.active = false;
    }
    // disable cookingAnimation. [end]

    // evic all existed orderingNpc. [begin]
    for (let uuid in self.statefulBuildableOrderingNpcScriptInsDict) {
      let statefulBuildableOrderingNpcIns = self.statefulBuildableOrderingNpcScriptInsDict[uuid];
      self.evicAnOrderingNpc(statefulBuildableOrderingNpcIns);
    }
    // evic all existed orderingNpc. [end]

    // collect all uncollected cachedGoldNode. [begin]
    for (let cachedGoldNode of self.cachedGoldNodeList) {
      let cachedGoldIns = cachedGoldNode.getComponent('CachedGold');
      if (cachedGoldIns.couldBeAutoCollect) {
        cachedGoldIns.onSelfClicked();
      }
    }
    // collect all uncollected cachedGoldNode. [end]

    // disable click of housekeeperNpc. [begin]
    for (let buildableId in self.housekeeperNpcDict) {
      let housekeeperNpc = self.housekeeperNpcDict[buildableId];
      housekeeperNpc.disableClick();
      housekeeperNpc.transitToStaying();
    }
    // disable click of housekeeperNpc. [end]
    if (null != self.comboBgmAudioClip) {
      self.changeBgm(self.comboBgmAudioClip);
    }

    const fullscreenTimerNode = cc.instantiate(self.fullscreenTimerPrefab);
    const fullscreenTimerIns = fullscreenTimerNode.getComponent('FullscreenTimer');
    fullscreenTimerIns.setData(3);
    safelyAddChild(self.widgetsAboveAllNode, fullscreenTimerNode);
    fullscreenTimerIns.playAnimation(function() {
      fullscreenTimerNode.removeFromParent();
      self.comboStartTimeMillis = Date.now();
      let comboCompleted = false;
      timer.setData(null, comboDurationMillis, self.comboStartTimeMillis);
      timer.update = function() {
        ProgressNum.prototype.update.apply(this, arguments);
        if (!comboCompleted && Date.now() - self.comboStartTimeMillis >= comboDurationMillis) {
          comboCompleted = true;
          self.onComboCompleted();
        }
      }
      // tensionForRemainingMillis tip [begin]. {
      const tensionForRemainingMillis = 10000;
      timer.formulateIndicatorLabelStr = function() {
        if (timer.isForElapsedTimeProgress) {
          const elapsedMillis = this.targetQuantity;
          const durationMillis = this.maxValue;
          let remainingMillis = (durationMillis - elapsedMillis);
          if (remainingMillis <= tensionForRemainingMillis) {
            timer.indicatorLabel.node.color = Math.floor(remainingMillis / 1000) % 2 != 0 ? cc.color('#DE5244') : cc.Color.WHITE;
          } else {
            timer.indicatorLabel.node.color = cc.Color.WHITE;
          }
        }
        return ProgressNum.prototype.formulateIndicatorLabelStr.apply(this, arguments);
      }
      // tensionForRemainingMillis tip [end]. }
      timer.node.active = true;
    });
  },

  onComboCompleted() {
    const self = this;
    self.removeInCombo();

    if (null != self.activeBgmAudioClip) {
      self.changeBgm(self.activeBgmAudioClip);
    } else {
      cc.audioEngine.stopMusic();
    }

    // enable buildableAnimation. [ebgin]
    for (let statefulBuildableInstanceComp of self.statefulBuildableInstanceCompList) {
      if (statefulBuildableInstanceComp.isBuilding() || statefulBuildableInstanceComp.isUpgrading()) {
        continue;
      }
      const skeletalAnimationTargetIns = statefulBuildableInstanceComp.getPlayingSkeletalAnimationIns();
      if (null == skeletalAnimationTargetIns) {
        continue;
      }
      if (skeletalAnimationTargetIns instanceof dragonBones.ArmatureDisplay) {
        skeletalAnimationTargetIns._playing = true;
      } else if (skeletalAnimationTargetIns instanceof sp.Skeleton) {
        skeletalAnimationTargetIns.paused = false;
      }
    }
    // enable buildableAnimation. [end]

    // evic all existed orderingNpc. [begin]
    for (let uuid in self.statefulBuildableOrderingNpcScriptInsDict) {
      let statefulBuildableOrderingNpcIns = self.statefulBuildableOrderingNpcScriptInsDict[uuid];
      self.evicAnOrderingNpc(statefulBuildableOrderingNpcIns);
    }
    // evic all existed orderingNpc. [end]

    // enable cookingAnimation. [begin]
    for (let statefulBuildableInstanceComp of self.statefulBuildableInstanceCompList) {
      const cookingAnimationNode = statefulBuildableInstanceComp.node.cookingAnimationNode;
      if (null == cookingAnimationNode) {
        continue;
      }
      cookingAnimationNode.active = true;
    }
    // enable cookingAnimation. [end] 

    // collect all uncollected cachedGoldNode. [begin]
    for (let cachedGoldNode of self.cachedGoldNodeList) {
      let cachedGoldIns = cachedGoldNode.getComponent('CachedGold');
      if (cachedGoldIns.couldBeAutoCollect) {
        cachedGoldIns.onSelfClicked();
      }
    }
    // collect all uncollected cachedGoldNode. [end]

    // enable click of housekeeperNpc. [begin]
    for (let buildableId in self.housekeeperNpcDict) {
      let housekeeperNpc = self.housekeeperNpcDict[buildableId];
      housekeeperNpc.enableClick();
      housekeeperNpc.transitToStaying();
      housekeeperNpc.resume();
    }
    // enable click of housekeeperNpc. [end]


    self.comboStartTimeMillis = null;
    if (null != self.comboIndicatorScriptIns) {
      self.comboIndicatorScriptIns.finish();
    }
    self.widgetsAboveAllScriptIns.elapsedTimer.node.active = false;
    self.showComboScorePanel(self.comboCachedMap);
    // 进行一些Combo必要的汇报. [begin]
    self.comboCulmulatedCount = Math.max(self.comboCulmulatedCount, self.comboCachedMap.maxCulmulatedCount);
    self.widgetsAboveAllScriptIns.walletInfo.setData({
      gold: self.wallet.gold + self.comboCachedMap.reward.gold,
      diamond: self.wallet.diamond + self.comboCachedMap.reward.diamond,
    });
    self.saveAllPlayerSyncData();
    // 进行一些Combo必要的汇报. [end]
    self.comboCachedMap = null;
  },

  showComboScorePanel(comboCachedMap) {
    const self = this;
    const comboScorePanelNode = cc.instantiate(self.comboScorePanelPrefab);
    const comboScorePanelIns = comboScorePanelNode.getComponent('ComboScorePanel');
    comboScorePanelIns.init(self);
    comboScorePanelIns.onCloseDelegate = function() {
      self.exitPanelView(comboScorePanelIns);
    }
    comboScorePanelIns.setData(comboCachedMap);
    self.enterPanelView(comboScorePanelIns);
  },

  saveIntoLocalStorage() {
    BuildableMap.prototype.saveIntoLocalStorage.apply(this, arguments);
    cc.sys.localStorage.setItem('comboCulmulatedCount', this.comboCulmulatedCount);
    cc.sys.localStorage.setItem('housekeeperBindingList', JSON.stringify(this.housekeeperBindingList));
    cc.sys.localStorage.setItem('housekeeperOfflineIncome', this.housekeeperOfflineIncome);
  },

  evicAnOrderingNpc(statefulBuildableOrderingNpcIns) {
    switch(statefulBuildableOrderingNpcIns.state) {
    case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.ORDERING_AT_DESTINATION_AFTER_MOVING_IN:
    case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.ORDER_TAKEN_TRADING_AT_DESTINATION_AFTER_MOVING_IN:
    case window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.ORDER_DELIVERED_AT_DESTINATION_AFTER_MOVING_IN:
      statefulBuildableOrderingNpcIns.onOrderAbort && statefulBuildableOrderingNpcIns.onOrderAbort();
      break;
    default:
      if (statefulBuildableOrderingNpcIns.state != window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.MOVING_OUT) {
        statefulBuildableOrderingNpcIns.targetChair = null;
        statefulBuildableOrderingNpcIns.state = window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.MOVING_OUT;
        statefulBuildableOrderingNpcIns.refreshCurrentDestination();
        statefulBuildableOrderingNpcIns.refreshContinuousStopsFromCurrentPositionToCurrentDestination();
        statefulBuildableOrderingNpcIns.restartFollowing();
      }
      break;
    }
  },

  onMapOverMoved() {
    const self = this;
    // 效果不好，暂不启用
    return;
    if (null == self._shakingTween) {
      let _onChanging = function(start, end, current, ratio) {
        self.backgroundMap.node.x = current;
        return start + (end - start) * ratio;
      }
      self.shakingTween = cc.tween(self.node).
        repeat(2,
          cc.tween().to(0.03, {
            x: {
              value: -5,
              progress: _onChanging,
            }
          }).to(0.06, {
            x: {
              value: 5,
              progress: _onChanging,
            }
          })
        ).call(function() {
          self.shakingTween = null;
        });
      self.shakingTween.start();
    }
  },

  onBarrackPanelTriggerClicked(evt) {
    const self = this;
    self.playEffectCommonButtonClick();
    let panelName = "BarrackPanel";
    if (self.viewingPanelManager.hasPanel(panelName)) {
      cc.warn('Already existing a same panel:', panelName);
      return false;
    }
    const barrackPanelNode = self.barrackPanelNode || cc.instantiate(self.barrackPanelPrefab);
    const statefulBuildableInstance = self.statefulBuildableInstanceCompList.find(x => {
      return x.id == constants.STATELESS_BUILDABLE_ID.HEADQUARTER
    });
    self.barrackPanelNode = barrackPanelNode;
    self.refreshStatefulBuildableController();
    const barrackPanelIns = barrackPanelNode.getComponent(panelName);
    self.barrackPanelIns = barrackPanelIns;
    barrackPanelIns.onCloseDelegate = () => {
      let ingredientProgressList = barrackPanelIns.ingredientProgressList.data;
      self.refreshIngredientProgressListEntry(statefulBuildableInstance, ingredientProgressList);
      let statefulBuildableIngredientProgressListEntryIns = statefulBuildableInstance.statefulBuildableIngredientProgressListEntryIns;
      if (null != statefulBuildableIngredientProgressListEntryIns) {
        statefulBuildableIngredientProgressListEntryIns.autoRefreshEnabled = true;
      }
      self.exitPanelView(barrackPanelIns);
    };
    barrackPanelIns.closeSelfOnBlur = true;
     // set panel's defaultActionsEnabled to false [begins].
    barrackPanelIns.defaultActionsEnabled = false;
    // set panel's defaultActionsEnabled to false [ends].
    barrackPanelIns.fixed = false;
    barrackPanelIns.init(self, statefulBuildableInstance);
    barrackPanelIns.queryIngredientList();
    barrackPanelIns.resizeNode();
    let soldierProducibleIngredientList = self.getProducibleSoldierIngredientList();
    barrackPanelIns.setData(soldierProducibleIngredientList, []);
    self.enterPanelView(barrackPanelIns);
    barrackPanelIns.refresh();
    barrackPanelIns.onRefresh = function(ingredientList, ingredientProgressList) {
      self.refreshIngredientProgressListEntry(statefulBuildableInstance, ingredientProgressList);
      let statefulBuildableIngredientProgressListEntryIns = statefulBuildableInstance.statefulBuildableIngredientProgressListEntryIns;
      if (null != statefulBuildableIngredientProgressListEntryIns) {
        statefulBuildableIngredientProgressListEntryIns.autoRefreshEnabled = false;
        statefulBuildableIngredientProgressListEntryIns.hide();
      }
    };
  },

  getProducibleSoldierIngredientList() {
    const self = this;
    let soldierProducibleIngredientList = [];
    for (let interaction of self.buildableIngredientInteractionList) {
      if (interaction.type == constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.PRODUCIBLE) {
        let ingredient = self.getIngredientById(interaction.ingredientId);
        if (ingredient.category == constants.INGREDIENT.CATEGORY.SOLDIER) {
          soldierProducibleIngredientList.push(ingredient);
        }
      }
    }
    return soldierProducibleIngredientList;
  },

  getProducibleIngredientList() {
    const self = this;
    return BuildableMap.prototype.getProducibleIngredientList.apply(self, arguments).filter(function(ingredient) {
      return ingredient.category != constants.INGREDIENT.CATEGORY.SOLDIER;
    });
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

  onHeadquarterIngredientProgressListEntryClicked(statefulBuildableInstance, statefulBuildableIngredientProgressListEntryIns) {
    const self = this;
    self.onStatefulBuildableInstanceClicked(statefulBuildableInstance.node, statefulBuildableInstance);
    self.onBarrackPanelTriggerClicked(null);
  },

  isSoldierUnlocked(ingredientId) {
    const self = this;
    const targetRecipe = self.getHqPlayerRecipeByIngredientId(ingredientId);
    return targetRecipe != null && targetRecipe.state == constants.RECIPE.STATE.UNLOCKED;
  },

  refreshRecipeArray() {
    const self = this;
    BuildableMap.prototype.refreshRecipeArray.apply(self, arguments);
    if (null != self.barrackPanelIns) {
      self.barrackPanelIns.refreshIngredientLockedState();
    }
  },

  calculateResidentLimit() {
    const self = this;
    let residentLimit = 0;
    for (let statefulBuildableInstanceComp of self.statefulBuildableInstanceCompList) {
      if (statefulBuildableInstanceComp.isBuilding()) {
        continue;
      }
      residentLimit += statefulBuildableInstanceComp.currentLevelConf.baseFoodProductionRate;
    }
    return residentLimit;
  },

  calculateMaximunResidentLimit() {
    const self = this;
    let residentLimitSum = 0;
    for (let statelessBuildableInstance of self.statelessBuildableInstanceList) {
      if (self.toIgnoreBuildableIds.indexOf(statelessBuildableInstance.id) != -1) {
        continue;
      }
      let levelConfs = statelessBuildableInstance.levelConfs;
      let maxLevelConf = levelConfs[0];
      if (null == maxLevelConf) {
        console.log('No levelConfs is found, buildableId is', statelessBuildableInstance.id);
        continue;
      }
      for (let singleLevelConf of levelConfs) {
        if (maxLevelConf.level >= singleLevelConf.level) {
          continue;
        }
        maxLevelConf = singleLevelConf;
      }
      if (0 >= maxLevelConf.dependency.length) {
        console.warn('You may forget to configured a dependency for buildable', statelessBuildableInstance.id, ', level is', maxLevelConf.level);
        continue;
      }
      residentLimitSum += maxLevelConf.baseFoodProductionRate * maxLevelConf.dependency[0].targetBuildableMaxCount
    }
    return residentLimitSum;
  },

  onProduceIngredientFailed(res, {produceWithIngredientProgressListPanelIns}) {
    const self = this;
    produceWithIngredientProgressListPanelIns.ajaxProgressList.setState(window.AJAX_STATE.FAILED);
    if (null != res && self.barrackPanelIns == produceWithIngredientProgressListPanelIns) {
      const barrackPanelIns = produceWithIngredientProgressListPanelIns;
      switch (res.ret) {
      case constants.RET_CODE.POPULATION_LIMIT_EXCEEDED:
        barrackPanelIns.showTip(i18n.t("BarrackPanel.Tip.residentReachLimat"));
        break;
      case constants.RET_CODE.INGREDIENT_PROGRESS_MAX_PER_PLAYER_BUILDABLE_BINDING_EXCEEDED:
        barrackPanelIns.showTip(i18n.t("ProduceWithIngredientProgressListPanel.Tip.reachMaxQueueLength"));
        break;
      }
    } else {
      if (null == res) {
        // TODO: some error occurs.
      } else {
        BuildableMap.prototype.onProduceIngredientFailed.apply(self, arguments);
      }
    }
  },
  // housekeeper field. [begin] {
  spawnHousekeeperNpcIfNotExists(housekeeperBinding) {
    const self = this;
    const buildableId = housekeeperBinding.buildableId;
    if (null != self.housekeeperNpcDict[buildableId]) {
      return self.housekeeperNpcDict[buildableId];
    }
    const followingNpcOffsetScaleRatio = 1;
    const statefulBuildableInstanceComp = self.getStatefulBuildableInstanceListByBuildableId(buildableId)[0];
    if (null == statefulBuildableInstanceComp) {
      // The buildableType is not exists.
      return null;
    }
    const housekeeperConfigured = constants.HOUSEKEEPER["BUILDABLEID_" + buildableId];
    const npcNode = cc.instantiate(self.housekeeperNpcPrefab);
    const npcScriptIns = npcNode.getComponent("HousekeeperNpc");
    let speciesName = housekeeperConfigured.NAME;
    npcScriptIns.speciesName = constants.NPC_ANIM.NAME[speciesName];
    if (null == statefulBuildableInstanceComp.boundFollowingNpcDict) {
      statefulBuildableInstanceComp.boundFollowingNpcDict = {};
    }
    statefulBuildableInstanceComp.boundFollowingNpcDict[npcNode.uuid] = npcScriptIns;
    self.statefulBuildableFollowingNpcScriptInsDict[npcNode.uuid] = npcScriptIns;
    npcScriptIns.mapNode = self.node;
    npcScriptIns.mapIns = self;
    npcScriptIns.boundStatefulBuildable = statefulBuildableInstanceComp;
    npcScriptIns.speed = constants.SPEED.HOUSEKEEPER_NPC;
    npcScriptIns.servingBuildableId = buildableId;
    npcScriptIns.housekeeperBinding = housekeeperBinding;

    npcScriptIns.onUnlocking = npcScriptIns.onShowingTip = function() {
      if (!self.isPurelyVisual()) {
        return;
      }
      self.showHousekeeperCellInfoPanel(buildableId, housekeeperBinding);
    }

    let closeWise = window.ALL_DISCRETE_DIRECTIONS_CLOCKWISE[4];
    let discreteX = closeWise.dx ? closeWise.dx/Math.abs(closeWise.dx) : closeWise.dx;
    let discreteY = closeWise.dy ? closeWise.dy/Math.abs(closeWise.dy) : closeWise.dy;
    npcScriptIns.specifiedOffsetFromSpriteCentre = cc.v2(
      self.tiledMapIns.getTileSize().width*followingNpcOffsetScaleRatio*discreteX,
      self.tiledMapIns.getTileSize().height*followingNpcOffsetScaleRatio*discreteY
    );

    npcScriptIns.refreshGrandSrcAndCurrentDestination();
    npcNode.position = npcScriptIns.currentDestination;
    npcScriptIns.scheduleNewDirection(closeWise); 
    npcScriptIns.lastPeriodStartedAt = housekeeperBinding.lastPeriodStartedAt;

    safelyAddChild(self.node, npcNode);
    setLocalZOrder(npcNode, window.CORE_LAYER_Z_INDEX.PLAYER);
    self.housekeeperNpcDict[buildableId] = npcScriptIns;
  },

  findAnOrderingNpcToServe(housekeeperNpc) {
    const self = this;
    const buildableId = housekeeperNpc.servingBuildableId;
    for (let uuid in self.freeAutoOrderDict) {
      let freeAutoOrder = self.freeAutoOrderDict[uuid];
      const statefulBuildableInstanceComp = freeAutoOrder.targetStatefulBuildableOrderingNpc.boundStatefulBuildable;
      if (statefulBuildableInstanceComp.id != buildableId) {
        continue;
      }
      switch (freeAutoOrder.state) {
      case constants.FREE_AUTO_ORDER_STATE.NOT_TAKEN:
        return freeAutoOrder.targetStatefulBuildableOrderingNpc;
      }
    }
    return null;
  },

  // housekeeper field. [end] }

  /*
   * Snack/Bakery/Cafe is set up at TopRight(before is center), thus their polygonBoundaryShelter should update too.
   *      -- guoyl6, 2019/11/13 17:41
   */
  refreshOrCreateShelterAndDefenderForStatefulBuildableInstance(statefulBuildableInstance) {
    const self = this;
    BuildableMap.prototype.refreshOrCreateShelterAndDefenderForStatefulBuildableInstance.apply(self, arguments);
    const headShelterNode = statefulBuildableInstance.node.headShelterNode;
    const tailShelterNode = statefulBuildableInstance.node.tailShelterNode;
    const halfBarrierAnchorToBoundingBoxCentre = cc.v2(statefulBuildableInstance.boundingBoxContinuousWidth, statefulBuildableInstance.boundingBoxContinuousHeight).mul(0.5);
    switch (statefulBuildableInstance.id) {
    case constants.STATELESS_BUILDABLE_ID.SNACK:
    case constants.STATELESS_BUILDABLE_ID.CAFE:
    case constants.STATELESS_BUILDABLE_ID.BAKERY:
      tailShelterNode.setPosition(
       statefulBuildableInstance.fixedSpriteCentreContinuousPos.add(cc.v2(0, halfBarrierAnchorToBoundingBoxCentre.y))
      );
      headShelterNode.setPosition(
       statefulBuildableInstance.fixedSpriteCentreContinuousPos.add(cc.v2(0, 0))
      );
      break;
    default:
      break;
    }
  },

  getCraftableKnapsackArray() {
    return this.soldierArray;
  },

  watchVidAdToStartCombo(successCb, failCb) {
    const self = this;
    // 广告位名称：Combo门票
    self._openWechatRewardedVideoAd("adunit-85cb66dfcf0a1d46", successCb, failCb);
  },

  createPerStatefulBuildableInstanceNodes(playerBuildableBinding, targetStatelessBuildableInstance) {
    const self = this;
    const statefulBuildableInstance = BuildableMap.prototype.createPerStatefulBuildableInstanceNodes.call(self, playerBuildableBinding, targetStatelessBuildableInstance);
    const toCollectIncomeScriptIns = statefulBuildableInstance.node.toCollectIncomeNode.getComponent('ToCollectIncome');
    switch (statefulBuildableInstance.id) {
    case constants.STATELESS_BUILDABLE_ID.MARKET:
      toCollectIncomeScriptIns.onCollectButtonClicked = function(evt) {
        if (!self.isPurelyVisual()) {
          return;
        }
        if (null != evt) {
          self.playEffectCommonButtonClick();
        }
        const collectCacedGoldConfirmationPanelNode = cc.instantiate(self.collectCachedGoldConfirmationPanelPrefab);
        collectCacedGoldConfirmationPanelNode.setPosition(cc.v2(0, 0));
        const collectCacedGoldConfirmationPanelIns = collectCacedGoldConfirmationPanelNode.getComponent("CollectCachedGoldConfirmationPanel");
        collectCacedGoldConfirmationPanelIns.init(self);
        collectCacedGoldConfirmationPanelIns.onCloseDelegate = () => {
          self.exitPanelView(collectCacedGoldConfirmationPanelIns);
        };
        collectCacedGoldConfirmationPanelIns.onConfirm = function() {
          toCollectIncomeScriptIns.onCollect(evt);
        };
        collectCacedGoldConfirmationPanelIns.onVidAdBtnClicked = function(evt) {
          if (null != evt) {
            self.playEffectCommonButtonClick();
          }
          collectCacedGoldConfirmationPanelIns.vidAdBtn.interactable = false;
          self.watchVidAdToGainMoreGoldCount(function() {
            toCollectIncomeScriptIns.setData(toCollectIncomeScriptIns.cachedGoldCount * 2);
            collectCacedGoldConfirmationPanelIns.vidAdBtn.interactable = true;
            collectCacedGoldConfirmationPanelIns.onConfirmButtonClicked();
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
              simplePressToGoDialogScriptIns.setHintLabel(i18n.t("VideoAd.Tip.gainGold"));
            }
            self.enterPanelView(simplePressToGoDialogScriptIns);
            collectCacedGoldConfirmationPanelIns.vidAdBtn.interactable = true;
          });
        }
        collectCacedGoldConfirmationPanelIns.vidAdBtn.node.active = self.vidAdsRewardEnabled;
        collectCacedGoldConfirmationPanelIns.setTitleLabel(i18n.t("Tip.marketIncomeTitle"));
        collectCacedGoldConfirmationPanelIns.setHintLabel(cc.js.formatStr(i18n.t("Tip.marketIncome"), toCollectIncomeScriptIns.cachedGoldCount));
        collectCacedGoldConfirmationPanelIns.setGoldCount(toCollectIncomeScriptIns.cachedGoldCount);
        self.enterPanelView(collectCacedGoldConfirmationPanelIns);
      }
      break;
    }
    statefulBuildableInstance.node.freeAutoOrderCounter = 0;
    return statefulBuildableInstance;
  },

  updateBuildableMapGUIForBuildOrUpgradeDone(statefulBuildableInstance) {
    const self = this;
    BuildableMap.prototype.updateBuildableMapGUIForBuildOrUpgradeDone.call(self, statefulBuildableInstance);
    const buildableId = statefulBuildableInstance.id;
    if (self.housekeeperEnabled && !self.isInNarrativeScene()) {
      if (null == self.housekeeperNpcDict[buildableId]) {
        // the first buildable for the buildableId is built, thus a new housekeeper should be created.
        let targetHousekeeperBinding = self.createHousekeeperBindingIfNotExists(buildableId);
        if (null != targetHousekeeperBinding) {
          self.spawnHousekeeperNpcIfNotExists(targetHousekeeperBinding);
          if (null != self.idlePlayerArchivePanelIns) {
            self.idlePlayerArchivePanelIns.refresh();
          }
        }
      }
    }
  },
  // HousekeeperBindingList scope. [begin]
  createHousekeeperBindingIfNotExists(buildableId) {
    const self = this;
    const housekeeperConfigured = constants.HOUSEKEEPER["BUILDABLEID_" + buildableId];
    if (null == housekeeperConfigured) {
      cc.log("I can't find a config BUILDABLEID_" + buildableId + " in constants.HOUSEKEEPER, thus the housekeeperBinding for buildableId(" + buildableId + ")  would not be created.");
      return null;
    }
    let index = -1, targetHousekeeperBinding;
    for (let i = 0, len = self.housekeeperBindingList.length; i < len; i++) {
      const housekeeperBinding = self.housekeeperBindingList[i];
      if (housekeeperBinding.buildableId == buildableId) {
        index = i;
        targetHousekeeperBinding = housekeeperBinding;
        if (null == targetHousekeeperBinding.currentLevel || 0 == targetHousekeeperBinding.currentLevel) {
          targetHousekeeperBinding.currentLevel = 1; // For backward compatibility -- YFLu, 2019-12-02.
        } 
        break;
      }
    }
    if (index == -1) {
      targetHousekeeperBinding = {
        lastPeriodStartedAt: null,
        buildableId: buildableId,
        currentLevel: 1,
      };
      self.housekeeperBindingList.push(targetHousekeeperBinding);
    }
    return targetHousekeeperBinding;
  },

  removeDeprecatedHousekeeperBindingRecord() {
    const self = this;
    const clonedHousekeeperBindingList = self.housekeeperBindingList.slice();
    for (let housekeeperBinding of clonedHousekeeperBindingList) {
      const buildableId = housekeeperBinding.buildableId;
      const housekeeperConfigured = constants.HOUSEKEEPER["BUILDABLEID_" + buildableId];
      if (null == housekeeperConfigured) {
        cc.warn("I can't find a config BUILDABLEID_" + housekeeperBinding.buildableId + " in constants.HOUSEKEEPER, thus the housekeeperBinding for buildableId(" + housekeeperBinding.buildableId + ")  would be removed.");
        index = self.housekeeperBindingList.indexOf(housekeeperBinding);
        self.housekeeperBindingList.splice(index, 1);
      }
    }
  },

  unlockHousekeeperNpc(requiredGold, buildableId, housekeeperBinding, cb) {
    const self = this;
    self.costGoldsToDo(requiredGold, function() {
      self.playEffectCommonCongrat();
      housekeeperBinding.lastPeriodStartedAt = Date.now();
      const npcScriptIns = self.housekeeperNpcDict[buildableId];
      npcScriptIns.lastPeriodStartedAt = housekeeperBinding.lastPeriodStartedAt;
      npcScriptIns.transitToStaying();
      if (null != self.idlePlayerArchivePanelIns) {
        self.idlePlayerArchivePanelIns.refresh();
      }
      cb && cb();
    });
  },

  upgradeHousekeeperNpc(requiredGold, buildableId, housekeeperBinding, cb) {
    const self = this
    self.costGoldsToDo(requiredGold, function() {
      self.playEffectCommonCongrat();
      housekeeperBinding.lastPeriodStartedAt = Date.now();
      housekeeperBinding.currentLevel += 1;
      const npcScriptIns = self.housekeeperNpcDict[buildableId];
      npcScriptIns.lastPeriodStartedAt = housekeeperBinding.lastPeriodStartedAt;
      npcScriptIns.transitToStaying();
      if (null != self.idlePlayerArchivePanelIns) {
        self.idlePlayerArchivePanelIns.refresh();
      }
      if (null != self.housekeeperCellInfoPanelIns) {
        self.housekeeperCellInfoPanelIns.refresh();
      }
      cb && cb();
    });
  },

  showHousekeeperChangeConfirmationPanel(housekeeperBinding) {
    const self = this;
    let panelName = 'HousekeeperChangeConfirmationPanel';
    if (self.viewingPanelManager.hasPanel(panelName)) {
      cc.warn('Already existing a same panel:', panelName);
      return;
    }
    let panelNode = self.housekeeperChangeConfirmationPanelNode,
        panelIns = self.housekeeperChangeConfirmationPanelIns;
    if (null == panelNode) {
      panelNode = self.housekeeperChangeConfirmationPanelNode = cc.instantiate(self.housekeeperChangeConfirmationPanelPrefab);
      panelIns = self.housekeeperChangeConfirmationPanelIns = panelNode.getComponent(panelName);
      panelIns.init(self);
    }

    // set panel's defaultActionsEnabled to false [begins].
    panelIns.defaultActionsEnabled = false;
    // set panel's defaultActionsEnabled to false [ends].

    panelIns.onCloseDelegate = () => {
      self.exitPanelView(panelIns);
      self.closeBottomBannerAd();
    };
    panelIns.setData(housekeeperBinding);
    panelIns.refresh();
    self.enterPanelView(panelIns);
    self.openBottomBannerAd();
  },

  showHousekeeperCellInfoPanel(buildableId, housekeeperBinding) {
    const self = this;
    let panelName = 'HousekeeperCellInfoPanel';
    if (self.viewingPanelManager.hasPanel(panelName)) {
      cc.warn('Already existing a same panel:', panelName);
      return;
    }
    let panelNode = self.housekeeperCellInfoPanelNode,
        panelIns = self.housekeeperCellInfoPanelIns;
    if (null == panelNode) {
      panelNode = self.housekeeperCellInfoPanelNode = cc.instantiate(self.housekeeperCellInfoPanelPrefab);
      panelIns = self.housekeeperCellInfoPanelIns = panelNode.getComponent(panelName);
      panelIns.init(self);
    }

    // set panel's defaultActionsEnabled to false [begins].
    panelIns.defaultActionsEnabled = false;
    // set panel's defaultActionsEnabled to false [ends].

    panelIns.onCloseDelegate = () => {
      self.exitPanelView(panelIns);
      self.closeBottomBannerAd();
    };
    panelIns.setData(buildableId, housekeeperBinding);
    panelIns.refresh();
    self.enterPanelView(panelIns);
    self.openBottomBannerAd();
  },

  boostHosekeeperNpcBackToWork(requiredDiamonds, buildableId, housekeeperBinding, cb) {
    const self = this;
    self.costDiamondsToDo(requiredDiamonds, function() {
      housekeeperBinding.lastPeriodStartedAt = Date.now();
      const npcScriptIns = self.housekeeperNpcDict[buildableId];
      npcScriptIns.lastPeriodStartedAt = housekeeperBinding.lastPeriodStartedAt;
      npcScriptIns.transitToStaying();
      cb && cb();
    });
  },
  // HousekeeperBindingList scope. [end]

  onGameSettingsTriggerClicked() {
    const self = this;
    self.playEffectCommonButtonClick();
    self.gameSettingsPanelScriptIns.onCloseDelegate = () => {
      self.exitPanelView(self.gameSettingsPanelScriptIns);
      self.closeBottomBannerAd();
    };
    self.enterPanelView(self.gameSettingsPanelScriptIns);
    self.openBottomBannerAd();
  },
});


