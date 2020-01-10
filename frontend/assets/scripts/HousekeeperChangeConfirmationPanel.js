const i18n = require('LanguageData');
const CloseableDialog = require('CloseableDialog');
cc.Class({
  extends: CloseableDialog,
  properties: {
    spriteListNode: cc.Node,
    displayNameLabel: cc.Label,
    diffInfoLinePrefab: cc.Prefab,
    diffInfoListNode: cc.Node,
    upgradeBtn: cc.Button,
    upgradeRequiredGoldLabel: cc.Label,
  },
  onLoad() {
    const self = this;
    CloseableDialog.prototype.onLoad.call(self);
    // Initialization of confirmationBtn. [begin] {
    const upgradeBtnHandle = new cc.Component.EventHandler();
    upgradeBtnHandle.target = self.node;
    upgradeBtnHandle.component = self.node.name;
    upgradeBtnHandle.handler = 'onUpgradeBtnClicked';
    self.upgradeBtn.clickEvents = [
      upgradeBtnHandle,
    ];
    // Initialization of confirmationBtn. [end] }
  },
  init(mapIns) {
    const self = this;
    self.mapIns = mapIns;
  },
  setData(housekeeperBinding) {
    const self = this;
    self.housekeeperBinding = housekeeperBinding;
  },
  refresh() {
    const self = this;
    const buildableId = self.housekeeperBinding.buildableId;
    const housekeeperBinding = self.housekeeperBinding;
    const housekeeperConfigured = constants.HOUSEKEEPER["BUILDABLEID_" + buildableId];
    const housekeeperCurrentLevelBinding = housekeeperConfigured.LEVEL_BINDINGS[housekeeperBinding.currentLevel];
    const housekeeperNextLevelBinding = housekeeperConfigured.LEVEL_BINDINGS[housekeeperBinding.currentLevel+1];
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
    self.upgradeRequiredGoldLabel.string = housekeeperNextLevelBinding.UNLOCK_OR_UPGRADE_REQUIRED_GOLD;
    self.upgradeRequiredGoldLabel.node.color = self.mapIns.wallet.gold >= housekeeperNextLevelBinding.UNLOCK_OR_UPGRADE_REQUIRED_GOLD ? cc.Color.WHITE : cc.color('#DE5244');
    const diffDict = {
      onDutyDuration: [housekeeperCurrentLevelBinding.ON_DUTY_DURATION_MILLIS / 1000, housekeeperNextLevelBinding.ON_DUTY_DURATION_MILLIS / 1000],
      restDuration: [housekeeperCurrentLevelBinding.REST_DURATION_MILLIS / 1000, housekeeperNextLevelBinding.REST_DURATION_MILLIS / 1000],
    };
    self.diffInfoListNode.removeAllChildren();
    ['onDutyDuration', 'restDuration'].forEach(function(field) {
      let node = cc.instantiate(self.diffInfoLinePrefab);
      let cpn = node.getComponent('DiffInfoLine');
      cpn.render(field, diffDict[field]);
      safelyAddChild(self.diffInfoListNode, node);
    }); 
  },

  onUpgradeBtnClicked(evt) {
    const self = this;
    if (null != evt) {
      self.mapIns.playEffectCommonButtonClick();
    }
    const housekeeperBinding = self.housekeeperBinding;
    const buildableId = housekeeperBinding.buildableId;
    const housekeeperConfigured = constants.HOUSEKEEPER["BUILDABLEID_" + buildableId];
    const housekeeperNextLevelBinding = housekeeperConfigured.LEVEL_BINDINGS[housekeeperBinding.currentLevel+1];
    self.mapIns.upgradeHousekeeperNpc(housekeeperNextLevelBinding.UNLOCK_OR_UPGRADE_REQUIRED_GOLD, buildableId, housekeeperBinding, function() {
      self.onCloseClicked();
    });
  }

})
