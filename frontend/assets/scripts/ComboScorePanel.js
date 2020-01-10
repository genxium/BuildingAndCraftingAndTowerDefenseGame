const CloseableDialog = require('./CloseableDialog');
const i18n = require('LanguageData');

cc.Class({
  extends: CloseableDialog,
  properties: {
    culmulatedGoldLabel: cc.Label,
    currentCulmulatedCountLabel: cc.Label,
    maxCulmulatedCountLabel: cc.Label,
    rewardedGoldLabel: cc.Label,
    rewardedDiamondLabel: cc.Label,
    newRecordNode: cc.Node,
  },
  init(mapIns) {
    this.mapIns = mapIns;
  },
  setData(comboCachedMap) {
    const self = this;
    self.culmulatedGoldLabel.string = comboCachedMap.culmulatedGoldCount;
    self.currentCulmulatedCountLabel.string = comboCachedMap.maxCulmulatedCount;
    self.maxCulmulatedCountLabel.string = cc.js.formatStr(
      i18n.t('ComboScorePanel.Tip.maxCulmulatedCount'), 
      Math.max(comboCachedMap.maxCulmulatedCount, comboCachedMap.previousMaxCulmulatedCount)
    );
    self.rewardedGoldLabel.string = comboCachedMap.reward.gold;
    self.rewardedDiamondLabel.string = comboCachedMap.reward.diamond;
    self.newRecordNode.active = comboCachedMap.previousMaxCulmulatedCount < comboCachedMap.maxCulmulatedCount;
  },
})

