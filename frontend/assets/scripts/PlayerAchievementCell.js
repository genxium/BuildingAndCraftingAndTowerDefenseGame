const StateBasedFactory = require('./modules/StateBasedFactory');
const ProgressNum = require('./ProgressNum');
const i18n = require('LanguageData');

const PlayerAchievementCellState = cc.Enum({
  MISSION_IN_PROGRESS: 0,
  MISSION_FINISHED_REWARD_CLAIMABLE: 1,
  MISSION_FINISHED_REWARD_CLAIMED: 2,
});
const ClassOption = StateBasedFactory(PlayerAchievementCellState, PlayerAchievementCellState.MISSION_IN_PROGRESS);

Object.assign(ClassOption.properties, {
  questProgress: ProgressNum,
  descriptionRichText: cc.RichText,
  goldValueContainer: cc.Node,
  goldValue: cc.Label,
  diamondValueContainer: cc.Node,
  diamondValue: cc.Label,
  btnObtain: cc.Button,
  btnInfo: cc.Button,
});
Object.assign(ClassOption, {
  extends: cc.Component,
  ctor() {
  },
  onDestory() {
    const self = this;
  },
  onLoad() {
    const self = this;
    // Initialization of btnObtain clickEvents [begin].
    let clickHandler = new cc.Component.EventHandler();
    clickHandler.target = self.node;
    clickHandler.component = self.node.name;
    clickHandler.handler = 'onBtnObtainClicked';
    self.btnObtain.clickEvents = [
      clickHandler,
    ];
    // Initialization of btnObtain clickEvents [end].
    // Initialization of btnInfo clickEvents [begin].
    let btnInfoClickHandler = new cc.Component.EventHandler();
    btnInfoClickHandler.target = self.node;
    btnInfoClickHandler.component = self.node.name;
    btnInfoClickHandler.handler = 'onBtnInfoClicked';
    self.btnInfo.clickEvents = [
      btnInfoClickHandler,
    ];
    // Initialization of btnInfo clickEvents [end].
  },
  init(mapIns, playerAchievementPanelIns) {
    const self = this;
    self.mapIns = mapIns;
    self.playerAchievementPanelIns = playerAchievementPanelIns;
    self.questProgress.formulateIndicatorLabelStr = function() {
      return cc.js.formatStr(
        i18n.t('PlayerAchievementCell.Tip.questProgress'),
        Math.floor(self.questProgress.currentlyDisplayingQuantity),
        Math.floor(self.questProgress.maxValue)
      );
    };
  },
  setData(playerMissionBinding, isDailyMission) {
    const self = this;
    const timerDict = {
      total: 0
    };
    const t1 = Date.now();
    self.playerMissionBinding = playerMissionBinding;
    self.isDailyMission = isDailyMission;

    // Warning: the playerQuestBindingList.length should be equal to 1.
    const targetPlayerQuestBinding = self.playerMissionBinding.playerQuestBindingList[0]; 
    switch (self.playerMissionBinding.state) {
    case constants.MISSION_STATE.INCOMPLETE:
      self.state = PlayerAchievementCellState.MISSION_IN_PROGRESS;
      switch (targetPlayerQuestBinding.resourceType) {
        case constants.QUEST_RESOURCE_TYPE.STATEFUL_BUILDABLE_LEVEL:
        case constants.QUEST_RESOURCE_TYPE.TARGET_INGREDIENT:
          self.btnInfo.node.active = true;
          if (null != self.btnInfo.target) {
            self.btnInfo.target.active = true;
          }
          break;
        default:
          self.btnInfo.node.active = false;
          if (null != self.btnInfo.target) {
            self.btnInfo.target.active = false;
          }
          break;
      }
      break;
    case constants.MISSION_STATE.COMPLETED:
      self.state = PlayerAchievementCellState.MISSION_FINISHED_REWARD_CLAIMABLE;
      break;
    case constants.MISSION_STATE.COMPLETED_OBTAINED:
    case constants.MISSION_STATE.CLAIMED_IN_UPSYNC:
      self.state = PlayerAchievementCellState.MISSION_FINISHED_REWARD_CLAIMED;
      break;
    }
    self.descriptionRichText.string = self.playerMissionBinding.description.replace(/\"(.*)\"/g, function(matchedStr, str) {
      return cc.js.formatStr(i18n.t("Tip.boldFont"), str);
    });
    self.questProgress.setData(targetPlayerQuestBinding.completedCount, targetPlayerQuestBinding.completedCountRequired);
    self.goldValueContainer.active = false;
    self.diamondValueContainer.active = false;
    for (let i = 0; i < self.playerMissionBinding.giftList.length; i++) {
      let giftData = self.playerMissionBinding.giftList[i];
      switch (giftData.addResourceType) {
      case constants.RESOURCE_TYPE.GOLD:
        self.goldValue.string = cc.js.formatStr(i18n.t("Tip.rewardObtain"), giftData.addValue);
        self.goldValueContainer.active = true;
        break;
      case constants.RESOURCE_TYPE.DIAMOND:
        self.diamondValue.string = cc.js.formatStr(i18n.t("Tip.rewardObtain"), giftData.addValue);
        self.diamondValueContainer.active = true;
        break;
      }
    }
    timerDict.total = (Date.now() - t1);
    // console.log("PlayerAchievementCell, setData, timerDict == ", timerDict);
 },

  onBtnObtainClicked(evt) {
    const self = this;
    if (null == self.mapIns || null == self.playerMissionBinding) {
      return;
    }
    if (null != evt) {
      self.mapIns.playEffectCommonCongrat(); 
    }
    if (self.playerMissionBinding.state == constants.MISSION_STATE.COMPLETED) {
      // transit state to COMPLETED_OBTAINED.
      self.playerMissionBinding.state = constants.MISSION_STATE.COMPLETED_OBTAINED;
      self.setData(self.playerMissionBinding, self.isDailyMission);
      self.onClaimReward && self.onClaimReward(self.playerMissionBinding);
      return;
    }
  },

  onBtnInfoClicked(evt) {
    const self = this;
    if (null == self.mapIns || null == self.playerMissionBinding) {
      return;
    }
    if (null != evt) {
      self.mapIns.playEffectCommonButtonClick();
    }
    const targetPlayerQuestBinding = self.playerMissionBinding.playerQuestBindingList[0];
    self.onInfo && self.onInfo(self.playerMissionBinding, targetPlayerQuestBinding);
  },

});
cc.Class(ClassOption);
