const ConfirmationPanel = require('./ConfirmationPanel');

cc.Class({
  extends: ConfirmationPanel,
  properties: {
    goldCount: cc.Label,
    goldEnoughColor: {
      default: cc.Color.WHITE,
    },
    goldNotEnoughColor: {
      default: cc.color("#DE5244"),
    },
  },
  setGoldCount(goldCount) {
    const self = this;
    self.goldCount.string = goldCount;
    self.goldCount.node.color = self.mapIns.wallet.gold >= goldCount ? self.goldEnoughColor : self.goldNotEnoughColor;
  },
})

