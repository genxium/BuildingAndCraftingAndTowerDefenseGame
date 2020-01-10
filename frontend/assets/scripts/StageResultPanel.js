const CloseableDialog = require('./CloseableDialog');
const StageScore = require('./StageScore');
const StateBasedFactory = require('./modules/StateBasedFactory');
const i18n = require('LanguageData');

const StageResultPanelState = cc.Enum({
  FAIL: 0,
  PASS_WITHOUT_STAR_GAIN: 1,
  PASS_WITH_STAR_GAIN: 2,
});

const ClassOption = StateBasedFactory(StageResultPanelState, StageResultPanelState.FAIL);

Object.assign(ClassOption.properties, {
  iconFail: cc.Node,
  degreeOfCompletionSection: cc.Node,
  backToStageSelectionBtn: cc.Button,
  replayBtn: cc.Button,
  stageScore: StageScore,
  title: cc.Label,
  starGainLabel: cc.Label,
  highestScoreLabel: cc.Label,
  shareBtn: cc.Button,
  videoShareBtn: cc.Button,
  nextStageBtn: cc.Button,
  hintRefreshHighestScore: cc.Node,
  currentStageTicketPriceContainer: cc.Node,
  currentStageTicketPriceLabel: cc.Label,
  nextStageTicketPriceContainer: cc.Node,
  nextStageTicketPriceLabel: cc.Label,
});

Object.assign(ClassOption, {
  extends: CloseableDialog,
  
  onLoad () {
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
    
    if (null != window.tt) {
      self.shareBtn.node.active = false;
      self.videoShareBtn.node.active = true;
      self.replayBtn.node.active = false;
    } else {
      self.shareBtn.node.active = false;
      self.videoShareBtn.node.active = false;
      self.replayBtn.node.active = true;
    }
    const shareHander = new cc.Component.EventHandler();
    shareHander.target = self;
    shareHander.component = self.node.name;
    shareHander.handler = "onShareButtonClicked";
    self.shareBtn.clickEvents = [
      shareHander
    ];

    const videoShareHander = new cc.Component.EventHandler();
    videoShareHander.target = self;
    videoShareHander.component = self.node.name;
    videoShareHander.handler = "onVideoShareButtonClicked";
    self.videoShareBtn.clickEvents = [
      videoShareHander 
    ];

    const nextStageHander = new cc.Component.EventHandler();
    nextStageHander.target = self;
    nextStageHander.component = self.node.name;
    nextStageHander.handler = "onNextStageButtonClicked";
    self.nextStageBtn.clickEvents = [
      nextStageHander
    ];
  },

  init(mapIns, currentStageData, nextStageData) {
    const self = this;
    self.mapIns = mapIns;
    self.stageScore.init(mapIns);
    self.currentStageData = currentStageData;
    self.nextStageData = nextStageData;
  },

  setData(score, starCount, highestScore, highestStars, stageIndex) {
    const self = this;
    self.score = score;
    self.starCount = starCount;
    self.stageIndex = stageIndex;
    self.starGainCount = Math.max(0, starCount - highestStars);
    self.highestScore = highestScore;
    self.highestStars = highestStars;
    self.stageScore.setData(score, starCount);
  },

  refresh() {
    const self = this;
    self.title.string = i18n.t("StageSelectionCell.DisplayName." + self.stageIndex);
    self.starGainLabel.string = '+' + self.starGainCount;
    self.highestScoreLabel.string = self.highestScore;
    if (self.starCount > 0) {
      self.state = self.starGainCount == 0 ? StageResultPanelState.PASS_WITHOUT_STAR_GAIN : StageResultPanelState.PASS_WITH_STAR_GAIN;
      self.degreeOfCompletionSection.active = true;
    } else {
      self.state = StageResultPanelState.FAIL;
      self.degreeOfCompletionSection.active = false;
      self.iconFail.active = true;
      const smartRotationSequence = [];
      smartRotationSequence.push(cc.rotateBy(0.4, 25));
      smartRotationSequence.push(cc.rotateBy(0.3, -25));
      smartRotationSequence.push(cc.rotateBy(0.3, 20));
      smartRotationSequence.push(cc.rotateBy(0.25, -20));
      smartRotationSequence.push(cc.rotateBy(0.2, 10));
      smartRotationSequence.push(cc.rotateBy(0.15, -10));
      self.iconFail.runAction(cc.sequence(smartRotationSequence));
    }
    self.hintRefreshHighestScore.active = (self.score > self.highestScore);
    self.stageScore.refresh();
    self.currentStageTicketPriceContainer.active = self.currentStageData.stage.ticketPrice > 0;
    self.currentStageTicketPriceLabel.string = self.currentStageData.stage.ticketPrice || '';
    self.currentStageTicketPriceLabel.node.color = self.currentStageData.stage.ticketPrice <= self.mapIns.wallet.diamond ? cc.Color.WHITE : cc.color('#DE5244');
    if (null != self.nextStageData) {
      self.nextStageBtn.node.active = true;
      self.nextStageTicketPriceContainer.active = self.nextStageData.stage.ticketPrice > 0;
      self.nextStageTicketPriceLabel.string = self.nextStageData.stage.ticketPrice || '';
      self.nextStageTicketPriceLabel.node.color = self.nextStageData.stage.ticketPrice <= self.mapIns.wallet.diamond ? cc.Color.WHITE : cc.color('#DE5244');
    } else {
      self.nextStageBtn.node.active = false;
    }
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

  onShareButtonClicked(evt) {
    const self = this;
    if (null != evt) {
      self.mapIns.playEffectCommonButtonClick();
    }
    self.onShare && self.onShare();
  },

  onVideoShareButtonClicked(evt) {
    const self = this;
    if (null != evt) {
      self.mapIns.playEffectCommonButtonClick();
    }
    self.onVideoShare && self.onVideoShare();
  },

  onNextStageButtonClicked(evt) {
    const self = this;
    if (null != evt) {
      self.mapIns.playEffectCommonButtonClick();
    }
    self.onGoToNextStage && self.onGoToNextStage(self.nextStageData);
  },
});

cc.Class(ClassOption);
