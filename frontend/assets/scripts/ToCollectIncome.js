cc.Class({
  extends: cc.Component,

  properties: {
    coinFallPrefab: {
      type: cc.Prefab,
      default: null,
    },
    cachedGoldLabel: {
      type: cc.Label,
      default: null,
    },
    cachedEnergyLabel: {
      type: cc.Label,
      default: null,
    },
    collectButton: {
      type: cc.Button,
      default: null,
    },
    showDurationMillis: 5000,

  },

  ctor() {
    this.cachedGoldCount = 0;
  },

  init(mapScriptIns, statefulBuildableInstance) {
    const mapNode = mapScriptIns.node;
    this.mapScriptIns = mapScriptIns;
    this.lastCollectedAt = statefulBuildableInstance.playerBuildableBinding.lastCollectedAt;
    this.statefulBuildableInstance = statefulBuildableInstance;
    const theTemplateButtonOnClickHandler = new cc.Component.EventHandler();
    theTemplateButtonOnClickHandler.target = this.node;
    theTemplateButtonOnClickHandler.component = this.node.name;
    theTemplateButtonOnClickHandler.handler = "onCollectButtonClicked";
    this.collectButton.clickEvents = [
      theTemplateButtonOnClickHandler
    ];
  },

  setData(cachedGoldCount) {
    const self = this;
    self.cachedGoldCount = cachedGoldCount;
  },

  onCollectButtonClicked(evt) {
    const self = this;
    if (null != self.mapScriptIns) {
      self.mapScriptIns.playEffectCommonButtonClick();
    }
    self.onCollect && self.onCollect(evt);
  },

  playCoinFallAnim(cb) {
    const parentNode = this.node.parent;
    if (!parentNode) return;
    if (!this.coinFallPrefab) return;
    const coinFallNode = cc.instantiate(this.coinFallPrefab);

    //dirty hack
    const coinFallScriptIns = coinFallNode.getComponent("CoinFall");
    coinFallScriptIns.mapScriptIns = this.mapScriptIns;
    coinFallScriptIns.finishCb = cb;

    coinFallNode.setPosition(this.node.position);
    safelyAddChild(parentNode, coinFallNode);
    setLocalZOrder(coinFallNode, 999);
  },

  start() {},
});
