cc.Class({
  extends: cc.Component,

  properties: {
    content: {
      type: cc.Node,
      default: null,
    },
    ingredientPageCellPrefab: {
      type: cc.Prefab,
      default: null,
    },
    length: 16,
    cellDragable: false,
    useWidgets: false,
    isLayoutGrid: true,
  },

  setData(knapsackArray) {
    const self = this;
    self.data = knapsackArray;
  },

  onLoad() {
  },

  init(mapIns) {
    const self = this;
    self.mapIns = mapIns;
  },

  refresh(preventClearHoldingCount=false) {
    const self = this, knapsackArray = self.data;
    let cells = self.content.children;
    cells.forEach((ingredientPageCellNode, index) => {
      /*
      [WARNING]

      Even if "index >= knapsackArray.length", the following snippt should be proceeded with, to init appropriate the default "IngredientCell". 

      -- YFLu, 2019-10-02.
      */
      let ingredientPageCellIns = ingredientPageCellNode.getComponent('IngredientCell');
      self.initIngredientPageCell(ingredientPageCellIns, knapsackArray[index], preventClearHoldingCount);
    });
  },

  initIngredientPageCell(ingredientPageCellIns, knapsackItem, preventClearHoldingCount) {
    const self = this;
    ingredientPageCellIns.dragable = self.cellDragable;
    ingredientPageCellIns.init(self.mapIns);
    ingredientPageCellIns.setData(knapsackItem || null);
    if (!preventClearHoldingCount) {
      ingredientPageCellIns.setHoldingCount(0, false);
    }
    if (ingredientPageCellIns.useWidgets) {
      let widget = ingredientPageCellIns.node.getComponent(cc.Widget);
      widget.enabled = true;
      widget.updateAlignment();
      if (ingredientPageCellIns.ratio != -1) {
        ingredientPageCellIns.node.width = ingredientPageCellIns.node.height * ingredientPageCellIns.ratio;
      }
      ingredientPageCellIns.node.getComponentsInChildren(function(widget) {
        widget.updateAlignment();
      });
      ingredientPageCellIns.useWidgets = !ingredientPageCellIns.useWidgetsOneTime;
    }
    ingredientPageCellIns.refresh();
  },

  resize() {
    const self = this;
    let targetLength = self.isLayoutGrid ? self.length : self.data.length;
    if (self.content.children.length == targetLength) {
      return;
    }
    for (let i  = self.content.children.length; i < targetLength; i++) {
      let ingredientPageCellNode = cc.instantiate(self.ingredientPageCellPrefab);
      self.content.addChild(ingredientPageCellNode);
    }
    for (let i = self.content.children.length; i > targetLength; i--) {
      self.content.children[i-1].removeFromParent();
    }
    let layout = self.content.getComponent(cc.Layout);
    if (null != layout) {
      layout.updateLayout();
    }
  },

  onEnable() {
    const self = this;
    if (!self.mapIns) {
      // ingredientPage is not inited here.
      return;
    }
    let cells = self.content.children;
    cells.forEach((ingredientPageCellNode, index) => {
      let ingredientPageCellIns = ingredientPageCellNode.getComponent('IngredientCell');
      ingredientPageCellIns.setHoldingCount(0);
    });
  },

  setIngredientPageCellPrefab(ingredientPageCellPrefab) {
    const self = this;
    if (ingredientPageCellPrefab == self.ingredientPageCellPrefab) {
      return;
    }
    self.ingredientPageCellPrefab = ingredientPageCellPrefab;
  },

  getIngredientPageCellList() {
    const self = this;
    let cells = self.content.children;
    return cells.map((ingredientPageCellNode, index) => {
      return ingredientPageCellNode.getComponent('IngredientCell');
    }).filter((ingredientPageCellIns) => {
      return ingredientPageCellIns.data != null;
    });
  },
});
