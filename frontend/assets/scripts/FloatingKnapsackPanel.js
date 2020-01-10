const KnapsackPanel = require('./KnapsackPanel'), PageViewCtrl = require('./PageViewCtrl');
const i18n = require('LanguageData');

const INFINITE_COORDINATE = 9999;

cc.Class({
  extends: KnapsackPanel,

  properties: {
    ingredientPageViewCtrl: PageViewCtrl,
    emptyHint: {
      type: cc.Label,
      default: null,
    },
  },

  onLoad() {
    const self = this;
    KnapsackPanel.prototype.onLoad.apply(this, arguments);
    // Initialization of item dragging. [begins]
    self.node.on(constants.EVENT.DRAGGING.START, function(evt) {
      const {ingredientCell, relatedEvent} = evt.detail;
      self.mapIns.onStartDraggingIngredient(ingredientCell, relatedEvent);
      self.dispatchEvent(relatedEvent, cc.Node.EventType.TOUCH_START);
    });
    self.node.on(constants.EVENT.DRAGGING.MOVE, function(evt) {
      const {ingredientCell, relatedEvent} = evt.detail;
      self.dispatchEvent(relatedEvent, cc.Node.EventType.TOUCH_MOVE);
    });
    self.node.on(constants.EVENT.DROP, function(evt) {
      const {ingredientCell, relatedEvent} = evt.detail;
      self.mapIns.onDropIngredient(evt);
      self.dispatchEvent(relatedEvent, cc.Node.EventType.TOUCH_END);
    });
    // Initialization of item dragging. [ends]
  },

  dispatchEvent(evt, type) {
    const self = this;
    if (null == self.mapIns) {
      return;
    }
    let newEvt = new cc.Event.EventTouch(evt.getTouches(), true);
    newEvt.type = type || evt.type;
    newEvt.target = self.mapIns.node;
    newEvt.currentTouch = evt.getTouches()[0];
    newEvt.touch = evt.getTouches()[0];
    if (null != self.mapIns.translationListenerNode) {
      return self.mapIns.translationListenerNode.dispatchEvent(newEvt);
    } else {
      return self.mapIns.dispatchEvent(newEvt);
    }
  },

  refresh() {
    const self = this;
    KnapsackPanel.prototype.refresh.call(self);
    self.ingredientPageViewCtrl.refreshIndex();
    
    const knapsackArray = self.data;
    if (0 == knapsackArray.length) {
      const emptyKnapsackHint = i18n.t("Knapsack.emptyHint");
      self.emptyHint.string = emptyKnapsackHint; 
    } else {
      self.emptyHint.string = ""; 
    }
  },

});
