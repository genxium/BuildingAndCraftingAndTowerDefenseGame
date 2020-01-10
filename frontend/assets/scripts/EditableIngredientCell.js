const IngredientPageCell = require('./IngredientPageCell');

cc.Class({
  extends: IngredientPageCell,
  properties: {
    minusButton: cc.Button,
  },
  onLoad() {
    const self = this;
    IngredientPageCell.prototype.onLoad.apply(self, arguments);
    if (null != self.minusButton) {
      let minusButtonClickEvent = new cc.Component.EventHandler();
      minusButtonClickEvent.target = self.node;
      minusButtonClickEvent.component = 'EditableIngredientCell';
      minusButtonClickEvent.handler = '_minusButtonClicked';
      self.minusButton.clickEvents = [
        minusButtonClickEvent,
      ];
    }
  },
  _minusButtonClicked(evt) {
    const self = this;
    if (null != evt) {
      if (null != self.mapIns) {
        self.mapIns.playEffectCommonButtonClick();
      }
    }
    self.onIngredientMinus && self.onIngredientMinus(self.data, self.ingredient);
  },
  toEnabledView() {
    const self = this;
    self.minusButton.interactable = true;
    IngredientPageCell.prototype.toEnabledView.apply(self, arguments);
  },
  toDisabledView() {
    const self = this;
    self.minusButton.interactable = false;
    IngredientPageCell.prototype.toDisabledView.apply(self, arguments);
  },
})

