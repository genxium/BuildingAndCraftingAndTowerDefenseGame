/*
[WARNING]

Not yet extending from ProgressNum due to unknown risk and seemingly not very relevant.

-- YFLu, 2019-09-27
*/
cc.Class({
  extends: cc.Component, 

  properties: {
    prefixLabel: cc.Label,
    countLabel: cc.Label,
    tailNode: cc.Node,
    remainingAvailableTimeCountdown: cc.ProgressBar,
    progressInnerBarNode: cc.Node,
  },
    
  ctor() {
    this.mapIns = null;
    this.cumulativeCount = 0;
    this.toleranceDurationMillis = 4000; // Should change w.r.t. "this.cumulativeCount". -- YFLu, 2019-09-27
    this.lastFedAt = null; // In "milliseconds".
    this.onToleranceEnded = null;
    this.comboRules = [];
  },

  init(mapIns, onToleranceEnded, newToleranceDurationMillis) {
    this.mapIns = mapIns;
    if (null != onToleranceEnded) {
      this.onToleranceEnded = onToleranceEnded;
    }
    if (null != newToleranceDurationMillis) {
      this.toleranceDurationMillis = newToleranceDurationMillis;
    }
    this.comboRules = constants.COMBO_RULE;
  },

  feed() {
    const self = this;
    if (null == this.node || false == this.node.active) {
      return;
    }

    const scaleSeq = cc.sequence([
      cc.scaleTo(0.1, 1.2).easing(cc.easeIn(3.0)),
      cc.scaleTo(0.1, 1.0).easing(cc.easeOut(3.0))
    ]);
    const fadeInAndScaleSpawn = cc.spawn([
      cc.fadeIn(0.2),
      scaleSeq
    ]);
    this.node.runAction(fadeInAndScaleSpawn);
    this.lastFedAt = Date.now();
    this.progressInnerBarNode.color = cc.Color.GREEN;

    this.cumulativeCount = this.cumulativeCount + 1;  
    this.countLabel.string = this.cumulativeCount;

    // The following calculation is according to frontend todo #86.8.
    let comboRule = self.findTheCurrentMatchedRule();
    if (null != comboRule) {
      this.toleranceDurationMillis = comboRule.durationMillis;
    } else {
      this.toleranceDurationMillis = 1200;
    }

    setTimeout(() => {
      if (null == self.node || false == self.node.active) {
        return;
      }
      const fadeOut = cc.fadeOut(1.5 * (self.toleranceDurationMillis / 1000));
      self.node.runAction(fadeOut);
    }, 200);
  },

  update(dt) {
    if (null == this.lastFedAt) {
      return;
    }
    const nowMillis = Date.now();
    const elapsedMillis = nowMillis - this.lastFedAt; 
    const remainingAvailableMillis = this.toleranceDurationMillis - elapsedMillis;
    const progressToDisplay = (remainingAvailableMillis/this.toleranceDurationMillis); 
    if (0 >= progressToDisplay) {
      if (null != this.onToleranceEnded) {
        this.onToleranceEnded(this.cumulativeCount, this.findTheCurrentMatchedRule());
        if (this.node && this.node.parent) {
          this.node.removeFromParent();
        }
        this.cumulativeCount = 0;
      }
    } else {
      this.remainingAvailableTimeCountdown.progress = progressToDisplay; 
      if (progressToDisplay <= 0.2) {
        this.progressInnerBarNode.color = cc.Color.RED;
        return;
      } 
      if (progressToDisplay <= 0.5) {
        this.progressInnerBarNode.color = cc.Color.ORANGE;
        return;
      } 
    }
  },

  finish() {
    const self = this;
    this.lastFedAt = null;
    if (null != this.onToleranceEnded) {
      this.onToleranceEnded(this.cumulativeCount, this.findTheCurrentMatchedRule());
      if (this.node && this.node.parent) {
        this.node.removeFromParent();
      }
      this.cumulativeCount = 0;
    }
  },

  findTheCurrentMatchedRule() {
    const self = this;
    for (let comboRule of self.comboRules) {
      switch (comboRule.compare) {
      case "<=":
        if (self.cumulativeCount <= comboRule.comboCount) {
          return comboRule;
        }
      break;
      case ">":
        if (self.cumulativeCount > comboRule.comboCount) {
          return comboRule;
        }
      break;
      }
    }
    console.warn('the comboRule is not found, you may need to configure the constants.COMBO_RULE', self.culmulatedGoldCount);
    return null;
  },

});
