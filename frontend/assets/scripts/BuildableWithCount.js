cc.Class({
  extends: cc.Component,
  properties: {
    activeAppearanceSprite: {
      type: cc.Sprite,
      default: null,
    },
    labelForCount: {
      type: cc.Label,
      default: null,
    },
    levelLabel: {
      type: cc.Label,
      default: null,
    },
    padding: 0.1,
    limitSpriteHeight: true,
    limitSpriteWidth: true,
    appearanceOnly: false,
  },

  onLoad() {
    if (this.appearanceOnly) {
      this.labelForCount.node.active = false;
      this.levelLabel.node.parent.active = false;
    }
  },

  render(appearance, count = 0, level = 0) {
    const self = this;
    self.activeAppearanceSprite.spriteFrame = appearance;
    self.labelForCount.string = `x ${count}`;
    self.levelLabel.string = `lv${level}`;
    self.limitActiveAppearanceSprite();
  },

  limitActiveAppearanceSprite() {
    const self = this;
    const maxSpriteWidth = self.node.width * (1 - self.padding * 2),
          maxSpriteHeight = self.node.height * (1 - self.padding * 2);
    if (!self.limitSpriteHeight && !self.limitSpriteWidth) {
      return;
    }
    const {width, height} = self.activeAppearanceSprite.spriteFrame.getRect();
    let ratio = 1, h_ratio = 1, v_ratio = 1;
    if (self.limitSpriteWidth) {
     ratio = h_ratio = maxSpriteWidth / width;
    }
    if (self.limitSpriteHeight) {
      ratio =  v_ratio = maxSpriteHeight / height;
    }
    if (self.limitSpriteHeight && self.limitSpriteWidth) {
      ratio = Math.min(h_ratio, v_ratio);
    }
    self.activeAppearanceSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    self.activeAppearanceSprite.node.width = width * ratio;
    self.activeAppearanceSprite.node.height = height * ratio;
  },

})
