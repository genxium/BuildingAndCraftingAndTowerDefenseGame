cc.Class({
  extends: cc.Component,
  properties: {
    coinFallPrefab: cc.Prefab,
    flyAndFadeDurationMillis: {
      // Should be larger than `Coin.durationMillis` of a single coin.
      default: 1000,
    },
    collectButton: cc.Button,
    sprintIntervalMinMillis: {
      default: 100,
    },
    sprintIntervalMaxMillis: {
      default: 200,
    },
    minSpawnXMagnitude: {
      default: 0,
    },
    maxSpawnXMagnitude: {
      default: 10,
    },
    minSpawnYMagnitude: {
      default: 0,
    },
    maxSpawnYMagnitude: {
      default: 10,
    },
    animationNode: cc.Node,
    couldBeAutoCollect: true,
    coinAnimationNode: cc.Node,
    piggyBankAnimationNode: cc.Node,
  },

  usePiggyBankAnimationNode() {
    if (this.animationNode != this.piggyBankAnimationNode) {
      this.animationNode.active = false;
      this.piggyBankAnimationNode.active = true;
    }
    this.animationNode = this.piggyBankAnimationNode;
  },

  useCoinAnimationNode() {
    if (this.animationNode != this.coinAnimationNode) {
      this.animationNode.active = false;
      this.coinAnimationNode.active = true;
    }
    this.animationNode = this.coinAnimationNode;
  },

  ctor() {
    this.hasTriggeredCollection = false;
    this.hasTriggeredFlying = false;
    this.onCoinFallCompleted = null;
    this.onCoinFallFlyCompleted = null;
  },

  onLoad() {
    const self = this;
    // self.playFallingAnim();
  },

  onEnable() {
    const self = this;
    if (null != self.mapIns && null != self.mapIns.cachedGoldNodeList) {
      self.mapIns.cachedGoldNodeList.push(self.node);
    }
  },

  onDisable() {
    const self = this;
    if (null != self.mapIns && null != self.mapIns.cachedGoldNodeList) {
      let index = self.mapIns.cachedGoldNodeList.indexOf(self.node);
      if (index != -1) {
        self.mapIns.cachedGoldNodeList.splice(index, 1);
      }
    }
  },

  onDestroy() {
		const self = this;
    console.log("CachedGold onDestroy");
		if (null != self.coinFallScriptIns) {
  		self.coinFallScriptIns = null;
		}
  },

  init(mapIns, cachedGoldId) {
    const self = this;
    self.mapIns = mapIns;
    self.id = cachedGoldId;
  },

  setData(goldCount) {
    const self = this;
    self.goldCount = goldCount;
  },

  refresh() {
  
  },

  onSelfClicked(evt) {
    const self = this;
    if (true == self.hasTriggeredCollection) {
      return;  
    }
    self.collectButton.enabled = false;
    self.hasTriggeredCollection = true;
    self.onCollect && self.onCollect(evt, () => {
      if (self.node && self.node.parent) {
        self.node.removeFromParent();
      }
    });
  },
  
  playFallingAnim(cb) {
    /*
    [WARNING]

    It's possible that the player clicks to collection during the playing of this anim. 
    
    -- YFLu, 2019-09-26
    */
    const self = this;
    const coinFallNode = cc.instantiate(self.coinFallPrefab);
    coinFallNode.width = self.node.width;
    coinFallNode.height = self.node.height;
    const coinFallScriptIns = coinFallNode.getComponent("CoinFall");
    self.coinFallScriptIns = coinFallScriptIns; 
    coinFallScriptIns.mapScriptIns = self.mapIns;
    coinFallScriptIns.coinWillHaltAfterFallen = true;
    coinFallScriptIns.flyAndFadeDurationMillis = self.flyAndFadeDurationMillis;
    coinFallScriptIns.spawnCoinComletedCb = function() {
      if (null != self.node.parent) {
        self.onCoinFallCompleted && self.onCoinFallCompleted();
      }
    };
    /*
    Please control [sprintIntervalMinMillis, sprintIntervalMaxMillis] according to the number of total coins.
    
    -- YFLu, 2019-09-26
    */
    coinFallScriptIns.sprintIntervalMinMillis = self.sprintIntervalMinMillis;
    coinFallScriptIns.sprintIntervalMaxMillis = self.sprintIntervalMaxMillis;

    coinFallScriptIns.minSpawnXMagnitude = self.minSpawnXMagnitude;
    coinFallScriptIns.minSpawnYMagnitude = self.minSpawnYMagnitude;
    coinFallScriptIns.maxSpawnXMagnitude = self.maxSpawnXMagnitude;
    coinFallScriptIns.maxSpawnYMagnitude = self.maxSpawnYMagnitude;
 

    coinFallNode.setPosition(self.node.position);
    safelyAddChild(self.node.parent, coinFallNode);
    setLocalZOrder(coinFallNode, window.CORE_LAYER_Z_INDEX.CACHED_GOLD);
  },

  playCoinFallFlyingAnim(cb) {
    const self = this;
    if (null != self.coinFallScriptIns) {
      /*
      [WARNING]
      Note that "self.coinFallScriptIns.node.parent == self.node.parent", thus the invocation of "self.node.removeFromParent()" is not affecting "self.coinFallScriptIns.triggerFlying". As long as we don't forget to set "self.coinFallScriptIns = null" upon "self.onDestroy" there won't be a memory leak.
      
      -- YFLu, 2019-10-28.
      */
      self.coinFallScriptIns.triggerFlying();
    }
  },

  playAnimationNodeFlyingAnimation(durationMillis, cb) {
    const self = this;
    if (self.hasTriggeredFlying || null == self.animationNode || null == self.mapIns) {
      return;
    }
    self.hasTriggeredFlying = true;
    if (null == self.animationNode) {
      return;
    }
    safelyAssignParent(self.animationNode, self.mapIns.node);
    self.animationNode.position = self.node.position;
    self.animationNode.stopAllActions();
    const widgetsAboveAllScriptIns = self.mapIns.widgetsAboveAllScriptIns;
    const widgetsAboveAllNode = self.mapIns.widgetsAboveAllNode;
    const theNode = self.animationNode;
    const theEndPointNode = widgetsAboveAllScriptIns.goldLabel.node;
    window.flyAndFade(theNode, theEndPointNode, widgetsAboveAllNode, durationMillis / 1000, false, true, () => {
      if (null != theNode && theNode.parent) {
        theNode.destroy();
      }
      self.onCoinFallFlyCompleted && self.onCoinFallFlyCompleted();
      cb && cb();
    });
    setLocalZOrder(theNode, CORE_LAYER_Z_INDEX.COIN_ANIMATION_UNDER_MAP);
  },
});
