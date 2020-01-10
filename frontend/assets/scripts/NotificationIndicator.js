const READ_STATE = {
   NOT_READ: 0 , 
   ALREADY_READ: 1,
}
module.export = cc.Class({
  extends: cc.Component,

  properties: {
    NotificationPanel: {
      type: cc.Node,
      default: null,
    },
    mapNode: {
      type: cc.Node,
      default: null,
    },
    canvasNode: {
      type: cc.Node,
      default: null,
    },
    descriptionLabel: {
      type: cc.Label,
      default: null,
    },
    notificationDetailPrefab: {
      type: cc.Prefab,
      default: null,
    },
    detailButtonNode: {
      type: cc.Node,
      default: null,
    },
    notReadSpriteFrame: {
      type: cc.SpriteFrame,
      default: null,
    },
    alreadyReadSpriteFrame: {
      type: cc.SpriteFrame,
      default: null,
    },
    musicEffect: {
      type: cc.AudioClip,
      default: null,
    },
  },

  setNotification(notificationObj/*obj:{notification, payload}*/) {
    const self = this;
    const mapScriptIns = this.mapNode.getComponent(this.mapNode.name);
    this.descriptionLabel.string = notificationObj.payload;
    this.notificationInfo = notificationObj.playerNotification;
    let notificationDetailNode = this.notificationDetailNode;
    if (!notificationDetailNode) {
      notificationDetailNode = cc.instantiate(this.notificationDetailPrefab);
      const notificationDetailScriptIns = notificationDetailNode.getComponent("NotificationDetail");
      notificationDetailScriptIns.onCloseDelegate = () => {
        if(READ_STATE.NOT_READ == self.notificationInfo.readState ) {
          self.sendUpdateNotificationReq();
        }else {
          self.notificationPanelNode.active = true;
        }
      }
      notificationDetailScriptIns.mapScriptIns = mapScriptIns;
      notificationDetailScriptIns.mapNode = this.mapNode;
      notificationDetailNode.setPosition(cc.v2(0, 0));
      notificationDetailNode.active = false;
      safelyAddChild(mapScriptIns.widgetsAboveAllNode, notificationDetailNode);
      this.notificationDetailNode = notificationDetailNode;
      this.notificationDetailScriptIns = notificationDetailScriptIns;
    }
    this.updateDetailFrame(self.notificationInfo.readState);
    this.notificationDetailScriptIns.setData(notificationObj.payload);
  },

  sendUpdateNotificationReq() {
    const self = this;
    const notificationPanelScriptIns = this.notificationPanelNode.getComponent("NotificationPanel");
    const notificationDetailNode = this.notificationDetailNode;
    const reqStr = JSON.stringify({
      msgId: Date.now(),
      act: "MarkPlayerNotification",
      data: {
        playerNotificationBindingId: this.notificationInfo.id
      }
    });
    window.clientSession.send(reqStr);
    if (!window.handleMarkNotificationResp) {
      window.handleMarkNotificationResp = (resp) => {
        if (constants.RET_CODE.OK != resp.ret) {
          // TODO: Specify the actions to take for the player.
          cc.warn("更改状态失败")
        }
        const mapScriptIns = self.mapNode.getComponent(self.mapNode.name);
        const selfPlayer = JSON.parse(cc.sys.localStorage.selfPlayer);
        const reqStr = JSON.stringify({
          msgId: Date.now(),
          act: "QueryPlayerNotificationList",
          data: {
            currentPageIndex: notificationPanelScriptIns.currentPage, //当前页码，默认为0
            eachPageItemNum: constants.PAGER.NUM_PER_PAGE, //每一页元素数量，后端默认为15
            type: 0, //附加筛选条件，0(默认) 按时间正序排序查询
            targetPlayerId: selfPlayer.playerId,
          }
        });
        notificationDetailNode.active = false;
        mapScriptIns._sendQueryNotificationListRequest(reqStr);
        self.notificationPanelNode.refreshData = true;
        self.notificationPanelNode.active = true;
      }
    }
  }, 
  

  detailButtonOnClick(evt) {
    const self = this;
    const mapScriptIns = this.mapNode.getComponent(this.mapNode.name);
    if(this.musicEffect) {
      cc.audioEngine.playEffect(this.musicEffect, false, 1);
    }
    this.notificationDetailNode.active = true;
    if(!this.notificationDetailNode.parent) {
      safelyAddChild(mapScriptIns.widgetsAboveAllNode, this.notificationDetailNode);
    }
    this.notificationPanelNode.active = false; 
  },

  deleteButtonOnClick(evt) {
    const self = this;
    const notificationPanelScriptIns = this.notificationPanelNode.getComponent("NotificationPanel");
    if(this.musicEffect) {
      cc.audioEngine.playEffect(this.musicEffect, false, 1);
    }
    const reqStr = JSON.stringify({
      msgId: Date.now(),
      act: "DeletePlayerNotification",
      data: {
        playerNotificationBindingId: this.notificationInfo.id
      }
    });
    window.clientSession.send(reqStr);
    if (!window.handleDeleteNotificationResp) {
      window.handleDeleteNotificationResp = (resp) => {
        if (constants.RET_CODE.OK != resp.ret) {
          // TODO: Specify the actions to take for the player.
          cc.warn("删除失败")
          return;
        }
        const mapScriptIns = self.mapNode.getComponent(self.mapNode.name);
        const selfPlayer = JSON.parse(cc.sys.localStorage.selfPlayer);
        const reqStr = JSON.stringify({
          msgId: Date.now(),
          act: "QueryPlayerNotificationList",
          data: {
            currentPageIndex: notificationPanelScriptIns.currentPage, //当前页码，默认为0
            eachPageItemNum: constants.PAGER.NUM_PER_PAGE, //每一页元素数量，后端默认为15
            type: 0, //附加筛选条件，0(默认) 按时间正序排序查询
            targetPlayerId: selfPlayer.playerId,
          }
        });
        mapScriptIns._sendQueryNotificationListRequest(reqStr);
        self.notificationPanelNode.refreshData = true;
      }
    }
  },
  
  updateDetailFrame(readState) {
    switch(readState) {
      case READ_STATE.NOT_READ: 
      this.detailButtonNode.getComponent(cc.Sprite).spriteFrame = this.notReadSpriteFrame;
       break;
      case READ_STATE.ALREADY_READ: 
      this.detailButtonNode.getComponent(cc.Sprite).spriteFrame = this.alreadyReadSpriteFrame;
       break;
      default:
      this.detailButtonNode.getComponent(cc.Sprite).spriteFrame = this.notReadSpriteFrame;
    }
  },
});
