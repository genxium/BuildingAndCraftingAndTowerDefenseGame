
window.sendSafely = function(msgStr) {
  /**
  * - "If the data can't be sent (for example, because it needs to be buffered but the buffer is full), the socket is closed automatically."
  *
  * from https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send.
  */
  if (null == window.clientSession || window.clientSession.readyState != WebSocket.OPEN) return false;
  window.clientSession.send(msgStr);
}

window.closeWSConnection = function() {
  if (null == window.clientSession || window.clientSession.readyState != WebSocket.OPEN) return;
  cc.log(`Closing "window.clientSession" from the client-side.`);
  window.clientSession.close();
}

window.handleHbRequirements = function(resp) {
  if (constants.RET_CODE.OK != resp.ret) return;
  window.clientSessionPingInterval = setInterval(() => {
    if (clientSession.readyState != WebSocket.OPEN) {

      return;
    }
    const param = {
      msgId: Date.now(),
      act: "HeartbeatPing",
      data: {
        clientTimestamp: Date.now()
      }
    };
    clientSession.send(JSON.stringify(param));
  }, resp.data.intervalToPing);
};

window.handleHbPong = function(resp) {
  if (constants.RET_CODE.OK != resp.ret) return;
// TBD.
};

window.initPersistentSessionClient = function(onopenCb) {
  window.shouldTipOfWsDisconnected = true;
  window.logoutFlag = false;
  if (window.clientSession && window.clientSession.readyState == WebSocket.OPEN) {
    cc.log(`initPersistentSessionClient, window.clientSession is already OPEN.`);
    if (null == onopenCb) {
      return;
    }
    onopenCb();
    return;
  }

  const clientSessionInitWaiterTimeoutMillis = 2000;
  window.clientSessionInitWaiter = setTimeout(function() {
    const parentNode = (window.mapIns ? window.mapIns.widgetsAboveAllNode : null);
    const simplePressToGoDialogPrefab = (window.mapIns ? window.mapIns.simplePressToGoDialogPrefab : null);
    window.handleNetworkDisconnected(parentNode, simplePressToGoDialogPrefab);
  }, clientSessionInitWaiterTimeoutMillis);
  const intAuthToken = cc.sys.localStorage.selfPlayer ? JSON.parse(cc.sys.localStorage.selfPlayer).intAuthToken : "";
  /**
  * WARNING: We're NOT YET sure about the root cause of the issue that "`wss on iOS with JSB2.0` always fails to establish a connection",
  * therefore the following snippet is a dirty fix.
  *
  * Some possible causes are listed.
  * - By using `wss on iOS with JSB2.0`, It fails to download the server cert at the first place.
  * - By using `wss on iOS with JSB2.0`, It fails to verify the downloaded server cert.
  */

  const isOnNativeAppButNotLAN = (cc.sys.isNative && (-1 == backendAddress.HOST.indexOf("localhost")) && (false == backendAddress.HOST.startsWith("192.168.")));
  const wsProto = (
  isOnNativeAppButNotLAN
    ?
    'ws'
    :
    backendAddress.PROTOCOL.replace('http', 'ws')
  );
  const columnPortStr = (
  isOnNativeAppButNotLAN
    ?
    ''
    :
    (null == backendAddress.PORT || "" == backendAddress.PORT ? "" : (":" + backendAddress.PORT))
  );
  const urlToConnect = wsProto + '://' + backendAddress.HOST + columnPortStr + backendAddress.WS_PATH_PREFIX + "?intAuthToken=" + intAuthToken;
  const clientSession = new WebSocket(urlToConnect);

  cc.log(`initPersistentSessionClient, window.clientSession is about to connect to urlToConnect == ${urlToConnect}.`);
  clientSession.onopen = function(event) {
    console.log("The WS clientSession is opened.");
    if (clientSessionInitWaiter) {
      clearTimeout(clientSessionInitWaiter);
    }
    window.clientSession = clientSession;
    if (null == onopenCb)
      return;
    onopenCb();
  };

  clientSession.onmessage = function(event) {
    const resp = JSON.parse(event.data)
    switch (resp.act) {
      case "HeartbeatRequirements":
        window.handleHbRequirements(resp);
        break;
      case "HeartbeatPong":
        window.handleHbPong(resp);
        break;
      default:
        break;
    }
  };

  clientSession.onerror = function(event) {
    cc.error(`Error caught on the WS clientSession: ${event}`);
    if (window.handleNetworkDisconnected) {
      const parentNode = (window.mapIns ? window.mapIns.canvasNode : null);
      const simplePressToGoDialogPrefab = (window.mapIns ? window.mapIns.simplePressToGoDialogPrefab : null);
      window.handleNetworkDisconnected(parentNode, simplePressToGoDialogPrefab);
    }
  };

  clientSession.onclose = function(event) {
    cc.error(`The WS clientSession is closed: ${event}`);
    if (window.handleNetworkDisconnected) {
      const parentNode = (window.mapIns ? window.mapIns.canvasNode : null);
      const simplePressToGoDialogPrefab = (window.mapIns ? window.mapIns.simplePressToGoDialogPrefab : null);
      window.handleNetworkDisconnected(parentNode, simplePressToGoDialogPrefab);
    }
  };
};
