cc.Class({
  extends: cc.Component,
  properties: {
    scoreLabel: cc.Label,
    stars: [cc.Sprite],
    animationStars: [dragonBones.ArmatureDisplay],
    activeStarSpriteFrame: cc.SpriteFrame,
    unactiveStarSpriteFrame: cc.SpriteFrame,
    singleStarAnimationDurationMillis: 500,
    useAnimation: false,
  },

  ctor() {
    this.animationTimers = [];
  },

  init(mapIns) {
    const self = this;
    self.mapIns = mapIns;
  },

  setData(score, starCount) {
    const self = this;
    self.score = score;
    self.starCount = starCount;
  },

  refresh() {
    const self = this;
    const score = self.score, starCount = self.starCount;
    for (let timer of this.animationTimers) {
      clearTimeout(timer);
    }
    this.animationTimers = [];

    if (null != self.scoreLabel) {
      self.scoreLabel.string = score;
    }
    if (!self.useAnimation) {
      for (let i = 0; i < self.stars.length; i++) {
        let currentStar = self.stars[i];
        if (i < starCount) {
          currentStar.spriteFrame = self.activeStarSpriteFrame;
        } else {
          currentStar.spriteFrame = self.unactiveStarSpriteFrame;
        }
      }
    } else {
      for (let i = 0; i < self.animationStars.length; i++) {
        let animationIns = self.animationStars[i];
        let timer = setTimeout(function() {
          let timerIndex = self.animationTimers.indexOf(timer);
          if (timerIndex != -1) {
            self.animationTimers.splice(timerIndex, 1);
          }
          animationIns.node.active = true;
          animationIns._init();
          if (i < starCount) {
            animationIns.playAnimation('LightOn', 1);
          } else {
            animationIns.playAnimation('LightOff', 1);
          }
        }, i * self.singleStarAnimationDurationMillis);
        self.animationTimers.push(timer);
      }
    }

  },

  onDestroy() {
    for (let timer of this.animationTimers) {
      clearTimeout(timer);
    }
    this.animationTimers = [];
  },
})
