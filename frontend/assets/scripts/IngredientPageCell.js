const IngredientCell = require("./IngredientCell");
cc.Class({
  extends: IngredientCell,
  properties: {
    sprites: [cc.Sprite],
    purelyCount: {
      tooltip: `if true, the showCount will not have prefix 'x'.`,
      default: false,
    },
  },
  toDisabledView() {
    const self = this;
    IngredientCell.prototype.toDisabledView.apply(self, arguments);
    const GraySpriteMaterial = cc.Material.getBuiltinMaterial('2d-gray-sprite');
    self.sprites.forEach((sprite) => {
      sprite.setMaterial(0, GraySpriteMaterial);
    });
  },

  toEnabledView() {
    const self = this;
    IngredientCell.prototype.toEnabledView.apply(self, arguments);
    const SpriteMaterial = cc.Material.getBuiltinMaterial('2d-sprite');
    self.sprites.forEach((sprite) => {
      sprite.setMaterial(0, SpriteMaterial);
    });
  },

  getShowCountString() {
    const self = this;
    return self.purelyCount ? self.getShowCount() : `x ${self.getShowCount()}`;
  },

});
