const IngredientProgressList = require('./IngredientProgressList');

cc.Class({
    extends: IngredientProgressList,
    properties: {
        reclaimGoldSumLabel: cc.Label,
    },
    refresh() {
        const self = this;
        IngredientProgressList.prototype.refresh.apply(self, arguments);
        self.reclaimGoldSumLabel.string = self
            .getIngredientProgressCells()
            .reduce((sum, reclaimProgressCell) => {
                if (
                    reclaimProgressCell.isCouldCollected()
                    &&
                    reclaimProgressCell.ingredient.reclaimPriceCurrency == constants.INGREDIENT.PRICE_CURRENCY.GOLD
                ) {
                    return sum + reclaimProgressCell.ingredient.reclaimPriceValue;
                } else {
                    return sum;
                }
            }, 0);
    },
});