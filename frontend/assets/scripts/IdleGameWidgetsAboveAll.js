const WalletInfo = require('./WalletInfo');
const ProgressNum = require('./ProgressNum');

cc.Class({
  extends: cc.Component,

  properties: {
    prefabs: {
      type: [cc.Prefab],
      default: [],
    },
    joystickInputControllerNode: {
      type: cc.Node,
      default: null
    },
    statefulBuildableController: {
       type:cc.Node,
       default: null,
    },
    walletNode: {
      type: cc.Node,
      default: null,
    },
    walletInfo: {
      type: WalletInfo,
      default: null,
    },
    goldLabel: {
      type: cc.Label,
      default: null,
    },
    sideButtonGroupNode: {
      type: cc.Node,
      default: null,
    },
    iapContainerNode: {
      type: cc.Node,
      default: null,
    },
    iapItemPanelEntranceNode: {
      type: cc.Node,
      default: null,
    },
    upgradeButtonGoldLabel: {
      type: cc.Label,
      default: null,
    },
    statefulBuildableInstanceInfoLabel: {
      type: cc.Label,
      default: null,
    },
    buttons: {
      type: [cc.Button],
      default: [],
    },
    elapsedTimer: ProgressNum,
    initStateIndicatorNode: cc.Node,
    loadingTip: cc.Node,
  },

  onLoad() {
    const self = this;
    setLocalZOrder(self.walletNode, CORE_LAYER_Z_INDEX.WALLET_INFO);
  },

  init(mapScriptIns, mapNode, canvasNode, isUsingJoystick, isUsingTouchEventManager) {
    const self = this;
    self.mapNode = mapNode;
    self.canvasNode = canvasNode;
    self.mapScriptIns = mapScriptIns;
    if (isUsingTouchEventManager) {
      self.touchEventManagerScriptIns = self.node.getComponent("TouchEventsManager");
      self.touchEventManagerScriptIns.init(mapScriptIns, mapNode, canvasNode, isUsingJoystick);
    }
    mapScriptIns.statefulBuildableController = this.statefulBuildableController;

    // Load buttons in statefulBuildableController. [begin]
    /*
     * The cc.Button in buttons will be renamed to match camel case
     * and bound to widgetsAboveAllScriptIns and BuildableMap.
     */
    self.buttons.forEach((button) => {
      let camcelCaseName = button.node.name.replace(/^[A-Z]/, function(s) { return s.toLowerCase(); });
      self[camcelCaseName] = button;
      mapScriptIns[camcelCaseName] = button;
    });
    // Load buttons in statefulBuildableController. [end]


    // Initialization of the `buildButton` [begins].
    const buildBtnHandler = new cc.Component.EventHandler();
    buildBtnHandler.target = mapNode;
    buildBtnHandler.component = mapNode.name;
    buildBtnHandler.handler = "onBuildButtonClicked";
    this.buildButton.clickEvents = [
      buildBtnHandler
    ];
    // Initialization of the `buildButton` [ends].

    // Initialization of the `cancelBuildButton` [begins].
    const cancelBuildBtnHandler = new cc.Component.EventHandler();
    cancelBuildBtnHandler.target = mapNode;
    cancelBuildBtnHandler.component = mapNode.name;
    cancelBuildBtnHandler.handler = "onCancelBuildButtonClicked";
    this.cancelBuildButton.clickEvents = [
      cancelBuildBtnHandler
    ];
    // Initialization of the `cancelBuildButton` [ends].

    // Initialization of the `statefulBuildableInstanceInfoButton` [begins].

    const statefulBuildableInstanceInfoBtnHandler = new cc.Component.EventHandler();
    statefulBuildableInstanceInfoBtnHandler.target = mapNode;
    statefulBuildableInstanceInfoBtnHandler.component = mapNode.name;
    statefulBuildableInstanceInfoBtnHandler.handler = "onStatefulBuildableInstanceInfoButtonClicked";
    this.statefulBuildableInstanceInfoButton.clickEvents = [
      statefulBuildableInstanceInfoBtnHandler
    ];
    // Initialization of the `statefulBuildableInstanceInfoButton` [ends].

    // Initialization of the `confirmBuildButton` [begins].
    const confirmBuildBtnHandler = new cc.Component.EventHandler();
    confirmBuildBtnHandler.target = mapNode;
    confirmBuildBtnHandler.component = mapNode.name;
    confirmBuildBtnHandler.handler = "onConfirmBuildButtonClicked";
    this.confirmBuildButton.clickEvents = [
      confirmBuildBtnHandler
    ];
    // Initialization of the `confirmBuildButton` [ends].

    // Initialization of the `hqProductionButton` [begins].
    const hqProductionBtnHandler = new cc.Component.EventHandler();
    hqProductionBtnHandler.target = mapNode;
    hqProductionBtnHandler.component = mapNode.name;
    hqProductionBtnHandler.handler = "onHQProductionButtonClicked";
    this.hqProductionButton.clickEvents = [
      hqProductionBtnHandler
    ];
    // Initialization of the `hqProductionButton` [ends].

    // Initialization of the `labResearchButton` [begins].
    const labResearchBtnHandler = new cc.Component.EventHandler();
    labResearchBtnHandler.target = mapNode;
    labResearchBtnHandler.component = mapNode.name;
    labResearchBtnHandler.handler = "onLabResearchButtonClicked";
    this.labResearchButton.clickEvents = [
      labResearchBtnHandler
    ];
    // Initialization of the `labResearchButton` [ends].
    
    // Initialization of the `upgradeButton` [begins].
    const upgradeBtnHandler = new cc.Component.EventHandler();
    upgradeBtnHandler.target = mapNode;
    upgradeBtnHandler.component = mapNode.name;
    upgradeBtnHandler.handler = "onUpgradeButtonClicked";
    this.upgradeButton.clickEvents = [
      upgradeBtnHandler
    ];
    // Initialization of the `upgradeButton` [ends].

    // Initialization of `knapsackButton` [begings].
    const knapsackButtonHanlder = new cc.Component.EventHandler();
    knapsackButtonHanlder.target = mapNode;
    knapsackButtonHanlder.component = mapNode.name;
    knapsackButtonHanlder.handler = "onKnapsackButtonClicked";
    this.knapsackButton.clickEvents = [
      knapsackButtonHanlder
    ];
    // Initialization of `knapsackButton` [ends].

    // Initialization of `vidAdsPanelTrigger` [begings].
    const vidAdsPanelTriggerHanlder = new cc.Component.EventHandler();
    vidAdsPanelTriggerHanlder.target = mapNode;
    vidAdsPanelTriggerHanlder.component = mapNode.name;
    vidAdsPanelTriggerHanlder.handler = "onVidAdsPanelTriggerClicked";
    this.vidAdsPanelTrigger.clickEvents = [
      vidAdsPanelTriggerHanlder
    ];
    // Initialization of `vidAdsPanelTrigger` [ends].

    // Initialization of the `iapContainerNode` [begins].
    if (false == cc.sys.isNative || false == mapScriptIns.iapEnabled) {
      self.iapItemPanelEntranceNode.active = false; 
    } 
    // Initialization of the `iapContainerNode` [ends].

    // Initialization of the `iapContainerNode` [begins].
    if ((cc.sys.platform != cc.sys.WECHAT_GAME && cc.sys.platform != cc.sys.ANDROID) || false == mapScriptIns.vidAdsRewardEnabled) {
      self.vidAdsPanelTrigger.node.active = false; 
    } else {
      self.vidAdsPanelTrigger.node.active = true;
    } 
    // Initialization of the `iapContainerNode` [ends].

    // Initialization of debug Mode [begins].
    const debugNodeList = this.node.getChildByName('DebugNodeList');
    if (CC_DEBUG) {
      debugNodeList.active = true;
    } else {
      debugNodeList.parent.removeChild(debugNodeList);
    }
    // Initialization of debug Mode [ends].
 
    // Initialization of `boostButton` [begings].
    const boostButtonHanlder = new cc.Component.EventHandler();
    boostButtonHanlder.target = mapNode;
    boostButtonHanlder.component = mapNode.name;
    boostButtonHanlder.handler = "onBoostButtonClicked";
    this.boostButton.clickEvents = [
      boostButtonHanlder
    ];
    // Initialization of `boostButton` [ends].

    // Initialization of `recipeButton` [begings].
    const recipeButtonHanlder = new cc.Component.EventHandler();
    recipeButtonHanlder.target = mapNode;
    recipeButtonHanlder.component = mapNode.name;
    recipeButtonHanlder.handler = "onRecipeButtonClicked";
    this.recipeButton.clickEvents = [
      recipeButtonHanlder
    ];
    // Initialization of `recipeButton` [ends].

    // Initialization of `bakeryProductionButton` [begings].
    const bakeryProductionButtonHanlder = new cc.Component.EventHandler();
    bakeryProductionButtonHanlder.target = mapNode;
    bakeryProductionButtonHanlder.component = mapNode.name;
    bakeryProductionButtonHanlder.handler = "onBakeryProductionButtonClicked";
    this.bakeryProductionButton.clickEvents = [
      bakeryProductionButtonHanlder
    ];
    // Initialization of `bakeryProductionButton` [ends].

    // Initialization of `ingredientProductionButton` [begings].
    const ingredientButtonHanlder = new cc.Component.EventHandler();
    ingredientButtonHanlder.target = mapNode;
    ingredientButtonHanlder.component = mapNode.name;
    ingredientButtonHanlder.handler = "onPlayerIngredientButtonClicked";
    this.ingredientButton.clickEvents = [
      ingredientButtonHanlder
    ];
    // Initialization of `ingredientButton` [ends].

    // Initialization of `missionButton` [begings].
    const missionButtonHanlder = new cc.Component.EventHandler();
    missionButtonHanlder.target = mapNode;
    missionButtonHanlder.component = mapNode.name;
    missionButtonHanlder.handler = "onPlayerMissionButtonClicked";
    this.missionButton.clickEvents = [
      missionButtonHanlder
    ];
    // Initialization of `missionButton` [ends].

    // Initialization of `archiveButton` [begings].
    const archiveButtonHanlder = new cc.Component.EventHandler();
    archiveButtonHanlder.target = mapNode;
    archiveButtonHanlder.component = mapNode.name;
    archiveButtonHanlder.handler = "onArchiveButtonClicked";
    this.archiveButton.clickEvents = [
      archiveButtonHanlder
    ];
    // Initialization of `archiveButton` [ends].
    
    // Initialization of `achievementButton` [begin].
    const achievementButtonHanlder  = new cc.Component.EventHandler();
    achievementButtonHanlder.target = mapNode;
    achievementButtonHanlder.component = mapNode.name;
    achievementButtonHanlder.handler = "onAchievementButtonClicked";
    this.achievementButton.clickEvents = [
      achievementButtonHanlder
    ];
    // Initialization of `achievementButton` [end].
    
    // Initialization of `comboButton` [begin].
    const comboButtonHanlder  = new cc.Component.EventHandler();
    comboButtonHanlder.target = mapNode;
    comboButtonHanlder.component = mapNode.name;
    comboButtonHanlder.handler = "onComboButtonClicked";
    this.comboButton.clickEvents = [
      comboButtonHanlder
    ];
    // Initialization of `comboButton` [end].

    // Initialization of `announcementButton` [begin].
    const announcementButtonHanlder  = new cc.Component.EventHandler();
    announcementButtonHanlder.target = mapNode;
    announcementButtonHanlder.component = mapNode.name;
    announcementButtonHanlder.handler = "onAnnouncementButtonClicked";
    this.announcementButton.clickEvents = [
      announcementButtonHanlder
    ];
    // Initialization of `announcementButton` [end].

    // Initialization of `barrackButton` [begin].
    const barrackButtonHanlder  = new cc.Component.EventHandler();
    barrackButtonHanlder.target = mapNode;
    barrackButtonHanlder.component = mapNode.name;
    barrackButtonHanlder.handler = "onBarrackPanelTriggerClicked";
    this.barrackButton.clickEvents = [
      barrackButtonHanlder
    ];
    // Initialization of `barrackButton` [end].

    // Initialization of `gameSettingsButton` [begin].
    const gameSettingsButtonHanlder  = new cc.Component.EventHandler();
    gameSettingsButtonHanlder.target = mapNode;
    gameSettingsButtonHanlder.component = mapNode.name;
    gameSettingsButtonHanlder.handler = "onGameSettingsTriggerClicked";
    this.gameSettingsButton.clickEvents = [
      gameSettingsButtonHanlder
    ];
    // Initialization of `gameSettingsButton` [end].
  },

  clearPlayerSyncDataUpSync() {
    const self = this;
    self.mapScriptIns.statefulBuildableInstanceList = [];
    self.mapScriptIns.wallet = {
      diamond: self.mapScriptIns.wallet.diamond,
    };
    self.mapScriptIns.currentTutorialStage = 0;
    self.mapScriptIns.tutorialStage = 0;
    self.mapScriptIns.interruptTutorialMask = null;
    self.mapScriptIns.housekeeperBindingList = [];
    self.mapScriptIns.housekeeperOfflineIncome = 0;
    self.mapScriptIns.saveAllPlayerSyncData();
  },
});
