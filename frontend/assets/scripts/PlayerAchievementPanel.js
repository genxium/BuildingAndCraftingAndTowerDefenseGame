const CloseableDialog = require('./CloseableDialog');
const DescriptionNotification = require('./Notifications/DescriptionNotification');
const i18n = require('LanguageData');
// Warning: The TAB should consistent to the label showed under tabContainer.
const PlayerAchievementTab = cc.Enum({
  ACHIEVEMENT: 0,
  DAILY_MISSION: 1,
});

const CoinType = require('./Coin').CoinType;

cc.Class({
  extends: CloseableDialog,
  properties: {
    preloadCellCountForEachTab: {
      default: 10,
    },
    updateInterval: {
      default: 0.2,
    },
    achievementScrollView: {
      type: cc.ScrollView,
      default: null,
    },
    dailyMissionScrollView: {
      type: cc.ScrollView,
      default: null,
    },
    bufferHeightForAchievement: { 
      default: 100, // In "points".
    },
    bufferHeightForDailyMission: { 
      default: 100, // In "points".
    },
    tabContainer: cc.ToggleContainer,
    viewingTab: {
      type: PlayerAchievementTab,
      default: PlayerAchievementTab.ACHIEVEMENT,
    },
    playerAchievementContainer: cc.Node,
    playerAchievementListNode: cc.Node,
    playerDailyMissionContainer: cc.Node,
    playerDailyMissionListNode: cc.Node,
    playerAchievementCellPrefab: cc.Prefab,
    refreshDailyMissionLabel: cc.Label,

    achievementNotification: DescriptionNotification,
    dailyMisisonNotification: DescriptionNotification,

    cellSpacingY: 68.2,
    usingCellTransition: true,
    cellTransitionDelayMillis: {
      default: 2000,
      visible: function() {
        return this.usingCellTransition;
      },
    },
    cellTransitionMillis: {
      default: 300,
      visible: function() {
        return this.usingCellTransition;
      },
    },
    loadingTip: cc.Node,
    coinFallPrefab: cc.Prefab,
  },

  onLoad() {
    const self = this;
    CloseableDialog.prototype.onLoad.apply(self, arguments);
    self.lastContentPosYForAchievement = 0;
    self.lastContentPosYForDailyMission = 0;

    self.cellHeightForAchievement = null;
    self.cellHeightForDailyMission = null;

    self.initTabContainer();
    // Initialization of tab changed. [begin]
    let checkEventHandler = new cc.Component.EventHandler();
    checkEventHandler.target = self.node;
    checkEventHandler.component = self.node.name;
    checkEventHandler.handler = 'onTabChanged';
    self.tabContainer.checkEvents = [
      checkEventHandler,
    ];
    for (let toggleItem of self.tabContainer.toggleItems) {
      let clickHandler = new cc.Component.EventHandler();
      clickHandler.target = self.node;
      clickHandler.component = self.node.name;
      clickHandler.handler = 'onTabClicked';
      toggleItem.clickEvents = [
        clickHandler,
      ];
    }
    // Initialization of tab changed. [false]
  },

  update(dt) {
    CloseableDialog.prototype.update && CloseableDialog.prototype.update.apply(this, arguments);
    const self = this;
    if (null == self.mapIns) {
      return;
    }
    if (self.refreshDailyMissionLabel.node.active) {
      let date = new Date();
      date.setUTCHours(0, 0, 0, 0);
      let nextDayMillis = date.getTime() + 3600 * 24 *1000;
      let restDurationMillis = nextDayMillis - Date.now();
      self.refreshDailyMissionLabel.string = cc.js.formatStr(i18n.t('PlayerAchievementPanel.Tip.refreshDailyMission'), window.secondsToNaturalExp(restDurationMillis / 1000, false));
    }
    let shouldRestartAnimation = false;
    for (let k in self.playerMissionBindingCellDict) {
      let cellNode = self.playerMissionBindingCellDict[k];
      if (null == cellNode.positionMovingTo) {
        shouldRestartAnimation = true;
        break;
      }
      if (null != cellNode.positionMovingTo &&
          null != cellNode.cachedPosition &&
          !cellNode.positionMovingTo.equals(
            cellNode.cachedPosition
          )) {
        shouldRestartAnimation = true;
        break;
      }
    }

    for (let k in self.playerMissionBindingCellDict) {
      let cellNode = self.playerMissionBindingCellDict[k];
      if (cellNode.cachedPosition == null) {
        continue;
      }
      if (null == cellNode.parent) {
        cellNode.setPosition(cc.v2(9999, 9999));
        setLocalZOrder(cellNode, 0);
      } else if (cellNode.cachedPosition != null) {
        if (!self.usingCellTransition || self.isFirstFrame) {
          cellNode.stopAllActions();
          cellNode.positionMovingTo = null;
          cellNode.setPosition(cellNode.cachedPosition);
          setLocalZOrder(cellNode, cellNode.cachedIndex);
        } else {
          if (!shouldRestartAnimation) {
            continue;
          }
          cellNode.stopAllActions();
          cellNode.runAction(
            cc.sequence(
              cc.delayTime(null != cellNode.positionMovingTo ? 0 : self.cellTransitionDelayMillis / 1000),
              cc.moveTo(self.cellTransitionMillis / 1000, cellNode.cachedPosition),
              cc.callFunc(function() {
                cellNode.positionMovingTo = null;
                setLocalZOrder(cellNode, cellNode.cachedIndex);
              })
            )
          );
          cellNode.positionMovingTo = cellNode.cachedPosition;
        }
        cellNode.cachedPosition = null;
      }
    }
    self.isFirstFrame = false;
  
    // Append new cells if necessary.
    if (self.loadingTip.active) {
      // some cell is appending, thus do noting.
      return;
    }
    self.updateTimer += dt; 
    if (self.updateTimer < self.updateInterval) {
      return;
    }
    if (null == self.cellHeightForAchievement || null == self.cellHeightForDailyMission) { 
      return;
    }
    self.updateTimer = 0;

    let lastContentPosY = null;
    let activeScrollView = null;
    let activeCellHeight = null;
    let activeItems = null;
    let activeBufferHeight = null;
    switch (self.viewingTab) {
    case PlayerAchievementTab.ACHIEVEMENT:
      activeScrollView = self.achievementScrollView; 
      lastContentPosY = self.lastContentPosYForAchievement;
      activeCellHeight = self.cellHeightForAchievement;
      activeItems = self.playerAchievementListNode.children;
      activeBufferHeight = self.bufferHeightForAchievement;
    break;
    case PlayerAchievementTab.DAILY_MISSION:
      activeScrollView = self.dailyMissionScrollView; 
      lastContentPosY = self.lastContentPosYForDailyMission;
      activeCellHeight = self.cellHeightForDailyMission;
      activeItems = self.playerDailyMissionListNode.children;
      activeBufferHeight = self.bufferHeightForDailyMission;
    break;
    default:
    break;
    }

    let isScrollingToViewAppendingDirection = (activeScrollView.content.y > lastContentPosY);

    // Update recognized "lastContentPosY(ForAchievement | ForDailyMission)" before the "early returns".
    self.lastContentPosYForAchievement = self.achievementScrollView.content.y;
    self.lastContentPosYForDailyMission = self.dailyMissionScrollView.content.y;

    if (false == isScrollingToViewAppendingDirection) {
      return;
    }
    const existingTotalCellListNodeHeight = ((activeCellHeight + self.cellSpacingY) * activeItems.length);
    const couldTriggerAppending = (existingTotalCellListNodeHeight) <= (activeScrollView.content.y + activeScrollView.node.height + activeBufferHeight);
    
    if (false == couldTriggerAppending) {
      return;
    }   
  
    
    let idInListCap = 0;
    switch (self.viewingTab) {
    case PlayerAchievementTab.ACHIEVEMENT:
      const achievementCellCountToInit = ((self.playerMissionBindingListForAchievement.length - activeItems.length) < self.preloadCellCountForEachTab ? (self.playerMissionBindingListForAchievement.length - activeItems.length) : self.preloadCellCountForEachTab); 
      if (achievementCellCountToInit <= 0) {
        break;
      }
      self.loadingTip.active = true;
      self.achievementScrollView.enabled = false;
      self.scheduleOnce(function() {
        idInListCap = (activeItems.length + achievementCellCountToInit);
        for (let i = activeItems.length; i < idInListCap; i++) {
          const playerMissionBinding = self.playerMissionBindingListForAchievement[i];
          if (null == playerMissionBinding) {
            console.warn("The ", i, "-th playerMissionBinding of self.playerMissionBindingListForAchievement is null.");
            continue;
          }
          let cellNode = self.playerMissionBindingCellDict[playerMissionBinding.id];
          cellNode = self.initOrRefreshCell(cellNode, i, playerMissionBinding, false);
          cellNode.cachedParentNode = self.playerAchievementListNode;
          safelyAddChild(self.playerAchievementListNode, cellNode);
          self._achievementListNodeHeight += cellNode.height + (i == 0 ? 0 : self.cellSpacingY);
        }
        self.playerAchievementListNode.height = self._achievementListNodeHeight;
        console.log("self.playerAchievementListNode.height is updated to ", self.playerAchievementListNode.height);
        self.loadingTip.active = false;
        self.achievementScrollView.enabled = true;
      }); 
    break;
    case PlayerAchievementTab.DAILY_MISSION:
      const dailyMissionCellCountToInit = ((self.playerMissionBindingListForDailyMission.length - activeItems.length) < self.preloadCellCountForEachTab ? (self.playerMissionBindingListForDailyMission.length - activeItems.length) : self.preloadCellCountForEachTab); 
      if (dailyMissionCellCountToInit <= 0) {
        break;
      }
      self.loadingTip.active = true;
      self.achievementScrollView.enabled = false;
      self.scheduleOnce(function() {
        idInListCap = (activeItems.length + dailyMissionCellCountToInit);
        for (let i = activeItems.length; i < idInListCap; i++) {
          const playerMissionBinding = self.playerMissionBindingListForDailyMission[i];
          if (null == playerMissionBinding) {
            console.warn("The ", i, "-th playerMissionBinding of self.playerMissionBindingListForDailyMission is null.");
            continue;
          }
          let cellNode = self.playerMissionBindingCellDict[playerMissionBinding.id];
          cellNode = self.initOrRefreshCell(cellNode, i, playerMissionBinding, true);
          cellNode.cachedParentNode = self.playerDailyMissionListNode;
          safelyAddChild(self.playerDailyMissionListNode, cellNode);
          self._dailyMissionListNodeHeight += cellNode.height + (i == 0 ? 0 : self.cellSpacingY);
        }
        self.playerDailyMissionListNode.height = self._dailyMissionListNodeHeight;
        console.log("self.playerDailyMissionListNode.height is updated to ", self.playerDailyMissionListNode.height);
        self.loadingTip.active = false;
        self.achievementScrollView.enabled = true;
      });
    break;
    default:
    break;
    }
  },

  onEnable() {
    CloseableDialog.prototype.onEnable && CloseableDialog.prototype.onEnable.apply(this, arguments);
    this.isFirstFrame = true;
  },

  onDisable() {
    CloseableDialog.prototype.onDisable && CloseableDialog.prototype.onDisable.apply(this, arguments);
    for (let uuid in this.coinFallScriptInsDict) {
      let coinFallScriptIns = this.coinFallScriptInsDict[uuid];
      if (null == coinFallScriptIns.coinScriptInsDict) {
        continue;
      }
      for (let k in coinFallScriptIns.coinScriptInsDict) {
        let coinScriptIns = coinFallScriptIns.coinScriptInsDict[k];
        coinScriptIns.node.removeFromParent();
      }
    }
    this.coinScriptInsDict = {};
  },

  ctor() {
    this.mapIns = null;
    this.playerMissionBindingListForAchievement = [];
    this.playerMissionBindingListForDailyMission = [];
    this.prevPlayerMissionBindingListForAchievement = [];
    this.groupedPlayerMissionBindingListForAchievement = [];
    this.playerMissionBindingCellDict = {};
    this._achievementListNodeHeight = 0;
    this._dailyMissionListNodeHeight = 0;
    this.updateTimer = 0;
    this.coinFallScriptInsDict = {};
  },

  init(mapIns) {
    const self = this;
    self.mapIns = mapIns;
    self.achievementNotification.onDisappear = function() {
      self.achievementNotification.node.opacity = 0;
      return true;
    }
    self.dailyMisisonNotification.onDisappear = function() {
      self.dailyMisisonNotification.node.opacity = 0;
      return true;
    }
  },

  setData(playerMissionBindingListForAchievement, playerMissionBindingListForDailyMission) {
    const self = this;
    const timerDict = {
      sorting: 0,

      achievementCells: 0,
      achievementCellAvg: 0,
      achievementListResizeH: 0,
      achievementTabTotal: 0,

      dailyMissionCells: 0,
      dailyMissionCellAvg: 0,
      dailyMissionListResizeH: 0,
      dailyMissionTabTotal: 0,
  
      total: 0,
    };
    const t1 = Date.now();
    self.playerMissionBindingListForAchievement = playerMissionBindingListForAchievement.slice();
    self.playerMissionBindingListForDailyMission = playerMissionBindingListForDailyMission.slice();
    self.resort();
    for (let k in self.playerMissionBindingCellDict) {
      const cellNode = self.playerMissionBindingCellDict[k];
      cellNode.shouldDelete = true;
    }
    const t2 = Date.now();
    timerDict.sorting = (t2 - t1);
    
    self._achievementListNodeHeight = 0;
    const achievementCellCountToInit = (self.playerMissionBindingListForAchievement.length < self.preloadCellCountForEachTab ? self.playerMissionBindingListForAchievement.length : self.preloadCellCountForEachTab); 
    for (let i = 0; i < achievementCellCountToInit; i++) {
      const playerMissionBinding = self.playerMissionBindingListForAchievement[i];
      let cellNode = self.playerMissionBindingCellDict[playerMissionBinding.id];
      cellNode = self.initOrRefreshCell(cellNode, i, playerMissionBinding, false);
      cellNode.cachedParentNode = self.playerAchievementListNode;
      safelyAddChild(self.playerAchievementListNode, cellNode);
      self._achievementListNodeHeight += cellNode.height + (i == 0 ? 0 : self.cellSpacingY);
    }
    const t3 = Date.now();
    timerDict.achievementCells = (t3 - t2);
    timerDict.achievementCellAvg = (timerDict.achievementCells/self.playerMissionBindingListForAchievement.length);
    self.playerAchievementListNode.height = self._achievementListNodeHeight;
    const t4 = Date.now();
    timerDict.achievementListResizeH = (t4 - t3);
    timerDict.achievementTabTotal = (t4 - t1);

    self._dailyMissionListNodeHeight = 0;
    const dailyMissionCellCountToInit = (self.playerMissionBindingListForDailyMission.length < self.preloadCellCountForEachTab ? self.playerMissionBindingListForDailyMission.length : self.preloadCellCountForEachTab); 
    for (let i = 0; i < dailyMissionCellCountToInit; i++) {
      const playerMissionBinding = self.playerMissionBindingListForDailyMission[i];
      let cellNode = self.playerMissionBindingCellDict[playerMissionBinding.id];
      cellNode = self.initOrRefreshCell(cellNode, i, playerMissionBinding, true);
      cellNode.cachedParentNode = self.playerDailyMissionListNode;
      safelyAddChild(self.playerDailyMissionListNode, cellNode);
      self._dailyMissionListNodeHeight += cellNode.height + (i == 0 ? 0 : self.cellSpacingY);
    }
    const t5 = Date.now();
    timerDict.dailyMissionCells = (t5 - t4);
    timerDict.dailyMissionCellAvg = timerDict.dailyMissionCells/self.playerMissionBindingListForDailyMission.length;
    self.playerDailyMissionListNode.height = self._dailyMissionListNodeHeight;
    const t6 = Date.now();
    timerDict.dailyMissionListResizeH = (t6 - t5);

    for (let k in self.playerMissionBindingCellDict) {
      const cellNode = self.playerMissionBindingCellDict[k];
      if (!cellNode.shouldDelete) {
        continue;
      }
      cellNode.removeFromParent();
      delete self.playerMissionBindingCellDict[k];
    }
    self.refreshCompletedCounterTip();
    
    timerDict.total = (Date.now() - t1); 
    console.log("PlayerAchievementPanel.setData, timerDict == ", timerDict);
  },
  refreshCompletedCounterTip() {
    const self = this;
    // refresh completed counter tip for playerMissionBindingList. [begin]
    if (null == self.playerMissionBindingListForAchievement) {
      self.achievementNotification.disappear();
    } else {
      let count = self.playerMissionBindingListForAchievement.reduce(function(sum, playerMissionBinding) {
        return sum + (
          playerMissionBinding.state == constants.MISSION_STATE.COMPLETED ? 1 : 0
        );
      }, 0)
      self.achievementNotification.setTip(count);
      if (count > 0) {
        self.achievementNotification.node.opacity = 255;
        self.achievementNotification.appear();
      } else {
        self.achievementNotification.disappear();
      }
    }
    if (null == self.playerMissionBindingListForDailyMission) {
      self.dailyMisisonNotification.disappear();
    } else {
      let count = self.playerMissionBindingListForDailyMission.reduce(function(sum, playerMissionBinding) {
        return sum + (
          playerMissionBinding.state == constants.MISSION_STATE.COMPLETED ? 1 : 0
        );
      }, 0);
      self.dailyMisisonNotification.setTip(count);
      if (count > 0) {
        self.dailyMisisonNotification.node.opacity = 255;
        self.dailyMisisonNotification.appear();
      } else {
        self.dailyMisisonNotification.disappear();
      }
    }
    // refresh completed counter tip for playerMissionBindingList. [end]
  },
  initOrRefreshCell(targetCellNode, index, playerMissionBinding, isDailyMission) {
    const self = this;
    const timerDict = {
      total: 0
    };
    let cellInited = false;
    let playerAchievementCellIns;
    if (null == targetCellNode) {
      targetCellNode = cc.instantiate(self.playerAchievementCellPrefab);
      if (null != self.playerMissionBindingCellDict[playerMissionBinding.id]) {
        console.log('conflic', playerMissionBinding);
      }
      if (isDailyMission) {
        self.cellHeightForDailyMission = targetCellNode.height;
      } else {
        self.cellHeightForAchievement = targetCellNode.height;
      }
      self.playerMissionBindingCellDict[playerMissionBinding.id] = targetCellNode;
      playerAchievementCellIns = targetCellNode.getComponent('PlayerAchievementCell');
      playerAchievementCellIns.init(self.mapIns, self);
      playerAchievementCellIns.onClaimReward = function(playerMissionBinding) {
        self.refreshCompletedCounterTip();
        // show reward tip. [begin] {
        for (let gift of playerMissionBinding.giftList) {
          const coinFallNode = cc.instantiate(self.coinFallPrefab);
          const coinFallScriptIns = coinFallNode.getComponent("CoinFall");
          coinFallScriptIns.mapScriptIns = self.mapIns;
          coinFallScriptIns.minSpawnXMagnitude = 0;
          coinFallScriptIns.minSpawnYMagnitude = 0;
          coinFallScriptIns.maxSpawnXMagnitude = 0;
          coinFallScriptIns.maxSpawnYMagnitude = 0;
          coinFallScriptIns.sprintIntervalMinMillis = coinFallScriptIns.sprintDurationMillis + 1;
          coinFallScriptIns.sprintIntervalMaxMillis = coinFallScriptIns.sprintDurationMillis + 1;
          coinFallScriptIns.addCoinToMapNode = false;
          coinFallScriptIns.finishCb = function() {
            delete self.coinFallScriptInsDict[coinFallNode.uuid];
          }
          switch (gift.addResourceType) {
          case constants.RESOURCE_TYPE.GOLD:
          coinFallScriptIns.coinType = CoinType.GOLD;
          coinFallNode.setPosition(cc.v2(0, 0));
          self.coinFallScriptInsDict[coinFallNode.uuid] = coinFallScriptIns;
          safelyAddChild(playerAchievementCellIns.goldValueContainer, coinFallNode);
          break;
          case constants.RESOURCE_TYPE.DIAMOND:
          coinFallScriptIns.coinType = CoinType.DIAMOND;
          coinFallNode.setPosition(cc.v2(0, 0));
          self.coinFallScriptInsDict[coinFallNode.uuid] = coinFallScriptIns;
          safelyAddChild(playerAchievementCellIns.diamondValueContainer, coinFallNode);
          break;
          }
          setLocalZOrder(coinFallNode, 999);
        }
        // show reward tip. [end] }
        self.onClaimReward && self.onClaimReward(playerMissionBinding);
      }
      playerAchievementCellIns.onInfo = function(playerMissionBinding, targetPlayerQuestBinding) {
        switch (targetPlayerQuestBinding.resourceType) {
          case constants.QUEST_RESOURCE_TYPE.STATEFUL_BUILDABLE_LEVEL:
            self.mapIns.showMissionHelperPanel(i18n.t('PlayerAchievementPanel.Tip.goToArchivePanelForBuildable'), function() {
              const archivePanel = self.mapIns.showIdlePlayerArchivePanel();
              archivePanel.toggleToBuildableTab();
            });
            break;
          case constants.QUEST_RESOURCE_TYPE.TARGET_INGREDIENT:
            self.mapIns.showMissionHelperPanel(i18n.t('PlayerAchievementPanel.Tip.goToArchivePanelForIngredient'), function() {
              const archivePanel = self.mapIns.showIdlePlayerArchivePanel();
              archivePanel.toggleToIngredientTab();
            });
            break;
          default:
            break;
        }
      }
      cellInited = true;
    }
    playerAchievementCellIns = targetCellNode.getComponent('PlayerAchievementCell');
    playerAchievementCellIns.setData(playerMissionBinding, isDailyMission);
    targetCellNode.anchorY = 1;
    targetCellNode.cachedPosition = cc.v2(0, -(targetCellNode.height + self.cellSpacingY) * index);
    targetCellNode.cachedIndex = index;
    targetCellNode.shouldDelete = false;
    targetCellNode.cachedParentNode = null;
    if (cellInited) {
      targetCellNode.setPosition(targetCellNode.cachedPosition);
      targetCellNode.cachedPosition = null;
      setLocalZOrder(targetCellNode, targetCellNode.cachedIndex);
    }
    return targetCellNode;
  },
  resort() {
    const self = this;
    let sortFn = function(a, b) {
      if (a.state == b.state) {
        // 使新添加playerMissionBinding显示在前面
        return b.id - a.id;
      }
      let priority1 = 0, priority2 = 0;
      switch (a.state) {
      case constants.MISSION_STATE.COMPLETED:
        priority1 = 2;
        break;
      case constants.MISSION_STATE.COMPLETED_OBTAINED:
      case constants.MISSION_STATE.CLAIMED_IN_UPSYNC:
        priority1 = 0;
        break;
      case constants.MISSION_STATE.INCOMPLETE:
        priority1 = 1;
        break;
      }
      switch (b.state) {
      case constants.MISSION_STATE.COMPLETED:
        priority2 = 2;
        break;
      case constants.MISSION_STATE.COMPLETED_OBTAINED:
      case constants.MISSION_STATE.CLAIMED_IN_UPSYNC:
        priority2 = 0;
        break;
      case constants.MISSION_STATE.INCOMPLETE:
        priority2 = 1;
        break;
      }
      if (priority1 < priority2) {
        return 1;
      } else if (priority1 > priority2) {
        return -1;
      } else {
        return b.id - a.id;
      }
    };
    self.playerMissionBindingListForAchievement.sort(sortFn);
    self.playerMissionBindingListForDailyMission.sort(sortFn);
  },

  initTabContainer() {
    const self = this;
    let toggleItemsIndex = self.viewingTab;
    self.onTabChanged(null);
  },

  onTabChanged(toggle) {
    const self = this;
    if (null == toggle) {
      self.playerAchievementContainer.active = false;
      self.playerDailyMissionContainer.active = false;
      self.refreshDailyMissionLabel.node.active = false;
      self.refreshDailyMissionLabel.string = "";
      return;
    }
    const timerDict = {
      total: 0, 
    };
    const t1 = Date.now();
    self.viewingTab = self.tabContainer.toggleItems.indexOf(toggle);
    switch (self.viewingTab) {
    case PlayerAchievementTab.ACHIEVEMENT:
      self.playerDailyMissionContainer.active = false;
      self.refreshDailyMissionLabel.node.active = false;
      self.playerAchievementContainer.active = true;
      break;
    case PlayerAchievementTab.DAILY_MISSION:
      self.playerAchievementContainer.active = false;
      self.playerDailyMissionContainer.active = true;
      self.refreshDailyMissionLabel.node.active = true;
      self.refreshDailyMissionLabel.string = "";
      break;
    default:
      break;
    }
    timerDict.total = (Date.now() - t1);
    console.log("PlayerAchievementPanel.onTabChanged, timerDict == ", timerDict);
  },

  onTabClicked(evt) {
    const self = this;
    if (null != self.mapIns && null != evt) {
      self.mapIns.playEffectCommonButtonClick();
    }
  },
})

