const i18n = require('LanguageData');
i18n.init(window.language);
const CloseableDialog = require('./CloseableDialog');
const ProgressBar = require('./BuildOrUpgradeProgressBar');
module.export = cc.Class({
  extends: CloseableDialog,

  properties: {
    activeAppearanceSprite: {
      type: cc.Sprite,
      default: null,
    },
    displayNameLabel: {
      type: cc.Label,
      default: null,
    },
    upgradeButton: {
      type: cc.Button,
      default: null,
    },
    upgradeButtonGoldLabel: cc.Label,
    cancelButton: {
      type: cc.Button,
      default: null,
    },
    maxLevelLabel: {
      type: cc.Label,
      default: null,
    },
    goldStorageProgressBar: {
      type: cc.Node,
      default: null,
    },

    goldStorageLabel: {
      type: cc.Label,
      default: null,
    },

    infomationLabel: {
      type: cc.Label,
      default: null,
    },

    nodeOnMaxLevel: {
      type: [cc.Node],
      tooltip: `the selected nodes will be actived when the statefulBuildableInstance's level is maximum.`,
      default: [],
    },
    nodeOnOtherLevel: {
      type: [cc.Node],
      tooltip: `the selected nodes will be actived when the statefulBuildableInstance's level is not maximum`,
      default: [],
    },
    // Warning, the maxSeatingCapacityContainer tip should have this struct of node tree:
    // NodeItSelf
    //   Icon
    //     Farmland
    //     Restaurant
    //     Bakery
    //   Value
    maxSeatingCapacityContainer: cc.Node,

    archiveBuildableIngredientCellPrefab: cc.Prefab,
    archiveIngredientContainer: cc.Node,
    archiveIngredientListNode: cc.Node,

    collectButton: cc.Button,
    vidAdBtn: cc.Button,
   
    tipContainer: cc.Node,
    tipLabel: cc.Label,
    tipStayDurationMillis: 5000,

    baseFoodProductionRateContainer: cc.Node,
    baseFoodProductionRateLabel: cc.Label,

    intervalToRefreshMarketCachedGold: 30000,
    marketCachedGoldLabel: cc.Label,

  },

  ctor() {
    this._refreshMarketCachedGoldInterval = null;
  },

  onLoad() {
    CloseableDialog.prototype.onLoad.call(this);
    this.initButtonListener();
    // Initialization of collectButton. [begin]
    const collectButtonHandle = new cc.Component.EventHandler();
    collectButtonHandle.target = this.node;
    collectButtonHandle.component = this.node.name;
    collectButtonHandle.handler = "onCollectButtonClicked";
    this.collectButton.clickEvents = [
      collectButtonHandle,
    ];
    // Initialization of collectButton. [end]
    // Initialization of vidAdBtn. [begin]
    const vidAdBtnHandle = new cc.Component.EventHandler();
    vidAdBtnHandle.target = this.node;
    vidAdBtnHandle.component = this.node.name;
    vidAdBtnHandle.handler = "onVidAdBtnClicked";
    this.vidAdBtn.clickEvents = [
      vidAdBtnHandle,
    ];
    // Initialization of vidAdBtn. [end]
  },

  init(mapIns) {
    this.mapIns = mapIns;
  },

  setInfo(statefulBuildableInstance) {
    if(statefulBuildableInstance.currentLevel != 0){
      this.displayNameLabel.string = cc.js.formatStr(
        i18n.t("BuildingInfo.Short"),
        i18n.t("BuildingInfo.DisplayName." + statefulBuildableInstance.displayName),
        statefulBuildableInstance.currentLevel
      );
    } else {
      this.displayNameLabel.string = i18n.t("BuildingInfo.DisplayName." + statefulBuildableInstance.displayName);
    }

    this.activeAppearanceSprite.spriteFrame = statefulBuildableInstance.activeAppearance;
    this.buildingOrUpgradingDuration = statefulBuildableInstance.buildingOrUpgradingDuration[statefulBuildableInstance.currentLevel + 1];
    this.buildingOrUpgradingStartedAt = statefulBuildableInstance.buildingOrUpgradingStartedAt;
    this.statefulBuildableInstance = statefulBuildableInstance;
  },

  onEnable() {
    const self = this;
    CloseableDialog.prototype.onEnable && CloseableDialog.prototype.onEnable.apply(this, arguments);
    this.refreshLabelAndProgressBar();
    this.refreshInteractableButton();
    this.refreshAnimation();
    this.refreshProperties();
    this.renderIngredientListForFreeOrder();
    // refresh tipLabel.
    this.tipContainer.opacity = 0;
    this.tipContainer.stopAllActions();
    if (null != self.statefulBuildableInstance) {
      if (self.statefulBuildableInstance.id == constants.STATELESS_BUILDABLE_ID.MARKET) {
        if (null != self._refreshMarketCachedGoldInterval) {
          clearInterval(self._refreshMarketCachedGoldInterval);
        }
        self._refreshMarketCachedGoldInterval = setInterval(function() {
          self.refreshGoldStorageProgressBar();
        }, self.intervalToRefreshMarketCachedGold);
      }
    }
  },

  onDisable() {
    const self = this;
    CloseableDialog.prototype.onDisable && CloseableDialog.prototype.onDisable.apply(self, arguments);
    if (null != self._refreshMarketCachedGoldInterval) {
      clearInterval(self._refreshMarketCachedGoldInterval);
      self._refreshMarketCachedGoldInterval = null;
    }
  },

  refreshProperties() {
    const self = this;
    // refresh chairCount. [begin] {
    let maxSeatingCapacityTipIcons, maxSeatingCapacityTipLabel;
    let chairCount = 0;
    self.infomationLabel.string = i18n.t('IdleStatefulBuildableInstanceInfoPanel.Info.' + self.statefulBuildableInstance.displayName);
    switch (self.statefulBuildableInstance.id) {
    case constants.STATELESS_BUILDABLE_ID.FARMLAND:
    case constants.STATELESS_BUILDABLE_ID.SNACK:
    case constants.STATELESS_BUILDABLE_ID.CAFE:
    case constants.STATELESS_BUILDABLE_ID.BAKERY:
      self.maxSeatingCapacityContainer.active = true;
      maxSeatingCapacityTipIcons = self.maxSeatingCapacityContainer.getChildByName('Icon');
      if (null != maxSeatingCapacityTipIcons) {
        maxSeatingCapacityTipIcons.children.forEach(function(node) {
          node.active = node.name == self.statefulBuildableInstance.displayName;
        });
      }
      maxSeatingCapacityTipLabel = self.maxSeatingCapacityContainer.getChildByName('Value');
      if (null != maxSeatingCapacityTipLabel) {
        chairCount = null == self.statefulBuildableInstance.chairOffsetDict ? 0 : Object.values(self.statefulBuildableInstance.chairOffsetDict).length;
        maxSeatingCapacityTipLabel.getComponent(cc.Label).string = cc.js.formatStr(
          i18n.t('IdleStatefulBuildableInstanceInfoPanel.Tip.MaxSeatingCapacity.' + self.statefulBuildableInstance.displayName), chairCount
        );
      }
      if (0 >= chairCount) {
        self.maxSeatingCapacityContainer.active = false;
      }
      break;
    default:
      self.maxSeatingCapacityContainer.active = false;
      break;
    }
    // refresh chairCount. [end] }

    
  },

  refreshAnimation() {
    const self = this, isMaxLevel = self.statefulBuildableInstance.isLevelReachMaxLevel();
    self.nodeOnMaxLevel.forEach(function(node) {
      node.active = isMaxLevel;
    });
    self.nodeOnOtherLevel.forEach(function(node) {
      node.active = !isMaxLevel;
    });
  },

  refreshGoldStorageProgressBar() {
    const self = this;
    const mapIns = self.statefulBuildableInstance.mapIns;
    let progressBarScript = self.goldStorageProgressBar.getComponent("ProgressNum");
    progressBarScript.formulateIndicatorLabelStr = function() {
      return cc.js.formatStr(i18n.t("Tip.goldStorage"), Math.floor(this.currentlyDisplayingQuantity)) + "/" + Math.floor(this.maxValue);
    };
    self.marketCachedGoldLabel.node.active = false;
    if (this.statefulBuildableInstance.id == constants.STATELESS_BUILDABLE_ID.HEADQUARTER) {
      self.goldStorageProgressBar.active = true;
      let gold = mapIns.wallet.gold;
      let goldLimit = mapIns.wallet.goldLimit;
      progressBarScript.animationDurationMillis = 0;
      progressBarScript.setData(gold, goldLimit);
    } else if (this.statefulBuildableInstance.id == constants.STATELESS_BUILDABLE_ID.MARKET) {
      self.goldStorageProgressBar.active = true;
      self.marketCachedGoldLabel.node.active = true;
      try {
        let toCollectIncomeNode = self.statefulBuildableInstance.node.toCollectIncomeNode;
        let toCollectIncomeIns = toCollectIncomeNode.getComponent('ToCollectIncome');
        let cachedGoldCount = toCollectIncomeIns.cachedGoldCount;
        let buildableGoldLimit = 0;
        for (let levelConfIndex in self.statefulBuildableInstance.levelConfs) {
          const levelConf = self.statefulBuildableInstance.levelConfs[levelConfIndex];
          if (levelConf.level <= self.statefulBuildableInstance.currentLevel) {
            buildableGoldLimit += levelConf.goldLimitAddition;
          }
        }
        progressBarScript.animationDurationMillis = 0;
        progressBarScript.setData(cachedGoldCount, buildableGoldLimit);
        self.marketCachedGoldLabel.string = cachedGoldCount;
      } catch (e) {
        console.warn(e);
        self.goldStorageProgressBar.active = false;
        self.marketCachedGoldLabel.node.active = false;
      }
    } else {
      self.goldStorageProgressBar.active = false;
    }
  },

  refreshResidentLimitProgressBar() {
    const self = this;
    const mapIns = self.statefulBuildableInstance.mapIns;
    let progressBarScript = self.baseFoodProductionRateContainer.getComponent("ProgressNum");
    progressBarScript.formulateIndicatorLabelStr = function() {
      return cc.js.formatStr(i18n.t("Tip.residentLimit"), Math.floor(this.currentlyDisplayingQuantity)) + "/" + Math.floor(this.maxValue);
    };
    let currentResidentLimit = mapIns.calculateResidentLimit();
    let maxResidentLimit = mapIns.calculateMaximunResidentLimit();
    switch (self.statefulBuildableInstance.id) {
    case constants.STATELESS_BUILDABLE_ID.HEADQUARTER:
      self.baseFoodProductionRateContainer.active = true;
      progressBarScript.setData(currentResidentLimit, maxResidentLimit);
    break;
    default:
      self.baseFoodProductionRateContainer.active = false;
    break;
    }
  },

  refreshLabelAndProgressBar() {
    this.maxLevelLabel.node.active = false;
    if (this.statefulBuildableInstance.isLevelReachMaxLevel()) {
      this.maxLevelLabel.node.active = false; // hidden temporarily.
    }

    this.refreshGoldStorageProgressBar();
    this.refreshResidentLimitProgressBar();
  },

  refreshData() {
    this.setInfo(this.statefulBuildableInstance);
  },

  update() {
    const self = this;
    
  },

  initButtonListener() {
    const self = this;
    // Initialization of the 'upgradeButton' [begins].
    let upgradeHandler = new cc.Component.EventHandler();
    upgradeHandler.target = self.statefulBuildableInstance.mapIns.node;
    upgradeHandler.component = self.statefulBuildableInstance.mapIns.node.name;
    upgradeHandler.handler = 'tryToUpgradeStatefulBuildableInstance';
    upgradeHandler.customEventData = self.statefulBuildableInstance;
    self.upgradeButton.clickEvents = [
      upgradeHandler,
    ];

  // Initialization of the 'upgradeHandler' [ends].
  },

  refreshInteractableButton() {
    this.refreshUpgradeButton();
    this.refreshCancelButton();
    this.refreshCollectButton();
  },

  refreshCollectButton() {
    const self = this;
    switch (self.statefulBuildableInstance.id) {
    case constants.STATELESS_BUILDABLE_ID.MARKET:
      self.collectButton.node.active = true;
      self.vidAdBtn.node.active = self.mapIns.vidAdsRewardEnabled;
      break;
    default:
      self.collectButton.node.active = false;
      self.vidAdBtn.node.active = false;
      break;
    }
  },

  refreshUpgradeButton() {
    const self = this;
    let buttonEnabled = false;
    if (
      !self.statefulBuildableInstance.isBuilding()
      && !self.statefulBuildableInstance.isUpgrading()
      && !self.statefulBuildableInstance.isNewing()
      && !self.statefulBuildableInstance.isLevelReachMaxLevel()
    ) {
      buttonEnabled = true;
    }

    buttonEnabled = false; // hardcode temporarily.

    if (buttonEnabled) {
      let requireGold = self.statefulBuildableInstance.levelConfs.find(x => x.level == self.statefulBuildableInstance.currentLevel + 1).buildingOrUpgradingRequiredGold;
      self.upgradeButtonGoldLabel.string = requireGold;
      self.upgradeButtonGoldLabel.node.color = requireGold >= self.mapIns.wallet.gold ? cc.Color.BLACK : cc.Color.RED;
    }

    self.upgradeButton.node.active = buttonEnabled;
  },

  refreshCancelButton() {
    const self = this;
    self.cancelButton.node.active = false; // 不显示cancel按钮
    return;
    if (!self.buildingOrUpgradingStartedAt) {
      self.cancelButton.node.active = false;
    } else {
      if (self.statefulBuildableInstance.state == window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_BUIDLING_OR_UPGRADING) {
        self.cancelButton.node.active = true;
      } else {
        self.cancelButton.node.active = false;
      }
    }
  },

  renderIngredientListForFreeOrder() {
    const self = this;
    const targetInteractionList = self.mapIns.filterBuildableIngredientInteractionByBuildableId(self.statefulBuildableInstance.id, constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.FREEORDER);
    const groupedMap = {};
    for (let i = 0, len = targetInteractionList.length; i < len; i++) {
      const targetInteraction = targetInteractionList[i];
      const ingredient = self.mapIns.getIngredientById(targetInteraction.ingredientId);
      let key = null;
      let relatedPlayerIngredientRecord = self.mapIns.getPlayerIngredientForIdleGameByIngredientId(ingredient.id);
      if (null == relatedPlayerIngredientRecord) {
        key = 'unlearned';
      } else {
        switch (relatedPlayerIngredientRecord.state) {
        case constants.PLAYER_INGREDIENT_FOR_IDLEGAME.STATE.UNLOCKED:
          key = 'learned';
          break;
        default:
          key = 'unlearned';
          break;
        }
      }
      if (null == groupedMap[key]) {
        groupedMap[key] = [];
      }
      groupedMap[key].push(
        ingredient
      );
    }
    const sortedKey = Object.keys(groupedMap).sort(function(a, b) {
      return a == 'unlearned' ? 1 : -1;
    });
    const datas = sortedKey.map(function(key) {
      return [key, groupedMap[key]];
    });
    if (!datas.length) {
      self.archiveIngredientContainer.active = false;
      return;
    } else {
      self.archiveIngredientContainer.active = true;
    }
    self.archiveIngredientListNode.removeAllChildren();
    for (let i = 0, len = datas.length; i < len; i++) {
      const title = cc.js.formatStr(i18n.t("Tip.Category.Ingredient." + datas[i][0])),
        ingredientList = datas[i][1];
      let archiveBuildableIngredientCellNode = cc.instantiate(self.archiveBuildableIngredientCellPrefab);
      let archiveBuildableIngredientCellIns = archiveBuildableIngredientCellNode.getComponent('ArchiveBuildableIngredientCell');
      archiveBuildableIngredientCellIns.init(self.mapIns);
      archiveBuildableIngredientCellIns.setData(title, ingredientList);
      safelyAddChild(self.archiveIngredientListNode, archiveBuildableIngredientCellNode);
      archiveBuildableIngredientCellIns.refresh();
      let ingredientCellList = archiveBuildableIngredientCellIns.getIngredientCellList();
      for (let j = 0; j < ingredientCellList.length; j++) {
        const archiveIngredientCellIns = ingredientCellList[j];
        if (null != archiveIngredientCellIns) {
          archiveIngredientCellIns.onUnlockedCellClicked = function() {
            self.mapIns.showIngredientCellInfoPanel(archiveIngredientCellIns);
          };
          archiveIngredientCellIns.onPurchasing = function() {
            self.mapIns.showIngredientCellInfoPanel(archiveIngredientCellIns);
          }
          archiveIngredientCellIns.onLockedCellClicked = function() {
            let buildableAndLevel = self.mapIns.getBuildableAndLevelForUnlockingIngredient(archiveIngredientCellIns.ingredient.id); 
            self.showTip(
              cc.js.formatStr(
                i18n.t("IdleStatefulBuildableInstanceInfoPanel.Tip.unlockBuildableToLevel"),
                i18n.t("BuildingInfo.DisplayName." + buildableAndLevel.statelessBuildableInstance.displayName),
                buildableAndLevel.level
              )
            );
          }
        }
      }
    };
    self.archiveIngredientListNode.getComponentsInChildren(cc.Layout).forEach(function(layout) {
      layout.updateLayout();
    });
    // TODO: 暂时以下方的方法解决启动时闪烁的问题
    self.archiveIngredientListNode.opacity = 0;
    self.scheduleOnce(function() {
      self.archiveIngredientListNode.opacity = 255;
    }, 0.1);
  },

  onCollectButtonClicked(evt) {
    const self = this;
    if (null == self.statefulBuildableInstance) {
      return;
    }
    try {
      let toCollectIncomeNode = self.statefulBuildableInstance.node.toCollectIncomeNode;
      let toCollectIncomeIns = toCollectIncomeNode.getComponent('ToCollectIncome');
      toCollectIncomeIns.onCollect(null);
      self.refreshGoldStorageProgressBar();
    } catch (e) {
      console.warn(e);
      self.goldStorageProgressBar.active = false;
    }
  },

  onVidAdBtnClicked(evt) {
    const self = this;
    const mapIns = self.mapIns;
    if (null != evt) {
      mapIns.playEffectCommonButtonClick();
    }
    try {
      let toCollectIncomeNode = self.statefulBuildableInstance.node.toCollectIncomeNode;
      let toCollectIncomeIns = toCollectIncomeNode.getComponent('ToCollectIncome');
      self.vidAdBtn.interactable = false;
      self.mapIns.watchVidAdToGainMoreGoldCount(function() {
        toCollectIncomeIns.setData(toCollectIncomeIns.cachedGoldCount * 2);
        toCollectIncomeIns.onCollect(null);
        self.refreshGoldStorageProgressBar();
        self.vidAdBtn.interactable = true;
      }, function(err) {
        const simplePressToGoDialogNode = cc.instantiate(mapIns.simplePressToGoDialogPrefab);
        simplePressToGoDialogNode.setPosition(cc.v2(0, 0));
        const simplePressToGoDialogScriptIns = simplePressToGoDialogNode.getComponent("SimplePressToGoDialog");
        simplePressToGoDialogScriptIns.mapIns = mapIns;
        simplePressToGoDialogScriptIns.onCloseDelegate = () => {
          mapIns.exitPanelView(simplePressToGoDialogScriptIns);
        };
        if (constants.ADMOB_ERROR_CODE.UNKNOWN == err || constants.ADMOB_ERROR_CODE.NO_FILL == err) {
          simplePressToGoDialogScriptIns.setHintLabel(i18n.t("VideoAd.Error.NoFill"));
        } else {
          simplePressToGoDialogScriptIns.setHintLabel(i18n.t("VideoAd.Tip.gainGold"));
        }
        mapIns.enterPanelView(simplePressToGoDialogScriptIns);
        self.vidAdBtn.interactable = true;
      })
    } catch (e) {
      console.warn(e);
      self.goldStorageProgressBar.active = false;
      self.vidAdBtn.interactable = true;
    }
  },

  showTip(tip="") {
    const self = this;
    self.tipContainer.stopAllActions();
    self.tipContainer.opacity = 255;
    self.tipLabel.string = tip;
    self.tipContainer.runAction(
      cc.sequence(
        cc.delayTime(self.tipStayDurationMillis / 1000),
        cc.fadeOut(0.5)
      )
    );
  },
});
