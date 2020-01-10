const StateBasedFactory = require('./modules/StateBasedFactory');
const i18n = require('LanguageData');

const HousekeeperCellState = cc.Enum({
  LOCKED: 0,
  EMPLOYABLE: 1,
  UPGRADABLE: 2,
  MAX_LEVEL: 3,
});

const ClassOption = StateBasedFactory(HousekeeperCellState, HousekeeperCellState.LOCKED);
Object.assign(ClassOption.properties, {
  infoTrigger: cc.Button,
  upgradeTrigger: cc.Button,
  spriteListNode: cc.Node,
  displayNameLabel: cc.Label,
});
Object.assign(ClassOption, {
  extends: cc.Component,
  onLoad() {
    const self = this;
    // Initialization of infoTrigger Event. [begin]
    const infoTriggerHandler = new cc.Component.EventHandler();
    infoTriggerHandler.target = self.node;
    infoTriggerHandler.component = self.node.name;
    infoTriggerHandler.handler = 'onClicked';
    self.infoTrigger.clickEvents = [
      infoTriggerHandler,
    ];
    // Initialization of infoTrigger Event. [end]
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
    if (null == housekeeperBinding) {
      self.state = HousekeeperCellState.LOCKED;
    } else if (null == housekeeperBinding.lastPeriodStartedAt || 0 == housekeeperBinding.lastPeriodStartedAt) {
      self.state = HousekeeperCellState.EMPLOYABLE;
    } else {
      // TODO: 实现管家的多等级
      const housekeeperNextLevelBinding = housekeeperConfigured.LEVEL_BINDINGS[housekeeperBinding.currentLevel+1];
      if (null == housekeeperNextLevelBinding) {
        self.state = HousekeeperCellState.MAX_LEVEL;
      } else {
        self.state = HousekeeperCellState.UPGRADABLE;
      }
    }
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
      }
    }
    self.displayNameLabel.string = i18n.t('Housekeeper.DisplayName.' + housekeeperConfigured.NAME);
  },
  onClicked(evt) {
    const self = this;
    self.mapIns.playEffectCommonButtonClick();
    self.mapIns.showHousekeeperCellInfoPanel(self.buildableId, self.housekeeperBinding);
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

exports.STATE = HousekeeperCellState;
