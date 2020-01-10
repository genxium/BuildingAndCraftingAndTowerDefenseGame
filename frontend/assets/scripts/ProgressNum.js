cc.Class({
  extends: cc.Component,

  properties: {
    animationDurationMillis: {
      default: 4000,
    },
    indicatorLabel: {
      type: cc.Label,
      default: null,
    },
    progressBar: {
      type: cc.ProgressBar,
      default: null,
    },
    instantStart: {
      default: false,
    },
    isForElapsedTimeProgress: {
      default: false,
    },
    eps: 0.001,
    progressBarReverse: {
      tooltip: 'The progress will be minus by 1 if this flag is true.',
      default: false,
    },
  },

  // LIFE-CYCLE CALLBACKS:
  ctor() {
    this.startedAtMillis = null;
    this.currentlyDisplayingQuantity = null;
    this.targetQuantity = null;
    this.maxValue = null;
    this.previousMaxValue = null;
    this.waivedMillis = 0;
    if (this.isForElapsedTimeProgress) {
      this.animationDurationMillis = 1000;
    }
  },

  onLoad() {},

  incrementWaivedMillis(val) {
    this.waivedMillis += val;
  },

  setData(targetQuantity, maxValue, specifiedStartedAtMillis) {
    this.previousMaxValue = this.maxValue;
    this.maxValue = maxValue;
    this.targetQuantity = targetQuantity;

    this.toBeAnimatedProgressDistance = Math.abs(this.targetQuantity - this.currentlyDisplayingQuantity);

    if (null == specifiedStartedAtMillis) {
      if (this.isForElapsedTimeProgress) {
        this.startedAtMillis = Date.now();
      }
    } else {
      this.startedAtMillis = specifiedStartedAtMillis;
    }
    if (this.isForElapsedTimeProgress) {
      this.targetQuantity = (Date.now() - this.startedAtMillis); // Overwriting the previous assignment.
      this.currentlyDisplayingQuantity = 0;
      this.toBeAnimatedProgressDistance = Math.abs(this.targetQuantity - this.currentlyDisplayingQuantity); // Overwriting the previous assignment.

      cc.log("Some quantities are now updated to: `targetQuantity` == ", this.targetQuantity, " and `currentlyDisplayingQuantity` == ", this.currentlyDisplayingQuantity, ", `startedAtMillis` == ", this.startedAtMillis, ", `maxValue` == ", this.maxValue, ", and Date.now() == ", Date.now());

    }
  },

  formulateIndicatorLabelStr() {
    if (this.isForElapsedTimeProgress) {
      const elapsedMillis = this.targetQuantity;
      const durationMillis = this.maxValue;
      let remainingMillis = (durationMillis - elapsedMillis);
      if (remainingMillis <= 0) {
        remainingMillis = 0;
      }
      return window.secondsToNaturalExp(remainingMillis / 1000);
    } else {
      if (this.progressBar.progress <= 1) {
        return Math.floor(this.currentlyDisplayingQuantity);
      } else {
        return Math.floor(this.maxValue);
      }
    }
  },

  update(dt) {
    if (this.dt) {
      dt = this.dt;
    }
    if (this.isForElapsedTimeProgress) {
      // In this case, `this.targetQuantity` is just the elapsedMillis.
      this.targetQuantity = (Date.now() - this.startedAtMillis - this.waivedMillis);
    }
    if (null == this.targetQuantity || null == this.maxValue) {
      // A targetQuantity & maxValue is required.
      return;
    }
    let diffQuantity = (this.targetQuantity - this.currentlyDisplayingQuantity);
    if (null != this.currentlyDisplayingQuantity && this.eps > Math.abs(diffQuantity) && this.previousMaxValue == this.maxValue) {
      // An early return for most cases.
      return;
    }

    if (null == this.currentlyDisplayingQuantity) {
      if (this.instantStart) {
        this.currentlyDisplayingQuantity = this.targetQuantity;
      } else {
        this.currentlyDisplayingQuantity = 0;
      }
    }
    diffQuantity = (this.targetQuantity - this.currentlyDisplayingQuantity);
    const sign = (diffQuantity > 0 ? +1 : -1);
    let newSign = sign;
    let newCurrentlyDisplayingQuantity = this.targetQuantity;
    if (this.isForElapsedTimeProgress) {
      newCurrentlyDisplayingQuantity = this.targetQuantity;
      // console.log("Updated cell progress for `isForElapsedTimeProgress`, `newCurrentlyDisplayingQuantity` == ", newCurrentlyDisplayingQuantity, ", newSign == ", newSign, ", from `this.currentlyDisplayingQuantity` == ", this.currentlyDisplayingQuantity, ", `this.targetQuantity` == ", this.targetQuantity);
    } else {
      const animatedQuantityDiff = this.animationDurationMillis == 0 ? this.toBeAnimatedProgressDistance : (this.toBeAnimatedProgressDistance / this.animationDurationMillis) * 1000 * dt;

      newCurrentlyDisplayingQuantity = this.currentlyDisplayingQuantity + sign * animatedQuantityDiff;
      newSign = (this.targetQuantity - newCurrentlyDisplayingQuantity) > 0 ? +1 : -1;
    }
    if (newSign != sign) {
      this.currentlyDisplayingQuantity = this.targetQuantity;
    } else {
      this.currentlyDisplayingQuantity = newCurrentlyDisplayingQuantity;
    }
    let progress = (this.currentlyDisplayingQuantity / this.maxValue);
    if (progress < 0) {
      progress = 0;
    } else if (progress > 1) {
      progress = 1;
    }
    this.progressBar.progress = this.progressBarReverse ? 1 - progress : progress;
    this.indicatorLabel.string = this.formulateIndicatorLabelStr();
    this.previousMaxValue = this.maxValue;
  },
});

