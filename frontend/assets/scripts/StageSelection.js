const NarrativeSceneManagerDelegate = require('./NarrativeScenes/NarrativeSceneManagerDelegate');
const StageWallet = require('./StageWallet');
const i18n = require('LanguageData');
const ProgressNum = require('ProgressNum');
i18n.init(window.language); // languageID should be equal to the one we input in New Language ID input field

cc.Class({
  extends: NarrativeSceneManagerDelegate,

  properties: {
    stageCellPrefab: {
      default: null,
      type: cc.Prefab
    },
    iapEnabled: true, // This variable MUST BE consistent with that of "BuildableMap.properties.iapEnabled".
    stageSelectionScrollView: cc.ScrollView,
    wallet: StageWallet,
    stageProgressHintLabel: cc.Label,
    stageProgress: cc.ProgressBar,
    backToMapBtn: cc.Button,
    loadingProgressBar: cc.ProgressBar,
    showRuleBtn: cc.Button,
    vidAdsRewardEnabled: true,
    vidAdsPanelTrigger: cc.Button,
    diamondLimitTrigger: cc.Button,
    diamondInfoContainer: cc.Node,
    diamondInfoTip: cc.Label,
    autoFillDiamondTimer: ProgressNum,
  },

  ctor() {
    this.playerStageBindingList = []; // [playerStageBinding]
    this.playerStageBindingDict = {}; // {stageId: playerStageBinding}
    this.stageList = []; // [stageData]
    this.stageDict = {}; // {stageId: stageData}
    this.interactable = true;
  },

  // LIFE-CYCLE CALLBACKS:
  onLoad () {
    const self = this;
    if (null == window.ttShareImageUrl) {
      window.ttShareImageUrl = "https://sf1-ttcdn-tos.pstatp.com/obj/developer/app/tt266c50d1b94607ef/icon4b164ac"; // Configured in the management console of specific app in ByteDanceDeveloper. 
    }
    if (null != window.tt) {
      tt.hideShareMenu();
      tt.onShareAppMessage((channel) => {
        const ttToShareMessage = {
          imageUrl: window.ttShareImageUrl,
          title: i18n.t("ByteDanceGameTitle"),
          success() {
            console.log("分享成功");
          },
          fail(e) {
            console.log("分享失败", e);
          }
        };
        console.warn("The ttToShareMessage for sharing: ", ttToShareMessage, ", for channel: ", channel);
        return ttToShareMessage;
      });
    } else {
      if (cc.sys.platform == cc.sys.WECHAT_GAME) {
        const wxToShareMessage = {
          title: i18n.t('GameTitle'),
          imageUrl: window.wxShareImageUrl,  
          imageUrlId: window.wxShareImageId,  
        };
        wx.showShareMenu();
        wx.onShareAppMessage(() => {
          return wxToShareMessage;
        });
      }
    }

    self.wallet.stageSelectionScriptIns = self;
    self.wallet.diamondNode.getComponent('ProgressNum').formulateIndicatorLabelStr = function() {
      return ProgressNum.prototype.formulateIndicatorLabelStr.apply(this, arguments) + '/' + self.wallet.diamondLimit;
    }
    NarrativeSceneManagerDelegate.prototype.onLoad.apply(self, arguments);
    window.stageSelectionScene = self;
    // Initialization of Dialog. [begin]
    if (null == window.enabledDialogs) {
      window.enabledDialogs = [];
    }
    self.viewingPanelManager = [];
    self.viewingPanelManager.hasPanel = function(nodeName) {
      return !!this.find(x => x.node.name == nodeName);
    };
    // Initialization of Dialog [end]

    // Try loading from window.cachedPlayerStageBindingData. [begin]
    function onPlayerStageBindingListQuerySucceed(res) {
      self.setStageList(res.stageList);
      self.setPlayerStageBindingList(res.playerStageBindingList);
      self.wallet.diamondLimit = res.diamondAutoFillUpperLimit;
      self.wallet.diamond = res.diamond;
      self.wallet.star = res.star;
      self.refresh();
      // Scroll to the latest unlocked stage. [begin] {
      self.stageSelectionScrollView.node.opacity = 0;
      self.scheduleOnce(function() {
        let latestUnlockedStageIndex = 0;
        for (let i = 0; i < self.stageList.length; i++) {
          let stage = self.stageList[i];
          let stageBinding = self.getPlayerStageBinding(stage.stageId);
          if (null == stageBinding) {
            break;
          } else {
            latestUnlockedStageIndex = i;
          }
        }
        let boundingBox = self.stageSelectionScrollView.content.children[latestUnlockedStageIndex].getBoundingBox();
        self.stageSelectionScrollView.scrollToOffset(cc.v2(0, boundingBox.yMax * -1), 0);
        self.stageSelectionScrollView.node.opacity = 255;
      });
      // Scroll to the latest unlocked stage. [end] }

      // Activate the autoFillDiamondTimer. [begin] {
      let currentTimeMillis = Date.now();
      let currentDate = new Date();
      currentDate.setUTCHours(0, 0, 0, 0);
      let nextDayMillis = currentDate.getTime() + 3600 * 24 *1000;
      self.autoFillDiamondTimer.setData(currentTimeMillis, nextDayMillis - currentTimeMillis);
      self.autoFillDiamondTimer.update = function(dt) {
        let progressNumberIns = self.autoFillDiamondTimer;
        let prevCurrentlyDisplayingQuantity = progressNumberIns.currentlyDisplayingQuantity;
        ProgressNum.prototype.update.call(progressNumberIns, dt);
        if (null !== progressNumberIns.maxValue &&
            prevCurrentlyDisplayingQuantity < progressNumberIns.maxValue &&
            progressNumberIns.currentlyDisplayingQuantity >= progressNumberIns.maxValue
        ) {
          self.sendPlayerStageBindingListQuery(function(res) {
            window.cachedPlayerStageBindingData = res;
            onPlayerStageBindingListQuerySucceed(res);
          }, function(err, res) {
            if (null == err && null != res && constants.RET_CODE.INVALID_TOKEN == res.ret) {
              window.handleTokenExpired(self.node, self.simplePressToGoDialogPrefab);
            } else {
              window.handleNetworkDisconnected(self.node, self.simplePressToGoDialogPrefab);
            }
          });
        }
      }
      // Activate the autoFillDiamondTimer. [end] }
    }

    let firstCachedPlayerStageBinding = null; 
    let selfPlayer = null;
    if (null != window.cachedPlayerStageBindingData && null != window.cachedPlayerStageBindingData.playerStageBindingList && 0 < window.cachedPlayerStageBindingData.playerStageBindingList.length) {
       firstCachedPlayerStageBinding = window.cachedPlayerStageBindingData.playerStageBindingList[0];
    } 
    const selfPlayerStr = cc.sys.localStorage.getItem("selfPlayer");
    if (null == selfPlayerStr) {
      window.handleNetworkDisconnected(self.node, self.simplePressToGoDialogPrefab);
      return;
    }
    try {
      selfPlayer = JSON.parse(selfPlayerStr);
    } catch (e) {
      console.warn(e);
      window.handleNetworkDisconnected(self.node, self.simplePressToGoDialogPrefab);
      return;
    }

    if (null != firstCachedPlayerStageBinding && null != selfPlayer && firstCachedPlayerStageBinding.playerId == selfPlayer.playerId) {
      self.scheduleOnce(function() {
        onPlayerStageBindingListQuerySucceed(window.cachedPlayerStageBindingData);
      });
    } else {
      self.interactable = false;
      self.refreshButtonInteractable();
      self.sendPlayerStageBindingListQuery(function(res) {
        self.interactable = true;
        self.refreshButtonInteractable();
        window.cachedPlayerStageBindingData = res;
        onPlayerStageBindingListQuerySucceed(res);
      }, function(err, res) {
        if (null == err && null != res && constants.RET_CODE.INVALID_TOKEN == res.ret) {
          window.handleTokenExpired(self.node, self.simplePressToGoDialogPrefab);
        } else {
          window.handleNetworkDisconnected(self.node, self.simplePressToGoDialogPrefab);
        }
      });
 
    }
    // Try loading from window.cachedPlayerStageBindingData. [end]

    // Prevent scrollBar show in beginning. [begin]
    let verticalScrollBar = self.stageSelectionScrollView.verticalScrollBar;
    let horizontalScrollBar = self.stageSelectionScrollView.horizontalScrollBar;
    if (null != verticalScrollBar) {
      verticalScrollBar.show = cc.Scrollbar.prototype.hide;
      verticalScrollBar.enableAutoHide = false;
    }
    if (null != horizontalScrollBar) {
      horizontalScrollBar.show = cc.Scrollbar.prototype.hide;
      horizontalScrollBar.enableAutoHide = false;
    }
    // Prevent scrollBar show in beginning. [end]

    // Initialization of backToMapBtn. [begin] {
    let backToMapButtonClickEvent = new cc.Component.EventHandler();
    backToMapButtonClickEvent.target = self.node;
    backToMapButtonClickEvent.component = self.node.name;
    backToMapButtonClickEvent.handler = 'backToMap';
    self.backToMapBtn.clickEvents = [
      backToMapButtonClickEvent,
    ];
    // Initialization of backToMapBtn. [end] }

    // Initialization of showRuleBtn. [begin] {
    let showRuleButtonClickEvent = new cc.Component.EventHandler();
    showRuleButtonClickEvent.target = self.node;
    showRuleButtonClickEvent.component = self.node.name;
    showRuleButtonClickEvent.handler = 'showRule';
    self.showRuleBtn.clickEvents = [
      showRuleButtonClickEvent,
    ];
    // Initialization of showRuleBtn. [end] }
  },

  showRule() {
    const self = this;
    if (!self.isPurelyVisual()) {
      // If the depth of dialog is no less than 1, modify this.
      return;
    }
    const simplePressToGoDialogNode = cc.instantiate(self.bigSimplePressToGoDialogPrefab);
    simplePressToGoDialogNode.setPosition(cc.v2(0, 0));
    const simplePressToGoDialogScriptIns = simplePressToGoDialogNode.getComponent("SimplePressToGoDialog");
    simplePressToGoDialogScriptIns.onCloseDelegate = () => {
      self.exitPanelView(simplePressToGoDialogScriptIns);
    };
    simplePressToGoDialogScriptIns.setTitleLabel(i18n.t('Tip.stageRuleTitle'));
    simplePressToGoDialogScriptIns.setHintRichText(i18n.t('StageSelectionScene.Tip.rule'));
    self.enterPanelView(simplePressToGoDialogScriptIns);
    return simplePressToGoDialogScriptIns;
  },

  sendPlayerStageBindingListQuery(successCb, failCb) {
    /*
    * There're several spots where this method is invoked.
    * - if "null == window.cachedPlayerStageBindingData" for initializing this scene
    * - for triggering "diamond autofill" when applicable
    *
    * -- YFLu, 2019-12-06.
    */
    NetworkUtils.ajax({
      url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + ':' + backendAddress.PORT + constants.ROUTE_PATH.API + constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.PLAYER_STAGE_BINDING + constants.ROUTE_PATH.LIST + constants.ROUTE_PATH.QUERY,
      type: "POST",
      data: {
        intAuthToken: JSON.parse(cc.sys.localStorage.getItem("selfPlayer")).intAuthToken,
        reqSeqNum: Date.now(),
      },
      success(res) {
        if (constants.RET_CODE.OK != res.ret) {
          console.warn('Send playerStageBindingList query failed and return code is', res.ret);
          failCb && failCb(null, res);
        } else {
          successCb && successCb(res);
        }
      },
      error(err) {
        console.warn('Error occurs when send playerStageBindingList query', err);
        failCb && failCb(err, null);
      },
      timeout() {
        console.warn('Send playerStageBindingList query timeout.');
        failCb && failCb(new Error(constants.NETWORK.ERROR.TIMEOUT), null);
      },
    });
  },

  refresh() {
    const self = this;
    let passedStageCount = 0;
    const playerStageBindingList = self.playerStageBindingList;
    const stageSelectionListNode = self.stageSelectionScrollView.content;
    stageSelectionListNode.removeAllChildren();
    function refreshOrInitStageSelectionCell(index) {
      if (index < 0 || index > self.stageList.length) {
        // if the node existed, unactive it.
        if (index >= 0 && index < stageSelectionListNode.children.length) {
          stageSelectionListNode.children[index].active = false;
        }
        return false;
      }
      const stageData = self.stageList[index];
      const targetPlayerStageBinding = self.getPlayerStageBinding(stageData.stageId);
      const isUnlockable = self.isStageUnlockable(stageData.stageId), isPassed = self.isStagePassed(stageData.stageId);

      let stageListNode = stageSelectionListNode.children[index];
      let stageComponent = null;

      const isTutorialStage = index == 0; // hardcoded temporarily.

      if (null == stageListNode) {
        // Initialization of stageListNode.
        stageListNode = cc.instantiate(self.stageCellPrefab);
        stageComponent = stageListNode.getComponent('StageSelectionCell');
        stageComponent.init(self);
        
        stageComponent.setData(stageData, targetPlayerStageBinding, index + 1, isUnlockable, isPassed, isTutorialStage);
        stageComponent.onStart = function() {
          if (!self.isPurelyVisual()) {
            return;
          }
          function succeedCb() {
            cc.sys.localStorage.setItem('stage', JSON.stringify({
              stageId: stageComponent.stage.stageId,
              stage: stageComponent.stage,
              index: stageComponent.index, // stage == stageList[index-1].
              stageBinding: stageComponent.stageBinding,
              diamond: self.getDiamondCount(),
            }));
            self._enterStageMap();
          }
          if (stageComponent.stage.ticketPrice == 0) {
            succeedCb();
            return;
          }
          self.showSimpleConfirmationPanel(cc.js.formatStr(
            i18n.t('StageSelectionScene.Tip.enterStageMap'), stageComponent.stage.ticketPrice
          ), function confirmCallback() {
            self.costDiamondsToDo(stageComponent.stage.ticketPrice, function() {
              self.interactable = false;
              self.refreshButtonInteractable();
              succeedCb();
            }, function() {
              const simplePressToGoPanelNode = cc.instantiate(self.simplePressToGoDialogPrefab);
              const simplePressToGoPanelIns = simplePressToGoPanelNode.getComponent('SimplePressToGoDialog');
              simplePressToGoPanelIns.setTitleLabel(i18n.t("StageSelectionScene.Tip.lackOfDiamondTitle"));
              simplePressToGoPanelIns.setHintLabel(i18n.t("errorHint.lackOfDiamond"));
              simplePressToGoPanelIns.onCloseDelegate = function() {
                self.exitPanelView(simplePressToGoPanelIns);
              };
              self.enterPanelView(simplePressToGoPanelIns);
            });  
          });
        }
        stageComponent.onUnlock = function() {
          self.showUnlockStageConfirmationPanel(stageComponent.stage.id, function confirmedAndUnlockSucceess({
            playerStageBinding, star, diamond
          }) {
            refreshOrInitStageSelectionCell(index);
            refreshOrInitStageSelectionCell(index + 1);
          }, function confirmedAndUnlockFail({ret}) {
            // thus do nothing.
          }, function cancel() {
            // thus do nothing.
          });
        }
        stageSelectionListNode.addChild(stageListNode);

      } else {
        stageComponent = stageListNode.getComponent('StageSelectionCell');
        stageComponent.setData(stageData, targetPlayerStageBinding, index + 1, isUnlockable, isPassed, isTutorialStage);
      }
      stageComponent.refresh();
    }

    let totalStageListCount = 0;
    for (let index = 0, len = self.stageList.length; index < len; index++) {
      const stageData = self.stageList[index]; 
      refreshOrInitStageSelectionCell(index);
      // Calculate passedStage count. [begin]
      if (self.isStagePassed(stageData.stageId)) {
        ++passedStageCount;
      }
      // Calculate passedStage count. [end]
      // Calculate totalStageListCount. [begin]
      if (stageData.id != constants.FUTURE_STAGE_ID) {
        ++totalStageListCount;
      }
      // Calculate totalStageListCount. [end]
    }

    // To enable showing scrollBar. [begin]
    self.scheduleOnce(function() {
      let verticalScrollBar = self.stageSelectionScrollView.verticalScrollBar;
      let horizontalScrollBar = self.stageSelectionScrollView.horizontalScrollBar;
      if (null != verticalScrollBar) {
        verticalScrollBar.show = cc.Scrollbar.prototype.show;
        verticalScrollBar.enableAutoHide = true;
      }
      if (null != horizontalScrollBar) {
        horizontalScrollBar.show = cc.Scrollbar.prototype.show;
        verticalScrollBar.enableAutoHide = true;
      }

    })
    // To enbale showing ScrollBar. [end]


    if (self.stageList.length > 0) { 
      self.stageProgressHintLabel.string = cc.js.formatStr('%s/%s', passedStageCount, totalStageListCount);
      self.stageProgress.node.active = true;

      self.stageProgress.progress = passedStageCount / totalStageListCount;
    } else {
      self.stageProgressHintLabel.node.active = false;
      self.stageProgress.node.active = false;
    }
  },

  _enterStageMap() {
    const self = this;
    self.interactable = false;
    self.refreshButtonInteractable();
    self.loadingProgressBar.node.active = true;
    self.loadingProgressBar.progress = 0;
    const holdingProgress = 0.2;
    cc.director.preloadScene("StageMap", function(completedCount, totalCount, item) {
      self.loadingProgressBar.progress = (completedCount / totalCount) * (1 - holdingProgress);
    }, function(err, asset) {
      if (null != err) {
        self.onLoadSceneFailed();
        return;
      }
      cc.tween(self.loadingProgressBar).
        to(constants.DURATION_MILLIS.PROGRESS_LOADED / 1000, { progress: 1 }).
        call(() => {
          if (!cc.director.loadScene("StageMap", function(err) {
            if (null != err) {
              self.onLoadSceneFailed();
              return;
            }
          })) {
            self.onLoadSceneFailed();
          }
        })
        .start();
    });
  },

  onLoadSceneFailed() {
    const self = this;
    self.interactable = true;
    self.refreshButtonInteractable();
    self.loadingProgressBar.progress = 0;
    self.loadingProgressBar.node.active = true;
  },

  getDiamondCount() {
    const self = this;
    return self.wallet.diamond;
  },

  getStarCount() {
    const self = this;
    return self.wallet.star;
  },

  isStageUnlockable(stageId) {
    const self = this;
    let prevPlayerStageBinding = self.getPlayerStageBinding(stageId - 1);
    if (null == prevPlayerStageBinding) {
      return false;
    }
    let targetPlayerStageBinding = self.getPlayerStageBinding(stageId);
    if (null == targetPlayerStageBinding) {
      // 由于上一关还未过关，故不存在该记录
      let targetStage = self.getStage(stageId);
      // 0: could not buy stage with diamonds/stars
      return 0 != targetStage.starPrice || 0 != targetStage.diamondPrice;
    } else {
      // 已解锁
      return false;
    }
  },

  isStageUnlocked(stageId) {
    const self = this;
    return null != self.getPlayerStageBinding(stageId);
  },

  isStagePassed(stageId) {
    const self = this;
    let targetStage = self.getStage(stageId), targetStageBinding = self.getPlayerStageBinding(stageId);
    if (null == targetStage || null == targetStageBinding) {
      return false;
    }
    return targetStage.passScore <= targetStageBinding.highestScore;
  },

  setStageList(stageList) {
    const self = this;
    stageList = null == stageList ? [] : stageList;
    self.stageList = stageList;
    self.stageDict = {};
    for (let i = 0, len = stageList.length; i < len; i++) {
      const stage = stageList[i];
      const decodedStageInitialState = window.pbDecodeData(window.stageInitialState, stage.pbEncodedData);
      stage.ticketPrice = decodedStageInitialState.ticketPrice;
      self.stageDict[stage.stageId] = stage;
    }
    if (null != window.cachedPlayerStageBindingData) {
      window.cachedPlayerStageBindingData.stageList = stageList;
    }
  },

  updatePlayerStageBinding(playerStageBinding) {
    const self = this;
    let originalPlayerStageBinding = self.playerStageBindingDict[playerStageBinding.stageId];
    if (null == originalPlayerStageBinding) {
      self.playerStageBindingList.push(playerStageBinding);
      self.playerStageBindingDict[playerStageBinding.stageId] = playerStageBinding;
      if (null != window.cachedPlayerStageBindingData) {
        window.cachedPlayerStageBindingData.playerStageBindingList = self.playerStageBindingList;
      }
    } else {
      if (originalPlayerStageBinding != playerStageBinding) {
        Object.assign(originalPlayerStageBinding, playerStageBinding);
      }
    }
  },

  setPlayerStageBindingList(playerStageBindingList) {
    const self = this;
    playerStageBindingList = null == playerStageBindingList ? [] : playerStageBindingList;
    self.playerStageBindingList = [];
    self.playerStageBindingDict = {};
    for (let i = 0, len = playerStageBindingList.length; i < len; i++) {
      const playerStageBinding = playerStageBindingList[i];
      self.updatePlayerStageBinding(playerStageBinding);
    }
    if (null != window.cachedPlayerStageBindingData) {
      window.cachedPlayerStageBindingData.playerStageBindingList = self.playerStageBindingList;
    }
  },

  getStage(stageId) {
    const self = this;
    if (null == self.stageDict) {
      return null;
    }
    return self.stageDict[stageId];
  },

  getPlayerStageBinding(stageId) {
    const self = this;
    if (null == self.playerStageBindingDict) {
      return null;
    }
    return self.playerStageBindingDict[stageId];
  },

  showUnlockStageConfirmationPanel(stageId, confirmedAndUnlockSucceessCb, confirmedAndUnlockFailCb, cancelCb) {
    const self = this;
    if (!self.isPurelyVisual()) {
      return;
    }
    const stage = self.getStage(stageId);
    const simplePressToGoPanelNode = cc.instantiate(self.simplePressToGoDialogPrefab);
    const simplePressToGoPanelIns = simplePressToGoPanelNode.getComponent('SimplePressToGoDialog');
    simplePressToGoPanelIns.setTitleLabel(i18n.t("StageSelectionScene.Tip.unlockTitle"));
    simplePressToGoPanelIns.setHintLabel(i18n.t("StageSelectionScene.Tip.unlock"));
    simplePressToGoPanelIns.onCloseDelegate = function() {
      self.exitPanelView(simplePressToGoPanelIns);
    };
    self.enterPanelView(simplePressToGoPanelIns);
    return simplePressToGoPanelIns;
  },

  sendPlayerStagePurchaseByStarQuery(stageId, successCb, failCb) {
    const self = this;
    NetworkUtils.ajax({
      url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + ':' + backendAddress.PORT + constants.ROUTE_PATH.API + constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.PLAYER_STAGE + constants.ROUTE_PATH.PURCHASE + constants.ROUTE_PATH.STAR,
      type: "POST",
      data: {
        intAuthToken: JSON.parse(cc.sys.localStorage.getItem("selfPlayer")).intAuthToken,
        reqSeqNum: Date.now(),
        stage: stageId,
      },
      success(res) {
        if (constants.RET_CODE.OK != res.ret) {
          console.warn('Send playerStagePurchaseByStar query failed and return code is', res.ret);
          failCb && failCb(null, res);
        } else {
          self.updatePlayerStageBinding(res.playerStageBinding);
          self.wallet.setData(res.star, res.diamond);
          successCb && successCb(res);
        }
      },
      error(err) {
        console.warn('Error occurs when send playerStagePurchaseByStar query', err);
        failCb && failCb(err, null);
      },
      timeout() {
        console.warn('Send playerStagePurchaseByStar query timeout.');
        failCb && failCb(new Error(constants.NETWORK.ERROR.TIMEOUT), null);
      },
    });
  },

  sendPlayerStagePurchaseByDiamondQuery(stageId, successCb, failCb) {
    const self = this;
    NetworkUtils.ajax({
      url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + ':' + backendAddress.PORT + constants.ROUTE_PATH.API + constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.PLAYER_STAGE + constants.ROUTE_PATH.PURCHASE + constants.ROUTE_PATH.DIAMOND,
      type: "POST",
      data: {
        intAuthToken: JSON.parse(cc.sys.localStorage.getItem("selfPlayer")).intAuthToken,
        reqSeqNum: Date.now(),
        stage: stageId,
      },
      success(res) {
        if (constants.RET_CODE.OK != res.ret) {
          console.warn('Send playerStagePurchaseByDiamond query failed and return code is', res.ret);
          failCb && failCb(null, res);
        } else {
          self.updatePlayerStageBinding(res.playerStageBinding);
          self.wallet.setData(res.star, res.diamond);
          successCb && successCb(res);
        }
      },
      error(err) {
        console.warn('Error occurs when send playerStagePurchaseByDiamond query', err);
        failCb && failCb(err, null);
      },
      timeout() {
        console.warn('Send playerStagePurchaseByDiamond query timeout.');
        failCb && failCb(new Error(constants.NETWORK.ERROR.TIMEOUT), null);
      },
    });
  },
 
  enterPanelView(targetPanel) {
  
    const self = this;

    if (self.viewingPanelManager.hasPanel(targetPanel.node.name) && self.viewingPanelManager.indexOf(targetPanel) == -1) {
      cc.warn('Duplicated panel:', targetPanel.node.name);
    }

    cc.log('enter panel:', targetPanel.node.name);
    if (self.viewingPanelManager.length) {
      // has some panel viewing already
      let index = self.viewingPanelManager.indexOf(targetPanel),
        len = self.viewingPanelManager.length;
      let viewingPanel = self.viewingPanelManager[len-1];
      if (!viewingPanel.fixed) {
        viewingPanel.node.active = false;
      }
      if (index == -1) {
        // push the targetPanel into top of the stack
        self.viewingPanelManager.push(targetPanel);
        window.safelyAddChild(self.node, targetPanel.node);
      } else if (index != self.viewingPanelManager.length - 1) {
        // move the targetPanel into top of the stack
        self.viewingPanelManager.push(
          self.viewingPanelManager.splice(index, 1)[0]
        );
      } else {
        // the targetPanel already at the top of the stack
      }
      targetPanel.node.active = true;
      return false;
    }

    self.addShowingModalPopup();
    targetPanel.node.active = true;
    self.viewingPanelManager.push(targetPanel);
    window.safelyAddChild(self.node, targetPanel.node);
    return true;
  },

  exitPanelView(targetPanel) {
    cc.log('exit panel:', targetPanel.node.name);
    // the CloseableDialog will remove dialog from parent automatically
    // thus this place could not care about remove.
    const self = this;
    // remove the targetPanel from the viewingPanelManager and active
    // the panel which is at the top.
    let index = self.viewingPanelManager.indexOf(targetPanel);
    if (index != -1) {
      targetPanel.node.active = false;
      self.viewingPanelManager.splice(index, 1);
    } else {
      return self.viewingPanelManager.length == 0;
    }

    if (self.viewingPanelManager.length) {
      self.viewingPanelManager[self.viewingPanelManager.length-1].node.active = true;
      return false;
    }

    self.removeShowingModalPopup();
    return true;
  },

  clearPanels() {
    const self = this;
    for (let panel of self.viewingPanelManager.slice()) {
      if (panel.node.active) {
        panel.onCloseClicked();
      } else {
        panel.node.removeFromParent();
        panel.onCloseDelegate && panel.onCloseDelegate(null);
      }
      self.exitPanelView(panel);
    }
  },

  backToMap() {
    const self = this;
    if (!self.interactable) {
      return;
    }
    if (!self.isPurelyVisual()) {
      return;
    }
    self.interactable = false;
    self.refreshButtonInteractable();
    self.loadingProgressBar.node.active = true;
    self.loadingProgressBar.progress = 0;
    const holdingProgress = 0.2;
    cc.director.preloadScene("IdleGameMap", function(completedCount, totalCount, item) {
      self.loadingProgressBar.progress = (completedCount / totalCount) * (1 - holdingProgress);
    }, function(err, asset) {
      if (null != err) {
        self.onLoadSceneFailed();
        return;
      }
      cc.tween(self.loadingProgressBar).
        to(constants.DURATION_MILLIS.PROGRESS_LOADED / 1000, { progress: 1 }).
        call(() => {
          if (!cc.director.loadScene("IdleGameMap", function(err) {
            if (null != err) {
              self.onLoadSceneFailed();
              return;
            }
          })) {
            self.onLoadSceneFailed();
          }
        })
        .start();
    });
  },

  refreshButtonInteractable() {
    const self = this;
    self.backToMapBtn.interactable = self.interactable;
    self.showRuleBtn.interactable = self.interactable;
    const stageSelectionListNode = self.stageSelectionScrollView.content;
    stageSelectionListNode.children.forEach(function(stageSelectionCellNode) {
      let theCellIns = stageSelectionCellNode.getComponent('StageSelectionCell');
      theCellIns.setButtonInteractable(self.interactable);
    });
  },

  costTicketPriceToStartStage(stageId) {
    const self = this;
    const stage = self.getStage(stageId);
    
  },

  costDiamondsToDo(requiredDiamonds, callback, callbackOnDiamondNotEnough) {
    const self = this;
    let currentDiamondInWallet = self.wallet.diamond;
    if (currentDiamondInWallet < requiredDiamonds) {
      callbackOnDiamondNotEnough && callbackOnDiamondNotEnough(currentDiamondInWallet, requiredDiamonds);
      return false;
    } else {
      self.wallet.diamond -= requiredDiamonds;
      callback && callback(currentDiamondInWallet, self.wallet.diamond);
      return true;
    }
  },

  _sendPlayerSyncDataUpsync(queryParam, callback) {
    const self = this;

    self.latestSyncDataReqSeqNum = Date.now();

    queryParam.reqSeqNum = self.latestSyncDataReqSeqNum;

    NetworkUtils.ajax({
      url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + ':' + backendAddress.PORT + constants.ROUTE_PATH.API +
        constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.MYSQL + constants.ROUTE_PATH.SYNCDATA + constants.ROUTE_PATH.UPSYNC,
      type: 'POST',
      data: queryParam,
      success: function(res) {
        if (constants.RET_CODE.OK != res.ret) {
          console.warn("_sendPlayerSyncDataUpsync fails and ret == ", res.ret);
          if (constants.RET_CODE.INVALID_TOKEN == res.ret) {
            if (window.handleTokenExpired) {
              window.handleTokenExpired(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
            }
          } else {
            if (window.handleNetworkDisconnected) {
              window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
            }   
          }
          return;
        }
        callback && callback();
      }, 
      error: function(err) {
        console.error(err);
        if (null != window.handleNetworkDisconnected) {
          window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
        }
      }, 
      timeout: function() {
        if (null != window.handleNetworkDisconnected) {
          window.handleNetworkDisconnected(self.widgetsAboveAllNode, self.simplePressToGoDialogPrefab);
        }
      },
    });
  },

  showSimpleConfirmationPanel(hintLabel, confirmCallback, cancelCallback, closeCallback) {
    const self = this;
    const confirmationPanelNode = cc.instantiate(self.confirmationPanelPrefab);
    const confirmationPanelIns = confirmationPanelNode.getComponent('ConfirmationPanel');
    confirmationPanelIns.init(self);
    confirmationPanelIns.setHintLabel(hintLabel);
    confirmationPanelIns.onCloseDelegate = function() {
      self.exitPanelView(confirmationPanelIns);
      closeCallback && closeCallback();
    };
    confirmationPanelIns.onConfirm = confirmCallback;
    confirmationPanelIns.onCancel = cancelCallback;
    self.enterPanelView(confirmationPanelIns);
    return confirmationPanelIns;
  },

  playEffectCommonButtonClick() {
    if (null == this.commonButtonClickAudioClip) return;
    cc.audioEngine.playEffect(this.commonButtonClickAudioClip, false);
  },

  showDiamondLimitTip(evt) {
    const self = this;
    self.diamondInfoContainer.stopAllActions();
    self.diamondInfoTip.string = cc.js.formatStr(i18n.t('StageSelectionScene.Tip.diamondInfo'), constants.AUTO_FILL_DIAMOND_COUNT);
    self.diamondInfoContainer.active = true;
    self.diamondInfoContainer.runAction(
      cc.sequence(
        cc.delayTime(3),
        cc.callFunc(function() {
          self.diamondInfoContainer.active = false;
        })
      )
    );
  },

});
