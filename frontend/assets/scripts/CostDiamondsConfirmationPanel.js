const CloseableDialog = require('./CloseableDialog');
const i18nExtends = require('./modules/i18n-extends');
const i18nCompiler = new i18nExtends('CostDiamondsToBuyGoldPanel');
cc.Class({
    extends: CloseableDialog,

    properties: {
      confirmButton: {
        type: cc.Button,
        default: null,
      },
      diamondCountLabel: {
        type: cc.Label,
        default: null,
      },
      titleLabel: {
        type: cc.Label,
        default: null,
      },
      tipLabel: {
        type: cc.Label,
        default: null,
      },
    },
    
    init(mapIns, diamondCount, argv=null) {
      const self = this;
      self.mapIns = mapIns;
      self.diamondCount = diamondCount;
      self.argv = argv || [];
      self.refresh();
    },

    render(tipType) {
      const self = this;
      let argv = ['Tip.' + tipType].concat(self.argv);
      self.tipLabel.string = i18nCompiler.render.apply(i18nCompiler, argv);
      self.titleLabel.string = i18nCompiler.render('Title.' + tipType);
      self.diamondCountLabel.string = self.diamondCount;
    },

    refresh() {
      const self = this;
      self.isConfirmed = false;
      if (self.diamondCount > self.mapIns.wallet.diamond) {
        self.diamondCountLabel.node.color = cc.Color.RED;
      } else {
        self.diamondCountLabel.node.color = cc.Color.WHITE;
      }
    },

    onLoad () {
      CloseableDialog.prototype.onLoad.apply(this, arguments);
      const self = this;
      self.confirmButton.node.once('click', function() {
        self.isConfirmed = true;
        if (null != self.mapIns) {
          self.mapIns.playEffectCommonButtonClick();
        }
        if (self.diamondCount > self.mapIns.wallet.diamond) {
          self.onDiamondNotEnoughDelegate && self.onDiamondNotEnoughDelegate(self.diamondCount, self.argv || {});
        } else {
          self.onDiamondEnoughDelegate && self.onDiamondEnoughDelegate(self.diamondCount, self.argv || {});
        }
        self.onConfirmDelegate && self.onConfirmDelegate(self.diamondCount, self.argv || {});
      });
      self.isConfirmed = false;
    },

});
