const StateBasedFactory = require('./modules/StateBasedFactory');
const HousekeeperCellState = require('./HousekeeperCell').STATE;
const CloseableDialog = require('./CloseableDialog');
const i18n = require('LanguageData');

const ClassOption = StateBasedFactory(HousekeeperCellState, HousekeeperCellState.LOCKED);

Object.assign(ClassOption.properties, {
  unlockTrigger: cc.Button,
  spriteListNode: cc.Node,
  displayNameLabel: cc.Label,
  descriptionLabel: cc.Label,
  buildableDisplayNameRichText: cc.RichText,
  onDutyDurationRichText: cc.RichText,
  restDurationRichText: cc.RichText,
  elapsedTimeHintLabel: cc.Label,
  elapsedTimeRichText: cc.RichText,
  unlockRequiredGoldLabel: cc.Label,
  boostTrigger: cc.Button,
  boostRequiredDiamondLabel: cc.Label,
  upgradeTrigger: cc.Button,
});
Object.assign(ClassOption, {
  extends: CloseableDialog,
  ctor() {
    this.animComp = null;
    this.animationName = {
      onDuty: "Staying_BottomRight",
      rest: "Resting_BottomRight",
      employable: "Ordering_BottomRight",
    };
  },
  onLoad() {
    const self = this;
    CloseableDialog.prototype.onLoad && CloseableDialog.prototype.onLoad.apply(self, arguments);
    // Initialization of unlockTrigger Event. [begin]
    const unlockTriggerClickHandler = new cc.Component.EventHandler();
    unlockTriggerClickHandler.target = self.node;
    unlockTriggerClickHandler.component = self.node.name;
    unlockTriggerClickHandler.handler = 'onUnlocking';
    self.unlockTrigger.clickEvents = [
      unlockTriggerClickHandler,
    ];
    // Initialization of unlockTrigger Event. [end]
    // Initialization of unlockTrigger Event. [begin]
    const boostTriggerClickHandler = new cc.Component.EventHandler();
    boostTriggerClickHandler.target = self.node;
    boostTriggerClickHandler.component = self.node.name;
    boostTriggerClickHandler.handler = 'onBoosting';
    self.boostTrigger.clickEvents = [
      boostTriggerClickHandler,
    ];
    // Initialization of boostTrigger Event. [end]
    // Initialization of unlockTrigger Event. [begin]
    const upgradeTriggerClickHandler = new cc.Component.EventHandler();
    upgradeTriggerClickHandler.target = self.node;
    upgradeTriggerClickHandler.component = self.node.name;
    upgradeTriggerClickHandler.handler = 'onUpgradeing';
    self.upgradeTrigger.clickEvents = [
      upgradeTriggerClickHandler,
    ];
    // Initialization of upgradeTrigger Event. [end]
  },

  update(dt) {
    const self = this;
    CloseableDialog.prototype.update && CloseableDialog.prototype.update.apply(self, arguments);
    if (null == self.mapIns) {
      return;
    }
    const targetHousekeeperNpc = self.mapIns.housekeeperNpcDict[self.buildableId];
    if (null == targetHousekeeperNpc) {
      return;
    }
    // Npc is confirmed to be exists.
    if (null == self.housekeeperBinding || null == self.housekeeperBinding.lastPeriodStartedAt || 0 == self.housekeeperBinding.lastPeriodStartedAt) {
      self.unlockRequiredGoldLabel.node.color = self.mapIns.wallet.gold >= self.unlockRequiredGold ? cc.Color.WHITE : cc.color("#DE5244");
      return;
    }
    if (null == self.onDutyDurationMillis || null == self.restDurationMillis) {
      return;
    }
    let elapsedTimeMillis = 0;
    if (targetHousekeeperNpc.isOnDuty()) {
      self.boostTrigger.node.active = false;
      self.elapsedTimeHintLabel.string = i18n.t("Housekeeper.Tip.elapsedOnDutyTime");
      elapsedTimeMillis = self.onDutyDurationMillis - (Date.now() - self.housekeeperBinding.lastPeriodStartedAt);
      if (self.animComp.animationName != self.animationName.onDuty) {
        self.animComp.playAnimation(self.animationName.onDuty);
      }
    } else if (targetHousekeeperNpc.isRest()) {
      self.elapsedTimeHintLabel.string = i18n.t("Housekeeper.Tip.elapsedRestTime");
      elapsedTimeMillis = self.restDurationMillis - (Date.now() - self.housekeeperBinding.lastPeriodStartedAt - self.onDutyDurationMillis);
      self.boostTrigger.node.active = true;
      let requiredDiamonds = self.mapIns.countDiamondForBoostDurationMillis(elapsedTimeMillis);
      self.boostRequiredDiamondLabel.string = requiredDiamonds;
      self.boostRequiredDiamondLabel.node.color = self.mapIns.wallet.diamond >= requiredDiamonds ? cc.Color.WHITE : cc.color("#DE5244");
      if (self.animComp.animationName != self.animationName.rest) {
        self.animComp.playAnimation(self.animationName.rest);
      }
    }
    self.elapsedTimeRichText.string = cc.js.formatStr(i18n.t("Tip.boldFont"), secondsToNaturalExp(Math.floor(elapsedTimeMillis / 1000)));
  },

  init(mapIns) {
    const self = this;
    self.mapIns = mapIns;
  },

  setData(buildableId, housekeeperBinding) {
    const self = this;
    self.buildableId = buildableId;
    self.housekeeperBinding = housekeeperBinding;
  },

  refresh() {
    const self = this;
    const buildableId = self.buildableId;
    const housekeeperBinding = self.housekeeperBinding;
    const housekeeperConfigured = constants.HOUSEKEEPER["BUILDABLEID_" + buildableId];
    const housekeeperLevelBinding = housekeeperConfigured.LEVEL_BINDINGS[null != housekeeperBinding ? housekeeperBinding.currentLevel : 1];
    
    self.onDutyDurationMillis = housekeeperLevelBinding.ON_DUTY_DURATION_MILLIS;
    self.restDurationMillis = housekeeperLevelBinding.REST_DURATION_MILLIS;
    self.unlockRequiredGold = housekeeperLevelBinding.UNLOCK_OR_UPGRADE_REQUIRED_GOLD;

    let speciesName = housekeeperConfigured.NAME;
    let spriteFrameName = constants.NPC_ANIM.NAME[speciesName];
    if (null == spriteFrameName) {
      console.warn('You may forget to config the NPC_ANIM.NAME of', speciesName);
    }
    for (let node of self.spriteListNode.children) {
      if (node.name != spriteFrameName) {
        node.active = false;
      } else {
        node.active = true;
        self.animComp = node.getComponent(dragonBones.ArmatureDisplay);
        self.animComp._init();
        self.animComp.playAnimation("Staying_BottomLeft");
      }
    }

    if (null == housekeeperBinding) {
      self.state = HousekeeperCellState.LOCKED;
      self.animComp.playAnimation(self.animationName.employable);
    } else if (null == housekeeperBinding.lastPeriodStartedAt || 0 == housekeeperBinding.lastPeriodStartedAt) {
      self.state = HousekeeperCellState.EMPLOYABLE;
      self.animComp.playAnimation(self.animationName.employable);
    } else {
      // TODO: 实现管家的多等级
      const housekeeperNextLevelBinding = housekeeperConfigured.LEVEL_BINDINGS[housekeeperBinding.currentLevel+1];
      if (null == housekeeperNextLevelBinding) {
        self.state = HousekeeperCellState.MAX_LEVEL;
        self.animComp.playAnimation(self.animationName.onDuty);
      } else {
        self.state = HousekeeperCellState.UPGRADABLE;
        self.animComp.playAnimation(self.animationName.onDuty);
      }
    }
    
    self.displayNameLabel.string = i18n.t('Housekeeper.DisplayName.' + housekeeperConfigured.NAME);
    self.descriptionLabel.string = i18n.t('Housekeeper.Description.' + housekeeperConfigured.NAME);
    self.onDutyDurationRichText.string = cc.js.formatStr(i18n.t("Tip.boldFont"), secondsToNaturalExp(self.onDutyDurationMillis / 1000));
    self.restDurationRichText.string = cc.js.formatStr(i18n.t("Tip.boldFont"), secondsToNaturalExp(self.restDurationMillis / 1000));
    
    let statelessBuildableInstance = self.mapIns.statelessBuildableInstanceList.find((x) => {
      return x.id == buildableId;
    });
    self.buildableDisplayNameRichText.string = cc.js.formatStr(i18n.t("Tip.boldFont"), i18n.t(
      "BuildingInfo.DisplayName." + statelessBuildableInstance.displayName
    ));
    self.unlockRequiredGoldLabel.string = self.unlockRequiredGold;
    self.elapsedTimeHintLabel.string = "----";
    self.elapsedTimeRichText.string = "";
  },

  onUnlocking(evt) {
    const self = this;
    if (null != evt) {
      self.mapIns.playEffectCommonButtonClick();
    }
    self.mapIns.unlockHousekeeperNpc(self.unlockRequiredGold, self.buildableId, self.housekeeperBinding, function() {
      self.refresh();
    }); 
  },

  onBoosting(evt) {
    const self = this;
    if (null != evt) {
      self.mapIns.playEffectCommonButtonClick();
    }
    let elapsedTimeMillis = self.restDurationMillis - (Date.now() - self.housekeeperBinding.lastPeriodStartedAt - self.onDutyDurationMillis);
    if (0 >= elapsedTimeMillis) {
      return;
    }
    self.mapIns.boostHosekeeperNpcBackToWork(self.mapIns.countDiamondForBoostDurationMillis(elapsedTimeMillis), self.buildableId, self.housekeeperBinding, function() {
      self.update();
    });
  },

  onUpgradeing(evt) {
    const self = this;
    if (null != evt) {
      self.mapIns.playEffectCommonButtonClick();
    }
    self.mapIns.showHousekeeperChangeConfirmationPanel(self.housekeeperBinding);
  },

});

cc.Class(ClassOption);

