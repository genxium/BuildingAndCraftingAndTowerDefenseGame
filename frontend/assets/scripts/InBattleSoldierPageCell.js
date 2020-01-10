const IngredientPageCell = require('./IngredientPageCell');
const ProgressNum = require('./ProgressNum');
cc.Class({
  extends: IngredientPageCell,
  properties: {
    droppingCoolDownProgessNum: ProgressNum,
  },
  ctor() {
    this.isDropable = true;
    this.coolDownDurationMillis = null;
  },
  init(mapIns) {
    const self = this;
    IngredientPageCell.prototype.init.apply(self, arguments);
    self.droppingCoolDownProgessNum.isForElapsedTimeProgress = true;
    self.droppingCoolDownProgessNum.update = function(dt) {
      if (self.mapIns.isPaused()) {
        self.droppingCoolDownProgessNum.incrementWaivedMillis(dt * 1000);
      }
      let prevCurrentlyDisplayingQuantity = self.droppingCoolDownProgessNum.currentlyDisplayingQuantity;
      ProgressNum.prototype.update.apply(this, arguments);
      if (null != self.droppingCoolDownProgessNum.maxValue && 
        self.droppingCoolDownProgessNum.currentlyDisplayingQuantity >= self.droppingCoolDownProgessNum.maxValue &&
        prevCurrentlyDisplayingQuantity < self.droppingCoolDownProgessNum.maxValue) {
        self.onCoolDown();
      }
    };
  },
  startCoolDownDropping() {
    const self = this;
    if (self.coolDownDurationMillis == null) {
      return;
    }
    if (!self.isDropable) {
      return;
    }
    self.isDropable = false;
    self.droppingCoolDownProgessNum.waivedMillis = 0;
    self.droppingCoolDownProgessNum.setData(Date.now(), self.coolDownDurationMillis);
  },
  onCoolDown() {
    const self = this;
    self.isDropable = true;
  },
});

