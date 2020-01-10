const CloseableDialog = require('./CloseableDialog');
const KnapsackPanel = require('./KnapsackPanel');
const i18n = require('LanguageData');

cc.Class({
  extends: CloseableDialog,

  properties: {
    title: cc.Label,
    hint: cc.Label,
    forFailingHint: cc.Label,
    questListContainerNode: cc.Node,
    forFailingQuestListContainerNode: cc.Node,
    commonCloseableContainer: cc.Node,
    confirmButton: cc.Button,
    scoutButton: cc.Button,
    soldierKnapsack: KnapsackPanel,
    backToStageSelectionBtn: cc.Button,
    stageGoalQuestPrefab: cc.Prefab,
  },

  onLoad() {
    const self = this;
    CloseableDialog.prototype.onLoad.apply(this, arguments);
    const theCloseBtnOnClickHandler = new cc.Component.EventHandler();
    theCloseBtnOnClickHandler.target = this.node;
    theCloseBtnOnClickHandler.component = "StageGoalPanel";
    theCloseBtnOnClickHandler.handler = "onCloseClicked";
    theCloseBtnOnClickHandler.customEventData = null;
    this.closeBtn.clickEvents = [
      theCloseBtnOnClickHandler
    ];

    const backToStageSelectionHander = new cc.Component.EventHandler();
    backToStageSelectionHander.target = self;
    backToStageSelectionHander.component = self.node.name;
    backToStageSelectionHander.handler = "onBackToStageSelectionButtonClicked";
    self.backToStageSelectionBtn.clickEvents = [
      backToStageSelectionHander
    ];

    const movingDown = cc.moveTo(0.8, cc.v2(0, -100)).easing(cc.easeBounceIn());
    const movingUp = cc.moveTo(0.2, cc.v2(0, 0)).easing(cc.easeBounceOut());

    let ccSeqActArray = [];
    ccSeqActArray.push(movingDown);
    ccSeqActArray.push(movingUp);
    ccSeqActArray.push(cc.callFunc(() => {
      self.closeBtn.node.active = true;
      self.confirmButton.node.active = true;
      self.scoutButton.node.active = true;
      self.soldierKnapsack.node.active = true;
      self.backToStageSelectionBtn.node.active = true;
    }, self));

    self.commonCloseableContainer.runAction(cc.sequence(ccSeqActArray)); 
  },
  
  onEnable() {
    CloseableDialog.prototype.onEnable && CloseableDialog.prototype.onEnable.apply(this, arguments);
    this.node.opacity = 255;
  },

  onCloseClicked(evt, customData) {
    
    if (true == this.mapIns.isInScouting()) {
      CloseableDialog.prototype.onCloseClicked.call(this, evt, customData);
    } else {
      const self = this;
      self.fadeOutDurationSeconds = 0;
      self.afterFadedOutCb = () => {
        self.mapIns.onStageMenuTriggerButtonClicked(evt);
      };
      self.onCloseDelegate();
    }
  },

  onBackToStageSelectionButtonClicked(evt) {
    const self = this;
    self.onBackToStageSelection && self.onBackToStageSelection();
  },

  onDestroy() {
    CloseableDialog.prototype.onDestroy.apply(this, arguments);
  },

  ctor() {
    const self = this;
    self.mapIns = null;
    self.questNodeCompList = null;
    self.forFailingQuestNodeCompList = null;
    self.afterFadedOutCb = null;
  },

  setData(stageDisplayName, questList, soldierArray) {
    const self = this;
    const mapIns = self.mapIns;
    if (null == questList) {
      return;
    }

    self.soldierKnapsack.init(mapIns);
    self.soldierKnapsack.setData(soldierArray);
    self.soldierKnapsack.refresh();
    
    if (mapIns.isStageGoalToDestroyEnemy()) {
      self.hint.string = i18n.t('StageGoal.DestroyEnemy');
      // cover default string.
      let localizedLabel = self.hint.node.getComponent('LocalizedLabel');
      if (null != localizedLabel) {
        self.hint.node.removeComponent('LocalizedLabel');
      }
    }
    
    self.title.string = stageDisplayName;

    self.questNodeCompList = [];
    self.forFailingQuestNodeCompList = [];
    for (let quest of questList) {
      const newStageGoalQuestNode = cc.instantiate(self.stageGoalQuestPrefab);
      const stageGoalQuestScriptIns = newStageGoalQuestNode.getComponent("StageGoalQuest"); 
      stageGoalQuestScriptIns.mapIns = self.mapIns;
      stageGoalQuestScriptIns.setData(quest);
      
      switch (quest.resourceType) {
      case constants.RESOURCE_TYPE.ESCAPED_ATTACKING_NPC:
        safelyAddChild(self.forFailingQuestListContainerNode, newStageGoalQuestNode);
        self.forFailingQuestNodeCompList.push(stageGoalQuestScriptIns);
      break;
      default:
        safelyAddChild(self.questListContainerNode, newStageGoalQuestNode);
        self.questNodeCompList.push(stageGoalQuestScriptIns);
      break;
      }
    }

    if (self.questNodeCompList.length <= 0) {
      self.hint.node.active = false;
      self.questListContainerNode.active = false;
    } else {
      self.hint.node.active = true;
      self.questListContainerNode.active = true;
    }
    if (self.forFailingQuestNodeCompList.length <= 0) {
      self.forFailingHint.node.active = false;
      self.forFailingQuestListContainerNode.active = false;
    } else {
      self.forFailingHint.node.active = true;
      self.forFailingQuestListContainerNode.active = true;
    }
  },

  onConfirmButtonClicked(evt) {
    if (null == this.mapIns.onConfirmButtonClicked) return;
    this.mapIns.onConfirmButtonClicked(evt);
  },

  onScoutButtonClicked(evt) {
    if (null == this.mapIns.onScoutButtonClicked) return;
    this.mapIns.onScoutButtonClicked(evt);
  },
});
