cc.Class({
  extends: cc.Component,
  properties: {
    goldPriceLabel: cc.Label,
    diamondPriceLabel: cc.Label,
    hintLabel: cc.Label,
  },

  setData(hintStr, goldPrice, diamondPrice) {
    const self = this;
    self.hintLabel.string = hintStr;
    self.goldPriceLabel.string = goldPrice;
    self.diamondPriceLabel.string = diamondPrice;
  },
})
