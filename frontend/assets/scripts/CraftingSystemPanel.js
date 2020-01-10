const KnapsackPanel = require('./KnapsackPanel'), PageViewCtrl = require('./PageViewCtrl');
cc.Class({
  extends: KnapsackPanel,

  properties: {
    pageCellCount: {
      override: true,
      default: 8,
    },
    ingredientPageViewCtrl: {
      type: PageViewCtrl,
      default: null,
    },
    costGoldValueLable: {
      type: cc.Label,
      default: null,
    },
    craftingIngredientListCollider: {
      type: cc.Collider,
      default: null,
    },
    craftingIngredientListNode: {
      type: cc.Node,
      default: null,
    },
    ingredientCellPrefab: cc.Prefab,
    craftingButton: cc.Button,
    mainContainerNode: cc.Node,
    clearAllButton: cc.Button,
    tipNodeOnEmpty: cc.Node,
  },

  onIngredientEnterCollider() {
    const self = this;
    self.dropped = true;
  },

  onIngredientStayCollider() {
    const self = this;
    self.dropped = true;
  },

  onIngredientExitCollider() {
    const self = this;
    self.dropped = false;
  },

  onLoad() {
    const self = this;
    self.draggingCell = null;
    self.followingItemNode = null;
    self.dropped = false;
    KnapsackPanel.prototype.onLoad.call(this);
    // Initialization of collider. [begins]
    let craftingIngredientListCollider = self.craftingIngredientListCollider;

    craftingIngredientListCollider.onCollisionEnter = () => {
      self.onIngredientEnterCollider.apply(self, arguments);
    };
    craftingIngredientListCollider.onCollisionStay = () => {
      self.onIngredientStayCollider.apply(self, arguments);
    };
    craftingIngredientListCollider.onCollisionExit = () => {
      self.onIngredientExitCollider.apply(self, arguments);
    };

    // Initialization of collider. [ends]

    // Initialization of item dragging. [begins]
    self.node.on(constants.EVENT.DRAGGING.START, function(evt) {
      const {ingredientCell, relatedEvent} = evt.detail;
      const canvasNode = self.mapIns.canvasNode;
      const touchPosInWidetsAboveAll = relatedEvent.getLocation().sub(cc.v2(canvasNode.width * canvasNode.anchorX, canvasNode.height * canvasNode.anchorY));
      self.draggingCell = ingredientCell;
      self.followingItemNode = ingredientCell.cloneDraggingTarget();
      self.followingItemNode.position = touchPosInWidetsAboveAll;
      safelyAddChild(self.node, self.followingItemNode);
    });
    self.node.on(constants.EVENT.DRAGGING.MOVE, function(evt) {
      const {ingredientCell, relatedEvent} = evt.detail;
      const canvasNode = self.mapIns.canvasNode;
      const touchPosInWidetsAboveAll = relatedEvent.getLocation().sub(cc.v2(canvasNode.width * canvasNode.anchorX, canvasNode.height * canvasNode.anchorY));
      self.followingItemNode.position = touchPosInWidetsAboveAll;
    });
    self.node.on(constants.EVENT.DRAGGING.END, function(evt) {
      self.node.removeChild(self.followingItemNode);
      self.followingItemNode = null;
      self.draggingCell = null;
    });
    self.node.on(constants.EVENT.DROP, function(evt) {
      if (!self.dropped) {
        return;
      }
      let ingredient = self.draggingCell.data.ingredient;
      self.onReceiveIngredient(self.draggingCell);
    });


    // Initialization of item dragging. [ends]
    
    // Initialization of `craftingButton` [begins]
    self.craftingButton.node.on('click', function() {
      if (!self.isCraftingEnabled()) {
        return;
      }
      let knapsacks = self.craftingIngredientListNode.children.map((node) => {
        let cpn = node.getComponent('CraftingIngredientCell');
        return {
          knapsack: cpn.data,
          count: cpn.getShowCount(),
        }
      });

      self.mapIns.costGoldsToDo(constants.PRICE.SYNTHESIZE, function() {
        self.updateGUI();
        self.mapIns.onCraftingSynthesize(knapsacks, self);
      });

    });
    // Initialization of `craftingButton` [ends]

    // Initialization of `clearAllButton` [begins]
    self.clearAllButton.node.on('click', function() {
      self.refresh();
    });
    // Initialization of `clearAllButton` [ends]

    // Initialization of `` [begin]
    self.craftingIngredientListNode.on(cc.Node.EventType.CHILD_ADDED, function() {
      self.tipNodeOnEmpty.active = false;
    });
    self.craftingIngredientListNode.on(cc.Node.EventType.CHILD_REMOVED, function() {
      self.tipNodeOnEmpty.active = !self.craftingIngredientListNode.children.length;
    });
    // Initialization of `` [end]
  },

  init(mapIns, statefulBuildableInstance) {
    const self = this;
    self.mapIns = mapIns;
    self.statefulBuildableInstance = statefulBuildableInstance;
  },

  refresh() {
    const self = this;
    KnapsackPanel.prototype.refresh.call(self);
    self.craftingIngredientListNode.removeAllChildren();
    self.ingredientPageViewCtrl.refreshIndex();
    self.updateGUI();
  },

  refreshKnapsackOnly() {
    const self = this;
    KnapsackPanel.prototype.refresh.call(self);
    let ingredientPageCellList = self.getAllIngredientPageCell();
    for (let craftingIngredientCellNode of self.craftingIngredientListNode.children) {
      let craftingIngredientCellIns = craftingIngredientCellNode.getComponent('CraftingIngredientCell');
      let count = craftingIngredientCellIns.getHoldingCount();
      let relatedIngredientCell = null;
      for (let ingredientCellIns of ingredientPageCellList) {
        if (ingredientCellIns.ingredient.id == craftingIngredientCellIns.ingredient.id) {
          relatedIngredientCell = ingredientCellIns;
          break;
        }
      }
      if (null != relatedIngredientCell) {
        relatedIngredientCell.setHoldingCount(count);
        craftingIngredientCellIns.relatedIngredientCell = relatedIngredientCell;
      }
    }
    self.ingredientPageViewCtrl.refreshIndex();
    self.updateGUI();
  },

  updateGUI() {
    const self = this;
    let isCraftingEnabled = self.isCraftingEnabled();
    self.craftingButton.interactable = isCraftingEnabled;
    self.clearAllButton.interactable = !!self.craftingIngredientListNode.children.length;
    self.costGoldValueLable.string = constants.PRICE.SYNTHESIZE;
    self.costGoldValueLable.node.color = self.mapIns.wallet.gold >= constants.PRICE.SYNTHESIZE ? cc.Color.WHITE : cc.Color.RED;
    self.craftingButton.node.getComponentsInChildren(cc.Sprite).forEach(function(sprite) {
      sprite.setMaterial(0, cc.Material.getBuiltinMaterial(isCraftingEnabled ? '2d-sprite' : '2d-gray-sprite'));
    })
  },
  
  findCurrentCraftingIngredientCellNode(ingredient) {
    const self = this, listNode = self.craftingIngredientListNode;
    return listNode.children.find((ingredientCellNode) => {
      return ingredientCellNode.getComponent('CraftingIngredientCell').data.ingredient.id == ingredient.id;
    });
  },

  onReceiveIngredient(relatedIngredientCell) {
    const self = this;
    self.increaseIngredientCellCount(relatedIngredientCell);
  },

  increaseIngredientCellCount(relatedIngredientCell) {
    const self = this;
    const ingredient = relatedIngredientCell.data.ingredient;
    let ingredientCellNode = self.findCurrentCraftingIngredientCellNode(ingredient);
    let ingredientCellIns;
    if (ingredientCellNode == null) {
      // Initialization of `CraftingIngredientCell`. [begins]
      ingredientCellNode = cc.instantiate(self.ingredientCellPrefab);
      ingredientCellIns = ingredientCellNode.getComponent('CraftingIngredientCell');

      ingredientCellIns.init(self.mapIns, relatedIngredientCell);
      ingredientCellIns.setData(relatedIngredientCell.data);
      ingredientCellIns.setHoldingCount(0, false);
      ingredientCellIns.refresh();

      ingredientCellIns.onDecrease = (prevCount, currentCount) => {
        ingredientCellIns.relatedIngredientCell.setHoldingCount(currentCount);
        self.updateGUI();
      };
      ingredientCellIns.onIncrease = (prevCount, currentCount) => {
        ingredientCellIns.relatedIngredientCell.setHoldingCount(currentCount);
        self.updateGUI();
      };
      ingredientCellIns.onRemoved = (prevCount, currentCount) => {
        ingredientCellIns.relatedIngredientCell.setHoldingCount(currentCount);
        self.craftingIngredientListNode.removeChild(ingredientCellNode);
        self.updateGUI();
      };

      safelyAddChild(self.craftingIngredientListNode, ingredientCellNode);
      // Initialization of `CraftingIngredientCell`. [ends]
    } else {
      ingredientCellIns = ingredientCellNode.getComponent('CraftingIngredientCell');
    }

    ingredientCellIns.increase();
  },

  renderCraftingIngredientListNode(consumables, shouldHoldCount=false) {
    const self = this;
    self.craftingIngredientListNode.removeAllChildren();
    let ingredientCellList = self.getAllIngredientPageCell();
    consumables.forEach(function(consumable) {
      let ingredientCellIns = ingredientCellList.find(function(ingredientCellIns) {
        return ingredientCellIns.ingredient.id == consumable.ingredientId;
      });
      self.onReceiveIngredient(ingredientCellIns);
      let targetCraftingIngredientCellNode = self.findCurrentCraftingIngredientCellNode(ingredientCellIns.ingredient);
      let targetCraftingIngredientCellIns = targetCraftingIngredientCellNode.getComponent('CraftingIngredientCell');
      targetCraftingIngredientCellIns.setHoldingCount(consumable.count, false);
      if (shouldHoldCount) {
        ingredientCellIns.setHoldingCount(targetCraftingIngredientCellIns.getHoldingCount());
      } else {
        ingredientCellIns.setHoldingCount(0);
      }
      targetCraftingIngredientCellIns.refresh();
      if (!shouldHoldCount) {
        targetCraftingIngredientCellIns.increaseButton.interactable = ingredientCellIns.data.currentCount >= 1;
      }
    });
    self.updateGUI();
  },

  resizeNode() {
    const self = this;
    let updateAlignmentRecursive = function(node) {
      let widget = node.getComponent(cc.Widget);
      if (widget) {
        widget.updateAlignment();
      }
      for (let childNode of node.children) {
        updateAlignmentRecursive(childNode);
      }
    };
    self.node.width = self.mapIns.widgetsAboveAllNode.width;
    self.node.height = self.mapIns.widgetsAboveAllNode.height;
    self.node.position = cc.v2(0, 0);
    updateAlignmentRecursive(self.node);
    const width = self.mainContainerNode.width, height = self.mainContainerNode.height;
    const restHeight = height - self.mainContainerNode.children[1].height;
    self.craftingIngredientListCollider.node.width = width;
    self.craftingIngredientListCollider.node.height = restHeight;
    self.craftingIngredientListCollider.size.width = width;
    self.craftingIngredientListCollider.size.height = restHeight;
    self.craftingIngredientListCollider.offset.y = -restHeight / 2;
    updateAlignmentRecursive(self.craftingIngredientListCollider.node);
  },

  isCraftingEnabled() {
    const self = this;
    if (!self.mapIns || !self.craftingIngredientListNode.children.length) {
      return false;
    }
    let craftingIngredientCellIns = self.craftingIngredientListNode.children[0].getComponent('CraftingIngredientCell');
    if (craftingIngredientCellIns.getShowCount() <= 1 && self.craftingIngredientListNode.children.length <= 1) {
      return false;
    }
    return true;
  },

});
