const CloseableDialog = require("./CloseableDialog");

module.export = cc.Class({
  extends: CloseableDialog,

  properties: {
    IapItemCellPrefab: {
      type: cc.Prefab,
      default: null,
    },
    listNode: {
      type: cc.Node,
      default: null,
    },
  },

  onLoad() {
    CloseableDialog.prototype.onLoad.call(this);
  },

  setIapItems(items) {
    this.listNode.removeAllChildren();
    let indice = 0;
    //order itemInfo
    let orderedItemList = [];
    for (let itemInfo of items) {
      orderedItemList.push(itemInfo);
    }
    orderedItemList.sort((firstEl, secondEl) => {
      return (firstEl.price > secondEl.price);
    });
    
    const verticalOffsetPtsEach = -306;
    const verticalOffsetPtsOverall = -127;
    for (let index in orderedItemList) {
      const info = orderedItemList[index];
      const singleCell = cc.instantiate(this.IapItemCellPrefab);
      const singleScriptIns = singleCell.getComponent("IapItemCell");
      singleScriptIns.setIapItemCell(info);
      singleScriptIns.theIapItemPanelNode = this.node;
      singleScriptIns.mapScriptIns = this.mapScriptIns;
      singleCell.setPosition(cc.v2(0, verticalOffsetPtsOverall + (indice * verticalOffsetPtsEach))); 
      this.listNode.addChild(singleCell);
      ++indice;
    }
  },
});
