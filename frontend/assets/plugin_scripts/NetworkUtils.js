'use strict';

var NetworkUtils = NetworkUtils || {};
window.NetworkUtils = NetworkUtils;
NetworkUtils.ArrayProto = Array.prototype;
Array.prototype.forEach = function (fn, scope) {
  'use strict';
  var i, len;
  for (i = 0, len = this.length; i < len; ++i) {
    if (i in this) {
      fn.call(scope, this[i], i, this);
    }
  }
};

NetworkUtils.ObjProto = Object.prototype;
NetworkUtils.hasOwn = NetworkUtils.ObjProto.hasOwnProperty;
NetworkUtils.toString = NetworkUtils.ObjProto.toString;
NetworkUtils.nativeForEach = NetworkUtils.ArrayProto.forEach;
NetworkUtils.slice = NetworkUtils.ArrayProto.slice;
NetworkUtils.nativeKeys = Object.keys;
NetworkUtils.nativeIsArray = Array.isArray;

NetworkUtils.isFunction = function(o) {
  return typeof o == "function" || false;
};

NetworkUtils.isObject = function(o) {
  var type = typeof o === 'undefined' ? 'undefined' : typeof(o);
  return type === 'function' || type === 'object' && !!o;
};

NetworkUtils.isArray = NetworkUtils.nativeIsArray || function(obj) {
  return NetworkUtils.toString.call(obj) === '[object Array]';
};

NetworkUtils.isString = function(o) {
  return typeof o === 'string';
};

NetworkUtils.isNotEmptyString = function(s) {
  return NetworkUtils.isString(s) && s !== '';
};

NetworkUtils.each = function(o, fn, ctx) {
  if (o == null) return;

  if (NetworkUtils.nativeForEach && o.forEach === NetworkUtils.nativeForEach) {
    o.forEach(fn, ctx);
  } else if (o.length === +o.length) {
    for (var i = 0, l = o.length; i < l; i++) {
      if (i in o && fn.call(ctx, o[i], i, o) === {}) return;
    }
  } else {
    for (var key in o) {
      if (NetworkUtils.hasOwn.call(o, key)) {
        if (fn.call(ctx, o[key], key, o) === {}) return;
      }
    }
  }
};

NetworkUtils.numFormat = function(num) {
  if (num > 9999) {
    return Math.floor(num / 1000).toString() + 'K';
  } else {
    return num.toString();
  }
}; //1000=>1,000


NetworkUtils.numberFmt = function(num) {
  if (!/^(\+|-)?(\d+)(\.\d+)?$/.test(num)) {
    return num;
  }

  var a = RegExp.$1,
    b = RegExp.$2,
    c = RegExp.$3,
    re = new RegExp();
  re.compile("(\\d)(\\d{3})(,|$)");

  while (re.test(b)) {
    b = b.replace(re, "$1,$2$3");
  }

  return a + "" + b + "" + c;
}; //1,000=>1000


NetworkUtils.fmtNumber = function(str) {
  if (!NetworkUtils.isNotEmptyString(str)) return 0;
  return parseInt(str.replace(/,/g, ''), 10);
};

NetworkUtils.defaults = function(obj) {
  NetworkUtils.each(NetworkUtils.slice.call(arguments, 1), function(o) {
    for (var k in o) {
      if (obj[k] == null)
        obj[k] = o[k];
    }
  });
  return obj;
};

NetworkUtils.keys = function(obj) {
  if (!NetworkUtils.isObject(obj)) return [];
  if (NetworkUtils.nativeKeys) return NetworkUtils.nativeKeys(obj);
  var keys = [];

  for (var key in obj) {
    if (NetworkUtils.hasOwn.call(obj, key)) keys.push(key);
  }

  return keys;
};

NetworkUtils.values = function(obj) {
  var keys = NetworkUtils.keys(obj);
  var length = keys.length;
  var values = Array(length);

  for (var i = 0; i < length; i++) {
    values[i] = obj[keys[i]];
  }

  return values;
};

NetworkUtils.noop = function() {};

NetworkUtils.cutstr = function(str, len) {
  var temp,
    icount = 0,
    patrn = /[^\x00-\xff]/,
    strre = "";

  for (var i = 0; i < str.length; i++) {
    if (icount < len - 1) {
      temp = str.substr(i, 1);

      if (patrn.exec(temp) == null) {
        icount = icount + 1;
      } else {
        icount = icount + 2;
      }

      strre += temp;
    } else {
      break;
    }
  }

  if (str == strre) {
    return strre;
  } else {
    return strre + "...";
  }
};

NetworkUtils.clamp = function(n, min, max) {
  if (n < min) return min;
  if (n > max) return max;
  return n;
};

NetworkUtils.Progress = {};
NetworkUtils.Progress.settings = {
  minimum: 0.1,
  trickle: true,
  trickleRate: 0.3,
  trickleSpeed: 100
};
NetworkUtils.Progress.status = null;

NetworkUtils.Progress.set = function(n) {
  var progress = NetworkUtils.Progress;
  n = NetworkUtils.clamp(n, progress.settings.minimum, 1);
  progress.status = n;
  progress.cb(progress.status);
  return this;
};

NetworkUtils.Progress.inc = function(amount) {
  var progress = NetworkUtils.Progress,
    n = progress.status;

  if (!n) {
    return progress.start();
  } else {
    amount = (1 - n) * NetworkUtils.clamp(Math.random() * n, 0.1, 0.95);
    n = NetworkUtils.clamp(n + amount, 0, 0.994);
    return progress.set(n);
  }
};

NetworkUtils.Progress.trickle = function() {
  var progress = NetworkUtils.Progress;
  return progress.inc(Math.random() * progress.settings.trickleRate);
};

NetworkUtils.Progress.start = function(cb) {
  var progress = NetworkUtils.Progress;
  progress.cb = cb || NetworkUtils.noop;
  if (!progress.status) progress.set(0);

  var _timer = function timer() {
    if (progress.status === 1) {
      clearTimeout(_timer);
      _timer = null;
      return;
    }

    progress.trickle();
    work();
  };

  var work = function work() {
    setTimeout(_timer, progress.settings.trickleSpeed);
  };

  if (progress.settings.trickle) work();
  return this;
};

NetworkUtils.Progress.done = function() {
  var progress = NetworkUtils.Progress;
  return progress.inc(0.3 + 0.5 * Math.random()).set(1);
};

NetworkUtils.decode = decodeURIComponent;
NetworkUtils.encode = encodeURIComponent;

NetworkUtils.formData = function(o) {
  var kvps = [],
    regEx = /%20/g;

  for (var k in o) {
    if (null == o[k]) continue;
    kvps.push(NetworkUtils.encode(k).replace(regEx, "+") + "=" + NetworkUtils.encode(o[k].toString()).replace(regEx, "+"));
  }

  return kvps.join('&');
};

NetworkUtils.ajax = function(o) {
  var xhr = cc.loader.getXMLHttpRequest();
  window.shouldTipOfWsDisconnected = true;
  o = Object.assign({
    type: "GET",
    data: null,
    dataType: 'json',
    progress: null,
    contentType: "application/x-www-form-urlencoded"
  }, o);

  if (o.progress) {
    NetworkUtils.Progress.start(o.progress);
  }

  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      if (xhr.status < 300) {
        var res;

        if (o.dataType == 'json') {
          if (xhr.responseText) {
            res = window.JSON ? window.JSON.parse(xhr.responseText) : eval(xhr.responseText);
          }
        } else {
          res = xhr.responseText;
        }

        if (!!res) o.success(res);
        if (o.progress) NetworkUtils.Progress.done();
        if (0 == xhr.status) { //服务器无响应
          if (o.error) {
            o.error(xhr, xhr.status, xhr.statusText);
          }
          if (window.handleNetworkDisconnected) {
            const parentNode = (window.mapIns ? window.mapIns.widgetsAboveAllNode : null);
            const simplePressToGoDialogPrefab = (window.mapIns ? window.mapIns.simplePressToGoDialogPrefab : null);
            window.handleNetworkDisconnected(parentNode, simplePressToGoDialogPrefab);
          }
        }
      } else {
        if (o.error) {
          o.error(xhr, xhr.status, xhr.statusText);
        }
        if (window.handleNetworkDisconnected) {
          const parentNode = (window.mapIns ? window.mapIns.widgetsAboveAllNode : null);
          const simplePressToGoDialogPrefab = (window.mapIns ? window.mapIns.simplePressToGoDialogPrefab : null);
          window.handleNetworkDisconnected(parentNode, simplePressToGoDialogPrefab);
        }
      }
    }
  }; 

  var url = o.url,
    data = null;
  var isPost = o.type === "POST" || o.type === "PUT";

  if (o.data) {
    if (!isPost) {
      url += "?" + NetworkUtils.formData(o.data);
      data = null;
    } else if (isPost && typeof(o.data) === 'object') {
      // o.data.token = cc.sys.localStorage.getItem('token');
      //data = JSON.stringify(o.data);
      data = NetworkUtils.formData(o.data);
    } else {
      data = o.data;
    }
  }


  xhr.open(o.type, url, true);

  if (isPost) {
    xhr.setRequestHeader("Content-Type", o.contentType);
  }
  xhr.ontimeout = function() {
    cc.log("Ajax request timed out.")
    // XMLHttpRequest 超时
    if ('function' === typeof o.timeout) {
      o.timeout();
    }
    if (window.handleNetworkDisconnected) {
      const parentNode = (window.mapIns ? window.mapIns.widgetsAboveAllNode : null);
      const simplePressToGoDialogPrefab = (window.mapIns ? window.mapIns.simplePressToGoDialogPrefab : null);
      window.handleNetworkDisconnected(parentNode, simplePressToGoDialogPrefab);
    }
  };
  xhr.onerror = function() {
    cc.log("Ajax request got an error.")
    // XMLHttpRequest 错误。 native app in iOS，请求失败时不会调用timeout且readyState 只有= 1的情况，但是会调用onerror 
    if (o.error) {
      o.error(xhr, xhr.status, xhr.statusText);
    }
    if (window.handleNetworkDisconnected) {
      const parentNode = (window.mapIns ? window.mapIns.widgetsAboveAllNode : null);
      const simplePressToGoDialogPrefab = (window.mapIns ? window.mapIns.simplePressToGoDialogPrefab : null);
      window.handleNetworkDisconnected(parentNode, simplePressToGoDialogPrefab);
    }
  };
  xhr.timeout = 9000;

  xhr.send(data);
  return xhr;
};

NetworkUtils.get = function(url, data, success, error) {
  if (NetworkUtils.isFunction(data)) {
    error = success;
    success = data;
    data = {};
  }

  NetworkUtils.ajax({
    url: url,
    type: "GET",
    data: data,
    success: success,
    error: error || NetworkUtils.noop
  });
};

NetworkUtils.post = function(url, data, success, error, timeout) {
  if (NetworkUtils.isFunction(data)) {
    error = success;
    success = data;
    data = {};
  }

  NetworkUtils.ajax({
    url: url,
    type: "POST",
    data: data,
    success: success,
    error: error || NetworkUtils.noop,
    timeout: timeout
  });
};

NetworkUtils.now = Date.now || function() {
  return new Date().getTime();
};

NetworkUtils.same = function(s) {
  return s;
};

NetworkUtils.parseCookieString = function(text) {
  var cookies = {};

  if (NetworkUtils.isString(text) && text.length > 0) {
    var cookieParts = text.split(/;\s/g);
    var cookieName;
    var cookieValue;
    var cookieNameValue;

    for (var i = 0, len = cookieParts.length; i < len; i++) {
      // Check for normally-formatted cookie (name-value)
      cookieNameValue = cookieParts[i].match(/([^=]+)=/i);

      if (cookieNameValue instanceof Array) {
        try {
          cookieName = NetworkUtils.decode(cookieNameValue[1]);
          cookieValue = cookieParts[i].substring(cookieNameValue[1].length + 1);
        } catch (ex) { // Intentionally ignore the cookie -
          // the encoding is wrong
        }
      } else {
        // Means the cookie does not have an =", so treat it as
        // a boolean flag
        cookieName = NetworkUtils.decode(cookieParts[i]);
        cookieValue = '';
      }

      if (cookieName) {
        cookies[cookieName] = cookieValue;
      }
    }
  }

  return cookies;
};

NetworkUtils.getCookie = function(name) {
  if (!NetworkUtils.isNotEmptyString(name)) {
    throw new TypeError('Cookie name must be a non-empty string');
  }

  var cookies = NetworkUtils.parseCookieString(document.cookie);
  return cookies[name];
};

NetworkUtils.setCookie = function(name, value, options) {
  if (!NetworkUtils.isNotEmptyString(name)) {
    throw new TypeError('Cookie name must be a non-empty string');
  }

  options = options || {};
  var expires = options['expires'];
  var domain = options['domain'];
  var path = options['path'];

  if (!options['raw']) {
    value = NetworkUtils.encode(String(value));
  }

  var text = name + '=' + value; // expires

  var date = expires;

  if (typeof date === 'number') {
    date = new Date();
    date.setDate(date.getDate() + expires);
  }

  if (date instanceof Date) {
    text += '; expires=' + date.toUTCString();
  } // domain


  if (NetworkUtils.isNotEmptyString(domain)) {
    text += '; domain=' + domain;
  } // path


  if (NetworkUtils.isNotEmptyString(path)) {
    text += '; path=' + path;
  } // secure


  if (options['secure']) {
    text += '; secure';
  }

  document.cookie = text;
  return text;
};

NetworkUtils.removeCookie = function(name, options) {
  options = options || {};
  options['expires'] = new Date(0);
  return NetworkUtils.setCookie(name, '', options);
};

NetworkUtils.dragNode = function(node) {
  var isMoving = false,
    size = cc.director.getVisibleSize(),
    touchLoc = void 0,
    oldPos = void 0,
    moveToPos = void 0;
  node.on(cc.Node.EventType.TOUCH_START, function(event) {
    var touches = event.getTouches();
    touchLoc = touches[0].getLocation();
    oldPos = node.position;
  });
  node.on(cc.Node.EventType.TOUCH_MOVE, function(event) {
    var touches = event.getTouches();
    moveToPos = touches[0].getLocation();
    isMoving = true;
  });
  node.on(cc.Node.EventType.TOUCH_END, function(event) {
    isMoving = false;
  });
  return function() {
    if (!isMoving) return;
    var x = oldPos.x + moveToPos.x - touchLoc.x;
    var xEdge = node.width * node.anchorX / 2;

    if (Math.abs(x) < xEdge) {
      node.x = x;
    } else {
      node.x = x > 0 ? xEdge : -xEdge;
      isMoving = false;
    }

    if (node.height > size.height) {
      var y = oldPos.y + moveToPos.y - touchLoc.y;
      var yEdge = (node.height - size.height) / 2;

      if (Math.abs(y) < yEdge) {
        node.y = y;
      } else {
        node.y = y > 0 ? yEdge : -yEdge;
        isMoving = false;
      }
    }
  };
};

NetworkUtils.getQueryVariable = function(key) {
  var query = window.location.search.substring(1),
    vars = query.split('&');

  for (var i = 0, l = vars.length; i < l; i++) {
    var pair = vars[i].split('=');

    if (decodeURIComponent(pair[0]) === key) {
      return decodeURIComponent(pair[1]);
    }
  }
};

window.calculateEffectiveStageObj = function(specificStageObj, commonStageObj) {
  const commonStageBuildableBindingList = commonStageObj.stageBuildableLevelBindingList;

  specificStageObj.stageBuildableLevelBindingList = commonStageBuildableBindingList; 
  
  if (null != specificStageObj.overideStageBuildableLevelBindingList) {
    delete specificStageObj.overideStageBuildableLevelBindingList;
  
    for (let k in specificStageObj.overideStageBuildableLevelBindingList) {
      const singleOverridingStageBuildableLevelBinding = specificStageObj.overideStageBuildableLevelBindingList[k]; 
      for (let kk in specificStageObj.stageBuildableLevelBindingList) {
        if (
            singleOverridingStageBuildableLevelBinding.buildableId != specificStageObj.stageBuildableLevelBindingList[kk].buildableId 
            || 
            singleOverridingStageBuildableLevelBinding.level != specificStageObj.stageBuildableLevelBindingList[kk].level 
          ) {
          continue;
        }
        Object.assign(specificStageObj.stageBuildableLevelBindingList[kk], singleOverridingStageBuildableLevelBinding);
        break;
      } 
    }
  }

  if (null != specificStageObj.excludeStageBuildableLevelBindingList) {
    delete specificStageObj.excludeStageBuildableLevelBindingList;
    let clonedStageBuildableLevelBindingList = specificStageObj.stageBuildableLevelBindingList.slice();
    for (let k in specificStageObj.excludeStageBuildableLevelBindingList) {
      const singleToExcludeStageBuildableLevelBinding = specificStageObj.excludeStageBuildableLevelBindingList[k]; 
      for (let kk in clonedStageBuildableLevelBindingList) {
        if (
            singleToExcludeStageBuildableLevelBinding.buildableId != clonedStageBuildableLevelBindingList[kk].buildableId 
            || 
            singleToExcludeStageBuildableLevelBinding.level != clonedStageBuildableLevelBindingList[kk].level 
        ) {
          continue;
        }
        specificStageObj.stageBuildableLevelBindingList.splice(specificStageObj.stageBuildableLevelBindingList.indexOf(clonedStageBuildableLevelBindingList[kk]), 1);
      } 
    }
  }

  return specificStageObj;
};
