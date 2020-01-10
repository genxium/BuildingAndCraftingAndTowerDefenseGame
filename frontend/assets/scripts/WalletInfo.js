cc.Class({
  extends: cc.Component,

  properties: {
    mapNode: {
      type: cc.Node,
      default: null
    },
    goldNode: {
      type: cc.Node,
      default: null
    },
    diamondNode: {
      type: cc.Node,
      default: null,
    },
    goldLabel: {
      type: cc.Label,
      default: null
    },
    diamondLabel: {
      type: cc.Label,
      default: null
    },
    goldTip: {
      type: cc.Node,
      default: null
    },
    currentGoldLimitLabel: {
      type: cc.Label,
      default: null,
    },
  },

  init(mapIns) {
    this.mapIns = mapIns;
    this.goldNode.getComponent("ProgressNum").eps = 0;
  },

  update(dt) {},

  setData(newWalletData) {
    const self = this;
    const mapIns = self.mapIns;
    /*
    * This method simultaneously updates the model data `mapScriptIns.wallet` and the corresponding GUI elements such as "cc.Label"s and "cc.ProgressBar"s.
    */

    // Phase#1 Model data updates.
    if (newWalletData) {
      // console.log("Assigning newWalletData to mapIns.wallet", newWalletData);
      Object.assign(mapIns.wallet, newWalletData);
    }
    // Fixing invalid values or initializing.
    mapIns.wallet = {
      diamond: (null == mapIns.wallet.diamond ? 0 : mapIns.wallet.diamond),
      gold: (null == mapIns.wallet.gold ? 0 : mapIns.wallet.gold),
      goldLimit: (null == mapIns.wallet.goldLimit ? 0 : mapIns.wallet.goldLimit),
      totalFoodProductionRate: (null == mapIns.wallet.totalFoodProductionRate ? 100 : mapIns.wallet.totalFoodProductionRate),
      residentsCount: (null == mapIns.wallet.residentsCount ? 5 : mapIns.wallet.residentsCount),
      residentsCountLimit: (null == mapIns.wallet.residentsCountLimit ? 10 : mapIns.wallet.residentsCountLimit),
      excessiveResidentsCount: (null == mapIns.wallet.excessiveResidentsCount ? 5 : mapIns.wallet.excessiveResidentsCount),
    };
    for (let key in mapIns.wallet) {
      let val = mapIns.wallet[key];
      if (isNaN(val)) {
        throw `NaN value obtained! ${key} - ${val}`;
      } 
    }

    // 收金币后可能出现小数，韦爷说往多了给
    mapIns.wallet.gold = Math.ceil(mapIns.wallet.gold);

    // 防止金币超出上限
    mapIns.wallet.gold = Math.min(mapIns.wallet.gold, mapIns.wallet.goldLimit);
    
    // Phase#2 GUI updates.
    self.diamondLabel.string = mapIns.wallet.diamond;

    let quantityLimitPopupIns = self.goldTip.getComponent('QuantityLimitPopup');
    quantityLimitPopupIns.currentLimit.string = mapIns.wallet.goldLimit;

    let progressBarScript = self.goldNode.getComponent("ProgressNum");
		progressBarScript.setData(mapIns.wallet.gold, mapIns.wallet.goldLimit);
  }, 

  goldButtonOnClick() {
    const self = this;
    if (true == this.goldTip.active) {
      window.removeCurrentlyShowingQuantityLimitPopup();
    } else {
      window.showQuantityLimitPopup(self.goldTip);
    }
  },

});
