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
    // Warning, the maxProgressListTipContainer tip should have this struct of node tree:
    // NodeItSelf
    //   Icon
    //     Farmland
    //     Restaurant
    //     Bakery
    //   Value
    maxProgressListTipContainer: cc.Node,
  },

  onLoad() {
    CloseableDialog.prototype.onLoad.call(this);
    this.initButtonListener();
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
    CloseableDialog.prototype.onEnable && CloseableDialog.prototype.onEnable.apply(this, arguments);
    this.refreshLabelAndProgressBar();
    this.refreshInteractableButton();
    this.refreshAnimation();
    this.refreshProperties();
  },

  refreshProperties() {
    const self = this;
    let maxProgressListTipIcons, maxProgressListTipLabel;
    self.infomationLabel.string = i18n.t('StatefulBuildableInstanceInfoPanel.Info.' + self.statefulBuildableInstance.displayName);
    switch (self.statefulBuildableInstance.id) {
    case constants.STATELESS_BUILDABLE_ID.FARMLAND:
    case constants.STATELESS_BUILDABLE_ID.RESTAURANT:
    case constants.STATELESS_BUILDABLE_ID.BAKERY:
      self.maxProgressListTipContainer.active = true;
      maxProgressListTipIcons = self.maxProgressListTipContainer.getChildByName('Icon');
      if (null != maxProgressListTipIcons) {
        maxProgressListTipIcons.children.forEach(function(node) {
          node.active = node.name == self.statefulBuildableInstance.displayName;
        });
      }
      maxProgressListTipLabel = self.maxProgressListTipContainer.getChildByName('Value');
      if (null != maxProgressListTipLabel) {
        maxProgressListTipLabel.getComponent(cc.Label).string = i18nExtend.render(
          'StatefulBuildableInstanceInfoPanel.Tip.MaxProgressListLength.' + self.statefulBuildableInstance.displayName,
          constants.INGREDIENT_PROGRESS_MAX_PER_PLAYER_BUILDABLE_BINDING
        );
      }
      break;
    default:
      self.maxProgressListTipContainer.active = false;
      break;
    }
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

    self.goldStorageProgressBar.active = false;

    if (this.statefulBuildableInstance.id == constants.STATELESS_BUILDABLE_ID.HEADQUARTER) {
      self.goldStorageProgressBar.active = true;
      let gold = mapIns.wallet.gold;
      let goldLimit = mapIns.wallet.goldLimit;
      progressBarScript.setData(gold, goldLimit);
      this.goldStorageLabel.string = cc.js.formatStr(i18n.t("Tip.goldStorage"), gold) + "/" + goldLimit;
    } else if (this.statefulBuildableInstance.id == constants.STATELESS_BUILDABLE_ID.RESTAURANT) {
      let maxBaseGoldProductionRate = 0;
      this.statefulBuildableInstance.levelConfs.forEach((levelConf) => {
        maxBaseGoldProductionRate = Math.max(levelConf.baseGoldProductionRate, maxBaseGoldProductionRate);
      });
      progressBarScript.setData(this.statefulBuildableInstance.currentBaseGoldProductionRate, maxBaseGoldProductionRate);
      let currentBaseGoldProductionRatePerHour = Math.round(this.statefulBuildableInstance.currentBaseGoldProductionRate * 3600);
      this.goldStorageLabel.string = i18n.t("Tip.goldProductionRate") + currentBaseGoldProductionRatePerHour + "/h";
    }
  },

  refreshLabelAndProgressBar() {
    this.maxLevelLabel.node.active = false;
    if (this.statefulBuildableInstance.isLevelReachMaxLevel()) {
      this.maxLevelLabel.node.active = true;
    }

    this.refreshGoldStorageProgressBar();
  },

  refreshData() {
    this.setInfo(this.statefulBuildableInstance);
  },

  update() {
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
});
