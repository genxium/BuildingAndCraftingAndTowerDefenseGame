const CloseableDialog = require('./CloseableDialog');
const StatelessBuildableInstance = require('./StatelessBuildableInstance');

cc.Class({
  extends: CloseableDialog,
  properties: {
    statelessBuildableInstanceCardPrefab: {
      type: cc.Prefab,
      default: null,
    },
    scrollView: {
      type: cc.ScrollView,
      default: null,
    },
  },
  
  ctor() {
    this.statelessBuildableInstanceCardScriptInsList = []; 
  },

  onLoad() {
    CloseableDialog.prototype.onLoad.call(this);
  },

  refreshStatelessBuildableInstanceCardListNode(mapIns, allStatelessBuildableInstances, ownedStatefulBuildableInstances) {
    const self = this;
    this.mapIns = mapIns;
    const statelessBuildableInstanceCardListNode = this.node;
    let listNode = this.scrollView.content;
    listNode.removeAllChildren();
    this.statelessBuildableInstanceCardScriptInsList = [];
    for (let singleStatelessBuildableInstance of allStatelessBuildableInstances) {
      const singleStatelessBuildableInstanceCardNode = cc.instantiate(this.statelessBuildableInstanceCardPrefab);
      const singleStatelessBuildableInstanceCardScriptIns = singleStatelessBuildableInstanceCardNode.getComponent("StatelessBuildableInstanceCard");
      singleStatelessBuildableInstanceCardScriptIns.init(mapIns, this, singleStatelessBuildableInstance);
      this.statelessBuildableInstanceCardScriptInsList.push(singleStatelessBuildableInstanceCardScriptIns);
      
      safelyAddChild(listNode, singleStatelessBuildableInstanceCardNode);
    }
  },

  refreshDynamicGUI() {
    const self = this;
    for (let statelessBuildableInstanceCardScriptIns of self.statelessBuildableInstanceCardScriptInsList) {
      if (statelessBuildableInstanceCardScriptIns.targetLevelConf.buildingOrUpgradingRequiredGold > self.mapIns.wallet.gold) {
        statelessBuildableInstanceCardScriptIns.requiredGoldLabel.node.color = cc.color('#DE5244');
      } else {
        statelessBuildableInstanceCardScriptIns.requiredGoldLabel.node.color = cc.Color.WHITE;
      }
    }
  },
});
