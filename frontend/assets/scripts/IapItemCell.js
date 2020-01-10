module.export = cc.Class({
  extends: cc.Component,

  properties: {
    titleLabel: {
      type: cc.Label,
      default: null,
    },
    priceLabel: {
      default: null,
      type: cc.Label,
    },
    purchaseButton: {
      type: cc.Button,
      default: null,
    },
    diamondLabel: {
      type: cc.Label,
      default: null,
    },
    diamondSpriteNode: {
      type: cc.Sprite,
      default: null
    },
    mediumSprite: {
      type: cc.SpriteFrame,
      default: null
    },
    largeSprite: {
      type: cc.SpriteFrame,
      default: null
    },
    littleSprite: {
      type: cc.SpriteFrame,
      default: null
    },
    hugeSprite: {
      type: cc.SpriteFrame,
      default: null
    },
    tremendousSprite: {
      type: cc.SpriteFrame,
      default: null
    },
    musicEffect: {
      type: cc.AudioClip,
      default: null,
    },
  },
  
  ctor() {
    this.theIapItemPanelNode = null;
    this.mapNode = null;
    this.canvasNode = null;
  },

  setIapItemCell(itemInfo) {
    this.itemInfo = itemInfo;
    this.priceLabel.string = itemInfo.localizedPrice; 
    this.titleLabel.string = (null == itemInfo.title ? itemInfo.productIdentifier : itemInfo.title);
    this.diamondLabel.string = constants.DIAMOND_PRODUCT_INFO[itemInfo.productIdentifier].DIAMOND_NUM;
    this.updateDiamondSprite(itemInfo.productIdentifier);
  },

  updateDiamondSprite(productIdentifier) {
    switch (productIdentifier) {
      case "MediumDiamondPackage":
        this.diamondSpriteNode.spriteFrame = this.mediumSprite;
        break;
      case "LargeDiamondPackage":
        this.diamondSpriteNode.spriteFrame = this.largeSprite;
        break;
      case "LittleDiamondPackage":
        this.diamondSpriteNode.spriteFrame = this.littleSprite;
        break;
      case "HugeDiamondPackage":
        this.diamondSpriteNode.spriteFrame = this.hugeSprite;
        break;
      case "TremendousDiamondPackage":
        this.diamondSpriteNode.spriteFrame = this.tremendousSprite;
        break;
      default:
        break;
    }
  },
  onLoad() {},

  purchaseButtonClick(evt) {
    const self = this;
    const mapScriptIns = self.mapScriptIns;
    cc.log("buying and productIdentifier == " + self.itemInfo.productIdentifier);
    if (mapScriptIns.isInIapWaiting()) {
      cc.warn("has in the iapWaiting state");
      return;
    }
    if (this.musicEffect) {
      cc.audioEngine.playEffect(this.musicEffect, false, 1);
    }
    if (cc.sys.isNative) {
      if (CuisineMaster && CuisineMaster.Iap) {
        CuisineMaster.Iap.iap_sku_purchase(self.itemInfo.productIdentifier);
        //进入购买流程，界面不可点击
        mapScriptIns.addInIapWaiting();
        mapScriptIns.fullscreenIapPurchasingShadowNode.active = true;
      }
    } else {
      this.theIapItemPanelNode.active = false;
      const mapScriptIns = this.mapScriptIns;
      const simplePressToGoDialogNode = cc.instantiate(mapScriptIns.simplePressToGoDialogPrefab);
      simplePressToGoDialogNode.setPosition(cc.v2(0, 0));
      const simplePressToGoDialogScriptIns = simplePressToGoDialogNode.getComponent("SimplePressToGoDialog");
      simplePressToGoDialogScriptIns.onCloseDelegate = () => {
        this.theIapItemPanelNode.active = true;
      }
      simplePressToGoDialogScriptIns.setHintLabel("web环境，无法购买。");
      simplePressToGoDialogScriptIns.setYesButtonLabel("yes");
      safelyAddChild(mapScriptIns.widgetsAboveAllNode, simplePressToGoDialogNode);
    }
  },
});
