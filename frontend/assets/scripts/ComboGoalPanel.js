const ConfirmationPanel = require('./ConfirmationPanel');
const i18n = require('LanguageData');

cc.Class({
  extends: ConfirmationPanel,
  properties: {
    goldLabel: cc.Label,
    goldContainerNode: cc.Node,
    diamondLabel: cc.Label,
    diamondContainerNode: cc.Node,
    comboRewardListNode: cc.Node,
    comboRewardCellPrefab: cc.Prefab,
    vidAdBtn: cc.Button,
  },

  onLoad() {
    const self = this;
    ConfirmationPanel.prototype.onLoad.apply(this, arguments);
    const vidAdHander = new cc.Component.EventHandler();
    vidAdHander.target = self;
    vidAdHander.component = self.node.name;
    vidAdHander.handler = "onVidAdBtnClicked";
    self.vidAdBtn.clickEvents = [
      vidAdHander
    ];
  },

  init(mapIns) {
    const self = this;
    self.mapIns = mapIns;
    self.comboRules = constants.COMBO_RULE;
  },

  setData(price, resouceType) {
    const self = this;
    switch (resouceType) {
    case constants.RESOURCE_TYPE.GOLD:
      self.goldLabel.string = price;
      self.diamondContainerNode.active = false;
      self.goldContainerNode.active = true;
      self.goldLabel.node.color = self.mapIns.wallet.gold >= price ? cc.color('#161616') : cc.color('#DE5244');
      break;
    case constants.RESOURCE_TYPE.DIAMOND:
      self.diamondLabel.string = price;
      self.goldContainerNode.active = false;
      self.diamondContainerNode.active = true;
      self.diamondLabel.node.color = self.mapIns.wallet.diamond >= price ? cc.color('#161616') : cc.color('#DE5244');
      break;
    }
    self.comboRewardListNode.removeAllChildren();
    for (let rule of self.comboRules) {
      const cellNode = cc.instantiate(self.comboRewardCellPrefab);
      switch (rule.compare) {
      case "<=":
        cellNode.getComponent('ComboRewardCell').setData(
          cc.js.formatStr(i18n.t('ComboGoalPanel.Tip.rewardLessThan'), rule.comboCount),
          rule.rewardedGold, rule.rewardedDiamond
        );
        break;
      case ">":
        cellNode.getComponent('ComboRewardCell').setData(
          cc.js.formatStr(i18n.t('ComboGoalPanel.Tip.rewardLargeThan'), rule.comboCount),
          rule.rewardedGold, rule.rewardedDiamond
        );
        break;
      }
      self.comboRewardListNode.addChild(cellNode);
    }
  },

  onVidAdBtnClicked() {
    console.warn('Please Override this function: onVidAdBtnClicked!');
  },

})

