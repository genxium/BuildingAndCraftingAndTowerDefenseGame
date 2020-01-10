const IngredientCell = require("./IngredientCell.js");
cc.Class({
  extends: IngredientCell,
  properties: {
    decreaseButton: {
      type: cc.Button,
      default: null,
    },
    increaseButton: cc.Button,
  },

  init(mapIns, relatedIngredientCell) {
    const self = this;
    IngredientCell.prototype.init.call(self, mapIns);
    self.relatedIngredientCell = relatedIngredientCell;
    if (self == relatedIngredientCell) {
      cc.warn(`relatedIngredientCell shouldn't be self.`)
      self.relatedIngredientCell = null;
    }

  },

  onLoad() {
    const self = this;
    IngredientCell.prototype.onLoad.call(self);
    // Initialization of decreaseButton. [begins]
    const decreaseEventHanlder = new cc.Component.EventHandler();
    decreaseEventHanlder.target = self.node;
    decreaseEventHanlder.component = "CraftingIngredientCell";
    decreaseEventHanlder.handler = "decrease";
    self.decreaseButton.clickEvents = [
      decreaseEventHanlder,
    ];
    // Initialization of decreaseButton. [ends]
    // Initialization of increaseButton. [begins]
    const increaseEventHanlder = new cc.Component.EventHandler();
    increaseEventHanlder.target = self.node;
    increaseEventHanlder.component = "CraftingIngredientCell";
    increaseEventHanlder.handler = "increase";
    self.increaseButton.clickEvents = [
      increaseEventHanlder,
    ];
    // Initialization of increaseButton. [ends]
  },

  getShowCount() {
    const self = this;
    return self._sessionData.holding;
  },

  getShowCountString() {
    const self = this;
    return self.getShowCount();
  },

  increase() {
    const self = this;
    let prevCount = self.getHoldingCount();
    let count = prevCount + 1;
    if (count <= self.data.currentCount) {
      self.setHoldingCount(count);
      self.onIncrease && self.onIncrease(prevCount, count);
    } else {
      self.setHoldingCount(self.data.currentCount);
      self.onFullSet && self.onFullSet(prevCount, prevCount);
    }
    self.refresh();
  },

  decrease() {
    const self = this;
    let prevCount = self.getHoldingCount();
    let count = prevCount - 1;
    self.setHoldingCount(count);
    if (count <= 0) {
      self.setHoldingCount(0);
      self.onRemoved && self.onRemoved(prevCount, 0);
    } else {
      self.setHoldingCount(count);
      self.onDecrease && self.onDecrease(prevCount, count);
    }
    self.refresh();
  },

  refresh() {
    const self = this;
    IngredientCell.prototype.refresh.call(self);
    if (self.getShowCount() >= self.data.currentCount) {
      self.increaseButton.interactable = false;
    } else {
      self.increaseButton.interactable = true;
    }
  },

})
