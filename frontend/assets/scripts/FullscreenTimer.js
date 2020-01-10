cc.Class({
  extends: cc.Component,
  properties: {
    elapsedTimerNode: cc.Node,
    elapsedTimerLabel: cc.Label,
    usingScale: false,
    minScale: {
      default: 1,
      visible: function() {
        return this.usingScale;
      },
    },
    maxScale: {
      default: 10,
      visible: function() {
        return this.usingScale;
      },
    },
    usingFontSize: true,
    minFontSize: {
      default: 36,
      visible: function() {
        return this.usingFontSize;
      },
    },
    maxFontSize: {
      default: 360,
      visible: function() {
        return this.usingFontSize;
      },
    },

    actionDurationMillis: {
      default: 500,
      tooltip: "It should less than 1s.",
    },
  },
  ctor() {
    this.elapsedTime = 3;
  },
  setData(elapsedTime) {
    const self = this;
    self.elapsedTime = elapsedTime;
  },
  playAnimation(cb) {
    const self = this;
    
    let counter = 0;
    if (self.usingScale) {
      self.elapsedTimerNode.stopAllActions();
      let action = cc.sequence(
        cc.callFunc(function() {
          self.elapsedTimerNode.opacity = 0;
          self.elapsedTimerNode.scale = self.maxScale;
          self.elapsedTimerLabel.string = self.elapsedTime - counter;
          counter++;
        }),
        cc.spawn(
          cc.scaleTo(self.actionDurationMillis / 1000, self.minScale),
          cc.fadeTo(self.actionDurationMillis / 1000, 255)
        ),
        cc.delayTime(1 - self.actionDurationMillis / 1000)
      );
      self.elapsedTimerNode.runAction(
        cc.sequence(
          cc.repeat(
            action,
            self.elapsedTime
          ),
          cc.callFunc(function() {
            cb && cb();
          })
        )
      );
    } else {
      if (self.tween) {
        self.tween.stop();
      }
      self.tween = cc.tween(self.node).repeat(
        self.elapsedTime,
        cc.tween().call(function() {
          self.node.height = self.maxFontSize;
          self.elapsedTimerLabel.fontSize = self.maxFontSize;
          self.elapsedTimerLabel.lineHeight = self.maxFontSize;
          self.elapsedTimerLabel.string = self.elapsedTime - counter;
          self.elapsedTimerNode.opacity = 0;
          counter++;
        }).to(self.actionDurationMillis / 1000, {
          height: {
            value: self.minFontSize,
            progress: (start, end, current, ratio) => {
              self.elapsedTimerLabel.fontSize = current;
              self.elapsedTimerLabel.lineHeight = current;
              self.elapsedTimerNode.opacity = 255 * ratio;
              return start + (end - start) * ratio;
            },
          },
        }).delay(1 - self.actionDurationMillis / 1000)
      ).call(function() {
        cb && cb();
      });
      self.tween.start();
    }
  },
})
