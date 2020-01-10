cc.Class({
  extends: cc.Component,

  properties: {
    questListContainerNode: cc.Node,
  },

  ctor() {
    const self = this;
    self.mapIns = null;
    self.questNodeCompList = null;
  },

  onLoad() {
  },

  setData(questList) {
    const self = this;
    const mapIns = self.mapIns;
    if (null == questList) {
      return;
    }

    self.questNodeCompList = [];
    for (let quest of questList) {
      const newStageGoalQuestNode = cc.instantiate(mapIns.stageGoalQuestPrefab);
      const stageGoalQuestScriptIns = newStageGoalQuestNode.getComponent("StageGoalQuest"); 
      stageGoalQuestScriptIns.mapIns = self.mapIns;
      stageGoalQuestScriptIns.setData(quest);
      safelyAddChild(self.questListContainerNode, newStageGoalQuestNode);
      self.questNodeCompList.push(stageGoalQuestScriptIns);
      stageGoalQuestScriptIns.onCompleted = function() {
        self.mapIns.onSingleStageGoalCompleted(quest, questList, stageGoalQuestScriptIns, self);
      }
    } 
  },

  onStatefulBuildableListChanged() {
    const self = this;
    const decodedStageInitialState = this.mapIns.stageInitialState;
    const initialPlayerBuildableBindingList = decodedStageInitialState.syncData.playerBuildableBindingList; 

    const currentStatefulBuildableInstanceCompList = this.mapIns.statefulBuildableInstanceCompList;
    
    // console.log("currentStatefulBuildableInstanceCompList\n", currentStatefulBuildableInstanceCompList, "\ninitialPlayerBuildableBindingList\n", initialPlayerBuildableBindingList);
    const buildableAdditionDict = [
      //[currentStatefulBuildableInstanceComp, fromLevel, currentLevel]
    ];

    for (let i = 0, len = currentStatefulBuildableInstanceCompList.length; i < len; i++) {
      let currentStatefulBuildableInstanceComp = currentStatefulBuildableInstanceCompList[i];
      let currentPlayerBuildableBinding = currentStatefulBuildableInstanceComp.playerBuildableBinding;
      let initialPlayerBuildableBinding = initialPlayerBuildableBindingList.find(function(playerBuildableBinding) {
        return playerBuildableBinding.id == currentPlayerBuildableBinding.id;
      });
      // WARNING: 此方法内部仅记录增量更新
      if (null != initialPlayerBuildableBinding && currentPlayerBuildableBinding.currentLevel > initialPlayerBuildableBinding.currentLevel) {
        buildableAdditionDict.push([currentStatefulBuildableInstanceComp, initialPlayerBuildableBinding.currentLevel, currentPlayerBuildableBinding.currentLevel])
      } else if (null == initialPlayerBuildableBinding) {
        buildableAdditionDict.push([currentStatefulBuildableInstanceComp, 0, currentPlayerBuildableBinding.currentLevel]);
      }
    }

    for (let k in self.questNodeCompList) {
      let stageGoalQuestScriptIns = self.questNodeCompList[k]; 
      let quest = stageGoalQuestScriptIns.quest;
      if (quest.resourceType == constants.RESOURCE_TYPE.STATEFUL_BUILDABLE_LEVEL) {
        let targetBuildableId = quest.resourceTargetId;
        let minLevel = quest.resourceTargetQuantity;
        let targetStatefulBuildableCompList = buildableAdditionDict.filter(function(arr) {
          let statefulBuildableInstance = arr[0];
          let currentLevel = arr[2];
          return statefulBuildableInstance.id == targetBuildableId && currentLevel >= minLevel;
        });
        stageGoalQuestScriptIns.updateCurrentCompletedCount(targetStatefulBuildableCompList.length);
      }
    }
  },

  onKnapsackChanged() {
    // TODO: 区分是根据存量来更新还是根据上升沿来更新。
    const self = this;
    const decodedStageInitialState = self.mapIns.stageInitialState;
    const initialKnapsack = decodedStageInitialState.knapsack;
    const currentKnapsack = self.mapIns.knapsackArray;
    // WARNINIG: 此方法内部仅记录增量更新
    const knapsackAdditionDict = [
      // [knapsackItem, from, to]
    ];

    for (let i = 0, len = currentKnapsack.length; i < len; i++) {
      let currentKnapsackItem = currentKnapsack[i];
      // Warning: initialKnapsackItem.id === undefinded
      let initialKnapsackItem = initialKnapsack.find(function(knapsackItem) {
        return knapsackItem.ingredient.id == currentKnapsackItem.ingredient.id;
      });
      if (null != initialKnapsackItem && currentKnapsackItem.currentCount >= initialKnapsackItem.currentCount) {
        knapsackAdditionDict.push([currentKnapsackItem, initialKnapsackItem.currentCount, currentKnapsackItem.currentCount]);
      } else if (null == initialKnapsackItem) {
        knapsackAdditionDict.push([currentKnapsackItem, 0, currentKnapsackItem.currentCount]);
      }
    }

    for (let k in self.questNodeCompList) {
      let stageGoalQuestScriptIns = self.questNodeCompList[k]; 
      let quest = stageGoalQuestScriptIns.quest;
      if (quest.resourceType == constants.RESOURCE_TYPE.TARGET_INGREDIENT) {
        let targetIngredientId = quest.resourceTargetId;
        let targetAddition = knapsackAdditionDict.find(function(arr) {
          let currentKnapsackItem = arr[0];
          let currentCount = arr[2];
          return currentKnapsackItem.ingredient.id == targetIngredientId;
        });
        if (null != targetAddition) {
          let currentCount = targetAddition[2], initialCount = targetAddition[1];
          stageGoalQuestScriptIns.updateCurrentCompletedCount(currentCount - initialCount);
        }
      }
    }
  },

  onEscapingAttackingNpcFled() {
    const self = this;
    for (let k in self.questNodeCompList) {
      let stageGoalQuestScriptIns = self.questNodeCompList[k]; 
      let quest = stageGoalQuestScriptIns.quest;
      if (constants.RESOURCE_TYPE.ESCAPED_ATTACKING_NPC == quest.resourceType) {
        const targetAddition = 1;
        stageGoalQuestScriptIns.updateCurrentCompletedCount(stageGoalQuestScriptIns.currentCompletedCount + targetAddition);
        if (stageGoalQuestScriptIns.currentCompletedCount >= stageGoalQuestScriptIns.completedCountRequired) {
          stageGoalQuestScriptIns.mapIns.onStageFailed();
          return;
        }
      }
    }
  },

  onBuildableDestoryed(statefulBuildableInstance) {
    const self = this;
    for (let k in self.questNodeCompList) {
      let stageGoalQuestScriptIns = self.questNodeCompList[k]; 
      let quest = stageGoalQuestScriptIns.quest;
      if (quest.resourceType == constants.RESOURCE_TYPE.STATEFULBUILDABLE_DESTORYED) {
        let targetBuildableId = quest.resourceTargetId;
        if (targetBuildableId != statefulBuildableInstance.id) {
          continue;
        }
        const prevCompletedCount = stageGoalQuestScriptIns.currentCompletedCount;
        stageGoalQuestScriptIns.updateCurrentCompletedCount(prevCompletedCount + 1);
      }
    }
  },

});
