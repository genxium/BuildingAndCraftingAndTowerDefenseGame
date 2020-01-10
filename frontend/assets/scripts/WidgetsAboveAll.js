const WalletInfo = require('./WalletInfo');

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
    stageTimerNode: {
      type: cc.Node,
      default: null,
    },
    stageGoalQuestListNode: {
      type: cc.Node,
      default: null,
    },
    stageScore: {
      type: cc.Node,
      default: null,
    },
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
    // Load buttons in statefulBuildableController. [end].


    // Initialization of the `buildButton` [begins].
    const buildBtnHandler = new cc.Component.EventHandler();
    buildBtnHandler.target = mapNode;
    buildBtnHandler.component = mapNode.name;
    buildBtnHandler.handler = "onBuildButtonClicked";
    this.buildButton.clickEvents = [
      buildBtnHandler
    ];
    // Initialization of the `buildButton` [end].

    // Initialization of the `cancelBuildButton` [begins].
    const cancelBuildBtnHandler = new cc.Component.EventHandler();
    cancelBuildBtnHandler.target = mapNode;
    cancelBuildBtnHandler.component = mapNode.name;
    cancelBuildBtnHandler.handler = "onCancelBuildButtonClicked";
    this.cancelBuildButton.clickEvents = [
      cancelBuildBtnHandler
    ];
    // Initialization of the `cancelBuildButton` [end].

    // Initialization of the `statefulBuildableInstanceInfoButton` [begins].

    const statefulBuildableInstanceInfoBtnHandler = new cc.Component.EventHandler();
    statefulBuildableInstanceInfoBtnHandler.target = mapNode;
    statefulBuildableInstanceInfoBtnHandler.component = mapNode.name;
    statefulBuildableInstanceInfoBtnHandler.handler = "onStatefulBuildableInstanceInfoButtonClicked";
    this.statefulBuildableInstanceInfoButton.clickEvents = [
      statefulBuildableInstanceInfoBtnHandler
    ];
    // Initialization of the `statefulBuildableInstanceInfoButton` [end].

    // Initialization of the `confirmBuildButton` [begins].
    const confirmBuildBtnHandler = new cc.Component.EventHandler();
    confirmBuildBtnHandler.target = mapNode;
    confirmBuildBtnHandler.component = mapNode.name;
    confirmBuildBtnHandler.handler = "onConfirmBuildButtonClicked";
    this.confirmBuildButton.clickEvents = [
      confirmBuildBtnHandler
    ];
    // Initialization of the `confirmBuildButton` [end].

    // Initialization of the `hqProductionButton` [begins].
    const hqProductionBtnHandler = new cc.Component.EventHandler();
    hqProductionBtnHandler.target = mapNode;
    hqProductionBtnHandler.component = mapNode.name;
    hqProductionBtnHandler.handler = "onHQProductionButtonClicked";
    this.hqProductionButton.clickEvents = [
      hqProductionBtnHandler
    ];
    // Initialization of the `hqProductionButton` [end].

    // Initialization of the `labResearchButton` [begins].
    const labResearchBtnHandler = new cc.Component.EventHandler();
    labResearchBtnHandler.target = mapNode;
    labResearchBtnHandler.component = mapNode.name;
    labResearchBtnHandler.handler = "onLabResearchButtonClicked";
    this.labResearchButton.clickEvents = [
      labResearchBtnHandler
    ];
    // Initialization of the `labResearchButton` [end].
    
    // Initialization of the `upgradeButton` [begins].
    const upgradeBtnHandler = new cc.Component.EventHandler();
    upgradeBtnHandler.target = mapNode;
    upgradeBtnHandler.component = mapNode.name;
    upgradeBtnHandler.handler = "onUpgradeButtonClicked";
    this.upgradeButton.clickEvents = [
      upgradeBtnHandler
    ];
    // Initialization of the `upgradeButton` [end].

    // Initialization of `knapsackButton` [begin].
    const knapsackButtonHanlder = new cc.Component.EventHandler();
    knapsackButtonHanlder.target = mapNode;
    knapsackButtonHanlder.component = mapNode.name;
    knapsackButtonHanlder.handler = "onKnapsackButtonClicked";
    this.knapsackButton.clickEvents = [
      knapsackButtonHanlder
    ];
    // Initialization of `knapsackButton` [end].

    // Initialization of the `iapContainerNode` [begins].
    if (false == cc.sys.isNative || false == mapScriptIns.iapEnabled) {
      self.iapItemPanelEntranceNode.active = false; 
    } 
    // Initialization of the `iapContainerNode` [end].

    // Initialization of debug Mode [begins].
    const debugNodeList = this.node.getChildByName('DebugNodeList');
    if (CC_DEBUG) {
      debugNodeList.active = true;
    } else {
      debugNodeList.parent.removeChild(debugNodeList);
    }
    // Initialization of debug Mode [end].
    
    // Initialization of `boostButton` [begin].
    const boostButtonHanlder = new cc.Component.EventHandler();
    boostButtonHanlder.target = mapNode;
    boostButtonHanlder.component = mapNode.name;
    boostButtonHanlder.handler = "onBoostButtonClicked";
    this.boostButton.clickEvents = [
      boostButtonHanlder
    ];
    // Initialization of `boostButton` [end].

    // Initialization of `recipeButton` [begin].
    const recipeButtonHanlder = new cc.Component.EventHandler();
    recipeButtonHanlder.target = mapNode;
    recipeButtonHanlder.component = mapNode.name;
    recipeButtonHanlder.handler = "onRecipeButtonClicked";
    this.recipeButton.clickEvents = [
      recipeButtonHanlder
    ];
    // Initialization of `recipeButton` [end].

    // Initialization of `bakeryProductionButton` [begin].
    const bakeryProductionButtonHanlder = new cc.Component.EventHandler();
    bakeryProductionButtonHanlder.target = mapNode;
    bakeryProductionButtonHanlder.component = mapNode.name;
    bakeryProductionButtonHanlder.handler = "onBakeryProductionButtonClicked";
    this.bakeryProductionButton.clickEvents = [
      bakeryProductionButtonHanlder
    ];
    // Initialization of `bakeryProductionButton` [end].

    // Initialization of `ingredientProductionButton` [begin].
    const ingredientButtonHanlder = new cc.Component.EventHandler();
    ingredientButtonHanlder.target = mapNode;
    ingredientButtonHanlder.component = mapNode.name;
    ingredientButtonHanlder.handler = "onPlayerIngredientButtonClicked";
    this.ingredientButton.clickEvents = [
      ingredientButtonHanlder
    ];
    // Initialization of `ingredientButton` [end].

    // Initialization of `stageMenuTrigger` [begin].
    const stageMenuTriggerHanlder  = new cc.Component.EventHandler();
    stageMenuTriggerHanlder.target = mapNode;
    stageMenuTriggerHanlder.component = mapNode.name;
    stageMenuTriggerHanlder.handler = "onStageMenuTriggerButtonClicked";
    this.stageMenuTrigger.clickEvents = [
      stageMenuTriggerHanlder
    ];
    // Initialization of `stageMenuTrigger` [end].

    // Initialization of `achievementButton` [begin].
    const achievementButtonHanlder  = new cc.Component.EventHandler();
    achievementButtonHanlder.target = mapNode;
    achievementButtonHanlder.component = mapNode.name;
    achievementButtonHanlder.handler = "onAchievementButtonClicked";
    this.achievementButton.clickEvents = [
      achievementButtonHanlder
    ];
    // Initialization of `achievementButton` [end].
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
    self.mapScriptIns.wallet = {};
    self.mapScriptIns.tutorialStage = 0;
    self.mapScriptIns.saveAllPlayerSyncData();
  },

});
