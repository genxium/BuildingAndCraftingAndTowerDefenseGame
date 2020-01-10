const i18n = require('LanguageData');
cc.Class({
  extends: cc.Component,
  properties: {
    ingredientCellPrefab: cc.Prefab,
    titleLabel: cc.Label,
    ingredientListNode: cc.Node,
  },
  init(mapIns) {
    const self = this;
    self.mapIns = mapIns;
  },
  setData(title, ingredientList) {
    const self = this;
    self.ingredientList = ingredientList || [];
    self.titleLabel.string = title;
    self.ingredientListNode.removeAllChildren();
    for (let i = 0, len = self.ingredientList.length; i < len; i++) {
      const ingredient = self.ingredientList[i];
      let ingredientCellNode = cc.instantiate(self.ingredientCellPrefab);
      let ingredientCellIns = ingredientCellNode.getComponent('IngredientCell');
      ingredientCellIns.init(self.mapIns);
      ingredientCellIns.setData(ingredient);
      safelyAddChild(self.ingredientListNode, ingredientCellNode);
    }
  },
  refresh() {
    const self = this;
    for (let i = 0, len = self.ingredientListNode.children.length; i < len; i++) {
      let ingredientCellNode = self.ingredientListNode.children[i];
      let ingredientCellIns = ingredientCellNode.getComponent('IngredientCell');
      ingredientCellIns.refresh();
    }
  },
  getIngredientCellList() {
    const self = this, ingredientCellList = [];
    for (let i = 0, len = self.ingredientListNode.children.length; i < len; i++) {
      let ingredientCellNode = self.ingredientListNode.children[i];
      ingredientCellList.push(ingredientCellNode.getComponent('IngredientCell'));
    }
    return ingredientCellList;
  },
})
