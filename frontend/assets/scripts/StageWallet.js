cc.Class({
  extends: cc.Component,
  properties: {
    _diamondValue: {
      default: null,
      serializable: false,
    },
    _starValue: {
      default: null,
      serializable: false,
    },
    star: {
      get() {
        return this._starValue || 0;
      },
      set(val) {
				if (val == this._starValue) {
				  return;
				}
				let starProgressNum = this.starNode.getComponent('ProgressNum'),
            prevVal = this._starValue;
				starProgressNum.instantStart = true;
				starProgressNum.setData(val, val);
				this._starValue = val;
        this.onStarUpdated(prevVal, val);
      },
    },
    diamond: {
      get() {
        return this._diamondValue || 0;
      },
      set(val) {
				if (val == this._diamondValue) {
				  return;
				}
				let diamondProgressNum = this.diamondNode.getComponent('ProgressNum'),
            prevVal = this._diamondValue;
				diamondProgressNum.instantStart = true;
				diamondProgressNum.setData(val, this.diamondLimit);
				this._diamondValue = val;
        this.onDiamondUpdated(prevVal, val);
      }
    },
    diamondLimit: 30,
    diamondNode: cc.Node,
    starNode: cc.Node,
  },

  setData(starCount, diamondCount) {
    const self = this;
		self.star = starCount;
		self.diamondCount = diamondCount;
  },

  ctor() {
    this.stageSelectionScriptIns = null;
  },

  onLoad() {
    if (false == this.stageSelectionScriptIns.iapEnabled) {
      this.diamondNode.active = false;
    }
  },
  onStarUpdated(prevVal, val) {},
  onDiamondUpdated(prevVal, val) {},
})
