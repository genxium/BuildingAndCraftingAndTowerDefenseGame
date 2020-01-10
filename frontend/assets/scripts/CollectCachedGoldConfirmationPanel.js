const ConfirmationPanel = require('./ConfirmationPanel');

cc.Class({
  extends: ConfirmationPanel,
  properties: {
    goldCount: cc.Label,
    vidAdBtn: cc.Button,
  },
  setGoldCount(goldCount) {
    const self = this;
    self.goldCount.string = goldCount;
  },
  onVidAdBtnClicked() {
    console.warn('Please Override this function: onVidAdBtnClicked!');
  },
  onLoad() {
    const self = this;
    ConfirmationPanel.prototype.onLoad.apply(this, arguments);
    const vidAdHander = new cc.Component.EventHandler();
    vidAdHander.target = self;
    vidAdHander.component = self.node.name;
    vidAdHander.handler = "onVidAdBtnClicked";
    self.vidAdBtn.clickEvents = [
      vidAdHander
    ];
  },

})

