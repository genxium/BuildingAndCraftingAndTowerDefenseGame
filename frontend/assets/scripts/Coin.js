const CoinType = cc.Enum({
  GOLD: 1,
  DIAMOND: 2,
});

cc.Class({
  extends: cc.Component,

  properties: {
    minInitialVxMagnitude: {
      default: 5.0,
    },
    maxInitialVxMagnitude: {
      default: 50.0,
    },
    minInitialVyMagnitude: {
      default: 100.0,
    },
    maxInitialVyMagnitude: {
      default: 150.0,
    },
    gY: {
      default: -400.0,
    },
    durationMillis: {
      default: 1000,
    },
    goldSpriteFrame: {
      type: cc.SpriteFrame,
      default: null
    },
    useAnimationNode: true,
    animationNode: cc.Node,
    coinType: {
      type: CoinType,
      default: CoinType.GOLD,
    },
    diamondSpriteFrame: cc.SpriteFrame,
    goldAnimationNode: cc.Node,
    diamondAnimationNode: cc.Node,
    addToMapNode: true,
  },

  ctor() {
    this.willHaltAfterFallen = false;
  },

  // LIFE-CYCLE CALLBACKS:
  onLoad() {
    const self = this;
    const initialVy = getRandomArbitrary(self.minInitialVyMagnitude, self.maxInitialVyMagnitude);
    const toggle = getRandomInt(0, 2);

    const initialVx = (toggle % 2 > 0 ? getRandomArbitrary(self.minInitialVxMagnitude, self.maxInitialVxMagnitude) : getRandomArbitrary(-self.maxInitialVxMagnitude, -self.minInitialVxMagnitude));

    self.node.getComponent(cc.Sprite).spriteFrame = self.goldSpriteFrame;
    this.v = cc.v2(initialVx, initialVy);
    this.g = cc.v2(0, self.gY);
    this.startedAt = null;
    this.halfDurationMillis = (0.5 * this.durationMillis);
    this.opacityDegradeSpeed = (255 * 1000 / this.halfDurationMillis);
    switch (self.coinType) {
    case CoinType.GOLD:
      self.animationNode = self.goldAnimationNode;
      self.node.spriteFrame = self.goldSpriteFrame;
    break;
    case CoinType.DIAMOND:
      self.animationNode = self.diamondAnimationNode;
      self.node.spriteFrame = self.diamondSpriteFrame;
    break;
    }
    // 使用龙骨动画.
    if (!self.useAnimationNode) {
      self.animationNode.active = false;
      self.node.runAction(cc.repeatForever(cc.sequence([
        cc.scaleTo(0.7, 0.1, +1),
        cc.scaleTo(0.2, 0.5, +1),
        cc.scaleTo(0.5, +1.0, +1),
      ])));
    } else {
      self.node.getComponent(cc.Sprite).spriteFrame = null;
      self.animationNode.active = true;
    }
  },

  onDestroy() {
    // console.log("Coin onDestroy");
  },

  start() {
    this.startedAtMillis = Date.now();
    this.hasFlied = false;
  },

  update: function(dt) {
    const elapsedMillis = Date.now() - this.startedAtMillis;
    if (elapsedMillis > this.durationMillis) {
      if (false == this.willHaltAfterFallen) {
        this.letCoinFlyAndFade(); 
      }
      return;
    }
    let posDiff = this.v.mul(dt);
    this.node.setPosition(this.node.position.add(posDiff));
    // this.node.setScale(1, 0.5*elapsedMillis/this.durationMillis);

    this.v = this.v.add(this.g.mul(dt));
    if (elapsedMillis <= this.halfDurationMillis) return;
  },
   
  letCoinFlyAndFade() {
    if (this.hasFlied) {
      return;
    }
    this.hasFlied = true;
    this.node.stopAllActions();
    const mapNode = this.mapScriptIns.node;
    const widgetsAboveAllNode = this.mapScriptIns.widgetsAboveAllNode;
    const widgetsAboveAllScriptIns = this.mapScriptIns.widgetsAboveAllScriptIns;
    let theEndPointNode = widgetsAboveAllScriptIns.goldLabel.node;
    switch (this.coinType) {
    case CoinType.GOLD:
      theEndPointNode = widgetsAboveAllScriptIns.walletInfo.goldLabel.node;
    break;
    case CoinType.DIAMOND:
      theEndPointNode = widgetsAboveAllScriptIns.walletInfo.diamondLabel.node;
    break;
    }
    const theNode = this.node;
    //将node转移到mapNode下
    if (this.addToMapNode) {
      const nodePosInWorld = theNode.convertToWorldSpaceAR(cc.v2(0, 0));
      const nodePosInMapNode = mapNode.convertToNodeSpaceAR(nodePosInWorld);
      theNode.parent = mapNode;
      theNode.setPosition(nodePosInMapNode);
    }
    window.flyAndFade(theNode, theEndPointNode, widgetsAboveAllNode, this.flyAndFadeDurationMillis / 1000, false, true, () => {
      if (theNode.finishCb) {
        theNode.finishCb(theNode);
      }
      if (theNode.parent) {
        theNode.removeFromParent();
      }
    });
    if (this.addToMapNode) {
      setLocalZOrder(theNode, CORE_LAYER_Z_INDEX.COIN_ANIMATION_UNDER_MAP);
    } else {
      setLocalZOrder(theNode, CORE_LAYER_Z_INDEX.COIN_ANIMATION_UNDER_DIALOG);
    }
  },
});

module.exports.CoinType = CoinType;
