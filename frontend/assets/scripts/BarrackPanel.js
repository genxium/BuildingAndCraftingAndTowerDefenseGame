const ProduceWithIngredientProgressListPanel = require('./ProduceWithIngredientProgressListPanel');
const KnapsackPanel = require('./KnapsackPanel');
const PageViewCtrl = require("./PageViewCtrl");
const StateBasedFactory = require('./modules/StateBasedFactory');
const i18n = require('LanguageData');

// Warning: The TAB should consistent to the label showed under tabContainer.
const BarrackPanelTab = cc.Enum({
  TROOP: 0,
  CONSCRIPTION: 1,
});

const BarrackPanelState = cc.Enum({
  IDLE: 0,
  EDITING: 1,
});
const ClassOption = StateBasedFactory(BarrackPanelState, BarrackPanelState.IDLE, "panelState");

Object.assign(ClassOption.properties, {
  // Tab container:
  tabContainer: cc.ToggleContainer,
  viewingTab: {
    type: BarrackPanelTab,
    default: BarrackPanelTab.TROOP,
  },
  // Knapsack panel:
  soldierKnapsack: KnapsackPanel,
  // Tab page container:
  conscriptionContainer: cc.Node,
  troopContainer: cc.Node,
  // Edit troop properties:
  editBtn: cc.Button,
  cancelEditingBtn: cc.Button,
  confirmEditingBtn: cc.Button,
  reclaimedGoldLabel: cc.Label,
  // ingredientPageViewCtrl for knapsack:
  ingredientPageViewCtrl1: {
    type: PageViewCtrl,
    default: null,
    tooltip: 'This is an ingredientPageViewCtrl for SoldierKnapsack.',
  },
  // Tip node.
  tipContainer: cc.Node,
  tipLabel: cc.Label,
  residentLimitLabel: cc.Label,

  // DurationMillis
  holdTipDurationMillis: 3000,

  // btn
  goToBattleBtn: cc.Button,
});
Object.assign(ClassOption, {
  extends: ProduceWithIngredientProgressListPanel,
  ctor() {
    this.cachedReclaimedIngredientDict = {};
    this.currentReclaimedGoldCount = 0;
    /* 
     * 一般来说，_onCollectReclaimedIngredientProgressListCompleted 只会在编辑军队时才会被调用
     * 否则，应该上一次collect时没有成功，导致队列中存在部分reclaimedIngredientProgress。
     */
    this._onCollectReclaimedIngredientProgressListCompleted = null; 
  },

  onLoad() {
    const self = this;
    ProduceWithIngredientProgressListPanel.prototype.onLoad.apply(self, arguments);
    self.initTabContainer();
    // Initialization of tab changed. [begin]
    let checkEventHandler = new cc.Component.EventHandler();
    checkEventHandler.target = self.node;
    checkEventHandler.component = self.node.name;
    checkEventHandler.handler = 'onTabChanged';
    self.tabContainer.checkEvents = [
      checkEventHandler,
    ];
    for (let toggleItem of self.tabContainer.toggleItems) {
      let clickHandler = new cc.Component.EventHandler();
      clickHandler.target = self.node;
      clickHandler.component = 'BarrackPanel';
      clickHandler.handler = 'onTabClicked';
      toggleItem.clickEvents = [
        clickHandler,
      ];
    }
    // Initialization of tab changed. [end]
    self.ajaxProgressList.onWaiting = function() {
      if (self.viewingTab == BarrackPanelTab.TROOP) {
        return;
      } else {
        self.interactable = false;
        self.waitingNode.active = true;
      }
    }
    // Initialization of editBtn. [begin] {
    let editButtonClickEvent = new cc.Component.EventHandler();
    editButtonClickEvent.target = self.node;
    editButtonClickEvent.component = self.node.name;
    editButtonClickEvent.handler = 'startEditingTroop';
    self.editBtn.clickEvents = [
      editButtonClickEvent,
    ];
    // Initialization of editBtn. [end] }
    
    // Initialization of cancelEditingBtn. [begin] {
    let cancelEditingButtonClickEvent = new cc.Component.EventHandler();
    cancelEditingButtonClickEvent.target = self.node;
    cancelEditingButtonClickEvent.component = self.node.name;
    cancelEditingButtonClickEvent.handler = 'endEditingTroop';
    self.cancelEditingBtn.clickEvents = [
      cancelEditingButtonClickEvent,
    ];
    // Initialization of cancelEditingBtn. [end] }
    
    // Initialization of confirmEditingBtn. [begin] {
    let confirmEditingButtonClickEvent = new cc.Component.EventHandler();
    confirmEditingButtonClickEvent.target = self.node;
    confirmEditingButtonClickEvent.component = self.node.name;
    confirmEditingButtonClickEvent.handler = 'onConfirmEditingBtnClicked';
    self.confirmEditingBtn.clickEvents = [
      confirmEditingButtonClickEvent,
    ];
    // Initialization of confirmEditingBtn. [end] }

    // Initialization of goToBattleBtn. [begin] {
    let goToBattleButtonClickEvent = new cc.Component.EventHandler();
    goToBattleButtonClickEvent.target = self.node;
    goToBattleButtonClickEvent.component = self.node.name;
    goToBattleButtonClickEvent.handler = 'goToBattle';
    self.goToBattleBtn.clickEvents = [
      goToBattleButtonClickEvent,
    ];
    // Initialization of goToBattleBtn. [end] }
  },

  onEnable() {
    ProduceWithIngredientProgressListPanel.prototype.onEnable && ProduceWithIngredientProgressListPanel.prototype.onEnable.apply(this, arguments);
  },

  onDisable() {
    ProduceWithIngredientProgressListPanel.prototype.onDisable && ProduceWithIngredientProgressListPanel.prototype.onDisable.apply(this, arguments);
    this.endEditingTroop();
    this.stopTipAnimation();
  },

  init(mapIns, statefulBuildableInstance) {
    const self = this;
    ProduceWithIngredientProgressListPanel.prototype.init.apply(self, arguments);
    self.soldierKnapsack.init(mapIns);
  },

  setData(ingredientList, ingredientProgressList) {
    const self = this;
    if (null != ingredientProgressList) {
      const reclaimedIngredientProgressList = [], producingIngredientProgressList = [];
      ingredientProgressList.forEach(function(ingredientProgress) {
        if (ingredientProgress.state == constants.INGREDIENT_PROGRESS_STATE.RECLAIMING_TO_BE_MANUALLY_COLLECTED
        || ingredientProgress.state == constants.INGREDIENT_PROGRESS_STATE.RECLAIMED_TO_BE_MANUALLY_COLLECTED
        || ingredientProgress.state == constants.INGREDIENT_PROGRESS_STATE.PENDING_IN_RECLAIM_QUEUE_TO_BE_MANUALLY_COLLECTED) {
          reclaimedIngredientProgressList.push(ingredientProgress);
        } else {
          producingIngredientProgressList.push(ingredientProgress);
        }
      });
      if (0 < reclaimedIngredientProgressList.length) {
        // TODO: collect reclaimed ingredient
        let reclaimedCompletedIngredientProgressList = reclaimedIngredientProgressList.filter(function(ingredientProgress) {
          return ingredientProgress.state == constants.INGREDIENT_PROGRESS_STATE.RECLAIMED_TO_BE_MANUALLY_COLLECTED;
        });
        if (reclaimedCompletedIngredientProgressList.length != reclaimedIngredientProgressList.length) {
          console.warn('You need to show an ingredientProgressList for unReclaimedIngredientProgressList.');
        }
        /*
         *  WARNING: the reclaimedDuration should be 0, or you should show an ingredientProgressList for them.
         *      --guoyl6, 2019-10-30, 7:23
         */
        self.mapIns.collectReclaimedIngredient(reclaimedCompletedIngredientProgressList, function() {
          self._onCollectReclaimedIngredientProgressListCompleted && self._onCollectReclaimedIngredientProgressListCompleted();
        });
      }
      ingredientProgressList = producingIngredientProgressList;
    }
    ProduceWithIngredientProgressListPanel.prototype.setData.call(self, ingredientList, ingredientProgressList);
    self.soldierKnapsack.setData(self.mapIns.soldierArray || []);
  },

  refresh() {
    const self = this;
    ProduceWithIngredientProgressListPanel.prototype.refresh.apply(self, arguments);
    self.refreshIngredientLockedState();
    self.refreshKnapsacks();
  },

  refreshIngredientLockedState() {
    const self = this;
    // 将未解锁的ingredient做变灰处理。
    const ingredientPageCellList = self.getAllIngredientPageCell();
    for (let ingredientPageCell of ingredientPageCellList) {
      const ingredientId = ingredientPageCell.ingredient.id;
      if (self.mapIns.isSoldierUnlocked(ingredientId)) {
        ingredientPageCell.toEnabledView();
      } else {
        ingredientPageCell.toDisabledView();
      }
    }
  },

  calculateResident() {
    const self = this;
    let currentResidentCount = 0;
    for (let knapsackItem of self.mapIns.soldierArray) {
      currentResidentCount += knapsackItem.currentCount * knapsackItem.ingredient.residenceOccupation;
    }
    return currentResidentCount;
  },

  refreshKnapsacks() {
    const self = this;
    self.soldierKnapsack.refresh();
    self.ingredientPageViewCtrl1.refreshIndex();
    const soldierIngredients = self.soldierKnapsack.getAllIngredientPageCell();
    for (let ingredientCell of soldierIngredients) {
      const ingredientId = ingredientCell.ingredient.id;
      // 统计resident数量。
      const currentReclaimedCount = self.cachedReclaimedIngredientDict[ingredientId] || 0;
      if (0 < currentReclaimedCount) {
        ingredientCell.setHoldingCount(currentReclaimedCount);
        ingredientCell.countLabel.node.color = cc.color("#DE5244");
      } else {
        ingredientCell.setHoldingCount(0);
        ingredientCell.countLabel.node.color = cc.Color.WHITE;
      }
      let editableIngredientCell = ingredientCell.node.getComponent('EditableIngredientCell');
      if (null != editableIngredientCell) {
        if (self.panelState == BarrackPanelState.IDLE) {
          editableIngredientCell.infoButton.active = true;
          if (null != editableIngredientCell.infoButton.target) {
            editableIngredientCell.infoButton.target.active = true;
          }
          editableIngredientCell.minusButton.active = false;
          if (null != editableIngredientCell.minusButton.target) {
            editableIngredientCell.minusButton.target.active = false;
          }
        } else if (self.panelState == BarrackPanelState.EDITING) {
          editableIngredientCell.infoButton.active = false;
          if (null != editableIngredientCell.infoButton.target) {
            editableIngredientCell.infoButton.target.active = false;
          }
          editableIngredientCell.minusButton.active = true;
          if (null != editableIngredientCell.minusButton.target) {
            editableIngredientCell.minusButton.target.active = true;
          }
        }
        // handle minus button clicked.
        editableIngredientCell.onIngredientMinus = function(knapsackItem, ingredient) {
          self.cachedReclaimedIngredientDict[ingredient.id] = self.cachedReclaimedIngredientDict[ingredient.id] || 0;
          if (knapsackItem.currentCount <= self.cachedReclaimedIngredientDict[ingredient.id]) {
            return;
          }
          self.cachedReclaimedIngredientDict[ingredient.id] += 1;
          self.currentReclaimedGoldCount += ingredient.reclaimPriceValue;

          // 刷新ingredient
          editableIngredientCell.setHoldingCount(self.cachedReclaimedIngredientDict[ingredient.id]);
          ingredientCell.countLabel.node.color = cc.color("#DE5244");
          // 刷新goldLabel
          self.setReclaimedGoldLabelString(self.currentReclaimedGoldCount);
          // TODO: check if too much ingredient progress will be created.

        }
      }
    }

    const currentResidentLimit = self.calculateResident();

    self.residentLimitLabel.string = cc.js.formatStr(i18n.t('BarrackPanel.Tip.residentLimit'), currentResidentLimit, self.mapIns.calculateResidentLimit());

    self.goToBattleBtn.interactable = currentResidentLimit > 0;
  },

  setReclaimedGoldLabelString(goldCount) {
    const self = this;
    // TODO: use progress num.
    self.reclaimedGoldLabel.string = goldCount;
  },

  startEditingTroop(evt) {
    const self = this;
    if (null != self.mapIns && null != evt) {
      self.mapIns.playEffectCommonButtonClick();
    }
    self.cachedReclaimedIngredientDict = {};
    self.currentReclaimedGoldCount = 0;
    self.setReclaimedGoldLabelString(self.currentReclaimedGoldCount);
    self.panelState = BarrackPanelState.EDITING;
    self.refreshKnapsacks();
  },

  endEditingTroop(evt) {
    const self = this;
    if (null != self.mapIns && null != evt) {
      self.mapIns.playEffectCommonButtonClick();
    }
    self.cachedReclaimedIngredientDict = {};
    self.currentReclaimedGoldCount = 0;
    self.setReclaimedGoldLabelString(self.currentReclaimedGoldCount);
    self.panelState = BarrackPanelState.IDLE;
    self.refreshKnapsacks();
  },

  onConfirmEditingBtnClicked(evt) {
    const self = this;
    const ingredientMap = self.cachedReclaimedIngredientDict;
    if (null != self.mapIns && null != evt) {
      self.mapIns.playEffectCommonButtonClick();
    }
    if (Object.keys(ingredientMap).length <= 0) {
      self.endEditingTroop();
      return;
    }
    self.cachedReclaimedIngredientDict = {};
    self.interactable = false;
    self.waitingNode.active = true;
    self.mapIns.sendReclaimQueryForSeveralIngredient(self.statefulBuildableInstance, ingredientMap, function(res) {
      self.setData(null, res.ingredientProgressList);
      self._onCollectReclaimedIngredientProgressListCompleted = function() {
        self._onCollectReclaimedIngredientProgressListCompleted = null;
        self.interactable = true;
        self.waitingNode.active = false;
        self.endEditingTroop();
      }
    }, function(err, res) {
      self.interactable = true;
      self.waitingNode.active = false;
      self.endEditingTroop();
      if (null == err) {
        if (res.ret == constants.RET_CODE.INGREDIENT_PROGRESS_MAX_PER_PLAYER_BUILDABLE_BINDING_EXCEEDED) {
          // TODO: show tip for too much ingredient progress. 
        } 
      } 
    })
  },
  
  initTabContainer() {
    const self = this;
    let toggleItemsIndex = self.viewingTab;
    self.onTabChanged(self.tabContainer.toggleItems[toggleItemsIndex]);
  },
  onTabChanged(toggle) {
    const self = this;
    self.viewingTab = self.tabContainer.toggleItems.indexOf(toggle);
    switch (self.viewingTab) {
    case BarrackPanelTab.TROOP:
      self.troopContainer.x = 0;
      self.conscriptionContainer.x = -9999;
      break;
    case BarrackPanelTab.CONSCRIPTION:
      self.conscriptionContainer.x = 0;
      self.troopContainer.x = -9999;
      break;
    }
  },

  produceIngredient(evt) {
    const self = this;
    const {ingredientCell, relatedEvent} = evt.detail;
    if (!ingredientCell.node.isChildOf(self.ingredientPageView.node)) {
      return;
    }
    const ingredientId = ingredientCell.ingredient.id;
    if (!self.mapIns.isSoldierUnlocked(ingredientId)) {
      // TODO: Show some tip.
      const ret = self.mapIns.getBuildableAndLevelForUnlockingSoldier(ingredientId);
      if (null == ret) {
        console.warn('Why I can not find a interaction to unlock an ingredient', ingredientId);
        return;
      }
      self.showTip(cc.js.formatStr(i18n.t("BarrackPanel.Tip.unlockBuildableToLevel"), ret.statelessBuildableInstance.displayName, ret.level));
      return;
    }
    // TODO: consider residentLimit.
    let requiredResidentCount = ingredientCell.ingredient.residenceOccupation;
    let currentResident = self.calculateResident(),
        residentLimit = self.mapIns.calculateResidentLimit();
    let residentOccupationInProgress = 0;
    if (null != self.ingredientProgressList.data) {
      residentOccupationInProgress = self.ingredientProgressList.data.reduce(function(sum, ingredientProgress) {
        sum += self.mapIns.getIngredientById(ingredientProgress.ingredientId).residenceOccupation;
        return sum;
      }, 0);
    }
    if (requiredResidentCount + residentOccupationInProgress + currentResident > residentLimit) {
      self.showTip(i18n.t("BarrackPanel.Tip.residentReachLimat"));
      return;
    }
    ProduceWithIngredientProgressListPanel.prototype.produceIngredient.apply(self, arguments);
  },

  showTip(tip) {
    const self = this;
    self.tipLabel.string = tip;
    self.tipContainer.active = true;
    self.tipContainer.opacity = 255;
    self.tipContainer.stopAllActions();
    self.tipContainer.runAction(
      cc.sequence(
        cc.delayTime(self.holdTipDurationMillis / 1000),
        cc.fadeOut(0.3),
        cc.callFunc(function() {
          self.tipContainer.active = false;
          self.tipContainer.opacity = 255;
        })
      )
    );
  },

  stopTipAnimation() {
    const self = this;
    self.tipContainer.stopAllActions();
    self.tipContainer.active = false;
    self.tipContainer.opacity = 255;
  },

  queryIngredientList() {
    const self = this;
    self.setState(window.AJAX_STATE.WAITING);
    self.ajaxProgressList.setState(window.AJAX_STATE.WAITING);
    self.mapIns.sendIngredientListQuery(self.statefulBuildableInstance.playerBuildableBinding.id, self.statefulBuildableInstance.autoCollect, function({
      deprecatedIngredientList /* NOT used in our stage-based gameplay. -- YFLu, 2019-09-14 */,
      ingredientProgressList,
    }) {
      let stageProducibleIngredientList = self.mapIns.getProducibleSoldierIngredientList();
      self.setData(stageProducibleIngredientList, ingredientProgressList);
      self.refresh();
      self.setState(window.AJAX_STATE.SUCCEED);
      self.ajaxProgressList.setState(window.AJAX_STATE.SUCCEED);
    });
  },

  goToBattle(evt) {
    const self = this;
    if (null != self.mapIns && null != evt) {
      self.mapIns.playEffectCommonButtonClick();
    }
    self.interactable = false;
    self.waitingNode.active = true;
    cc.director.loadScene('StageSelection');
  },

  onTabClicked(evt) {
    const self = this;
    if (null != self.mapIns && null != evt) {
      self.mapIns.playEffectCommonButtonClick();
    }
  },

});

cc.Class(ClassOption);

