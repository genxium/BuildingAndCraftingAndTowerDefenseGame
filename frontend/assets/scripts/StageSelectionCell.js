const i18n = require('LanguageData');
const StateBasedFactory = require('./modules/StateBasedFactory');
const StageScore = require('./StageScore');
const StageBindingState = cc.Enum({
  LOCKED_UNLOCKABLE_BY_COSTS_ENOUGH: 0,
  LOCKED_UNLOCKABLE_BY_COSTS_NOT_ENOUGH: 1,
  LOCKED_NOT_UNLOCKABLE: 3,
  UNLOCKED_PASSED: 4,
  UNLOCKED_UNPASSED: 5,
  LOCKED_FOR_FUTURE: 6,
});

const ClassOption = StateBasedFactory(StageBindingState, StageBindingState.LOCKED_NOT_UNLOCKABLE);

Object.assign(ClassOption.properties, {
  indexNode: cc.Node,
  indexLabel: cc.Label,
  displayNameLabel: cc.Label,
  startBtn: cc.Button,
  unlockBtn: cc.Button,
  starPriceLabel: cc.Label,
  diamondPriceLabel: cc.Label,
  stageScore: StageScore,
  tutorialTipNode: cc.Node,
  startFreeHintNode: cc.Node,
  startPaidHintNode: cc.Node,
  startPaidPriceLabel: cc.Label,
});

Object.assign(ClassOption, {
  extends: cc.Component,

  init(stageSelectionScene) {
    const self = this;
    self.stageSelectionScene = stageSelectionScene;
    self.stageScore.init(null);
  },

  setData(stage, playerStageBinding, index, isUnlockable, isPassed, isTutorialStage) {
    const self = this;
    self.stage = stage;
    self.stageBinding = playerStageBinding;
    self.isUnlockable = isUnlockable;
    self.isPassed = isPassed;
    self.index = index;
    const stageSelectionSceneNode = self.stageSelectionScene.node;
    self.isTutorialStage = isTutorialStage;
    // Initialization of startBtn clicked handler. [begin]
    const startBtnClickedHandler = new cc.Component.EventHandler();
    startBtnClickedHandler.target = self.node;
    startBtnClickedHandler.component = self.node.name;
    startBtnClickedHandler.handler = "onStartButtonClicked";
    startBtnClickedHandler.customEventData = self;
    this.startBtn.clickEvents = [
      startBtnClickedHandler
    ];
    // Initialization of startBtn clicked handler. [end]
    // Initialization of unlockBtn clicked handler. [begin]
    const unlockBtnClickedHandler = new cc.Component.EventHandler();
    unlockBtnClickedHandler.target = self.node;
    unlockBtnClickedHandler.component = self.node.name;
    unlockBtnClickedHandler.handler = "onUnlockButtonClicked";
    unlockBtnClickedHandler.customEventData = self;
    this.unlockBtn.clickEvents = [
      unlockBtnClickedHandler
    ];
    // Initialization of unlockBtn clicked handler. [end]

    if (null != playerStageBinding) {
      self.stageScore.setData(playerStageBinding.highestScore, playerStageBinding.highestStars);
    } else {
      self.stageScore.setData(0, 0);
    }
 
  },

  onStateChanged(prev, current) {
    const self = this;
    if (!CC_EDITOR) {
      let layout = self.node.getComponent(cc.Layout);
      layout && layout.updateLayout();
      self.node.getComponentsInChildren(cc.Widget).forEach(function(widget) {
        widget.updateAlignment();
      });
    }
  },

  refresh () {
    const self = this;
    const stage = self.stage;
    const stageBinding = self.stageBinding;

    if (stage.id == constants.FUTURE_STAGE_ID) {
      self.state = StageBindingState.LOCKED_FOR_FUTURE;
      return;
    }

    // TODO: Correct the StageBindingState. [begin]
    if (null != stageBinding) {
      let isPassed = self.isPassed;
      switch(stageBinding.state) {
      case constants.STAGE_BINDING.STATE.UNLOCKED_BY_STARS:
      case constants.STAGE_BINDING.STATE.UNLOCKED_BY_DIAMONDS:
      case constants.STAGE_BINDING.STATE.UNLOCKED_BY_COMPLETING_PREV_STAGE:
        self.state = isPassed ? StageBindingState.UNLOCKED_PASSED : StageBindingState.UNLOCKED_UNPASSED;
        break;
      default:
        break;
      }
    } else {
      let isStarEnough = stage.starPrice <= self.stageSelectionScene.getStarCount();
      let isDiamondEnough = stage.diamondPrice <= self.stageSelectionScene.getDiamondCount();
      // Unlock ux not completed, hide btn temporarily. [begin]
      self.isUnlockable = false;
      // Unlock ux not completed, hide btn temporarily. [end]
      if (self.isUnlockable) {
        self.state = isStarEnough && isDiamondEnough ? StageBindingState.LOCKED_UNLOCKABLE_BY_COSTS_ENOUGH : StageBindingState.LOCKED_UNLOCKABLE_BY_COSTS_NOT_ENOUGH;
      } else {
        self.state = StageBindingState.LOCKED_NOT_UNLOCKABLE;
      }
      if (0 == stage.starPrice) {
        self.starPriceLabel.node.active = false;
      } else {
        self.starPriceLabel.string = stage.starPrice;
        self.starPriceLabel.node.color = isStarEnough ? cc.color('#161616') : cc.color('#DE5244');
      }
      if (0 == stage.diamondPrice) {
        self.diamondPriceLabel.node.active = false;
      } else {
        self.diamondPriceLabel.string = stage.diamondPrice;
        self.diamondPriceLabel.node.color = isDiamondEnough ? cc.color('#161616') : cc.color('#DE5244');
      }


    }
    // TODO: Correct the StageBindingState. [end]

    self.indexLabel.string = cc.js.formatStr(i18n.t("StageSelectionCell.Tip.index"), self.index);
    self.displayNameLabel.string = i18n.t("StageSelectionCell.DisplayName." + stage.stageId);

    self.stageScore.refresh();
    // console.log(self.stage, self.stageBinding, self.state);
    self.tutorialTipNode.active = self.isTutorialStage;
    self.indexNode.active = !self.isTutorialStage;

    // refresh ticketPrice. [begin]

    if (null == stage.ticketPrice || 0 == stage.ticketPrice) {
      self.startFreeHintNode.active = true;
      self.startPaidHintNode.active = false;
    } else {
      self.startFreeHintNode.active = false;
      self.startPaidHintNode.active = true;
      self.startPaidPriceLabel.string = stage.ticketPrice;
      self.startPaidPriceLabel.node.color = stage.ticketPrice <= self.stageSelectionScene.wallet.diamond ? cc.Color.WHITE : cc.color('#DE5244');
    }
    // refresh ticketPrice. [end]

  },
  onStartButtonClicked(evt) {
    const self = this, stageBinding = self.stageBinding;
    if (null != stageBinding) {
      self.onStart && self.onStart();
    }
  },
  onUnlockButtonClicked(evt) {
    const self = this, stageBinding = self.stageBinding;
    if (null == stageBinding) {
      self.onUnlock && self.onUnlock()
    };
  },
  setButtonInteractable(interactable) {
    const self = this;
    self.startBtn.interactable = interactable;
    self.unlockBtn.interactable = interactable;
  },
});

cc.Class(ClassOption);
