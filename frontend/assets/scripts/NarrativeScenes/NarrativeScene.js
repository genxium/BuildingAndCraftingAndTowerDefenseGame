module.exports = cc.Class({
  extends: cc.Component,

  properties: {
    maskLayer: {
      type: cc.Node,
      default: null
    },
    transitButton: {
      type: cc.Button,
      default: null
    },
    narrator: {
      type: cc.Sprite,
      default: null
    },
    narrativeContainer: cc.Node,
    statement: {
      type: cc.Label,
      default: null
    },
    statementBox: {
      type: cc.Node,
      default: null
    },
    finger: {
      type: cc.Node,
      default: null,
    },
    highlightBox: cc.Node,
    showFingerAnimOnTransitButton: true,
    narratorSpriteFrames: [
      cc.SpriteFrame,
    ],
  },

  ctor() {
    this._spriteFrameDictInited = false;
  },

  // LIFE-CYCLE CALLBACKS:
  onLoad() {
    // TODO
    const self = this;
    setLocalZOrder(this.finger, 9999);
    this.transitButton.onEnable = function() {
      cc.Button.prototype.onEnable.apply(this, arguments);
      if (self.showFingerAnimOnTransitButton) {
        self.playFingerClickAnim(
          self.transitButton.node.convertToWorldSpaceAR(cc.v2(0, 0)).sub(self.node.convertToWorldSpaceAR(cc.v2(0, 0)))
        );
      }
    }
    this.highlightBox.active = false;
    this._initSpriteFrameDict();
  }, 

  _initSpriteFrameDict() {
    if (this._spriteFrameDictInited) {
      return;
    }
    this.spriteFrameDict = {};
    for (let spriteFrame of this.narratorSpriteFrames) {
      if (null == spriteFrame) {
        cc.warn('Some spriteFrame is missing for narratorSpriteFrames, please check this.');
        continue;
      }
      this.spriteFrameDict[spriteFrame.name] = spriteFrame;
    }
    this._spriteFrameDictInited = true;
  },

  playFingerClickAnim(position) {
    const self = this;
    console.log('Play Finger at', position);
    let fingerAnim = self.finger.getComponent(cc.Animation);
    clearTimeout(self._repeatTimmer);
    self.finger.active = true;
    self.finger.position = position;
    self.onFingerPressed = null;
    fingerAnim.play('FingerClickInfinite');
    fingerAnim.onFingerAnimPressed = fingerAnim.onFingerAnimRealeased = null;
  },

  playFingerDragAnim(from, to, delay, repeatTime, shouldShowHighLightBox) {
    const self = this, dragDuration = 0.5;
    let fingerAnim = self.finger.getComponent(cc.Animation);
    clearTimeout(self._repeatTimmer);
    self.finger.active = true;
    self.finger.position = from;

    function _tick() {
      if (repeatTime-- <= 0 || !self.finger.active) {
        return;
      }
      self.finger.position = from;
      fingerAnim.play('FingerPress');
    }

    fingerAnim.onFingerAnimPressed = function() {
      self.finger.runAction(cc.sequence(
        [
          cc.moveTo(dragDuration, to),
          cc.callFunc(function() {
            fingerAnim.play('FingerRealease');
          })
        ]
      ));
      if (shouldShowHighLightBox) {
        self.highlightBox.active = true;
        self.highlightBox.position = from;
        self.highlightBox.scale = 1;
        self.highlightBox.runAction(
          cc.spawn([
            cc.scaleTo(dragDuration, 0.8),
            cc.moveTo(dragDuration, to)
          ])
        );
      }
    };

    fingerAnim.onFingerAnimRealeased = function() {
      self._repeatTimmer = setTimeout(_tick, delay);
      self.highlightBox.active = false;
    };

    self._repeatTimmer = setTimeout(_tick, delay);
  },

  hideFinger() {
    const self = this;
    let fingerAnim = self.finger.getComponent(cc.Animation);
    clearTimeout(self._repeatTimmer);
    fingerAnim.stop();
    self.finger.stopAllActions();
    self.highlightBox.stopAllActions();
    self.highlightBox.active = false;
    self.finger.active = false;
  },

  isPlayingFingerAnimation() {
    const self = this;
    return self.finger.active;
  },

  setNarratorSpriteFrame(spriteFrameName) {
    const self = this;
    self._initSpriteFrameDict();
    if (null == self.spriteFrameDict[spriteFrameName]) {
      console.warn('Unknown narrator\'s spriteFrameName:', spriteFrameName);
      return;
    }
    self.narrator.spriteFrame = self.spriteFrameDict[spriteFrameName];
  },

  mirrorNarrativeContainer() {
    const self = this;
    let movement = self.statementBox.x * -1 - self.statementBox.x;
    self.narrator.node.x *= -1;
    self.statementBox.x *= -1;
    self.narrator.node.scaleX *= -1;
    self.statementBox.getChildByName('Background').scaleX *= -1;
    self.transitButton.node.x += movement;
  },

});

