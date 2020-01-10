const StateBasedFactory = require('./modules/StateBasedFactory');
const ProgressNum = require('./ProgressNum');

const FreeAutoOrderState = cc.Enum({
  NOT_TAKEN: 0,
  TAKEN_TRADING: 1,
  DELIVERED: 3,
});

const ClassOption = StateBasedFactory(FreeAutoOrderState, FreeAutoOrderState.NOT_TAKEN);
Object.assign(ClassOption.properties, {
  progressIns: ProgressNum,
  ingredientAppearance: cc.Sprite,
  shakingAnimationNode: cc.Node,
  fadeAnimationNode: cc.Node,
  flyingAnimationNode: cc.Node,
  clonedAppearanceList: [cc.Sprite],
});

Object.assign(ClassOption, {
  extends: cc.Component,
  onLoad() {
    const self = this;
    let button = self.getComponent(cc.Button);
    let selfClickedHandler = new cc.Component.EventHandler();
    selfClickedHandler.target = self.node;
    selfClickedHandler.component = 'FreeAutoOrderPopup';
    selfClickedHandler.handler = 'onSelfClicked';
    button.clickEvents = [
      selfClickedHandler,
    ];
    self._isHidden = false;
    self.ACTION_TAG = {
      TIME: 1,
      FADE: 2,
      FLYING: 3,
    };
  },

  init(mapIns) {
    const self = this;
    self.mapIns = mapIns;
  },

  setData(freeAutoOrder, ingredientProgress) {
    const self = this;
    self.freeAutoOrder = freeAutoOrder;
    self.ingredientAppearance.spriteFrame = freeAutoOrder.targetIngredient.appearance;
    for (let sprite of self.clonedAppearanceList) {
      if (null == sprite) {
        continue;
      }
      sprite.spriteFrame = freeAutoOrder.targetIngredient.appearance;
    }
  },

  refresh() {
    const self = this;
    switch (self.freeAutoOrder.state) {
    case constants.FREE_AUTO_ORDER_STATE.NOT_TAKEN:
      self.state = FreeAutoOrderState.NOT_TAKEN;
      break;
    case constants.FREE_AUTO_ORDER_STATE.TAKEN_TRADING:
      self.progressIns.setData(null, self.freeAutoOrder.durationMillis, self.freeAutoOrder.startedAt);
      self.state = FreeAutoOrderState.TAKEN_TRADING;
      break;
    case constants.FREE_AUTO_ORDER_STATE.DELIVERED:
      self.state = FreeAutoOrderState.DELIVERED;
      break;
    }
  },

  disableClick() {
    const self = this;
    self.getComponent(cc.Button).enabled = false;
  },

  onSelfClicked(evt) {
    const self = this;
    if (!self.getComponent(cc.Button).enabled) {
      // prevent multiple clicked.
      return;
    }
    self.disableClick();
    self.onClicked && self.onClicked(self.freeAutoOrder, evt);
  },
  show() {
    const self = this;
    if (null != self.freeAutoOrder && null != self.freeAutoOrder.targetStatefulBuildableOrderingNpc) {
      self.node.x = self.freeAutoOrder.targetStatefulBuildableOrderingNpc.node.x;
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

  playTimeRemainingLittleAnimation() {
    const self = this;
    if (null != self.node.getActionByTag(self.ACTION_TAG.TIME)) {
      return;
    }
    self.initialPosition = cc.v2(self.node.position);
    let action = cc.repeatForever(
      cc.sequence(
        cc.repeat(
          cc.sequence(
            cc.moveBy(0.05, cc.v2(-5, 0)), cc.moveBy(0.05, cc.v2(5, 0)), cc.moveBy(0.05, cc.v2(5, 0)), cc.moveBy(0.05, cc.v2(-5, 0)),
            cc.delayTime(0.02)
          ),
          3
        ), 
        cc.delayTime(0.3)
      )
    );
    action.setTag(self.ACTION_TAG.TIME);
    self.shakingAnimationNode.active = true;
    return self.node.runAction(action);
  },

  stopTimeRemainingLittleAnimation() {
    const self = this;
    self.node.position = self.initialPosition || self.node.position;
    self.node.stopActionByTag(self.ACTION_TAG.TIME);
    self.shakingAnimationNode.active = false;
  },

  playIngredientFlyingAnimation(fromPosition, toPosition, durationMillis, cb) {
    const self = this;
    self.flyingAnimationNode.stopActionByTag(self.ACTION_TAG.FLYING);
    self.flyingAnimationNode.active = true;
    self.flyingAnimationNode.position = fromPosition;
    self.flyingAnimationNode.scale = 1;
    let action = cc.sequence(
      cc.spawn(
        cc.scaleTo(durationMillis / 1000, 0.3),
        cc.moveTo(durationMillis / 1000, toPosition)
      ),
      cc.callFunc(function() {
        cb && cb();
      })
    );
    action.setTag(self.ACTION_TAG.FLYING);
    return self.flyingAnimationNode.runAction(action);
  },
  
  stopIngredientFlyingAnimation(cb) {
    const self = this;
    self.flyingAnimationNode.stopActionByTag(self.ACTION_TAG.FLYING);
    self.flyingAnimationNode.active = false;
  },

  playEatingAnimation(durationMillis, cb) {
    const self = this;
    self.fadeAnimationNode.stopActionByTag(self.ACTION_TAG.FADE);
    self.fadeAnimationNode.active = true;
    self.fadeAnimationNode.opacity = 255;
    let action = cc.sequence(
      cc.fadeTo(durationMillis / 1000, 0),
      cc.callFunc(function() {
        cb && cb();
      })
    );
    action.setTag(self.ACTION_TAG.FADE);
    return self.fadeAnimationNode.runAction(action);
  },

  stopEatingAnimation() {
    const self = this;
    self.fadeAnimationNode.stopActionByTag(self.ACTION_TAG.FADE);
    self.fadeAnimationNode.active = false;
  },
  
});
cc.Class(ClassOption);

exports.STATE = FreeAutoOrderState;
