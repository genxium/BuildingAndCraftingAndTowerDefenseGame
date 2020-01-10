const i18n = require('LanguageData');
i18n.init(window.language); // languageID should be equal to the one we input in New Language ID input field

const WECHAT_ON_HIDE_TARGET_ACTION = {
  SHARE_CHAT_MESSAGE: 8,
  CLOSE: 3,
};

/*
* Note that starting from "CocosCreator v2.0.10", the hashcode of
* "project.*.dev.js" "settings.*.js" and "main.*.js" are no longer
* persistent, thus we can no longer put the following initialization
* process within "build-templates/wechatgame/game.js".
*/
const pbStructRoot = require('./modules/buildable_proto_bundle.forcemsg.js');
window.buildableLevelConfStruct = pbStructRoot.mineralchem.BuildableLevelConfStruct;
window.syncDataStruct = pbStructRoot.mineralchem.SyncDataStruct;
window.interruptTutorialMaskStruct = pbStructRoot.mineralchem.InterruptTutorialMask;
window.stageInitialState = pbStructRoot.mineralchem.StageInitialState;

cc.Class({
  extends: cc.Component,

  properties: {
    loadingPrefab: {
      default: null,
      type: cc.Prefab
    },
    tipsLabel: {
      default: null,
      type: cc.Label,
    },
    shadowTipsLabel: {
      default: null,
      type: cc.Label,
    },
    downloadProgress: {
      default: null,
      type: cc.ProgressBar,
    },
    writtenBytes: {
      default: null,
      type: cc.Label,
    },
    expectedToWriteBytes: {
      default: null,
      type: cc.Label,
    },

    handlerProgress: {
      default: null,
      type: cc.ProgressBar,
    },
    handledUrlsCount: {
      default: null,
      type: cc.Label,
    },
    toHandledUrlsCount: {
      default: null,
      type: cc.Label,
    },
    loginTipPrefab: {
      default: null,
      type: cc.Prefab,
    },
    loginButton: cc.Button,
    loadingResourceProgressBar: cc.ProgressBar,
    backgroundNode: cc.Node,
    useIdleGameMap: false,
  },

  
  // LIFE-CYCLE CALLBACKS:
  onLoad() {
    const self = this;
    window.expectedStageId = null;

    if (null == window.enabledDialogs) {
      window.enabledDialogs = [];
    }
    window.shouldTipOfWsDisconnected = true;
    
    // Initialization of node. [begin]
    self.loginButton.node.active = false;
    let scale = Math.max(self.node.width / self.backgroundNode.width, self.node.height / self.backgroundNode.height);
    if (isNaN(scale) || 0 == scale) {
      self.backgroundNode.width = self.node.width;
      self.backgroundNode.height = self.node.height;
    } else {
      self.backgroundNode.width = self.backgroundNode.width * scale;
      self.backgroundNode.height = self.backgroundNode.height * scale;
    }
    // Initialization of node. [end]

    wx.onShow((res) => {
      console.log("+++++ wx onShow(), onShow.res ", res);
      window.expectedStageId = res.query.expectedStageId;
    });
    wx.onHide((res) => {
      // Reference https://developers.weixin.qq.com/minigame/dev/api/wx.exitMiniProgram.html.
      console.log("+++++ wx onHide(), onHide.res: ", res);
      if (
         WECHAT_ON_HIDE_TARGET_ACTION == res.targetAction
         ||
         "back" == res.mode // After "WeChat v7.0.4 on iOS" 
         || 
         "close" == res.mode
      ) {
        // Just redirect to WechatLoginScene, don't clear intAuthToken.
        cc.director.loadScene('WechatGameLogin');
      } else {
        // Deliberately left blank.
      }
    });
    window.wxShareImageUrl = "https://mmocgame.qpic.cn/wechatgame/8gHxtgCPq7rogkaBwxp2NILyVmFjfaFcNJxvAWwhwWp3D8WsnfUqbU3ZrFC7lkAJ/0";
    window.wxShareImageId = "um-HQRBoT2WUjYdIQgouBw";
    const wxToShareMessage = {
      title: i18n.t('GameTitle'),
      imageUrl: window.wxShareImageUrl,  
      imageUrlId: window.wxShareImageId,  
    };
    wx.showShareMenu();
    wx.onShareAppMessage(() => {
      return wxToShareMessage;
    });

    self.getRetCodeList();
    self.getRegexList();

    let networkDisconnectedDialogPrefab = self.loginTipPrefab;
    let parentNode = self.node;

    window.cleanupAndGoBackToLoginSceneAnyway = function() {
      cc.sys.localStorage.removeItem('selfPlayer');
      cc.sys.localStorage.removeItem('targetPlayerId');
      cc.director.loadScene('WechatGameLogin');
    };

    window.handleNetworkDisconnected = (specifiedParentNode, specifiedSimplePressToGoDialog) => {
      if (false == window.shouldTipOfWsDisconnected) { //用于判断是不是主动退出登录, 和防止onClose& on error同时触发导致的双重popup
        return;
      }
      if (null != specifiedParentNode) {
        parentNode = specifiedParentNode; 
      }
      if (null != specifiedSimplePressToGoDialog) {
        networkDisconnectedDialogPrefab = specifiedSimplePressToGoDialog; 
      }
      if (null != parentNode && null != networkDisconnectedDialogPrefab) {
        try {
          const simplePressToGoDialogNode = cc.instantiate(networkDisconnectedDialogPrefab);
          simplePressToGoDialogNode.setPosition(cc.v2(0, 0));
          const simplePressToGoDialogScriptIns = simplePressToGoDialogNode.getComponent("SimplePressToGoDialog");
          simplePressToGoDialogScriptIns.defaultActionsEnabled = false;
          simplePressToGoDialogScriptIns.setHintLabel(i18n.t("network.disconnected"));
          simplePressToGoDialogScriptIns.setYesButtonLabel(i18n.t("bichoiceDialog.yes"));
          simplePressToGoDialogScriptIns.onCloseDelegate = () => {
            window.cleanupAndGoBackToLoginSceneAnyway();  
          };
          safelyAddChild(parentNode, simplePressToGoDialogNode);
          setLocalZOrder(simplePressToGoDialogNode, window.CORE_LAYER_Z_INDEX.INFINITY);
          if (null != self.loginButton && null != self.loginButton.node && cc.isValid(self.loginButton.node)) {
            self.loginButton.node.active = false;
          }
        } catch (e) {
          window.cleanupAndGoBackToLoginSceneAnyway();  
        }
      } else {
        window.cleanupAndGoBackToLoginSceneAnyway();  
      }
      window.shouldTipOfWsDisconnected = false;
      return;
    };

    window.handleTokenExpired = function(specifiedParentNode, specifiedSimplePressToGoDialog) {
      if (false == window.shouldTipOfWsDisconnected) { //用于判断是不是主动退出登录, 和防止onClose& on error同时触发导致的双重popup
        return;
      }
      if (null != specifiedParentNode) {
        parentNode = specifiedParentNode; 
      }
      if (null != specifiedSimplePressToGoDialog) {
        networkDisconnectedDialogPrefab = specifiedSimplePressToGoDialog; 
      }
      if (null != parentNode && null != networkDisconnectedDialogPrefab) {
        try {
          const simplePressToGoDialogNode = cc.instantiate(networkDisconnectedDialogPrefab);
          simplePressToGoDialogNode.setPosition(cc.v2(0, 0));
          const simplePressToGoDialogScriptIns = simplePressToGoDialogNode.getComponent("SimplePressToGoDialog");
          simplePressToGoDialogScriptIns.defaultActionsEnabled = false;
          simplePressToGoDialogScriptIns.setHintLabel(i18n.t("network.tokenExpired"));
          simplePressToGoDialogScriptIns.setYesButtonLabel(i18n.t("bichoiceDialog.yes"));
          simplePressToGoDialogScriptIns.onCloseDelegate = () => {
            window.cleanupAndGoBackToLoginSceneAnyway();  
          };
          safelyAddChild(parentNode, simplePressToGoDialogNode);
          setLocalZOrder(simplePressToGoDialogNode, window.CORE_LAYER_Z_INDEX.INFINITY);
        } catch (e) {
          window.cleanupAndGoBackToLoginSceneAnyway();  
        }
      } else {
        window.cleanupAndGoBackToLoginSceneAnyway();  
      }
      window.shouldTipOfWsDisconnected = false;
      return;
    };

    self.showTips(i18n.t("login.tips.AUTO_LOGIN_1"));
    self.checkIntAuthTokenExpire().then(
      () => {
        self.showTips(i18n.t("login.tips.AUTO_LOGIN_2"));
        const intAuthToken = JSON.parse(cc.sys.localStorage.getItem('selfPlayer')).intAuthToken;
        self.useTokenLogin(intAuthToken);
      },
      () => {
        // 调用wx.login然后请求登录。
        wx.authorize({
          scope: "scope.userInfo",
          success() {
            self.showTips(i18n.t("login.tips.WECHAT_AUTHORIZED_AND_INT_AUTH_TOKEN_LOGGING_IN"));
            wx.login({
              success(res) {
                console.log(i18n.t("login.tips.WECHAT_AUTHORIZED_AND_INT_AUTH_TOKEN_LOGGING_IN"), ", res: ", res);
                const code = res.code;

                wx.getUserInfo({
                  success(res) {
                    const userInfo = res.userInfo;
                    console.log("Get user info ok: ", userInfo);
                    self.useWxCodeMiniGameLogin(code, userInfo);
                  },
                  fail(err) {
                    console.error(i18n.t("login.tips.AUTO_LOGIN_FAILED_WILL_USE_MANUAL_LOGIN"), err);
                    self.showTips(i18n.t("login.tips.AUTO_LOGIN_FAILED_WILL_USE_MANUAL_LOGIN"));
                    self.createAuthorizeThenLoginButton();
                  },
                })
              },
              fail(err) {
                if (err) {
                  console.error(i18n.t("login.tips.AUTO_LOGIN_FAILED_WILL_USE_MANUAL_LOGIN"), err);
                  self.showTips(i18n.t("login.tips.AUTO_LOGIN_FAILED_WILL_USE_MANUAL_LOGIN"));
                  self.createAuthorizeThenLoginButton();
                }
              },
            });
          },
          fail(err) {
            console.error(i18n.t("login.tips.AUTO_LOGIN_FAILED_WILL_USE_MANUAL_LOGIN"), err);
            self.showTips(i18n.t("login.tips.AUTO_LOGIN_FAILED_WILL_USE_MANUAL_LOGIN"));
            self.createAuthorizeThenLoginButton();
          }
        });
      }
    );
  },

  createAuthorizeThenLoginButton(tips) {
    const self = this;
    self.loginButton.node.active = true;
    self.loadingResourceProgressBar.node.active = false;
    let sysInfo = wx.getSystemInfoSync();
    //获取微信界面大小
    let width = sysInfo.screenWidth;
    let height = sysInfo.screenHeight;

    if (null != self.loginButton.node.getComponent(cc.Widget)) {
      self.loginButton.node.getComponent(cc.Widget).updateAlignment();
    }

    let sclae = wx.getSystemInfoSync().windowWidth / self.node.width;

    let button = wx.createUserInfoButton({
      type: 'text',
      text: '',
      style: {
        left: (self.node.width / 2 + self.loginButton.node.x - self.loginButton.node.width * self.loginButton.node.anchorX) * sclae,
        top: (self.node.height / 2 - self.loginButton.node.y - self.loginButton.node.height * self.loginButton.node.anchorY) * sclae,
        width: self.loginButton.node.width * sclae,
        height: self.loginButton.node.height * sclae,
        backgroundColor: '#00000000', //最后两位为透明度
        color: '#ffffff',
        fontSize: 20,
        textAlign: "center",
        lineHeight: height,
      },
    });
    button.onTap((res) => {
      console.log(res);
      if (null != res.userInfo) {
        const userInfo = res.userInfo;
        self.showTips(i18n.t("login.tips.WECHAT_AUTHORIZED_AND_INT_AUTH_TOKEN_LOGGING_IN"));

        wx.login({
          success(res) {
            console.log('wx.login success, res:', res);
            const code = res.code;
            self.useWxCodeMiniGameLogin(code, userInfo);
            button.destroy();
            self.loginButton.node.active = false;
          },
          fail(err) {
            console.err(i18n.t("login.tips.AUTO_LOGIN_FAILED_WILL_USE_MANUAL_LOGIN"), err);
            self.showTips(i18n.t("login.tips.AUTO_LOGIN_FAILED_WILL_USE_MANUAL_LOGIN"));
          },
        });
      } else {
        self.showTips(i18n.t("login.tips.PLEASE_AUTHORIZE_WECHAT_LOGIN_FIRST"));
      }
    })

  },

  onDestroy() {
    console.log("+++++++ WechatGameLogin onDestroy()");
  },

  showTips(text) {
    if (this.tipsLabel != null) {
      this.tipsLabel.string = text;
      if (this.shadowTipsLabel != null) {
        this.shadowTipsLabel.string = text;
      }
    } else {
      console.log('Login scene showTips failed')
    }
  },

  getRetCodeList() {
    const self = this;
    self.retCodeDict = constants.RET_CODE;
  },

  getRegexList() {
    const self = this;
    self.regexList = {
      EMAIL: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      PHONE: /^\+?[0-9]{8,14}$/,
      STREET_META: /^.{5,100}$/,
      LNG_LAT_TEXT: /^[0-9]+(\.[0-9]{4,6})$/,
      SEO_KEYWORD: /^.{2,50}$/,
      PASSWORD: /^.{6,50}$/,
      SMS_CAPTCHA_CODE: /^[0-9]{4}$/,
      ADMIN_HANDLE: /^.{4,50}$/,
    };
  },

  checkIntAuthTokenExpire() {
    return new Promise((resolve, reject) => {
      if (!cc.sys.localStorage.getItem("selfPlayer")) {
        reject();
        return;
      }
      const selfPlayer = JSON.parse(cc.sys.localStorage.getItem('selfPlayer'));
      (selfPlayer.intAuthToken && new Date().getTime() < selfPlayer.expiresAt) ? resolve() : reject();
    })
  },

  useTokenLogin(_intAuthToken) {
    var self = this;
    NetworkUtils.ajax({
      url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + (null == backendAddress.PORT || "" == backendAddress.PORT ? "" : ":" + backendAddress.PORT) + constants.ROUTE_PATH.API + constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.PLAYER +  constants.ROUTE_PATH.INT_AUTH_TOKEN + constants.ROUTE_PATH.LOGIN,
      type: "POST",
      data: {
        intAuthToken: _intAuthToken
      },
      success: function(resp) {
        self.onLoggedIn(resp);
      },
      error: function(xhr, status, errMsg) {
        self.showTips('');
        self.createAuthorizeThenLoginButton();
      },
      timeout: function() {
        self.enableInteractiveControls(true);
      },
    });
  },

  enableInteractiveControls(enabled) {},

  onWechatLoggedIn(res) {
    const self = this;
    if (res.ret === self.retCodeDict.OK) {
      //根据服务器返回信息设置selfPlayer
      self.enableInteractiveControls(false);
      const date = Number(res.expiresAt);
      const selfPlayer = {
        expiresAt: date,
        playerId: res.playerId,
        intAuthToken: res.intAuthToken,
        displayName: res.displayName,
        avatar: res.avatar,
      }
      cc.sys.localStorage.setItem('selfPlayer', JSON.stringify(selfPlayer));

      self.useTokenLogin(res.intAuthToken);
    } else {
      cc.sys.localStorage.removeItem("selfPlayer");
      cc.sys.localStorage.removeItem('targetPlayerId');
      self.showTips(i18n.t("login.tips.WECHAT_LOGIN_FAILED_TAP_SCREEN_TO_RETRY") + ", errorCode = " + res.ret);
      self.createAuthorizeThenLoginButton();
    }
  },

  onLoggedIn(res) {
    const self = this;
    console.log("OnLoggedIn: ", res);
    if (res.ret === self.retCodeDict.OK) {
      self.enableInteractiveControls(false);
      const date = Number(res.expiresAt);
      const selfPlayer = {
        expiresAt: date,
        playerId: res.playerId,
        intAuthToken: res.intAuthToken,
        avatar: res.avatar,
        displayName: res.displayName,
        name: res.name,
      }
      cc.sys.localStorage.setItem("selfPlayer", JSON.stringify(selfPlayer));
      console.log("cc.sys.localStorage.selfPlayer = ", cc.sys.localStorage.getItem("selfPlayer"));
      if (self.countdownTimer) {
        clearInterval(self.countdownTimer);
      }

      let theNextScene = "StageSelection", theMapScene = "StageMap";
      if (self.useIdleGameMap) {
        theNextScene = theMapScene = "IdleGameMap";
      }
      self.loadingResourceProgressBar.node.active = true;
      self.loadingResourceProgressBar.node.opacity = 255;
      self.loadingResourceProgressBar.progress = 0;
      const holdingProgress = 0;
      /*
       * theMapScene has already a progressBar in theNextScene, thus it don't need to be preloaded.
       *    --guoyl6, 2019-11-18, 10:38
       */

      cc.director.preloadScene(theNextScene, (completedCount, totalCount, item) => {
        self.loadingResourceProgressBar.progress = (completedCount / totalCount) * (1 - holdingProgress);
      }, (err, asset) => {
        cc.director.loadScene(theNextScene);
      });
    } else {
      console.warn('onLoggedIn failed!')
      cc.sys.localStorage.removeItem("selfPlayer");
      cc.sys.localStorage.removeItem('targetPlayerId');
      self.enableInteractiveControls(true);
      switch (res.ret) {
        case self.retCodeDict.DUPLICATED:
          this.phoneNumberTips.getComponent(cc.Label).string = i18n.t("login.tips.LOGOUT");
          break;
        case this.retCodeDict.TOKEN_EXPIRED:
          this.captchaTips.getComponent(cc.Label).string = i18n.t("login.tips.LOGIN_TOKEN_EXPIRED");
          break;
        case this.retCodeDict.SMS_CAPTCHA_NOT_MATCH:
          self.captchaTips.getComponent(cc.Label).string = i18n.t("login.tips.SMS_CAPTCHA_NOT_MATCH");
          break;
        case this.retCodeDict.INCORRECT_CAPTCHA:
          self.captchaTips.getComponent(cc.Label).string = i18n.t("login.tips.SMS_CAPTCHA_NOT_MATCH");
          break;
        case this.retCodeDict.SMS_CAPTCHA_CODE_NOT_EXISTING:
          self.captchaTips.getComponent(cc.Label).string = i18n.t("login.tips.SMS_CAPTCHA_NOT_MATCH");
          break;
        case this.retCodeDict.INCORRECT_PHONE_NUMBER:
          self.captchaTips.getComponent(cc.Label).string = i18n.t("login.tips.INCORRECT_PHONE_NUMBER");
          break;
        case this.retCodeDict.INVALID_REQUEST_PARAM:
          self.captchaTips.getComponent(cc.Label).string = i18n.t("login.tips.INCORRECT_PHONE_NUMBER");
          break;
        case this.retCodeDict.INCORRECT_PHONE_COUNTRY_CODE:
          this.captchaTips.getComponent(cc.Label).string = i18n.t("login.tips.PHONE_COUNTRY_CODE_ERR");
          break;
        default:
          break;
      }

      self.showTips(i18n.t("login.tips.AUTO_LOGIN_FAILED_WILL_USE_MANUAL_LOGIN"));
      self.createAuthorizeThenLoginButton();
    }
  },

  useWxCodeMiniGameLogin(_code, _userInfo) {
    const self = this;
    NetworkUtils.ajax({
      url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + (null == backendAddress.PORT || "" == backendAddress.PORT ? "" : ":" + backendAddress.PORT) + constants.ROUTE_PATH.API + constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.WECHATGAME + constants.ROUTE_PATH.LOGIN,
      type: "POST",
      data: {
        code: _code,
        avatarUrl: _userInfo.avatarUrl,
        nickName: _userInfo.nickName,
      },
      success: function(res) {
        self.onWechatLoggedIn(res);
      },
      error: function(xhr, status, errMsg) {
        cc.sys.localStorage.removeItem("selfPlayer");
        cc.sys.localStorage.removeItem('targetPlayerId');
        self.showTips(i18n.t("login.tips.WECHAT_LOGIN_FAILED_TAP_SCREEN_TO_RETRY") + ", errorMsg =" + errMsg);
        self.createAuthorizeThenLoginButton();
      },
      timeout: function() {
        cc.sys.localStorage.removeItem("selfPlayer");
        cc.sys.localStorage.removeItem('targetPlayerId');
        self.showTips(i18n.t("login.tips.WECHAT_LOGIN_FAILED_TAP_SCREEN_TO_RETRY") + ", errorMsg =" + errMsg);
        self.createAuthorizeThenLoginButton();
      },
    });
  },

  update(dt) {
    const self = this;
    let progress1 = null, progress2 = null;
    if (null != wxDownloader && 0 < wxDownloader.totalBytesExpectedToWriteForAllTasks) {
      self.writtenBytes.string = wxDownloader.totalBytesWrittenForAllTasks;
      self.expectedToWriteBytes.string = wxDownloader.totalBytesExpectedToWriteForAllTasks;
      self.downloadProgress.progress = 1.0*wxDownloader.totalBytesWrittenForAllTasks/wxDownloader.totalBytesExpectedToWriteForAllTasks;
      progress1 = self.downloadProgress.progress;
    }
    const totalUrlsToHandle = (wxDownloader.immediateHandleItemCount + wxDownloader.immediateReadFromLocalCount + wxDownloader.immediatePackDownloaderCount);
    const totalUrlsHandled = (wxDownloader.immediateHandleItemCompleteCount + wxDownloader.immediateReadFromLocalCompleteCount + wxDownloader.immediatePackDownloaderCompleteCount);
    if (null != wxDownloader && 0 < totalUrlsToHandle) {
      self.handledUrlsCount.string = totalUrlsHandled;
      self.toHandledUrlsCount.string = totalUrlsToHandle;
      self.handlerProgress.progress = 1.0*totalUrlsHandled/totalUrlsToHandle;
      progress2 = self.handlerProgress.progress;
    }
    /*
    if (null == progress1 && null == progress2) {
      self.loadingResourceProgressBar.node.opacity = 0;
    } else {
      self.loadingResourceProgressBar.node.opacity = 255;
      if (null != progress1 && null != progress2) {
        self.loadingResourceProgressBar.progress = progress2;
      } else if (null != progress1) {
        self.loadingResourceProgressBar.progress = progress1;
      } else if (null != progress2) {
        self.loadingResourceProgressBar.progress = progress2;
      }
    }
    */
  }
});
