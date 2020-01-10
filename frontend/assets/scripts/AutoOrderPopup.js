const StateBasedFactory = require('./modules/StateBasedFactory');
const IngredientProgressCell = require('./IngredientProgressCell');

const AutoOrderState = cc.Enum({
  NOT_TAKEN_NOT_READY: 0,
  NOT_TAKEN_READY: 1,
  TAKEN_RECLAIMING: 2,
  RECLAIMED: 3,
});

const ClassOption = StateBasedFactory(AutoOrderState, AutoOrderState.NOT_TAKEN_NOT_READY);
Object.assign(ClassOption.properties, {
  ingredientProgressCell: IngredientProgressCell,
  ingredientAppearance: cc.Sprite,
  coinFallPrefab: cc.Prefab,
  flyAndFadeDurationMillis: {
    // Should be larger than `Coin.durationMillis` of a single coin.
    default: 1000,
  },
  hintReclaimPendingNode: cc.Node,
});

Object.assign(ClassOption, {
  extends: cc.Component,
  onLoad() {
    const self = this;
    let button = self.getComponent(cc.Button);
    let selfClickedHandler = new cc.Component.EventHandler();
    selfClickedHandler.target = self.node;
    selfClickedHandler.component = 'AutoOrderPopup';
    selfClickedHandler.handler = 'onSelfClicked';
    button.clickEvents = [
      selfClickedHandler,
    ];
    self._isHidden = false;
  },

  init(mapIns) {
    const self = this;
    self.mapIns = mapIns;
    self.ingredientProgressCell.init(mapIns);
  },

  setData(autoOrder, ingredientProgress) {
    const self = this;
    self.autoOrder = autoOrder;
    self.ingredientProgress = ingredientProgress;
    self.ingredientProgressCell.setData(ingredientProgress);
    self.ingredientProgressCell.onProduceDone = function() {
      self.autoOrder.state = constants.AUTO_ORDER_STATE.RECLAIMED;
      self.refresh();
      self.onReclaimed && self.onReclaimed();
    }

    if (self.ingredientProgressCell.isCompleted()) {
      self.autoOrder.state = constants.AUTO_ORDER_STATE.RECLAIMED;
    }
  },

  refresh() {
    const self = this;
    
    switch (self.autoOrder.state) {
    case constants.AUTO_ORDER_STATE.NOT_TAKEN_NOT_READY:
      self.state = AutoOrderState.NOT_TAKEN_NOT_READY;
      break;
    case constants.AUTO_ORDER_STATE.NOT_TAKEN_READY:
      self.state = AutoOrderState.NOT_TAKEN_READY;
      break;
    case constants.AUTO_ORDER_STATE.TAKEN_RECLAIMING:
      self.state = AutoOrderState.TAKEN_RECLAIMING;
      break;
    case constants.AUTO_ORDER_STATE.RECLAIMED:
      self.state = AutoOrderState.RECLAIMED;
      break;
    default:
      self.state = AutoOrderState.NOT_TAKEN_NOT_READY;
      break;
    }
    self.ingredientProgressCell.refresh();
    self.ingredientAppearance.spriteFrame = self.mapIns.getIngredientAppearance(self.autoOrder.targetIngredientId);
    if (self.ingredientProgressCell.isPendingInQueue()) {
      self.hintReclaimPendingNode.active = true;
    } else {
      self.hintReclaimPendingNode.active = false;
    }
  },

  onSelfClicked(evt) {
    const self = this;
    self.onClicked && self.onClicked(self.autoOrder);
  },
  playIngredientNotEnoughAnimation() {
    const self = this;
    self.ingredientAppearance.node.stopAllActions();
    let action = cc.repeat(
      cc.sequence(
        cc.moveTo(0.05, cc.v2(-5, 0)),
        cc.moveTo(0.05, cc.v2(0, 0)),
        cc.moveTo(0.05, cc.v2(5, 0)),
        cc.moveTo(0.05, cc.v2(0, 0))
      ), 3
    );
    self.ingredientAppearance.node.runAction(action);
  },
  playCoinFallAnim(cb) {
    const self = this;
    const parentNode = this.node.parent;
    if (!parentNode) return;
    if (!self.coinFallPrefab) return;
    const coinFallNode = cc.instantiate(self.coinFallPrefab);

    //dirty hack
    const coinFallScriptIns = coinFallNode.getComponent("CoinFall");
    coinFallScriptIns.mapScriptIns = self.mapIns;
    coinFallScriptIns.finishCb = cb;
    coinFallScriptIns.flyAndFadeDurationMillis = self.flyAndFadeDurationMillis;
    coinFallNode.setPosition(cc.v2(self.autoOrder.targetStatefulBuildableFollowingNpc.node.x, self.node.y));
    safelyAddChild(parentNode, coinFallNode);
    setLocalZOrder(coinFallNode, 999);
  },
  show() {
    const self = this;
    if (null != self.autoOrder && null != self.autoOrder.targetStatefulBuildableFollowingNpc) {
      self.node.x = self.autoOrder.targetStatefulBuildableFollowingNpc.node.x;
      self._isHidden = false;
    }
  },
  hide() {
    const self = this;
    self.node.x = self.mapIns.node.width;
    self._isHidden = true;
  },
  isHidden() {
    const self = this;
    return !self.node.active || self._isHidden;
  },
});
cc.Class(ClassOption);

exports.STATE = AutoOrderState;
