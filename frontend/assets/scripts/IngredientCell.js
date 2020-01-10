const Ingredient = require('./Ingredient');
cc.Class({
  extends: Ingredient,

  properties: {
    boundingNode: cc.Node,
    countLabel: cc.Label,
    dragable: false,
    autoDisableDragable: {
      default: true,
      tooltip: "To set this flag true, cell's dragable would be disabled if showCount is zero.",
    },
    toggleView: {
      default: true,
      tooltip: "To set this flag true, cell will be disabledView if showCount is zero else enabledView.",
    },
    linearMovingEps: 0.3,
    infoButton: cc.Button,
    showBoxOnDataNull: false,
    emptyBoxSprite: {
      type: cc.Sprite,
      default: null,
      visible: function() {
        return this.showBoxOnDataNull;
      },
    },
    useWidgets: false,
    ratio: {
      tooltip: 'Ratio is the value of width / height. If the raitio is -1, the width will not change.',
      type: cc.Float,
      default: 1,
      visible: function() {
        return this.useWidgets;
      },
    },
    useWidgetsOneTime: {
      tooltip: `The useWidgets flag will be actived only one time.`,
      default: false,
      visible: function() {
        return this.useWidgets;
      },
    },
    selectedIndicatorNode: {
      type: cc.Node,
      default: null,
    },
  },
  
  onLoad() {
    const self = this;
    self._dragging = false;
    if (null != self.infoButton) {
      let infoButtonClickEvent = new cc.Component.EventHandler();
      infoButtonClickEvent.target = self.node;
      infoButtonClickEvent.component = 'IngredientCell';
      infoButtonClickEvent.handler = '_infoButtonClicked';
      self.infoButton.clickEvents = [
        infoButtonClickEvent,
      ];
    }
  },

  onEnable() {
    const self = this;
    self._registerEvent();
  },

  onDisable() {
    const self = this;
    self._unregisterEvent();
  },

  onDestroy() {
  },

  _registerEvent() {
    // console.log("IngredientCell._registerEvent");
    const self = this;
    self.node.on(cc.Node.EventType.TOUCH_START, self._dragStart, self);
    self.node.on(cc.Node.EventType.TOUCH_MOVE, self._dragMove, self);
    ([cc.Node.EventType.TOUCH_END, cc.Node.EventType.TOUCH_CANCEL]).forEach((type) => {
      self.node.on(type, self._dragEnd, self);
    });
  },

  _unregisterEvent() {
    // console.log("IngredientCell._unregisterEvent");
    const self = this;
    self.node.off(cc.Node.EventType.TOUCH_START, self._dragStart, self);
    self.node.off(cc.Node.EventType.TOUCH_MOVE, self._dragMove, self);
    ([cc.Node.EventType.TOUCH_END, cc.Node.EventType.TOUCH_CANCEL]).forEach((type) => {
      self.node.off(type, self._dragEnd, self);
    });
  },

  _dragStart(evt) {
    const self = this;
    if (!self.isDragable()) {
      return;
    }
    self._dragging = false;
  },

  _dragMove(evt) {
    const self = this;
    if (!self.isDragable()) {
      return;
    }
    if (!self._dragging && self.isTouchPointInsideBoundingNode(evt.getLocation())) {
      return;
    }

    if (!self._dragging) {
      self.dispatchEvent(constants.EVENT.DRAGGING.START, evt);
    } else {
      self.dispatchEvent(constants.EVENT.DRAGGING.MOVE, evt);
    }
    self._dragging = true;

    if (self._dragging) {
      evt.stopPropagation();
      return false;
    }
  },

  _dragEnd(evt) {
    // console.log("IngredientCell._dragEnd");
    const self = this, touchInside = self.isTouchPointInsideBoundingNode(evt.getLocation());
    if (!self._dragging && touchInside && self.data) {
      const diffVecMag = evt.getStartLocation().sub(evt.getLocation()).mag();
      if (self.linearMovingEps <= diffVecMag) {
        // just do nothing.
        return;
      }
      if (null != self.mapIns) {
        self.mapIns.playEffectCommonButtonClick();
      }
      self.dispatchEvent(constants.EVENT.CELL_CLICK, evt);
    } else if (self._dragging && self.isDragable()) {
      if (!touchInside) {
        self.dispatchEvent(constants.EVENT.DROP, evt);
      } 
      self.dispatchEvent(constants.EVENT.DRAGGING.END, evt);
    }
    self._dragging = false;
  },

  _infoButtonClicked(evt) {
    const self = this;
    if (null == self.data) {
      return;
    }
    if (null != evt) {
      if (null != self.mapIns) {
        self.mapIns.playEffectCommonButtonClick();
      }
    }
    self.dispatchEvent(constants.EVENT.CELL_INFO_BUTTON_CLICKED, evt);
  },

  dispatchEvent(evtName, originalEvt) {
    const self = this;
    let evt = new cc.Event.EventCustom(evtName, true);
    evt.target = self.node;
    evt.detail = {
      ingredientCell: self,
      relatedEvent: originalEvt,
    };
    self.node.dispatchEvent(evt);
  },

  isTouchPointInsideBoundingNode(touchLocation) {
    // TODO: make it correct considered scale and anchorPoint.
    const self = this;
    let boundingNode = self.boundingNode, mainCamera = self.mapIns.mainCamera;
    let currentBoundingCenterPoint = boundingNode.convertToWorldSpaceAR(cc.v2()),
        currentCameraCenterPoint = mainCamera.node.convertToWorldSpaceAR(cc.v2());
    let r = mainCamera.zoomRatio;
    let targetBoundingCenterPoint = cc.v2(
      r * currentBoundingCenterPoint.x - (r - 1) * currentCameraCenterPoint.x,
      r * currentBoundingCenterPoint.y - (r - 1) * currentCameraCenterPoint.y
    );
    targetBoundingCenterPoint = targetBoundingCenterPoint.sub(mainCamera.node.position);
    let bottomLeftPoint = targetBoundingCenterPoint.sub(cc.v2(boundingNode.width/2, boundingNode.height/2));
    const inside = bottomLeftPoint.x <= touchLocation.x && bottomLeftPoint.x + boundingNode.width >= touchLocation.x
        && bottomLeftPoint.y <= touchLocation.y && bottomLeftPoint.y + boundingNode.height >= touchLocation.y;
    return inside;
  },

  setData(knapsackItem, _sessionData) {
    const self = this;
    self._sessionData = self._sessionData || {
      holding: 0,
      ingredient: false, 
    };
    Object.assign(self._sessionData, _sessionData || {});

    if (self._sessionData.ingredient && knapsackItem) {
      knapsackItem = {
        id: -1, 
        currentCount: 1, 
        ingredient: knapsackItem,
      };
    }
    self.data = knapsackItem;
    
    if (knapsackItem) {
      Ingredient.prototype.setData.call(self, knapsackItem.ingredient);
    } else {
      Ingredient.prototype.setData.call(self, null);
    }

  },

  isDragable() {
    if (!this.data || !this.dragable) {
      return false;
    }
    let disabled = this.autoDisableDragable ? !this.isEnabledState() : false;
    return !disabled;
  },

  refresh() {
    const self = this, knapsackItem = self.data;
    Ingredient.prototype.refresh.call(self);

    if (null != self.infoButton) {
      self.infoButton.interactable = knapsackItem; 
    }

    if (!knapsackItem) {
      self.hideSelf();
      return;
    } else {
      self.showSelf();
    }

    if (self.toggleView) {
      if (!self.isEnabledState()) {
        self.toDisabledView();
      } else {
        self.toEnabledView();
      }
    }

    self.countLabel.string = self.getShowCountString();
  },

  isEnabledState() {
    const self = this;
    return self.node.active && self.data && self.getShowCount() > 0;
  },

  hideSelf() {
    const self = this; 
    if (self.showBoxOnDataNull) {
      self.emptyBoxSprite.node.active = true;
    } else {
      self.node.opacity = 0;
    }
  },

  showSelf() {
    const self = this;
    if (self.showBoxOnDataNull) {
      self.emptyBoxSprite.node.active = false;
    } else {
      self.node.opacity = 255;
    }
  },

  cloneDraggingTarget() {
    const self = this;
    let node = cc.instantiate(self.appearance.node);
    let collider = node.getComponent(cc.BoxCollider) || node.addComponent(cc.BoxCollider);
    collider.size.width = node.width;
    collider.size.height = node.height;
    if (collider) {
      collider.enabled = true;
    }
    return node;
  },

  getShowCount() {
    const self = this;
    if (!self.data) {
      return 0;
    }
    return self.data.currentCount - self._sessionData.holding;
  },

  getShowCountString() {
    const self = this;
    return `${self.getShowCount()}`;
  },

  getHoldingCount() {
    const self = this;
    return self._sessionData.holding;
  },

  setHoldingCount(count, autoRefresh=true) {
    const self = this;
    self._sessionData.holding = count;
    autoRefresh && self.refresh();
    return;
  },

  toDisabledView() {
    const self = this;
    self.countLabel.node.active = false;
    const GraySpriteMaterial = cc.Material.getBuiltinMaterial('2d-gray-sprite');
    self.appearance.setMaterial(0, GraySpriteMaterial);
  },

  toEnabledView() {
    const self = this;
    self.countLabel.node.active = true;
    const SpriteMaterial = cc.Material.getBuiltinMaterial('2d-sprite');
    self.appearance.setMaterial(0, SpriteMaterial);
  },

});
