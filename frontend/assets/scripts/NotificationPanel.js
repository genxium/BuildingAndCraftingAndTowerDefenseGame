const CloseableDialog = require("./CloseableDialog");
const i18n = require("LanguageData");

module.export = cc.Class({
  extends: CloseableDialog,

  properties: {
    mapNode: {
      type: cc.Node,
      default: null,
    },
    canvasNode: {
      type: cc.Node,
      default: null,
    },
    notificationIndicatorPrefab: {
      type: cc.Prefab,
      default: null,
    },
    notificationListView: {
      type: cc.ScrollView,
      default: null,
    },
    notificationListNode: {
      type: cc.Node,
      default: null,
    },
    totalPageLabel: {
      type: cc.Label,
      default: null
    },
    jumpToPrePageButton : {
      type: cc.Button,
      default: null,
    },
    jumpToNextPageButton : {
      type: cc.Button,
      default: null,
    },
    currentPageLabel: {
      type: cc.Label,
      default: null
    },
    currentPage: 1,
    totalPage: 1,
  },

  onLoad() {
    CloseableDialog.prototype.onLoad.call(this);
    const scrollViewEventHandler = new cc.Component.EventHandler();
    scrollViewEventHandler.target = this.node; 
    scrollViewEventHandler.component = "NotificationPanel";
    scrollViewEventHandler.handler = "onScrollViewEvent";
    scrollViewEventHandler.customEventData = null;
  
    this.notificationListView.scrollEvents.push(scrollViewEventHandler);
  },

  onScrollViewEvent(evt, evtType, customData) {
    // cc.log(`NotificationPanel.onScrollViewEvent: ${evtType}`);
  },

  setNotifications(data)  {
    this.numPerPage = constants.PAGER.NUM_PER_PAGE;
    this.currentPage = data.currentPageIndex;
    this.totalPage = Math.ceil(parseInt(data.totalCount) / this.numPerPage);
    this.currentPageLabel.string = i18n.t("notificationPanel.currentPageTitle") + this.currentPage;
    this.totalPageLabel.string = i18n.t("notificationPanel.totalPageTitle") + this.totalPage;
    this.jumpToNextPageButton.interactable = (this.currentPage >= this.totalPage) ? false : true;
    this.jumpToPrePageButton.interactable = (this.currentPage <= 1) ? false : true;
    this.notificationList = data.playerNotificationList;
    this.notificationListNode.removeAllChildren();
    let indice = 0;
    let ySpacing = 20;
    let totalContentHeight = 0;
    for (let obj of this.notificationList) {
      const singleCell = cc.instantiate(this.notificationIndicatorPrefab); 
      const singleScriptIns = singleCell.getComponent("NotificationIndicator");
      singleScriptIns.mapNode = this.mapNode;
      singleScriptIns.notificationPanelNode = this.node;
      singleScriptIns.setNotification(obj);
      singleScriptIns.canvasNode = this.canvasNode;
      singleScriptIns.mapNode = this.mapNode;
      singleScriptIns.mapScriptIns = this.mapScriptIns;
      singleCell.setPosition(cc.v2(0, -indice*(singleCell.height + ySpacing))); 
      totalContentHeight += (singleCell.height + ySpacing);
      this.notificationListNode.addChild(singleCell); 
      ++indice;
    }
    const origContentSize = this.notificationListNode.getContentSize(); 
    this.notificationListNode.setContentSize(cc.size(origContentSize.width, totalContentHeight));
    this.notificationListView.scrollToTop(0);
  },

  toNextPageButtonOnClicked() {
    if(this.playMusicEffect) {
      this.playMusicEffect();
    }
    const mapScriptIns = this.mapNode.getComponent(this.mapNode.name);
    const selfPlayer = JSON.parse(cc.sys.localStorage.selfPlayer);
    const reqStr = JSON.stringify({
      msgId: Date.now(),
      act: "QueryPlayerNotificationList",
      data: {
        currentPageIndex: (this.currentPage + 1), 
        eachPageItemNum: constants.PAGER.NUM_PER_PAGE,  //每一页元素数量，后端默认为15
        type: 0, //附加筛选条件，0(默认) 按时间正序排序查询
        targetPlayerId: selfPlayer.playerId,
      }
    });
    mapScriptIns._sendQueryNotificationListRequest(reqStr);
    this.node.refreshData = true;
    this.jumpToNextPageButton.interactable =  false ;
    this.jumpToPrePageButton.interactable =  false ;
  }, 

  toPrePageButtonOnClicked() {
    if(this.playMusicEffect) {
      this.playMusicEffect();
    }
    const mapScriptIns = this.mapNode.getComponent(this.mapNode.name);
    const selfPlayer = JSON.parse(cc.sys.localStorage.selfPlayer);
    const reqStr = JSON.stringify({
      msgId: Date.now(),
      act: "QueryPlayerNotificationList",
      data: {
        currentPageIndex: (this.currentPage - 1), 
        eachPageItemNum: constants.PAGER.NUM_PER_PAGE,  //每一页元素数量，后端默认为15
        type: 0, //附加筛选条件，0(默认) 按时间正序排序查询
        targetPlayerId: selfPlayer.playerId,
      }
    });
    mapScriptIns._sendQueryNotificationListRequest(reqStr);
    this.node.refreshData = true;
    this.jumpToNextPageButton.interactable =  false ;
    this.jumpToPrePageButton.interactable =  false ;
  }, 

  update(dt) {

  },
 
});
