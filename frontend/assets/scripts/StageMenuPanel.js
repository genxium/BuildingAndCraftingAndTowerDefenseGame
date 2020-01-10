const CloseableDialog = require('./CloseableDialog');

cc.Class({
  extends: CloseableDialog,
  properties: {
    backToStageSelectionBtn: cc.Button,
    replayBtn: cc.Button,
  },
  onLoad() {
    const self = this;
    CloseableDialog.prototype.onLoad && CloseableDialog.prototype.onLoad.call(self);
    const backToStageSelectionHander = new cc.Component.EventHandler();
    backToStageSelectionHander.target = self;
    backToStageSelectionHander.component = self.node.name;
    backToStageSelectionHander.handler = "onBackToStageSelectionButtonClicked";
    self.backToStageSelectionBtn.clickEvents = [
      backToStageSelectionHander
    ];

    const replayHander = new cc.Component.EventHandler();
    replayHander.target = self;
    replayHander.component = self.node.name;
    replayHander.handler = "onReplayButtonClicked";
    self.replayBtn.clickEvents = [
      replayHander
    ];
  },
  init(mapIns) {
    const self = this;
    self.mapIns = mapIns;
  },
  onReplayButtonClicked(evt) {
    const self = this;
    if (null != evt) {
      self.mapIns.playEffectCommonButtonClick();
    }
    self.onReplay && self.onReplay();
  },
  onBackToStageSelectionButtonClicked(evt) {
    const self = this;
    if (null != evt) {
      self.mapIns.playEffectCommonButtonClick();
    }
    self.onBackToStageSelection && self.onBackToStageSelection();
  },
})

