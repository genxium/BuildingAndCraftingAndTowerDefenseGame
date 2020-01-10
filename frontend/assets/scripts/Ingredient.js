const i18nExtend = require('./modules/i18n-extends');
const i18nCompiler = new i18nExtend("Ingredient.DisplayName");
cc.Class({
  extends: cc.Component,
  properties: {
    appearance: cc.Sprite,
    displayNameLabel: cc.Label,
    priceCurrencyList: cc.Node,
    priceValueLabel: cc.Label,
    baseProductionDurationMillisLabel: cc.Label,
    reclaimPriceCurrencyList: cc.Node,
    reclaimPriceValueLabel: cc.Label,
    baseReclaimDurationMillisLabel: cc.Label,
  },

  init(mapIns) {
    const self = this;
    self.mapIns = mapIns;
  },

  setData(ingredient) {
    const self = this;
    self.ingredient = ingredient; 
  },

  refresh() {
    const self = this;
    const ingredient = self.ingredient;
    if (null == ingredient) {
      return;
    }
    if (self.displayNameLabel) {
      self.displayNameLabel.string = i18nCompiler.render(ingredient.name);
    }
    if (self.appearance) {
      self.appearance.spriteFrame = ingredient.appearance;
      if (!ingredient.appearance) {
        console.warn("There isn't a appearance for:", ingredient.name);
      }
    }
    if (self.priceCurrencyList) {
      self.priceCurrencyList.children.forEach((node) => {
        node.active = false;
      });
      let targetAppearanceNode = null;
      switch (ingredient.priceCurrency) {
        case constants.INGREDIENT.PRICE_CURRENCY.GOLD:
          targetAppearanceNode = self.priceCurrencyList.getChildByName('Gold');
          break;
        case constants.INGREDIENT.PRICE_CURRENCY.DIAMOND:
          targetAppearanceNode = self.priceCurrencyList.getChildByName('Diamond');
          break;
      }
      if (null != targetAppearanceNode) {
        targetAppearanceNode.active = true;
      }
    }
    if (self.priceValueLabel) {
      self.priceValueLabel.string = ingredient.priceValue;
    }
    if (self.baseProductionDurationMillisLabel) {
      self.baseProductionDurationMillisLabel.string = window.secondsToNaturalExp(ingredient.baseProductionDurationMillis/1000, true);
    }
    if (self.reclaimPriceCurrencyList) {
      self.reclaimPriceCurrencyList.children.forEach((node) => {
        node.active = false;
      });
      let targetAppearanceNode = null;
      switch (ingredient.reclaimPriceCurrency) {
        case constants.INGREDIENT.PRICE_CURRENCY.GOLD:
          targetAppearanceNode = self.reclaimPriceCurrencyList.getChildByName('Gold');
          break;
        case constants.INGREDIENT.PRICE_CURRENCY.DIAMOND:
          targetAppearanceNode = self.reclaimPriceCurrencyList.getChildByName('Diamond');
          break;
      }
      if (null != targetAppearanceNode) {
        targetAppearanceNode.active = true;
      }
    }
    if (self.reclaimPriceValueLabel) {
      self.reclaimPriceValueLabel.string = ingredient.reclaimPriceValue;
    }
    if (self.baseReclaimDurationMillisLabel) {
      self.baseReclaimDurationMillisLabel.string = window.secondsToNaturalExp(ingredient.baseReclaimDurationMillis/1000, true);
    }

  },

})
