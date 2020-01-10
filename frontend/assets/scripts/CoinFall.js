const CoinType = require('./Coin').CoinType;

cc.Class({
  extends: cc.Component,

  properties: {
    hasTriggeredFlying: false,
    coinPrefab: {
      type: cc.Prefab,
      default: null,
    },
    batchCoinCount: {
      default: 10,
    },
    sprintDurationMillis: {
      // Should be larger than `Coin.durationMillis` of a single coin.
      default: 1500,
    },
    flyAndFadeDurationMillis: {
      // Should be larger than `Coin.durationMillis` of a single coin.
      default: 1000,
    },
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
    coinWillHaltAfterFallen: {
      default: false
    },
    coinType: {
      type: CoinType,
      default: CoinType.GOLD,
    },
    addCoinToMapNode: true,
  },

  ctor() {
    this.coinScriptInsDict = {};
    this.spawnCoinComletedCb = null;
    this.isSpawnCoinComleted = false;
  },

  // LIFE-CYCLE CALLBACKS:
  start() {
    const self = this;
    const marginMillis = 10;
    const lifetimeMillis = marginMillis + self.sprintDurationMillis + self.flyAndFadeDurationMillis;
    const sprintStartedAt = Date.now();
    let spawnedCount = 0;
    const theCb = () => {
      if (self.hasTriggeredFlying) {
        return;
      }
      const elapsedMillis = Date.now() - sprintStartedAt;
      if (elapsedMillis > self.sprintDurationMillis) {
        self.isSpawnCoinComleted = true;
        self.spawnCoinComletedCb && self.spawnCoinComletedCb();
        return;
      }
      ++spawnedCount;
      self.spawnNewCoin();
      const randomMillis = getRandomInt(self.sprintIntervalMinMillis, self.sprintIntervalMaxMillis);
      self._tickTimer = setTimeout(theCb, randomMillis);
    };
    self._tickTimer = setTimeout(theCb, 0);

    if (false == self.coinWillHaltAfterFallen) {
      self._haltTimer = setTimeout(() => {
        if (self.finishCb) {
          self.finishCb();
        }
        if (self.node && self.node.parent) {
          self.node.removeFromParent();
        }
      }, lifetimeMillis);
    }
  },

  isSpawnCompleted() {
    return this.isSpawnCoinComleted;
  },

  spawnNewCoin: function() {
    const self = this;
    const newCoin = cc.instantiate(this.coinPrefab);
    const coinScriptIns = newCoin.getComponent("Coin");
    
    coinScriptIns.mapScriptIns = this.mapScriptIns;
    coinScriptIns.flyAndFadeDurationMillis = this.flyAndFadeDurationMillis;
    coinScriptIns.willHaltAfterFallen = self.coinWillHaltAfterFallen;
    coinScriptIns.coinType = self.coinType;
    coinScriptIns.addToMapNode = self.addCoinToMapNode;

    const toggle = getRandomInt(0, 2);
    const x = (toggle % 2 > 0 ? getRandomArbitrary(self.minSpawnXMagnitude, self.maxSpawnXMagnitude) : getRandomArbitrary(-self.maxSpawnXMagnitude, -self.minSpawnXMagnitude));
    const anotherToggle = getRandomInt(0, 2);
    const y = (anotherToggle % 2 > 0 ? getRandomArbitrary(self.minSpawnYMagnitude, self.maxSpawnYMagnitude) : getRandomArbitrary(-self.maxSpawnYMagnitude, -self.minSpawnYMagnitude))
    newCoin.setPosition(cc.v2(x, y));
    newCoin.finishCb = self.onChildFlyingFinished.bind(self);
    self.coinScriptInsDict[newCoin.uuid] = coinScriptIns; 
    safelyAddChild(self.node, newCoin);
  },

  onLoad() {},
  
  onDestroy() {
    // console.log("CoinFall onDestroy");
    clearTimeout(this._haltTimer);
    clearTimeout(this._tickTimer);
  },

  update: function(dt) {},

  triggerFlying() {
    if (true == self.hasTriggeredFlying) {
      return;
    }
    this.hasTriggeredFlying = true;
    for (let k in this.coinScriptInsDict) {
      const coinScriptIns = this.coinScriptInsDict[k];
      coinScriptIns.letCoinFlyAndFade(); 
    }
  },

  onChildFlyingFinished(theChildNode) {
    if (null != this.coinScriptInsDict[theChildNode.uuid]) {
      delete this.coinScriptInsDict[theChildNode.uuid];
      if (0 < Object.keys(this.coinScriptInsDict).length) {
        // 有Coin还没飞完。
        return;
      }
    } else {
      return;
    }
    if (this.node && this.node.parent) {
      this.node.removeFromParent();
    }
    if (this.finishCb) {
      this.finishCb();
    }
  },
});
