const AjaxQueryResultPanel = require('./AjaxQueryResultPanel');
cc.Class({
  extends: AjaxQueryResultPanel,
  properties: {
    showsInfoButtonOnCell: {
      default: true,
    },
    ingredientPagePrefab: {
      type: cc.Prefab,
      default: null,
    },
    specifiedIngredientPageCellPrefab: {
      type: cc.Prefab,
      default: null,
    },
    ingredientPageView: {
      type: cc.PageView,
      default: null,
    },
    pageCellCount: 16,
    cellDragable: false,
    interactable: {
      default: true,
      notify() {
        // console.log('interactable changed', this.interactable);
      },
    },
    pageViewScrollEnabled: true,
    defaultClickHandler: {
      default: true,
    },
    useDefaultCellInfoHandler: {
      tooltip: 'To set this flag, mapIns.onIngredientPageCellClicked will be called when ingredientCell.infoButton is clicked',
      default: true,
    },
    isPageCategoried: false,
    categoryContainer: {
      type: cc.ToggleContainer,
      default: null,
      visible: function() {
        return this.isPageCategoried;
      },
    },
    toIgnoreInteractable: {
      tooltip: 'The nodes will be touchable eventhough the interactable is false.',
      type: [cc.Node],
      default: [],
    },
  },

  onLoad() {
    const self = this;
    AjaxQueryResultPanel.prototype.onLoad.apply(this, arguments);
  },

  _toCategoryData() {
    // deliberately left blank;
  },

  _refreshCategoryContainer() {
    // deliberately left blank；
  },

  getCurrentActiveCategory() {
    const self = this;
    if (!self.isPageCategoried) {
      return null;
    }
    let target = self.categoryContainer.toggleItems.find((toggle) => {
      return toggle.isChecked;
    });
    if (target != null) {
      return self.categoryContainer.toggleItems.indexOf(target);
    }
    return null;
  },

  onCategoryCahnged() {
    // deliberately left blank;
  },

  onEnable() {
    const self = this;
    AjaxQueryResultPanel.prototype.onEnable.apply(this, arguments);
    self._registerEvent();
  },

  onDisable() {
    const self = this;
    AjaxQueryResultPanel.prototype.onDisable.apply(this, arguments);
    self._unregisterEvent();
  },

  _registerEvent() {
    const self = this;
    // forbid the pageViewScroll and the interactable of node by stop touch propagation. [begins]
    ([
      cc.Node.EventType.TOUCH_START,
      cc.Node.EventType.TOUCH_MOVE,
      cc.Node.EventType.TOUCH_END,
      cc.Node.EventType.TOUCH_CANCEL
    ]).forEach((eventType, index) => {
      self.node.on(eventType, self._touchDelegate, self, true);
    });
    // forbid the pageViewScroll and the interactable of node by stop touch propagation. [ends]
    
    self.node.on(constants.EVENT.CELL_CLICK, self._defaultClickHandler, self, true);
    self.node.on(constants.EVENT.CELL_INFO_BUTTON_CLICKED, self._defaultCellInfoHandler, self, true);

  },

  _unregisterEvent() {
    const self = this;
    ([
      cc.Node.EventType.TOUCH_START,
      cc.Node.EventType.TOUCH_MOVE,
      cc.Node.EventType.TOUCH_END,
      cc.Node.EventType.TOUCH_CANCEL
    ]).forEach((eventType, index) => {
      self.node.off(eventType, self._touchDelegate, self, true);
    });

    self.node.off(constants.EVENT.CELL_CLICK, self._defaultClickHandler, self, true);
    self.node.off(constants.EVENT.CELL_INFO_BUTTON_CLICKED, self._defaultCellInfoHandler, self, true);
  },

  _defaultClickHandler(evt) {
    const self = this;
    const {ingredientCell, relatedEvent} = evt.detail;
    if (!self.defaultClickHandler) {
      return;
    }
  },

  _defaultCellInfoHandler(evt) {
    const self = this;
    const {ingredientCell, relatedEvent} = evt.detail;
    if (!self.useDefaultCellInfoHandler) {
      return;
    }
    if (null != self.mapIns.onIngredientPageCellClicked) {
      self.mapIns.onIngredientPageCellClicked(self, ingredientCell);
    }
  },

  _touchDelegate(evt) {
    const self = this;
    if (!self.interactable && null == self.toIgnoreInteractable.find(function(node) {
      return node == evt.target || evt.target.isChildOf(node);
    })) {
      evt.stopPropagation();
      return;
    }
    if (!self.pageViewScrollEnabled) {
      if (
           evt.target.isChildOf(self.ingredientPageView.node)
        || evt.target == self.ingredientPageView.node
      ) {
        evt.stopPropagation();
        let goThroughEvt = new cc.Event.EventTouch(evt.getTouches(), false);
        goThroughEvt.type = evt.type;
        goThroughEvt.touch = evt.touch;
        goThroughEvt.simulate = true;
        goThroughEvt.target = evt.target;
        if (evt.target != self.ingredientPageView.node) {
          evt.target.emit(goThroughEvt.type, goThroughEvt);
        }
      }
    }
  },

  init(mapIns) {
    const self = this;
    self.mapIns = mapIns;
    if (self.isPageCategoried) {
      self._refreshCategoryContainer();
      const checkEventHandler = new cc.Component.EventHandler();
      checkEventHandler.target = self;
      checkEventHandler.component = 'KnapsackPanel';
      checkEventHandler.handler = 'onCategoryCahnged';
      self.categoryContainer.checkEvents = [
        checkEventHandler,
      ];
    }

  },

  setData(knapsackArray) {
    const self = this;
    knapsackArray = knapsackArray.slice();
    knapsackArray.sort(function(knapsackItem1, knapsackItem2) {
      return knapsackItem1.ingredient.id - knapsackItem2.ingredient.id;
    });
    AjaxQueryResultPanel.prototype.setData.call(self, null, [knapsackArray]);
    self._data = knapsackArray;
    self.data = knapsackArray;
    if (self.isPageCategoried) {
      self._toCategoryData();
    }
  },

  refresh(preventClearHoldingCount=false) {
    const self = this, knapsackArray = self.data;
    let ingredientPageView = self.ingredientPageView;
    let pageCellCount = self.pageCellCount, pageIndex = 0, pages = ingredientPageView.getPages();
    
    // to remove excess pages. [begin]
    let targetPageCount = Math.ceil(knapsackArray.length / pageCellCount);
    for (let i = pages.length; i > targetPageCount; i--) {
      ingredientPageView.removePageAtIndex(i - 1);
    }
    pages = ingredientPageView.getPages();
    // to remove excess pages. [end]

    for (let i = 0; i < knapsackArray.length; i += pageCellCount, pageIndex++) {
      let pageArray = knapsackArray.slice(i, i + pageCellCount);
      let pageExisted = pageIndex < pages.length;
      let ingredientPageNode = pageExisted ? pages[pageIndex] : cc.instantiate(self.ingredientPagePrefab);
      let ingredientPageIns = ingredientPageNode.getComponent('IngredientPage');
      if (null != self.specifiedIngredientPageCellPrefab) {
        ingredientPageIns.setIngredientPageCellPrefab(self.specifiedIngredientPageCellPrefab);
      }
      if (!pageExisted) {
        ingredientPageView.addPage(ingredientPageNode);
        self.initIngredientPage(ingredientPageIns, pageArray);
      } else {
        ingredientPageIns.setData(pageArray);
        ingredientPageIns.resize();
        ingredientPageIns.refresh(preventClearHoldingCount);
      }
    }
    
  },

  initIngredientPage(ingredientPageIns, pageArray) {
    const self = this; 
    ingredientPageIns.length = self.pageCellCount;
    ingredientPageIns.cellDragable = self.cellDragable;
    if (ingredientPageIns.useWidgets) {
      ingredientPageIns.getComponentsInChildren(cc.Widget).forEach(function(widget) {
        if (widget.node.isChildOf(ingredientPageIns.content) && widget.node != ingredientPageIns.content) {
          // this is a cell, thus return.
          return;
        }
        widget.target = self.ingredientPageView.node;
        widget.updateAlignment();
      });
    }
    ingredientPageIns.init(self.mapIns);
    ingredientPageIns.setData(pageArray);
    ingredientPageIns.resize();
    ingredientPageIns.refresh();
  },

  beforeWaiting() {
    const self = this;
    AjaxQueryResultPanel.prototype.beforeWaiting.apply(self, arguments);
    self.interactable = false;
  },

  beforeResponeded() {
    const self = this;
    AjaxQueryResultPanel.prototype.beforeResponeded.apply(self, arguments);
    self.interactable = true;
  },

  getIngredientPageCellInsInCurrentPage() {
    const self = this;
    let pageNode = self.ingredientPageView.getPages()[self.ingredientPageView.getCurrentPageIndex()];
    if (null == pageNode) {
      return [];
    }
    let ingredientPageIns = pageNode.getComponent('IngredientPage');
    return ingredientPageIns.getIngredientPageCellList();
  },

  getAllIngredientPageCell() {
    const self = this, arr = [];
    self.ingredientPageView.getPages().forEach(function(pageNode) {
      arr.push.apply(arr, pageNode.getComponent('IngredientPage').getIngredientPageCellList());
    });
    return arr;
  },
});
